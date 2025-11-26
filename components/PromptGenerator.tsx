import React, { useState } from 'react';
import { Button } from './Button';
import { generatePromptForNanoBanana } from '../services/geminiService';

interface PromptGeneratorProps {
  isDarkMode: boolean;
}

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({ isDarkMode }) => {
  const [input, setInput] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    try {
      const prompt = await generatePromptForNanoBanana(input);
      setGeneratedPrompt(prompt);
      setIsCopied(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl p-6 border mb-8 transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 shadow-xl' : 'bg-white border-gray-200 shadow-lg'}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>
        </div>
        <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          AIプロンプト作成 <span className="text-xs font-normal opacity-70 ml-2">Nano Banana Pro用</span>
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
            どんなGIFを作りたい？
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例: 走る猫、剣を振る戦士、爆発エフェクト..."
              className={`flex-1 px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <Button 
              onClick={handleGenerate} 
              isLoading={isLoading}
              disabled={!input.trim()}
              className="whitespace-nowrap"
            >
              プロンプト生成
            </Button>
          </div>
        </div>

        {generatedPrompt && (
          <div className={`p-4 rounded-lg border animate-fade-in ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
            <label className={`block text-xs font-medium mb-2 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Generated Prompt (English)
            </label>
            <p className={`text-sm mb-3 font-mono ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
              {generatedPrompt}
            </p>
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                  isCopied
                    ? 'bg-green-500/20 text-green-500'
                    : isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {isCopied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    コピーしました
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    コピー
                  </>
                )}
              </button>
              
              <a
                href="https://gemini.google.com/app"
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                  isDarkMode 
                    ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' 
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                <span>Geminiを開く</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
