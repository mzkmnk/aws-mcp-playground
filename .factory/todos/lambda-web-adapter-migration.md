# Lambda Web Adapter移行プラン

## 概要

API Gateway + serverless-express構成から、Lambda Function URL + Lambda Web Adapter構成への移行計画

**目的:**
- Streamable HTTP（MCP Protocol）の完全サポート
- SSE（Server-Sent Events）の有効化
- コスト削減（API Gateway料金の削減）
- シンプルな構成への移行

---

## 現在の構成 vs 新構成

### 現在（API Gateway版）
```
Client → API Gateway → Lambda → serverless-express → Express → MCP Server
         ❌バッファ     ❌バッファ
```

**問題点:**
- API Gatewayが全レスポンスをバッファリング（30秒タイムアウト）
- serverless-expressもバッファリング
- Streamable HTTP/SSEが動作しない

### 新構成（Lambda Function URL版）
```
Client → Lambda Function URL → Lambda → Lambda Web Adapter → Express → MCP Server
         ✅ストリーミング                ✅変換レイヤー
```

**改善点:**
- ストリーミングレスポンス完全対応（最大200MB）
- SSE完全サポート
- 最大15分実行可能（API Gatewayは30秒）
- コスト削減（API Gateway料金不要）
- コード変更最小限

---

## 移行フェーズ

### ✅ フェーズ1: 現状確認とバックアップ
**ステータス:** 完了

- [x] 現在のブランチ確認: `feat/add-logs-api-gateway`
- [x] 必要な依存関係確認
- [x] 現在の構成を把握

### ✅ フェーズ2: Dockerファイルの作成
**ステータス:** 完了

**作成ファイル:**
- [x] `Dockerfile` - Lambda Web Adapter対応
- [x] `.dockerignore` - 不要ファイル除外
- [x] `src/index.ts` 確認（変更不要）

**Dockerfile仕様:**
- ベースイメージ: `public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1`（最新版）
- Node.js: 22-slim
- 起動モード: `RESPONSE_STREAM`
- ポート: 8080

### ✅ フェーズ3: CDKスタックの修正
**ステータス:** 完了

**修正ファイル:**
- [x] `lib/aws-mcp-playground-stack.ts` - メイン変更
- [x] `test/aws-mcp-playground.test.ts` - テスト更新

**主な変更内容:**
```typescript
// 削除
- import * as apigateway from 'aws-cdk-lib/aws-apigateway';
- const api = new apigateway.RestApi(...)
- new NodejsFunction(...)

// 追加
+ import * as lambda from 'aws-cdk-lib/aws-lambda';
+ const mcpLambda = new lambda.DockerImageFunction(...)
+ const functionUrl = mcpLambda.addFunctionUrl({
+   authType: lambda.FunctionUrlAuthType.NONE,
+   invokeMode: lambda.InvokeMode.RESPONSE_STREAM,
+   cors: { ... }
+ })
```

**重要な設定:**
- `invokeMode: InvokeMode.RESPONSE_STREAM` - ストリーミング有効化
- `authType: FunctionUrlAuthType.NONE` - 認証なし（必要に応じて変更）
- CORS設定の移行
- CloudWatch Logs設定

### ⏳ フェーズ4: ローカルでのDockerテスト
**ステータス:** 未実施

**テスト手順:**
```bash
# 1. TypeScriptビルド
pnpm run build

# 2. Dockerイメージビルド
docker build -t mcp-server-test .

# 3. ローカル実行
docker run -p 8080:8080 mcp-server-test

# 4. テスト
curl http://localhost:8080/health
```

**確認項目:**
- [ ] `/health`エンドポイント正常応答
- [ ] レスポンスが正しいJSON形式
- [ ] ログ出力正常
- [ ] コンテナ起動・停止正常

**想定イメージサイズ:** 約200-250MB

### ⏳ フェーズ5: AWSへのデプロイ
**ステータス:** 未実施

**デプロイ手順:**
```bash
# 差分確認
pnpm run cdk:diff

# デプロイ実行
pnpm run cdk:deploy
```

**自動実行されること:**
1. Dockerイメージビルド
2. Amazon ECRにプライベートリポジトリ作成
3. イメージをECRにプッシュ
4. Lambda関数作成（Dockerイメージ）
5. Function URL作成
6. API Gateway削除（既存の場合）

**予想デプロイ時間:** 15-20分

### ⏳ フェーズ6: 動作確認とテスト
**ステータス:** 未実施

**テストケース:**

#### 1. ヘルスチェック
```bash
FUNCTION_URL="https://xxx.lambda-url.ap-northeast-1.on.aws"
curl $FUNCTION_URL/health
```
期待: `{"status":"ok","timestamp":"..."}`

#### 2. MCP初期化リクエスト
```bash
curl -X POST $FUNCTION_URL/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test-client", "version": "1.0.0"}
    }
  }'
```

