import React from 'react';
import { TreeView } from './TreeView';
import type { FileNode } from '../App';
import styles from '../../styles/Sidebar.module.scss';

type SidebarProps = {
  data: FileNode[];
  onSelect: (node: FileNode | null) => void;
  title?: string;
  subtitle?: string;
};

export const Sidebar: React.FC<SidebarProps> = ({ data, onSelect, title, subtitle }) => {
  return (
    <div className={styles.sidebarRoot}>
      <div className={styles.titleBar}>
        <div className={styles.titleContainer}>
          {title ? <div className={styles.title} title={title}>{title}</div> : null}
          {subtitle ? <div className={styles.subtitle} title={subtitle}>{subtitle}</div> : null}
        </div>
      </div>
      <TreeView data={data} onSelect={onSelect} />
    </div>
  );
};

