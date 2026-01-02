# Configuração da API do Evenday - Certificados

## Problema Identificado

O erro 500 ao acessar `/events/16` estava ocorrendo devido a:

1. **URL base incorreta**: A URL base da API estava configurada sem o sufixo `/api`
2. **Falta de variável de ambiente**: Não havia arquivo `.env.local` configurado

## Correções Realizadas

### 1. URL Base da API (api-client.ts)

**Antes:**

```typescript
baseURL: process.env.EVENDAY_API_URL || "http://localhost:8000",
```

**Depois:**

```typescript
baseURL: process.env.EVENDAY_API_URL || "http://localhost:8000/api",
```

### 2. Melhor Tratamento de Erros (route.ts)

Adicionado logging mais detalhado para facilitar o debugging de erros futuros:

- Status HTTP
- Mensagem de erro
- Dados de resposta da API

### 3. Arquivo de Exemplo (.env.example)

Criado arquivo `.env.example` para documentar as variáveis de ambiente necessárias.

## Como Configurar

1. **Criar arquivo `.env.local`** na raiz do projeto `certificates`:

   ```bash
   # Copie o arquivo de exemplo
   cp .env.example .env.local
   ```

2. **Verificar se a API principal está rodando**:

   - A API do evenday.app deve estar rodando em `http://localhost:8000`
   - Verifique se consegue acessar `http://localhost:8000/api/events` com autenticação

3. **Reiniciar o servidor Next.js** para carregar as novas variáveis de ambiente:
   ```bash
   # Parar o servidor atual (Ctrl+C)
   # Iniciar novamente
   npm run dev
   ```

## Testando

Após as correções:

1. Faça login no sistema de certificados
2. Acesse `/events/16` (ou qualquer ID de evento válido)
3. Verifique os logs do console para mais detalhes caso ocorra erro

## Próximos Passos

Se o erro persistir:

1. Verifique se a API principal do evenday está respondendo
2. Confirme que o token de autenticação é válido
3. Verifique se o evento ID 16 realmente existe no banco de dados
4. Confira os logs detalhados no console para identificar a causa exata
