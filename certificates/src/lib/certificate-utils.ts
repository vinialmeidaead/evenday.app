/**
 * Utility functions for certificate number generation and formatting
 */

/**
 * Generate unique certificate number
 * Format: CERT-YYYY-XXXXXX
 */
export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  return `CERT-${year}-${random}`;
}

/**
 * Format date for display in certificates
 */
export function formatCertificateDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Extract variables from Fabric.js canvas design
 */
export function extractVariablesFromDesign(design: any): string[] {
  const variables = new Set<string>();

  if (design.objects) {
    design.objects.forEach((obj: any) => {
      if (
        obj.type === "i-text" ||
        obj.type === "text" ||
        obj.type === "textbox"
      ) {
        const text = obj.text || "";
        const matches = text.match(/\{\{([^}]+)\}\}/g);
        if (matches) {
          matches.forEach((match: string) => {
            const varName = match.replace(/\{\{|\}\}/g, "").trim();
            variables.add(varName);
          });
        }
      }
    });
  }

  return Array.from(variables);
}
