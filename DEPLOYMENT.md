# AWS Lambda + CDK デプロイ手順

## 前提条件

- AWS CLI が設定されていること (`aws configure`)
- AWS CDK が初回ブートストラップされていること

## CDK 初回セットアップ（初回のみ）

```bash
# CDKをブートストラップ（初回のみ）
pnpm run cdk:bootstrap
```

## デプロイ手順

### 1. プロジェクトビルド

```bash
pnpm run build
```

### 2. CDK差分確認（推奨）

```bash
pnpm run cdk:diff
```

### 3. デプロイ実行

```bash
pnpm run cdk:deploy
```

デプロイが完了すると、以下の情報が出力されます：

- **ApiUrl**: API GatewayのベースURL
- **McpEndpoint**: MCPサーバーエンドポイント（`{ApiUrl}/mcp`）
- **LambdaFunctionArn**: Lambda関数のARN

### 4. ヘルスチェック

デプロイ完了後、ヘルスチェックエンドポイントで動作確認：

```bash
curl https://YOUR_API_URL/health
```

## デプロイされるリソース

- **Lambda関数**: Node.js 22.x、512MB RAM、30秒タイムアウト
- **API Gateway**: REST API、CORS有効化、全パスプロキシ
- **IAMロール**: Lambda実行用の基本権限
- **CloudWatch Logs**: 1週間保存設定

## MCP接続テスト

デプロイ後、Claude DesktopのMCP設定で以下のように設定：

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

## リソース削除

```bash
pnpm run cdk:destroy
```
