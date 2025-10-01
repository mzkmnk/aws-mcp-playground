# Docker初心者向け解説

## Dockerとは？

**料理で例えると：**
- **レシピ（Dockerfile）**: 料理の作り方の手順書
- **食材リスト（.dockerignore）**: 使わない食材のメモ
- **完成した料理（Dockerイメージ）**: 実際に作った料理
- **お皿に盛った料理（コンテナ）**: 食べられる状態

**ソフトウェアで言うと：**
- Dockerfileは「アプリをどう組み立てるか」の設計書
- Dockerイメージは「組み立てた完成品」
- コンテナは「実際に動いている状態」

---

## Dockerfileの詳細解説

### 全体像

```dockerfile
# 1. 基礎を準備
FROM xxx

# 2. 必要なものをコピー
COPY xxx

# 3. 必要なものをインストール
RUN xxx

# 4. 設定を行う
ENV xxx

# 5. 起動コマンドを設定
CMD xxx
```

---

### 各行の詳しい説明

#### 📦 **ステージ1: Lambda Web Adapterの準備**

```dockerfile
FROM public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 AS lambda-adapter
```

**何をしている？**
- Lambda Web Adapterという道具を取ってくる

**料理で例えると：**
- 「スーパーから計量カップを買ってくる」みたいなもの
- この道具は後で使うために一時的に保管しておく

**なぜ必要？**
- ExpressサーバーをLambdaで動かすための変換ツール
- AWS公式が用意してくれている便利道具

**`AS lambda-adapter`とは？**
- この準備に「lambda-adapter」という名前をつける
- 後で「lambda-adapterから道具を取り出す」ときに使う

---

#### 🏗️ **ステージ2: メインのアプリケーション**

```dockerfile
FROM node:22-slim
```

**何をしている？**
- Node.js（JavaScriptを実行する環境）の入った基礎を準備

**料理で例えると：**
- 「調理器具が全部揃ったキッチンを用意する」

**なぜ`node:22-slim`？**
- `node:22` = Node.jsのバージョン22
- `slim` = 軽量版（必要最小限のもののみ）
- 通常版より小さくて速い

**サイズ比較：**
- `node:22` = 約1GB
- `node:22-slim` = 約150MB（約85%削減！）

---

```dockerfile
COPY --from=lambda-adapter /lambda-adapter /opt/extensions/lambda-adapter
```

**何をしている？**
- ステージ1で準備したLambda Web Adapterをコピー

**料理で例えると：**
- 「買ってきた計量カップをキッチンの引き出しに入れる」

**パスの説明：**
- `--from=lambda-adapter` = ステージ1から取ってくる
- `/lambda-adapter` = コピー元（ステージ1内の場所）
- `/opt/extensions/lambda-adapter` = コピー先（Lambdaが認識する特別な場所）

**なぜ`/opt/extensions/`？**
- Lambdaが「拡張機能はここに置いてね」と決めている場所
- ここに置くと自動的に認識される

---

```dockerfile
WORKDIR /app
```

**何をしている？**
- 作業ディレクトリを`/app`に設定

**料理で例えると：**
- 「キッチンカウンターの上で作業する」と決める

**この後の影響：**
```dockerfile
COPY package.json .    # /app/package.json にコピーされる
RUN npm install        # /app で実行される
```

すべての操作がこの`/app`ディレクトリ内で行われる。

---

```dockerfile
COPY package.json pnpm-lock.yaml ./
```

**何をしている？**
- 依存関係の定義ファイルを2つコピー

**料理で例えると：**
- 「レシピと材料リストをキッチンに持ってくる」

**ファイルの役割：**
1. **package.json** = 「何が必要か」のリスト
   ```json
   {
     "dependencies": {
       "express": "^4.21.2",
       "...": "..."
     }
   }
   ```

2. **pnpm-lock.yaml** = 「具体的にどのバージョンを使ったか」の記録
   - これがあると、誰が作っても全く同じバージョンでインストールできる

