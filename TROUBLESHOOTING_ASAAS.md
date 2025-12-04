# Troubleshooting - Integração Asaas Pix

## 🔍 Como Diagnosticar Problemas

### 1. Verificar Logs do Laravel

O primeiro passo é verificar os logs para entender o erro real:

```bash
# Acesse o container (se usando Docker)
docker exec -it all-in-one sh

# Dentro do container
tail -f /app/backend/storage/logs/laravel.log | grep -i asaas
```

Ou se estiver em desenvolvimento local:
```bash
tail -f storage/logs/laravel.log | grep -i asaas
```

### 2. Verificar Configuração

Execute no tinker para verificar se as configurações estão corretas:

```bash
php artisan tinker
>>> config('services.asaas')
```

Deve retornar algo como:
```php
[
    "api_key" => "sua_chave_aqui",
    "api_url" => "https://sandbox.asaas.com/api/v3",
    "webhook_token" => "seu_token",
    "environment" => "sandbox"
]
```

### 3. Problemas Comuns

#### ❌ Erro: "Asaas API key not configured"

**Causa:** A chave de API não está configurada no `.env`

**Solução:**
1. Verifique se a variável `ASAAS_API_KEY` está no `.env`
2. Verifique se não há espaços extras ou quebras de linha
3. Execute `php artisan config:clear` para limpar o cache

#### ❌ Erro: "Failed to create Asaas customer" ou "Failed to create Asaas payment"

**Causa:** Problema na comunicação com a API do Asaas

**Verificações:**
1. **Chave de API inválida ou expirada:**
   - Acesse o painel do Asaas
   - Vá em "Integrações" → "Chaves de API"
   - Verifique se a chave está ativa
   - Chaves inativas por 3 meses são desativadas automaticamente
   - Chaves inativas por 6 meses são expiradas

2. **URL incorreta:**
   - Sandbox: `https://sandbox.asaas.com/api/v3`
   - Produção: `https://www.asaas.com/api/v3`
   - Verifique se está usando a URL correta no `.env`

3. **Formato da autenticação:**
   - O Asaas usa `access_token` como header (não `Authorization: Bearer`)
   - Verifique os logs para ver se a requisição está sendo feita corretamente

#### ❌ Nenhuma requisição aparece no Asaas

**Possíveis causas:**

1. **Erro antes de fazer a requisição:**
   - Verifique os logs do Laravel
   - Pode ser erro de validação, configuração ou exceção não tratada

2. **Problema de conectividade:**
   - Verifique se o servidor consegue acessar a internet
   - Teste com curl:
     ```bash
     curl -X GET "https://sandbox.asaas.com/api/v3/customers" \
       -H "access_token: sua_chave_aqui"
     ```

3. **Chave de API inválida:**
   - A requisição pode estar falhando na autenticação
   - Verifique os logs para ver o status HTTP retornado

### 4. Testar Conexão Manualmente

Crie um script de teste temporário:

```php
// test-asaas-connection.php (temporário)
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$client = app(\HiEvents\Services\Infrastructure\Asaas\AsaasClientFactory::class)->create();

try {
    // Teste: buscar clientes
    $customers = $client->findCustomerByEmail('test@example.com');
    echo "✅ Conexão com API Asaas OK!\n";
    echo "URL: " . config('services.asaas.api_url') . "\n";
} catch (\Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
    echo "Status: " . ($e->response?->status() ?? 'N/A') . "\n";
    echo "Response: " . ($e->response?->body() ?? 'N/A') . "\n";
}
```

Execute:
```bash
php test-asaas-connection.php
```

### 5. Verificar Logs Detalhados

Com as melhorias implementadas, os logs agora incluem:

- URL da requisição
- Dados enviados
- Status HTTP da resposta
- Corpo completo da resposta
- Erros específicos do Asaas

Procure por estas mensagens nos logs:
- `AsaasApiClient initialized` - Confirma que o cliente foi criado
- `Creating Asaas customer` - Tentativa de criar cliente
- `Creating Asaas payment` - Tentativa de criar pagamento
- `Failed to create Asaas...` - Erros específicos

### 6. Verificar Variáveis de Ambiente

Certifique-se de que todas as variáveis estão no `.env`:

```env
ASAAS_API_KEY=$aap_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=seu_token_opcional
ASAAS_ENVIRONMENT=sandbox
```

**Importante:**
- Não use aspas nas variáveis do `.env`
- Não deixe espaços antes ou depois do `=`
- A chave do Asaas geralmente começa com `$aap_` (sandbox) ou `$aai_` (produção)

### 7. Testar com cURL Direto

Para isolar o problema, teste diretamente com cURL:

```bash
# Sandbox
curl -X POST "https://sandbox.asaas.com/api/v3/customers" \
  -H "access_token: sua_chave_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@example.com"
  }'
```

Se isso funcionar, o problema está no código. Se não funcionar, o problema está na chave ou configuração.

### 8. Verificar Status da Chave no Asaas

1. Acesse https://sandbox.asaas.com (ou produção)
2. Vá em "Minha Conta" → "Integração" → "Chaves de API"
3. Verifique:
   - ✅ Status: Ativa
   - ✅ Data de criação
   - ✅ Último uso
   - ⚠️ Se estiver inativa, gere uma nova chave

### 9. Problemas Específicos do Sandbox

No sandbox, algumas funcionalidades podem estar limitadas:
- Verifique se a conta sandbox está ativa
- Alguns endpoints podem ter comportamento diferente
- Teste com valores pequenos primeiro

---

## 📋 Checklist de Diagnóstico

Execute este checklist quando houver problemas:

- [ ] Variável `ASAAS_API_KEY` está no `.env`?
- [ ] Chave de API está ativa no painel do Asaas?
- [ ] URL está correta (sandbox vs produção)?
- [ ] Cache de configuração foi limpo? (`php artisan config:clear`)
- [ ] Logs do Laravel foram verificados?
- [ ] Teste com cURL funcionou?
- [ ] Servidor tem acesso à internet?
- [ ] Não há erros de sintaxe nos logs?

---

## 🆘 Próximos Passos

Se após todas essas verificações o problema persistir:

1. **Compartilhe os logs:**
   - Copie as mensagens de erro dos logs do Laravel
   - Inclua especialmente as linhas com `Failed to create Asaas`

2. **Informações úteis:**
   - Status HTTP retornado (se houver)
   - Corpo da resposta do Asaas (se houver)
   - Mensagem de erro completa

3. **Verifique a documentação do Asaas:**
   - https://docs.asaas.com/
   - Seção de autenticação e criação de pagamentos

---

**Última atualização:** {{ data_atual }}

