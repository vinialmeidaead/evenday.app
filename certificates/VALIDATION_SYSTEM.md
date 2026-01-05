# Sistema de Validação de Certificados

Este documento descreve o sistema de validação de certificados implementado no módulo de certificados do Evenday.

## Visão Geral

O sistema de validação permite que qualquer pessoa verifique a autenticidade de um certificado emitido pela plataforma Evenday através de:
- **QR Code** - Escaneamento rápido com smartphone
- **Código de Validação** - Digitação manual de código único
- **Página Pública** - Interface web para validação

## Componentes do Sistema

### 1. Código de Validação

Cada certificado emitido recebe um código único no formato `XXXX-XXXX-XXXX`:
- 12 caracteres alfanuméricos
- Caracteres ambíguos removidos (I, O, 0, 1)
- Fácil de digitar e comunicar

**Geração:** `generateValidationCode()` em `src/lib/validation-utils.ts`

### 2. QR Code

QR Code gerado automaticamente contendo a URL de validação completa:
- Resolução: 300x300px
- Correção de erro: Alta (H)
- Formato: PNG Data URL

**Geração:** `generateQRCodeDataUrl()` em `src/lib/validation-utils.ts`

### 3. Folha de Verso

Cada certificado possui uma segunda página com:
- QR Code grande e legível
- Código de validação destacado
- Informações do certificado
- Instruções passo a passo
- Design profissional e informativo

**Componente:** `CertificateBackPage` em `src/components/certificate-back-page/`

### 4. API de Validação Pública

Endpoint público (sem autenticação) para validar certificados:

```
GET /api/validate/[code]
```

**Resposta de sucesso:**
```json
{
  "valid": true,
  "certificate": {
    "certificateNumber": "CERT-2024-001234",
    "participantName": "João Silva",
    "eventTitle": "Workshop de React",
    "eventDate": "15/01/2024",
    "issueDate": "16/01/2024",
    "templateName": "Certificado Padrão",
    "hours": "8 horas"
  }
}
```

**Resposta de erro:**
```json
{
  "valid": false,
  "message": "Certificado não encontrado"
}
```

### 5. Páginas de Validação

#### Página Inicial (`/validate`)
- Formulário para inserir código
- Instruções de uso
- Design acolhedor e profissional

#### Página de Resultado (`/validate/[code]`)
- Exibição de status (válido/inválido)
- Informações completas do certificado
- Avisos de segurança
- Design responsivo

## Fluxo de Validação

```
1. Certificado Emitido
   ↓
2. Código e QR Code Gerados
   ↓
3. Folha de Verso Criada
   ↓
4. Usuário Escaneia QR ou Digita Código
   ↓
5. API Valida no Banco de Dados
   ↓
6. Resultado Exibido
```

## Banco de Dados

### Campos Adicionados ao `IssuedCertificate`

```prisma
model IssuedCertificate {
  // ... campos existentes
  validationCode    String   @unique
  validationUrl     String?
  
  @@index([validationCode])
}
```

### Migration

Execute a migration para adicionar os campos:

```bash
npx prisma migrate dev --name add_validation_fields
```

## Uso

### Emitir Certificado com Validação

O sistema gera automaticamente o código e URL ao emitir certificados:

```typescript
// API: POST /api/certificates/issue
{
  "templateId": "template-id",
  "eventId": 123,
  "attendeeId": 456
}

// Resposta inclui:
{
  "certificate": {
    "id": "...",
    "certificateNumber": "CERT-2024-001234",
    "validationCode": "ABCD-EFGH-JKLM",
    "validationUrl": "https://certs.evenday.app/validate/ABCD-EFGH-JKLM",
    // ...
  }
}
```

### Validar Certificado

#### Via QR Code
1. Escaneie o QR code no verso do certificado
2. Será redirecionado para a página de validação
3. Visualize as informações

#### Via Código Manual
1. Acesse `https://certs.evenday.app/validate`
2. Digite o código de validação
3. Clique em "Validar Certificado"
4. Visualize as informações

## Segurança

### Medidas Implementadas

1. **Códigos Únicos**: Cada certificado tem código único e irrepetível
2. **Validação em Tempo Real**: Consulta direta ao banco de dados
3. **Informações Públicas Limitadas**: Apenas dados não sensíveis são expostos
4. **Sem Autenticação Necessária**: Facilita validação por terceiros
5. **Índices de Banco**: Busca rápida e eficiente

### Dados Expostos Publicamente

✅ **Expostos:**
- Nome do participante
- Título do evento
- Data do evento
- Data de emissão
- Número do certificado
- Carga horária (se aplicável)

❌ **NÃO Expostos:**
- Email do participante
- CPF ou documentos
- Informações de pagamento
- Dados internos do sistema

## Personalização

### Alterar URL Base

Configure a variável de ambiente:

```env
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

### Customizar Design da Folha de Verso

Edite o componente:
```
src/components/certificate-back-page/CertificateBackPage.tsx
```

### Modificar Formato do Código

Ajuste a função em:
```
src/lib/validation-utils.ts
```

## Testes

### Testar Validação

1. Emita um certificado de teste
2. Copie o código de validação do banco de dados
3. Acesse `/validate/[codigo]`
4. Verifique se as informações estão corretas

### Testar QR Code

1. Gere um certificado completo com verso
2. Escaneie o QR code com smartphone
3. Verifique se redireciona corretamente
4. Confirme que a validação funciona

## Troubleshooting

### QR Code não gera
- Verifique se `qrcode` está instalado: `npm install qrcode`
- Confirme que a URL de validação está correta
- Verifique logs do servidor

### Validação retorna erro
- Confirme que o código existe no banco
- Verifique se a migration foi executada
- Teste a API diretamente: `GET /api/validate/[code]`

### Página não carrega
- Verifique se as rotas estão corretas
- Confirme que não há erros de build
- Teste em modo de desenvolvimento

## Roadmap Futuro

Possíveis melhorias:

- [ ] Estatísticas de validação (quantas vezes foi validado)
- [ ] Notificação ao emissor quando certificado é validado
- [ ] API para validação em lote
- [ ] Exportar relatório de validações
- [ ] Integração com blockchain para prova imutável
- [ ] App mobile dedicado para validação
- [ ] Suporte a múltiplos idiomas

## Suporte

Para dúvidas ou problemas:
1. Verifique este documento
2. Consulte os logs do servidor
3. Entre em contato com a equipe de desenvolvimento
