# Lambda Web Adapter を使用した Express.js アプリケーション用 Dockerfile
# https://github.com/awslabs/aws-lambda-web-adapter

# Stage 1: Lambda Web Adapter のコピー（最新版）
# https://github.com/awslabs/aws-lambda-web-adapter?tab=readme-ov-file#usage
FROM public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 AS lambda-adapter

# Stage 2: アプリケーションイメージ
FROM node:22-slim

# Lambda Web Adapter を Lambda Extension としてコピー
COPY --from=lambda-adapter /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /app

# 依存関係のインストール
# package.json と pnpm-lock.yaml をコピー
COPY package.json pnpm-lock.yaml ./

# pnpm をインストールして依存関係をインストール（本番環境のみ）
RUN npm install -g pnpm@10.11.0 && \
    pnpm install --prod --frozen-lockfile && \
    npm cache clean --force

# ビルド済みのアプリケーションコードをコピー
COPY dist ./dist

# 環境変数の設定
# Lambda Web Adapter が期待するポート番号
ENV PORT=8080

# Lambda Web Adapter の起動モード設定
# RESPONSE_STREAM モードでストリーミングレスポンスを有効化
ENV AWS_LWA_INVOKE_MODE=RESPONSE_STREAM

# Node.js の本番環境設定
ENV NODE_ENV=production

# Expressサーバーを起動
# Lambda Web Adapter が自動的にこのプロセスを管理
CMD ["node", "dist/index.js"]