**なぜこの2つだけ先にコピー？**
- Dockerの「レイヤーキャッシュ」という仕組みを活用
- この2ファイルが変わらなければ、次の`RUN`をスキップできる（高速化）

---

```dockerfile
RUN npm install -g pnpm@10.11.0 && \
    pnpm install --prod --frozen-lockfile && \
    npm cache clean --force
```

**何をしている？**
- パッケージマネージャー（pnpm）をインストール
- 本番環境用の依存関係をインストール
- キャッシュをクリーンアップ

**料理で例えると：**
1. 「調理器具（pnpm）を買ってくる」
2. 「レシピに書いてある材料だけを買ってくる」
3. 「買い物袋を捨てる」

**各コマンドの説明：**

**1. `npm install -g pnpm@10.11.0`**
- `npm` = Node.jsのパッケージマネージャー（デフォルト）
- `-g` = グローバルにインストール（どこからでも使える）
- `pnpm@10.11.0` = pnpmのバージョン10.11.0

**2. `pnpm install --prod --frozen-lockfile`**
- `--prod` = 本番環境用のみ（devDependenciesは除外）
  ```json
  // これはインストールされる
  "dependencies": { "express": "^4.21.2" }
  
  // これはインストールされない（本番不要）
  "devDependencies": { "typescript": "^5.9.2" }
  ```
- `--frozen-lockfile` = lockファイルを厳密に守る（変更禁止）

**3. `npm cache clean --force`**
- インストール時の一時ファイルを削除
- イメージサイズを小さくする

**`&&`とは？**
- コマンドを連続実行する記号
- 前のコマンドが成功したら次を実行
- 失敗したらそこで停止

**`\`とは？**
- 長いコマンドを複数行に分割する記号
- 読みやすくするため

---

```dockerfile
COPY dist ./dist
```

**何をしている？**
- ビルド済みのJavaScriptファイルをコピー

**料理で例えると：**
- 「下ごしらえ済みの食材を持ってくる」

**なぜ`src`ではなく`dist`？**
```
TypeScript (src/)  →  JavaScript (dist/)
     ↓ビルド          ↓実行
 人間が書く         Node.jsが実行
```

- TypeScriptはNode.jsで直接実行できない
- 事前に`pnpm run build`でJavaScriptに変換
- Dockerイメージには変換後のファイルだけを入れる

**ディレクトリ構造：**
```
ローカル:
  /Users/mzkmnk/dev/aws-mcp-playground/dist/
    ├── index.js
    ├── app.js
    └── ...

Docker内:
  /app/dist/
    ├── index.js
    ├── app.js
    └── ...
```

---

#### ⚙️ **環境変数の設定**

```dockerfile
ENV PORT=8080
ENV AWS_LWA_INVOKE_MODE=RESPONSE_STREAM
ENV NODE_ENV=production
```

**何をしている？**
- アプリの動作を制御する設定値を定義

**料理で例えると：**
- 「オーブンの温度を180度に設定」みたいなもの

**各環境変数の説明：**

**1. `PORT=8080`**
```javascript
// src/index.ts で使われる
const port = process.env.PORT || 3000;
//           ↑ここで8080が入る
```
- Expressサーバーが起動するポート番号
- Lambda Web Adapterは8080で待ち受ける設定になっている
- この2つを合わせる必要がある

**2. `AWS_LWA_INVOKE_MODE=RESPONSE_STREAM`**
- Lambda Web Adapterの動作モード設定
- `RESPONSE_STREAM` = ストリーミングレスポンスを有効化
- これがないとSSEが動作しない

**3. `NODE_ENV=production`**
- Node.jsの環境を「本番」に設定
- 本番モードでは：
  - エラーメッセージが簡潔になる
  - パフォーマンスが最適化される
  - デバッグ情報が出力されない

---

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"
```

