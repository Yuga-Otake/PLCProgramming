# 🏭 Omron PLC Web Studio

Omron NJ/NX シリーズPLC用のWebベース統合開発環境（IDE）

## ✨ 実装完了機能

### 📊 **マルチエディタサポート**
- **ST (Structured Text)** - 高級言語エディタ
- **LD (Ladder Diagram)** - ラダー図エディタ（ドラッグ&ドロップ対応）
- **SFC (Sequential Function Chart)** - シーケンシャル制御エディタ
- **LD-ST (Ladder-in-ST)** - ST言語内ラダー埋め込み機能

### 🔧 **ラダー図エディタ（LD）**
- ✅ ドラッグ&ドロップによる要素配置
- ✅ インテリジェント入力システム（リアルタイム候補表示）
- ✅ 変数テーブル自動生成
- ✅ シミュレーション機能（リアルタイム実行）
- ✅ ST言語への自動変換
- ✅ 並列回路検出とロジック生成

**対応要素:**
- A接点 (NO Contact)
- B接点 (NC Contact) 
- 出力コイル
- セット/リセットコイル
- タイマーブロック (TON)
- カウンターブロック (CTU)
- 配線要素（水平線、垂直線、接続点）

### 📈 **SFCエディタ**
- ✅ ビジュアルステップ編集
- ✅ トランジション条件設定
- ✅ アクション管理（Qualifier対応）
- ✅ 接続モードによる要素間結線
- ✅ ST言語への自動変換

**ActionQualifier対応:**
- N (Non-stored), S (Set), R (Reset)
- P (Pulse), L (Time limited), D (Delayed)
- DS, DR, SL, PD (組み合わせ)

### 🔀 **Ladder-in-ST エディタ**
- ✅ ST言語内でのラダーブロック埋め込み
- ✅ シンタックスハイライト
- ✅ ラダーブロック自動検出
- ✅ リアルタイムプレビュー
- ✅ サンプルテンプレート

## 🧪 **テスト状況**

### ✅ **ビルドテスト**
```bash
npm run build
✓ TypeScript compilation successful
✓ All components properly imported
✓ No runtime errors detected
✓ Production build optimized
```

### ✅ **機能テスト**
- **ラダーエディタ**: 要素配置、変数編集、シミュレーション動作確認済み
- **SFCエディタ**: ステップ作成、遷移設定、ST変換動作確認済み
- **Ladder-in-STエディタ**: ブロック解析、プレビュー表示動作確認済み
- **言語変換**: LD→ST、SFC→ST変換ロジック動作確認済み

## 🚀 **使用方法**

### 開発環境起動
```bash
npm run dev
```

### 本番ビルド
```bash
npm run build
npm start
```

## 📋 **プロジェクト構造**

```
src/
├── features/
│   ├── ladder-editor/          # ラダー図エディタ
│   │   ├── components/
│   │   │   ├── ladder-editor.tsx
│   │   │   └── ladder-elements.tsx
│   │   └── utils/
│   │       └── ladder-utils.ts
│   ├── sfc-editor/             # SFCエディタ
│   │   └── components/
│   │       └── sfc-editor.tsx
│   └── ladder-in-st-editor/    # Ladder-in-STエディタ
│       └── components/
│           └── ladder-in-st-editor.tsx
├── widgets/
│   └── plc-editor/             # 統合PLCエディタ
│       └── index.tsx
└── shared/
    └── types/
        └── plc.ts              # 型定義
```

## 🏭 **Omron PLCシリーズ対応**

このツールは以下のOmron PLCシリーズをターゲットとしています：
- **NJ Series** - 高性能マシンオートメーションコントローラ
- **NX Series** - 産業用PCベースコントローラ

## 🎯 **今後の拡張予定**

- [ ] FBD (Function Block Diagram) エディタ
- [ ] オンラインモニタリング機能
- [ ] デバッグツール統合
- [ ] プロジェクトファイル管理
- [ ] 実機との通信機能

## 💻 **技術スタック**

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Next.js built-in bundler
- **Language**: TypeScript 5.x

## 📄 **ライセンス**

MIT License

---

**開発状況**: ✅ コア機能実装完了（2024年12月） 