"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { FiX, FiCheck } from "react-icons/fi";
import { certificateTemplates } from "@/data/certificate-templates";

// Importar editor dinamicamente (client-side only)
const CertificateEditor = dynamic(
  () => import("@/components/certificate-editor/CertificateEditor"),
  { ssr: false }
);

export default function NewTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [showTemplates, setShowTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const handleSave = async (canvasDesign: any) => {
    if (!name.trim()) {
      alert("Por favor, dê um nome ao template");
      setShowModal(true);
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          width: 3000,
          height: 2000,
          design: canvasDesign,
          variables: {},
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao salvar template");
      }

      alert("Template salvo com sucesso!");
      router.push("/templates");
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Tela de seleção de templates
  if (showTemplates) {
    return (
      <div className="fixed inset-0 bg-background-page flex items-center justify-center p-8">
        <div className="bg-surface rounded-xl shadow-2xl p-8 max-w-6xl w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Escolha um Template
            </h2>
            <p className="text-gray-600">
              Comece com um modelo profissional ou crie do zero
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Opção: Criar do Zero */}
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setShowTemplates(false);
              }}
              className="group relative aspect-[3/2] rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center"
            >
              <div className="text-center p-6">
                <div className="text-5xl mb-3">✨</div>
                <div className="font-semibold text-gray-900 mb-1">
                  Criar do Zero
                </div>
                <div className="text-sm text-gray-500">
                  Comece com um certificado em branco
                </div>
              </div>
            </button>

            {/* Templates Pré-configurados */}
            {certificateTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template);
                  setShowTemplates(false);
                }}
                className="group relative aspect-[3/2] rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all"
              >
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4">
                  <div className="text-white">
                    <div className="font-semibold text-lg mb-1">
                      {template.name}
                    </div>
                    <div className="text-xs opacity-90 mb-2">
                      {template.description}
                    </div>
                    <div className="inline-block px-2 py-1 bg-primary/80 rounded text-xs">
                      {template.category}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiX /> Cancelar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Criar Novo Template
          </h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Template *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Certificado de Participação"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do template"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/templates"
              className="flex-1 inline-flex items-center justify-center px-4 py-3 text-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FiX className="mr-2" />
              Cancelar
            </Link>
            <button
              onClick={() => {
                if (!name.trim()) {
                  alert("Por favor, dê um nome ao template");
                  return;
                }
                setShowModal(false);
              }}
              className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FiCheck className="mr-2" />
              Começar a Editar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0">
      <CertificateEditor
        width={3000}
        height={2000}
        initialDesign={selectedTemplate?.design}
        onSave={handleSave}
      />

      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="text-gray-900 font-medium">
              Salvando template...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