**何をしている？**
- アプリが正常に動いているかを定期的にチェック

**料理で例えると：**
- 「30秒ごとに料理の火加減をチェックする」

**各オプションの説明：**
- `--interval=30s` = 30秒ごとにチェック
- `--timeout=3s` = 3秒以内に応答がなければ失敗
- `--start-period=5s` = 起動後5秒は猶予期間
- `--retries=3` = 3回連続失敗したら「不健康」と判定

**チェック内容：**
```javascript
// これをコマンドで実行している
require('http').get('http://localhost:8080/health', (res) => {
  // /healthエンドポイントにアクセス
  if (res.statusCode === 200) {
    process.exit(0); // 成功 = 終了コード0
  } else {
    process.exit(1); // 失敗 = 終了コード1
  }
});
```

**Dockerでの動作：**
```bash
docker ps
# CONTAINER ID   IMAGE     STATUS
# abc123         app       Up (healthy)    ← ヘルスチェック成功
# def456         app       Up (unhealthy)  ← ヘルスチェック失敗
```

**注意：**
- Lambdaではヘルスチェックは実行されない
- ローカルでDockerを動かすときにのみ有効

---

```dockerfile
CMD ["node", "dist/index.js"]
```

**何をしている？**
- コンテナ起動時に実行するコマンドを指定

**料理で例えると：**
- 「火をつけて調理を始める」

**詳細：**
```dockerfile
CMD ["node", "dist/index.js"]
     ↓     ↓
  実行ファイル  引数
```

実際に実行されるコマンド：
```bash
node dist/index.js
```

これは以下と同じ：
```bash
# ローカルで実行する場合
cd /Users/mzkmnk/dev/aws-mcp-playground
node dist/index.js
```

**`dist/index.js`の中身：**
```javascript
import { createMcpApp } from './app';

const port = process.env.PORT || 3000;  // 8080になる
const { app } = createMcpApp();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

**なぜJSON形式`["node", "dist/index.js"]`？**
```dockerfile
# 推奨（JSON形式）
CMD ["node", "dist/index.js"]

# 非推奨（シェル形式）
CMD node dist/index.js
```

JSON形式の利点：
- シェルを介さず直接実行（高速）
- シグナル（停止命令など）が正しく伝わる
- セキュリティが良い

---

## .dockerignoreの詳細解説

### .dockerignoreとは？

**料理で例えると：**
- 「キッチンに持ち込まないもののリスト」
- ゴミ箱や掃除道具は調理に不要なので持ち込まない

**ソフトウェアで言うと：**
- Dockerイメージに含めないファイル/フォルダのリスト
- ビルドが速くなる、イメージサイズが小さくなる

---

### 各セクションの説明

#### 📦 **Node.js関連**

```dockerignore
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
```

**除外する理由：**

**1. `node_modules/`**
```
ローカル:
  node_modules/  ← 1万個以上のファイル、約200MB

Docker内:
  (何もコピーしない)
  ↓
  pnpm install で再インストール
```

- ローカルのnode_modulesはDocker内で使えない可能性がある
  - OS依存のネイティブモジュール（例：bcrypt、sharp）
  - macOS用でビルドされたものはLinux（Docker）で動かない
- Docker内で新たにインストールする方が安全

**2. デバッグログファイル**
- 開発中のエラーログ
- 本番環境には不要

---

#### 📝 **TypeScriptソースファイル**

```dockerignore
src/
*.ts
!dist/**/*.js
tsconfig.json
```

**除外する理由：**

**1. `src/`ディレクトリ**
```
src/app.ts       → dist/app.js      ← これを使う
src/index.ts     → dist/index.js    ← これを使う
    ↑不要           ↑必要
