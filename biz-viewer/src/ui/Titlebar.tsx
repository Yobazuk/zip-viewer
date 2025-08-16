import React from 'react';
import styles from '../styles/Titlebar.module.scss';

export const Titlebar: React.FC = () => {
  return (
    <div className={styles.titlebar}>
      <div className={styles.dragRegion}>BIZ Viewer</div>
    </div>
  );
};


