import crypto from "crypto";

/**
 * Gera um código de validação único e legível
 * Formato: XXXX-XXXX-XXXX (12 caracteres alfanuméricos)
 */
export function generateValidationCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removidos caracteres ambíguos (I, O, 0, 1)
    let code = "";

    for (let i = 0; i < 12; i++) {
        const randomIndex = crypto.randomInt(0, chars.length);
        code += chars[randomIndex];

        // Adicionar hífen após cada 4 caracteres
        if ((i + 1) % 4 === 0 && i < 11) {
            code += "-";
        }
    }

    return code;
}

/**
 * Gera a URL completa de validação para um código
 */
export function generateValidationUrl(code: string, baseUrl?: string): string {
    const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://certificados.evenday.app";
    return `${base}/validate/${code}`;
}

/**
 * Gera um Data URL de QR code para validação
 * Usa a biblioteca qrcode para gerar o QR code
 */
export async function generateQRCodeDataUrl(validationUrl: string): Promise<string> {
    try {
        const QRCode = require("qrcode");

        const qrCodeDataUrl = await QRCode.toDataURL(validationUrl, {
            errorCorrectionLevel: "H",
            type: "image/png",
            width: 300,
            margin: 2,
            color: {
                dark: "#000000",
                light: "#FFFFFF",
            },
        });

        return qrCodeDataUrl;
    } catch (error) {
        console.error("Erro ao gerar QR code:", error);
        throw new Error("Falha ao gerar QR code");
    }
}

/**
 * Valida o formato de um código de validação
 */
export function isValidValidationCode(code: string): boolean {
    // Formato: XXXX-XXXX-XXXX
    const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return pattern.test(code);
}

/**
 * Remove hífens de um código de validação
 */
export function normalizeValidationCode(code: string): string {
    return code.replace(/-/g, "").toUpperCase();
}

/**
 * Formata um código de validação com hífens
 */
export function formatValidationCode(code: string): string {
    const normalized = normalizeValidationCode(code);
    return normalized.replace(/(.{4})/g, "$1-").slice(0, -1);
}
