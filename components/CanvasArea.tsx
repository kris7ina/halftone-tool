'use client';

import { useEffect } from 'react';
import styles from './CanvasArea.module.css';

interface CanvasAreaProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  imageLoaded: boolean;
  isProcessing: boolean;
  zoom: number;
  setZoom: (zoom: number) => void;
}

export default function CanvasArea({
  canvasRef,
  imageLoaded,
  isProcessing,
  zoom,
  setZoom,
}: CanvasAreaProps) {
  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.25, 4));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.25, 0.25));
  };

  const handleZoomFit = () => {
    setZoom(1);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        setZoom(Math.min(zoom * 1.25, 4));
      } else if (e.key === '-') {
        setZoom(Math.max(zoom / 1.25, 0.25));
      } else if (e.key === '0') {
        setZoom(1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [zoom, setZoom]);

  return (
    <main className={styles.canvasArea}>
      {!imageLoaded ? (
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>◐</div>
          <p className={styles.placeholderText}>Upload an image to get started</p>
        </div>
      ) : (
        <>
          <div className={styles.canvasContainer}>
            <canvas
              ref={canvasRef}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            />
          </div>

          {isProcessing && (
            <div className={styles.processing}>
              <div className={styles.spinner} />
            </div>
          )}

          <div className={styles.zoomControls}>
            <button className={styles.zoomBtn} onClick={handleZoomOut}>
              −
            </button>
            <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
            <button className={styles.zoomBtn} onClick={handleZoomIn}>
              +
            </button>
            <button className={styles.zoomBtn} onClick={handleZoomFit}>
              ⊡
            </button>
          </div>
        </>
      )}
    </main>
  );
}
