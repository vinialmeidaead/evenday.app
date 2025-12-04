# Como Verificar os Logs do Asaas no Container

## 📋 Comandos para Executar Dentro do Container

### 1. Ver os Últimos Logs do Laravel (últimas 100 linhas)

```bash
tail -100 /app/backend/storage/logs/laravel.log
```

### 2. Ver Apenas Logs Relacionados ao Asaas

```bash
grep -i asaas /app/backend/storage/logs/laravel.log | tail -50
```

### 3. Ver Logs em Tempo Real (Ao Tentar Criar Pagamento)

```bash
tail -f /app/backend/storage/logs/laravel.log | grep -i asaas
```

### 4. Ver Todos os Erros Recentes

```bash
grep -i "error\|exception" /app/backend/storage/logs/laravel.log | tail -50
```

### 5. Ver Logs do CreatePixPayment Específicamente

```bash
grep -i "CreatePixPayment\|AsaasPixPayment" /app/backend/storage/logs/laravel.log | tail -50
```

### 6. Ver Logs Mais Recentes (últimas 200 linhas)

```bash
tail -200 /app/backend/storage/logs/laravel.log
```

### 7. Verificar se o Arquivo de Log Existe

```bash
ls -lah /app/backend/storage/logs/
```

### 8. Ver Tamanho do Arquivo de Log

```bash
du -h /app/backend/storage/logs/laravel.log
```

## 🔍 O Que Procurar nos Logs

Após tentar criar um pagamento Pix, procure por estas mensagens nos logs:

### Mensagens de Sucesso (se tudo estiver funcionando):
- `CreatePixPaymentActionPublic: Constructor called`
- `CreatePixPaymentActionPublic: Request received`
- `AsaasClientFactory: Creating Asaas API client`
- `AsaasApiClient initialized`
- `Creating Asaas customer`
- `Creating Asaas payment`

### Mensagens de Erro (o que estamos procurando):
- `ExceptionHandler: Exception caught` - Qualquer exceção
- `Failed to create Asaas client` - Problema na configuração
- `Failed to create Asaas payment` - Erro na API
- `Unresolvable dependency` - Problema de injeção de dependência
- `Asaas API key not configured` - Chave não configurada

## 📝 Passo a Passo para Debug

1. **Primeiro, verifique se o arquivo de log existe:**
   ```bash
   ls -lah /app/backend/storage/logs/laravel.log
   ```

2. **Veja os últimos logs antes de tentar criar o pagamento:**
   ```bash
   tail -50 /app/backend/storage/logs/laravel.log
   ```

3. **Tente criar um pagamento Pix pela interface**

4. **Imediatamente após o erro, execute:**
   ```bash
   tail -200 /app/backend/storage/logs/laravel.log | grep -A 10 -B 10 -i "asaas\|CreatePixPayment\|Exception"
   ```

5. **Se não encontrar nada, veja todos os logs recentes:**
   ```bash
   tail -200 /app/backend/storage/logs/laravel.log
   ```

## 🐛 Se Não Houver Logs

Se não aparecer nenhum log relacionado ao Asaas, pode significar que:

1. **A requisição não está chegando ao Laravel** - Verifique os logs do nginx/apache
2. **O log está em outro arquivo** - Verifique se há outros arquivos de log:
   ```bash
   ls -lah /app/backend/storage/logs/
   ```
3. **O nível de log está muito alto** - Verifique a configuração em `/app/backend/config/logging.php`

## 📤 Como Compartilhar os Logs

Para compartilhar os logs comigo, você pode:

1. **Copiar as últimas linhas relevantes:**
   ```bash
   tail -200 /app/backend/storage/logs/laravel.log > /tmp/laravel_logs.txt
   cat /tmp/laravel_logs.txt
   ```

2. **Ou filtrar apenas o que é relevante:**
   ```bash
   grep -i "asaas\|CreatePixPayment\|Exception\|error" /app/backend/storage/logs/laravel.log | tail -100
   ```

## ⚙️ Verificar Configuração

Também pode verificar se as configurações estão corretas:

```bash
# Verificar se as variáveis de ambiente estão configuradas
php artisan tinker --execute="echo config('services.asaas.api_key') ? 'API Key configurada' : 'API Key NÃO configurada';"
php artisan tinker --execute="echo config('services.asaas.api_url');"
```

Ou mais simples:

```bash
php artisan config:show services.asaas
```

## 🔧 Limpar Cache de Configuração (se necessário)

Se você alterou as variáveis de ambiente, limpe o cache:

```bash
php artisan config:clear
php artisan cache:clear
```

---

**Execute estes comandos dentro do container e compartilhe o resultado!**

