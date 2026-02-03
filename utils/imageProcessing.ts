// Convert to greyscale
export function toGreyscale(imageData: ImageData): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Luminosity method for better perceptual greyscale
    const grey = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = data[i + 1] = data[i + 2] = grey;
  }
  return imageData;
}

// Apply contrast and brightness
export function adjustLevels(
  imageData: ImageData,
  contrast: number,
  brightness: number
): ImageData {
  const data = imageData.data;
  const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

  for (let i = 0; i < data.length; i += 4) {
    for (let j = 0; j < 3; j++) {
      let value = data[i + j];
      value = factor * (value - 128) + 128 + brightness;
      data[i + j] = Math.max(0, Math.min(255, value));
    }
  }
  return imageData;
}

// Background removal options
export interface BackgroundRemovalOptions {
  samplePosition: string;
  tolerance: number;
  softness: number;
}

// Background removal
export function removeBackground(
  imageData: ImageData,
  width: number,
  height: number,
  options: BackgroundRemovalOptions
): ImageData {
  const { samplePosition, tolerance, softness } = options;
  const data = imageData.data;
  const output = new ImageData(new Uint8ClampedArray(data), width, height);
  const out = output.data;

  // Sample background color from specified position(s)
  let bgR: number, bgG: number, bgB: number;

  const samplePixel = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    return { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
  };

  if (samplePosition === 'corners') {
    // Average all four corners
    const margin = 5;
    const samples = [
      samplePixel(margin, margin),
      samplePixel(width - margin - 1, margin),
      samplePixel(margin, height - margin - 1),
      samplePixel(width - margin - 1, height - margin - 1),
    ];
    bgR = Math.round(samples.reduce((s, p) => s + p.r, 0) / 4);
    bgG = Math.round(samples.reduce((s, p) => s + p.g, 0) / 4);
    bgB = Math.round(samples.reduce((s, p) => s + p.b, 0) / 4);
  } else {
    const margin = 5;
    let sample;
    switch (samplePosition) {
      case 'topleft':
        sample = samplePixel(margin, margin);
        break;
      case 'topright':
        sample = samplePixel(width - margin - 1, margin);
        break;
      case 'bottomleft':
        sample = samplePixel(margin, height - margin - 1);
        break;
      case 'bottomright':
        sample = samplePixel(width - margin - 1, height - margin - 1);
        break;
      default:
        sample = samplePixel(margin, margin);
    }
    bgR = sample.r;
    bgG = sample.g;
    bgB = sample.b;
  }

  // Calculate alpha for each pixel based on color distance
  const toleranceSquared = tolerance * 2.55 * (tolerance * 2.55) * 3;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Color distance from background
    const dr = r - bgR;
    const dg = g - bgG;
    const db = b - bgB;
    const distSquared = dr * dr + dg * dg + db * db;

    // Calculate alpha based on distance
    let alpha;
    if (distSquared < toleranceSquared) {
      if (softness > 0) {
        // Soft edge - gradual falloff
        const dist = Math.sqrt(distSquared);
        const maxDist = Math.sqrt(toleranceSquared);
        const softRange = maxDist * (softness / 5);
        if (dist < maxDist - softRange) {
          alpha = 0;
        } else {
          alpha = Math.round(((dist - (maxDist - softRange)) / softRange) * 255);
        }
      } else {
        alpha = 0;
      }
    } else {
      alpha = 255;
    }

    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
    out[i + 3] = alpha;
  }

  return output;
}

// 50% Threshold
export interface ProcessingOptions {
  invert: boolean;
  transparent: boolean;
  mask?: Uint8Array | null;
}

