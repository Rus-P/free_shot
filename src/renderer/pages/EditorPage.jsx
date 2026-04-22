import React, { useState, useRef, useEffect, useCallback } from 'react';
import Timeline from '../components/Timeline';
import '../styles/editor.css';

export default function EditorPage({ recordedData, onBack }) {
  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrent] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [subtitles, setSubtitles] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (recordedData?.blob) {
      const url = URL.createObjectURL(recordedData.blob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [recordedData]);

  const onLoadedMetadata = () => {
    const dur = videoRef.current.duration;
    setVideoDuration(dur);
    setTrimEnd(dur);
  };

  const onTimeUpdate = () => {
    const t = videoRef.current.currentTime;
    setCurrent(t);
    // Stop at trim end
    if (t >= trimEnd) {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      if (videoRef.current.currentTime < trimStart) {
        videoRef.current.currentTime = trimStart;
      }
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const seek = (time) => {
    videoRef.current.currentTime = time;
    setCurrent(time);
  };

  const changeSpeed = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
  };

  // Generate subtitles with Whisper (placeholder - would call local Whisper)
  const generateSubtitles = useCallback(async () => {
    setGenerating(true);
    // In production, this would extract audio and run Whisper
    // For now, simulate
    setTimeout(() => {
      setSubtitles([
        { start: 0, end: 3, text: '（字幕将由 Whisper 自动生成）' },
        { start: 3, end: 6, text: '正在录制屏幕演示...' },
      ]);
      setGenerating(false);
    }, 2000);
  }, [recordedData]);

  // Export as MP4/WebM
  const exportVideo = async () => {
    if (!recordedData?.blob) return;
    const buffer = await recordedData.blob.arrayBuffer();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await window.electronAPI.saveFile({
      buffer: Array.from(new Uint8Array(buffer)),
      defaultName: `FreeShot_${timestamp}.webm`,
    });
  };

  // Export as GIF
  const exportGif = async () => {
    // In production, use FFmpeg to convert trimmed section to GIF
    // For now, export as webm with a note
    if (!recordedData?.blob) return;
    const buffer = await recordedData.blob.arrayBuffer();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await window.electronAPI.saveFile({
      buffer: Array.from(new Uint8Array(buffer)),
      defaultName: `FreeShot_${timestamp}.gif`,
    });
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className="editor-page">
      <div className="editor-header">
        <button className="btn-ghost" onClick={onBack}>← 返回</button>
        <h2>编辑录像</h2>
        <div className="editor-actions">
          <button className="btn-ghost" onClick={generateSubtitles} disabled={generating}>
            {generating ? '⏳ 生成中...' : '💬 生成字幕'}
          </button>
          <button className="btn-ghost" onClick={exportGif}>🖼 导出 GIF</button>
          <button className="btn-primary" onClick={exportVideo}>💾 导出视频</button>
        </div>
      </div>

      <div className="editor-body">
        <div className="video-container">
          <video
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
            className="editor-video"
          />
          {/* Subtitle overlay */}
          {subtitles && (
            <div className="subtitle-overlay">
              {subtitles.filter(s => currentTime >= s.start && currentTime <= s.end).map((s, i) => (
                <span key={i} className="subtitle-text">{s.text}</span>
              ))}
            </div>
          )}
        </div>

        <div className="editor-controls">
          <button className="btn-icon play-btn" onClick={togglePlay}>
            {playing ? '⏸' : '▶'}
          </button>
          <span className="time-display">
            {formatTime(currentTime)} / {formatTime(videoDuration)}
          </span>
          <div className="speed-control">
            <span className="speed-label">速度</span>
            {[0.5, 1, 1.5, 2].map(r => (
              <button
                key={r}
                className={`speed-btn ${playbackRate === r ? 'active' : ''}`}
                onClick={() => changeSpeed(r)}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>

        <Timeline
          duration={videoDuration}
          currentTime={currentTime}
          trimStart={trimStart}
          trimEnd={trimEnd}
          onSeek={seek}
          onTrimStartChange={setTrimStart}
          onTrimEndChange={setTrimEnd}
        />

        <div className="trim-info">
          <span>裁剪区间: {formatTime(trimStart)} - {formatTime(trimEnd)}</span>
          <span className="trim-duration">时长: {formatTime(trimEnd - trimStart)}</span>
        </div>
      </div>
    </div>
  );
}
