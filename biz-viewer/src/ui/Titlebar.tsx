import React from 'react';
import styles from '../styles/Titlebar.module.scss';

// zipAPI type is declared via Dropzone or preload consumers

export const Titlebar: React.FC = () => {
  const onOpen = async () => {
    await window.zipAPI?.openDialog?.();
  };
  return (
    <div className={styles.titlebar}>
      <div className={styles.dragRegion}>BIZ Viewer</div>
      <div className={styles.actions}>
        <button className={styles.openBtn} onClick={onOpen} title="Open archive (Ctrl+O)">Open</button>
      </div>
    </div>
  );
};


