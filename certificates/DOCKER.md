# 🐳 Docker - Módulo de Certificados

## Build da Imagem

```bash
docker build -t evenday-certificates .
```

## Executar Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/evenday" \
  -e DIRECT_URL="postgresql://user:password@host:5432/evenday" \
  -e EVDAY_API_URL="https://api.evenday.com" \
  -e EVDAY_API_KEY="your-api-key" \
  -e STORAGE_PROVIDER="local" \
  -v certificates-storage:/app/storage \
  --name evenday-certificates \
  evenday-certificates
```

## Usando arquivo .env

```bash
docker run -p 3000:3000 \
  --env-file .env \
  -v certificates-storage:/app/storage \
  --name evenday-certificates \
  evenday-certificates
```

## Comandos Úteis

```bash
# Ver logs
docker logs -f evenday-certificates

# Acessar shell do container
docker exec -it evenday-certificates sh

# Parar container
docker stop evenday-certificates

# Remover container
docker rm evenday-certificates

# Executar migrations
docker exec evenday-certificates npx prisma migrate deploy
```

## Variáveis de Ambiente Obrigatórias

- `DATABASE_URL` - URL de conexão com PostgreSQL
- `DIRECT_URL` - URL direta para o PostgreSQL (pode ser igual ao DATABASE_URL)
- `EVDAY_API_URL` - URL da API principal do Evenday
- `EVDAY_API_KEY` - Chave de autenticação da API

## Variáveis de Ambiente Opcionais

- `STORAGE_PROVIDER` - Provedor de storage (`local`, `s3`, `wasabi`). Default: `local`
- `AWS_REGION` - Região AWS (para S3/Wasabi)
- `AWS_ACCESS_KEY_ID` - Access Key para S3/Wasabi
- `AWS_SECRET_ACCESS_KEY` - Secret Key para S3/Wasabi
- `S3_BUCKET_NAME` - Nome do bucket S3/Wasabi
- `S3_ENDPOINT` - Endpoint customizado (para Wasabi)
- `STORAGE_PUBLIC_URL` - URL pública para acessar os arquivos

## Estrutura do Dockerfile

O Dockerfile usa **multi-stage build** otimizado com **Node 22**:

1. **deps** - Instala dependências npm e gera Prisma Client
2. **builder** - Compila a aplicação Next.js em modo standalone
3. **runner** - Imagem final otimizada (~350MB) com apenas runtime necessário

### Dependências Nativas

Inclui bibliotecas necessárias para `@napi-rs/canvas`:

- cairo (renderização 2D)
- pango (renderização de texto)
- jpeg (suporte a imagens JPEG)
- giflib (suporte a GIF)
- pixman (manipulação de pixels)
- fontconfig (configuração de fontes)
- freetype (renderização de fontes)

**Nota**: O projeto usa `@napi-rs/canvas` que vem com binários pré-compilados, tornando o build mais rápido e confiável no Alpine Linux.

## Volumes

- `/app/storage` - Armazena certificados gerados (quando STORAGE_PROVIDER=local)

## Portas

- `3000` - Porta da aplicação Next.js

## Segurança

- Container executa com usuário **não-root** (nodejs:1001)
- Imagem baseada em Alpine Linux (menor superfície de ataque)
- Secrets devem ser passados via variáveis de ambiente (nunca commitar no código)
