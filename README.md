# ZIP Viewer

A modern, elegant desktop application for viewing and exploring ZIP archives. Built with Electron and designed with a focus on user experience.

## Screenshots

### Main Interface
![Main Interface](docs/main-interface.png)
*The main interface showing the file explorer and metadata panel*

### File Navigation
![File Navigation](docs/file-navigation.png)
*Navigating through folders with the hierarchical file tree*

### File Details
![File Details](docs/file-details.png)
*Detailed file information and metadata display*

### Dark Theme
![Dark Theme](docs/dark-theme.png)
*Professional dark theme with blue accents*

## Features

- 🎯 **Modern Interface**: Clean, dark-themed UI with intuitive navigation
- 📂 **File Management**: 
  - Browse ZIP contents with a hierarchical file tree
  - Navigate through folders with breadcrumb-style navigation
  - Sort files and folders automatically
- 📊 **Detailed Information**:
  - File metadata display (size, compression ratio, dates)
  - ZIP archive comments support
  - Real-time size calculations
- 🔍 **File Operations**:
  - Open files directly from the ZIP archive
  - Extract and view individual files
  - Drag and drop support for ZIP files
- 🎨 **User Experience**:
  - Responsive and fluid interface
  - Keyboard navigation support
  - System integration (file associations)

## Installation

### Windows

1. Download the latest installer from the [releases page](https://github.com/yourusername/zip-viewer/releases)
2. Run the installer (ZIP Viewer Setup.exe)
3. Choose your installation preferences
4. Launch ZIP Viewer from the Start Menu or desktop shortcut

The installer will automatically:
- Create desktop and start menu shortcuts
- Associate .zip files with ZIP Viewer
- Set up file type icons

## Usage

### Opening ZIP Files

There are several ways to open ZIP files:
1. Drag and drop a ZIP file onto the application window
2. Click anywhere in the drop zone to select a file
3. Double-click a ZIP file in Windows Explorer (requires file association)
4. Right-click a ZIP file and select "Open with ZIP Viewer"

### Navigation

- Click on folders to navigate into them
- Use the ".." button to navigate up one level
- Click on files to view their details in the metadata panel

### File Operations

- Click the "Open" button (↗️) next to a file to open it with the default application
- View file details in the metadata panel:
  - Name
  - Type
  - Size
  - Last Modified date
  - Compressed Size
  - Compression Ratio

### Window Controls

- Minimize (─)
- Maximize/Restore (□)
- Close (×)

## Development

### Prerequisites

- Node.js 14 or later
- npm 6 or later
- Windows 10 or later (for development)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/zip-viewer.git
   cd zip-viewer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

### Project Structure

```
zip-viewer/
├── src/
│   ├── main.js           # Main process code
│   └── renderer/         # Renderer process code
│       ├── index.html    # Main window HTML
│       ├── renderer.js   # Renderer logic
│       └── styles.css    # Application styles
├── build/               # Build resources
│   ├── icon.ico         # Application icon
│   └── file-icon.ico    # File type icon
└── dist/               # Build output
```

### Available Scripts

- `npm run dev` - Run the application in development mode with hot reload
- `npm start` - Run the application in production mode
- `npm run build` - Build the application for distribution
- `npm run generate-icons` - Generate application icons

### Building

To build the application:

```bash
npm run build
```

This will:
1. Generate necessary icons
2. Create an installer in the `dist` folder
3. Package all required resources

### Technologies Used

- **Electron**: Cross-platform desktop application framework
- **adm-zip**: ZIP file handling
- **electron-store**: Settings persistence
- **electron-builder**: Application packaging and distribution

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Icons and design inspiration from modern UI/UX trends
- Built with Electron and other open-source technologies