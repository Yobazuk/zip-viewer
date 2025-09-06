import React, { useCallback, useState } from 'react';
import styles from '../../styles/Dropzone.module.scss';

declare global {
	interface Window {
		zipAPI?: {
			openDialog: () => Promise<any>;
			openPath: (p: string | { data: Uint8Array; name?: string } | { path: string }) => Promise<any>;
		};
	}
}

type Props = {
	onLoaded: (res: { tree: any[]; summary: { files: number; bytes: number }; title: string }) => void;
};

export const Dropzone: React.FC<Props> = ({ onLoaded }) => {
	const [hover, setHover] = useState(false);

	const open = async () => {
		const res = await window.zipAPI?.openDialog?.();
		if (res && res.tree) onLoaded(res);
	};

	const onDrop = useCallback(async (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setHover(false);
		const files = Array.from(e.dataTransfer.files || []);
		const first = files.find((f) => /\.(zip|biz)$/i.test(f.name));
		if (!first) return;
		let res: any = null;
		const anyFile = first as unknown as { path?: string };
		if (anyFile.path) {
			res = await window.zipAPI?.openPath?.({ path: anyFile.path });
		} else if (first.arrayBuffer) {
			const buf = await first.arrayBuffer();
			res = await window.zipAPI?.openPath?.({ data: new Uint8Array(buf), name: first.name });
		}
		if (res && res.tree) onLoaded(res);
	}, [onLoaded]);

	const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setHover(true); };
	const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setHover(false); };

	return (
		<div className={`${styles.zone} ${hover ? styles.hover : ''}`} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}>
			<div className={styles.content}>
				<div className={styles.title}>Open an archive</div>
				<div className={styles.subtitle}>Drag & drop a .zip or .biz file here, or</div>
				<button className={styles.openBtn} onClick={open}>Browse</button>
			</div>
		</div>
	);
};


