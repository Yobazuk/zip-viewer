/**
 * ZIP Viewer - Renderer Process
 * Handles the user interface, file tree display, and metadata visualization.
 */

const { ipcRenderer } = require('electron');

// Window control handlers
document.getElementById('minimize-button').addEventListener('click', () => {
    ipcRenderer.send('minimize-window');
});

document.getElementById('maximize-button').addEventListener('click', () => {
    ipcRenderer.send('maximize-window');
});

document.getElementById('close-button').addEventListener('click', () => {
    ipcRenderer.send('close-window');
});

// Listen for file open events from main process
ipcRenderer.on('open-file', async (event, filePath) => {
    console.log('Renderer received open-file event:', filePath);
    try {
        await openZipFile(filePath);
    } catch (error) {
        console.error('Error in open-file handler:', error);
        alert('Error opening file: ' + error.message);
    }
});

let currentZipPath = null;
let currentZipComment = '';
let allEntries = [];
let currentPath = '';

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileTree = document.getElementById('file-tree');
const metadataPanel = document.getElementById('metadata-panel');
const metadataContent = document.getElementById('metadata-content');
const currentFileElement = document.getElementById('current-file');

// Drag and drop handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    if (file && file.path.toLowerCase().endsWith('.zip')) {
        await openZipFile(file.path);
    }
});

// Click to select file
dropZone.addEventListener('click', async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await openZipFile(file.path);
        }
    };
    
    input.click();
});

/**
 * Opens and processes a ZIP file
 * @param {string} filePath - Path to the ZIP file to open
 */
async function openZipFile(filePath) {
    console.log('Opening ZIP file:', filePath);
    const result = await ipcRenderer.invoke('open-zip', filePath);
    
    if (result.success) {
        currentZipPath = filePath;
        currentZipComment = result.zipComment;
        allEntries = result.entries;
        currentPath = '';
        
        // Hide drop zone and show file explorer
        dropZone.classList.add('hidden');
        fileTree.classList.add('active');
        metadataPanel.classList.add('active');
        
        displayFileTree(currentPath);
        updateCurrentFile(filePath);
        // Show archive info initially since no file is selected
        displayMetadata(null);
        console.log('File loaded successfully');
    } else {
        console.error('Error opening ZIP file:', result.error);
        alert('Error opening ZIP file: ' + result.error);
    }
}

/**
 * Updates the current file display in the UI
 * @param {string} filePath - Path of the current ZIP file
 * @param {string} currentDir - Current directory in the ZIP archive
 */
function updateCurrentFile(filePath, currentDir = '') {
    const fileName = filePath.split('\\').pop().split('/').pop();
    currentFileElement.innerHTML = `
        <div class="file-info-container">
            <h2>${fileName}</h2>
            <span class="current-directory">${currentDir || ''}</span>
        </div>
    `;
}

/**
 * Gets all entries in the current path of the ZIP file
 * @param {string} path - Current directory path in the ZIP
 * @returns {Array} Array of entries in the current path
 */
function getEntriesInPath(path) {
    const entriesInPath = new Map();
    
    allEntries.forEach(entry => {
        // Remove leading/trailing slashes and split path
        const entryPath = entry.entryName.replace(/^\/+|\/+$/g, '');
        const parts = entryPath.split('/');
        
        // If we're at root and entry has no path, or if entry is in current path
        if ((path === '' && parts.length === 1) || 
            (path !== '' && entryPath.startsWith(path + '/'))) {
            
            // Get the next part after current path
            const relativePath = path === '' ? parts[0] : parts[path.split('/').length];
            
            if (relativePath) {
                // If this is a directory that we haven't processed yet
                if (entryPath.indexOf('/', path.length + 1) > -1 || entry.isDirectory) {
                    // Add as directory if we haven't seen it yet
                    if (!entriesInPath.has(relativePath)) {
                        entriesInPath.set(relativePath, {
                            entryName: path ? `${path}/${relativePath}` : relativePath,
                            isDirectory: true,
                            size: 0,
                            compressedSize: 0,
                            lastModified: entry.lastModified,
                            comment: entry.comment || ''
                        });
                    }
                } else {
                    // This is a file
                    entriesInPath.set(relativePath, entry);
                }
            }
        }
    });
    
    return Array.from(entriesInPath.values());
}

