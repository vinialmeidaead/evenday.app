# Passos de Configuração Manual - Integração Asaas Pix

Este documento contém todos os passos que **você precisa fazer manualmente** para completar a configuração da integração com Asaas para pagamentos Pix.

---

## 📋 Pré-requisitos

- Conta no Asaas (produção ou sandbox)
- Acesso ao painel administrativo do Asaas
- Credenciais de API do Asaas
- Acesso ao arquivo `.env` do backend
- Acesso às configurações de eventos na plataforma

---

## 🔧 Passo 1: Configurar Credenciais no Asaas

### 1.1 Obter Chave de API

1. Acesse o painel do Asaas: https://www.asaas.com
2. Faça login na sua conta
3. Navegue até **"Minha Conta"** → **"Integração"**
4. Clique em **"Gerar nova chave de API"**
5. **Copie e guarde** a chave gerada (ela só será exibida uma vez)

### 1.2 Configurar Webhook

1. Ainda em **"Minha Conta"** → **"Integração"**, vá para a aba **"Webhooks"**
2. Clique em **"Adicionar Webhook"**
3. Preencha os seguintes campos:
   - **URL do Webhook:** 
     ```
     https://seu-dominio.com/api/public/webhooks/asaas
     ```
     ⚠️ **IMPORTANTE:** 
     - Substitua `seu-dominio.com` pelo domínio real da sua aplicação
     - A URL deve incluir `/api/public/webhooks/asaas` (não apenas `/webhooks/asaas`)
     - Use `https://` (não `http://`)
   
   - **E-mail:** Seu e-mail para receber alertas de falhas
   
   - **Versão da API:** Selecione **"v3"**
   
   - **Token de Autenticação:** (Opcional mas recomendado)
     - Gere um token aleatório seguro (ex: usando `openssl rand -hex 32`)
     - Guarde este token, você precisará adicioná-lo no `.env`
   
   - **Fila de Sincronização Ativada:** Marque como **"Sim"**
   
   - **Tipo de Envio:** Escolha **"Sequencial"**

4. Na seção **"Adicionar Eventos"**, expanda **"Cobranças"** e selecione:
   - ✅ **PAYMENT.CONFIRMED** (obrigatório)
   - ✅ **PAYMENT.RECEIVED** (recomendado)
   - ✅ **PAYMENT.OVERDUE** (opcional)
   - ✅ **PAYMENT.REFUNDED** (opcional)

5. Clique em **"Salvar"**

6. **Anote a URL do webhook** configurada para referência futura

---

## 🔐 Passo 2: Configurar Variáveis de Ambiente

### 2.1 Adicionar Credenciais no `.env`

Abra o arquivo `.env` do backend e adicione as seguintes variáveis:

```env
# Asaas Configuration
ASAAS_API_KEY=sua_chave_api_aqui
ASAAS_API_URL=https://api.asaas.com/v3
ASAAS_WEBHOOK_TOKEN=seu_token_de_autenticacao_aqui
ASAAS_ENVIRONMENT=production
```

**Explicação das variáveis:**

- `ASAAS_API_KEY`: A chave de API obtida no Passo 1.1
- `ASAAS_API_URL`: URL base da API (geralmente não precisa alterar)
- `ASAAS_WEBHOOK_TOKEN`: O token de autenticação configurado no webhook (Passo 1.2)
- `ASAAS_ENVIRONMENT`: 
  - `production` para ambiente de produção
  - `sandbox` para ambiente de testes
- `ASAAS_DEFAULT_CPF`: (Opcional) CPF padrão a ser usado quando não for encontrado nas perguntas do pedido. Padrão: `00000000000`

### 2.2 Para Ambiente de Testes (Sandbox)

Se estiver usando o ambiente sandbox do Asaas:

