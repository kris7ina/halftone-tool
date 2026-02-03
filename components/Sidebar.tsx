'use client';

import { useRef } from 'react';
import styles from './Sidebar.module.css';
import type { HalftoneSettings } from './HalftoneTool';

interface SidebarProps {
  settings: HalftoneSettings;
  setSettings: (settings: HalftoneSettings) => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  exportScale: number;
  setExportScale: (scale: number) => void;
  onImageLoad: (file: File) => void;
  onExport: () => void;
  imageLoaded: boolean;
  originalImage: HTMLImageElement | null;
}

export default function Sidebar({
  settings,
  setSettings,
  currentView,
  setCurrentView,
  exportScale,
  setExportScale,
  onImageLoad,
  onExport,
  imageLoaded,
  originalImage,
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageLoad(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add(styles.dragover);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove(styles.dragover);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.dragover);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageLoad(file);
    }
  };

  const updateSetting = <K extends keyof HalftoneSettings>(
    key: K,
    value: HalftoneSettings[K]
  ) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <aside className={styles.sidebar}>
      <h1>Bitmap Converter</h1>
      <p className={styles.subtitle}>Image → Bitmap converter</p>

      <div
        className={styles.uploadZone}
        onClick={handleUploadClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={styles.uploadIcon}>↑</div>
        <p className={styles.uploadText}>
          <strong>Upload image</strong>
        </p>
        <p className={styles.uploadText}>or drag and drop</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {imageLoaded && (
        <div className={styles.controls}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>View</div>
            <div className={styles.viewToggle}>
              {['halftone', 'greyscale', 'original'].map((view) => (
                <button
                  key={view}
                  className={`${styles.viewBtn} ${currentView === view ? styles.active : ''}`}
                  onClick={() => setCurrentView(view)}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Background Removal</div>

            <div className={styles.control}>
              <label className={styles.checkboxControl}>
                <input
                  type="checkbox"
                  checked={settings.removeBg}
                  onChange={(e) => updateSetting('removeBg', e.target.checked)}
                />
                Remove background
              </label>
            </div>

            {settings.removeBg && (
              <div className={styles.bgRemovalSettings}>
                <div className={styles.control}>
                  <div className={styles.controlHeader}>
                    <label>Sample from</label>
                  </div>
                  <select
                    value={settings.bgSamplePosition}
                    onChange={(e) => updateSetting('bgSamplePosition', e.target.value)}
                  >
                    <option value="corners">Corners (auto)</option>
                    <option value="topleft">Top-left</option>
                    <option value="topright">Top-right</option>
                    <option value="bottomleft">Bottom-left</option>
                    <option value="bottomright">Bottom-right</option>
                  </select>
                </div>

                <div className={styles.control}>
                  <div className={styles.controlHeader}>
                    <label>Tolerance</label>
                    <span className={styles.controlValue}>{settings.bgTolerance}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={settings.bgTolerance}
                    onChange={(e) => updateSetting('bgTolerance', parseInt(e.target.value))}
                  />
                </div>

                <div className={styles.control}>
                  <div className={styles.controlHeader}>
                    <label>Edge Softness</label>
                    <span className={styles.controlValue}>{settings.bgSoftness}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={settings.bgSoftness}
                    onChange={(e) => updateSetting('bgSoftness', parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Method</div>

            <div className={styles.control}>
              <select
                value={settings.method}
                onChange={(e) => updateSetting('method', e.target.value)}
              >
                <option value="halftone">Halftone Screen</option>
                <option value="threshold">50% Threshold</option>
                <option value="pattern">Pattern Dither</option>
                <option value="diffusion">Diffusion Dither</option>
              </select>
            </div>
          </div>

          {settings.method === 'halftone' && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Halftone Settings</div>

              <div className={styles.control}>
                <div className={styles.controlHeader}>
                  <label>Shape</label>
                </div>
                <select
                  value={settings.shape}
                  onChange={(e) => updateSetting('shape', e.target.value)}
                >
                  <option value="line">Line</option>
                  <option value="round">Round</option>
                  <option value="diamond">Diamond</option>
                  <option value="ellipse">Ellipse</option>
                  <option value="square">Square</option>
                  <option value="cross">Cross</option>
                </select>
              </div>

              <div className={styles.control}>
                <div className={styles.controlHeader}>
                  <label>Frequency</label>
                  <span className={styles.controlValue}>{settings.frequency} lpi</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={settings.frequency}
                  onChange={(e) => updateSetting('frequency', parseInt(e.target.value))}
                />
              </div>

              <div className={styles.control}>
                <div className={styles.controlHeader}>
                  <label>Angle</label>
                  <span className={styles.controlValue}>{settings.angle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  value={settings.angle}
                  onChange={(e) => updateSetting('angle', parseInt(e.target.value))}
                />
              </div>

              <div className={styles.control}>
                <div className={styles.controlHeader}>
                  <label>Size</label>
                  <span className={styles.controlValue}>{settings.thickness}</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="2"
                  step="0.1"
                  value={settings.thickness}
                  onChange={(e) => updateSetting('thickness', parseFloat(e.target.value))}
                />
              </div>
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Adjustments</div>

            <div className={styles.control}>
              <div className={styles.controlHeader}>
                <label>Contrast</label>
                <span className={styles.controlValue}>{settings.contrast}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.contrast}
                onChange={(e) => updateSetting('contrast', parseFloat(e.target.value))}
              />
            </div>

            <div className={styles.control}>
              <div className={styles.controlHeader}>
                <label>Brightness</label>
                <span className={styles.controlValue}>{settings.brightness}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={settings.brightness}
                onChange={(e) => updateSetting('brightness', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Output</div>

            <div className={styles.control}>
              <label className={styles.checkboxControl}>
                <input
                  type="checkbox"
                  checked={settings.invertOutput}
                  onChange={(e) => updateSetting('invertOutput', e.target.checked)}
                />
                Invert (white lines on black)
              </label>
            </div>

            <div className={styles.control}>
              <label className={styles.checkboxControl}>
                <input
                  type="checkbox"
                  checked={settings.transparentBg}
                  onChange={(e) => updateSetting('transparentBg', e.target.checked)}
                />
                Transparent background
              </label>
            </div>
          </div>

          <div className={styles.imageInfo}>
            <span>Original:</span> {originalImage?.width} × {originalImage?.height}px
            <br />
            <span>Export ({exportScale}×):</span>{' '}
            {originalImage && originalImage.width * exportScale} ×{' '}
            {originalImage && originalImage.height * exportScale}px
          </div>

          <div className={styles.exportSection}>
            <div className={styles.sectionTitle}>Export</div>
            <div className={styles.exportOptions}>
              {[1, 2, 3, 4].map((scale) => (
                <div
                  key={scale}
                  className={`${styles.exportOption} ${exportScale === scale ? styles.selected : ''}`}
                  onClick={() => setExportScale(scale)}
                >
                  <div className={styles.scale}>{scale}×</div>
                  <div className={styles.label}>
                    {scale === 1 ? 'Original' : scale === 2 ? 'High' : scale === 3 ? 'Extra' : 'Ultra'}
                  </div>
                </div>
              ))}
            </div>
            <button className={styles.exportBtn} onClick={onExport} disabled={!imageLoaded}>
              Export PNG
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
