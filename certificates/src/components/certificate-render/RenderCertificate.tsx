"use client";

import { useEffect, useRef } from "react";
import { Canvas, IText, Rect, Image as FabricImage } from "fabric";

interface RenderCertificateProps {
  design: any;
  variables: Record<string, string>;
  width: number;
  height: number;
  onReady?: () => void;
}

export default function RenderCertificate({
  design,
  variables,
  width,
  height,
  onReady,
}: RenderCertificateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initCanvas = async () => {
      // Criar canvas Fabric.js
      const canvas = new Canvas(canvasRef.current!, {
        width,
        height,
        selection: false,
        renderOnAddRemove: false,
      });
      fabricCanvasRef.current = canvas;

      // Aplicar background
      if (design.background) {
        canvas.backgroundColor = design.background;
      }

      // Carregar backgroundFrame se existir
      if (design.backgroundFrame) {
        try {
          const img = await FabricImage.fromURL(design.backgroundFrame);
          const scaleX = width / (img.width || 1);
          const scaleY = height / (img.height || 1);
          img.scale(Math.max(scaleX, scaleY));
          img.set({
            left: 0,
            top: 0,
            selectable: false,
            evented: false,
            originX: "left",
            originY: "top",
          });
          canvas.add(img);
          canvas.sendObjectToBack(img);
        } catch (err) {
          console.error("Error loading background frame:", err);
        }
      }

      // Carregar objetos do design
      if (design.objects && Array.isArray(design.objects)) {
        for (const obj of design.objects) {
          try {
            // Pular imagens de background frame
            if (obj.data?.isBackgroundFrame) continue;

            const objType = obj.type?.toLowerCase();

            if (
              objType === "itext" ||
              objType === "text" ||
              objType === "i-text"
            ) {
              // Processar variáveis no texto
              let text = obj.text || "";
              if (obj.data?.isVariable) {
                const varName = obj.data.variableName;
                text = variables[varName] || `{{${varName}}}`;
              } else if (text.includes("{{") && text.includes("}}")) {
                text = text.replace(
                  /\{\{(\w+)\}\}/g,
                  (match: string, varName: string) => {
                    return variables[varName] || match;
                  }
                );
              }

              const textObj = new IText(text, {
                left: obj.left,
                top: obj.top,
                fontSize: obj.fontSize,
                fontFamily: obj.fontFamily,
                fontWeight: obj.fontWeight,
                fontStyle: obj.fontStyle,
                fill: obj.fill,
                textAlign: obj.textAlign,
                originX: obj.originX || "left",
                originY: obj.originY || "top",
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || 0,
                lineHeight: obj.lineHeight || 1.16,
                selectable: false,
                evented: false,
              });
              canvas.add(textObj);
            } else if (objType === "image") {
              const img = await FabricImage.fromURL(obj.src);
              img.set({
                left: obj.left,
                top: obj.top,
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || 0,
                originX: obj.originX || "left",
                originY: obj.originY || "top",
                selectable: false,
                evented: false,
              });
              canvas.add(img);
            } else if (objType === "rect") {
              const rect = new Rect({
                left: obj.left,
                top: obj.top,
                width: obj.width,
                height: obj.height,
                fill: obj.fill,
                stroke: obj.stroke,
                strokeWidth: obj.strokeWidth,
                rx: obj.rx || 0,
                ry: obj.ry || 0,
                originX: obj.originX || "left",
                originY: obj.originY || "top",
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || 0,
                selectable: false,
                evented: false,
              });
              canvas.add(rect);
            }
          } catch (err) {
            console.error("Error rendering object:", err);
          }
        }
      }

      canvas.renderAll();

      // Notificar que o canvas está pronto
      setTimeout(() => {
        onReady?.();
      }, 500);
    };

    initCanvas();

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [design, variables, width, height, onReady]);

  return (
    <div
      id="certificate-container"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: "relative",
      }}
    >
      <canvas ref={canvasRef} id="certificate-canvas" />
    </div>
  );
}
