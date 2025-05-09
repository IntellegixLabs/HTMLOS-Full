// Check for dark mode preference
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (event.matches) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
});

// OS State
const OS = {
    apps: [],
    files: {},
    windows: [],
    nextWindowId: 1,
    activeWindowId: null,
    maxZIndex: 100,
    currentDir: '/home/user', // Add currentDir initialization
    contextMenu: null,
    contextMenuActive: false
};

// Save OS state before unload
window.addEventListener('beforeunload', function(e) {
    const saveData = {
        files: OS.files,
        apps: OS.apps.filter(app => !app.system),  // Only save non-system apps
        timestamp: new Date().toISOString()
    };
    
    // Store in localStorage as backup
    localStorage.setItem('htmlos_backup', JSON.stringify(saveData));
    
    // Also create downloadable file
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `htmlos_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Apply dynamic background colors
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.dynamic-bg-color').forEach(el => {
        const color = el.getAttribute('data-bg-color');
        if (color) {
            el.style.setProperty('--dynamic-bg-color', color);
        }
    });
});

// Initialize OS
document.addEventListener('DOMContentLoaded', () => {
    // --- Auto-recovery: check for backup before initializing everything else ---
    const backup = localStorage.getItem('htmlos_backup');
    if (backup) {
        try {
            const data = JSON.parse(backup);
            restoreBackup(data);
            alert('A backup was found and has been auto-restored!');
        } catch (error) {
            alert('Error restoring backup: ' + error.message);
        }
    }
    // Always continue to initialize the OS so it loads
    initializeApps();
    initializeFiles();
    setupEventListeners();
    updateClock();
    setInterval(updateClock, 1000);
    scanForXmlApps();
});

// Initialize apps
function initializeApps() {
    // Core system apps
    const systemApps = [
        {
            id: 'terminal',
            name: 'Terminal',
            icon: '💻',
            color: '#1E1E1E',
            system: true
        },
        {
            id: 'files',
            name: 'Files',
            icon: '📁',
            color: '#FFA000',
            system: true
        },
        {
            id: 'editor',
            name: 'Text Editor',
            icon: '📝',
            color: '#2196F3',
            system: true
        },
        {
            id: 'app-maker',
            name: 'App Maker',
            icon: '🧩',
            color: '#9C27B0',
            system: true
        }
    ];
    
    // Add system apps to OS
    systemApps.forEach(app => {
        OS.apps.push(app);
        createDesktopIcon(app);
        addAppToStartMenu(app);
    });
}

// Initialize file system
function initializeFiles() {
    // Create basic directories
    OS.files['/home'] = {};
    OS.files['/home/user'] = {};
    OS.files['/home/user/Documents'] = {};
    OS.files['/home/user/Applications'] = [];

    // Add welcome file
    OS.files['/home/user']['welcome.txt'] = {
        content: 'Welcome to HTML OS Pro!\n\nThis operating system is built with HTML, CSS, and JavaScript.\nYou can create your own applications using XML.',
        type: 'text'
    };

    // Initialize the Applications folder with sample apps
    const sampleApps = [
        {name: 'app.calculator.xml', content: calculatorAppXml},
        {name: 'app.notepad.xml', content: notepadAppXml},
        {name: 'app.recovery.xml', content: recoveryAppXml}
    ];

    // Add all sample apps with proper type
    sampleApps.forEach(app => {
        OS.files['/home/user/Applications'].push({
            name: app.name,
            content: app.content,
            type: 'xml'
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Start button
    document.getElementById('start-button').addEventListener('click', toggleStartMenu);
    
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // Power button
    document.getElementById('power-button').addEventListener('click', powerOff);
    
    // Close start menu when clicking outside
    document.addEventListener('click', (e) => {
        const startMenu = document.getElementById('start-menu');
        const startButton = document.getElementById('start-button');
        
        if (!startMenu.classList.contains('hidden') && 
            !startMenu.contains(e.target) && 
            !startButton.contains(e.target)) {
            startMenu.classList.add('hidden');
        }
    });
}

// Scan for XML apps
function scanForXmlApps() {
    const appFiles = OS.files['/home/user/Applications'] || [];
    
    // Remove existing XML apps but keep system apps
    OS.apps = OS.apps.filter(app => app.system);
    
    // Clear existing XML icons and menu items
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        if (icon.querySelector('.xml-badge')) {
            icon.remove();
        }
    });
    
    const startMenuItems = document.getElementById('start-menu-items');
    if (startMenuItems) {
        Array.from(startMenuItems.children).forEach(item => {
            if (item.querySelector('.xml-badge')) {
                item.remove();
            }
        });
    }

    // Re-add all XML apps from Applications folder
    appFiles.forEach(file => {
        if (file && file.name && file.name.endsWith('.xml') && file.content) {
            try {
                const app = parseXmlApp(file.content);
                if (app && !OS.apps.some(a => a.id === app.id)) {
                    // Properly initialize XML app
                    app.isXmlApp = true;
                    app.system = false;
                    
                    // Add to OS apps
                    OS.apps.push(app);
                    
                    // Create UI elements
                    createDesktopIcon(app);
                    addAppToStartMenu(app);
                }
            } catch (error) {
                console.error('Error parsing XML app:', error, file);
            }
        }
    });
}

// Parse XML app
function parseXmlApp(xmlContent) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        
        const id = xmlDoc.querySelector('id')?.textContent;
        const name = xmlDoc.querySelector('name')?.textContent;
        const icon = xmlDoc.querySelector('icon')?.textContent;
        const color = xmlDoc.querySelector('color')?.textContent;
        const html = xmlDoc.querySelector('html')?.innerHTML;
        const script = xmlDoc.querySelector('script')?.textContent;
        
        if (!id || !name) {
            throw new Error('Missing required app properties');
        }
        
        return {
            id,
            name,
            icon: icon || '📱',
            color: color || '#5D5CDE',
            html: html || '',
            script: script || '',
            system: false,
            isXmlApp: true
        };
    } catch (error) {
        console.error('Error parsing XML app:', error);
        return null;
    }
}

// Create desktop icon
function createDesktopIcon(app) {
    const desktop = document.getElementById('desktop');
    
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.innerHTML = `
        <div class="icon dynamic-bg-color" data-bg-color="${app.color}">
            ${app.icon}
        </div>
        <div class="mt-2 text-sm">
            ${app.name}
            ${app.isXmlApp ? '<span class="xml-badge">XML</span>' : ''}
        </div>
    `;
    
    icon.addEventListener('click', () => {
        openApp(app);
    });
    
    desktop.appendChild(icon);
}

// Add app to start menu
function addAppToStartMenu(app) {
    const startMenuItems = document.getElementById('start-menu-items');
    
    const item = document.createElement('div');
    item.className = 'flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer';
    item.innerHTML = `
        <div class="w-8 h-8 flex items-center justify-center rounded mr-2 dynamic-bg-color" data-bg-color="${app.color}">
            ${app.icon}
        </div>
        <div>
            ${app.name}
            ${app.isXmlApp ? '<span class="xml-badge">XML</span>' : ''}
        </div>
    `;
    
    item.addEventListener('click', () => {
        openApp(app);
        document.getElementById('start-menu').classList.add('hidden');
    });
    
    startMenuItems.appendChild(item);
}

// Open app
function openApp(app) {
    const windowId = 'window-' + OS.nextWindowId++;
    const windowElement = document.createElement('div');
    windowElement.className = 'window';
    windowElement.id = windowId;
    windowElement.style.width = '600px';
    windowElement.style.height = '400px';
    windowElement.style.top = '80px';
    windowElement.style.zIndex = OS.maxZIndex++;
    
    // Create window content
    windowElement.innerHTML = `
        <div class="window-header dynamic-bg-color" data-bg-color="${app.color}">
            <div class="flex items-center">
                <span class="mr-2">${app.icon}</span>
                <span>${app.name}</span>
                ${app.isXmlApp ? '<span class="xml-badge ml-2">XML</span>' : ''}
            </div>
            <div class="flex space-x-2">
                <button class="minimize-btn w-5 h-5 flex items-center justify-center rounded-full bg-yellow-400 hover:bg-yellow-500" title="Minimize">
                    <svg class="w-3 h-3 text-yellow-900" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M19,13H5V11H19V13Z" />
                    </svg>
                </button>
                <button class="maximize-btn w-5 h-5 flex items-center justify-center rounded-full bg-green-400 hover:bg-green-500" title="Maximize">
                    <svg class="w-3 h-3 text-green-900" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M4,4H20V20H4V4M6,8V18H18V8H6Z" />
                    </svg>
                </button>
                <button class="close-btn w-5 h-5 flex items-center justify-center rounded-full bg-red-400 hover:bg-red-500" title="Close">
                    <svg class="w-3 h-3 text-red-900" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                    </svg>
                </button>
            </div>
        </div>
        <div class="window-content"></div>
    `;
    
    // Add window to DOM
    document.getElementById('desktop').appendChild(windowElement);
    addWindowToTaskbar(app, windowId);
    OS.windows.push({
        id: windowId,
        appId: app.id,
        minimized: false,
        maximized: false
    });
    makeWindowDraggable(windowId);
    setupWindowControls(windowId);
    loadAppContent(app, windowId);
    setActiveWindow(windowId);
}

// Add window to taskbar
function addWindowToTaskbar(app, windowId) {
    const taskbarApps = document.getElementById('taskbar-apps');
    
    const taskbarItem = document.createElement('div');
    taskbarItem.className = 'taskbar-item';
    taskbarItem.dataset.windowId = windowId;
    taskbarItem.innerHTML = `
        <div class="taskbar-icon dynamic-bg-color" data-bg-color="${app.color}">${app.icon}</div>
        <span class="text-sm">${app.name}</span>
    `;
    
    taskbarItem.addEventListener('click', () => {
        const window = OS.windows.find(w => w.id === windowId);
        
        if (window.minimized) {
            document.getElementById(windowId).style.display = 'flex';
            window.minimized = false;
            setActiveWindow(windowId);
        } else if (OS.activeWindowId === windowId) {
            // Minimize window
            document.getElementById(windowId).style.display = 'none';
            window.minimized = true;
            updateTaskbar();
        } else {
            setActiveWindow(windowId);
        }
    });
    
    taskbarApps.appendChild(taskbarItem);
}

// Load app content
function loadAppContent(app, windowId) {
    const contentContainer = document.querySelector(`#${windowId} .window-content`);
    
    if (app.system) {
        switch (app.id) {
            case 'terminal':
                loadTerminal(contentContainer, windowId);
                break;
            case 'files':
                loadFileExplorer(contentContainer, windowId);
                break;
            case 'editor':
                loadTextEditor(contentContainer, windowId);
                break;
            case 'app-maker':
                loadAppMaker(contentContainer, windowId);
                break;
            default:
                contentContainer.innerHTML = '<div class="p-4">App content not available</div>';
        }
    } else if (app.isXmlApp) {
        try {
            // Initialize XML app window
            contentContainer.innerHTML = app.html;
            
            // Execute init function if it exists
            if (app.script) {
                const scriptFnMatch = app.script.match(/function\s+(\w+)\s*\(/);
                if (scriptFnMatch && scriptFnMatch[1]) {
                    const initFnName = scriptFnMatch[1];
                    const scriptEl = document.createElement('script');
                    scriptEl.textContent = `
                        ${app.script}
                        if (typeof ${initFnName} === 'function') {
                            ${initFnName}(document.querySelector('#${windowId} .window-content'));
                        }
                    `;
                    document.head.appendChild(scriptEl);
                    scriptEl.remove(); // Remove after execution
                }
            }
        } catch (error) {
            console.error('Error loading XML app:', error);
            contentContainer.innerHTML = `<div class="p-4 text-red-500">Error loading app: ${error.message}</div>`;
        }
    }
}

// Restore backup
function restoreBackup(data) {
    // Restore files
    if (data.files) {
        OS.files = data.files;
    }
    
    // Restore apps
    if (data.apps) {
        data.apps.forEach(app => {
            if (!OS.apps.find(a => a.id === app.id)) {
                OS.apps.push(app);
                createDesktopIcon(app);
                addAppToStartMenu(app);
            }
        });
    }
}

// Load terminal app
function loadTerminal(container, windowId) {
    container.innerHTML = `
        <div class="terminal h-full">
            <div class="terminal-output">Welcome to HTML OS Terminal
Type 'help' to see available commands.</div>
            <div class="terminal-input">
                <span class="prompt">user@htmlos:~$</span>
                <input type="text" id="${windowId}-terminal-input" placeholder="Enter command..." title="Terminal command input">
            </div>
        </div>
    `;
    
    const input = document.getElementById(`${windowId}-terminal-input`);
    const output = container.querySelector('.terminal-output');
    
    setTimeout(() => input.focus(), 0);
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = input.value.trim();
            output.innerHTML += `\n<span class="prompt">user@htmlos:~$</span> ${command}`;
            
            if (command) {
                const response = processTerminalCommand(command);
                output.innerHTML += `\n${response}`;
            }
            
            input.value = '';
            container.querySelector('.terminal').scrollTop = container.querySelector('.terminal').scrollHeight;
        }
    });
    
    container.addEventListener('click', () => {
        input.focus();
    });
}

