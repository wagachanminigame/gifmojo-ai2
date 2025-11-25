/**
 * Image Splitter Service
 * Splits a single image into multiple frames based on grid layout
 */

export interface SplitConfig {
  rows: number;
  cols: number;
  paddingX?: number;
  paddingY?: number;
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

      img.onload = () => {
        try {
          const frames = splitImage(img, config);
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
 * Internal function to split the loaded image
 */
const splitImage = (img: HTMLImageElement, config: SplitConfig): SplitFrame[] => {
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
