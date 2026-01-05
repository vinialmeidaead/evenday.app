import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";
import { CertificateTemplate } from "@/types/certificate";
import { generateBackPageHTML } from "@/components/certificate-back-page/CertificateBackPage";
import { generateQRCodeDataUrl } from "./validation-utils";

/**
 * Gera o HTML para renderização da frente do certificado (Fabric.js)
 */
function generateFrontPageHtml(
  design: any,
  variables: Record<string, string>,
  width: number,
  height: number
): string {
  const designJson = JSON.stringify(design);
  const variablesJson = JSON.stringify(variables);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Certificate Front</title>
  <link href="https://fonts.googleapis.com/css2?family=Varela+Round&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/fabric@6.0.2/dist/index.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { margin: 0; padding: 0; overflow: hidden; background: #ffffff; }
    #certificate-container { width: ${width}px; height: ${height}px; }
  </style>
</head>
<body>
  <div id="certificate-container">
    <canvas id="certificate-canvas"></canvas>
  </div>
  <script>
    (async function() {
      const design = ${designJson};
      const variables = ${variablesJson};
      const width = ${width};
      const height = ${height};

      const canvas = new fabric.Canvas('certificate-canvas', {
        width: width,
        height: height,
        selection: false,
        renderOnAddRemove: false
      });

      if (design.background || design.backgroundColor) {
        canvas.backgroundColor = design.background || design.backgroundColor;
      }

      if (design.backgroundFrame) {
        try {
          const img = await fabric.FabricImage.fromURL(design.backgroundFrame);
          const scaleX = width / (img.width || 1);
          const scaleY = height / (img.height || 1);
          img.scale(Math.max(scaleX, scaleY));
          img.set({ left: 0, top: 0, selectable: false, evented: false, originX: 'left', originY: 'top' });
          canvas.add(img);
          canvas.sendObjectToBack(img);
        } catch (err) { console.error('Error loading background frame:', err); }
      }

      if (design.objects && Array.isArray(design.objects)) {
        for (const obj of design.objects) {
          try {
            if (obj.data?.isBackgroundFrame) continue;
            const objType = obj.type?.toLowerCase();

            if (objType === 'itext' || objType === 'text' || objType === 'i-text') {
              let text = obj.text || '';
              if (obj.data?.isVariable) {
                const varName = obj.data.variableName;
                text = variables[varName] || \`{{\${varName}}}\`;
              } else if (text.includes('{{') && text.includes('}}')) {
                text = text.replace(/\\{\\{(\\w+)\\}\\}/g, (match, varName) => variables[varName] || match);
              }

              const textObj = new fabric.IText(text, {
                left: obj.left, top: obj.top, fontSize: obj.fontSize, fontFamily: obj.fontFamily,
                fontWeight: obj.fontWeight, fontStyle: obj.fontStyle, fill: obj.fill,
                textAlign: obj.textAlign, originX: obj.originX || 'left', originY: obj.originY || 'top',
                scaleX: obj.scaleX || 1, scaleY: obj.scaleY || 1, angle: obj.angle || 0,
                lineHeight: obj.lineHeight || 1.16, selectable: false, evented: false
              });
              canvas.add(textObj);
            } else if (objType === 'image') {
              const img = await fabric.FabricImage.fromURL(obj.src);
              img.set({
                left: obj.left, top: obj.top, scaleX: obj.scaleX || 1, scaleY: obj.scaleY || 1,
                angle: obj.angle || 0, originX: obj.originX || 'left', originY: obj.originY || 'top',
                selectable: false, evented: false
              });
              canvas.add(img);
            } else if (objType === 'rect') {
              const rect = new fabric.Rect({
                left: obj.left, top: obj.top, width: obj.width, height: obj.height,
                fill: obj.fill, stroke: obj.stroke, strokeWidth: obj.strokeWidth,
                rx: obj.rx || 0, ry: obj.ry || 0, originX: obj.originX || 'left', originY: obj.originY || 'top',
                scaleX: obj.scaleX || 1, scaleY: obj.scaleY || 1, angle: obj.angle || 0,
                selectable: false, evented: false
              });
              canvas.add(rect);
            }
          } catch (err) { console.error('Error rendering object:', err); }
        }
      }
      canvas.renderAll();
      setTimeout(() => { window.__CERTIFICATE_READY__ = true; }, 1000);
    })();
  </script>
</body>
</html>`;
}

/**
 * Gera PDF completo do certificado (frente + verso)
 */
export async function generateFullCertificatePDF(
  template: CertificateTemplate,
  variables: Record<string, string>,
  validationData: {
    certificateNumber: string;
    validationCode: string;
    validationUrl: string;
    issueDate: string;
  }
): Promise<Buffer> {
  let browser = null;

  try {
    // 1. Preparar recursos
    const qrCodeDataUrl = await generateQRCodeDataUrl(validationData.validationUrl);

    // Carregar logo da evenday para base64
    let logoDataUrl = "";
    try {
      const logoPath = path.join(process.cwd(), "public", "logo-escura.png");
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString("base64");
      logoDataUrl = `data:image/png;base64,${logoBase64}`;
    } catch (err) {
      console.warn("Aviso: Logo não encontrada em public/logo-escura.png");
    }

    // HTML da Frente
    const frontHtml = generateFrontPageHtml(
      template.design,
      variables,
      template.width,
      template.height
    );

    // HTML do Verso
    const backHtml = generateBackPageHTML({
      certificateNumber: validationData.certificateNumber,
      validationCode: validationData.validationCode,
      validationUrl: validationData.validationUrl,
      qrCodeDataUrl,
      logoDataUrl,
      eventTitle: variables.event_title || "Evento",
      participantName: variables.participant_name || "Participante",
      issueDate: validationData.issueDate,
    });

    // 2. Renderizar ambos em PDF usando Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });

    const page = await browser.newPage();
    // Aumentar o timeout padrão para 60 segundos
    page.setDefaultNavigationTimeout(60000);

    // Renderizar Frente
    await page.setViewport({ width: template.width, height: template.height });
    await page.setContent(frontHtml, { waitUntil: "load" });

    // Aguardar o sinal específico do Fabric.js estar pronto
    try {
      await page.waitForFunction(() => (window as any).__CERTIFICATE_READY__ === true, {
        timeout: 45000,
        polling: 100
      });
      // Um pequeno fôlego extra para garantir a renderização final das fontes/imagens
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.warn("Aviso: Sinal de renderização não recebido a tempo, tentando gerar PDF assim mesmo...");
    }

    const frontPdfBuffer = await page.pdf({
      width: `${template.width}px`,
      height: `${template.height}px`,
      printBackground: true,
      preferCSSPageSize: true,
    });

    // Renderizar Verso
    // O verso é HTML puro com QR Code em Base64, carrega instantaneamente
    await page.setViewport({ width: 1754, height: 1240 });
    await page.setContent(backHtml, { waitUntil: "domcontentloaded" });

    const backPdfBuffer = await page.pdf({
      width: "1754px",
      height: "1240px",
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();
    browser = null;

    // 3. Combinar PDFs com pdf-lib
    const frontPdfDoc = await PDFDocument.load(frontPdfBuffer);
    const backPdfDoc = await PDFDocument.load(backPdfBuffer);
    const combinedDoc = await PDFDocument.create();

    const [frontPage] = await combinedDoc.copyPages(frontPdfDoc, [0]);
    combinedDoc.addPage(frontPage);

    const [backPage] = await combinedDoc.copyPages(backPdfDoc, [0]);
    combinedDoc.addPage(backPage);

    const combinedBytes = await combinedDoc.save();
    return Buffer.from(combinedBytes);

  } catch (error) {
    console.error("Full certificate generation error:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}
