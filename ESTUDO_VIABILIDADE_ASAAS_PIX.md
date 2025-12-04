# Estudo de Viabilidade: Integração Asaas para Pagamentos Pix

## 1. Resumo Executivo

Este documento apresenta uma análise de viabilidade técnica para integração do Asaas como provedor de pagamento exclusivo para Pix na plataforma Evenday. A integração será paralela ao sistema atual de Stripe, operando de forma independente e direcionando todos os recebimentos Pix para uma conta central da Evenday.

**Conclusão Preliminar:** ✅ **VIÁVEL** - A integração é tecnicamente viável, com arquitetura compatível e requisitos atendidos pela API do Asaas.

---

## 2. Contexto Atual do Sistema

### 2.1 Arquitetura de Pagamentos Atual (Stripe)

O sistema atual utiliza Stripe como provedor principal de pagamentos, com a seguinte estrutura:

#### Backend
- **Criação de Pagamento:**
  - `CreatePaymentIntentHandler` - Handler principal para criação de payment intents
  - `StripePaymentIntentCreationService` - Serviço de criação de payment intents
  - Endpoint: `POST /api/orders/{eventId}/{orderShortId}/payment-intent`

- **Webhooks:**
  - `StripeIncomingWebhookAction` - Endpoint público para recebimento de webhooks
  - `IncomingWebhookHandler` - Processamento de eventos do Stripe
  - Eventos tratados: `PAYMENT_INTENT_SUCCEEDED`, `PAYMENT_INTENT_PAYMENT_FAILED`, `CHARGE_SUCCEEDED`, `REFUND_UPDATED`, `ACCOUNT_UPDATED`

- **Modelos de Dados:**
  - `StripePayment` - Armazena informações de pagamentos Stripe
  - Campos principais: `payment_intent_id`, `charge_id`, `payment_method_id`, `amount_received`, `connected_account_id`, `platform`

#### Frontend
- Componente `Payment` gerencia seleção de métodos de pagamento
- Suporte atual: `STRIPE` e `OFFLINE`
- `StripePaymentMethod` renderiza formulário de checkout Stripe

#### Enum de Provedores
```php
enum PaymentProviders: string
{
    case STRIPE = 'STRIPE';
    case OFFLINE = 'OFFLINE';
}
```

### 2.2 Fluxo Atual de Pagamento Stripe

1. Cliente seleciona método de pagamento no checkout
2. Sistema cria `PaymentIntent` via API Stripe
3. Frontend recebe `client_secret` e renderiza formulário Stripe
4. Cliente completa pagamento
5. Stripe envia webhook com status do pagamento
6. Sistema atualiza `Order` e `StripePayment`
7. Status do pedido muda para `COMPLETED` e `PAYMENT_RECEIVED`

---

## 3. Requisitos da Integração Asaas

### 3.1 Fluxo Proposto

1. ✅ Cliente seleciona Pix no checkout
2. ✅ Sistema solicita ao Asaas geração de QR Code/código Pix
3. ✅ Cliente realiza pagamento via Pix
4. ✅ Asaas envia webhook com dados da transação
5. ✅ Sistema processa webhook e atualiza pedido

### 3.2 Características Especiais

- ✅ Recebimento sempre em conta central da Evenday (não subcontas)
- ✅ Integração paralela ao Stripe (sem conflitos)
- ✅ Formato de dados compatível com modelo interno existente

---

## 4. Análise da API do Asaas

### 4.1 Criação de Cobrança Pix

**Endpoint:** `POST https://www.asaas.com/api/v3/payments`

**Autenticação:** Bearer Token (chave API)

**Payload Esperado:**
```json
{
  "customer": "cus_000000000001",
  "billingType": "PIX",
  "value": 100.00,
  "dueDate": "2024-12-31",
  "description": "Pedido #12345",
  "externalReference": "order_short_id_abc123",
  "notificationDisabled": false
}
```

