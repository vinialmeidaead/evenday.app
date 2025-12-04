# 🔧 Correção: URL do Webhook Asaas

## ❌ Problema Identificado

O erro mostra que a rota `webhooks/asaas` não está sendo encontrada:

```
"The route webhooks/asaas could not be found."
```

## ✅ Solução

A URL do webhook configurada no Asaas está **incorreta**. 

### URL Correta

A URL completa do webhook deve ser:

```
https://plataforma.evenday.app/api/public/webhooks/asaas
```

**⚠️ IMPORTANTE:** Note que a URL inclui:
- `/api` - prefixo da API
- `/public` - grupo de rotas públicas
- `/webhooks/asaas` - rota do webhook

### Como Configurar no Asaas

1. **Acesse o painel do Asaas:**
   - Sandbox: https://sandbox.asaas.com
   - Produção: https://www.asaas.com

2. **Vá em "Minha Conta" → "Integração" → "Webhooks"**

3. **Edite o webhook existente ou crie um novo**

4. **Configure a URL:**
   ```
   https://plataforma.evenday.app/api/public/webhooks/asaas
   ```
   
   ⚠️ **Substitua `plataforma.evenday.app` pelo seu domínio real!**

5. **Salve as alterações**

## 📋 Checklist

- [ ] URL inclui `/api/public/webhooks/asaas`
- [ ] URL usa `https://` (não `http://`)
- [ ] Domínio está correto (seu domínio real)
- [ ] Webhook está ativo no painel do Asaas
- [ ] Eventos selecionados: `PAYMENT.CONFIRMED` e `PAYMENT.RECEIVED`

## 🔍 Verificar se Está Funcionando

Após configurar a URL correta:

1. **Faça um pagamento Pix de teste**
2. **Verifique os logs do Laravel:**
   ```bash
   tail -f /app/backend/storage/logs/laravel.log | grep -i "AsaasIncomingWebhookAction"
   ```

3. **Deve aparecer:**
   ```
   AsaasIncomingWebhookAction: Webhook received
   IncomingWebhookHandler: Processing Asaas webhook
   ```

## 🐛 Se Ainda Não Funcionar

1. **Verifique se o nginx está configurado corretamente**
2. **Verifique se o Laravel está recebendo a requisição:**
   ```bash
   tail -f /app/backend/storage/logs/laravel.log
   ```

3. **Teste a URL manualmente:**
   ```bash
   curl -X POST https://plataforma.evenday.app/api/public/webhooks/asaas \
     -H "Content-Type: application/json" \
     -d '{"event":"PAYMENT_RECEIVED","payment":{"id":"test"}}'
   ```

---

**Última atualização:** Dezembro 2025

