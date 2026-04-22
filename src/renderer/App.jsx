import React, { useState, useEffect } from 'react';
import MainPanel from './pages/MainPanel';
import EditorPage from './pages/EditorPage';
import SelectionOverlay from './pages/SelectionOverlay';
import FloatingToolbar from './pages/FloatingToolbar';
import AnnotationCanvas from './pages/AnnotationCanvas';
import './styles/global.css';

function getRoute() {
  return window.location.hash.replace('#', '') || '/';
}

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [page, setPage] = useState('main'); // main | editor
  const [recordedBlob, setRecordedBlob] = useState(null);

  useEffect(() => {
    const onChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  // Listen for recording-stopped event from main process
  useEffect(() => {
    if (route !== '/') return;
    window.electronAPI?.onRecordingStopped?.((data) => {
      setPage('editor');
    });
  }, [route]);

  // Route to correct sub-window
  if (route === '/selection') return <SelectionOverlay />;
  if (route === '/toolbar') return <FloatingToolbar />;
  if (route === '/annotation') return <AnnotationCanvas />;

  // Main window
  if (page === 'editor' && recordedBlob) {
    return <EditorPage recordedData={{ blob: recordedBlob }} onBack={() => { setPage('main'); setRecordedBlob(null); }} />;
  }

  return (
    <MainPanel
      onRecordingComplete={(blob) => { setRecordedBlob(blob); setPage('editor'); }}
    />
  );
}
