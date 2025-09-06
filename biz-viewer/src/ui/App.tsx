import React, { useEffect, useMemo, useState } from 'react';
import styles from '../styles/App.module.scss';
import { Sidebar } from './Sidebar/Sidebar';
import { MetadataPanel } from './Metadata/MetadataPanel';
import { Dropzone } from './Dropzone/Dropzone';
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
  const [loadedTree, setLoadedTree] = useState<FileNode[] | null>(null);
  const [loadedTitle, setLoadedTitle] = useState<string | undefined>(undefined);
  const [loadedSubtitle, setLoadedSubtitle] = useState<string | undefined>(undefined);

  // No placeholder data; render Dropzone until a zip is opened

  const archiveTitle: string | undefined = loadedTitle;
  const archiveSubtitle: string | undefined = loadedSubtitle;
  const displayData = useMemo<FileNode[] | null>(() => loadedTree, [loadedTree]);

  const formatBytes = (size: number): string => {
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

  const columns = selected
    ? `${(sidebarRatio * 100).toFixed(2)}% 6px 1fr`
    : '100% 0 0';

  return (
    <div className={styles.container} style={{ gridTemplateColumns: columns }}>
      <Titlebar/>
      {!displayData ? (
        <Dropzone
          onLoaded={(res) => {
            setLoadedTree(res.tree as FileNode[]);
            setLoadedTitle(res.title);
            const files = res.summary?.files ?? 0;
            const bytes = res.summary?.bytes ?? 0;
            setLoadedSubtitle(`${formatBytes(bytes)} • ${files} files`);
            setSelected(null);
          }}
        />
      ) : (
        <>
          <div className={styles.sidebar}>
            <Sidebar
              data={displayData}
              onSelect={setSelected}
              title={archiveTitle}
              subtitle={archiveSubtitle}
              onOpen={async () => {
                const res = await (window as any).zipAPI?.openDialog?.();
                if (res && res.tree) {
                  setLoadedTree(res.tree as FileNode[]);
                  setLoadedTitle(res.title);
                  const files = res.summary?.files ?? 0;
                  const bytes = res.summary?.bytes ?? 0;
                  setLoadedSubtitle(`${formatBytes(bytes)} • ${files} files`);
                  setSelected(null);
                }
              }}
            />
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
        </>
      )}
    </div>
  );
};


