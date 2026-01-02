import jsPDF from "jspdf";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { CertificateTemplate } from "@/types/certificate";

interface GeneratePDFOptions {
  template: CertificateTemplate;
  variables: Record<string, string>;
}

/**
 * Gera PDF do certificado a partir do template e variáveis
 * Usa @napi-rs/canvas para renderizar no servidor
 */
export async function generateCertificatePDF({
  template,
  variables,
}: GeneratePDFOptions): Promise<Buffer> {
  try {
    // DEBUG: Log da estrutura do template
    console.log("=== DEBUG: Gerando PDF ===");
    console.log("Template ID:", template.id);
    console.log("Template dimensions:", template.width, "x", template.height);
    console.log("Design structure:", JSON.stringify(template.design, null, 2));
    console.log("Background:", template.design?.background);
    console.log("Objects count:", template.design?.objects?.length || 0);
    console.log("Variables:", variables);

    // Criar canvas
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext("2d");

    // Background - Fabric.js usa 'backgroundColor', mas pode ter sido salvo como 'background'
    const bgColor =
      template.design.backgroundColor ||
      template.design.background ||
      "#ffffff";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, template.width, template.height);

    console.log("Background applied:", ctx.fillStyle);

    // Processar objetos do design
    if (template.design.objects && Array.isArray(template.design.objects)) {
      console.log(`Processing ${template.design.objects.length} objects...`);

      for (const obj of template.design.objects) {
        try {
          console.log("Processing object:", {
            type: obj.type,
            text: obj.text,
            isVariable: obj.data?.isVariable,
            variableName: obj.data?.variableName,
            left: obj.left,
            top: obj.top,
          });

          // Fabric.js v7 usa "IText" com I maiúsculo
          const objType = obj.type?.toLowerCase();

          if (
            objType === "itext" ||
            objType === "text" ||
            objType === "i-text"
          ) {
            await renderText(ctx, obj, variables);
          } else if (objType === "image") {
            await renderImage(ctx, obj);
          } else if (objType === "rect") {
            renderRect(ctx, obj);
          } else if (objType === "line") {
            renderLine(ctx, obj);
          }
        } catch (err) {
          console.error("Error rendering object:", err);
          // Continue mesmo se um objeto falhar
        }
      }
    } else {
      console.warn("No objects found in template design");
    }

    // Converter canvas para buffer PNG
    const pngBuffer = canvas.toBuffer("image/png");

    // Criar PDF
    const pdf = new jsPDF({
      orientation: template.width > template.height ? "landscape" : "portrait",
      unit: "px",
      format: [template.width, template.height],
    });

    // Adicionar imagem ao PDF
    const pngDataUrl = `data:image/png;base64,${pngBuffer.toString("base64")}`;
    pdf.addImage(pngDataUrl, "PNG", 0, 0, template.width, template.height);

    // Retornar como buffer
    return Buffer.from(pdf.output("arraybuffer"));
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error(
      `Failed to generate PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Renderiza texto no canvas
 */
async function renderText(
  ctx: any,
  obj: any,
  variables: Record<string, string>
) {
  let text = obj.text || "";

  // Substituir variável se for uma (via propriedade data)
  if (obj.data?.isVariable) {
    const varName = obj.data.variableName;
    text = variables[varName] || `{{${varName}}}`;
    console.log(`Replacing variable (via data): {{${varName}}} -> ${text}`);
  } else if (text.includes("{{") && text.includes("}}")) {
    // Fallback: detectar variáveis pelo padrão {{nome}} no texto
    const originalText = text;
    text = text.replace(/\{\{(\w+)\}\}/g, (match: string, varName: string) => {
      return variables[varName] || match;
    });
    if (originalText !== text) {
      console.log(
        `Replacing variable (via pattern): ${originalText} -> ${text}`
      );
    }
  }

  // Configurações de fonte - aplicar escala ao tamanho
  const baseSize = obj.fontSize || 40;
  const scaleX = obj.scaleX || 1;
  const scaleY = obj.scaleY || 1;
  const fontSize = baseSize * scaleY; // Aplicar escala Y ao tamanho da fonte

  console.log(
    `[TEXT] "${text.substring(0, 30)}..." at (${obj.left}, ${
      obj.top
    }), fontSize: ${baseSize} * ${scaleY} = ${fontSize}, originX: ${
      obj.originX
    }, originY: ${obj.originY}, textAlign: ${obj.textAlign}`
  );

  const fontFamily = obj.fontFamily || "Arial";
  const fontWeight = obj.fontWeight === "bold" ? "bold" : "normal";
  const fontStyle = obj.fontStyle === "italic" ? "italic" : "normal";

  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = obj.fill || "#000000";

  // IMPORTANTE: Usar originX para determinar o alinhamento, NÃO obj.textAlign!
  // Em Fabric.js, originX define onde está o ponto de referência do objeto
  // Se originX = "center", o ponto (left, top) é o CENTRO do objeto
  // Então precisamos centralizar o texto nesse ponto também
  const originX = obj.originX || "left";

  if (originX === "center") {
    ctx.textAlign = "center";
  } else if (originX === "right") {
    ctx.textAlign = "right";
  } else {
    ctx.textAlign = "left";
  }

  // Salvar estado do contexto
  ctx.save();

  // Posição base do objeto
  const x = obj.left || 0;
  const y = obj.top || 0;

  // Aplicar translação para a posição
  ctx.translate(x, y);

  // Aplicar rotação se houver
  if (obj.angle) {
    ctx.rotate((obj.angle * Math.PI) / 180);
  }

  // NÃO usar ctx.scale() - já aplicamos scale ao fontSize

  // Ajustar baseline baseado no originY
  // Em Fabric.js, originY define qual ponto vertical do objeto está em obj.top
  const originY = obj.originY || "top";

  if (originY === "center" || originY === "middle") {
    ctx.textBaseline = "middle";
  } else if (originY === "top") {
    ctx.textBaseline = "top";
  } else if (originY === "bottom") {
    ctx.textBaseline = "bottom";
  } else {
    ctx.textBaseline = "alphabetic";
  }

  // Renderizar texto (suporte a multilinha)
  const lines = text.split("\n");
  const lineHeight = fontSize * (obj.lineHeight || 1.16);

  if (lines.length === 1) {
    // Texto de linha única - renderizar direto em (0,0)
    ctx.fillText(text, 0, 0);
  } else {
    // Texto multilinha - centralizar as linhas em torno do ponto (0,0)
    lines.forEach((line: string, index: number) => {
      // Calcular Y para cada linha, centralizado em torno de 0
      const lineY = (index - (lines.length - 1) / 2) * lineHeight;
      ctx.fillText(line, 0, lineY);
    });
  }

  ctx.restore();
}

/**
 * Renderiza imagem no canvas
 */
async function renderImage(ctx: any, obj: any) {
  if (!obj.src) return;

  try {
    // Converter URLs localhost para caminhos do filesystem
    let imagePath = obj.src;
    if (imagePath.startsWith("http://localhost")) {
      // Extrair o caminho relativo e converter para caminho absoluto
      const urlPath = new URL(imagePath).pathname;
      imagePath = `./public${urlPath}`;
      console.log(
        "Converting localhost URL to filesystem path:",
        obj.src,
        "->",
        imagePath
      );
    }

    const image = await loadImage(imagePath);

    ctx.save();

    const x = obj.left || 0;
    const y = obj.top || 0;
    const width = (obj.width || image.width) * (obj.scaleX || 1);
    const height = (obj.height || image.height) * (obj.scaleY || 1);

    if (obj.angle) {
      ctx.translate(x + width / 2, y + height / 2);
      ctx.rotate((obj.angle * Math.PI) / 180);
      ctx.drawImage(image, -width / 2, -height / 2, width, height);
    } else {
      ctx.drawImage(image, x, y, width, height);
    }

    ctx.restore();
  } catch (err) {
    console.error("Error loading image:", err);
  }
}

/**
 * Renderiza retângulo no canvas
 */
function renderRect(ctx: any, obj: any) {
  const x = obj.left || 0;
  const y = obj.top || 0;
  const width = obj.width || 100;
  const height = obj.height || 100;

  ctx.save();

  if (obj.fill && obj.fill !== "transparent") {
    ctx.fillStyle = obj.fill;
    ctx.fillRect(x, y, width, height);
  }

  if (obj.stroke) {
    ctx.strokeStyle = obj.stroke;
    ctx.lineWidth = obj.strokeWidth || 1;
    ctx.strokeRect(x, y, width, height);
  }

  ctx.restore();
}

/**
 * Renderiza linha no canvas
 */
function renderLine(ctx: any, obj: any) {
  if (!obj.x1 || !obj.y1 || !obj.x2 || !obj.y2) return;

  ctx.save();
  ctx.strokeStyle = obj.stroke || "#000000";
  ctx.lineWidth = obj.strokeWidth || 1;
  ctx.beginPath();
  ctx.moveTo(obj.x1, obj.y1);
  ctx.lineTo(obj.x2, obj.y2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Prepara variáveis para um participante específico
 */
export function prepareVariablesForAttendee(
  attendee: any,
  event: any,
  certificateNumber: string
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
  };
}