```

- TypeScriptファイルは実行できない
- ビルド済みのJavaScript（dist/）だけで十分

**2. `*.ts`（すべての.tsファイル）**
- TypeScriptファイル全般を除外

**3. `!dist/**/*.js`（重要！）**
- `!` = 例外（この行は含める）
- distフォルダ内の.jsファイルは除外しない
- これがないとdist内のファイルも除外される

**4. `tsconfig.json`**
- TypeScriptの設定ファイル
- ビルド時に使うが、実行時は不要

---

#### 🧪 **テスト関連**

```dockerignore
test/
*.test.ts
*.test.js
*.spec.ts
*.spec.js
jest.config.js
coverage/
```

**除外する理由：**

```
test/app.test.ts       ← テストコード（本番不要）
jest.config.js         ← テスト設定（本番不要）
coverage/              ← テスト結果（本番不要）
```

- テストは開発時に実行済み
- 本番環境では実行しない
- これらを含めると無駄にサイズが大きくなる

---

#### 🏗️ **CDK関連**

```dockerignore
bin/
lib/
cdk.out/
cdk.context.json
*.d.ts
```

**除外する理由：**

```
bin/                      ← CDKアプリのエントリーポイント
lib/                      ← CDKスタック定義
cdk.out/                  ← CloudFormationテンプレート
  ↑これらはインフラ管理用
  ↑アプリの実行には不要
```

- CDKはインフラをデプロイするためのツール
- アプリケーション本体とは別物
- Docker内には含めない

**`*.d.ts`とは？**
```typescript
// index.d.ts（型定義ファイル）
export function hello(): string;
```
- TypeScriptの型情報のみのファイル
- 実行時は不要（開発時の補助情報）

---

#### 📚 **ドキュメント**

```dockerignore
*.md
docs/
```

**除外する理由：**
- README.md、DEPLOYMENT.mdなど
- 人間が読むためのドキュメント
- アプリの実行には不要

---

#### 🔒 **環境変数と設定ファイル**

```dockerignore
.env
.env.local
.env.*.local
```

**除外する理由：**

```
.env（ローカル開発用）:
  DATABASE_URL=localhost:5432
  API_KEY=dev_key_12345
    ↑本番環境では使えない
    ↑セキュリティリスク
```

- 環境変数は環境ごとに異なる
- Dockerイメージに含めるべきではない
- Lambdaの環境変数設定で指定する

---

#### 🛠️ **エディタ設定**

```dockerignore
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
```

**除外する理由：**
- VS Codeの設定（.vscode/）
- IntelliJ IDEAの設定（.idea/）
- Vimの一時ファイル（*.swp）
- macOSのシステムファイル（.DS_Store）
- これらは個人の開発環境用
- アプリには全く関係ない

---

#### 🗑️ **その他**

```dockerignore
*.log
logs/
tmp/
temp/
.cache/
*.tsbuildinfo
```

**除外する理由：**
- ログファイル（.log、logs/）
- 一時ファイル（tmp/、temp/）
- キャッシュ（.cache/）
- ビルド情報（*.tsbuildinfo）

これらを含めても動作には影響しないが、無駄にサイズが増える。

---

## サイズの比較

### .dockerignoreなしの場合

```
プロジェクトルート全体:
  node_modules/     200MB
  src/              2MB
  test/             1MB
  docs/             0.5MB
  dist/             1MB
  .git/             50MB
  その他            10MB
  ─────────────────────
  合計              264.5MB
```

↓ Dockerイメージビルド

```
Dockerイメージサイズ: 約450MB
（Node.js基礎150MB + 上記264.5MB + その他）
```

### .dockerignoreありの場合

```
必要なファイルのみ:
  package.json      0.001MB
  pnpm-lock.yaml    0.1MB
  dist/             1MB
  ─────────────────────
  合計              1.1MB
```

↓ Dockerイメージビルド

```
Dockerイメージサイズ: 約220MB
（Node.js基礎150MB + 依存関係50MB + アプリ1.1MB）
```

**削減効果: 約230MB（51%削減）**

---

## ビルドフロー全体図

```
1. ローカルでTypeScriptをビルド
   src/ → dist/

