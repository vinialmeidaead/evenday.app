import { fabric } from "fabric";
import jsPDF from "jspdf";
import {
  generateCertificateNumber,
  formatCertificateDate,
} from "./certificate-utils";

export interface CertificateData {
  template: any; // Fabric.js design JSON
  variables: Record<string, string>;
}

/**
 * Generate Certificate PDF from template and data
 */
export async function generateCertificatePDF(
  data: CertificateData
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Create temporary canvas
      const canvas = new fabric.StaticCanvas(null, {
        width: data.template.width || 1754,
        height: data.template.height || 1240,
      });

      // Load template design
      canvas.loadFromJSON(data.template, () => {
        try {
          // Replace variables in text objects
          canvas.getObjects().forEach((obj) => {
            if (
              obj.type === "i-text" ||
              obj.type === "text" ||
              obj.type === "textbox"
            ) {
              const textObj = obj as fabric.Text;
              let text = textObj.text || "";

              // Replace {{variable}} with actual values
              Object.entries(data.variables).forEach(([key, value]) => {
                const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
                text = text.replace(regex, value);
              });

              textObj.set({ text });
            }
          });

          canvas.renderAll();

          // Convert canvas to data URL
          const dataURL = canvas.toDataURL({
            format: "png",
            quality: 1.0,
            multiplier: 2, // High resolution
          });

          // Create PDF
          const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
          });

          const imgWidth = 297; // A4 landscape width in mm
          const imgHeight = 210; // A4 landscape height in mm

          pdf.addImage(dataURL, "PNG", 0, 0, imgWidth, imgHeight);

          // Convert to Blob
          const pdfBlob = pdf.output("blob");
          resolve(pdfBlob);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Upload PDF to storage (S3 or local)
 */
export async function uploadPDF(blob: Blob, filename: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, filename);

  const response = await fetch("/api/certificates/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload PDF");
  }

  const { url } = await response.json();
  return url;
}

/**
 * Generate filename for certificate PDF
 */
export function generatePDFFilename(
  attendeeId: number,
  eventId: number
): string {
  const timestamp = Date.now();
  return `certificate-${eventId}-${attendeeId}-${timestamp}.pdf`;
}
