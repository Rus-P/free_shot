# FreeShot

A lightweight screen recording tool built with Electron + React. Record your screen with webcam overlay, draw annotations in real-time, and edit recordings before export.

## Features

- **Region Selection** — Fullscreen overlay with drag-to-select recording area
- **Floating Toolbar** — Compact always-on-top control bar (pause, stop, draw, clear)
- **Screen Recording** — Captures screen + microphone audio via WebRTC
- **Annotations** — Draw on screen in real-time during recording
- **Video Editor** — Trim clips, adjust playback speed (0.5x–2x)
- **Subtitle Generation** — Whisper-based speech-to-text (placeholder)
- **Export** — Save as WebM or GIF

## Tech Stack

- **Electron** — Desktop shell with multi-window management
- **React** — UI rendering
- **Vite** — Fast dev server and bundler
- **MediaRecorder API** — Screen/audio capture
- **Canvas API** — Region selection & annotation drawing

## Getting Started

```bash
npm install
npm run dev      # Start dev mode (Vite + Electron)
npm run build    # Package for distribution
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Shift+R` | Start recording flow |
| `Esc` | Cancel region selection |

## Project Structure

```
src/
├── main/
│   ├── main.js          # Electron main process, window management, IPC
│   └── preload.js       # Context bridge (secure IPC)
└── renderer/
    ├── App.jsx           # Hash-based router
    ├── pages/
    │   ├── MainPanel.jsx        # Settings panel (webcam, mic toggles)
    │   ├── SelectionOverlay.jsx # Fullscreen region picker
    │   ├── FloatingToolbar.jsx  # Recording controls bar
    │   ├── AnnotationCanvas.jsx # Transparent drawing overlay
    │   └── EditorPage.jsx       # Post-recording editor
    ├── components/
    │   └── Timeline.jsx         # Trim & seek timeline
    └── styles/                  # CSS modules per component
```

## License

ISC