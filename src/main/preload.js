const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Recording flow
  startSelection: () => ipcRenderer.invoke('start-selection'),
  regionSelected: (region) => ipcRenderer.invoke('region-selected', region),
  cancelSelection: () => ipcRenderer.invoke('cancel-selection'),
  stopRecording: (data) => ipcRenderer.invoke('stop-recording', data),

  // Annotation
  toggleAnnotation: (enabled) => ipcRenderer.invoke('toggle-annotation', enabled),
  clearAnnotations: () => ipcRenderer.invoke('clear-annotations'),

  // Sources & files
  getSources: () => ipcRenderer.invoke('get-sources'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),

  // Window
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowClose: () => ipcRenderer.invoke('window-close'),

  // Events from main
  onShortcutStart: (cb) => ipcRenderer.on('shortcut-start', cb),
  onRecordingRegion: (cb) => ipcRenderer.on('recording-region', (e, region) => cb(region)),
  onRecordingStopped: (cb) => ipcRenderer.on('recording-stopped', (e, data) => cb(data)),
  onClearCanvas: (cb) => ipcRenderer.on('clear-canvas', cb),
});
