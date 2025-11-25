// Gifshot library type definition (since it is loaded via CDN)
export interface GifShotOptions {
  images: string[];
  interval: number; // seconds
  gifWidth: number;
  gifHeight: number;
  numFrames?: number;
  frameDuration?: number;
  sampleInterval?: number;
  fontWeight?: string;
  fontSize?: string;
  fontFamily?: string;
  fontColor?: string;
  textAlign?: string;
  textBaseline?: string;
  text?: string;
}

export interface GifShotResult {
  image: string; // Base64 image
  error: boolean;
  errorCode: string;
  errorMsg: string;
}

declare global {
  interface Window {
    gifshot: {
      createGIF: (
        options: GifShotOptions,
        callback: (obj: GifShotResult) => void
      ) => void;
    };
  }
}

export interface Frame {
  id: string;
  src: string; // Base64 data URL
  file: File;
}

export interface GifSettings {
  interval: number; // seconds per frame
  width: number;
  height: number;
  quality: number; // 1-10
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}