1. Acesse: https://sandbox.asaas.com
2. Crie uma conta de teste
3. Obtenha a chave de API do sandbox
4. Configure o webhook apontando para sua URL de desenvolvimento/testes
5. No `.env`, use:
   ```env
   ASAAS_API_URL=https://api-sandbox.asaas.com/v3
   ASAAS_ENVIRONMENT=sandbox
   ```

   ⚠️ **ATENÇÃO:** A URL deve incluir o `/v3` no final
   
   ✅ **URLs Corretas (conforme documentação atual do Asaas):**
   - Sandbox: `https://api-sandbox.asaas.com/v3`
   - Produção: `https://api.asaas.com/v3`
   
   ❌ **URLs Incorretas (NÃO USE):**
   - `https://api-sandbox.asaas.com` (faltando `/v3`)
   - `https://sandbox.asaas.com/api/v3` (URL antiga, não funciona mais)

---

## 🗄️ Passo 3: Executar Migration do Banco de Dados

### 3.1 Deploy com Docker (Recomendado)

Se você está usando Docker para deploy (arquivo `Dockerfile.all-in-one`), **as migrations são executadas automaticamente** quando o container inicia!

O script `docker/all-in-one/scripts/startup.sh` já contém o comando:
```bash
php artisan migrate --force
```

**O que isso significa:**
- ✅ Ao fazer deploy/reiniciar o container, as migrations são executadas automaticamente
- ✅ A tabela `asaas_payments` será criada automaticamente
- ✅ Não é necessário executar manualmente

**Após o deploy, verifique se a tabela foi criada:**
```bash
# Acesse o container
docker exec -it all-in-one sh

# Dentro do container, execute:
cd /app/backend
php artisan tinker
>>> Schema::hasTable('asaas_payments')
=> true
```

### 3.2 Deploy Manual (Sem Docker)

Se você não está usando Docker, execute manualmente:

```bash
cd backend
php artisan migrate
```

Ou se preferir executar apenas a migration específica:

```bash
php artisan migrate --path=database/migrations/2025_12_03_110710_create_asaas_payments_table.php
```

**Verificação:** Confirme que a tabela foi criada:

```bash
php artisan tinker
>>> Schema::hasTable('asaas_payments')
=> true
```

---

## 🔄 Passo 4: Registrar Serviços no Service Provider (se necessário)

Verifique se os serviços estão sendo registrados corretamente. O Laravel deve fazer o auto-discovery, mas se necessário, adicione no `AppServiceProvider`:

```php
// Em app/Providers/AppServiceProvider.php

use HiEvents\Repository\Interfaces\AsaasPaymentsRepositoryInterface;
use HiEvents\Repository\Eloquent\AsaasPaymentsRepository;

public function register(): void
{
    $this->app->bind(
        AsaasPaymentsRepositoryInterface::class,
        AsaasPaymentsRepository::class
    );
}
```

---

## ⚙️ Passo 5: Habilitar Pix nos Eventos

### 5.1 Via Interface Administrativa

1. Acesse as configurações do evento
2. Vá para **"Configurações de Pagamento"** ou **"Payment Settings"**
3. Na lista de **"Provedores de Pagamento"**, marque:
   - ✅ **ASAAS_PIX** ou **Pix (Asaas)**

4. Salve as alterações

### 5.2 Via Banco de Dados (Alternativa)

Se preferir habilitar diretamente no banco:

```sql
-- Atualizar configurações do evento para incluir ASAAS_PIX
UPDATE event_settings 
SET payment_providers = payment_providers || '["ASAAS_PIX"]'::jsonb
WHERE id = <event_id>;
```

---

## 🧪 Passo 6: Testar a Integração

### 6.1 Teste de Criação de Pagamento

1. Crie um pedido de teste no checkout
2. Selecione **Pix** como método de pagamento
3. Verifique se o QR Code e código Pix são exibidos corretamente
4. Verifique no banco de dados se o registro foi criado:

```sql
SELECT * FROM asaas_payments ORDER BY created_at DESC LIMIT 1;
```

### 6.2 Teste de Webhook (Sandbox)

1. No painel do Asaas, vá em **"Cobranças"**
2. Crie uma cobrança Pix manualmente
3. Simule o pagamento (no sandbox há opções para simular)
4. Verifique os logs do backend para confirmar que o webhook foi recebido:

```bash
tail -f storage/logs/laravel.log | grep -i asaas
```

5. Verifique se o pedido foi atualizado:

```sql
SELECT id, status, payment_status, payment_provider 
FROM orders 
WHERE id = <order_id>;
```

