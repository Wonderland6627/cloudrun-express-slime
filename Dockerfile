# === 第一阶段：安装生产依赖 ===
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# === 第二阶段：精简生产镜像 ===
FROM node:20-alpine

RUN apk add --no-cache tzdata ca-certificates \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo Asia/Shanghai > /etc/timezone

WORKDIR /app

# 从第一阶段复制已安装的 node_modules（不含 npm 缓存）
COPY --from=deps /app/node_modules ./node_modules

# 复制应用代码（受 .dockerignore 控制，排除 docs/logs/views 等）
COPY . .

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

# 直接用 node 启动，跳过 npm 的进程管理开销
CMD ["node", "./bin/www"]
