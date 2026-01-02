# ============================================

# GUIA DE USO DO DOCKER

# ============================================

Este guia explica como construir e executar o módulo de certificados usando Docker.

## Pré-requisitos

- Docker instalado (versão 20.10 ou superior)
- Docker Compose instalado (versão 1.29 ou superior)

## Configuração

1. **Configure as variáveis de ambiente:**
   - Copie o arquivo `.env.example` para `.env`
   - Preencha as variáveis de ambiente necessárias

## Construção e Execução

### Usando Docker Compose (Recomendado)

```bash
# Construir e iniciar o container
docker-compose up --build

# Executar em modo background
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar o container
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

### Usando Docker CLI

```bash
# Construir a imagem
docker build -t evenday-certificates .

# Executar o container
docker run -p 3000:3000 \
  --env-file .env \
  -v certificates-storage:/app/storage \
  --name evenday-certificates \
  evenday-certificates

# Ver logs
docker logs -f evenday-certificates

# Parar o container
docker stop evenday-certificates

# Remover o container
docker rm evenday-certificates
```

## Estrutura do Dockerfile

O Dockerfile usa **multi-stage build** para otimizar o tamanho da imagem:

1. **Stage 1 (deps)**: Instala dependências nativas e do Node.js
2. **Stage 2 (builder)**: Compila a aplicação Next.js
3. **Stage 3 (runner)**: Imagem final otimizada apenas com o necessário para execução

### Dependências Nativas

O container inclui as seguintes bibliotecas nativas necessárias para o `canvas` e `@napi-rs/canvas`:

- cairo
- jpeg
- pango
- giflib
- pixman

## Volumes

- **certificates-storage**: Armazena os certificados gerados localmente (quando `STORAGE_PROVIDER=local`)

## Portas

- **3000**: Porta da aplicação Next.js

## Variáveis de Ambiente Importantes

- `DATABASE_URL`: URL de conexão com o PostgreSQL
- `EVDAY_API_URL`: URL da API principal do Evenday
- `EVDAY_API_KEY`: Chave de API para autenticação
- `STORAGE_PROVIDER`: Provedor de armazenamento (`local`, `s3`, ou `wasabi`)

## Healthcheck

O container inclui um healthcheck que verifica se a aplicação está respondendo corretamente na rota `/api/health`.

## Troubleshooting

### Erro ao compilar dependências nativas

Se houver erro na compilação do `canvas`:

- Verifique se as dependências nativas estão instaladas corretamente no Dockerfile
- Tente limpar o cache do Docker: `docker builder prune`

### Container não inicia

- Verifique os logs: `docker-compose logs certificates`
- Certifique-se de que todas as variáveis de ambiente obrigatórias estão definidas
- Verifique se o banco de dados está acessível

### Problemas com Prisma

Se houver erro relacionado ao Prisma Client:

```bash
# Reconstruir a imagem sem cache
docker-compose build --no-cache

# Ou com Docker CLI
docker build --no-cache -t evenday-certificates .
```

## Migração do Banco de Dados

Para executar migrations no container:

```bash
# Com Docker Compose
docker-compose exec certificates npx prisma migrate deploy

# Com Docker CLI
docker exec evenday-certificates npx prisma migrate deploy
```

## Produção

Para produção, considere:

1. **Usar um registry de imagens**:

   ```bash
   docker tag evenday-certificates:latest registry.example.com/evenday-certificates:latest
   docker push registry.example.com/evenday-certificates:latest
   ```

2. **Configurar secrets adequadamente** (não use arquivos .env em produção)

3. **Usar orquestradores** como Kubernetes ou Docker Swarm para alta disponibilidade

4. **Configurar backup dos volumes** de armazenamento

5. **Monitorar logs e métricas** com ferramentas como Prometheus/Grafana
