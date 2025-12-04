# 🔧 Correção Urgente: URL da API Asaas

## ❌ Problema Identificado

Os logs mostram que a URL da API do Asaas está configurada incorretamente:

```
"api_url":"https://api-sandbox.asaas.com"
```

Esta URL está **incorreta** e está causando erro 404.

## ✅ Solução

### Para Ambiente Sandbox:

No arquivo `.env` (ou nas variáveis de ambiente do EasyPanel), altere:

**ANTES (ERRADO):**
```env
ASAAS_API_URL=https://api-sandbox.asaas.com
```

**DEPOIS (CORRETO):**
```env
ASAAS_API_URL=https://api-sandbox.asaas.com/v3
```

### Para Ambiente de Produção:

```env
ASAAS_API_URL=https://api.asaas.com/v3
```

## 📝 URLs Corretas do Asaas (Conforme Documentação Atual)

| Ambiente | URL Correta |
|----------|------------|
| **Sandbox** | `https://api-sandbox.asaas.com/v3` |
| **Produção** | `https://api.asaas.com/v3` |

> ℹ️ **Nota:** A documentação do Asaas foi atualizada. As URLs base mudaram de `sandbox.asaas.com` para `api-sandbox.asaas.com` e de `www.asaas.com` para `api.asaas.com`. O `/v3` ainda é necessário no final.

## 🔄 Como Aplicar a Correção no EasyPanel

1. **Acesse o EasyPanel**
2. **Vá até as configurações do seu app/container**
3. **Encontre a seção de Variáveis de Ambiente**
4. **Localize a variável `ASAAS_API_URL`**
5. **Altere o valor para:** `https://api-sandbox.asaas.com/v3`
6. **Salve as alterações**
7. **Reinicie o container** (se necessário)

## ✅ Verificar se Está Correto

Após fazer a alteração, execute dentro do container:

```bash
cd /app/backend
php artisan config:clear
php artisan config:show services.asaas
```

Deve mostrar:
```
"api_url" => "https://api-sandbox.asaas.com/v3"
```

## 🧪 Testar Novamente

Após corrigir a URL:

1. Tente criar um pagamento Pix novamente
2. Verifique os logs:
   ```bash
   tail -f /app/backend/storage/logs/laravel.log | grep -i asaas
   ```

Agora deve aparecer requisições sendo feitas para a URL correta e não mais erro 404.

---

**Esta é a causa raiz do problema!** Após corrigir a URL, o pagamento Pix deve funcionar corretamente.

