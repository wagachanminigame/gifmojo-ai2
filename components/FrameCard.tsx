import React from 'react';
import { Frame } from '../types';

interface FrameCardProps {
  frame: Frame;
  index: number;
  total: number;
  isDarkMode: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onDelete: () => void;
}

export const FrameCard: React.FC<FrameCardProps> = ({
  frame,
  index,
  total,
  isDarkMode,
  onMoveLeft,
  onMoveRight,
  onDelete,
}) => {
  return (
    <div className={`group relative rounded-xl overflow-hidden shadow-md border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-indigo-500/50' : 'bg-white border-gray-200 hover:border-indigo-400'}`}>
      <div className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-10 ${isDarkMode ? 'bg-black/60' : 'bg-gray-900/70'}`}>
        #{index + 1}
      </div>
      
      <div className={`aspect-square w-full overflow-hidden ${isDarkMode ? 'bg-slate-900 pattern-grid' : 'bg-gray-50'}`}>
        <img 
          src={frame.src} 
          alt={`Frame ${index + 1}`} 
          className="w-full h-full object-contain"
        />
      </div>

      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
        <div className="flex justify-end">
          <button 
            onClick={onDelete}
            className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
            title="削除"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="flex justify-between items-center gap-2">
          <button 
            onClick={onMoveLeft}
            disabled={index === 0}
            className={`p-1.5 text-white rounded transition-colors disabled:opacity-30 ${isDarkMode ? 'bg-slate-700 hover:bg-indigo-600 disabled:hover:bg-slate-700' : 'bg-gray-700 hover:bg-indigo-500 disabled:hover:bg-gray-700'}`}
            title="前へ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          
          <button 
            onClick={onMoveRight}
            disabled={index === total - 1}
            className={`p-1.5 text-white rounded transition-colors disabled:opacity-30 ${isDarkMode ? 'bg-slate-700 hover:bg-indigo-600 disabled:hover:bg-slate-700' : 'bg-gray-700 hover:bg-indigo-500 disabled:hover:bg-gray-700'}`}
            title="次へ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
