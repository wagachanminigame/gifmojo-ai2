import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { splitImageIntoFrames, SplitConfig, SplitFrame } from '../services/imageSplitter';
import { detectGridWithAi } from '../services/geminiService';

interface ImageSplitterProps {
  onFramesExtracted: (frames: { id: string; src: string; file: File }[]) => void;
  isDarkMode: boolean;
}

export const ImageSplitter: React.FC<ImageSplitterProps> = ({ onFramesExtracted, isDarkMode }) => {
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [splitConfig, setSplitConfig] = useState<SplitConfig>({ rows: 2, cols: 3 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [previewFrames, setPreviewFrames] = useState<SplitFrame[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const processImageFile = async (file: File) => {
    setSourceImage(file);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const url = e.target?.result as string;
      setPreviewUrl(url);

      // AI-powered auto-detection
      setIsDetecting(true);
      try {
        const detected = await detectGridWithAi(url);
        setSplitConfig(detected);
      } catch (error) {
        console.error('Auto-detection failed:', error);
        // Fallback to default
        setSplitConfig({ rows: 2, cols: 3 });
      } finally {
        setIsDetecting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };


  const handlePreview = async () => {
    if (!sourceImage) return;
    
    setIsProcessing(true);
    try {
      const frames = await splitImageIntoFrames(sourceImage, splitConfig);
      setPreviewFrames(frames);
    } catch (error) {
      console.error('Preview failed:', error);
      alert('プレビューに失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtract = async () => {
    if (!sourceImage) return;

    setIsProcessing(true);
    try {
      const frames = await splitImageIntoFrames(sourceImage, splitConfig);
      
      // Convert to format expected by parent
      const formattedFrames = await Promise.all(
        frames.map(async (frame) => {
          // Convert data URL to File
          const response = await fetch(frame.src);
          const blob = await response.blob();
          const file = new File([blob], `frame-${frame.position.row}-${frame.position.col}.png`, { type: 'image/png' });
          
          return {
            id: frame.id,
            src: frame.src,
            file: file
          };
        })
      );

      onFramesExtracted(formattedFrames);
      
      // Reset
      setSourceImage(null);
      setPreviewUrl(null);
      setPreviewFrames([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Extraction failed:', error);
      alert('画像の分割に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSingleFrame = (frame: SplitFrame, index: number) => {
    const a = document.createElement('a');
    a.href = frame.src;
    a.download = `frame_${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadFramesAsZip = async () => {
    if (previewFrames.length === 0) return;

    try {
      const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm' as any)).default;
      const zip = new (JSZip as any)();
      
      for (let i = 0; i < previewFrames.length; i++) {
        const frame = previewFrames[i];
        const response = await fetch(frame.src);
        const blob = await response.blob();
        zip.file(`frame_${i + 1}.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `frames_${splitConfig.rows}x${splitConfig.cols}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('ZIP download failed:', error);
      alert('ZIPダウンロードに失敗しました');
    }
  };

  // Create GIF from preview frames
  const createGifFromPreview = () => {
    if (previewFrames.length === 0) return;

    const images = previewFrames.map(f => f.src);
    
    if (!window.gifshot) {
      alert('GIF library failed to load.');
      return;
    }

    setIsProcessing(true);

    window.gifshot.createGIF({
      images: images,
      interval: 0.3,
      gifWidth: 400,
      gifHeight: 400,
      sampleInterval: 10,
      numFrames: images.length,
    }, (obj: any) => {
      if (!obj.error) {
        // Download GIF directly
        const a = document.createElement('a');
        a.href = obj.image;
        a.download = `animation_${splitConfig.rows}x${splitConfig.cols}.gif`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        console.error(obj.errorMsg);
        alert('GIF生成に失敗しました');
      }
      setIsProcessing(false);
    });
  };

  return (
    <div className={`rounded-xl p-6 border space-y-4 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-lg'}`}>
      <h2 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        画像分割ツール
      </h2>

      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
        複数のポーズが並んだ一枚の画像を個別のフレームに分割します。<br/>
        <span className="font-medium">APIキーを設定すると自動判別、なしでも手動入力で利用できます。</span>
      </p>

      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : isDarkMode 
                ? 'border-slate-600 hover:border-indigo-500 hover:bg-slate-700/30'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3 text-center">
            <div className={`p-4 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-indigo-50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <div>
              <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>画像をドラッグ&ドロップ</p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>またはクリックして選択</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={`rounded-lg p-4 relative ${isDarkMode ? 'bg-slate-900/50' : 'bg-gray-100'}`}>
            {isDetecting && (
              <div className={`absolute inset-0 rounded-lg flex items-center justify-center z-10 ${isDarkMode ? 'bg-black/60' : 'bg-white/90'}`}>
                <div className={`rounded-lg p-4 flex items-center gap-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-lg border border-gray-200'}`}>
                  <svg className={`animate-spin h-5 w-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AIが画像を解析中...</span>
                </div>
              </div>
            )}
            <img src={previewUrl} alt="Source" className="w-full rounded shadow-sm" />
            <button
              onClick={() => {
                setPreviewUrl(null);
                setSourceImage(null);
                setPreviewFrames([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
              title="画像を削除"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className={`border rounded-lg p-3 ${isDarkMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
            <div className="flex items-center gap-2 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}>
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              <span className={isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}>
                AIが検出: <strong className={isDarkMode ? 'text-white' : 'text-indigo-900'}>{splitConfig.rows}行 × {splitConfig.cols}列</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-700'}`}>行数</label>
              <input
                type="number"
                min="1"
                max="10"
                value={splitConfig.rows}
                onChange={(e) => setSplitConfig({ ...splitConfig, rows: parseInt(e.target.value) || 1 })}
                className={`w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500 shadow-sm'}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-700'}`}>列数</label>
              <input
                type="number"
                min="1"
                max="10"
                value={splitConfig.cols}
                onChange={(e) => setSplitConfig({ ...splitConfig, cols: parseInt(e.target.value) || 1 })}
                className={`w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500 shadow-sm'}`}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handlePreview}
              variant="secondary"
              className="flex-1"
              isLoading={isProcessing}
            >
              プレビュー
            </Button>
            <Button
              onClick={handleExtract}
              variant="primary"
              className="flex-1"
              isLoading={isProcessing}
              disabled={!sourceImage}
            >
              フレーム抽出
            </Button>
          </div>

          {previewFrames.length > 0 && (
            <div className="space-y-3">
              <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                プレビュー ({previewFrames.length}フレーム)
              </p>
              <div className={`grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 rounded ${isDarkMode ? 'bg-slate-900/50' : 'bg-gray-50 border border-gray-200'}`}>
                {previewFrames.map((frame, index) => (
                  <div key={frame.id} className={`relative rounded overflow-hidden group ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm border border-gray-200'}`}>
                    <img src={frame.src} alt={`Frame ${index + 1}`} className="w-full" />
                    <div className={`absolute top-1 left-1 text-white text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-black/60' : 'bg-indigo-600 shadow'}`}>
                      #{index + 1}
                    </div>
                    <button
                      onClick={() => downloadSingleFrame(frame, index)}
                      className="absolute bottom-1 right-1 p-1.5 bg-indigo-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-700"
                      title="保存"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Action Buttons for Preview Frames */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={downloadFramesAsZip}
                  variant="secondary"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="21 8 21 21 3 21 3 8"></polyline>
                      <rect x="1" y="3" width="22" height="5"></rect>
                      <line x1="10" y1="12" x2="14" y2="12"></line>
                    </svg>
                  }
                >
                  ZIPダウンロード
                </Button>
                <Button
                  onClick={createGifFromPreview}
                  variant="primary"
                  isLoading={isProcessing}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  }
                >
                  GIF作成
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
