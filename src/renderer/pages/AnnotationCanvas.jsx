import React, { useRef, useEffect, useState } from 'react';
import '../styles/annotationcanvas.css';

export default function AnnotationCanvas() {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const [color] = useState('#e74c3c');
  const [lineWidth] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    // Listen for clear command from main
    window.electronAPI?.onClearCanvas?.(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }, [color, lineWidth]);

  const onMouseDown = (e) => {
    drawingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(e.clientX, e.clientY);
    ctx.stroke();
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp = () => {
    drawingRef.current = false;
    lastPosRef.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      className="annotation-canvas-full"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    />
  );
}
