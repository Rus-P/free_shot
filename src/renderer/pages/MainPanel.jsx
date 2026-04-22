import React, { useState, useEffect } from 'react';
import '../styles/mainpanel.css';

export default function MainPanel({ onRecordingComplete }) {
  const [webcam, setWebcam] = useState(true);
  const [mic, setMic] = useState(true);
  const [status, setStatus] = useState('idle'); // idle | waiting

  useEffect(() => {
    window.electronAPI?.onShortcutStart?.(() => {
      handleStart();
    });
  }, []);

  // Listen for recording data back from toolbar
  useEffect(() => {
    window.electronAPI?.onRecordingStopped?.(() => {
      setStatus('idle');
    });
  }, []);

  const handleStart = async () => {
    setStatus('waiting');
    // Store settings for toolbar to read
    sessionStorage.setItem('fs-webcam', webcam ? '1' : '0');
    sessionStorage.setItem('fs-mic', mic ? '1' : '0');
    await window.electronAPI.startSelection();
  };

  return (
    <div className="main-panel">
      <div className="panel-titlebar">
        <span className="panel-title">🎬 FreeShot</span>
        <div className="panel-btns">
          <button className="tb-btn" onClick={() => window.electronAPI?.windowMinimize()}>─</button>
          <button className="tb-btn tb-close" onClick={() => window.electronAPI?.windowClose()}>✕</button>
        </div>
      </div>

      <div className="panel-body">
        <div className="panel-hero">
          <div className="hero-icon">⏺</div>
          <h1>屏幕录制</h1>
          <p>点击开始后，拖拽选择录制区域</p>
        </div>

        <div className="panel-options">
          <label className="option-row">
            <span className="option-icon">📷</span>
            <span className="option-label">摄像头</span>
            <input type="checkbox" checked={webcam} onChange={e => setWebcam(e.target.checked)} />
          </label>
          <label className="option-row">
            <span className="option-icon">🎤</span>
            <span className="option-label">麦克风</span>
            <input type="checkbox" checked={mic} onChange={e => setMic(e.target.checked)} />
          </label>
        </div>

        <button className="start-button" onClick={handleStart} disabled={status !== 'idle'}>
          {status === 'idle' ? '开始录制' : '选择区域中...'}
        </button>

        <div className="shortcut-hint">
          快捷键: <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>
        </div>
      </div>
    </div>
  );
}
