# Linear Halftone Tool

A modern web application for converting images to halftone patterns, built with Next.js and React.

![Linear Halftone Tool](https://img.shields.io/badge/Next.js-16.1-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)

## Features

### Multiple Processing Methods
- **Halftone Screen**: Classic halftone with customizable shapes (Line, Round, Diamond, Ellipse, Square, Cross)
- **50% Threshold**: Simple binary conversion
- **Pattern Dither**: Ordered Bayer matrix dithering
- **Diffusion Dither**: Floyd-Steinberg error diffusion

### Advanced Controls
- **Background Removal**: Intelligent background detection and removal with adjustable tolerance and edge softness
- **View Modes**: Switch between Halftone, Greyscale, and Original views
- **Adjustments**: Fine-tune contrast and brightness
- **Export Options**: Export at 1×, 2×, 3×, or 4× resolution
- **Zoom Controls**: Keyboard shortcuts (+, -, 0) and UI controls

### Modern UI
- Dark theme with Geist Mono font
- Real-time preview with debounced processing
- Drag & drop image upload
- Responsive controls
- Smooth animations and transitions

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/kris7ina/halftone-tool.git

# Navigate to the project directory
cd halftone-tool

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
# Create an optimized production build
npm run build

# Start the production server
npm start
```

## Usage

1. **Upload an Image**: Click the upload zone or drag and drop an image file
2. **Choose a Method**: Select from Halftone Screen, Threshold, Pattern Dither, or Diffusion Dither
3. **Adjust Settings**: 
   - For Halftone: Choose shape, adjust frequency, angle, and size
   - Adjust contrast and brightness
   - Toggle background removal if needed
4. **Preview**: Switch between different view modes
5. **Export**: Select quality (1×-4×) and export as PNG

## Project Structure

```
halftone-tool/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   ├── HalftoneTool.tsx    # Main component
│   ├── Sidebar.tsx         # Controls sidebar
│   ├── CanvasArea.tsx      # Canvas display area
│   └── *.module.css        # Component styles
├── utils/
│   └── imageProcessing.ts  # Image processing algorithms
└── public/                 # Static assets
```

## Technologies Used

- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type-safe development
- **CSS Modules**: Scoped styling
- **Canvas API**: Image processing and rendering

## Image Processing Algorithms

- **Greyscale Conversion**: Luminosity method for perceptual accuracy
- **Halftone Screen**: Rotated grid with multiple shape options
- **Bayer Dithering**: 4×4 ordered matrix
- **Floyd-Steinberg**: Error diffusion dithering
- **Background Removal**: Color distance with configurable tolerance

## Browser Support

Works in all modern browsers that support:
- Canvas API
- ES6+
- CSS Grid

## License

ISC

## Author

[kris7ina](https://github.com/kris7ina)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