// Process terminal command
function processTerminalCommand(command) {
    const args = command.split(' ');
    const cmd = args[0].toLowerCase();
    
    switch (cmd) {
        case 'help':
            return `Available commands:
ls - List files and directories
pwd - Show current directory
cd <dir> - Change directory
cat <file> - Display file contents
echo <text> - Display text
clear - Clear terminal
apps - List installed apps`;
        
        case 'ls':
            let output = '';
            
            Object.keys(OS.files).forEach(path => {
                if (path.startsWith(OS.currentDir + '/')) {
                    const parts = path.slice(OS.currentDir.length + 1).split('/');
                    if (parts.length === 1) {
                        output += `${parts[0]}/\n`;
                    }
                }
            });
            
            Object.keys(OS.files[OS.currentDir]).forEach(file => {
                output += `${file}\n`;
            });
            
            return output || 'No files found';
        
        case 'pwd':
            return OS.currentDir;
        
        case 'cd':
            if (args.length < 2) return 'Usage: cd <directory>';
            
            const target = args[1];
            
            if (target === '..') {
                const parts = OS.currentDir.split('/');
                parts.pop();
                OS.currentDir = parts.length > 1 ? parts.join('/') : '/';
                return `Changed to ${OS.currentDir}`;
            } else if (target.startsWith('/')) {
                if (OS.files[target] !== undefined || target === '/') {
                    OS.currentDir = target;
                    return `Changed to ${OS.currentDir}`;
                } else {
                    return `Directory not found: ${target}`;
                }
            } else {
                const newPath = OS.currentDir === '/' ? `/${target}` : `${OS.currentDir}/${target}`;
                if (OS.files[newPath] !== undefined) {
                    OS.currentDir = newPath;
                    return `Changed to ${OS.currentDir}`;
                } else {
                    return `Directory not found: ${target}`;
                }
            }
        
        case 'cat':
            if (args.length < 2) return 'Usage: cat <file>';
            
            const fileName = args[1];
            const file = OS.files[OS.currentDir]?.[fileName];
            
            if (!file) {
                return `File not found: ${fileName}`;
            }
            
            return file.content;
        
        case 'echo':
            return args.slice(1).join(' ');
        
        case 'clear':
            document.querySelector('.terminal-output').innerHTML = '';
            return '';
        
        case 'apps':
            let appList = 'Installed Apps:\n';
            OS.apps.forEach(app => {
                appList += `${app.name} (${app.system ? 'System' : 'XML'})\n`;
            });
            return appList;
        
        default:
            return `Command not found: ${cmd}`;
    }
}

