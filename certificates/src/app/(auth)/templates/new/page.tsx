"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

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
          width: 1754,
          height: 1240,
          design: canvasDesign,
          variables: {},
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao salvar template");
      }

      alert("✅ Template salvo com sucesso!");
      router.push("/templates");
    } catch (error: any) {
      alert("❌ Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

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
              className="flex-1 px-4 py-3 text-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
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
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Começar a Editar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0">
      <CertificateEditor width={1754} height={1240} onSave={handleSave} />

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