/**
 * Displays the file tree for the current path
 * @param {string} path - Current directory path in the ZIP
 */
function displayFileTree(path) {
    const entries = getEntriesInPath(path);
    currentPath = path;

    // Sort entries: directories first, then files alphabetically
    const sortedEntries = entries.sort((a, b) => {
        const aName = a.entryName.split('/').pop().toLowerCase();
        const bName = b.entryName.split('/').pop().toLowerCase();
        
        if (a.isDirectory === b.isDirectory) {
            return aName.localeCompare(bName);
        }
        return b.isDirectory - a.isDirectory;
    });

    fileTree.innerHTML = '';
    
    // Update the current file display with the current directory
    updateCurrentFile(currentZipPath, path ? `/${path}` : '');
    
    // Add back button if we're in a subfolder
    if (path !== '') {
        const backItem = document.createElement('div');
        backItem.className = 'file-tree-item';
        
        const iconSpan = document.createElement('span');
        iconSpan.className = 'folder-icon';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = '..';
        
        backItem.appendChild(iconSpan);
        backItem.appendChild(nameSpan);
        
        backItem.addEventListener('click', () => {
            const parentPath = path.split('/').slice(0, -1).join('/');
            displayFileTree(parentPath);
        });
        
        fileTree.appendChild(backItem);
    }
    
    // Create a container for the entries
    const entriesContainer = document.createElement('div');
    entriesContainer.className = 'file-tree-entries';
    
    sortedEntries.forEach(entry => {
        const item = createFileTreeItem(entry);
        entriesContainer.appendChild(item);
    });
    
    // Add click handler to the container for deselection
    entriesContainer.addEventListener('click', (e) => {
        // If clicking the container itself (not a file item)
        if (e.target === entriesContainer) {
            const selectedItems = fileTree.getElementsByClassName('selected');
            Array.from(selectedItems).forEach(item => item.classList.remove('selected'));
            displayMetadata(null); // Show archive info when no file is selected
        }
    });
    
    fileTree.appendChild(entriesContainer);
}

/**
 * Creates a file tree item element
 * @param {Object} entry - File or directory entry
 * @returns {HTMLElement} The created file tree item element
 */
function createFileTreeItem(entry) {
    const item = document.createElement('div');
    item.className = 'file-tree-item';
    
    const nameSection = document.createElement('div');
    nameSection.className = 'file-name-section';
    
    const iconSpan = document.createElement('span');
    iconSpan.className = entry.isDirectory ? 'folder-icon' : 'file-icon';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'file-name';
    const displayName = entry.entryName.split('/').pop();
    nameSpan.textContent = displayName;
    
    nameSection.appendChild(iconSpan);
    nameSection.appendChild(nameSpan);
    
    if (!entry.isDirectory) {
        const openButton = createOpenButton(entry);
        nameSection.appendChild(openButton);
    }
    
    const sizeSpan = document.createElement('span');
    sizeSpan.className = 'file-size';
    if (!entry.isDirectory) {
        sizeSpan.textContent = formatFileSize(entry.size);
    }
    
    item.appendChild(nameSection);
    item.appendChild(sizeSpan);
    
    item.addEventListener('click', (e) => {
        // Prevent click handling if clicking the open button
        if (e.target.closest('.open-button')) {
            return;
        }

        if (entry.isDirectory) {
            displayFileTree(entry.entryName);
        } else {
            const wasSelected = item.classList.contains('selected');
            
            // Remove selected class from all items
            const selectedItems = fileTree.getElementsByClassName('selected');
            Array.from(selectedItems).forEach(item => item.classList.remove('selected'));
            
            if (!wasSelected) {
                // Select this item and show its metadata
                item.classList.add('selected');
                displayMetadata(entry);
            } else {
                // Item was already selected, deselect it and show archive info
                displayMetadata(null);
            }
        }
    });
    
    return item;
}

/**
 * Creates an open button for file entries
 * @param {Object} entry - File entry
 * @returns {HTMLElement} The created open button element
 */