### 6.3 Verificar Logs

Monitore os logs durante os testes:

```bash
# Logs gerais
tail -f storage/logs/laravel.log

# Filtrar apenas logs do Asaas
tail -f storage/logs/laravel.log | grep -i "asaas"
```

---

## 🔍 Passo 7: Validação e Troubleshooting

### 7.1 Verificar Configuração

Execute este comando para verificar se as configurações estão corretas:

```bash
php artisan tinker
>>> config('services.asaas')
```

Deve retornar um array com as configurações do Asaas.

### 7.2 Testar Conexão com API

Crie um script de teste temporário:

```php
// test-asaas.php (temporário, remover após testes)

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$client = app(\HiEvents\Services\Infrastructure\Asaas\AsaasClientFactory::class)->create();

try {
    // Teste simples: buscar clientes
    $customers = $client->findCustomerByEmail('test@example.com');
    echo "Conexão com API Asaas OK!\n";
} catch (\Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
```

Execute:
```bash
php test-asaas.php
```

### 7.3 Problemas Comuns

#### Webhook não está sendo recebido

1. **Verifique a URL do webhook:**
   - Deve ser acessível publicamente
   - Não pode estar em localhost (use ngrok ou similar para desenvolvimento)

2. **Verifique o token de autenticação:**
   - O token no `.env` deve corresponder ao configurado no Asaas
   - Verifique se há espaços extras ou caracteres especiais

3. **Verifique os logs do Asaas:**
   - No painel do Asaas, vá em **"Webhooks"** → **"Logs"**
   - Verifique se há erros nas tentativas de envio

#### QR Code não aparece

1. Verifique se a API retornou o `qr_code_image`
2. Verifique o console do navegador para erros JavaScript
3. Verifique se o formato da imagem está correto (data URI)

#### Pagamento não confirma automaticamente

1. Verifique se o webhook está configurado corretamente
2. Verifique os logs do backend para erros no processamento
3. Verifique se o evento `PAYMENT.CONFIRMED` está selecionado no webhook
4. Verifique se o `payment_id` no webhook corresponde ao salvo no banco

---

## 📝 Passo 8: Configurações Adicionais (Opcional)

### 8.1 Configurar IPs Permitidos (Segurança Extra)

O Asaas fornece uma lista de IPs de origem. Você pode adicionar validação adicional:

1. Consulte a documentação do Asaas para obter a lista de IPs
2. Adicione validação no `AsaasIncomingWebhookAction` se necessário

### 8.2 Configurar Notificações por E-mail

No painel do Asaas, configure e-mails para:
- Falhas no webhook
- Pagamentos confirmados
- Pagamentos vencidos

### 8.3 Monitoramento

Configure alertas para:
- Falhas na criação de pagamentos
- Webhooks não processados
- Pagamentos pendentes por muito tempo

---

## ✅ Checklist Final

Antes de considerar a integração completa, verifique:

- [ ] Chave de API configurada no `.env`
- [ ] Webhook configurado no painel do Asaas
- [ ] Token de autenticação configurado (se usado)
- [ ] Migration executada com sucesso (automático no Docker, manual caso contrário)
- [ ] Pix habilitado em pelo menos um evento de teste
- [ ] Teste de criação de pagamento funcionando
- [ ] Teste de webhook funcionando (sandbox ou produção)
- [ ] Logs sendo gerados corretamente
- [ ] Pedidos sendo atualizados após pagamento

---

## 📞 Suporte

Em caso de problemas:

1. Consulte a [documentação oficial do Asaas](https://docs.asaas.com/)
2. Verifique os logs do sistema
3. Entre em contato com o suporte do Asaas se necessário
4. Revise o arquivo `ESTUDO_VIABILIDADE_ASAAS_PIX.md` para detalhes técnicos

---

## 🔄 Atualizações Futuras

Quando houver atualizações na API do Asaas:

1. Verifique a [documentação do Asaas](https://docs.asaas.com/)
2. Atualize o `AsaasApiClient` se necessário
3. Teste em ambiente sandbox primeiro
4. Atualize este documento com novas instruções

---

**Última atualização:** {{ data_atual }}  
**Versão:** 1.0

