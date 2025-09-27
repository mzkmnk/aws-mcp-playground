# Remote MCP + AWS 学習プロジェクト - 実装タスクリスト

## このTODOが何をするものか

**目標**: AWSクラウド上でRemote MCPサーバーを構築し、社内限定やセキュリティ要件を満たすMCPサービスを提供する

**具体的な成果物**:
1. **AWS上のRemote MCPサーバー**: Lambda + API Gatewayで動作する、セキュアなMCPプロトコル実装
2. **認証・認可機能**: 社内メンバー限定アクセス、適切なセキュリティ制御
3. **カスタムMCPツール**: 企業固有のデータソースや社内システムとの連携機能
4. **クライアント接続**: Claude Desktop等からHTTPS経由でセキュアに接続

**なぜAWS上でRemote MCPを構築するのか**:
- **セキュリティ**: 社内ネットワークや認証システムとの統合
- **スケーラビリティ**: チーム全体での共有利用、負荷分散
- **管理性**: 中央集権的な管理、監査ログ、アクセス制御
- **カスタマイズ**: 企業固有の要件に対応したMCPツールの提供

**技術学習内容**:
- Remote MCPサーバーの実装パターン
- AWS Serverless アーキテクチャでのMCPホスティング
- MCPプロトコルのHTTP実装とセキュリティ
- 企業向けAI基盤の構築手法

## プロジェクト概要
Serverless Express + AWS Lambda + API Gateway + CDK を使用したRemote MCPサーバーの段階的構築

## Phase 1: 基本Remote MCPサーバー

### 1. プロジェクト初期化
- [x] package.json作成とTypeScript設定
- [x] 必要パッケージ導入
  - [x] express, @types/express
  - [x] @modelcontextprotocol/sdk
  - [x] @codegenie/serverless-express
  - [x] typescript, @types/node
- [x] tsconfig.json設定
- [x] プロジェクト構成フォルダ作成 (src/, dist/, cdk/)

### 2. ローカル開発環境構築
- [ ] Express.jsベースのMCPサーバー実装 (src/app.ts)
- [ ] MCP SDK統合とプロトコル処理
- [ ] S3操作ツール実装
  - [ ] list-buckets ツール
  - [ ] get-object ツール
- [ ] ローカルサーバー起動スクリプト
- [ ] ローカルでの動作確認

### 3. AWS Lambda + CDK実装
- [ ] CDKプロジェクト初期化
- [ ] CDK依存パッケージ導入
- [ ] Lambda関数定義 (src/lambda.ts)
- [ ] CDKスタック作成 (cdk/lib/mcp-stack.ts)
  - [ ] Lambda関数リソース
  - [ ] API Gateway設定
  - [ ] CORS設定
- [ ] CDKデプロイ設定
- [ ] デプロイ実行とエンドポイント確認

### 4. MCP Client接続テスト
- [ ] Claude Desktop設定ファイル作成
- [ ] Remote MCP接続設定
- [ ] 動作確認とデバッグ
- [ ] S3操作ツールのテスト

## Phase 2: 認証・認可機能 (将来的な拡張)
- [ ] AWS Cognito User Pools設定
- [ ] Bearer Token認証実装
- [ ] IAMロールベースアクセス制御
- [ ] セキュリティテスト

## 技術参考資料
- ClassMethod記事: Serverless Express + Lambda + API Gateway
- awslabs/mcp: AWS公式MCPサーバー実装例
- MCP TypeScript SDK ドキュメント

## 現在の状況
- プロジェクト開始日: 2025年
- 現在のPhase: Phase 1 - プロジェクト初期化
- 次のタスク: package.json作成
