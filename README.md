# 🎬 GifMojo AI

**AI搭載のGIFアニメーション作成ツール**

GifMojo AIは、複数の画像を簡単にGIFアニメーションに変換できるWebアプリケーションです。Google Gemini AIを活用して、アニメーションに最適なタイトルを自動生成します。

## ✨ 特徴

- 🖼️ **複数画像対応** - ドラッグ&ドロップで簡単に画像を追加
- 🔄 **フレーム編集** - フレームの並び替え、削除が直感的に操作可能
- ⚙️ **カスタマイズ可能** - フレーム速度、サイズ、品質を細かく調整
- 🤖 **AI自動タイトル生成** - Gemini AIがGIFの内容を分析して最適なタイトルを提案
- 🎨 **モダンなUI** - Tailwind CSSによる美しいダークモードインターフェース
- 💾 **簡単ダウンロード** - 生成したGIFをワンクリックでダウンロード

## 🚀 ローカル実行

**必要なもの:** Node.js (v16以上推奨)

### 1. 依存関係のインストール
```bash
npm install
```

### 2. Gemini APIキーの設定
`.env.local`ファイルに以下を記述してください：
```
GEMINI_API_KEY=your_api_key_here
```

Gemini APIキーは[Google AI Studio](https://aistudio.google.com/app/apikey)で取得できます。

### 3. アプリの起動
```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開いてアクセスできます。

## 📖 使い方

1. **画像の追加** - 「画像を追加」ボタンをクリックするか、ドラッグ&ドロップで画像をアップロード
2. **フレームの編集** - フレームをホバーして並び替えや削除を実行
3. **設定の調整** - フレーム切り替え速度や出力サイズをカスタマイズ
4. **GIF作成** - 「GIFを作成」ボタンをクリック
5. **AIタイトル生成** - （オプション）AIにタイトルを提案してもらう
6. **ダウンロード** - 完成したGIFをダウンロード

## 🛠️ 技術スタック

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **GIF Engine:** gifshot.js
- **AI:** Google Gemini API (@google/genai)

## 📝 ライセンス

このプロジェクトは個人利用およびテスト目的で公開されています。

---

Made with ❤️ using Google Gemini AI