// Load file explorer
function loadFileExplorer(container, windowId) {
    container.innerHTML = `
        <div class="file-explorer h-full">
            <div class="file-explorer-toolbar flex items-center">
                <button id="${windowId}-back" type="button" title="Go Back" class="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <input id="${windowId}-path" type="text" title="Current Path" placeholder="Enter path" class="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md" value="${OS.currentDir}">
                <button id="${windowId}-new-folder" class="px-3 py-1 bg-blue-500 text-white rounded-md ml-2">New Folder</button>
                <button id="${windowId}-refresh" type="button" title="Refresh" class="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
            <div class="file-explorer-content">
                <div class="file-explorer-sidebar">
                    <div id="${windowId}-home" class="file-item">
                        <div class="file-icon">🏠</div>
                        <div>Home</div>
                    </div>
                    <div id="${windowId}-documents" class="file-item">
                        <div class="file-icon">📄</div>
                        <div>Documents</div>
                    </div>
                    <div id="${windowId}-applications" class="file-item">
                        <div class="file-icon">📱</div>
                        <div>Applications</div>
                    </div>
                </div>
                <div id="${windowId}-file-list" class="file-explorer-main"></div>
            </div>
        </div>
        <div id="context-menu" class="hidden fixed bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 w-48"></div>
    `;

    const fileList = document.getElementById(`${windowId}-file-list`);
    
    // Add drag-drop handlers
    fileList.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileList.classList.add('bg-blue-100', 'dark:bg-blue-900');
    });
    
    fileList.addEventListener('dragleave', () => {
        fileList.classList.remove('bg-blue-100', 'dark:bg-blue-900');
    });
    
    fileList.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileList.classList.remove('bg-blue-100', 'dark:bg-blue-900');
        
        const files = Array.from(e.dataTransfer.files);
        for (const file of files) {
            const content = await file.text();
            const fileName = file.name;
            
            if (Array.isArray(OS.files[OS.currentDir])) {
                OS.files[OS.currentDir].push({
                    name: fileName,
                    content: content,
                    type: fileName.endsWith('.xml') ? 'xml' : (fileName.endsWith('.js') ? 'javascript' : 'text')
                });
                if (fileName.endsWith('.xml') && OS.currentDir === '/home/user/Applications') {
                    scanForXmlApps();
                }
            } else {
                OS.files[OS.currentDir][fileName] = {
                    content: content,
                    type: fileName.endsWith('.js') ? 'javascript' : 'text'
                };
            }
        }
        updateFileList(windowId);
    });

    const pathInput = document.getElementById(`${windowId}-path`);
    pathInput.value = OS.currentDir;

    updateFileList(windowId);

    pathInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const path = pathInput.value;
            if (OS.files[path] !== undefined || path === '/') {
                OS.currentDir = path;
                updateFileList(windowId);
            } else {
                alert('Directory not found');
                pathInput.value = OS.currentDir;
            }
        }
    });

    document.getElementById(`${windowId}-back`).addEventListener('click', () => {
        const parts = OS.currentDir.split('/');
        parts.pop();
        OS.currentDir = parts.length > 1 ? parts.join('/') : '/';
        updateFileList(windowId);
    });

    document.getElementById(`${windowId}-refresh`).addEventListener('click', () => {
        updateFileList(windowId);
    });

    document.getElementById(`${windowId}-home`).addEventListener('click', () => {
        OS.currentDir = '/home/user';
        updateFileList(windowId);
    });

    document.getElementById(`${windowId}-documents`).addEventListener('click', () => {
        OS.currentDir = '/home/user/Documents';
        updateFileList(windowId);
    });

    document.getElementById(`${windowId}-applications`).addEventListener('click', () => {
        OS.currentDir = '/home/user/Applications';
        updateFileList(windowId);
    });

    document.getElementById(`${windowId}-new-folder`).addEventListener('click', () => {
        const folderName = prompt('Enter folder name:');
        if (folderName) {
            const newPath = `${OS.currentDir}/${folderName}`;
            OS.files[newPath] = {};
            updateFileList(windowId);
        }
    });
}

