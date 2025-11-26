import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Frame, GifSettings, ProcessingStatus } from './types';
import { Button } from './components/Button';
import { FrameCard } from './components/FrameCard';
import { ImageSplitter } from './components/ImageSplitter';
import { generateGifCaption, reorderFramesWithAi } from './services/geminiService';
import { GuideModal } from './components/GuideModal';
import { PromptGenerator } from './components/PromptGenerator';

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
  const [isAiReordering, setIsAiReordering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('gifmojo-dark-mode');
    return saved === 'true';
  });
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);
  const [splitterKey, setSplitterKey] = useState(0);
  
  const [history, setHistory] = useState<Frame[][]>([]);
  
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('gifmojo-api-key');
    if (!storedKey) {
      setIsApiKeyModalOpen(true);
    } else {
      setApiKeyInput(storedKey);
    }
  }, []);

  const saveApiKey = () => {
    if (!apiKeyInput.trim()) {
      alert('APIキーを入力してください');
      return;
    }
    localStorage.setItem('gifmojo-api-key', apiKeyInput.trim());
    setIsApiKeyModalOpen(false);
    alert('APIキーを保存しました');
  };

  const deleteApiKey = () => {
    if (confirm('APIキーを削除しますか？')) {
      localStorage.removeItem('gifmojo-api-key');
      setApiKeyInput('');
      alert('APIキーを削除しました');
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('gifmojo-dark-mode', String(newValue));
      return newValue;
    });
  };

  const togglePreviewPlaying = () => {
    const img = previewImgRef.current;
    if (!img || !generatedGif) return;
    
    if (isPreviewPlaying) {
      const canvas = document.createElement('canvas');
      const tempImg = new Image();
      tempImg.onload = () => {
        canvas.width = tempImg.width;
        canvas.height = tempImg.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempImg, 0, 0);
          img.src = canvas.toDataURL();
          setIsPreviewPlaying(false);
        }
      };
      tempImg.src = generatedGif;
    } else {
      img.src = generatedGif + '?' + Date.now();
      setIsPreviewPlaying(true);
    }
  };

  const deletePreview = () => {
    setGeneratedGif(null);
    setAiTitle("");
    setIsPreviewPlaying(true);
  };

  const saveHistory = () => {
    setHistory(prev => [...prev, frames]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const previousFrames = history[history.length - 1];
    setFrames(previousFrames);
    setHistory(prev => prev.slice(0, -1));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    saveHistory();

    const newFrames: Frame[] = [];
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
            file: file as File
          });
        }
        processedCount++;
        if (processedCount === imageFiles.length) {
          setFrames((prev) => [...prev, ...newFrames]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMainDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMain(true);
  };

  const handleMainDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMain(false);
  };

  const handleMainDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMain(false);

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length === 0) return;

    saveHistory();

    const newFrames: Frame[] = [];
    let processedCount = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newFrames.push({
            id: crypto.randomUUID(),
            src: e.target.result as string,
            file: file as File
          });
        }
        processedCount++;
        if (processedCount === files.length) {
          setFrames((prev) => [...prev, ...newFrames]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFramesExtracted = (extractedFrames: Frame[]) => {
    saveHistory();
    setFrames((prev) => [...prev, ...extractedFrames]);
  };

  const moveFrame = (index: number, direction: 'left' | 'right') => {
    if (
      (direction === 'left' && index === 0) ||
      (direction === 'right' && index === frames.length - 1)
    ) {
      return;
    }

    saveHistory();

    const newFrames = [...frames];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    
    [newFrames[index], newFrames[targetIndex]] = [newFrames[targetIndex], newFrames[index]];
    setFrames(newFrames);
  };

  const [draggedFrameIndex, setDraggedFrameIndex] = useState<number | null>(null);

  const handleFrameDragStart = (e: React.DragEvent, index: number) => {
    setDraggedFrameIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleFrameDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleFrameDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedFrameIndex === null || draggedFrameIndex === dropIndex) return;

    saveHistory();

    const newFrames = [...frames];
    const [draggedFrame] = newFrames.splice(draggedFrameIndex, 1);
    newFrames.splice(dropIndex, 0, draggedFrame);
    
    setFrames(newFrames);
    setDraggedFrameIndex(null);
  };

  const reverseFrames = () => {
    if (frames.length < 2) return;
    saveHistory();
    setFrames(prev => [...prev].reverse());
  };

  const shuffleFrames = () => {
    if (frames.length < 2) return;
    saveHistory();
    const newFrames = [...frames];
    for (let i = newFrames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newFrames[i], newFrames[j]] = [newFrames[j], newFrames[i]];
    }
    setFrames(newFrames);
  };

  const handleAiReorder = async () => {
    if (frames.length < 2) return;
    
    const apiKey = localStorage.getItem('gifmojo-api-key');
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }

    setIsAiReordering(true);
    try {
      const images = frames.map(f => f.src);
      const indices = await reorderFramesWithAi(images);
      
      saveHistory();
      
      const newFrames = indices.map(i => frames[i]).filter(f => f !== undefined);
      
      if (newFrames.length < frames.length) {
         const usedIds = new Set(newFrames.map(f => f.id));
         const remaining = frames.filter(f => !usedIds.has(f.id));
         newFrames.push(...remaining);
      }
      
      setFrames(newFrames);
    } catch (error) {
      console.error("AI Reorder Error:", error);
      alert("AIによる並べ替えに失敗しました。");
    } finally {
      setIsAiReordering(false);
    }
  };

  const deleteFrame = (index: number) => {
    saveHistory();
    const newFrames = [...frames];
    newFrames.splice(index, 1);
    setFrames(newFrames);
  };

  const confirmClearAll = () => {
    setIsClearModalOpen(true);
  };

  const executeClearAll = () => {
    saveHistory();
    setFrames([]);
    setGeneratedGif(null);
    setStatus(ProcessingStatus.IDLE);
    setAiTitle("");
    setSplitterKey(prev => prev + 1);
    setIsClearModalOpen(false);
  };

  const createGif = useCallback(() => {
    if (frames.length === 0) return;
    
    setStatus(ProcessingStatus.PROCESSING);
    setGeneratedGif(null);
    setProgress(10);

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
        sampleInterval: settings.quality,
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
    <div className={`min-h-screen pb-20 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <header className={`border-b sticky top-0 z-50 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between overflow-x-hidden">
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div className={`p-1.5 sm:p-2 rounded-lg ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <h1 className={`text-base sm:text-lg md:text-2xl font-bold tracking-tight whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              GifMojo <span className="text-indigo-500">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-shrink-0">
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-green-400' : 'bg-gray-100 hover:bg-gray-200 text-green-600'}`}
              title="使い方ガイド"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </button>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-indigo-400' : 'bg-gray-100 hover:bg-gray-200 text-indigo-600'}`}
              title="APIキー設定"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
            </button>
            <button
              onClick={toggleDarkMode}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
              title={isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
            
            <a 
              href="https://gemini.google.com/app" 
              target="_blank" 
              rel="noreferrer" 
              className={`text-[10px] sm:text-xs md:text-sm font-medium transition-colors flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 md:px-3 py-1 rounded-full border whitespace-nowrap ${isDarkMode ? 'text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20' : 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'}`}
            >
              <span className="hidden min-[380px]:inline">Gemini</span>
              <span className="min-[380px]:hidden">G</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" className="sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>

            <a 
              href="https://labs.google.com/mixboard/projects" 
              target="_blank" 
              rel="noreferrer" 
              className={`hidden lg:flex text-xs md:text-sm font-medium transition-colors items-center gap-1 px-2 md:px-3 py-1 rounded-full border ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20' : 'text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'}`}
            >
              <span>Mixboard</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
        
        <PromptGenerator isDarkMode={isDarkMode} />

        <ImageSplitter key={splitterKey} onFramesExtracted={handleFramesExtracted} isDarkMode={isDarkMode} />

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
          
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            <div className={`p-3 sm:p-4 rounded-xl border flex flex-wrap items-center justify-between gap-2 sm:gap-4 sticky top-14 sm:top-20 z-40 shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                  {frames.length} フレーム
                </div>
                <button
                  onClick={undo}
                  disabled={history.length === 0}
                  className={`flex items-center gap-1 text-xs sm:text-sm font-medium transition-colors ${
                    history.length === 0
                      ? isDarkMode ? 'text-slate-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                      : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                  title="元に戻す"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>
                  <span className="hidden sm:inline">元に戻す</span>
                </button>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <div className="flex items-center gap-1 mr-1 sm:mr-2 border-r pr-1 sm:pr-3 border-gray-300 dark:border-slate-600">
                   <button
                    onClick={handleAiReorder}
                    disabled={frames.length < 2 || isAiReordering}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors relative group ${
                      frames.length < 2 || isAiReordering
                        ? 'opacity-50 cursor-not-allowed'
                        : isDarkMode ? 'hover:bg-slate-700 text-purple-400' : 'hover:bg-purple-100 text-purple-600'
                    }`}
                    title="AIで自動並べ替え"
                  >
                    {isAiReordering ? (
                      <div className="animate-spin h-4 w-4 sm:h-4.5 sm:w-4.5 border-2 border-current border-t-transparent rounded-full"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                    )}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      AI自動整列
                    </span>
                  </button>

                   <button
                    onClick={reverseFrames}
                    disabled={frames.length < 2}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                      frames.length < 2
                        ? 'opacity-50 cursor-not-allowed'
                        : isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title="逆順にする"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2.1l4 4-4 4"/><path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8M7 21.9l-4-4 4-4"/><path d="M21 11.8v2a4 4 0 0 1-4 4H4.2"/></svg>
                  </button>
                  <button
                    onClick={shuffleFrames}
                    disabled={frames.length < 2}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                      frames.length < 2
                        ? 'opacity-50 cursor-not-allowed'
                        : isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title="シャッフル"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l5 5M4 4l5 5"/></svg>
                  </button>
                </div>

                <Button 
                  onClick={confirmClearAll} 
                  variant="danger" 
                  disabled={frames.length === 0}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                >
                  <span className="hidden sm:inline">全てクリア</span>
                  <span className="sm:hidden">クリア</span>
                </Button>
              </div>
            </div>

            <div 
              className={`min-h-[300px] sm:min-h-[400px] rounded-xl border-2 border-dashed transition-colors p-3 sm:p-6 ${
                isDraggingMain 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                  : isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-300 bg-gray-50'
              }`}
              onDragOver={handleMainDragOver}
              onDragLeave={handleMainDragLeave}
              onDrop={handleMainDrop}
            >
              {frames.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[250px] sm:min-h-[350px]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" className="sm:w-12 sm:h-12 mb-3 sm:mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  <p className="text-base sm:text-lg font-medium">ここに画像をドロップ</p>
                  <p className="text-xs sm:text-sm mt-2">または</p>
                  <label className="mt-3 sm:mt-4 cursor-pointer">
                    <span className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors shadow-sm inline-block">
                      ファイルを選択
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 justify-items-center">
                  {frames.map((frame, index) => (
                    <div
                      key={frame.id}
                      draggable
                      onDragStart={(e) => handleFrameDragStart(e, index)}
                      onDragOver={(e) => handleFrameDragOver(e, index)}
                      onDrop={(e) => handleFrameDrop(e, index)}
                      className="transition-transform active:scale-95 w-full"
                    >
                      <FrameCard
                        frame={frame}
                        index={index}
                        total={frames.length}
                        onMove={moveFrame}
                        onDelete={deleteFrame}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        <div className="space-y-4 sm:space-y-6">
          
          <div className={`rounded-xl p-4 sm:p-6 border ${isDarkMode ? 'bg-slate-800 border-slate-700 shadow-xl' : 'bg-white border-gray-200 shadow-lg'}`}>
            <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l-.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              設定
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-700'}`}>
                  フレーム切り替え速度 ({settings.interval}秒)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={settings.interval}
                  onChange={(e) => setSettings({ ...settings, interval: parseFloat(e.target.value) })}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-500 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-700'}`}>幅 (px)</label>
                  <input
                    type="number"
                    value={settings.width}
                    onChange={(e) => setSettings({ ...settings, width: parseInt(e.target.value) || 300 })}
                    className={`w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500 shadow-sm'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-700'}`}>高さ (px)</label>
                  <input
                    type="number"
                    value={settings.height}
                    onChange={(e) => setSettings({ ...settings, height: parseInt(e.target.value) || 300 })}
                    className={`w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500 shadow-sm'}`}
                  />
                </div>
              </div>
            </div>

            <div className={`mt-4 p-3 rounded-lg border ${isDarkMode ? 'bg-green-900/20 border-green-700/30' : 'bg-green-50 border-green-200'}`}>
              <p className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                ✓ GIF作成はAPIキーなしで利用できます
              </p>
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

          {generatedGif && (
            <div className={`rounded-xl p-6 border animate-fade-in ${isDarkMode ? 'bg-slate-800 border-slate-700 shadow-xl' : 'bg-white border-gray-200 shadow-lg'}`}>
               <div className="flex items-center justify-between mb-4">
                 <h2 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                   プレビュー
                 </h2>
                 <div className="flex gap-2">
                   <button
                     onClick={togglePreviewPlaying}
                     className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-indigo-400' : 'bg-gray-100 hover:bg-gray-200 text-indigo-600'}`}
                     title={isPreviewPlaying ? '一時停止' : '再生'}
                   >
                     {isPreviewPlaying ? (
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <rect x="6" y="4" width="4" height="16"></rect>
                         <rect x="14" y="4" width="4" height="16"></rect>
                       </svg>
                     ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <polygon points="5 3 19 12 5 21 5 3"></polygon>
                       </svg>
                     )}
                   </button>
                   <button
                     onClick={deletePreview}
                     className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}
                     title="プレビューを削除"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <polyline points="3 6 5 6 21 6"></polyline>
                       <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                       <line x1="10" y1="11" x2="10" y2="17"></line>
                       <line x1="14" y1="11" x2="14" y2="17"></line>
                     </svg>
                   </button>
                 </div>
               </div>

              <div className={`relative rounded-lg p-4 mb-4 group ${isDarkMode ? 'bg-black/20' : 'bg-gray-100'}`}>
                 <img ref={previewImgRef} src={generatedGif} alt="Generated GIF" className="max-w-full rounded shadow-lg mx-auto" />
                 <button
                   onClick={downloadGif}
                   className="absolute bottom-6 right-6 p-3 bg-indigo-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-700 shadow-lg"
                   title="ダウンロード"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                     <polyline points="7 10 12 15 17 10"></polyline>
                     <line x1="12" y1="15" x2="12" y2="3"></line>
                   </svg>
                 </button>
               </div>

               <div className={`mb-4 border rounded-lg p-3 ${isDarkMode ? 'bg-indigo-900/30 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </div>
                    <div className="flex-1">
                      {aiTitle ? (
                        <div className="animate-fade-in">
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>AI提案タイトル:</p>
                          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{aiTitle}</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className={`text-sm ${isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>AIにタイトルを考えてもらう？</p>
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
      </div> 
      </main>
      
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-xl shadow-2xl transform transition-all ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              全てのフレームを削除
            </h3>
            <p className={`mb-6 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
              作業内容がすべて消去されます。この操作は元に戻せますが、よろしいですか？
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setIsClearModalOpen(false)}
              >
                キャンセル
              </Button>
              <Button 
                variant="danger" 
                onClick={executeClearAll}
              >
                削除する
              </Button>
            </div>
          </div>
        </div>
      )}

      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-xl shadow-2xl transform transition-all ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Gemini APIキーの設定
            </h3>
            <p className={`mb-4 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
              AI機能（タイトル生成、自動並べ替え）を使用するには、Google Gemini APIキーが必要です。
              <br />
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">
                Google AI Studioでキーを取得
              </a>
            </p>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="APIキーを入力..."
              className={`w-full px-4 py-2 rounded-lg border mb-4 outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
            <div className="flex justify-between gap-3">
              {localStorage.getItem('gifmojo-api-key') && (
                <Button variant="danger" onClick={deleteApiKey} className="mr-auto">
                  削除
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setIsApiKeyModalOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={saveApiKey}>
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <GuideModal 
        isOpen={isGuideModalOpen} 
        onClose={() => setIsGuideModalOpen(false)} 
        isDarkMode={isDarkMode} 
      />
    </div>
  );
};

export default App;