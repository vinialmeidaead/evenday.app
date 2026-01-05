// Type definitions for certificate module

export interface CertificateTemplate {
  id: string;
  userId: number;
  accountId?: number;
  name: string;
  description?: string;
  width: number;
  height: number;
  design: any; // Fabric.js canvas JSON
  variables: Record<string, string>;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IssuedCertificate {
  id: string;
  templateId: string;
  eventId: number;
  attendeeId: number;
  certificateNumber: string;
  validationCode: string;
  validationUrl?: string;
  pdfUrl?: string;
  variables: Record<string, string>;
  generatedAt: Date;
}

export interface CertificateConfig {
  id: string;
  eventId: number;
  templateId: string;
  requireCheckIn: boolean;
  autoGenerate: boolean;
  customVariables: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateVariable {
  key: string;
  label: string;
  description?: string;
  defaultValue?: string;
}

export const DEFAULT_VARIABLES: CertificateVariable[] = [
  {
    key: "participant_name",
    label: "Nome Completo",
    description: "Nome completo do participante",
  },
  {
    key: "participant_first_name",
    label: "Primeiro Nome",
    description: "Primeiro nome do participante",
  },
  {
    key: "participant_last_name",
    label: "Sobrenome",
    description: "Sobrenome do participante",
  },
  {
    key: "participant_email",
    label: "Email",
    description: "Email do participante",
  },
  {
    key: "event_title",
    label: "Título do Evento",
    description: "Título do evento",
  },
  {
    key: "event_date",
    label: "Data do Evento",
    description: "Data de realização do evento",
  },
  {
    key: "event_location",
    label: "Local do Evento",
    description: "Local onde o evento foi realizado",
  },
  {
    key: "certificate_number",
    label: "Número do Certificado",
    description: "Número único do certificado",
  },
  {
    key: "issue_date",
    label: "Data de Emissão",
    description: "Data em que o certificado foi emitido",
  },
  {
    key: "hours",
    label: "Carga Horária",
    description: "Carga horária do evento (customizável)",
  },
  {
    key: "validation_code",
    label: "Código de Validação",
    description: "Código único de validação do certificado",
  },
  {
    key: "validation_url",
    label: "URL de Validação",
    description: "Link direto para a página de validação",
  },
];
