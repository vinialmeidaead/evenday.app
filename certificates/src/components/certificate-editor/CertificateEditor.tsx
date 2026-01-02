"use client";

import { useEffect, useRef, useState } from "react";
import {
  Canvas,
  FabricObject,
  IText,
  Rect,
  Image as FabricImage,
} from "fabric";
import {
  FiType,
  FiImage,
  FiSquare,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiArrowUp,
  FiArrowDown,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiCopy,
  FiTrash2,
  FiMinus,
  FiPlus,
  FiXCircle,
  FiSave,
  FiTag,
  FiX,
  FiInfo,
  FiLayout,
} from "react-icons/fi";

interface DesignData {
  version?: string;
  objects?: unknown[];
  background?: string;
  backgroundFrame?: string | null;
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

const FRAMES = [
  { id: 1, path: "/molduras/moldura-1.jpg", name: "Moldura Clássica" },
  { id: 2, path: "/molduras/moldura-2.jpg", name: "Moldura Elegante" },
  { id: 3, path: "/molduras/moldura-3.jpg", name: "Moldura Premium" },
  { id: 4, path: "/molduras/moldura-4.jpg", name: "Moldura Moderna" },
  { id: 5, path: "/molduras/moldura-5.jpg", name: "Moldura Sofisticada" },
];

export default function CertificateEditor({
  width = 3000,
  height = 2000,
  initialDesign,
  onSave,
}: CertificateEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(
    null
  );
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [backgroundFrame, setBackgroundFrame] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.3);
  const [activeTab, setActiveTab] = useState<
    "variables" | "frames" | "properties"
  >("variables");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Propriedades do objeto selecionado
  const [objectProps, setObjectProps] = useState({
    fontFamily: "Arial",
    fontSize: 40,
    fill: "#000000",
    textAlign: "left",
    fontWeight: "normal",
    fontStyle: "normal",
    opacity: 1,
    angle: 0,
    lineHeight: 1.16,
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
        fontWeight: String(textObj.fontWeight || "normal"),
        fontStyle: textObj.fontStyle || "normal",
        opacity: textObj.opacity || 1,
        angle: textObj.angle || 0,
        lineHeight: textObj.lineHeight || 1.16,
      });
    }
  };

  // Inicializar Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Verificar se o canvas já tem contexto antes de criar o Fabric Canvas
    const canvasElement = canvasRef.current;
    if (!canvasElement.getContext) return;

    // Verificar se o contexto 2D está disponível
    const testContext = canvasElement.getContext("2d");
    if (!testContext) return;

    let fabricCanvas: Canvas | null = null;

    // Aguardar um frame para garantir que o canvas está totalmente montado no DOM
    const rafId = requestAnimationFrame(() => {
      if (!canvasRef.current) return;

      try {
        fabricCanvas = new Canvas(canvasRef.current, {
          width: width * zoom,
          height: height * zoom,
          backgroundColor: backgroundColor,
          preserveObjectStacking: true,
        });

        // Verificar se o lowerCanvasEl foi criado corretamente
        if (!fabricCanvas.lowerCanvasEl) {
          console.error("Canvas não foi inicializado corretamente");
          return;
        }

        // Verificar se o contexto do lowerCanvas está disponível
        const lowerContext = fabricCanvas.lowerCanvasEl.getContext("2d");
        if (!lowerContext) {
          console.error("Contexto 2D não está disponível");
          if (fabricCanvas) {
            fabricCanvas.dispose();
          }
          return;
        }

        // Carregar design inicial
        if (initialDesign) {
          fabricCanvas.loadFromJSON(initialDesign, () => {
            try {
              if (!fabricCanvas) return;
              fabricCanvas.setZoom(zoom);

              // Carregar moldura de fundo se existir
              if (initialDesign.backgroundFrame) {
                setBackgroundFrame(initialDesign.backgroundFrame);
              }

              if (fabricCanvas.lowerCanvasEl?.getContext("2d")) {
                fabricCanvas.renderAll();
              }
            } catch (error) {
              console.error("Erro ao carregar design inicial:", error);
            }
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
      } catch (error) {
        console.error("Erro ao inicializar canvas:", error);
        if (fabricCanvas) {
          try {
            fabricCanvas.dispose();
          } catch (disposeError) {
            console.error("Erro ao fazer dispose após erro:", disposeError);
          }
        }
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (fabricCanvas) {
        try {
          fabricCanvas.dispose();
        } catch (error) {
          console.error("Erro ao fazer cleanup do canvas:", error);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualizar zoom
  useEffect(() => {
    if (!canvas) return;
    try {
      if (!canvas.lowerCanvasEl) return;

      const context = canvas.lowerCanvasEl.getContext("2d");
      if (!context) return;

      canvas.setZoom(zoom);
      canvas.setDimensions({
        width: width * zoom,
        height: height * zoom,
      });
      canvas.renderAll();
    } catch (error) {
      console.error("Erro ao atualizar zoom:", error);
    }
  }, [zoom, canvas, width, height]);

  // Atualizar background
  useEffect(() => {
    if (!canvas) return;
    try {
      if (!canvas.lowerCanvasEl) return;

      const context = canvas.lowerCanvasEl.getContext("2d");
      if (!context) return;

      canvas.backgroundColor = backgroundColor;
      canvas.renderAll();
    } catch (error) {
      console.error("Erro ao atualizar background:", error);
    }
  }, [backgroundColor, canvas]);

  // Aplicar moldura de fundo
  const applyBackgroundFrame = (framePath: string) => {
    if (!canvas) return;

    try {
      // Remover moldura anterior se existir
      const objects = canvas.getObjects();
      const existingFrame = objects.find(
        (obj: any) => obj.data?.isBackgroundFrame
      );
      if (existingFrame) {
        canvas.remove(existingFrame);
      }

      // Carregar nova moldura
      FabricImage.fromURL(framePath).then((img) => {
        try {
          if (!canvas.lowerCanvasEl) return;

          const context = canvas.lowerCanvasEl.getContext("2d");
          if (!context) return;

          // Escalar moldura para preencher todo o canvas
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

          // Marcar como moldura de fundo
          (img as any).data = { isBackgroundFrame: true };

          // Adicionar e enviar para trás
          canvas.add(img);
          canvas.sendObjectToBack(img);
          canvas.renderAll();
          setBackgroundFrame(framePath);
        } catch (error) {
          console.error("Erro ao adicionar moldura:", error);
        }
      });
    } catch (error) {
      console.error("Erro ao aplicar moldura:", error);
    }
  };

  // Remover moldura de fundo
  const removeBackgroundFrame = () => {
    if (!canvas) return;

    try {
      const objects = canvas.getObjects();
      const existingFrame = objects.find(
        (obj: any) => obj.data?.isBackgroundFrame
      );
      if (existingFrame) {
        canvas.remove(existingFrame);
        canvas.renderAll();
        setBackgroundFrame(null);
      }
    } catch (error) {
      console.error("Erro ao remover moldura:", error);
    }
  };

  // Undo/Redo functions
  const undo = () => {
    if (!canvas) return;
    try {
      // Implementação básica - você pode expandir com stack de histórico
      canvas.renderAll();
      setCanUndo(false);
    } catch (error) {
      console.error("Erro ao fazer undo:", error);
    }
  };

  const redo = () => {
    if (!canvas) return;
    try {
      // Implementação básica - você pode expandir com stack de histórico
      canvas.renderAll();
      setCanRedo(false);
    } catch (error) {
      console.error("Erro ao fazer redo:", error);
    }
  };

  // Adicionar texto
  const addText = () => {
    if (!canvas) return;
    try {
      if (!canvas.lowerCanvasEl) return;

      const context = canvas.lowerCanvasEl.getContext("2d");
      if (!context) return;

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
    } catch (error) {
      console.error("Erro ao adicionar texto:", error);
    }
  };

  // Adicionar título grande
  const addTitle = () => {
    if (!canvas) return;
    try {
      if (!canvas.lowerCanvasEl) return;

      const context = canvas.lowerCanvasEl.getContext("2d");
      if (!context) return;

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
    } catch (error) {
      console.error("Erro ao adicionar título:", error);
    }
  };

  // Adicionar variável
  const addVariable = (variableName: string, label: string) => {
    if (!canvas) return;
    try {
      if (!canvas.lowerCanvasEl) return;

      const context = canvas.lowerCanvasEl.getContext("2d");
      if (!context) return;

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
    } catch (error) {
      console.error("Erro ao adicionar variável:", error);
    }
  };

  // Upload de imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;

      FabricImage.fromURL(imgUrl).then((img) => {
        try {
          if (!canvas.lowerCanvasEl) return;

          const context = canvas.lowerCanvasEl.getContext("2d");
          if (!context) return;

          const scale = Math.min(
            400 / (img.width || 1),
            400 / (img.height || 1)
          );
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
        } catch (error) {
          console.error("Erro ao adicionar imagem:", error);
        }
      });
    };

    reader.readAsDataURL(file);
    // Reset input para permitir upload da mesma imagem novamente
    e.target.value = "";
  };

  // Adicionar formas
  const addRectangle = () => {
    if (!canvas) return;
    try {
      if (!canvas.lowerCanvasEl) return;

      const context = canvas.lowerCanvasEl.getContext("2d");
      if (!context) return;

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
    } catch (error) {
      console.error("Erro ao adicionar retângulo:", error);
    }
  };

  // Atualizar propriedade do texto
  const updateTextProperty = (prop: string, value: string | number) => {
    if (!canvas || !selectedObject || selectedObject.type !== "i-text") return;

    try {
      if (!canvas.lowerCanvasEl) return;

      const context = canvas.lowerCanvasEl.getContext("2d");
      if (!context) return;

      const textObj = selectedObject as IText;
      (textObj as unknown as Record<string, unknown>)[prop] = value;
      canvas.renderAll();

      setObjectProps((prev) => ({ ...prev, [prop]: value }));
    } catch (error) {
      console.error("Erro ao atualizar propriedade do texto:", error);
    }
  };

  // Alinhamento
  const alignObject = (
    alignment: "left" | "center" | "right" | "top" | "middle" | "bottom"
  ) => {
    if (!canvas || !selectedObject) return;

    try {
      if (!canvas.lowerCanvasEl) return;

      const context = canvas.lowerCanvasEl.getContext("2d");
      if (!context) return;

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
    } catch (error) {
      console.error("Erro ao alinhar objeto:", error);
    }
  };

  // Camadas
  const bringToFront = () => {
    if (!canvas || !selectedObject) return;
    try {
      if (!canvas.lowerCanvasEl) return;

      const context = canvas.lowerCanvasEl.getContext("2d");
      if (!context) return;

      (selectedObject as any).bringToFront();
      canvas.renderAll();
    } catch (error) {
      console.error("Erro ao trazer para frente:", error);
    }
  };

  const sendToBack = () => {
    if (!canvas || !selectedObject) return;
    try {
      if (!canvas.lowerCanvasEl) return;

      const context = canvas.lowerCanvasEl.getContext("2d");
      if (!context) return;

      (selectedObject as any).sendToBack();
      canvas.renderAll();
    } catch (error) {
      console.error("Erro ao enviar para trás:", error);
    }
  };

  // Deletar
  const deleteSelected = () => {
    if (!canvas) return;
    try {
      if (!canvas.lowerCanvasEl) return;

      const context = canvas.lowerCanvasEl.getContext("2d");
      if (!context) return;

      const activeObjects = canvas.getActiveObjects();
      activeObjects.forEach((obj) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
    } catch (error) {
      console.error("Erro ao deletar objeto:", error);
    }
  };

  // Limpar tudo
  const clearCanvas = () => {
    if (!canvas) return;
    if (confirm("Tem certeza que deseja limpar todo o canvas?")) {
      try {
        if (!canvas.lowerCanvasEl) return;

        const context = canvas.lowerCanvasEl.getContext("2d");
        if (!context) return;

        canvas.clear();
        canvas.backgroundColor = backgroundColor;
        canvas.renderAll();
      } catch (error) {
        console.error("Erro ao limpar canvas:", error);
      }
    }
  };

  // Salvar
  const handleSave = () => {
    if (!canvas) return;
    try {
      const json = canvas.toJSON() as DesignData;
      json.backgroundFrame = backgroundFrame;
      onSave?.(json);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  // Duplicar objeto
  const duplicateObject = () => {
    if (!canvas || !selectedObject) return;

    try {
      if (!canvas.lowerCanvasEl) return;

      const context = canvas.lowerCanvasEl.getContext("2d");
      if (!context) return;

      selectedObject.clone().then((cloned: FabricObject) => {
        try {
          if (!canvas.lowerCanvasEl) return;
          const clonedContext = canvas.lowerCanvasEl.getContext("2d");
          if (!clonedContext) return;

          cloned.set({
            left: (cloned.left || 0) + 20,
            top: (cloned.top || 0) + 20,
          });
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          canvas.renderAll();
        } catch (error) {
          console.error("Erro ao adicionar objeto clonado:", error);
        }
      });
    } catch (error) {
      console.error("Erro ao duplicar objeto:", error);
    }
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
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <FiType /> Texto
            </button>
            <label className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-2">
              <FiImage /> Imagem
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={addRectangle}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors inline-flex items-center gap-2"
              title="Adicionar Forma"
            >
              <FiSquare /> Forma
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
                <FiAlignLeft />
              </button>
              <button
                onClick={() => alignObject("center")}
                disabled={!selectedObject}
                className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Centralizar Horizontalmente"
              >
                <FiAlignCenter />
              </button>
              <button
                onClick={() => alignObject("right")}
                disabled={!selectedObject}
                className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Alinhar à Direita"
              >
                <FiAlignRight />
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
                <FiArrowUp />
              </button>
              <button
                onClick={sendToBack}
                disabled={!selectedObject}
                className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Enviar para Trás"
              >
                <FiArrowDown />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300"></div>

            {/* Undo/Redo */}
            <div className="flex gap-1">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Desfazer"
              >
                <FiCornerUpLeft />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Refazer"
              >
                <FiCornerUpRight />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300"></div>

            <button
              onClick={duplicateObject}
              disabled={!selectedObject}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
              title="Duplicar"
            >
              <FiCopy />
            </button>
            <button
              onClick={deleteSelected}
              disabled={!selectedObject}
              className="px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
              title="Deletar"
            >
              <FiTrash2 />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Zoom */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                <FiMinus />
              </button>
              <span className="text-sm text-gray-700 w-16 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                <FiPlus />
              </button>
            </div>

            <button
              onClick={clearCanvas}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg inline-flex items-center gap-2"
            >
              <FiXCircle /> Limpar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              <FiSave /> Salvar Template
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Painel Esquerdo - Com Tabs */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("variables")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 ${
                activeTab === "variables"
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <FiTag /> Variáveis
            </button>
            <button
              onClick={() => setActiveTab("frames")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 ${
                activeTab === "frames"
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <FiImage /> Molduras
            </button>
          </div>

          {/* Conteúdo das Tabs */}
          <div className="flex-1 overflow-y-auto">
            {/* Tab de Variáveis */}
            {activeTab === "variables" && (
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                  Variáveis Dinâmicas
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Clique para adicionar variáveis ao certificado
                </p>
                <div className="space-y-2">
                  {variables.map((variable) => (
                    <button
                      key={variable.key}
                      onClick={() => addVariable(variable.key, variable.label)}
                      className="w-full px-3 py-2.5 text-left bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 rounded-lg transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-indigo-500">
                          <FiTag size={18} />
                        </div>
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
            )}

            {/* Tab de Molduras */}
            {activeTab === "frames" && (
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                  Molduras de Fundo
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Escolha uma moldura para o certificado
                </p>

                {/* Botão para remover moldura */}
                {backgroundFrame && (
                  <button
                    onClick={removeBackgroundFrame}
                    className="w-full mb-4 px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <FiX /> Remover Moldura
                  </button>
                )}

                {/* Grid de molduras */}
                <div className="grid grid-cols-2 gap-3">
                  {FRAMES.map((frame) => (
                    <button
                      key={frame.id}
                      onClick={() => applyBackgroundFrame(frame.path)}
                      className={`relative aspect-[3/2] rounded-lg overflow-hidden border-2 transition-all ${
                        backgroundFrame === frame.path
                          ? "border-indigo-600 ring-2 ring-indigo-200 shadow-lg"
                          : "border-gray-200 hover:border-indigo-300 hover:shadow-md"
                      }`}
                      title={frame.name}
                    >
                      <img
                        src={frame.path}
                        alt={frame.name}
                        className="w-full h-full object-cover"
                      />
                      {backgroundFrame === frame.path && (
                        <div className="absolute inset-0 bg-indigo-600 bg-opacity-20 flex items-center justify-center">
                          <div className="bg-white rounded-full p-1">
                            <svg
                              className="w-4 h-4 text-indigo-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Informações das molduras */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                  <FiInfo className="text-blue-900 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-900">
                    <strong>Dica:</strong> A moldura será aplicada como plano de
                    fundo do certificado e não poderá ser movida ou editada.
                  </p>
                </div>
              </div>
            )}
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

                    {/* Rotação */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Rotação: {Math.round(objectProps.angle)}°
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={objectProps.angle}
                        onChange={(e) =>
                          updateTextProperty("angle", parseInt(e.target.value))
                        }
                        className="w-full"
                      />
                    </div>

                    {/* Espaçamento de Linha */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Espaçamento: {objectProps.lineHeight.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={objectProps.lineHeight}
                        onChange={(e) =>
                          updateTextProperty(
                            "lineHeight",
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full"
                      />
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
                <FiLayout className="text-gray-400 text-4xl mb-4 mx-auto" />
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
