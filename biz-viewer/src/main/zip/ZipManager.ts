import path from 'path';
import yauzl from 'yauzl';
import iconv from 'iconv-lite';

export type ZipEntryInfo = {
  path: string;
  isFile: boolean;
  size?: number;
  mtime?: Date;
  comment?: string;
  customMetadata?: Record<string, string>;
};

export type FileNode = {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: number;
  mtime?: string | number | Date;
  path?: string;
  children?: FileNode[];
  customMetadata?: Record<string, string>;
};

export type ArchiveSummary = { files: number; bytes: number };

export class ZipManager {
  private zipFile: yauzl.ZipFile | null = null;
  private filePath: string | null = null;

  async open(filePath: string): Promise<{ root: FileNode[]; summary: ArchiveSummary; title: string }> {
    await this.close();
    this.filePath = filePath;

    const zipFile = await new Promise<yauzl.ZipFile>((resolve, reject) => {
      yauzl.open(
        filePath,
        // decodeStrings false → get raw buffers; we will decode with UTF-8 fallback to CP437
        { lazyEntries: true, decodeStrings: false },
        (err, zip) => (err || !zip ? reject(err) : resolve(zip as yauzl.ZipFile))
      );
    });
    this.zipFile = zipFile;

    const entries: ZipEntryInfo[] = [];
    const summary: ArchiveSummary = { files: 0, bytes: 0 };

    await new Promise<void>((resolve, reject) => {
      zipFile.readEntry();
      zipFile.on('entry', (entry: yauzl.Entry) => {
        try {
          const fileNameBuf: Buffer = (entry as any).fileName as Buffer;
          const fileCommentBuf: Buffer | undefined = (entry as any).fileComment as Buffer | undefined;
          // UTF-8 flag indicates UTF-8 encoded strings, else default CP437 per spec
          const utf8 = ((entry as any).generalPurposeBitFlag & (1 << 11)) !== 0;
          const name = this.decodeBuffer(fileNameBuf, utf8);
          const commentRaw: string = fileCommentBuf ? this.decodeBuffer(fileCommentBuf, utf8).trim() : '';

          const isDir = /\/$/.test(name);
          const normalized = this.normalizePath(name);
          const info: ZipEntryInfo = {
            path: normalized,
            isFile: !isDir,
            size: !isDir ? entry.uncompressedSize : undefined,
            mtime: entry.getLastModDate?.() || undefined,
            comment: commentRaw,
          };

          if (!isDir && typeof info.size === 'number') {
            summary.files += 1;
            summary.bytes += info.size;
          }

          // Parse depth-1 JSON metadata from comment
          if (commentRaw) {
            try {
              const sanitized = this.sanitizeJson(commentRaw);
              const parsed = sanitized ? JSON.parse(sanitized) : null;
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                const meta: Record<string, string> = {};
                for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
                  if (typeof v === 'string' || typeof v === 'number') {
                    meta[k] = String(v);
                  }
                }
                if (Object.keys(meta).length > 0) info.customMetadata = meta;
              }
            } catch {
              // ignore invalid JSON
            }
          }

          entries.push(info);
        } catch (e) {
          // Skip problematic entries
        } finally {
          zipFile.readEntry();
        }
      });

      zipFile.on('end', () => resolve());
      zipFile.on('error', (err) => reject(err));
    });

    const tree = this.buildTree(entries);
    const title = path.basename(filePath);
    return { root: tree, summary, title };
  }

  async openBuffer(buf: Buffer, nameHint?: string): Promise<{ root: FileNode[]; summary: ArchiveSummary; title: string }> {
    await this.close();
    const zipFile = await new Promise<yauzl.ZipFile>((resolve, reject) => {
      yauzl.fromBuffer(
        buf,
        { lazyEntries: true, decodeStrings: false },
        (err, zip) => (err || !zip ? reject(err) : resolve(zip as yauzl.ZipFile))
      );
    });
    this.zipFile = zipFile;

    const entries: ZipEntryInfo[] = [];
    const summary: ArchiveSummary = { files: 0, bytes: 0 };

    await new Promise<void>((resolve, reject) => {
      zipFile.readEntry();
      zipFile.on('entry', (entry: yauzl.Entry) => {
        try {
          const fileNameBuf: Buffer = (entry as any).fileName as Buffer;
          const fileCommentBuf: Buffer | undefined = (entry as any).fileComment as Buffer | undefined;
          const utf8 = ((entry as any).generalPurposeBitFlag & (1 << 11)) !== 0;
          const name = this.decodeBuffer(fileNameBuf, utf8);
          const commentRaw: string = fileCommentBuf ? this.decodeBuffer(fileCommentBuf, utf8).trim() : '';

          const isDir = /\/$/.test(name);
          const normalized = this.normalizePath(name);
          const info: ZipEntryInfo = {
            path: normalized,
            isFile: !isDir,
            size: !isDir ? entry.uncompressedSize : undefined,
            mtime: entry.getLastModDate?.() || undefined,
            comment: commentRaw,
          };

          if (!isDir && typeof info.size === 'number') {
            summary.files += 1;
            summary.bytes += info.size;
          }

          if (commentRaw) {
            try {
              const sanitized = this.sanitizeJson(commentRaw);
              const parsed = sanitized ? JSON.parse(sanitized) : null;
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                const meta: Record<string, string> = {};
                for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
                  if (typeof v === 'string' || typeof v === 'number') meta[k] = String(v);
                }
                if (Object.keys(meta).length > 0) info.customMetadata = meta;
              }
            } catch {}
          }

          entries.push(info);
        } catch {
        } finally {
          zipFile.readEntry();
        }
      });
      zipFile.on('end', () => resolve());
      zipFile.on('error', (err) => reject(err));
    });

    const tree = this.buildTree(entries);
    const title = nameHint || 'Archive';
    return { root: tree, summary, title };
  }

  async close(): Promise<void> {
    if (this.zipFile) {
      try { this.zipFile.close(); } catch {}
      this.zipFile = null;
      this.filePath = null;
    }
  }

  private normalizePath(p: string): string {
    const s = p.replace(/\\/g, '/');
    return s.startsWith('/') ? s.slice(1) : s;
  }

  private decodeBuffer(buf: Buffer, utf8Flag: boolean): string {
    if (utf8Flag) return buf.toString('utf8');
    const utf8 = buf.toString('utf8');
    // If replacement char appears, fallback to CP437
    if (utf8.includes('\uFFFD')) {
      return iconv.decode(buf, 'cp437');
    }
    return utf8;
  }

  private sanitizeJson(s: string): string | null {
    // Remove BOM and trim
    let t = s.replace(/^\uFEFF/, '').trim();
    // If string does not start with '{' or end with '}', try to extract the first {...} block
    if (!(t.startsWith('{') && t.endsWith('}'))) {
      const start = t.indexOf('{');
      const end = t.lastIndexOf('}');
      if (start >= 0 && end > start) t = t.slice(start, end + 1);
    }
    if (t.startsWith('{') && t.endsWith('}')) return t;
    return null;
  }


  private buildTree(entries: ZipEntryInfo[]): FileNode[] {
    // Ensure folders exist for all files
    const folders = new Set<string>();
    for (const e of entries) {
      const parts = e.path.split('/');
      parts.pop();
      let acc = '';
      for (const part of parts) {
        acc = acc ? `${acc}/${part}` : part;
        folders.add(acc);
      }
    }

    const allPaths = new Map<string, FileNode>();

    // Seed folders
    for (const folder of folders) {
      const name = folder.split('/').pop() || folder;
      allPaths.set(folder, {
        id: `dir:${folder}`,
        name,
        type: 'folder',
        path: folder,
        children: [],
      });
    }

    // Add files
    for (const e of entries) {
      if (!e.isFile) continue;
      const name = e.path.split('/').pop() || e.path;
      allPaths.set(e.path, {
        id: `file:${e.path}`,
        name,
        type: 'file',
        path: e.path,
        size: e.size,
        mtime: e.mtime,
        customMetadata: e.customMetadata,
      });
    }

    // Link children
    const roots: FileNode[] = [];
    for (const [p, node] of allPaths) {
      const parentPath = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '';
      if (parentPath && allPaths.has(parentPath)) {
        const parent = allPaths.get(parentPath)!;
        (parent.children ||= []).push(node);
      } else {
        roots.push(node);
      }
    }

    // Sort folders first, then files, alphabetically
    const sortNodes = (nodes: FileNode[]) => {
      nodes.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1));
      for (const n of nodes) if (n.children && n.children.length) sortNodes(n.children);
    };
    sortNodes(roots);

    return roots;
  }
}