export function applyThreshold(
  sourceData: ImageData,
  width: number,
  height: number,
  options: ProcessingOptions
): ImageData {
  const { invert, transparent, mask } = options;
  const outputData = new ImageData(width, height);
  const src = sourceData.data;
  const dst = outputData.data;

  const bgColor = invert ? 0 : 255;
  const fgColor = invert ? 255 : 0;
  const bgAlpha = transparent ? 0 : 255;

  for (let i = 0; i < src.length; i += 4) {
    const pixelIdx = i / 4;
    const maskAlpha = mask ? mask[pixelIdx] : 255;

    if (maskAlpha === 0) {
      // Transparent background pixel
      dst[i] = dst[i + 1] = dst[i + 2] = 0;
      dst[i + 3] = 0;
      continue;
    }

    const brightness = src[i];
    const isLight = brightness > 127;

    if (isLight) {
      dst[i] = dst[i + 1] = dst[i + 2] = bgColor;
      dst[i + 3] = mask ? maskAlpha : bgAlpha;
    } else {
      dst[i] = dst[i + 1] = dst[i + 2] = fgColor;
      dst[i + 3] = mask ? maskAlpha : 255;
    }
  }

  return outputData;
}

// Pattern Dither (ordered Bayer matrix)
export function applyPatternDither(
  sourceData: ImageData,
  width: number,
  height: number,
  options: ProcessingOptions
): ImageData {
  const { invert, transparent, mask } = options;
  const outputData = new ImageData(width, height);
  const src = sourceData.data;
  const dst = outputData.data;

  const bgColor = invert ? 0 : 255;
  const fgColor = invert ? 255 : 0;
  const bgAlpha = transparent ? 0 : 255;

  // 4x4 Bayer matrix
  const bayer = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const pixelIdx = y * width + x;
      const maskAlpha = mask ? mask[pixelIdx] : 255;

      if (maskAlpha === 0) {
        dst[idx] = dst[idx + 1] = dst[idx + 2] = 0;
        dst[idx + 3] = 0;
        continue;
      }

      const brightness = src[idx] / 255;
      const threshold = (bayer[y % 4][x % 4] + 0.5) / 16;

      if (brightness > threshold) {
        dst[idx] = dst[idx + 1] = dst[idx + 2] = bgColor;
        dst[idx + 3] = mask ? maskAlpha : bgAlpha;
      } else {
        dst[idx] = dst[idx + 1] = dst[idx + 2] = fgColor;
        dst[idx + 3] = mask ? maskAlpha : 255;
      }
    }
  }

  return outputData;
}

// Diffusion Dither (Floyd-Steinberg)
export function applyDiffusionDither(
  sourceData: ImageData,
  width: number,
  height: number,
  options: ProcessingOptions
): ImageData {
  const { invert, transparent, mask } = options;
  const outputData = new ImageData(width, height);
  const src = sourceData.data;
  const dst = outputData.data;

  const bgColor = invert ? 0 : 255;
  const fgColor = invert ? 255 : 0;
  const bgAlpha = transparent ? 0 : 255;

  // Copy source to working array
  const pixels = new Float32Array(width * height);
  for (let i = 0; i < pixels.length; i++) {
    pixels[i] = src[i * 4] / 255;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      // Skip masked pixels
      if (mask && mask[idx] === 0) continue;

      const oldPixel = pixels[idx];
      const newPixel = oldPixel > 0.5 ? 1 : 0;
      pixels[idx] = newPixel;
      const error = oldPixel - newPixel;

      // Distribute error to neighbors (only if not masked)
      if (x + 1 < width && (!mask || mask[idx + 1] > 0))
        pixels[idx + 1] += (error * 7) / 16;
      if (y + 1 < height) {
        if (x > 0 && (!mask || mask[idx + width - 1] > 0))
          pixels[idx + width - 1] += (error * 3) / 16;
        if (!mask || mask[idx + width] > 0)
          pixels[idx + width] += (error * 5) / 16;
        if (x + 1 < width && (!mask || mask[idx + width + 1] > 0))
          pixels[idx + width + 1] += (error * 1) / 16;
      }
    }
  }

  // Write output
  for (let i = 0; i < pixels.length; i++) {
    const dstIdx = i * 4;
    const maskAlpha = mask ? mask[i] : 255;

    if (maskAlpha === 0) {
      dst[dstIdx] = dst[dstIdx + 1] = dst[dstIdx + 2] = 0;
      dst[dstIdx + 3] = 0;
      continue;
    }

    if (pixels[i] > 0.5) {
      dst[dstIdx] = dst[dstIdx + 1] = dst[dstIdx + 2] = bgColor;
      dst[dstIdx + 3] = mask ? maskAlpha : bgAlpha;
    } else {
      dst[dstIdx] = dst[dstIdx + 1] = dst[dstIdx + 2] = fgColor;
      dst[dstIdx + 3] = mask ? maskAlpha : 255;
    }
  }

  return outputData;
}