#### 3. SSEストリーム確認（GET /mcp）
セッションID付きでSSEストリームが正常に動作するか確認

**確認項目:**
- [ ] ヘルスチェック成功
- [ ] MCP初期化成功
- [ ] Mcp-Session-Idヘッダー返却
- [ ] CloudWatchログ正常
- [ ] コールドスタート時間計測（初回）
- [ ] レスポンスタイム計測

**更新ドキュメント:**
- [ ] `DEPLOYMENT.md` - デプロイ済みエンドポイント記録
- [ ] `README.md` - アーキテクチャ図確認
- [ ] このファイル（移行プラン）を完了状態に更新

**Git操作:**
```bash
git add .
git commit -m "feat: migrate to Lambda Function URL with Lambda Web Adapter

- Replace API Gateway with Lambda Function URL
- Add Lambda Web Adapter for Express.js support
- Enable RESPONSE_STREAM mode for SSE/Streaming
- Update architecture documentation

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"
```

---

## 技術詳細

### Lambda Web Adapterとは

**公式リポジトリ:** https://github.com/awslabs/aws-lambda-web-adapter

Lambda Web Adapterは、既存のWeb アプリケーション（Express.js、Flask、Spring Bootなど）をAWS Lambda上で動作させるための軽量なアダプターです。

**主な機能:**
- HTTPサーバーをLambdaイベント形式に変換
- ストリーミングレスポンス対応
- 既存コードを最小限の変更で利用可能

**仕組み:**
```
Lambda Function URL → Lambda Runtime → Lambda Web Adapter (Extension) → Express Server (Port 8080)
```

Lambda Web Adapterは Lambda Extension として動作し、以下を行います：
1. Lambda Eventを受信
2. HTTPリクエストに変換してExpressサーバー（localhost:8080）に転送
3. Expressからのレスポンスを受け取り
4. Lambda Response形式に変換して返却
5. ストリーミングレスポンスの場合はチャンク単位で転送

### なぜserverless-expressを使わないのか

**serverless-expressの問題点:**
- 常駐HTTPサーバー前提ではない設計
- レスポンスをバッファリングしてから返す
- ストリーミングレスポンス非対応

**Lambda Web Adapterの利点:**
- ストリーミングレスポンス完全対応
- AWS公式の軽量アダプター
- Expressをそのまま使用可能（`src/index.ts`を変更不要）

---

## コスト試算

### 現在の構成（API Gateway + Lambda）
```
想定トラフィック: 100リクエスト/日 = 3,000リクエスト/月
実行時間: 平均500ms、512MB

Lambda実行: $0.20/月
API Gateway: $0.10/月（100万リクエストまで$3.50、按分）
合計: $0.30/月
```

### 新構成（Lambda Function URL）
```
想定トラフィック: 100リクエスト/日 = 3,000リクエスト/月
実行時間: 平均500ms、512MB

Lambda実行: $0.20/月
ECRストレージ: $0.025/月（250MB × $0.10/GB）
合計: $0.225/月
```

**月間削減額:** $0.075/月（約25%削減）  
**年間削減額:** $0.90/年

トラフィックが増えるほど削減効果は大きくなります。

---

## リスク管理

### 想定リスクと対策

| リスク | 影響度 | 確率 | 対策 |
|--------|--------|------|------|
| Dockerビルド失敗 | 中 | 低 | ローカルで事前テスト |
| ECRプッシュ失敗 | 中 | 低 | AWS認証確認 |
| Lambda起動失敗 | 高 | 低 | CloudWatchログで調査 |
| MCP接続失敗 | 高 | 中 | curlで段階的テスト |
| コールドスタート遅延 | 低 | 高 | 許容範囲（3-5秒） |

### ロールバック手順

**問題が発生した場合:**
```bash
# 1. Gitで以前のコミットに戻す
git log --oneline -5
git checkout <previous-commit>

# 2. 以前の構成を再デプロイ
pnpm run cdk:deploy

# 3. または新スタックを削除
aws cloudformation delete-stack --stack-name AwsMcpPlaygroundStack
```

**注意:** 新しいFunction URLは削除され、API Gatewayが再作成されます。

---

## 成功基準

### 必須条件（Must Have）
- [x] Dockerファイル作成完了
- [ ] ローカルでのDocker動作確認
- [ ] AWSへのデプロイ成功
- [ ] `/health`エンドポイント正常動作
- [ ] MCP初期化リクエスト成功

### 推奨条件（Should Have）
- [ ] SSEストリームの動作確認
- [ ] コールドスタート時間が5秒以内
- [ ] レスポンスタイムが1秒以内（Warm状態）
- [ ] CloudWatchログの正常確認

### 理想条件（Nice to Have）
- [ ] Claude DesktopからのMCP接続成功
- [ ] 複数セッションの同時接続テスト
- [ ] パフォーマンスメトリクスの記録

---
