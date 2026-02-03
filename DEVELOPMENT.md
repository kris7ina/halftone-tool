# Development Guide

## Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Development Server

The development server runs on:
- Local: http://localhost:3000
- Network: http://192.168.1.4:3000

## Project Architecture

### State Management
The main state is managed in `HalftoneTool.tsx` using React hooks:
- `originalImage`: The uploaded image
- `greyscaleData`: Processed greyscale version
- `backgroundMask`: Alpha mask for background removal
- `settings`: All user-adjustable parameters
- `currentView`: Active view mode (halftone/greyscale/original)
- `zoom`: Canvas zoom level

### Image Processing Pipeline

1. **Upload** → FileReader loads image
2. **Background Removal** (optional) → Color distance algorithm
3. **Greyscale Conversion** → Luminosity method
4. **Level Adjustment** → Contrast and brightness
5. **Method Application** → Halftone/Threshold/Dither
6. **Canvas Rendering** → Display result

### Performance Optimizations

- **Debounced Processing**: 50ms delay prevents excessive recalculation
- **requestAnimationFrame**: Non-blocking UI updates
- **Canvas Operations**: Direct pixel manipulation for speed
- **Memoization**: useCallback prevents unnecessary re-renders

## Adding New Features

### Adding a New Halftone Shape

1. Add option to shape select in `Sidebar.tsx`
2. Add case in `applyHalftone()` switch statement in `utils/imageProcessing.ts`
3. Define the shape's mathematical formula

### Adding a New Processing Method

1. Create new function in `utils/imageProcessing.ts`
2. Add option to method select in `Sidebar.tsx`
3. Add case to switch statement in `HalftoneTool.tsx` `processImage()`

## File Structure

```
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Home page (renders HalftoneTool)
│   └── globals.css         # Global styles and fonts
│
├── components/
│   ├── HalftoneTool.tsx    # Main component (state management)
│   ├── Sidebar.tsx         # Controls and settings UI
│   ├── CanvasArea.tsx      # Canvas display and zoom
│   └── *.module.css        # Component-specific styles
│
└── utils/
    └── imageProcessing.ts  # Core algorithms
```

## TypeScript Types

### Main Interfaces

```typescript
interface HalftoneSettings {
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

interface ProcessingOptions {
  invert: boolean;
  transparent: boolean;
  mask?: Uint8Array | null;
}

interface HalftoneOptions extends ProcessingOptions {
  frequency: number;
  angle: number;
  thickness: number;
  shape: string;
}
```

## Keyboard Shortcuts

- `+` or `=`: Zoom in
- `-`: Zoom out
- `0`: Reset zoom to 100%

## Browser DevTools Tips

- Use React DevTools to inspect component state
- Canvas operations can be profiled in Performance tab
- Check Network tab for image loading times

## Common Issues & Solutions

### Image processing is slow
- Large images take time to process
- Consider adding a max resolution limit
- Could implement Web Workers for processing

### Canvas not updating
- Check if `processImage()` is being called
- Verify `canvasRef.current` is not null
- Ensure `requestAnimationFrame` callback completes

### Background removal not working
- Check tolerance value (try increasing)
- Verify sample position matches background location
- Test with images that have uniform backgrounds

## Future Enhancements

- [ ] Web Worker support for large images
- [ ] More dithering algorithms
- [ ] Color halftone (CMYK separation)
- [ ] Batch processing
- [ ] SVG export option
- [ ] Preset management
- [ ] Image filters (blur, sharpen, etc.)
- [ ] History/Undo functionality
- [ ] Mobile responsive improvements
