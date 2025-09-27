# AWS MCP Playground

AWS Lambda + API GatewayでRemote MCPサーバーを動作させるプロジェクトです。AWS CDKを使用してTypeScriptでインフラを構築しています。

## アーキテクチャ

- **AWS Lambda**: Express.jsベースのMCPサーバーを実行
- **API Gateway**: MCP通信用のHTTPSエンドポイントを提供
- **CDK**: TypeScriptによるInfrastructure as Code

## プロジェクト構成

```
aws-mcp-playground/
├── bin/                          # CDKアプリのエントリーポイント
│   └── aws-mcp-playground.ts
├── lib/                          # CDKスタック定義
│   └── aws-mcp-playground-stack.ts
├── src/                          # MCPサーバーのソースコード
│   ├── app.ts                    # Expressアプリ設定
│   ├── index.ts                  # ローカル開発用サーバー
│   ├── lambda.ts                 # Lambdaハンドラー
│   └── tools/                    # MCPツール
├── test/                         # CDK単体テスト
│   └── aws-mcp-playground.test.ts
├── cdk.json                      # CDK設定
└── package.json                  # 依存関係とスクリプト
```

## 開発環境

### 依存関係のインストール

```bash
pnpm install
```

### ビルド

```bash
pnpm run build
```

### ローカル開発

```bash
pnpm run dev
# サーバーが http://localhost:3000 で起動
```

### CDKコマンド

```bash
# CloudFormationテンプレートを生成
pnpm run cdk:synth

# 現在のデプロイとの差分を表示
pnpm run cdk:diff

# AWSにデプロイ
pnpm run cdk:deploy

# AWSリソースを削除
pnpm run cdk:destroy
```

### テスト

```bash
# CDK単体テストを実行
pnpm test

# 監視モード
pnpm run watch
```

## デプロイ手順

1. **AWS CLIの設定**:
   ```bash
   aws configure
   ```

2. **CDKブートストラップ（初回のみ）**:
   ```bash
   pnpm run cdk:bootstrap
   ```

3. **ビルド＆デプロイ**:
   ```bash
   pnpm run cdk:deploy
   ```

4. **デプロイのテスト**:
   ```bash
   curl https://YOUR_API_URL/health
   ```

## MCP統合

Claude DesktopでデプロイしたMCPサーバーを使用する設定:

```json
{
  "mcpServers": {
    "aws-mcp-server": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"],
      "env": {
        "MCP_FETCH_BASE_URL": "https://YOUR_API_URL"
      }
    }
  }
}
```

## 便利なコマンド

- `pnpm run build`          TypeScriptをJavaScriptにコンパイル
- `pnpm run watch`          変更を監視して自動コンパイル
- `pnpm test`               Jest単体テストを実行
- `pnpm run cdk:deploy`     スタックをデフォルトのAWSアカウント/リージョンにデプロイ
- `pnpm run cdk:diff`       デプロイ済みスタックと現在の状態を比較
- `pnpm run cdk:synth`      CloudFormationテンプレートを生成