**Resposta Esperada:**
```json
{
  "id": "pay_123456789",
  "customer": "cus_000000000001",
  "value": 100.00,
  "netValue": 100.00,
  "billingType": "PIX",
  "status": "PENDING",
  "dueDate": "2024-12-31",
  "pixTransaction": {
    "encodedImage": "data:image/png;base64,iVBORw0KG...",
    "payload": "00020126580014br.gov.bcb.pix...",
    "expirationDate": "2024-12-31T23:59:59Z"
  },
  "pixCopiaECola": "00020126580014br.gov.bcb.pix..."
}
```

**✅ Compatibilidade:** Totalmente compatível com o fluxo necessário.

### 4.2 Webhooks do Asaas

**Configuração:**
- URL configurável no painel Asaas
- Versão API: v3
- Token de autenticação opcional (recomendado)
- Fila de sincronização: Sequencial

**Eventos Disponíveis:**
- `PAYMENT.CONFIRMED` - Pagamento confirmado
- `PAYMENT.RECEIVED` - Pagamento recebido
- `PAYMENT.OVERDUE` - Pagamento vencido
- `PAYMENT.DELETED` - Pagamento deletado
- `PAYMENT.REFUNDED` - Pagamento estornado

**Estrutura do Payload (exemplo PAYMENT.CONFIRMED):**
```json
{
  "event": "PAYMENT.CONFIRMED",
  "payment": {
    "id": "pay_123456789",
    "customer": "cus_000000000001",
    "value": 100.00,
    "netValue": 100.00,
    "billingType": "PIX",
    "status": "CONFIRMED",
    "dueDate": "2024-12-31",
    "paymentDate": "2024-12-30T15:30:00Z",
    "clientPaymentDate": "2024-12-30T15:30:00Z",
    "externalReference": "order_short_id_abc123",
    "transactionReceiptUrl": "https://..."
  }
}
```

**✅ Compatibilidade:** Estrutura compatível, permite mapeamento direto para modelo interno.

### 4.3 Validação de Webhooks

**Métodos Disponíveis:**
1. **Token de Autenticação:** Header `asaas-access-token` (opcional mas recomendado)
2. **Validação de IP:** Lista de IPs do Asaas (documentação disponível)
3. **Validação de Assinatura:** Não disponível nativamente (diferente do Stripe)

**⚠️ Consideração:** Necessário implementar validação alternativa ao método de assinatura do Stripe.

---

## 5. Pontos de Integração Necessários

### 5.1 Backend - Criação de Pagamento Pix

#### 5.1.1 Novo Handler
**Arquivo:** `backend/app/Services/Application/Handlers/Order/Payment/Asaas/CreatePixPaymentHandler.php`

**Responsabilidades:**
- Validar ordem e sessão
- Criar cobrança Pix no Asaas
- Armazenar dados do pagamento
- Retornar QR Code e código Pix

**Estrutura Similar a:**
```12:136:backend/app/Services/Application/Handlers/Order/Payment/Stripe/CreatePaymentIntentHandler.php
```

#### 5.1.2 Novo Serviço de Criação
**Arquivo:** `backend/app/Services/Domain/Payment/Asaas/AsaasPixPaymentCreationService.php`

**Responsabilidades:**
- Criar cliente no Asaas (se necessário)
- Criar cobrança Pix via API Asaas
- Tratar erros e retornar DTO padronizado

**Estrutura Similar a:**
```18:193:backend/app/Services/Domain/Payment/Stripe/StripePaymentIntentCreationService.php
```

#### 5.1.3 Novo Endpoint
**Arquivo:** `backend/app/Http/Actions/Orders/Payment/Asaas/CreatePixPaymentActionPublic.php`

**Endpoint:** `POST /api/orders/{eventId}/{orderShortId}/pix-payment`

**Resposta:**
```json
{
  "payment_id": "pay_123456789",
  "qr_code": "data:image/png;base64,...",
  "pix_code": "00020126580014br.gov.bcb.pix...",
  "expiration_date": "2024-12-31T23:59:59Z"
}
```

