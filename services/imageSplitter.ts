/**
 * Image Splitter Service
 * Splits a single image into multiple frames based on grid layout
 */

export interface SplitConfig {
  rows: number;
  cols: number;
  paddingX?: number;
  paddingY?: number;
  autoTrim?: boolean;
}

export interface SplitFrame {
  id: string;
  src: string;
  position: { row: number; col: number };
}

/**
 * Splits an image into multiple frames based on grid configuration
 */
export const splitImageIntoFrames = async (
  imageFile: File,
  config: SplitConfig
): Promise<SplitFrame[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error('Failed to read image'));
        return;
      }

      img.onload = async () => {
        try {
          let sourceImage: HTMLImageElement | HTMLCanvasElement = img;
          
          // Auto-trim if enabled (defaulting to true for now as per user request implies it's a fix)
          if (config.autoTrim !== false) {
             sourceImage = trimImageWhitespace(img);
          }

          const frames = splitImage(sourceImage, config);
          resolve(frames);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
};

/**
 * Trims whitespace (white or transparent) from the edges of an image
 */
const trimImageWhitespace = (img: HTMLImageElement): HTMLCanvasElement | HTMLImageElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return img;

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  let top = 0, bottom = height, left = 0, right = width;

  // Helper to check if a pixel is NOT white/transparent
  // We consider "white" as R,G,B > 240 (to handle compression artifacts)
  // We consider "transparent" as Alpha < 10
  const isContent = (index: number) => {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const a = data[index + 3];
    
    // Transparent is not content
    if (a < 10) return false;
    
    // White is not content (allow some tolerance for compression)
    if (r > 240 && g > 240 && b > 240) return false;
    
    return true;
  };

  // Find top
  for (let y = 0; y < height; y++) {
    let rowHasContent = false;
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      if (isContent(index)) {
        rowHasContent = true;
        break;
      }
    }
    if (rowHasContent) {
      top = y;
      break;
    }
  }

  // Find bottom
  for (let y = height - 1; y >= 0; y--) {
    let rowHasContent = false;
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      if (isContent(index)) {
        rowHasContent = true;
        break;
      }
    }
    if (rowHasContent) {
      bottom = y + 1;
      break;
    }
  }

  // Find left
  for (let x = 0; x < width; x++) {
    let colHasContent = false;
    for (let y = top; y < bottom; y++) {
      const index = (y * width + x) * 4;
      if (isContent(index)) {
        colHasContent = true;
        break;
      }
    }
    if (colHasContent) {
      left = x;
      break;
    }
  }

  // Find right
  for (let x = width - 1; x >= 0; x--) {
    let colHasContent = false;
    for (let y = top; y < bottom; y++) {
      const index = (y * width + x) * 4;
      if (isContent(index)) {
        colHasContent = true;
        break;
      }
    }
    if (colHasContent) {
      right = x + 1;
      break;
    }
  }

  // If image is blank or full, return original
  if (top === 0 && bottom === height && left === 0 && right === width) {
    return img;
  }
  
  if (right <= left || bottom <= top) {
      return img; // Should not happen if logic is correct, but safety first
  }

  // Create trimmed canvas
  const trimmedWidth = right - left;
  const trimmedHeight = bottom - top;
  const trimmedCanvas = document.createElement('canvas');
  trimmedCanvas.width = trimmedWidth;
  trimmedCanvas.height = trimmedHeight;
  const trimmedCtx = trimmedCanvas.getContext('2d');
  
  if (!trimmedCtx) return img;

  trimmedCtx.drawImage(
    canvas,
    left, top, trimmedWidth, trimmedHeight,
    0, 0, trimmedWidth, trimmedHeight
  );

  return trimmedCanvas;
};

/**
 * Internal function to split the loaded image
 */
const splitImage = (img: HTMLImageElement | HTMLCanvasElement, config: SplitConfig): SplitFrame[] => {
  const { rows, cols, paddingX = 0, paddingY = 0 } = config;
  const frames: SplitFrame[] = [];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  // Calculate frame dimensions
  const frameWidth = Math.floor((img.width - paddingX * (cols + 1)) / cols);
  const frameHeight = Math.floor((img.height - paddingY * (rows + 1)) / rows);

  canvas.width = frameWidth;
  canvas.height = frameHeight;

  // Extract each frame
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Calculate source position
      const sx = paddingX + col * (frameWidth + paddingX);
      const sy = paddingY + row * (frameHeight + paddingY);

      // Clear canvas
      ctx.clearRect(0, 0, frameWidth, frameHeight);

      // Draw frame
      ctx.drawImage(
        img,
        sx, sy, frameWidth, frameHeight,
        0, 0, frameWidth, frameHeight
      );

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');

      frames.push({
        id: crypto.randomUUID(),
        src: dataUrl,
        position: { row, col }
      });
    }
  }

  return frames;
};

/**
 * Auto-detect grid layout (simple heuristic based on aspect ratio)
 */
export const suggestGridLayout = (width: number, height: number): SplitConfig => {
  const aspectRatio = width / height;

  // Common layouts
  if (aspectRatio > 2.5) {
    // Wide horizontal strip
    return { rows: 1, cols: Math.round(aspectRatio) };
  } else if (aspectRatio < 0.4) {
    // Tall vertical strip
    return { rows: Math.round(1 / aspectRatio), cols: 1 };
  } else if (aspectRatio > 1.5) {
    // Horizontal rectangle
    return { rows: 2, cols: 3 };
  } else if (aspectRatio < 0.75) {
    // Vertical rectangle
    return { rows: 3, cols: 2 };
  } else {
    // Square-ish
    return { rows: 2, cols: 2 };
  }
};