// Update file list in file explorer
function updateFileList(windowId) {
    const fileList = document.getElementById(`${windowId}-file-list`);
    const pathInput = document.getElementById(`${windowId}-path`);
    pathInput.value = OS.currentDir;
    fileList.innerHTML = '';

    if (OS.currentDir !== '/') {
        const parentItem = document.createElement('div');
        parentItem.className = 'file-item';
        parentItem.innerHTML = `
            <div class="file-icon">📁</div>
            <div>..</div>
        `;
        parentItem.addEventListener('click', () => {
            const parts = OS.currentDir.split('/');
            parts.pop();
            OS.currentDir = parts.length > 1 ? parts.join('/') : '/';
            updateFileList(windowId);
        });
        fileList.appendChild(parentItem);
    }

    // Applications folder: array of files
    if (Array.isArray(OS.files[OS.currentDir])) {
        OS.files[OS.currentDir].forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            const isXmlApp = file.type === 'xml' && file.name.startsWith('app.') && file.name.endsWith('.xml');
            fileItem.innerHTML = `
                <div class="file-icon">${isXmlApp ? '📱' : '📄'}</div>
                <div>${file.name}</div>
            `;
            fileItem.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showContextMenu(e, file.name, false, isXmlApp, windowId);
            });
            fileItem.addEventListener('dblclick', () => {
                openFile(file);
            });
            fileList.appendChild(fileItem);
        });
    } else if (typeof OS.files[OS.currentDir] === 'object') {
        // Object-based directory
        Object.keys(OS.files[OS.currentDir]).forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            const isDirectory = typeof OS.files[OS.currentDir][file] === 'object' && !Array.isArray(OS.files[OS.currentDir][file]);
            fileItem.innerHTML = `
                <div class="file-icon">${isDirectory ? '📁' : '📄'}</div>
                <div>${file}</div>
            `;
            fileItem.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showContextMenu(e, file, isDirectory, false, windowId);
            });
            fileItem.addEventListener('dblclick', () => {
                if (isDirectory) {
                    OS.currentDir = `${OS.currentDir}/${file}`;
                    updateFileList(windowId);
                } else {
                    openFile({ name: file, ...OS.files[OS.currentDir][file] });
                }
            });
            fileList.appendChild(fileItem);
        });
    }
}