### 5.2 Backend - Processamento de Webhooks

#### 5.2.1 Novo Endpoint de Webhook
**Arquivo:** `backend/app/Http/Actions/Common/Webhooks/AsaasIncomingWebhookAction.php`

**Endpoint:** `POST /api/webhooks/asaas`

**Estrutura Similar a:**
```1:41:backend/app/Http/Actions/Common/Webhooks/StripeIncomingWebhookAction.php
```

#### 5.2.2 Novo Handler de Webhook
**Arquivo:** `backend/app/Services/Application/Handlers/Order/Payment/Asaas/IncomingWebhookHandler.php`

**Eventos a Processar:**
- `PAYMENT.CONFIRMED` → Atualizar pedido para `COMPLETED` e `PAYMENT_RECEIVED`
- `PAYMENT.RECEIVED` → Similar ao CONFIRMED
- `PAYMENT.OVERDUE` → Marcar como vencido (opcional)
- `PAYMENT.REFUNDED` → Processar estorno

**Estrutura Similar a:**
```22:173:backend/app/Services/Application/Handlers/Order/Payment/Stripe/IncomingWebhookHandler.php
```

#### 5.2.3 Novo Handler de Evento
**Arquivo:** `backend/app/Services/Domain/Payment/Asaas/EventHandlers/PaymentConfirmedHandler.php`

**Responsabilidades:**
- Validar pagamento não processado anteriormente
- Atualizar `AsaasPayment` com dados recebidos
- Atualizar `Order` para status `COMPLETED` e `PAYMENT_RECEIVED`
- Atualizar status de `Attendee`
- Atualizar quantidades de produtos
- Disparar eventos de domínio

**Estrutura Similar a:**
```39:255:backend/app/Services/Domain/Payment/Stripe/EventHandlers/PaymentIntentSucceededHandler.php
```

### 5.3 Modelos e Banco de Dados

#### 5.3.1 Nova Tabela: `asaas_payments`
**Migration:** `backend/database/migrations/YYYY_MM_DD_create_asaas_payments_table.php`

**Campos:**
- `id` (bigint, primary key)
- `order_id` (bigint, foreign key → orders)
- `asaas_payment_id` (string) - ID do pagamento no Asaas
- `asaas_customer_id` (string, nullable) - ID do cliente no Asaas
- `amount_received` (decimal) - Valor recebido
- `pix_code` (text, nullable) - Código Pix copia e cola
- `status` (string) - Status do pagamento no Asaas
- `payment_date` (timestamp, nullable) - Data do pagamento
- `external_reference` (string) - Referência externa (order_short_id)
- `created_at`, `updated_at` (timestamps)

#### 5.3.2 Novo Model
**Arquivo:** `backend/app/Models/AsaasPayment.php`

**Relacionamentos:**
- `belongsTo(Order::class)`

**Estrutura Similar a:**
```1:42:backend/app/Models/StripePayment.php
```

#### 5.3.3 Novo Domain Object
**Arquivo:** `backend/app/DomainObjects/AsaasPaymentDomainObject.php`

### 5.4 Enum de Provedores

**Atualização Necessária:**
```php
enum PaymentProviders: string
{
    case STRIPE = 'STRIPE';
    case OFFLINE = 'OFFLINE';
    case ASAAS_PIX = 'ASAAS_PIX'; // NOVO
}
```

### 5.5 Frontend

#### 5.5.1 Novo Componente de Método de Pagamento
**Arquivo:** `frontend/src/components/routes/product-widget/Payment/PaymentMethods/AsaasPix/index.tsx`

**Responsabilidades:**
- Exibir QR Code do Pix
- Exibir código Pix copia e cola
- Permitir copiar código
- Mostrar data de expiração
- Polling para verificar status do pagamento (opcional)

#### 5.5.2 Atualização do Componente Payment
**Arquivo:** `frontend/src/components/routes/product-widget/Payment/index.tsx`

