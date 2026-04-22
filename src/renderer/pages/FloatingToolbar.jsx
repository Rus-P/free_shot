import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/toolbar.css';

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function FloatingToolbar() {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [drawMode, setDrawMode] = useState(false);
  const [region, setRegion] = useState(null);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Receive region from main process
  useEffect(() => {
    window.electronAPI.onRecordingRegion((r) => {
      setRegion(r);
      startRecording(r);
    });
  }, []);

  const startRecording = useCallback(async (r) => {
    try {
      const sources = await window.electronAPI.getSources();
      const screenSource = sources[0]; // primary screen
      if (!screenSource) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: screenSource.id,
          },
        },
      });

      // Try to get mic audio
      let finalStream = stream;
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        finalStream = new MediaStream([
          ...stream.getVideoTracks(),
          ...micStream.getAudioTracks(),
        ]);
      } catch {
        // no mic, continue
      }

      const recorder = new MediaRecorder(finalStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000,
      });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(100);
      recorderRef.current = recorder;
      setRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch (e) {
      console.error('Failed to start recording:', e);
    }
  }, []);

  const togglePause = () => {
    const rec = recorderRef.current;
    if (!rec) return;
    if (paused) {
      rec.resume();
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      setPaused(false);
    } else {
      rec.pause();
      clearInterval(timerRef.current);
      setPaused(true);
    }
  };

  const stopRecording = async () => {
    const rec = recorderRef.current;
    if (!rec) return;

    clearInterval(timerRef.current);

    return new Promise((resolve) => {
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const buffer = await blob.arrayBuffer();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await window.electronAPI.saveFile({
          buffer: Array.from(new Uint8Array(buffer)),
          defaultName: `FreeShot_${timestamp}.webm`,
        });
        rec.stream.getTracks().forEach(t => t.stop());
        window.electronAPI.stopRecording();
        resolve();
      };
      rec.stop();
    });
  };

  const toggleDraw = () => {
    const next = !drawMode;
    setDrawMode(next);
    window.electronAPI.toggleAnnotation(next);
  };

  const clearDraw = () => {
    window.electronAPI.clearAnnotations();
  };

  return (
    <div className="floating-toolbar">
      <div className={`rec-dot ${paused ? 'paused' : ''}`} />
      <span className="tb-time">{formatTime(duration)}</span>
      <div className="tb-divider" />

      <button className="tb-action" onClick={togglePause} title={paused ? '继续' : '暂停'}>
        {paused ? '▶' : '⏸'}
      </button>
      <button className="tb-action stop" onClick={stopRecording} title="停止">⏹</button>

      <div className="tb-divider" />

      <button className={`tb-action ${drawMode ? 'active' : ''}`} onClick={toggleDraw} title="画笔标注">
        ✏
      </button>
      <button className="tb-action" onClick={clearDraw} title="清除标注">🗑</button>
    </div>
  );
}
