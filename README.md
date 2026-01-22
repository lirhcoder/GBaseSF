# AI営業報告システム / AI Visit Report System

Salesforce + Claude AI を活用した営業訪問報告の自動化システム

## 機能 / Features

- **音声入力**: ブラウザのWeb Speech APIを使用した音声からテキストへの変換
- **AI分析**: Claude APIによる訪問内容の自動構造化
- **レポート生成**: PDF形式での報告書出力
- **Salesforce連携**: Account/Contactとの自動関連付け

## システム要件 / Requirements

- Salesforce Developer Edition または Production Org
- Claude API Key (Anthropic)
- 対応ブラウザ: Chrome, Edge, Safari (音声認識機能)

## インストール手順 / Installation

### 1. Salesforce CLIのインストール

```bash
npm install -g @salesforce/cli
```

### 2. Orgへの認証

```bash
# Developer Edition の場合
sf org login web --alias my-dev-org --instance-url https://login.salesforce.com

# Sandbox の場合
sf org login web --alias my-sandbox --instance-url https://test.salesforce.com
```

### 3. ソースコードのデプロイ

```bash
cd gbase-sf-integration
sf project deploy start --source-dir force-app --target-org my-dev-org
```

### 4. Permission Setの割り当て

```bash
sf org assign permset --name AI_Visit_Report_User --target-org my-dev-org
```

### 5. Claude API Keyの設定

1. Setup → Custom Metadata Types → Claude API Settings → Manage Records
2. "Default" レコードを編集
3. API_Key__c フィールドに Claude API Key を入力

### 6. アプリケーションへのアクセス

1. App Launcher から "AI営業報告" を検索
2. または直接タブ "AI_Visit_Report" にアクセス

## 使用方法 / Usage

### 音声入力での報告作成

1. 「録音開始」ボタンをクリック
2. 訪問内容を話す（例：「今日ABC会社の田中部長を訪問しました...」）
3. 「停止」ボタンをクリック
4. 「AI分析を実行」をクリック
5. 分析結果を確認・編集
6. 「保存」をクリック
7. 「PDFダウンロード」で報告書を出力

### テキスト入力での報告作成

1. テキストエリアに訪問内容を入力
2. 「AI分析を実行」をクリック
3. 以降同様

## プロジェクト構造 / Project Structure

```
force-app/main/default/
├── classes/
│   ├── ClaudeAPIService.cls      # Claude API連携
│   ├── VisitReportController.cls  # メインコントローラー
│   └── VisitReportPDFController.cls # PDF生成
├── lwc/
│   ├── voiceInput/               # 音声入力コンポーネント
│   ├── visitReportForm/          # 報告書フォーム
│   ├── reportPreview/            # プレビュー
│   └── visitReportApp/           # メインアプリ
├── objects/
│   ├── Visit_Report__c/          # カスタムオブジェクト
│   └── Claude_API_Settings__mdt/ # API設定メタデータ
├── pages/
│   └── VisitReportPDF.page       # PDF テンプレート
└── remoteSiteSettings/
    └── Claude_API.remoteSite-meta.xml
```

## カスタマイズ / Customization

### AIプロンプトの変更

`ClaudeAPIService.cls` の `buildAnalysisPrompt()` メソッドを編集

### PDFテンプレートの変更

`VisitReportPDF.page` のHTMLとCSSを編集

## トラブルシューティング / Troubleshooting

### AI分析が失敗する場合

1. Claude API Keyが正しく設定されているか確認
2. Remote Site Settingsで `api.anthropic.com` が有効か確認
3. Apex Debugログでエラー内容を確認

### 音声認識が動作しない場合

1. 対応ブラウザ（Chrome/Edge/Safari）を使用しているか確認
2. マイクのアクセス許可を確認
3. HTTPSでアクセスしているか確認

## ライセンス / License

MIT License

## サポート / Support

GBase SF Integration Team
