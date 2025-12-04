# Diagramas de Fluxo - Integração Asaas Pix

## 1. Fluxo de Criação de Pagamento Pix

```
┌─────────────┐
│   Cliente   │
│  (Frontend) │
└──────┬──────┘
       │
       │ 1. Seleciona Pix no checkout
       │
       ▼
┌─────────────────────────────────────┐
│  Componente Payment (Frontend)      │
│  - Detecta método ASAAS_PIX         │
│  - Chama useCreateAsaasPixPayment   │
└──────┬──────────────────────────────┘
       │
       │ 2. POST /api/orders/{eventId}/{orderShortId}/pix-payment
       │
       ▼
┌─────────────────────────────────────┐
│  CreatePixPaymentActionPublic        │
│  (Backend - HTTP Action)             │
└──────┬──────────────────────────────┘
       │
       │ 3. Valida ordem e sessão
       │
       ▼
┌─────────────────────────────────────┐
│  CreatePixPaymentHandler             │
│  (Backend - Application Handler)    │
└──────┬──────────────────────────────┘
       │
       │ 4. Prepara dados do pagamento
       │
       ▼
┌─────────────────────────────────────┐
│  AsaasPixPaymentCreationService     │
│  (Backend - Domain Service)          │
│  - Cria/atualiza cliente no Asaas   │
│  - Cria cobrança Pix                 │
└──────┬──────────────────────────────┘
       │
       │ 5. POST https://www.asaas.com/api/v3/payments
       │    Headers: Authorization: Bearer {api_key}
       │    Body: { billingType: "PIX", value, dueDate, ... }
       │
       ▼
┌─────────────────────────────────────┐
│         API Asaas                    │
│  - Valida dados                      │
│  - Gera QR Code Pix                   │
│  - Retorna payment_id, QR Code, etc. │
└──────┬──────────────────────────────┘
       │
       │ 6. Resposta com QR Code e código Pix
       │
       ▼
┌─────────────────────────────────────┐
│  AsaasPaymentsRepository             │
│  - Salva dados em asaas_payments     │
└──────┬──────────────────────────────┘
       │
       │ 7. Retorna dados ao frontend
       │
       ▼
┌─────────────────────────────────────┐
│  Componente AsaasPixPaymentMethod   │
│  (Frontend)                          │
│  - Exibe QR Code                     │
│  - Exibe código Pix copia e cola     │
│  - Mostra data de expiração          │
└─────────────────────────────────────┘
```

## 2. Fluxo de Webhook (Confirmação de Pagamento)

```
┌─────────────────────────────────────┐
│         Cliente Paga via Pix        │
│    (App bancário ou QR Code)        │
└──────┬──────────────────────────────┘
       │
       │ 1. Cliente realiza pagamento
       │
       ▼
┌─────────────────────────────────────┐
│         API Asaas                    │
│  - Recebe pagamento                  │
│  - Confirma transação                │
│  - Prepara webhook                   │
└──────┬──────────────────────────────┘
       │
       │ 2. POST /api/webhooks/asaas
       │    Event: PAYMENT.CONFIRMED
       │    Body: { payment: { id, status, value, ... } }
       │
       ▼
┌─────────────────────────────────────┐
│  AsaasIncomingWebhookAction          │
│  (Backend - HTTP Action)             │
│  - Recebe payload                    │
│  - Extrai headers                    │
└──────┬──────────────────────────────┘
       │
       │ 3. Valida webhook (token/IP)
       │
       ▼
┌─────────────────────────────────────┐
│  IncomingWebhookHandler              │
│  (Backend - Application Handler)     │
│  - Verifica se evento já foi         │
│    processado (idempotência)         │
│  - Roteia para handler específico    │
└──────┬──────────────────────────────┘
       │
       │ 4. Evento: PAYMENT.CONFIRMED
       │
       ▼
┌─────────────────────────────────────┐
│  PaymentConfirmedHandler             │
│  (Backend - Event Handler)           │
│  - Busca AsaasPayment por            │
│    asaas_payment_id                  │
│  - Valida status do pedido           │
│  - Atualiza dados do pagamento       │
└──────┬──────────────────────────────┘
       │
       │ 5. Transação de banco de dados
       │
       ▼
┌─────────────────────────────────────┐
│  Atualizações no Banco:              │
│  - asaas_payments: status,           │
│    amount_received, payment_date     │
│  - orders: status = COMPLETED,       │
│    payment_status = PAYMENT_RECEIVED │
│  - attendees: status = ACTIVE        │
│  - order_items: atualiza quantidades │
└──────┬──────────────────────────────┘
       │
       │ 6. Dispara eventos de domínio
       │
       ▼
┌─────────────────────────────────────┐
│  Eventos Disparados:                │
│  - OrderStatusChangedEvent           │
│  - OrderEvent (ORDER_CREATED)        │
└─────────────────────────────────────┘
```

