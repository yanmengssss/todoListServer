FROM node:22-alpine AS base
# 1. 环境准备
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app


# 2. 安装依赖
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 3. 运行阶段
FROM base AS runner
WORKDIR /app

# 拷贝依赖
COPY --from=deps /app/node_modules ./node_modules

# 拷贝所有源码
COPY . .

# [关键点] 生成自定义位置的 Prisma Client
# 执行后，容器内会出现 /app/prisma-mysql-client 文件夹
RUN pnpm exec prisma generate --schema=./prisma-mysql/schema.prisma

# 环境变量
ENV NODE_ENV=production
EXPOSE 5000

# 启动
CMD ["pnpm", "start"]