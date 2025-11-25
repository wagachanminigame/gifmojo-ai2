import React, { useState, useCallback, useRef } from 'react';
import { Frame, GifSettings, ProcessingStatus } from './types';
import { Button } from './components/Button';
import { FrameCard } from './components/FrameCard';
import { generateGifCaption } from './services/geminiService';

const App: React.FC = () => {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [settings, setSettings] = useState<GifSettings>({
    interval: 0.3,
    width: 400,
    height: 400,
    quality: 10,
  });
  
  const [generatedGif, setGeneratedGif] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [aiTitle, setAiTitle] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- File Handling --

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFrames: Frame[] = [];
    // Convert FileList to array and filter for images to fix type errors and ensure logic correctness
    const imageFiles = Array.from(files).filter((file: File) => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;
    
    let processedCount = 0;

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newFrames.push({
            id: crypto.randomUUID(),
            src: e.target.result as string,
            file: file
          });
        }
        processedCount++;
        if (processedCount === imageFiles.length) {
          setFrames((prev) => [...prev, ...newFrames]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // -- Frame Management --

  const moveFrame = (index: number, direction: 'left' | 'right') => {
    const newFrames = [...frames];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newFrames.length) return;
    
    [newFrames[index], newFrames[targetIndex]] = [newFrames[targetIndex], newFrames[index]];
    setFrames(newFrames);
  };

  const deleteFrame = (index: number) => {
    setFrames(frames.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    if (window.confirm('すべての画像を削除しますか？')) {
      setFrames([]);
      setGeneratedGif(null);
      setAiTitle("");
    }
  };

  // -- Generation Logic --

  const createGif = useCallback(() => {
    if (frames.length === 0) return;
    
    setStatus(ProcessingStatus.PROCESSING);
    setGeneratedGif(null);
    setProgress(10); // Start progress

    // Small timeout to allow UI to update
    setTimeout(() => {
      const images = frames.map(f => f.src);
      
      if (!window.gifshot) {
        alert('GIF library failed to load.');
        setStatus(ProcessingStatus.ERROR);
        return;
      }

      window.gifshot.createGIF({
        images: images,
        interval: settings.interval,
        gifWidth: settings.width,
        gifHeight: settings.height,
        sampleInterval: settings.quality, // Lower is better quality in gifshot, but we map 1-10 conceptually
        numFrames: frames.length,
      }, (obj) => {
        if (!obj.error) {
          setGeneratedGif(obj.image);
          setStatus(ProcessingStatus.COMPLETED);
          setProgress(100);
        } else {
          console.error(obj.errorMsg);
          setStatus(ProcessingStatus.ERROR);
        }
      });
    }, 100);
  }, [frames, settings]);

  const handleAiCaption = async () => {
    if (frames.length === 0) return;
    setIsAiLoading(true);
    setAiTitle("AIが考え中...");
    
    try {
      const images = frames.map(f => f.src);
      const title = await generateGifCaption(images);
      setAiTitle(title);
    } catch (e) {
      setAiTitle("タイトル生成エラー");
    } finally {
      setIsAiLoading(false);
    }
  };

  const downloadGif = () => {
    if (!generatedGif) return;
    const link = document.createElement('a');
    link.href = generatedGif;
    link.download = aiTitle ? `${aiTitle}.gif` : `my-animation-${Date.now()}.gif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              GifMojo AI
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://labs.google.com/mixboard/projects" 
              target="_blank" 
              rel="noreferrer" 
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 bg-indigo-500/10 px-3 py-1.5 rounded-full hover:bg-indigo-500/20 border border-indigo-500/20"
            >
              <span>Mixboard</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
            <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-slate-300 transition-colors hidden sm:block">
              Powered by Gemini
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Editor */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*"
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              }>
                画像を追加
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
               <span className="text-slate-400 text-sm">{frames.length} フレーム</span>
               {frames.length > 0 && (
                 <Button variant="ghost" onClick={clearAll} className="text-red-400 hover:text-red-300">
                   全てクリア
                 </Button>
               )}
            </div>
          </div>

          {/* Frame Grid */}
          {frames.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 rounded-xl h-64 flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500 hover:bg-slate-800/30 transition-all cursor-pointer group"
            >
              <div className="p-4 bg-slate-800 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              </div>
              <p className="font-medium">画像をここにドラッグ＆ドロップ</p>
              <p className="text-sm opacity-70 mt-1">またはクリックして選択</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {frames.map((frame, index) => (
                <FrameCard
                  key={frame.id}
                  frame={frame}
                  index={index}
                  total={frames.length}
                  onMoveLeft={() => moveFrame(index, 'left')}
                  onMoveRight={() => moveFrame(index, 'right')}
                  onDelete={() => deleteFrame(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Settings & Preview */}
        <div className="space-y-6">
          
          {/* Settings Panel */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              設定
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  フレーム切り替え速度 ({settings.interval}秒)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={settings.interval}
                  onChange={(e) => setSettings({ ...settings, interval: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">幅 (px)</label>
                  <input
                    type="number"
                    value={settings.width}
                    onChange={(e) => setSettings({ ...settings, width: parseInt(e.target.value) || 300 })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">高さ (px)</label>
                  <input
                    type="number"
                    value={settings.height}
                    onChange={(e) => setSettings({ ...settings, height: parseInt(e.target.value) || 300 })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <Button 
                onClick={createGif} 
                className="w-full h-12 text-lg font-bold"
                disabled={frames.length === 0}
                isLoading={status === ProcessingStatus.PROCESSING}
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>}
              >
                GIFを作成
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          {generatedGif && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl animate-fade-in">
               <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                プレビュー
              </h2>

              <div className="flex justify-center bg-black/20 rounded-lg p-4 mb-4">
                <img src={generatedGif} alt="Generated GIF" className="max-w-full rounded shadow-lg" />
              </div>

              {/* AI Features */}
              <div className="mb-4 bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-3">
                 <div className="flex items-start gap-3">
                   <div className="mt-1 text-indigo-400">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                   </div>
                   <div className="flex-1">
                     {aiTitle ? (
                       <div className="animate-fade-in">
                         <p className="text-sm text-indigo-200 font-medium">AI提案タイトル:</p>
                         <p className="text-white text-lg font-bold">{aiTitle}</p>
                       </div>
                     ) : (
                       <div className="flex items-center justify-between">
                         <p className="text-sm text-indigo-200">AIにタイトルを考えてもらう？</p>
                         <Button 
                           variant="secondary" 
                           onClick={handleAiCaption} 
                           isLoading={isAiLoading}
                           className="text-xs py-1 px-3 h-8"
                         >
                           生成
                         </Button>
                       </div>
                     )}
                   </div>
                 </div>
              </div>

              <Button 
                onClick={downloadGif} 
                variant="primary" 
                className="w-full"
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>}
              >
                ダウンロード
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;