## 3. Arquitetura de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Payment Component                                   │   │
│  │  - Gerencia seleção de método                       │   │
│  │  - Renderiza componente apropriado                  │   │
│  └───────────────┬─────────────────────────────────────┘   │
│                  │                                          │
│      ┌───────────┴───────────┐                            │
│      │                       │                              │
│  ┌───▼──────┐        ┌───────▼──────┐                    │
│  │ Stripe   │        │  Asaas Pix   │                    │
│  │ Payment  │        │  Payment     │                    │
│  │ Method   │        │  Method      │                    │
│  └──────────┘        └──────────────┘                    │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP Requests
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                        BACKEND                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  HTTP Actions (Controllers)                          │   │
│  │  - CreatePixPaymentActionPublic                     │   │
│  │  - AsaasIncomingWebhookAction                        │   │
│  └───────────────┬─────────────────────────────────────┘   │
│                  │                                          │
│  ┌───────────────▼─────────────────────────────────────┐   │
│  │  Application Handlers                               │   │
│  │  - CreatePixPaymentHandler                         │   │
│  │  - IncomingWebhookHandler                           │   │
│  └───────────────┬─────────────────────────────────────┘   │
│                  │                                          │
│  ┌───────────────▼─────────────────────────────────────┐   │
│  │  Domain Services                                    │   │
│  │  - AsaasPixPaymentCreationService                   │   │
│  │  - PaymentConfirmedHandler                          │   │
│  └───────────────┬─────────────────────────────────────┘   │
│                  │                                          │
│  ┌───────────────▼─────────────────────────────────────┐   │
│  │  Infrastructure                                    │   │
│  │  - AsaasApiClient (HTTP Client)                    │   │
│  │  - AsaasClientFactory                              │   │
│  └───────────────┬─────────────────────────────────────┘   │
│                  │                                          │
│  ┌───────────────▼─────────────────────────────────────┐   │
│  │  Repositories                                      │   │
│  │  - AsaasPaymentsRepository                         │   │
│  │  - OrderRepository                                 │   │
│  └───────────────┬─────────────────────────────────────┘   │
│                  │                                          │
│  ┌───────────────▼─────────────────────────────────────┐   │
│  │  Database                                          │   │
│  │  - asaas_payments                                  │   │
│  │  - orders                                          │   │
│  │  - attendees                                       │   │
│  └────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP API Calls
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Asaas API                                           │   │
│  │  - POST /api/v3/payments (criar cobrança)            │   │
│  │  - GET /api/v3/payments/{id} (consultar status)     │   │
│  │  - Webhooks → POST /api/webhooks/asaas              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 4. Comparação de Fluxos: Stripe vs Asaas

### Stripe (Atual)
```
Cliente → Seleciona Cartão → Cria PaymentIntent → 
Stripe Elements → Cliente paga → Webhook → 
Atualiza Order → COMPLETED
```

### Asaas Pix (Proposto)
```
Cliente → Seleciona Pix → Cria Cobrança Pix → 
QR Code/Código → Cliente paga → Webhook → 
Atualiza Order → COMPLETED
```

**Principais Diferenças:**
- ✅ Stripe: Pagamento síncrono (cliente paga no site)
- ✅ Asaas: Pagamento assíncrono (cliente paga fora do site)
- ✅ Stripe: Não há expiração imediata
- ⚠️ Asaas: QR Code expira (geralmente 24h)
- ✅ Ambos: Usam webhooks para confirmação

## 5. Estados do Pagamento

### Estados no Asaas
```
PENDING → CONFIRMED → RECEIVED
   │          │
   │          └─→ REFUNDED
   │
   └─→ OVERDUE (vencido)
```

### Mapeamento para Order Status
```
Asaas Status    →  Order Status
─────────────────────────────────
PENDING         →  AWAITING_PAYMENT
CONFIRMED       →  PAYMENT_RECEIVED + COMPLETED
RECEIVED        →  PAYMENT_RECEIVED + COMPLETED
OVERDUE         →  AWAITING_PAYMENT (ou novo status)
REFUNDED        →  REFUNDED
```

## 6. Segurança e Validação

### Validação de Webhook Asaas

```
Webhook Recebido
       │
       ▼
┌──────────────────────┐
│ Verifica Token       │
│ (Header: asaas-      │
│  access-token)       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Verifica IP          │
│ (Lista de IPs        │
│  permitidos)         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Verifica Idempotência│
│ (Cache: evento já    │
│  processado?)        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Processa Evento      │
└──────────────────────┘
```

## 7. Tratamento de Erros

### Cenários de Erro

```
Erro na Criação de Pagamento
       │
       ├─→ API Asaas indisponível → Retry com backoff
       ├─→ Dados inválidos → Retorna erro ao frontend
       └─→ Cliente não encontrado → Cria novo cliente

Erro no Webhook
       │
       ├─→ Webhook inválido → Log e retorna 400
       ├─→ Evento duplicado → Ignora (idempotência)
       ├─→ Order não encontrado → Log erro crítico
       └─→ Falha na atualização → Retry ou alerta
```

---

**Documento complementar ao:** `ESTUDO_VIABILIDADE_ASAAS_PIX.md`

