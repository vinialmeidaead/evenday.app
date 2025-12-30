"use client";

import { useEffect, useRef, useState } from "react";
import {
  Canvas,
  FabricObject,
  IText,
  Rect,
  Image as FabricImage,
} from "fabric";

interface DesignData {
  version?: string;
  objects?: unknown[];
  background?: string;
  [key: string]: unknown;
}

interface CertificateEditorProps {
  width?: number;
  height?: number;
  initialDesign?: DesignData;
  onSave?: (design: DesignData) => void;
}

const FONTS = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Palatino",
  "Garamond",
  "Bookman",
  "Comic Sans MS",
  "Trebuchet MS",
  "Arial Black",
  "Impact",
];

export default function CertificateEditor({
  width = 1754,
  height = 1240,
  initialDesign,
  onSave,
}: CertificateEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(
    null
  );
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [zoom, setZoom] = useState(0.5);

  // Propriedades do objeto selecionado
  const [objectProps, setObjectProps] = useState({
    fontFamily: "Arial",
    fontSize: 40,
    fill: "#000000",
    textAlign: "left",
    fontWeight: "normal",
    fontStyle: "normal",
    opacity: 1,
  });

  const updateSelectedObject = (obj: FabricObject) => {
    setSelectedObject(obj);
    if (obj && obj.type === "i-text") {
      const textObj = obj as IText;
      setObjectProps({
        fontFamily: (textObj.fontFamily as string) || "Arial",
        fontSize: textObj.fontSize || 40,
        fill: (textObj.fill as string) || "#000000",
        textAlign: (textObj.textAlign as string) || "left",
        fontWeight: textObj.fontWeight || "normal",
        fontStyle: textObj.fontStyle || "normal",
        opacity: textObj.opacity || 1,
      });
    }
  };

  // Inicializar Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width: width * zoom,
      height: height * zoom,
      backgroundColor: backgroundColor,
      preserveObjectStacking: true,
    });

    // Carregar design inicial
    if (initialDesign) {
      fabricCanvas.loadFromJSON(initialDesign, () => {
        fabricCanvas.setZoom(zoom);
        fabricCanvas.renderAll();
      });
    }

    // Event listeners
    fabricCanvas.on("selection:created", (e) => {
      const event = e as { selected: FabricObject[] };
      updateSelectedObject(event.selected[0]);
    });

    fabricCanvas.on("selection:updated", (e) => {
      const event = e as { selected: FabricObject[] };
      updateSelectedObject(event.selected[0]);
    });

    fabricCanvas.on("selection:cleared", () => {
      setSelectedObject(null);
    });

    fabricCanvas.on("object:modified", (e) => {
      const event = e as { target: FabricObject };
      updateSelectedObject(event.target);
    });

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualizar zoom
  useEffect(() => {
    if (!canvas) return;
    canvas.setZoom(zoom);
    canvas.setDimensions({
      width: width * zoom,
      height: height * zoom,
    });
    canvas.renderAll();
  }, [zoom, canvas, width, height]);

  // Atualizar background
  useEffect(() => {
    if (!canvas) return;
    canvas.backgroundColor = backgroundColor;
    canvas.renderAll();
  }, [backgroundColor, canvas]);

  // Adicionar texto
  const addText = () => {
    if (!canvas) return;

    const text = new IText("Clique para editar", {
      left: width / 2,
      top: height / 2,
      fontFamily: "Arial",
      fontSize: 40,
      fill: "#000000",
      originX: "center",
      originY: "center",
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  // Adicionar título grande
  const addTitle = () => {
    if (!canvas) return;

    const text = new IText("CERTIFICADO", {
      left: width / 2,
      top: height / 3,
      fontFamily: "Georgia",
      fontSize: 80,
      fill: "#1a1a1a",
      fontWeight: "bold",
      originX: "center",
      originY: "center",
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  // Adicionar variável
  const addVariable = (variableName: string, label: string) => {
    if (!canvas) return;

    const text = new IText(`{{${variableName}}}`, {
      left: width / 2,
      top: height / 2,
      fontFamily: "Arial",
      fontSize: 40,
      fill: "#4F46E5",
      originX: "center",
      originY: "center",
      data: { isVariable: true, variableName, variableLabel: label },
    } as Record<string, unknown>);

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  // Upload de imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;

      FabricImage.fromURL(imgUrl).then((img) => {
        const scale = Math.min(400 / (img.width || 1), 400 / (img.height || 1));
        img.scale(scale);
        img.set({
          left: width / 2,
          top: height / 2,
          originX: "center",
          originY: "center",
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };

    reader.readAsDataURL(file);
    // Reset input para permitir upload da mesma imagem novamente
    e.target.value = "";
  };

  // Adicionar formas
  const addRectangle = () => {
    if (!canvas) return;

    const rect = new Rect({
      left: width / 2,
      top: height / 2,
      width: 400,
      height: 60,
      fill: "transparent",
      stroke: "#4F46E5",
      strokeWidth: 3,
      originX: "center",
      originY: "center",
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  // Atualizar propriedade do texto
  const updateTextProperty = (prop: string, value: string | number) => {
    if (!canvas || !selectedObject || selectedObject.type !== "i-text") return;

    const textObj = selectedObject as IText;
    (textObj as Record<string, unknown>)[prop] = value;
    canvas.renderAll();

    setObjectProps((prev) => ({ ...prev, [prop]: value }));
  };

  // Alinhamento
  const alignObject = (
    alignment: "left" | "center" | "right" | "top" | "middle" | "bottom"
  ) => {
    if (!canvas || !selectedObject) return;

    const obj = selectedObject;

    switch (alignment) {
      case "left":
        obj.set({ left: 0, originX: "left" });
        break;
      case "center":
        obj.set({ left: width / 2, originX: "center" });
        break;
      case "right":
        obj.set({ left: width, originX: "right" });
        break;
      case "top":
        obj.set({ top: 0, originY: "top" });
        break;
      case "middle":
        obj.set({ top: height / 2, originY: "center" });
        break;
      case "bottom":
        obj.set({ top: height, originY: "bottom" });
        break;
    }

    obj.setCoords();
    canvas.renderAll();
  };

  // Camadas
  const bringToFront = () => {
    if (!canvas || !selectedObject) return;
    selectedObject.bringToFront();
    canvas.renderAll();
  };

  const sendToBack = () => {
    if (!canvas || !selectedObject) return;
    selectedObject.sendToBack();
    canvas.renderAll();
  };

  // Deletar
  const deleteSelected = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  // Limpar tudo
  const clearCanvas = () => {
    if (!canvas) return;
    if (confirm("Tem certeza que deseja limpar todo o canvas?")) {
      canvas.clear();
      canvas.backgroundColor = backgroundColor;
      canvas.renderAll();
    }
  };

  // Salvar
  const handleSave = () => {
    if (!canvas) return;
    const json = canvas.toJSON(["data"]);
    onSave?.(json);
  };

  // Duplicar objeto
  const duplicateObject = () => {
    if (!canvas || !selectedObject) return;

    selectedObject.clone((cloned: FabricObject) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
  };

  const variables = [
    { key: "participant_name", label: "Nome do Participante" },
    { key: "event_title", label: "Título do Evento" },
    { key: "event_date", label: "Data do Evento" },
    { key: "event_location", label: "Local do Evento" },
    { key: "certificate_number", label: "Número do Certificado" },
    { key: "issue_date", label: "Data de Emissão" },
    { key: "event_duration", label: "Duração do Evento" },
    { key: "organizer_name", label: "Nome do Organizador" },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar Superior */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Ferramentas principais */}
            <button
              onClick={addTitle}
              className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              title="Adicionar Título"
            >
              <span className="font-bold">T</span>
            </button>
            <button
              onClick={addText}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Adicionar Texto"
            >
              📝 Texto
            </button>
            <label className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
              🖼️ Imagem
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={addRectangle}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Adicionar Forma"
            >
              ◻️ Forma
            </button>

            <div className="w-px h-6 bg-gray-300"></div>

            {/* Alinhamento */}
            <div className="flex gap-1">
              <button
                onClick={() => alignObject("left")}
                disabled={!selectedObject}
                className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Alinhar à Esquerda"
              >
                ⬅️
              </button>
              <button
                onClick={() => alignObject("center")}
                disabled={!selectedObject}
                className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Centralizar Horizontalmente"
              >
                ↔️
              </button>
              <button
                onClick={() => alignObject("right")}
                disabled={!selectedObject}
                className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Alinhar à Direita"
              >
                ➡️
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300"></div>

            {/* Camadas */}
            <div className="flex gap-1">
              <button
                onClick={bringToFront}
                disabled={!selectedObject}
                className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Trazer para Frente"
              >
                ⬆️
              </button>
              <button
                onClick={sendToBack}
                disabled={!selectedObject}
                className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Enviar para Trás"
              >
                ⬇️
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300"></div>

            <button
              onClick={duplicateObject}
              disabled={!selectedObject}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
              title="Duplicar"
            >
              📋
            </button>
            <button
              onClick={deleteSelected}
              disabled={!selectedObject}
              className="px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
              title="Deletar"
            >
              🗑️
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Zoom */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                −
              </button>
              <span className="text-sm text-gray-700 w-16 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                +
              </button>
            </div>

            <button
              onClick={clearCanvas}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              🧹 Limpar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              💾 Salvar Template
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Painel Esquerdo - Variáveis */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
              Variáveis Dinâmicas
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              Arraste para o canvas ou clique para adicionar
            </p>
            <div className="space-y-2">
              {variables.map((variable) => (
                <button
                  key={variable.key}
                  onClick={() => addVariable(variable.key, variable.label)}
                  className="w-full px-3 py-2.5 text-left bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 rounded-lg transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏷️</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-indigo-700 truncate">
                        {`{{${variable.key}}}`}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5">
                        {variable.label}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Central */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-8">
          <div className="relative">
            <div className="absolute -top-6 left-0 text-xs text-gray-500">
              {width} × {height} px
            </div>
            <div
              className="shadow-2xl bg-white"
              style={{ width: width * zoom, height: height * zoom }}
            >
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>

        {/* Painel Direito - Propriedades */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            {selectedObject ? (
              <>
                <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                  Propriedades
                </h3>

                {selectedObject.type === "i-text" && (
                  <div className="space-y-4">
                    {/* Fonte */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Fonte
                      </label>
                      <select
                        value={objectProps.fontFamily}
                        onChange={(e) =>
                          updateTextProperty("fontFamily", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {FONTS.map((font) => (
                          <option
                            key={font}
                            value={font}
                            style={{ fontFamily: font }}
                          >
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tamanho */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Tamanho: {objectProps.fontSize}px
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="200"
                        value={objectProps.fontSize}
                        onChange={(e) =>
                          updateTextProperty(
                            "fontSize",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full"
                      />
                    </div>

                    {/* Cor */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Cor
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={objectProps.fill}
                          onChange={(e) =>
                            updateTextProperty("fill", e.target.value)
                          }
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={objectProps.fill}
                          onChange={(e) =>
                            updateTextProperty("fill", e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    {/* Estilo */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Estilo
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateTextProperty(
                              "fontWeight",
                              objectProps.fontWeight === "bold"
                                ? "normal"
                                : "bold"
                            )
                          }
                          className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                            objectProps.fontWeight === "bold"
                              ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          <strong>B</strong>
                        </button>
                        <button
                          onClick={() =>
                            updateTextProperty(
                              "fontStyle",
                              objectProps.fontStyle === "italic"
                                ? "normal"
                                : "italic"
                            )
                          }
                          className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                            objectProps.fontStyle === "italic"
                              ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          <em>I</em>
                        </button>
                      </div>
                    </div>

                    {/* Opacidade */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Opacidade: {Math.round(objectProps.opacity * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={objectProps.opacity}
                        onChange={(e) =>
                          updateTextProperty(
                            "opacity",
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {selectedObject.type !== "i-text" && (
                  <div className="text-sm text-gray-600">
                    <p>Tipo: {selectedObject.type}</p>
                    <p className="mt-2">
                      Selecione um texto para editar propriedades
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">🎨</div>
                <p className="text-sm text-gray-600">
                  Selecione um objeto para editar suas propriedades
                </p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                Canvas
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Cor de Fundo
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