2. docker build コマンド実行

3. .dockerignoreを読み込み
   「これらは送らない」リストを確認

4. 必要なファイルだけをDockerに送信
   - package.json
   - pnpm-lock.yaml
   - dist/
   （不要なファイルは除外）

5. Dockerfileの各命令を実行
   FROM → COPY → RUN → ENV → CMD

6. Dockerイメージ完成
   約220MBのイメージファイル

7. AWS ECRにプッシュ

8. Lambda関数がイメージを使用
```

---

## よくある質問

### Q1: なぜ2段階（FROM を2回）？

**A:** 必要なものだけを取り出すため

```dockerfile
# ステージ1: 道具だけ準備
FROM awsguru/aws-lambda-adapter AS lambda-adapter
  ↓ ここには色々入ってる（50MB）
  ↓ でも欲しいのは1つのファイルだけ

# ステージ2: メインアプリ
FROM node:22-slim
COPY --from=lambda-adapter /lambda-adapter ...
  ↑ ステージ1から1ファイル（10MB）だけコピー
  ↑ 残りの40MBは捨てられる
```

これを「マルチステージビルド」といい、サイズ削減に有効。

---

### Q2: Dockerfileの各命令の違いは？

| 命令 | タイミング | 例 |
|------|----------|-----|
| `FROM` | ベースイメージ選択 | `FROM node:22-slim` |
| `COPY` | ファイルをコピー | `COPY dist ./dist` |
| `RUN` | ビルド時にコマンド実行 | `RUN pnpm install` |
| `ENV` | 環境変数設定 | `ENV PORT=8080` |
| `CMD` | コンテナ起動時の実行 | `CMD ["node", "dist/index.js"]` |

**`RUN` vs `CMD`の違い:**
```dockerfile
RUN pnpm install   # ビルド時に1回だけ実行
CMD ["node", ...]  # コンテナ起動のたびに実行
```

---

### Q3: なぜローカルでビルドしてからDockerに入れる？

**A:** ビルドツールをDocker内に入れないため

**パターンA（現在の方法）:**
```bash
# ローカル
pnpm run build     # TypeScriptをビルド

# Docker内
node dist/index.js  # ビルド済みを実行
```
イメージサイズ: 220MB

**パターンB（Docker内でビルド）:**
```dockerfile
# Docker内
COPY src ./src
RUN pnpm run build  # TypeScript、@types/xxxも必要
CMD ["node", "dist/index.js"]
```
イメージサイズ: 300MB（+80MB）

TypeScriptコンパイラや型定義ファイルが増える分、大きくなる。

---

### Q4: .dockerignoreの`!`の意味は？

**A:** 除外ルールの例外

```dockerignore
# すべての.jsファイルを除外
*.js

# でもdist内の.jsは含める（例外）
!dist/**/*.js
```

---

## まとめ

### Dockerfile = アプリの組み立て方

1. Lambda Web Adapterを準備
2. Node.js環境を用意
3. 依存関係をインストール
4. アプリコードをコピー
5. 環境変数を設定
6. 起動コマンドを指定

### .dockerignore = 不要なものリスト

- 開発用ファイル（src/, test/）
- 設定ファイル（.env, .vscode/）
- 一時ファイル（node_modules/, *.log）

これらを除外することで：
- ✅ ビルドが速くなる
- ✅ イメージサイズが小さくなる
- ✅ セキュリティが向上する

---

## 次のステップ

理解できたら、実際にDockerを動かしてみましょう：

```bash
# 1. TypeScriptをビルド
pnpm run build

# 2. Dockerイメージをビルド
docker build -t mcp-server-test .

# 3. ローカルで起動
docker run -p 8080:8080 mcp-server-test

# 4. テスト
curl http://localhost:8080/health
```

これで「Dockerfileがどう動くか」が実感できます！
