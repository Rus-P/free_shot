import React, { useRef, useState, useEffect, useCallback } from 'react';
import '../styles/selection.css';

export default function SelectionOverlay() {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [start, setStart] = useState(null);
  const [rect, setRect] = useState(null);

  // Draw the overlay mask + selection rectangle
  const draw = useCallback((currentRect) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Semi-transparent dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, w, h);

    if (currentRect) {
      const r = normalizeRect(currentRect);
      // Clear the selected region (make it transparent)
      ctx.clearRect(r.x, r.y, r.width, r.height);

      // Dashed border
      ctx.strokeStyle = '#6c5ce7';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(r.x, r.y, r.width, r.height);

      // Dimension label
      ctx.setLineDash([]);
      ctx.fillStyle = '#6c5ce7';
      ctx.font = '13px sans-serif';
      const label = `${r.width} × ${r.height}`;
      const tw = ctx.measureText(label).width;
      ctx.fillRect(r.x, r.y - 22, tw + 12, 20);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, r.x + 6, r.y - 7);
    }
  }, []);

  // Init canvas to screen size
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw(null);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        window.electronAPI.cancelSelection();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [draw]);

  const onMouseDown = (e) => {
    setDrawing(true);
    setStart({ x: e.clientX, y: e.clientY });
    setRect(null);
  };

  const onMouseMove = (e) => {
    if (!drawing || !start) return;
    const r = { x: start.x, y: start.y, x2: e.clientX, y2: e.clientY };
    setRect(r);
    draw(r);
  };

  const onMouseUp = (e) => {
    if (!drawing || !start) return;
    setDrawing(false);
    const r = normalizeRect({ x: start.x, y: start.y, x2: e.clientX, y2: e.clientY });

    if (r.width < 50 || r.height < 50) {
      // Too small, reset
      draw(null);
      setRect(null);
      return;
    }

    // Send selected region to main process
    window.electronAPI.regionSelected({
      x: Math.round(r.x),
      y: Math.round(r.y),
      width: Math.round(r.width),
      height: Math.round(r.height),
    });
  };

  return (
    <div className="selection-overlay">
      <canvas
        ref={canvasRef}
        className="selection-canvas"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      />
      <div className="selection-hint">拖拽选择录制区域 · 按 Esc 取消</div>
    </div>
  );
}

function normalizeRect(r) {
  const x = Math.min(r.x, r.x2);
  const y = Math.min(r.y, r.y2);
  return {
    x,
    y,
    width: Math.abs(r.x2 - r.x),
    height: Math.abs(r.y2 - r.y),
  };
}
