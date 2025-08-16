import React, { useEffect, useMemo, useState } from 'react';
import styles from '../styles/App.module.scss';
import { Sidebar } from './Sidebar/Sidebar';
import { MetadataPanel } from './Metadata/MetadataPanel';
import { Titlebar } from './Titlebar';

export type FileNode = {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: number;
  children?: FileNode[];
  customMetadata?: Record<string, string>;
  path?: string;
  mtime?: string | number | Date;
};

export const App: React.FC = () => {
  const [selected, setSelected] = useState<FileNode | null>(null);
  // Keep a ratio so resizing the window preserves proportions
  const [sidebarRatio, setSidebarRatio] = useState<number>(0.55);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Placeholder sample tree; later wire to zip parser
  const treeData = useMemo<FileNode[]>(
    () => [
      {
        id: 'root',
        name: 'archive.biz',
        type: 'folder',
        children: [
          {
            id: 'docs',
            name: 'docs',
            type: 'folder',
            children: [
              { id: 'docs-1', name: 'readmeaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.txt', type: 'file', size: 1024, path: 'docs/readme.txt', mtime: '2024-08-05T10:30:00Z', customMetadata: { encoding: 'utf-8' } },
              { id: 'docs-2', name: 'guide.md', type: 'file', size: 409600, path: 'docs/guide.md', customMetadata: { section: 'user' } },
              { id: 'docs-3', name: 'changelog.md', type: 'file', size: 2048, path: 'docs/changelog.md', customMetadata: { version: '1.2.0' } },
            ],
          },
          {
            id: 'src',
            name: 'src',
            type: 'folder',
            children: [
              { id: 'src-1', name: 'index.ts', type: 'file', size: 3120, path: 'src/index.ts', mtime: '2024-08-10T09:12:00Z', customMetadata: { language: 'ts' } },
              {
                id: 'src-utils',
                name: 'utils',
                type: 'folder',
                children: [
                  { id: 'src-utils-1', name: 'zip.ts', type: 'file', size: 5120, path: 'src/utils/zip.ts', mtime: '2024-08-11T08:45:00Z', customMetadata: { coverage: '85%' } },
                  { id: 'src-utils-2', name: 'parse.ts', type: 'file', size: 4680, path: 'src/utils/parse.ts', mtime: '2024-08-11T08:50:00Z' },
                ],
              },
            ],
          },
          {
            id: 'assets',
            name: 'assets',
            type: 'folder',
            children: [
              { id: 'assets-1', name: 'logo.svg', type: 'file', size: 1200, path: 'assets/logo.svg', mtime: '2024-08-06T12:00:00Z', customMetadata: { mime: 'image/svg+xml' } },
              { id: 'assets-2', name: 'background.jpg', type: 'file', size: 342156, path: 'assets/background.jpg', mtime: '2024-08-06T12:05:00Z', customMetadata: { width: '1920', height: '1080' } },
            ],
          },
          {
            id: 'data',
            name: 'data',
            type: 'folder',
            children: [
              { id: 'data-1', name: 'report.csv', type: 'file', size: 98231, path: 'data/report.csv', mtime: '2024-08-12T14:30:00Z', customMetadata: { rows: '134', columns: '12' } },
              { id: 'data-2', name: 'config.json', type: 'file', size: 642, path: 'data/config.json', mtime: '2024-08-12T14:31:00Z', customMetadata: { env: 'prod' } },
            ],
          },
          { id: 'root-1', name: 'index.json', type: 'file', size: 777, path: 'index.json', mtime: '2024-08-01T08:00:00Z', customMetadata: { contentType: 'application/json' } },
          { id: 'root-2', name: 'notesذچججد؛«»‌ع.txt', type: 'file', size: 233, path: 'notes.txt', mtime: '2024-08-02T11:22:00Z' },
          { id: 'root-3', name: 'image', type: 'file', size: 53211, path: 'image', mtime: '2024-08-03T16:45:00Z', customMetadata: {
            author: '0198b30f-4bca-7114-9f56-d5adb4b4315c',
            tag: 'cover',
            camera: 'Canon EOS R5',
            lens: 'RF 24-70mm F2.8',
            iso: '200',
            aperture: 'f/2.8',
            shutter: '1/200s',
            focalLength: '50mm',
            dateTaken: '2024-08-05T10:30:00Z',
            location: 'Seattle, WA',
            license: 'CC-BY-4.0',
            format: 'PNG',
            colorProfile: 'sRGB IEC61966-2.1',
            dpi: '300',
            software: 'Adobe Photoshop 25.5',
            orientation: 'landscape',
            keywords: 'cover,hero,banner',
            description: 'Homepage hero cover image',
            rating: '5'
          } },
        ],
      },
    ],
    []
  );

  const archiveTitle: string | undefined = treeData?.[0]?.name;
  const archiveSubtitle: string | undefined = useMemo(() => {
    const root = treeData?.[0];
    if (!root) return undefined;
    const sum = (nodes: FileNode[]): { bytes: number; files: number } => {
      let bytes = 0;
      let files = 0;
      for (const n of nodes) {
        if (n.type === 'file') {
          files += 1;
          bytes += n.size ?? 0;
        } else if (n.children) {
          const r = sum(n.children);
          files += r.files;
          bytes += r.bytes;
        }
      }
      return { bytes, files };
    };
    const { bytes, files } = sum(root.children ?? []);
    const format = (size: number): string => {
      const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
      let value = size;
      let i = 0;
      while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i += 1;
      }
      const v = i === 0 ? String(Math.round(value)) : value.toFixed(1);
      return `${v} ${units[i]}`;
    };
    return `${format(bytes)} • ${files} files`;
  }, [treeData]);
  const displayData = useMemo<FileNode[]>(() => {
    const root = treeData?.[0];
    if (root && root.type === 'folder' && Array.isArray(root.children)) {
      return root.children;
    }
    return treeData;
  }, [treeData]);

  const columns = selected
    ? `${(sidebarRatio * 100).toFixed(2)}% 6px 1fr`
    : '100% 0 0';

  return (
    <div className={styles.container} style={{ gridTemplateColumns: columns }}>
      <Titlebar/>
      <div className={styles.sidebar}>
        <Sidebar data={displayData} onSelect={setSelected} title={archiveTitle} subtitle={archiveSubtitle} />
      </div>
      {selected ? (
        <div
          className={`${styles.divider} ${isDragging ? styles.dividerActive : ''}`}
          onMouseDown={(e) => {
            setIsDragging(true);
            const startX = e.clientX;
            const total = window.innerWidth || 1100;
            const startW = sidebarRatio * total;
            const onMove = (ev: MouseEvent) => {
              const dx = ev.clientX - startX;
              const currentTotal = window.innerWidth || total;
              const minSidebarPx = 260;
              const minPanelPx = 320;
              const unclamped = startW + dx;
              const clampedPx = Math.max(minSidebarPx, Math.min(unclamped, currentTotal - minPanelPx));
              const nextRatio = clampedPx / currentTotal;
              setSidebarRatio(nextRatio);
            };
            const onUp = () => {
              setIsDragging(false);
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
        />
      ) : null}
      <div className={selected ? styles.panel : styles.hiddenPanel}>
        {selected ? <MetadataPanel selected={selected} /> : null}
      </div>
    </div>
  );
};