**Mudanças:**
- Adicionar verificação de `ASAAS_PIX` em `payment_providers`
- Adicionar renderização condicional do componente `AsaasPixPaymentMethod`
- Adicionar lógica de seleção de método

**Estrutura Similar a:**
```19:138:frontend/src/components/routes/product-widget/Payment/index.tsx
```

#### 5.5.3 Nova Query
**Arquivo:** `frontend/src/queries/useCreateAsaasPixPayment.ts`

**Responsabilidades:**
- Chamar endpoint de criação de pagamento Pix
- Retornar dados do QR Code e código Pix

### 5.6 Configuração

#### 5.6.1 Arquivo de Configuração
**Arquivo:** `backend/config/services.php`

**Adicionar:**
```php
'asaas' => [
    'api_key' => env('ASAAS_API_KEY'),
    'api_url' => env('ASAAS_API_URL', 'https://www.asaas.com/api/v3'),
    'webhook_token' => env('ASAAS_WEBHOOK_TOKEN'), // Opcional
    'environment' => env('ASAAS_ENVIRONMENT', 'production'), // production ou sandbox
],
```

#### 5.6.2 Variáveis de Ambiente
**Arquivo:** `.env`

```
ASAAS_API_KEY=seu_token_aqui
ASAAS_API_URL=https://www.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=token_opcional_para_seguranca
ASAAS_ENVIRONMENT=production
```

---

## 6. Comparação Técnica: Stripe vs Asaas

| Aspecto | Stripe | Asaas | Compatibilidade |
|--------|--------|-------|-----------------|
| **Autenticação** | Bearer Token | Bearer Token | ✅ Idêntico |
| **Criação de Pagamento** | PaymentIntent | Payment (Cobrança) | ✅ Similar |
| **Webhooks** | Assinatura HMAC | Token/IP Validation | ⚠️ Diferente (mas viável) |
| **Validação de Webhook** | `HTTP_STRIPE_SIGNATURE` | Token no header ou IP | ⚠️ Implementação diferente |
| **Estrutura de Dados** | Objetos aninhados | Objetos aninhados | ✅ Compatível |
| **Metadata** | Campo `metadata` | Campo `externalReference` | ✅ Compatível |
| **Status de Pagamento** | `succeeded`, `failed` | `CONFIRMED`, `PENDING`, etc. | ✅ Mapeável |
| **Ambiente de Testes** | Test Mode | Sandbox | ✅ Disponível |
| **Documentação** | Excelente | Boa | ✅ Suficiente |

---

## 7. Desafios e Considerações

### 7.1 Validação de Webhooks

**Desafio:** Asaas não utiliza assinatura HMAC como Stripe.

**Solução:**
1. Implementar validação via token de autenticação no header
2. Validar IPs de origem (lista fornecida pelo Asaas)
3. Implementar idempotência via cache (similar ao Stripe)

**Impacto:** Baixo - Solução viável e segura.

### 7.2 Gerenciamento de Clientes

**Desafio:** Asaas requer criação de cliente antes da cobrança.

**Solução:**
- Criar cliente no Asaas durante criação do pagamento (similar ao Stripe)
- Armazenar `asaas_customer_id` para reutilização
- Implementar serviço de upsert de cliente

**Impacto:** Baixo - Padrão similar ao Stripe.

### 7.3 Expiração de QR Code Pix

**Desafio:** QR Codes Pix têm data de expiração (geralmente 24h).

**Solução:**
- Armazenar `expiration_date` retornado pelo Asaas
- Validar expiração antes de exibir QR Code
- Permitir regeneração de QR Code se expirado

**Impacto:** Médio - Requer lógica adicional no frontend.

### 7.4 Polling de Status (Opcional)

**Desafio:** Webhooks podem ter delay; experiência do usuário pode melhorar com polling.

**Solução:**
- Implementar polling opcional no frontend para verificar status
- Endpoint: `GET /api/orders/{eventId}/{orderShortId}/pix-payment-status`
- Polling a cada 5-10 segundos até confirmação ou timeout

