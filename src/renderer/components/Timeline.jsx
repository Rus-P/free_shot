import React, { useRef, useCallback } from 'react';
import '../styles/timeline.css';

export default function Timeline({ duration, currentTime, trimStart, trimEnd, onSeek, onTrimStartChange, onTrimEndChange }) {
  const trackRef = useRef(null);

  const getTimeFromX = useCallback((clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * duration;
  }, [duration]);

  const handleTrackClick = (e) => {
    if (e.target.classList.contains('trim-handle')) return;
    onSeek(getTimeFromX(e.clientX));
  };

  const startDrag = (setter, minVal, maxVal) => (e) => {
    e.stopPropagation();
    const onMove = (ev) => {
      const t = getTimeFromX(ev.clientX);
      setter(Math.max(minVal ?? 0, Math.min(maxVal ?? duration, t)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const pct = (t) => duration > 0 ? `${(t / duration) * 100}%` : '0%';

  return (
    <div className="timeline" ref={trackRef} onClick={handleTrackClick}>
      {/* Trim region */}
      <div className="trim-region" style={{ left: pct(trimStart), width: pct(trimEnd - trimStart) }} />

      {/* Dim outside trim */}
      <div className="trim-dim" style={{ left: 0, width: pct(trimStart) }} />
      <div className="trim-dim" style={{ left: pct(trimEnd), right: 0, width: 'auto' }} />

      {/* Trim handles */}
      <div
        className="trim-handle trim-handle-start"
        style={{ left: pct(trimStart) }}
        onMouseDown={startDrag(onTrimStartChange, 0, trimEnd - 0.5)}
      />
      <div
        className="trim-handle trim-handle-end"
        style={{ left: pct(trimEnd) }}
        onMouseDown={startDrag(onTrimEndChange, trimStart + 0.5, duration)}
      />

      {/* Playhead */}
      <div className="playhead" style={{ left: pct(currentTime) }} />
    </div>
  );
}
