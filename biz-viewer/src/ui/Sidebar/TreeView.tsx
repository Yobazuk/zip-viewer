import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FileNode } from '../App';
import styles from '../../styles/TreeView.module.scss';

type TreeViewProps = {
  data: FileNode[];
  onSelect: (node: FileNode | null) => void;
};

type FlattenedNode = FileNode & { depth: number; path: string };

function flatten(nodes: FileNode[], depth = 0, parentPath = ''): FlattenedNode[] {
  const result: FlattenedNode[] = [];
  for (const n of nodes) {
    const path = parentPath ? `${parentPath}/${n.name}` : n.name;
    result.push({ ...n, depth, path });
    if (n.children && n.children.length > 0) {
      result.push(...flatten(n.children, depth + 1, path));
    }
  }
  return result;
}

export const TreeView: React.FC<TreeViewProps> = ({ data, onSelect }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const list = useMemo<FlattenedNode[]>(() => flatten(data), [data]);

  const formatBytes = (size?: number): string => {
    if (size === undefined || size === null) return '';
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let value = size;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value = value / 1024;
      unitIndex += 1;
    }
    const formatted = unitIndex === 0 ? String(value) : value.toFixed(1);
    return `${formatted} ${units[unitIndex]}`;
  };

  const toggle = useCallback((path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  }, []);

  const handleFileSelect = useCallback(
    (node: FlattenedNode) => {
      setSelectedPath(node.path);
      onSelect(node);
    },
    [onSelect]
  );

  const isVisible = (node: FlattenedNode): boolean => {
    if (node.depth === 0) return true;
    const parts = node.path.split('/');
    // Remove self; check all ancestors are expanded
    for (let i = 0; i < parts.length - 1; i++) {
      const ancestor = parts.slice(0, i + 1).join('/');
      const isFolder = list.find((n: FlattenedNode) => n.path === ancestor)?.type === 'folder';
      if (isFolder && !expanded[ancestor]) return false;
    }
    return true;
  };

  useEffect(() => {
    const updateHint = () => {
      const el = rootRef.current;
      if (!el) return;
      setShowHint(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    };
    updateHint();
    const el = rootRef.current;
    if (el) {
      el.addEventListener('scroll', updateHint);
    }
    window.addEventListener('resize', updateHint);
    return () => {
      if (el) el.removeEventListener('scroll', updateHint);
      window.removeEventListener('resize', updateHint);
    };
  }, [data, expanded, list.length]);

  return (
    <div
      ref={rootRef}
      className={styles.treeRoot}
      onClick={() => {
        setSelectedPath(null);
        onSelect(null);
      }}
    >
      {list.filter(isVisible).map((node) => {
        const isFolder = node.type === 'folder';
        const isExpanded = !!expanded[node.path];
        const isSelected = !isFolder && node.path === selectedPath;
        return (
          <div
            key={node.path}
            className={`${styles.row} ${isSelected ? styles.selected : ''}`}
            style={{ paddingLeft: `${node.depth * 14 + 8}px` }}
            onClick={(e) => {
              e.stopPropagation();
              if (isFolder) {
                toggle(node.path);
                // Keep current file selection when toggling folders
              } else {
                if (selectedPath === node.path) {
                  setSelectedPath(null);
                  onSelect(null);
                } else {
                  handleFileSelect(node);
                }
              }
            }}
          >
            {isFolder ? (
              <>
                <button
                  className={styles.disclosure}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(node.path);
                  }}
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? '▾' : '▸'}
                </button>
                <span className={styles.folderIcon} aria-hidden="true" />
              </>
            ) : (
              <>
                <span className={styles.bullet}>•</span>
                <span className={styles.fileIcon} aria-hidden="true" />
              </>
            )}
            <span className={styles.label} title={node.name}>{node.name}</span>
            {isFolder ? (
              <span className={styles.count}>{(node.children?.length ?? 0)}</span>
            ) : node.size !== undefined ? (
              <span className={styles.size}>{formatBytes(node.size)}</span>
            ) : null}
          </div>
        );
      })}
      {showHint && <div className={styles.scrollHint} />}
    </div>
  );
};


