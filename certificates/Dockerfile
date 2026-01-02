# Multi-stage build para otimizar o tamanho da imagem final

# ============================================
# Stage 1: Dependências
# ============================================
FROM node:20-alpine AS deps

# Instalar dependências necessárias para compilar pacotes nativos (canvas, @napi-rs/canvas)
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

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
FROM node:20-alpine AS builder

# Instalar dependências nativas necessárias para o build
RUN apk add --no-cache \
    libc6-compat \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman

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
FROM node:20-alpine AS runner

# Instalar dependências runtime necessárias para canvas
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    libc6-compat

WORKDIR /app

# Configurações de ambiente
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

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

# Mudar para o usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
