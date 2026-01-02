"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiFileText,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiLayout,
} from "react-icons/fi";

interface Template {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch templates");
        return res.json();
      })
      .then((data) => setTemplates(data.templates || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (templateId: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return;

    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete template");

      setTemplates(templates.filter((t) => t.id !== templateId));
    } catch (err: any) {
      alert("Erro ao excluir template: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Erro ao carregar templates: {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Templates de Certificados
        </h1>
        <Link
          href="/templates/new"
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FiPlus className="mr-2" />
          Novo Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FiFileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum template criado ainda
          </h3>
          <p className="text-gray-500 mb-6">
            Crie seu primeiro template de certificado para começar a emitir.
          </p>
          <Link
            href="/templates/new"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            Criar Primeiro Template
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Preview placeholder */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 h-48 flex items-center justify-center">
                <FiLayout className="h-16 w-16 text-indigo-400" />
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 mb-4">
                  Criado em{" "}
                  {new Date(template.createdAt).toLocaleDateString("pt-BR")}
                </p>

                <div className="flex gap-2">
                  <Link
                    href={`/templates/${template.id}/edit`}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <FiEdit2 className="mr-2" />
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="inline-flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:text-red-800 transition-colors"
                  >
                    <FiTrash2 className="mr-1" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