function createOpenButton(entry) {
    const openButton = document.createElement('button');
    openButton.className = 'open-button';
    openButton.title = 'Open file';
    
    const openIcon = document.createElement('span');
    openIcon.className = 'open-icon';
    
    openButton.appendChild(openIcon);
    
    openButton.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent triggering the item click
        try {
            const result = await ipcRenderer.invoke('open-file', currentZipPath, entry.entryName);
            if (!result.success) {
                alert('Error opening file: ' + result.error);
            }
        } catch (error) {
            alert('Error opening file: ' + error.message);
        }
    });
    
    return openButton;
}

/**
 * Gets the file type from filename
 * @param {string} filename - Name of the file
 * @returns {string} File type (extension without dot) or appropriate message
 */
function getFileType(filename) {
    if (!filename) return 'No Extension';
    const extension = filename.split('.').pop();
    // If the filename has no extension or starts with a dot
    if (extension === filename || filename.startsWith('.')) {
        return 'No Extension';
    }
    return extension.toUpperCase();
}

/**
 * Creates a collapsible comment header
 * @param {string} title - Title of the comment section
 * @param {boolean} isExpanded - Whether the section should be expanded by default
 * @returns {Object} The header element and a function to toggle expansion
 */
function createCommentHeader(title, isExpanded = true) {
    const header = document.createElement('div');
    header.className = 'comment-header';
    
    const icon = document.createElement('span');
    icon.className = `collapse-icon${isExpanded ? ' expanded' : ''}`;
    icon.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16">
            <path fill="currentColor" d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
    `;
    
    const titleElement = document.createElement('h4');
    titleElement.textContent = title;
    
    header.appendChild(icon);
    header.appendChild(titleElement);
    
    return header;
}

/**
 * Displays metadata for the selected file or archive
 * @param {Object} entry - File or directory entry, null if showing archive only
 */
function displayMetadata(entry = null) {
    metadataContent.innerHTML = '';
    const metadataPanel = document.getElementById('metadata-panel');
    
    // Toggle archive-only class based on whether a file is selected
    metadataPanel.classList.toggle('archive-only', !entry);

    // Update panel title based on content
    const panelTitle = metadataPanel.querySelector('h3');
    panelTitle.textContent = entry ? 'File Details' : 'Archive Comment';

    if (entry) {
        // Create metadata grid for file/directory
        const metadataGrid = document.createElement('div');
        metadataGrid.className = 'metadata-grid';
        
        // Extract directory path and filename
        const pathParts = entry.entryName.split('/');
        const fileName = pathParts.pop();
        const directoryPath = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';
        
        const metadata = [
            { label: 'Name', value: fileName },
            { label: 'Directory', value: directoryPath },
            { label: 'Type', value: entry.isDirectory ? 'Directory' : getFileType(fileName) },
            { label: 'Size', value: entry.isDirectory ? '-' : formatFileSize(entry.size) },
            { label: 'Last Modified', value: entry.lastModified },
            { label: 'Compressed Size', value: entry.isDirectory ? '-' : formatFileSize(entry.compressedSize) },
            { label: 'Compression Ratio', value: entry.isDirectory ? '-' : calculateCompressionRatio(entry.size, entry.compressedSize) }
        ];

        metadata.forEach(item => {
            const label = document.createElement('div');
            label.className = 'metadata-label';
            label.textContent = item.label;

            const value = document.createElement('div');
            value.className = 'metadata-value';
            value.textContent = item.value;

            metadataGrid.appendChild(label);
            metadataGrid.appendChild(value);
        });

        metadataContent.appendChild(metadataGrid);
    }

    // Add comments section
    displayComments(entry);
}

/**
 * Attempts to parse and format JSON content
 * @param {string} content - The content to parse
 * @returns {Object} Object containing success status and formatted content
 */
function formatJSONContent(content) {
    try {
        // Try to parse the content as JSON
        const jsonObj = JSON.parse(content);
        
        // Format the JSON with 2 spaces indentation
        const formattedJSON = JSON.stringify(jsonObj, null, 2);
        
        // Apply syntax highlighting
        const highlighted = formattedJSON.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|\{|\}|\[|\]|,)/g,
            function (match) {
                let cls = 'json-string';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                        // Remove the colon from the key
                        match = match.slice(0, -1);
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                } else if (/^-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?$/.test(match)) {
                    cls = 'json-number';
                } else if (/[\{\}\[\]]/.test(match)) {
                    cls = 'json-bracket';
                } else if (/,/.test(match)) {
                    cls = 'json-comma';
                }
                
                return `<span class="${cls}">${match}</span>` + (/:$/.test(match) ? ':' : '');
            }
        );
        
        return {
            isJSON: true,
            content: `<div class="json-content">${highlighted}</div>`
        };
    } catch (e) {
        return {
            isJSON: false,
            content: content
        };
    }
}

/**
 * Creates a comment content element with optional JSON formatting
 * @param {string} content - The comment content
 * @returns {HTMLElement} The formatted comment content element
 */
function createCommentContent(content) {
    const contentElement = document.createElement('div');
    contentElement.className = 'zip-comment-content';
    
    // Try to format as JSON
    const formatted = formatJSONContent(content);
    if (formatted.isJSON) {
        contentElement.classList.add('json-formatted');
        contentElement.innerHTML = formatted.content;
    } else {
        contentElement.textContent = content;
    }
    
    return contentElement;
}

/**
 * Displays file and ZIP comments
 * @param {Object} entry - File or directory entry, null if showing archive only
 */
function displayComments(entry = null) {
    if (!((entry && entry.comment) || currentZipComment)) return;

    const commentsContainer = document.createElement('div');
    commentsContainer.className = 'comments-container';

    const commentsSection = document.createElement('div');
    commentsSection.className = 'zip-comment';
    
    const bothCommentsExist = entry && entry.comment && currentZipComment;
    
    // If a file is selected and it has a comment, show it
    if (entry && entry.comment) {
        const fileCommentHeader = createCommentHeader('File Comment', !bothCommentsExist);
        const fileCommentContent = createCommentContent(entry.comment);
        if (bothCommentsExist) fileCommentContent.classList.add('collapsed');
        
        commentsSection.appendChild(fileCommentHeader);
        commentsSection.appendChild(fileCommentContent);
        
        fileCommentHeader.addEventListener('click', () => {
            fileCommentHeader.querySelector('.collapse-icon').classList.toggle('expanded');
            fileCommentContent.classList.toggle('collapsed');
        });
    }

    // Show ZIP comment if it exists
    if (currentZipComment) {
        if (entry) {
            // Show collapsible archive comment when a file is selected
            const archiveCommentHeader = createCommentHeader('Archive Comment', !entry);
            const archiveCommentContent = createCommentContent(currentZipComment);
            if (entry) archiveCommentContent.classList.add('collapsed');
            
            // Add spacing between comments if both exist
            if (entry && entry.comment) {
                archiveCommentHeader.style.marginTop = '20px';
            }
            
            commentsSection.appendChild(archiveCommentHeader);
            commentsSection.appendChild(archiveCommentContent);
            
            archiveCommentHeader.addEventListener('click', () => {
                archiveCommentHeader.querySelector('.collapse-icon').classList.toggle('expanded');
                archiveCommentContent.classList.toggle('collapsed');
            });
        } else {
            // Show archive comment without header when no file is selected
            const archiveCommentContent = createCommentContent(currentZipComment);
            commentsSection.appendChild(archiveCommentContent);
        }
    }

    commentsContainer.appendChild(commentsSection);
    metadataContent.appendChild(commentsContainer);
}

/**
 * Calculates the compression ratio for a file
 * @param {number} originalSize - Original file size in bytes
 * @param {number} compressedSize - Compressed file size in bytes
 * @returns {string} Formatted compression ratio percentage
 */
function calculateCompressionRatio(originalSize, compressedSize) {
    if (originalSize === 0) return '0%';
    const ratio = ((originalSize - compressedSize) / originalSize) * 100;
    return `${ratio.toFixed(1)}%`;
}

/**
 * Formats file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size with units
 */
function formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
} 