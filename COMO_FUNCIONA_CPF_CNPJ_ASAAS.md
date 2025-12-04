# Como Funciona o CPF/CNPJ no Asaas

## 📋 Requisito do Asaas

O Asaas **exige** que seja fornecido um CPF ou CNPJ ao criar um cliente para pagamentos Pix. Este é um requisito **obrigatório** da API e não aceita valores padrão ou genéricos.

## 🔍 Como o Sistema Coleta CPF/CNPJ

O sistema coleta o CPF/CNPJ **diretamente do cliente** durante o checkout, **apenas quando o método de pagamento selecionado for Asaas Pix**.

### Fluxo de Coleta

1. **Cliente seleciona Pix (Asaas)** como método de pagamento
2. **Sistema exibe formulário** solicitando CPF ou CNPJ
3. **Cliente preenche** o CPF/CNPJ (com ou sem formatação)
4. **Sistema valida** o formato (11 dígitos para CPF ou 14 dígitos para CNPJ)
5. **Sistema cria cliente no Asaas** com o CPF/CNPJ fornecido
6. **Sistema gera código Pix** e exibe para o cliente

### Formatação Automática

O campo de CPF/CNPJ formata automaticamente enquanto o usuário digita:
- **CPF:** `000.000.000-00` (formato automático)
- **CNPJ:** `00.000.000/0000-00` (formato automático)

O sistema aceita entrada com ou sem formatação, mas sempre envia apenas números para a API.

## ⚙️ Como Funciona

### Validação

O sistema valida automaticamente:
- ✅ **CPF:** Deve ter exatamente 11 dígitos
- ✅ **CNPJ:** Deve ter exatamente 14 dígitos
- ✅ **Formato:** Aceita com ou sem formatação (pontos, traços, barras)
- ❌ **Rejeita:** Valores com menos de 11 ou mais de 14 dígitos

### Segurança

- CPF/CNPJ são mascarados nos logs do backend (ex: `123.***.***-00`)
- Dados são enviados apenas para a API do Asaas
- Não são armazenados no banco de dados da aplicação (apenas no Asaas)

## ⚠️ Importante

1. **Obrigatório:** CPF/CNPJ é obrigatório para pagamentos Pix via Asaas
2. **Apenas para Asaas:** Este campo aparece apenas quando o método de pagamento é Pix (Asaas)
3. **Validação:** O sistema valida formato (11 ou 14 dígitos), mas não valida dígitos verificadores
4. **Privacidade:** CPF/CNPJ são mascarados nos logs (ex: `123.***.***-00`)

## 🐛 Troubleshooting

### Problema: "Para criar esta cobrança é necessário preencher o CPF ou CNPJ do cliente"

**Solução:**
1. Certifique-se de que o campo CPF/CNPJ foi preenchido antes de gerar o código Pix
2. Verifique se o CPF/CNPJ tem formato válido (11 dígitos para CPF ou 14 para CNPJ)
3. O campo aceita formatação automática, mas deve ter a quantidade correta de dígitos

### Verificar nos Logs

Os logs mostram quando o CPF/CNPJ é recebido:
```
AsaasPixPaymentCreationService: Creating new customer
customer_data: {cpf_cnpj: "123.***.***-00"}
```

---

**Última atualização:** Dezembro 2025

