# syntax=docker/dockerfile:1

# ── build 階段：安裝相依套件 ─────────────────────────────
# bcrypt 為原生模組，若官方 prebuilt binary 抓不到會退回 node-gyp 編譯，
# 因此 build 階段先備妥編譯工具（不會進入 runtime image）。
FROM node:20-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── runtime 階段 ────────────────────────────────────────
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# logger 會寫入 ./logs，先建好目錄並交給非 root 的 node 使用者
RUN mkdir -p logs && chown -R node:node /app
USER node

ENV PORT=5000 HOST=0.0.0.0
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
