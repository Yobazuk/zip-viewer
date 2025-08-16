## BIZ Viewer (Electron)

A desktop app to browse BIZ archives (ZIP-compatible) and view per-file JSON metadata stored in ZIP file comments.

### Features

- Modern two-pane UI (file explorer + details)
- Open `.biz` (and `.zip`) via button or drag-and-drop
- Shows general file info: name, path, size, compressed size, modified time
- Parses and pretty-prints JSON metadata from each entry's ZIP comment
- Displays archive-level comment

### Getting Started

Prerequisites:
- Node.js 18+

Install and run:

```bash
npm install
npm start
```

### Packaging (optional)

You can integrate `electron-builder` or `electron-forge` later for installers. The current setup focuses on development (`npm start`).

### BIZ Format

This app treats BIZ files as standard ZIP archives where per-entry comments contain JSON. If a comment is not valid JSON, the app shows the raw comment and the parse error.
