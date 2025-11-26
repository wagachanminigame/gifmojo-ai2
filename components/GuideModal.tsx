import React, { useState } from 'react';
import { Button } from './Button';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onOpenApiKeySettings: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose, isDarkMode, onOpenApiKeySettings }) => {
  const [activeTab, setActiveTab] = useState<'start' | 'basic' | 'ai' | 'prompt'>('start');

  if (!isOpen) return null;

  const tabs = [
    { id: 'start', label: 'はじめに & 設定' },
    { id: 'prompt', label: '素材作成' },
    { id: 'basic', label: '基本の使い方' },
    { id: 'ai', label: 'AI機能活用' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
        
        {/* Header */}
        <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-gray-50'}`}>
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            GifMojo AI 使い方ガイド
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-200 text-gray-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                  : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-8 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
          
          {/* Tab: Start & Settings */}
          {activeTab === 'start' && (
            <div className="space-y-8 animate-fade-in">
              <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'}`}>
                <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                  👋 ようこそ GifMojo AI へ！
                </h3>
                <p className={`${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  このツールは、スプライトシート（コマ割り画像）から簡単にGIFアニメーションを作成できるツールです。<br/>
                  AI機能を使えば面倒な設定を自動化できますが、<span className="font-bold">AIなしでも手動ですべての機能を利用できます。</span>
                </p>
              </div>

              <div className="space-y-6">
                <h3 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white text-sm">1</span>
                  APIキーの設定（AI機能を使う場合）
                </h3>
                
                <div className="space-y-8">
                  {/* Step 1: Get Key */}
                  <div className="space-y-3">
                    <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      1. Google AI Studioでキーを取得
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline font-bold">Google AI Studio</a>にアクセスし、
                      <span className="font-bold text-red-500">「APIキーを作成」</span>をクリックしてキーを生成・コピーします。
                    </p>
                    <div className="rounded-lg overflow-hidden border shadow-sm">
                      <img src={`${import.meta.env.BASE_URL}guide/google_ai_studio_apikey.png`} alt="Google AI Studio" className="w-full" />
                    </div>
                  </div>

                  {/* Step 2: Set Key in App */}
                  <div className="space-y-3">
                    <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      2. アプリにキーを設定
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                          ヘッダー右上の<span className="font-bold text-indigo-500">設定ボタン</span>をクリックします。
                        </p>
                        <div className="relative h-40 rounded-lg overflow-hidden border shadow-sm">
                          <img src={`${import.meta.env.BASE_URL}guide/header_apikey_new.png`} alt="Header Settings" className="w-full h-full object-cover object-right-top" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                          キーを貼り付けて<span className="font-bold">「保存する」</span>を押します。
                        </p>
                        <div className="relative h-40 rounded-lg overflow-hidden border shadow-sm">
                          <img src={`${import.meta.env.BASE_URL}guide/apikey_modal_new.png`} alt="API Key Modal" className="w-full h-full object-cover object-center" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center mt-6">
                   <Button onClick={onOpenApiKeySettings} variant="secondary">
                     設定画面を開く
                   </Button>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Basic Usage */}
          {activeTab === 'basic' && (
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-6">
                <h3 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white text-sm">2</span>
                  基本のGIF作成（AIなし）
                </h3>
                <p className={`ml-10 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  APIキーがなくても、手動設定で完璧なGIFが作れます。
                </p>

                <div className="grid gap-8 md:grid-cols-2">
                  {/* Step A */}
                  <div className={`p-4 rounded-xl border space-y-3 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>A. 画像を分割する</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      画像をアップロードし、<span className="text-red-500 font-bold">行数・列数</span>を手動で入力して「フレーム抽出」を押します。
                    </p>
                    <div className="relative rounded-lg overflow-hidden border">
                      <img src={`${import.meta.env.BASE_URL}guide/splitter_tool.png`} alt="Splitter Tool" className="w-full" />
                      {/* Red Marker for Rows/Cols Inputs */}
                      <div className="absolute top-[40%] left-[20px] w-[40%] h-[15%] border-4 border-red-500 rounded bg-red-500/10"></div>
                      <div className="absolute top-[30%] left-[20px] text-red-500 font-bold text-sm bg-white/80 px-1 rounded">数値を入力</div>
                    </div>
                  </div>

                  {/* Step B */}
                  <div className={`p-4 rounded-xl border space-y-3 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>B. メインエリアで編集</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      抽出されたフレームがここに並びます。ドラッグして順番を入れ替えたり、不要なコマを削除できます。
                    </p>
                    <div className="relative rounded-lg overflow-hidden border">
                      <img src={`${import.meta.env.BASE_URL}guide/main_area.png`} alt="Main Area" className="w-full" />
                      {/* Red Marker for Main Area */}
                      <div className="absolute inset-4 border-4 border-red-500 border-dashed rounded bg-red-500/5"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 font-bold bg-white/90 px-3 py-1 rounded shadow">
                        ここにフレームが追加されます
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Prompt Creation */}
          {activeTab === 'prompt' && (
            <div className="space-y-8 animate-fade-in">
              <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'}`}>
                <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                  🎨 Gemini (Nano Banana Pro) で素材を作ろう！
                </h3>
                <p className={`${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  GifMojo AIは、Googleの生成AI「Gemini」の画像生成機能（Nano Banana Pro）と連携して、GIFの素材（スプライトシート）を簡単に作ることができます。<br/>
                  以下の手順で、誰でもハイクオリティな素材が作れます！
                </p>
              </div>

              <div className="space-y-8">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white font-bold">1</div>
                  <div className="space-y-2 flex-1">
                    <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>プロンプトを生成・コピー</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      「AIプロンプト作成」エリアに作りたいもののイメージ（例：「走る猫」）を入力し、「プロンプト生成」ボタンを押します。<br/>
                      生成された英語のプロンプトをコピーします。
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white font-bold">2</div>
                  <div className="space-y-2 flex-1">
                    <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Geminiを開く</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      ヘッダーにある<span className="font-bold text-blue-500">「Gemini」ボタン</span>をクリックして、Google Geminiを開きます。
                    </p>
                    <div className="rounded-lg overflow-hidden border shadow-sm max-w-xs">
                      <img src={`${import.meta.env.BASE_URL}article_images/gemini_button.png`} alt="Gemini Button" className="w-full" />
                    </div>
                  </div>
                </div>

                {/* Step 3: Thought Mode */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white font-bold">3</div>
                  <div className="space-y-2 flex-1">
                    <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>思考モード（3 Pro 搭載）を選択</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      Geminiの入力欄で、<span className="font-bold text-purple-600">「思考モード」</span>を選択します。<br/>
                      これにより、より高品質で意図に沿った画像が生成できます。
                    </p>
                    <div className="rounded-lg overflow-hidden border shadow-sm">
                      <img src={`${import.meta.env.BASE_URL}article_images/gemini_thought_mode.png`} alt="思考モード選択" className="w-full" />
                    </div>
                  </div>
                </div>

                {/* Step 4: Image Tool */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white font-bold">4</div>
                  <div className="space-y-2 flex-1">
                    <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>「画像を作成」ツールを選択</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      入力欄の<span className="font-bold">「＋」ボタン</span>から<span className="font-bold">「ツール」</span>を選び、<br/>
                      バナナのアイコン🍌 <span className="font-bold text-yellow-600">「画像を作成」</span> を押します。
                    </p>
                    <div className="rounded-lg overflow-hidden border shadow-sm">
                      <img src={`${import.meta.env.BASE_URL}article_images/gemini_image_tool.png`} alt="画像作成ツール" className="w-full" />
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white font-bold">5</div>
                  <div className="space-y-2 flex-1">
                    <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>プロンプトを貼り付けて生成</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      Geminiの入力欄に、先ほどコピーしたプロンプトを貼り付けて送信します。<br/>
                      しばらくすると、グリッド画像が生成されます！
                    </p>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white font-bold">6</div>
                  <div className="space-y-2 flex-1">
                    <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>画像を保存してGifMojoへ</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      生成された画像を保存し、GifMojoの「画像分割ツール」にアップロードすれば完了です！
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: AI Features */}
          {activeTab === 'ai' && (
            <div className="space-y-8 animate-fade-in">
               <div className={`p-4 rounded-lg border mb-6 ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-200' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                  <p className="text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    この機能を利用するにはAPIキーの設定が必要です
                  </p>
               </div>

              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  </div>
                  <div>
                    <h4 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>自動グリッド検出</h4>
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      画像をアップロードすると、AIが自動的に「何行×何列」の画像かを解析して入力してくれます。<br/>
                      手動で数える手間が省けます。
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  </div>
                  <div>
                    <h4 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>タイトル自動生成</h4>
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      作成したGIFの内容をAIが見て、面白くてキャッチーなタイトルを提案してくれます。<br/>
                      SNSでシェアする際のネタとして使えます。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`p-6 border-t flex justify-end ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-gray-50'}`}>
          <Button onClick={onClose} variant="primary">
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
};
