import puppeteer from "puppeteer";
import { CertificateTemplate } from "@/types/certificate";

interface GeneratePDFOptions {
  template: CertificateTemplate;
  variables: Record<string, string>;
}

/**
 * Gera o HTML para renderização do certificado
 */
function generateCertificateHtml(
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate</title>
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

      // Criar canvas Fabric.js
      const canvas = new fabric.Canvas('certificate-canvas', {
        width: width,
        height: height,
        selection: false,
        renderOnAddRemove: false
      });

      // Aplicar background
      if (design.background || design.backgroundColor) {
        canvas.backgroundColor = design.background || design.backgroundColor;
      }

      // Carregar backgroundFrame se existir
      if (design.backgroundFrame) {
        try {
          const img = await fabric.FabricImage.fromURL(design.backgroundFrame);
          const scaleX = width / (img.width || 1);
          const scaleY = height / (img.height || 1);
          img.scale(Math.max(scaleX, scaleY));
          img.set({
            left: 0,
            top: 0,
            selectable: false,
            evented: false,
            originX: 'left',
            originY: 'top'
          });
          canvas.add(img);
          canvas.sendObjectToBack(img);
        } catch (err) {
          console.error('Error loading background frame:', err);
        }
      }

      // Carregar objetos do design
      if (design.objects && Array.isArray(design.objects)) {
        for (const obj of design.objects) {
          try {
            // Pular imagens de background frame
            if (obj.data?.isBackgroundFrame) continue;

            const objType = obj.type?.toLowerCase();

            if (objType === 'itext' || objType === 'text' || objType === 'i-text') {
              // Processar variáveis no texto
              let text = obj.text || '';
              if (obj.data?.isVariable) {
                const varName = obj.data.variableName;
                text = variables[varName] || \`{{\${varName}}}\`;
              } else if (text.includes('{{') && text.includes('}}')) {
                text = text.replace(/\\{\\{(\\w+)\\}\\}/g, (match, varName) => {
                  return variables[varName] || match;
                });
              }

              const textObj = new fabric.IText(text, {
                left: obj.left,
                top: obj.top,
                fontSize: obj.fontSize,
                fontFamily: obj.fontFamily,
                fontWeight: obj.fontWeight,
                fontStyle: obj.fontStyle,
                fill: obj.fill,
                textAlign: obj.textAlign,
                originX: obj.originX || 'left',
                originY: obj.originY || 'top',
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || 0,
                lineHeight: obj.lineHeight || 1.16,
                selectable: false,
                evented: false
              });
              canvas.add(textObj);
            } else if (objType === 'image') {
              const img = await fabric.FabricImage.fromURL(obj.src);
              img.set({
                left: obj.left,
                top: obj.top,
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || 0,
                originX: obj.originX || 'left',
                originY: obj.originY || 'top',
                selectable: false,
                evented: false
              });
              canvas.add(img);
            } else if (objType === 'rect') {
              const rect = new fabric.Rect({
                left: obj.left,
                top: obj.top,
                width: obj.width,
                height: obj.height,
                fill: obj.fill,
                stroke: obj.stroke,
                strokeWidth: obj.strokeWidth,
                rx: obj.rx || 0,
                ry: obj.ry || 0,
                originX: obj.originX || 'left',
                originY: obj.originY || 'top',
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || 0,
                selectable: false,
                evented: false
              });
              canvas.add(rect);
            }
          } catch (err) {
            console.error('Error rendering object:', err);
          }
        }
      }

      canvas.renderAll();

      // Notificar que está pronto
      setTimeout(() => {
        window.__CERTIFICATE_READY__ = true;
      }, 1000);
    })();
  </script>
</body>
</html>`;
}

/**
 * Gera PDF do certificado usando Puppeteer para renderização fiel
 * Esta abordagem garante que o PDF seja idêntico ao que é visto no editor
 */
export async function generateCertificatePDF({
  template,
  variables,
}: GeneratePDFOptions): Promise<Buffer> {
  let browser = null;

  try {
    console.log("=== DEBUG: Gerando PDF via Puppeteer ===");
    console.log("Template ID:", template.id);
    console.log("Template dimensions:", template.width, "x", template.height);
    console.log("Variables:", variables);

    // Gerar HTML com o certificado
    const html = generateCertificateHtml(
      template.design,
      variables,
      template.width,
      template.height
    );

    console.log("HTML generated, launching browser...");

    // Iniciar Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-security",
        "--allow-file-access-from-files",
      ],
    });

    const page = await browser.newPage();

    // Configurar viewport para o tamanho do certificado
    await page.setViewport({
      width: template.width,
      height: template.height,
      deviceScaleFactor: 1,
    });

    console.log("Setting HTML content...");

    // Carregar HTML diretamente (sem servidor HTTP)
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Aguardar o certificado estar pronto
    console.log("Waiting for certificate to render...");

    try {
      await page.waitForFunction(
        () => (window as any).__CERTIFICATE_READY__ === true,
        { timeout: 25000 }
      );
    } catch (waitError) {
      console.warn("Timeout waiting for ready signal, proceeding anyway...");
    }

    // Aguardar um pouco mais para garantir que imagens foram carregadas
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("Capturing PDF...");

    // Gerar PDF
    const pdfBuffer = await page.pdf({
      width: template.width,
      height: template.height,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    });

    console.log("PDF generated successfully, size:", pdfBuffer.length, "bytes");

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Prepara variáveis para um participante específico
 */
export function prepareVariablesForAttendee(
  attendee: any,
  event: any,
  certificateNumber: string,
  validationCode?: string,
  validationUrl?: string
): Record<string, string> {
  const now = new Date();

  return {
    participant_name: `${attendee.first_name} ${attendee.last_name}`,
    event_title: event.title,
    event_date: new Date(event.start_date).toLocaleDateString("pt-BR"),
    event_location: event.location || "Online",
    certificate_number: certificateNumber,
    issue_date: now.toLocaleDateString("pt-BR"),
    event_duration: event.duration || "N/A",
    organizer_name: event.organizer?.name || "Organizador",
    validation_code: validationCode || "",
    validation_url: validationUrl || "",
  };
}
