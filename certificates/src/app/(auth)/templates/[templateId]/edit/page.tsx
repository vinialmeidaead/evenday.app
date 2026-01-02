"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { FiAlertCircle, FiArrowLeft } from "react-icons/fi";

const CertificateEditor = dynamic(
  () => import("@/components/certificate-editor/CertificateEditor"),
  { ssr: false }
);

interface Template {
  id: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  design: any;
}

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/templates/${templateId}`)
      .then((res) => res.json())
      .then((data) => setTemplate(data.template))
      .catch((err) => console.error("Error loading template:", err))
      .finally(() => setLoading(false));
  }, [templateId]);

  const handleSave = async (canvasDesign: any) => {
    setSaving(true);

    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          design: canvasDesign,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao salvar template");
      }

      alert("Template atualizado com sucesso!");
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FiAlertCircle className="h-24 w-24 text-gray-300 mb-4 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Template não encontrado
          </h2>
          <Link
            href="/templates"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <FiArrowLeft className="mr-2" />
            Voltar para templates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0">
      <CertificateEditor
        width={template.width}
        height={template.height}
        initialDesign={template.design}
        onSave={handleSave}
      />

      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="text-gray-900 font-medium">
              Salvando alterações...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