// Add context menu functions
function showContextMenu(event, fileName, isDirectory, isApplication, windowId) {
    event.preventDefault();
    event.stopPropagation();
    const menu = document.getElementById('context-menu');
    menu.innerHTML = '';
    menu.style.left = `${event.pageX}px`;
    menu.style.top = `${event.pageY}px`;

    const getFileData = () => {
        if (Array.isArray(OS.files[OS.currentDir])) {
            return OS.files[OS.currentDir].find(f => f.name === fileName);
        } else {
            return OS.files[OS.currentDir][fileName];
        }
    };

    const menuItems = [
        {
            text: 'Open',
            action: () => {
                if (isDirectory) {
                    OS.currentDir = `${OS.currentDir}/${fileName}`;
                    updateFileList(windowId);
                } else {
                    openFile(getFileData() || { name: fileName });
                }
            }
        },
        {
            text: 'Delete',
            action: () => {
                if (confirm(`Are you sure you want to delete ${fileName}?`)) {
                    if (Array.isArray(OS.files[OS.currentDir])) {
                        OS.files[OS.currentDir] = OS.files[OS.currentDir].filter(f => f.name !== fileName);
                    } else {
                        delete OS.files[OS.currentDir][fileName];
                    }
                    updateFileList(windowId);
                }
            }
        },
        {
            text: 'Rename',
            action: () => {
                const newName = prompt('Enter new name:', fileName);
                if (newName && newName !== fileName) {
                    if (Array.isArray(OS.files[OS.currentDir])) {
                        const fileIndex = OS.files[OS.currentDir].findIndex(f => f.name === fileName);
                        if (fileIndex !== -1) {
                            OS.files[OS.currentDir][fileIndex].name = newName;
                        }
                    } else {
                        OS.files[OS.currentDir][newName] = OS.files[OS.currentDir][fileName];
                        delete OS.files[OS.currentDir][fileName];
                    }
                    updateFileList(windowId);
                }
            }
        }
    ];

    // Add JavaScript compilation option
    if (fileName.endsWith('.js')) {
        menuItems.push({
            text: 'Compile & Run',
            action: () => {
                const fileData = Array.isArray(OS.files[OS.currentDir]) ? 
                    OS.files[OS.currentDir].find(f => f.name === fileName) :
                    OS.files[OS.currentDir][fileName];
                
                if (fileData) {
                    try {
                        const compiled = new Function(fileData.content);
                        compiled();
                    } catch (error) {
                        alert(`Compilation error: ${error.message}`);
                    }
                }
            }
        });
    }

    // Add compression options
    if (!isApplication && !isDirectory) {
        menuItems.push({
            text: 'Compress',
            action: () => {
                const fileData = Array.isArray(OS.files[OS.currentDir]) ? 
                    OS.files[OS.currentDir].find(f => f.name === fileName) :
                    OS.files[OS.currentDir][fileName];
                
                const compressed = btoa(JSON.stringify(fileData));
                if (Array.isArray(OS.files[OS.currentDir])) {
                    OS.files[OS.currentDir].push({
                        name: `${fileName}.zip`,
                        content: compressed,
                        type: 'compressed',
                        originalName: fileName
                    });
                } else {
                    OS.files[OS.currentDir][`${fileName}.zip`] = {
                        content: compressed,
                        type: 'compressed',
                        originalName: fileName
                    };
                }
                updateFileList(windowId);
            }
        });
    }

    if (fileName.endsWith('.zip')) {
        menuItems.push({
            text: 'Decompress',
            action: () => {
                try {
                    const fileData = Array.isArray(OS.files[OS.currentDir]) ? 
                        OS.files[OS.currentDir].find(f => f.name === fileName) :
                        OS.files[OS.currentDir][fileName];
                    
                    const decompressed = JSON.parse(atob(fileData.content));
                    const originalName = fileData.originalName;
                    
                    if (Array.isArray(OS.files[OS.currentDir])) {
                        OS.files[OS.currentDir].push({
                            ...decompressed,
                            name: originalName
                        });
                    } else {
                        OS.files[OS.currentDir][originalName] = decompressed;
                    }
                    updateFileList(windowId);
                } catch (error) {
                    alert('Error decompressing file');
                }
            }
        });
    }

    // Create menu items
    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer';
        menuItem.textContent = item.text;
        menuItem.addEventListener('click', () => {
            item.action();
            hideContextMenu();
        });
        menu.appendChild(menuItem);
    });

    menu.classList.remove('hidden');
    OS.contextMenuActive = true;

    // Hide context menu when clicking outside
    const hideMenu = (e) => {
        if (!menu.contains(e.target)) {
            hideContextMenu();
            document.removeEventListener('click', hideMenu);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', hideMenu);
    }, 0);
}

