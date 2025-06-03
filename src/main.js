/**
 * ZIP Viewer - Main Process
 * Handles the core application functionality, window management, and IPC communication.
 */

const { app, BrowserWindow, ipcMain, protocol, shell } = require('electron');
const path = require('path');
const AdmZip = require('adm-zip');
const Store = require('electron-store');
const fs = require('fs');
const os = require('os');

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', 'electron'),
    hardResetMethod: 'exit',
    watched: [
      path.join(__dirname, 'renderer', '*.html'),
      path.join(__dirname, 'renderer', '*.css'),
      path.join(__dirname, 'renderer', '*.js'),
      path.join(__dirname, 'main.js')
    ]
  });
}

const store = new Store();
let mainWindow;
let fileToOpen = null;

/**
 * Handles opening ZIP files, either directly or through the renderer process
 * @param {string} filePath - Path to the ZIP file to open
 */
function handleFileOpen(filePath) {
  console.log('Attempting to open file:', filePath);
  if (filePath && filePath.toLowerCase().endsWith('.zip')) {
    if (mainWindow) {
      console.log('Sending file to window:', filePath);
      try {
        const result = openZipFile(filePath);
        console.log('openZipFile result:', result);
        if (result.success) {
          mainWindow.webContents.send('open-file', filePath);
        } else {
          console.error('Failed to open ZIP:', result.error);
        }
      } catch (error) {
        console.error('Error in handleFileOpen:', error);
      }
    } else {
      console.log('Storing file for later:', filePath);
      fileToOpen = filePath;
    }
  } else {
    console.log('Invalid file path or not a ZIP file:', filePath);
  }
}

/**
 * Creates the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1150,
    height: 550,
    minWidth: 800,
    minHeight: 550,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded, fileToOpen:', fileToOpen);
    if (fileToOpen) {
      console.log('Sending file to renderer:', fileToOpen);
      mainWindow.webContents.send('open-file', fileToOpen);
      fileToOpen = null;
    }
  });
}

/**
 * Opens and reads a ZIP file, returning its contents and metadata
 * @param {string} filePath - Path to the ZIP file
 * @returns {Object} Object containing success status and file data or error message
 */
function openZipFile(filePath) {
  try {
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();
    const zipComment = zip.getZipComment() || '';
    
    const entries = zipEntries.map(entry => ({
      entryName: entry.entryName,
      isDirectory: entry.entryName.endsWith('/') || entry.isDirectory,
      size: entry.header.size,
      compressedSize: entry.header.compressedSize,
      lastModified: new Date(entry.header.time).toLocaleString(),
      comment: entry.comment || ''
    }));

    return {
      success: true,
      entries,
      filePath,
      zipComment
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Handle file path from command line
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  // Check if we have a file path in the arguments
  const args = process.argv.slice(1);
  console.log('Starting with args:', args);
  if (args.length > 0) {
    const lastArg = args[args.length - 1];
    console.log('Checking last arg:', lastArg);
    if (lastArg.toLowerCase().endsWith('.zip')) {
      fileToOpen = lastArg;
      console.log('Initial file to open:', fileToOpen);
    }
  }

  app.whenReady().then(() => {
    createWindow();
    console.log('Window created, fileToOpen:', fileToOpen);
  });
}

// Application event handlers
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('second-instance', (event, commandLine) => {
  console.log('Second instance detected with args:', commandLine);
  if (commandLine.length > 1) {
    const filePath = commandLine[commandLine.length - 1];
    handleFileOpen(filePath);
  }
  
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Handle ZIP file opening from Explorer
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  handleFileOpen(filePath);
});

// IPC handlers
ipcMain.handle('open-zip', async (event, filePath) => {
  return openZipFile(filePath);
});

/**
 * Handles extracting and opening individual files from the ZIP archive
 */
ipcMain.handle('open-file', async (event, zipPath, entryPath) => {
  try {
    const zip = new AdmZip(zipPath);
    const entry = zip.getEntry(entryPath);
    
    if (!entry || entry.isDirectory) {
      return { success: false, error: 'Invalid file' };
    }

    const tempDir = path.join(os.tmpdir(), 'zip-viewer-temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const tempFilePath = path.join(tempDir, path.basename(entryPath));
    zip.extractEntryTo(entry, tempDir, false, true);

    await shell.openPath(tempFilePath);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Window control handlers
ipcMain.on('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('close-window', () => {
  mainWindow.close();
}); 