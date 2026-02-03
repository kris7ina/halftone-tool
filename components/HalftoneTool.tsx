'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar';
import CanvasArea from './CanvasArea';
import styles from './HalftoneTool.module.css';
import {
  toGreyscale,
  adjustLevels,
  removeBackground,
  applyHalftone,
  applyThreshold,
  applyPatternDither,
  applyDiffusionDither,
} from '@/utils/imageProcessing';

export interface HalftoneSettings {
  frequency: number;
  angle: number;
  thickness: number;
  shape: string;
  contrast: number;
  brightness: number;
  invertOutput: boolean;
  transparentBg: boolean;
  method: string;
  removeBg: boolean;
  bgSamplePosition: string;
  bgTolerance: number;
  bgSoftness: number;
}

export default function HalftoneTool() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [greyscaleData, setGreyscaleData] = useState<ImageData | null>(null);
  const [backgroundMask, setBackgroundMask] = useState<Uint8Array | null>(null);
  const [currentView, setCurrentView] = useState<string>('halftone');
  const [exportScale, setExportScale] = useState<number>(2);
  const [zoom, setZoom] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const [settings, setSettings] = useState<HalftoneSettings>({
    frequency: 20,
    angle: 90,
    thickness: 1,
    shape: 'line',
    contrast: 1,
    brightness: 0,
    invertOutput: false,
    transparentBg: false,
    method: 'halftone',
    removeBg: false,
    bgSamplePosition: 'corners',
    bgTolerance: 30,
    bgSoftness: 1,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const settingsRef = useRef(settings);
  const currentViewRef = useRef(currentView);
  const isProcessingRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  const processImage = useCallback(() => {
    if (!originalImage || !canvasRef.current || isProcessingRef.current) return;

    isProcessingRef.current = true;
    // Don't use setIsProcessing here - it causes re-renders and flashing

    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        isProcessingRef.current = false;
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        isProcessingRef.current = false;
        return;
      }

      const currentSettings = settingsRef.current;
      const view = currentViewRef.current;

      const width = originalImage.width;
      const height = originalImage.height;

      // Only set canvas dimensions if they changed (prevents flashing)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.drawImage(originalImage, 0, 0);

      let imageData = ctx.getImageData(0, 0, width, height);

      // Remove background if enabled
      let mask: Uint8Array | null = null;
      if (currentSettings.removeBg) {
        imageData = removeBackground(imageData, width, height, {
          samplePosition: currentSettings.bgSamplePosition,
          tolerance: currentSettings.bgTolerance,
          softness: currentSettings.bgSoftness,
        });
        mask = new Uint8Array(width * height);
        for (let i = 0; i < mask.length; i++) {
          mask[i] = imageData.data[i * 4 + 3];
        }
        setBackgroundMask(mask);
      } else {
        setBackgroundMask(null);
      }

      imageData = toGreyscale(imageData);

      const contrast = currentSettings.contrast - 1;
      const brightness = currentSettings.brightness;
      imageData = adjustLevels(imageData, contrast, brightness);

      const newGreyscaleData = new ImageData(
        new Uint8ClampedArray(imageData.data),
        width,
        height
      );
      setGreyscaleData(newGreyscaleData);

      if (view === 'halftone') {
        const options = {
          frequency: currentSettings.frequency,
          angle: currentSettings.angle,
          thickness: currentSettings.thickness,
          shape: currentSettings.shape,
          invert: currentSettings.invertOutput,
          transparent: currentSettings.transparentBg,
          mask,
        };

        switch (currentSettings.method) {
          case 'threshold':
            imageData = applyThreshold(newGreyscaleData, width, height, options);
            break;
          case 'pattern':
            imageData = applyPatternDither(newGreyscaleData, width, height, options);
            break;
          case 'diffusion':
            imageData = applyDiffusionDither(newGreyscaleData, width, height, options);
            break;
          case 'halftone':
          default:
            imageData = applyHalftone(newGreyscaleData, width, height, options);
            break;
        }
      } else if (view === 'original') {
        ctx.drawImage(originalImage, 0, 0);
        isProcessingRef.current = false;
        return;
      }

      ctx.putImageData(imageData, 0, 0);
      isProcessingRef.current = false;
    });
  }, [originalImage]);

  // Trigger processing when settings or view changes
  useEffect(() => {
    if (!originalImage) return;
    
    if (processTimeoutRef.current) {
      clearTimeout(processTimeoutRef.current);
    }
    
    processTimeoutRef.current = setTimeout(() => {
      processImage();
    }, 50);
  }, [settings, currentView, originalImage, processImage]);

  const handleImageLoad = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setImageLoaded(true);
        setZoom(1);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleExport = () => {
    if (!originalImage) return;

    isProcessingRef.current = true;
    setIsProcessing(true);

    requestAnimationFrame(() => {
      const currentSettings = settingsRef.current;
      const view = currentViewRef.current;
      const scale = exportScale;
      const width = originalImage.width * scale;
      const height = originalImage.height * scale;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = width;
      exportCanvas.height = height;
      const exportCtx = exportCanvas.getContext('2d');

      if (!exportCtx) {
        isProcessingRef.current = false;
        setIsProcessing(false);
        return;
      }

      exportCtx.drawImage(originalImage, 0, 0, width, height);

      let imageData = exportCtx.getImageData(0, 0, width, height);

      let exportMask: Uint8Array | null = null;
      if (currentSettings.removeBg) {
        imageData = removeBackground(imageData, width, height, {
          samplePosition: currentSettings.bgSamplePosition,
          tolerance: currentSettings.bgTolerance,
          softness: currentSettings.bgSoftness,
        });
        exportMask = new Uint8Array(width * height);
        for (let i = 0; i < exportMask.length; i++) {
          exportMask[i] = imageData.data[i * 4 + 3];
        }
      }

      imageData = toGreyscale(imageData);
      const contrast = currentSettings.contrast - 1;
      const brightness = currentSettings.brightness;
      imageData = adjustLevels(imageData, contrast, brightness);

      if (view === 'halftone') {
        const options = {
          frequency: currentSettings.frequency / scale,
          angle: currentSettings.angle,
          thickness: currentSettings.thickness,
          shape: currentSettings.shape,
          invert: currentSettings.invertOutput,
          transparent: currentSettings.transparentBg,
          mask: exportMask,
        };

        switch (currentSettings.method) {
          case 'threshold':
            imageData = applyThreshold(imageData, width, height, options);
            break;
          case 'pattern':
            imageData = applyPatternDither(imageData, width, height, options);
            break;
          case 'diffusion':
            imageData = applyDiffusionDither(imageData, width, height, options);
            break;
          case 'halftone':
          default:
            imageData = applyHalftone(imageData, width, height, options);
            break;
        }
      }

      exportCtx.putImageData(imageData, 0, 0);

      const link = document.createElement('a');
      link.download = `halftone-${scale}x.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();

      isProcessingRef.current = false;
      setIsProcessing(false);
    });
  };

  return (
    <div className={styles.app}>
      <Sidebar
        settings={settings}
        setSettings={setSettings}
        currentView={currentView}
        setCurrentView={setCurrentView}
        exportScale={exportScale}
        setExportScale={setExportScale}
        onImageLoad={handleImageLoad}
        onExport={handleExport}
        imageLoaded={imageLoaded}
        originalImage={originalImage}
      />
      <CanvasArea
        canvasRef={canvasRef}
        imageLoaded={imageLoaded}
        isProcessing={isProcessing}
        zoom={zoom}
        setZoom={setZoom}
      />
    </div>
  );
}