// Update hideContextMenu function
function hideContextMenu() {
    if (OS.contextMenuActive) {
        const menu = document.getElementById('context-menu');
        menu.classList.add('hidden');
        OS.contextMenuActive = false;
    }
}

// Open file
function openFile(file) {
    if (file.type === 'xml') {
        try {
            const app = parseXmlApp(file.content);
            if (app) {
                // Check if already installed in Applications folder
                const appsFolder = OS.files['/home/user/Applications'];
                const fileName = `app.${app.id}.xml`;
                const alreadyInFolder = appsFolder.some(f => f.name === fileName);
                if (!alreadyInFolder) {
                    appsFolder.push({
                        name: fileName,
                        content: file.content,
                        type: 'xml'
                    });
                }
                scanForXmlApps();
                alert(`App "${app.name}" installed! It is now available on the desktop and start menu.`);
            }
        } catch (error) {
            alert('Error installing XML app: ' + error.message);
        }
    } else {
        const windowId = 'window-' + OS.nextWindowId++;
        const windowElement = document.createElement('div');
        windowElement.className = 'window';
        windowElement.id = windowId;
        windowElement.style.width = '600px';
        windowElement.style.height = '400px';
        windowElement.style.top = '80px';
        windowElement.style.zIndex = OS.maxZIndex++;
        windowElement.innerHTML = `
            <div class="window-header dynamic-bg-color" data-bg-color="#2196F3">
                <div class="flex items-center">
                    <span class="mr-2">📝</span>
                    <span>${file.name}</span>
                </div>
                <div class="flex space-x-2">
                    <button class="minimize-btn w-5 h-5 flex items-center justify-center rounded-full bg-yellow-400 hover:bg-yellow-500" title="Minimize">
                        <svg class="w-3 h-3 text-yellow-900" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M19,13H5V11H19V13Z" />
                        </svg>
                    </button>
                    <button class="maximize-btn w-5 h-5 flex items-center justify-center rounded-full bg-green-400 hover:bg-green-500" title="Maximize">
                        <svg class="w-3 h-3 text-green-900" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M4,4H20V20H4V4M6,8V18H18V8H6Z" />
                        </svg>
                    </button>
                    <button class="close-btn w-5 h-5 flex items-center justify-center rounded-full bg-red-400 hover:bg-red-500" title="Close">
                        <svg class="w-3 h-3 text-red-900" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                        </svg>
                    </button>
                </div>
            </div>
            <div class="window-content">
                <textarea 
                    class="w-full h-full" 
                    readonly 
                    title="File content"
                    placeholder="File content will appear here">${file.content}</textarea>
            </div>
        `;
        document.getElementById('desktop').appendChild(windowElement);
        addWindowToTaskbar({
            id: 'editor',
            name: 'Text Editor',
            icon: '📝',
            color: '#2196F3'
        }, windowId);
        OS.windows.push({
            id: windowId,
            appId: 'editor',
            minimized: false,
            maximized: false,
            file: file
        });
        makeWindowDraggable(windowId);
        setupWindowControls(windowId);
    }
}

