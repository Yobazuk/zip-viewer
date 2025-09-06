import React, { useMemo, useRef, useEffect, useState } from 'react';
import type { FileNode } from '../App';
import styles from '../../styles/MetadataPanel.module.scss';

type Props = {
  selected: FileNode | null;
};

function formatBytes(size?: number): string {
  if (size === undefined || size === null) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value = value / 1024;
    unitIndex += 1;
  }
  const formatted = unitIndex === 0 ? String(value) : value.toFixed(1);
  return `${formatted} ${units[unitIndex]}`;
}

export const MetadataPanel: React.FC<Props> = ({ selected }) => {
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  React.useEffect(() => {
    setCustom(selected?.customMetadata ?? {});
  }, [selected]);
  useEffect(() => {
    const updateHint = () => {
      const el = contentRef.current;
      if (!el) return;
      setShowHint(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    };
    updateHint();
    const el = contentRef.current;
    if (el) el.addEventListener('scroll', updateHint);
    window.addEventListener('resize', updateHint);
    return () => {
      if (el) el.removeEventListener('scroll', updateHint);
      window.removeEventListener('resize', updateHint);
    };
  }, [selected, custom]);

  type BasicItem = { label: string; value: string };
  const basic: BasicItem[] | null = useMemo(() => {
    if (!selected) return null;
    const rawPath = selected.path ?? '';
    const parentPath = (() => {
      if (!rawPath || rawPath === '/' || rawPath === '\\') return '/';
      const normalized = rawPath.replace(/\\/g, '/');
      const withoutTrailing = normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
      const lastSlash = withoutTrailing.lastIndexOf('/');
      if (lastSlash <= 0) return '/';
      return withoutTrailing.slice(0, lastSlash + 1);
    })();
    const filename = selected.name || '';
    const dotIndex = filename.lastIndexOf('.');
    const ext = selected.type === 'file' && dotIndex > 0 ? filename.slice(dotIndex).toUpperCase() : '-';
    const formatDateTime24 = (d: string | number | Date): string => {
      try {
        const date = new Date(d);
        return date.toLocaleString(undefined, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
      } catch {
        return String(d);
      }
    };

    return [
      { label: 'Name', value: filename },
      { label: 'Path', value: parentPath },
      { label: 'Size', value: formatBytes(selected.size) },
      { label: 'Modified', value: selected.mtime ? formatDateTime24(selected.mtime) : '-' },
      { label: 'Extension', value: ext },
    ];
  }, [selected]);

  const hasCustom = useMemo(() => Object.keys(custom).length > 0, [custom]);

  const copy = (value: string): void => {
    if (!value) return;
    try {
      const api = (window as any).bizAPI;
      if (api && typeof api.copyText === 'function') {
        api.copyText(value);
      }
    } catch {
      // Swallow errors in dev
    }
  };

  const copyWithHint = (id: string, value: string): void => {
    copy(value);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1200);
  };

  return (
    <div className={styles.panelRoot}>
      <div className={styles.header}></div>
      <div className={styles.content} ref={contentRef}>
        {!selected ? (
          <div className={styles.placeholder}>Select a file to view metadata</div>
        ) : (
          <>
            <section className={styles.section}>
              <div className={styles.sectionTitle}>Properties</div>
              <div className={styles.kvGrid}>
                {basic?.map((item: BasicItem) => (
                  <div key={item.label} className={styles.row}>
                    <div className={styles.key}>{item.label}</div>
                    <div className={`${styles.value} ${styles.copyable}`} title="Copy to clipboard" onClick={() => copyWithHint(`basic:${item.label}`, item.value)}>
                      {item.value}
                      {copiedId === `basic:${item.label}` ? (
                        <span className={styles.copiedBadge} aria-live="polite">Copied</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            {hasCustom && (
              <section className={styles.section}>
                <div className={styles.sectionTitle}>Metadata</div>
                <div className={styles.kvGrid}>
                  {Object.entries(custom).map(([k, v]: [string, string]) => (
                    <div key={k} className={styles.row}>
                      <div className={styles.key}>{k}</div>
                      <div className={`${styles.value} ${styles.copyable}`} title="Copy to clipboard" onClick={() => copyWithHint(`custom:${k}`, v)}>
                        {v}
                        {copiedId === `custom:${k}` ? (
                          <span className={styles.copiedBadge} aria-live="polite">Copied</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
        {showHint && <div className={styles.scrollHint} />}
      </div>
    </div>
  );
};