**Impacto:** Baixo - Melhora UX, não é crítico.

### 7.5 Tratamento de Erros

**Desafio:** Erros da API Asaas podem diferir do Stripe.

**Solução:**
- Criar exceções específicas para Asaas
- Mapear erros comuns para mensagens amigáveis
- Implementar retry logic para erros temporários

**Impacto:** Baixo - Padrão de desenvolvimento.

### 7.6 Conta Central vs Subcontas

**Vantagem:** Não há necessidade de gerenciar múltiplas contas como no Stripe Connect.

**Impacto:** Positivo - Simplifica a implementação.

---

## 8. Estrutura de Arquivos Propostos

```
backend/
├── app/
│   ├── DomainObjects/
│   │   ├── AsaasPaymentDomainObject.php
│   │   ├── Enums/
│   │   │   └── PaymentProviders.php (atualizar)
│   ├── Models/
│   │   └── AsaasPayment.php
│   ├── Services/
│   │   ├── Application/Handlers/Order/Payment/Asaas/
│   │   │   ├── CreatePixPaymentHandler.php
│   │   │   ├── IncomingWebhookHandler.php
│   │   │   └── DTO/
│   │   │       ├── CreatePixPaymentRequestDTO.php
│   │   │       ├── CreatePixPaymentResponseDTO.php
│   │   │       └── AsaasWebhookDTO.php
│   │   ├── Domain/Payment/Asaas/
│   │   │   ├── AsaasPixPaymentCreationService.php
│   │   │   ├── EventHandlers/
│   │   │   │   ├── PaymentConfirmedHandler.php
│   │   │   │   └── PaymentReceivedHandler.php
│   │   │   └── AsaasClientFactory.php
│   │   └── Infrastructure/Asaas/
│   │       └── AsaasApiClient.php
│   ├── Http/Actions/
│   │   ├── Orders/Payment/Asaas/
│   │   │   ├── CreatePixPaymentActionPublic.php
│   │   │   └── GetPixPaymentStatusActionPublic.php
│   │   └── Common/Webhooks/
│   │       └── AsaasIncomingWebhookAction.php
│   ├── Repository/
│   │   ├── Interfaces/
│   │   │   └── AsaasPaymentsRepositoryInterface.php
│   │   └── Eloquent/
│   │       └── AsaasPaymentsRepository.php
│   └── Exceptions/Asaas/
│       ├── CreatePixPaymentFailedException.php
│       └── AsaasWebhookValidationException.php
├── config/
│   └── services.php (atualizar)
└── database/migrations/
    └── YYYY_MM_DD_create_asaas_payments_table.php

frontend/
└── src/
    ├── components/routes/product-widget/Payment/
    │   ├── PaymentMethods/
    │   │   └── AsaasPix/
    │   │       └── index.tsx
    │   └── index.tsx (atualizar)
    └── queries/
        ├── useCreateAsaasPixPayment.ts
        └── useGetAsaasPixPaymentStatus.ts
```

---

## 9. Viabilidade Técnica

### 9.1 Compatibilidade Arquitetural

✅ **ALTA** - A arquitetura atual é facilmente extensível:
- Padrão de handlers e services já estabelecido
- Estrutura de webhooks já implementada
- Modelos de dados seguem padrão consistente
- Frontend já suporta múltiplos métodos de pagamento

### 9.2 Complexidade de Implementação

**Nível:** MÉDIO

**Justificativa:**
- Maioria do código pode ser baseado em implementação Stripe existente
- API do Asaas é bem documentada e similar ao Stripe
- Principais desafios são gerenciáveis (validação de webhook, expiração QR Code)

### 9.3 Tempo Estimado de Desenvolvimento

**Fase 1 - Backend Core:** 3-5 dias
- Modelos e migrations
- Serviço de criação de pagamento
- Cliente HTTP para API Asaas

**Fase 2 - Webhooks:** 2-3 dias
- Endpoint de webhook
- Handlers de eventos
- Validação de webhooks