// Make window draggable
function makeWindowDraggable(windowId) {
    const windowElement = document.getElementById(windowId);
    const header = windowElement.querySelector('.window-header');
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - windowElement.offsetLeft;
        offsetY = e.clientY - windowElement.offsetTop;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const newX = e.clientX - offsetX;
        const newY = e.clientY - offsetY;

        const maxX = document.documentElement.clientWidth - windowElement.offsetWidth;
        const maxY = document.documentElement.clientHeight - windowElement.offsetHeight - 40;

        windowElement.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
        windowElement.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// Setup window controls
function setupWindowControls(windowId) {
    const windowElement = document.getElementById(windowId);
    
    windowElement.querySelector('.close-btn').addEventListener('click', () => {
        closeWindow(windowId);
    });
    
    windowElement.querySelector('.minimize-btn').addEventListener('click', () => {
        minimizeWindow(windowId);
    });
    
    windowElement.querySelector('.maximize-btn').addEventListener('click', () => {
        toggleMaximizeWindow(windowId);
    });
}

// Set active window
function setActiveWindow(windowId) {
    OS.activeWindowId = windowId;
    const windowElement = document.getElementById(windowId);
    if (windowElement) {
        windowElement.style.zIndex = OS.maxZIndex++;
    }
    updateTaskbar();
}

// Update taskbar
function updateTaskbar() {
    const taskbarItems = document.querySelectorAll('#taskbar-apps .taskbar-item');
    taskbarItems.forEach(item => {
        item.classList.remove('taskbar-item-active');
        if (item.dataset.windowId === OS.activeWindowId) {
            const window = OS.windows.find(w => w.id === OS.activeWindowId);
            if (window && !window.minimized) {
                item.classList.add('taskbar-item-active');
            }
        }
    });
}

// Close window
function closeWindow(windowId) {
    const windowElement = document.getElementById(windowId);
    if (windowElement) {
        windowElement.remove();
    }

    const windowIndex = OS.windows.findIndex(w => w.id === windowId);
    if (windowIndex >= 0) {
        OS.windows.splice(windowIndex, 1);
    }

    const taskbarItem = document.querySelector(`.taskbar-item[data-window-id="${windowId}"]`);
    if (taskbarItem) {
        taskbarItem.remove();
    }

    if (OS.activeWindowId === windowId) {
        const topWindow = OS.windows.filter(w => !w.minimized).sort((a, b) => {
            return b.zIndex - a.zIndex;
        })[0];
        
        if (topWindow) {
            setActiveWindow(topWindow.id);
        } else {
            OS.activeWindowId = null;
            updateTaskbar();
        }
    }
}

// Minimize window
function minimizeWindow(windowId) {
    const windowElement = document.getElementById(windowId);
    if (windowElement) {
        windowElement.style.display = 'none';
    }

    const window = OS.windows.find(w => w.id === windowId);
    if (window) {
        window.minimized = true;
    }

    if (OS.activeWindowId === windowId) {
        const topWindow = OS.windows.filter(w => !w.minimized).sort((a, b) => {
            return b.zIndex - a.zIndex;
        })[0];

        if (topWindow) {
            setActiveWindow(topWindow.id);
        } else {
            OS.activeWindowId = null;
            updateTaskbar();
        }
    } else {
        updateTaskbar();
    }
}

// Toggle maximize window
function toggleMaximizeWindow(windowId) {
    const windowElement = document.getElementById(windowId);
    if (!windowElement) return;

    const window = OS.windows.find(w => w.id === windowId);
    if (!window) return;

    if (window.maximized) {
        windowElement.style.left = window.prevLeft || '100px';
        windowElement.style.top = window.prevTop || '80px';
        windowElement.style.width = window.prevWidth || '600px';
        windowElement.style.height = window.prevHeight || '400px';
        window.maximized = false;
    } else {
        window.prevLeft = windowElement.style.left;
        window.prevTop = windowElement.style.top;
        window.prevWidth = windowElement.style.width;
        window.prevHeight = windowElement.style.height;

        windowElement.style.left = '0';
        windowElement.style.top = '0';
        windowElement.style.width = '100%';
        windowElement.style.height = 'calc(100% - 40px)'; // 40px for taskbar
        window.maximized = true;
    }
}

// Toggle start menu
function toggleStartMenu() {
    const startMenu = document.getElementById('start-menu');
    startMenu.classList.toggle('hidden');
}

// Toggle theme
function toggleTheme() {
    document.documentElement.classList.toggle('dark');
}

// Update clock
function updateClock() {
    const clockElement = document.getElementById('clock');
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    clockElement.textContent = `${hours}:${minutes}`;
}

// Power off
function powerOff() {
    if (confirm('Are you sure you want to power off HTML OS?')) {
        document.body.innerHTML = `
            <div class="flex items-center justify-center h-screen bg-black text-white">
                <div class="text-center">
                    <div class="text-3xl mb-4">HTML OS has been powered off</div>
                    <div class="text-lg">Refresh the page to restart</div>
                </div>
            </div>
        `;
    }
}

function loadTextEditor(container, windowId) {
    container.innerHTML = `
        <div class="text-editor">
            <div class="text-editor-toolbar">
                <button id="${windowId}-save-btn" class="px-2 py-1 text-sm bg-primary text-white rounded">Save</button>
                <button id="${windowId}-new-btn" class="px-2 py-1 text-sm bg-gray-300 dark:bg-gray-700 rounded ml-1">New</button>
            </div>
            <div class="text-editor-content">
                <textarea id="${windowId}-editor" class="w-full h-full p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"></textarea>
            </div>
        </div>
    `;
    
    // Focus textarea on load
    setTimeout(() => {
        document.getElementById(`${windowId}-editor`).focus();
    }, 100);
    
    // New button
    document.getElementById(`${windowId}-new-btn`).addEventListener('click', () => {
        if (document.getElementById(`${windowId}-editor`).value.trim() !== '') {
            if (confirm('Discard current changes?')) {
                document.getElementById(`${windowId}-editor`).value = '';
            }
        } else {
            document.getElementById(`${windowId}-editor`).value = '';
        }
    });
    
    // Save button
    document.getElementById(`${windowId}-save-btn`).addEventListener('click', () => {
        const fileName = prompt('Enter file name:', 'new_file.txt');
        if (fileName) {
            const content = document.getElementById(`${windowId}-editor`).value;
            const savePath = '/home/user/Documents';
            
            const existingFileIndex = OS.files[savePath]?.[fileName] ? fileName : null;
            
            if (existingFileIndex !== null) {
                if (confirm(`File ${fileName} already exists. Overwrite?`)) {
                    OS.files[savePath][fileName] = {
                        content: content,
                        type: 'text'
                    };
                }
            } else {
                if (!OS.files[savePath]) {
                    OS.files[savePath] = {};
                }
                
                OS.files[savePath][fileName] = {
                    content: content,
                    type: 'text'
                };
            }
            alert(`File saved to Documents/${fileName}`);
        }
    });
}

function loadAppMaker(container, windowId) {
    container.innerHTML = `
        <div class="app-maker h-full flex flex-col">
            <div class="toolbar flex p-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                <button id="${windowId}-new" class="px-2 py-1 bg-primary text-white rounded mr-2">New</button>
                <button id="${windowId}-save" class="px-2 py-1 bg-green-500 text-white rounded mr-2">Save</button>
                <button id="${windowId}-export" class="px-2 py-1 bg-blue-500 text-white rounded">Export JS</button>
            </div>
            <div class="flex-1 grid grid-cols-2 gap-4 p-4">
                <div class="flex flex-col">
                    <label class="mb-2">App Properties</label>
                    <input type="text" id="${windowId}-app-id" placeholder="App ID" class="mb-2 p-2 border rounded">
                    <input type="text" id="${windowId}-app-name" placeholder="App Name" class="mb-2 p-2 border rounded">
                    <input type="text" id="${windowId}-app-icon" placeholder="App Icon (emoji)" class="mb-2 p-2 border rounded">
                    <input type="text" id="${windowId}-app-color" placeholder="App Color (hex)" class="mb-2 p-2 border rounded">
                    <label class="mb-2">HTML Content</label>
                    <textarea id="${windowId}-app-html" placeholder="<div>Your app HTML here</div>" class="flex-1 p-2 border rounded font-mono"></textarea>
                </div>
                <div class="flex flex-col">
                    <label class="mb-2">JavaScript Code</label>
                    <textarea id="${windowId}-app-js" placeholder="function initApp(container) {
    // Your initialization code here
}" class="flex-1 p-2 border rounded font-mono"></textarea>
                </div>
            </div>
        </div>
    `;

    const newBtn = document.getElementById(`${windowId}-new`);
    const saveBtn = document.getElementById(`${windowId}-save`);
    const exportBtn = document.getElementById(`${windowId}-export`);

    function getAppData() {
        return {
            id: document.getElementById(`${windowId}-app-id`).value.trim(),
            name: document.getElementById(`${windowId}-app-name`).value.trim(),
            icon: document.getElementById(`${windowId}-app-icon`).value.trim(),
            color: document.getElementById(`${windowId}-app-color`).value.trim(),
            html: document.getElementById(`${windowId}-app-html`).value.trim(),
            script: document.getElementById(`${windowId}-app-js`).value.trim()
        };
    }

    newBtn.addEventListener('click', () => {
        if (confirm('Clear all fields?')) {
            document.getElementById(`${windowId}-app-id`).value = '';
            document.getElementById(`${windowId}-app-name`).value = '';
            document.getElementById(`${windowId}-app-icon`).value = '';
            document.getElementById(`${windowId}-app-color`).value = '';
            document.getElementById(`${windowId}-app-html`).value = '';
            document.getElementById(`${windowId}-app-js`).value = '';
        }
    });

    saveBtn.addEventListener('click', () => {
        const appData = getAppData();
        if (!appData.id || !appData.name) {
            alert('App ID and Name are required!');
            return;
        }

        const xmlContent = `<app>
<id>${appData.id}</id>
<name>${appData.name}</name>
<icon>${appData.icon || '📱'}</icon>
<color>${appData.color || '#5D5CDE'}</color>
<html>${appData.html}</html>
<script>${appData.script}</script>
</app>`;

        const fileName = `app.${appData.id}.xml`;
        // Prevent duplicate app files in Applications
        const appsFolder = OS.files['/home/user/Applications'];
        const existingIndex = appsFolder.findIndex(f => f.name === fileName);
        if (existingIndex !== -1) {
            if (!confirm('App file already exists. Overwrite?')) return;
            appsFolder[existingIndex] = {
                name: fileName,
                content: xmlContent,
                type: 'xml'
            };
        } else {
            appsFolder.push({
                name: fileName,
                content: xmlContent,
                type: 'xml'
            });
        }
        alert(`App saved as ${fileName}`);
        scanForXmlApps();
        // If file explorer is open in Applications, update it
        document.querySelectorAll('.window-content').forEach(win => {
            if (win.querySelector('.file-explorer-toolbar')) {
                const pathInput = win.querySelector('input[title="Current Path"]');
                if (pathInput && pathInput.value === '/home/user/Applications') {
                    const winId = win.closest('.window').id;
                    updateFileList(winId);
                }
            }
        });
    });

    exportBtn.addEventListener('click', () => {
        const appData = getAppData();
        if (!appData.id) {
            alert('App ID is required!');
            return;
        }

        const jsContent = `// ${appData.name} (${appData.id}) - HTML OS App
const appContent = \`${appData.html}\`;
${appData.script}`;

        const blob = new Blob([jsContent], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${appData.id}.js`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// Add desktop drag-drop support
document.getElementById('desktop').addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

document.getElementById('desktop').addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
        const content = await file.text();
        const fileName = file.name;
        
        if (fileName.endsWith('.xml')) {
            OS.files['/home/user/Applications'].push({
                name: fileName,
                content: content,
                type: 'xml'
            });
            scanForXmlApps();
        } else {
            OS.files['/home/user/Documents'][fileName] = {
                content: content,
                type: fileName.endsWith('.js') ? 'javascript' : 'text'
            };
        }
    }
});
