# 🐳 Docker - Quick Start

## Execução Rápida

```bash
# 1. Configure as variáveis de ambiente
cp .env.docker.example .env

# 2. Edite o .env com suas credenciais

# 3. Construa e execute
docker-compose up --build
```

A aplicação estará disponível em `http://localhost:3000`

## Comandos Úteis

```bash
# Executar em background
docker-compose up -d

# Ver logs
docker-compose logs -f certificates

# Parar
docker-compose down

# Rebuild completo (sem cache)
docker-compose build --no-cache

# Executar migrations
docker-compose exec certificates npx prisma migrate deploy

# Acessar shell do container
docker-compose exec certificates sh
```

## Estrutura

- **Dockerfile**: Build otimizado multi-stage com suporte a dependências nativas (canvas)
- **docker-compose.yml**: Orquestração do container com volumes e healthcheck
- **DOCKER_GUIDE.md**: Documentação completa sobre Docker

## Produção

Para deploy em produção, consulte o arquivo `DOCKER_GUIDE.md` para instruções detalhadas sobre:

- Registry de imagens
- Secrets e variáveis de ambiente
- Orquestração (Kubernetes/Swarm)
- Backup e monitoramento
