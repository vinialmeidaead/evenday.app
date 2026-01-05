# Multi-stage build para otimizar o tamanho da imagem final

# ============================================
# Stage 1: Dependências
# ============================================
FROM node:22-alpine AS deps

# Instalar dependências mínimas necessárias
# @napi-rs/canvas já vem com binários pré-compilados, então não precisa de muitas deps de build
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Gerar Prisma Client
RUN npx prisma generate

# ============================================
# Stage 2: Builder
# ============================================
FROM node:22-alpine AS builder

# Instalar dependências runtime necessárias para @napi-rs/canvas
RUN apk add --no-cache \
    libc6-compat \
    cairo \
    pango \
    jpeg \
    giflib \
    pixman \
    fontconfig \
    freetype

WORKDIR /app

# Copiar dependências instaladas
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Definir variáveis de ambiente para o build
# IMPORTANTE: Não coloque secrets aqui!
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build da aplicação Next.js
RUN npm run build

# ============================================
# Stage 3: Runner (Imagem Final)
# ============================================
FROM node:22-alpine AS runner

# Instalar dependências runtime necessárias para @napi-rs/canvas
RUN apk add --no-cache \
    cairo \
    pango \
    jpeg \
    giflib \
    pixman \
    fontconfig \
    freetype \
    libc6-compat \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

WORKDIR /app

# Configurações de ambiente
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Configuração crítica para Puppeteer no Docker
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários do builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Criar diretório para uploads/storage
RUN mkdir -p ./storage/certificates && \
    chown -R nextjs:nodejs ./storage

# Copiar arquivos do build do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar módulos nativos externos (serverExternalPackages)
# @napi-rs/canvas não é incluído no standalone build
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@napi-rs ./node_modules/@napi-rs

# Mudar para o usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
