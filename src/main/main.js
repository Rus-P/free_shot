const { app, BrowserWindow, ipcMain, desktopCapturer, screen, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let selectionWindow;
let toolbarWindow;
let annotationWindow;

const isDev = !app.isPackaged;
const preload = path.join(__dirname, 'preload.js');

// ─── Main Window (compact settings panel) ─────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 480,
    resizable: false,
    webPreferences: { preload, contextIsolation: true, nodeIntegration: false },
    frame: false,
    icon: path.join(__dirname, '../../assets/icon.png'),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
  }
}

// ─── Region Selection Overlay (fullscreen, semi-transparent) ──
function openSelectionOverlay() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.size;

  selectionWindow = new BrowserWindow({
    x: 0, y: 0, width, height,
    transparent: true, frame: false, alwaysOnTop: true,
    skipTaskbar: true, resizable: false, fullscreen: true,
    hasShadow: false,
    webPreferences: { preload, contextIsolation: true, nodeIntegration: false },
  });
  selectionWindow.setAlwaysOnTop(true, 'screen-saver');

  const url = isDev
    ? 'http://localhost:5173/#/selection'
    : `file://${path.join(__dirname, '../../dist/renderer/index.html')}#/selection`;
  selectionWindow.loadURL(url);
}

// ─── Floating Toolbar (small bar at top center) ───────────────
function openToolbar() {
  const display = screen.getPrimaryDisplay();
  const tbWidth = 380;

  toolbarWindow = new BrowserWindow({
    x: Math.round((display.size.width - tbWidth) / 2), y: 10,
    width: tbWidth, height: 52,
    transparent: true, frame: false, alwaysOnTop: true,
    skipTaskbar: true, resizable: false, hasShadow: false,
    webPreferences: { preload, contextIsolation: true, nodeIntegration: false },
  });
  toolbarWindow.setAlwaysOnTop(true, 'screen-saver');

  const url = isDev
    ? 'http://localhost:5173/#/toolbar'
    : `file://${path.join(__dirname, '../../dist/renderer/index.html')}#/toolbar`;
  toolbarWindow.loadURL(url);
}

function closeToolbar() {
  if (toolbarWindow && !toolbarWindow.isDestroyed()) { toolbarWindow.close(); toolbarWindow = null; }
}

// ─── Annotation Canvas Overlay ────────────────────────────────
function openAnnotation(region) {
  annotationWindow = new BrowserWindow({
    x: region.x, y: region.y, width: region.width, height: region.height,
    transparent: true, frame: false, alwaysOnTop: true,
    skipTaskbar: true, resizable: false, hasShadow: false,
    webPreferences: { preload, contextIsolation: true, nodeIntegration: false },
  });
  annotationWindow.setAlwaysOnTop(true, 'screen-saver');
  annotationWindow.setIgnoreMouseEvents(true, { forward: true });

  const url = isDev
    ? 'http://localhost:5173/#/annotation'
    : `file://${path.join(__dirname, '../../dist/renderer/index.html')}#/annotation`;
  annotationWindow.loadURL(url);
}

function closeAnnotation() {
  if (annotationWindow && !annotationWindow.isDestroyed()) { annotationWindow.close(); annotationWindow = null; }
}

// ─── App Lifecycle ────────────────────────────────────────────
app.whenReady().then(() => {
  createMainWindow();
  globalShortcut.register('Alt+Shift+R', () => {
    mainWindow.webContents.send('shortcut-start');
  });
});
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ─── IPC: Recording Flow ──────────────────────────────────────

// Step 1: hide main → show selection overlay
ipcMain.handle('start-selection', () => {
  mainWindow.hide();
  openSelectionOverlay();
});

// Step 2: region drawn → close selection, open toolbar + annotation
ipcMain.handle('region-selected', (event, region) => {
  if (selectionWindow && !selectionWindow.isDestroyed()) { selectionWindow.close(); selectionWindow = null; }
  openToolbar();
  openAnnotation(region);
  // Send region to toolbar once loaded
  if (toolbarWindow) {
    toolbarWindow.webContents.once('did-finish-load', () => {
      toolbarWindow.webContents.send('recording-region', region);
    });
  }
});

// Cancel selection → back to main
ipcMain.handle('cancel-selection', () => {
  if (selectionWindow && !selectionWindow.isDestroyed()) { selectionWindow.close(); selectionWindow = null; }
  mainWindow.show();
});

// Stop recording → clean up, show main with editor
ipcMain.handle('stop-recording', (event, recordingData) => {
  closeToolbar();
  closeAnnotation();
  mainWindow.show();
  mainWindow.webContents.send('recording-stopped', recordingData);
});

// Toggle annotation draw mode
ipcMain.handle('toggle-annotation', (event, enabled) => {
  if (annotationWindow && !annotationWindow.isDestroyed()) {
    if (enabled) {
      annotationWindow.setIgnoreMouseEvents(false);
      annotationWindow.focus();
    } else {
      annotationWindow.setIgnoreMouseEvents(true, { forward: true });
    }
  }
});

ipcMain.handle('clear-annotations', () => {
  if (annotationWindow && !annotationWindow.isDestroyed()) {
    annotationWindow.webContents.send('clear-canvas');
  }
});

// ─── IPC: Utility ─────────────────────────────────────────────
ipcMain.handle('get-sources', async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 320, height: 180 } });
  return sources.map(s => ({ id: s.id, name: s.name }));
});

ipcMain.handle('save-file', async (event, { buffer, defaultName }) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'Video', extensions: ['webm', 'mp4'] },
      { name: 'GIF', extensions: ['gif'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (filePath) {
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return filePath;
  }
  return null;
});

ipcMain.handle('window-minimize', () => mainWindow.minimize());
ipcMain.handle('window-close', () => mainWindow.close());
