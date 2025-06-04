# PLC Web Editor - Advanced PLC Development Studio

🚀 **Enhanced Version 0.2.1** - Web-based PLC Programming Environment for NJ/NX Series

## 🌟 主な機能

### 📝 統合PLCエディタ
- **Structured Text (ST)** - テキストベースのプログラミング
- **Ladder Diagram (LD)** - 視覚的なラダー図エディタ
- **Sequential Function Chart (SFC)** - シーケンシャル制御フローチャート
- **Ladder in ST** - ラダー図とSTの混合プログラミング

### 🔄 リアルタイム変換
- 各言語間での自動変換
- AST（抽象構文木）ベースの高精度変換
- 変換履歴の追跡

### 🛠️ カスタムファンクションブロック
- **FBライブラリ** - カスタムファンクションブロックの管理
- **FB作成エディタ** - 視覚的なファンクションブロック作成
- **テンプレート機能** - 事前定義されたFBテンプレート

### 🔍 高度な機能
- **リアルタイムバリデーション** - 構文チェックとエラー検出
- **ファイル管理** - プロジェクトの保存・読み込み
- **エクスポート機能** - プロジェクトバンドルの出力

## 🚀 使用方法

### オンラインアクセス
[https://yuga-otake.github.io/PLCProgramming/](https://yuga-otake.github.io/PLCProgramming/)

### ローカル開発
```bash
# リポジトリのクローン
git clone https://github.com/Yuga-Otake/PLCProgramming.git
cd PLCProgramming

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 📋 エディタモード

### 1. PLCエディタ
メインのプログラミング環境。4つの言語タブを切り替えて使用：
- **ST**: Structured Textエディタ
- **LD**: Ladder Diagramエディタ  
- **SFC**: Sequential Function Chartエディタ
- **LD-ST**: Ladder in STエディタ

### 2. FBライブラリ
カスタムファンクションブロックの管理：
- 既存FBの閲覧・編集
- 新規FB作成
- テンプレートからの作成

### 3. FB作成エディタ
視覚的なファンクションブロック作成環境：
- ドラッグ&ドロップでの回路作成
- 入出力ピンの設定
- ロジック回路の構築

## 🔧 技術仕様

### フロントエンド
- **Next.js 14** - React フレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Monaco Editor** - コードエディタ

### PLCサポート
- **NJ/NX Series** 互換
- **IEC 61131-3** 準拠
- **ST/LD/SFC** 言語サポート

### デプロイ
- **GitHub Pages** - 静的サイトホスティング
- **GitHub Actions** - CI/CD パイプライン

## 📁 プロジェクト構造

```
src/
├── app/                    # Next.js App Router
├── widgets/               # 大きな機能単位
│   └── plc-editor/       # メインPLCエディタ
├── features/             # 機能別コンポーネント
│   ├── ladder-editor/    # ラダー図エディタ
│   ├── sfc-editor/       # SFCエディタ
│   └── custom-fb-editor/ # カスタムFBエディタ
├── shared/               # 共通機能
│   ├── types/           # 型定義
│   ├── lib/             # ユーティリティ
│   └── ui/              # UIコンポーネント
└── test/                # テストファイル
```

## 🎯 開発ロードマップ

### v0.3.0 (予定)
- [ ] SFCエディタの完全実装
- [ ] ファンクションブロック実行エンジン
- [ ] プロジェクト管理機能の強化

### v0.4.0 (予定)
- [ ] リアルタイム協調編集
- [ ] デバッグ機能
- [ ] シミュレーション機能

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🙏 謝辞

- NJ/NX Series PLC開発チーム
- IEC 61131-3標準委員会
- オープンソースコミュニティ

---

**PLC Studio Team** - Advanced PLC Development Environment 