// Halftone Screen options
export interface HalftoneOptions extends ProcessingOptions {
  frequency: number;
  angle: number;
  thickness: number;
  shape: string;
}

// Halftone Screen with different shapes
export function applyHalftone(
  sourceData: ImageData,
  width: number,
  height: number,
  options: HalftoneOptions
): ImageData {
  const { frequency, angle, thickness, shape, invert, transparent, mask } = options;

  const outputData = new ImageData(width, height);
  const src = sourceData.data;
  const dst = outputData.data;

  // Convert angle to radians - add tiny offset to avoid exact 90/180 degree issues
  let adjustedAngle = angle;
  if (angle % 90 === 0) {
    adjustedAngle = angle + 0.01;
  }
  const angleRad = (adjustedAngle * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  // Calculate cell size based on frequency
  const cellSize = Math.max(2, 72 / frequency);

  // Determine colors
  const bgColor = invert ? 0 : 255;
  const fgColor = invert ? 255 : 0;
  const bgAlpha = transparent ? 0 : 255;

  // Process each pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const pixelIdx = y * width + x;
      const maskAlpha = mask ? mask[pixelIdx] : 255;

      // If masked out, make transparent
      if (maskAlpha === 0) {
        dst[srcIdx] = dst[srcIdx + 1] = dst[srcIdx + 2] = 0;
        dst[srcIdx + 3] = 0;
        continue;
      }

      const brightness = src[srcIdx] / 255;

      // Rotate coordinates
      const rx = x * cos + y * sin;
      const ry = -x * sin + y * cos;

      // Position within cell (0-1)
      const cellX = (((rx % cellSize) + cellSize) % cellSize) / cellSize;
      const cellY = (((ry % cellSize) + cellSize) % cellSize) / cellSize;

      // Center of cell
      const cx = cellX - 0.5;
      const cy = cellY - 0.5;

      // Size based on darkness
      const size = (1 - brightness) * thickness;

      let isInShape = false;

      switch (shape) {
        case 'line':
          // Horizontal lines (in rotated space)
          isInShape = Math.abs(cy) < size * 0.5;
          break;

        case 'round':
          // Circle
          const distRound = Math.sqrt(cx * cx + cy * cy);
          isInShape = distRound < size * 0.5;
          break;

        case 'diamond':
          // Diamond (rotated square)
          const distDiamond = Math.abs(cx) + Math.abs(cy);
          isInShape = distDiamond < size * 0.5;
          break;

        case 'ellipse':
          // Ellipse (wider than tall)
          const distEllipse = Math.sqrt(cx * cx / 0.5 + cy * cy / 0.2);
          isInShape = distEllipse < size;
          break;

        case 'square':
          // Square
          isInShape = Math.abs(cx) < size * 0.4 && Math.abs(cy) < size * 0.4;
          break;

        case 'cross':
          // Cross shape
          const crossWidth = size * 0.15;
          const crossLength = size * 0.5;
          isInShape =
            (Math.abs(cx) < crossWidth && Math.abs(cy) < crossLength) ||
            (Math.abs(cy) < crossWidth && Math.abs(cx) < crossLength);
          break;
      }

      if (isInShape) {
        dst[srcIdx] = dst[srcIdx + 1] = dst[srcIdx + 2] = fgColor;
        dst[srcIdx + 3] = mask ? maskAlpha : 255;
      } else {
        dst[srcIdx] = dst[srcIdx + 1] = dst[srcIdx + 2] = bgColor;
        dst[srcIdx + 3] = mask ? maskAlpha : bgAlpha;
      }
    }
  }

  return outputData;
}