**Fase 3 - Frontend:** 2-3 dias
- Componente de pagamento Pix
- Integração com checkout
- Polling de status (opcional)

**Fase 4 - Testes e Ajustes:** 2-3 dias
- Testes de integração
- Testes de webhooks
- Ajustes de UX

**Total Estimado:** 9-14 dias úteis

### 9.4 Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Mudanças na API Asaas | Baixa | Médio | Versionamento de API, testes contínuos |
| Delay em webhooks | Média | Baixo | Implementar polling como fallback |
| Limites de taxa da API | Baixa | Médio | Implementar rate limiting e retry |
| Problemas de validação de webhook | Média | Alto | Testes extensivos, logging detalhado |

---

## 10. Recomendações

### 10.1 Implementação Recomendada

1. **Fase 1 - MVP:**
   - Implementar criação de pagamento Pix
   - Implementar webhook básico para `PAYMENT.CONFIRMED`
   - Frontend simples com QR Code e código copia e cola

2. **Fase 2 - Melhorias:**
   - Adicionar polling de status no frontend
   - Implementar tratamento de expiração de QR Code
   - Adicionar suporte a estornos

3. **Fase 3 - Otimizações:**
   - Cache de clientes Asaas
   - Retry logic para falhas de API
   - Monitoramento e alertas

### 10.2 Boas Práticas

1. **Segurança:**
   - Sempre validar webhooks via token ou IP
   - Implementar idempotência para evitar processamento duplicado
   - Logging detalhado de todas as operações

2. **Confiabilidade:**
   - Implementar retry logic com exponential backoff
   - Tratar timeouts adequadamente
   - Implementar circuit breaker para API Asaas

3. **Experiência do Usuário:**
   - Mostrar QR Code de forma clara e responsiva
   - Permitir fácil cópia do código Pix
   - Mostrar contador de expiração
   - Feedback visual quando pagamento for confirmado

### 10.3 Testes Necessários

1. **Testes Unitários:**
   - Serviços de criação de pagamento
   - Handlers de webhook
   - Validação de dados

2. **Testes de Integração:**
   - Fluxo completo de criação e confirmação
   - Webhooks em ambiente sandbox
   - Tratamento de erros da API

3. **Testes End-to-End:**
   - Fluxo completo do checkout até confirmação
   - Expiração de QR Code
   - Múltiplos pagamentos simultâneos

---

## 11. Conclusão

### 11.1 Viabilidade Geral

✅ **VIÁVEL** - A integração é tecnicamente viável e compatível com a arquitetura atual.

### 11.2 Pontos Fortes

- ✅ API do Asaas bem documentada e similar ao Stripe
- ✅ Arquitetura atual facilita extensão para novo provedor
- ✅ Não há necessidade de gerenciar múltiplas contas (simplifica)
- ✅ Ambiente sandbox disponível para testes

### 11.3 Pontos de Atenção

- ⚠️ Validação de webhooks diferente do Stripe (mas viável)
- ⚠️ Necessidade de gerenciar expiração de QR Codes
- ⚠️ Implementação de polling opcional para melhor UX

### 11.4 Próximos Passos

1. ✅ Aprovação do estudo de viabilidade
2. ⏭️ Configuração de conta Asaas e obtenção de credenciais
3. ⏭️ Configuração de ambiente sandbox
4. ⏭️ Início da implementação (Fase 1)
5. ⏭️ Testes em sandbox
6. ⏭️ Deploy em produção

---

## 12. Referências

- [Documentação API Asaas](https://docs.asaas.com/)
- [Documentação Webhooks Asaas](https://central.ajuda.asaas.com/hc/pt-br/articles/32107573545499-Webhooks)
- [Ambiente Sandbox Asaas](https://www.asaas.com/desenvolvedores)

---

**Documento criado em:** {{ data_atual }}  
**Versão:** 1.0  
**Autor:** Estudo de Viabilidade Técnica

