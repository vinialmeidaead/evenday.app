"use client";

import { useEffect, useState } from "react";

interface Certificate {
  id: string;
  certificateNumber: string;
  pdfUrl: string;
  generatedAt: string;
  eventId: number;
  attendeeId: number;
  template: {
    name: string;
  };
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCertificates = () => {
    setLoading(true);
    fetch("/api/certificates")
      .then((res) => res.json())
      .then((data) => setCertificates(data.certificates || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const handleDelete = async (cert: Certificate) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir o certificado ${cert.certificateNumber}?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/certificates/${cert.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erro ao excluir certificado");
      }

      alert("✅ Certificado excluído com sucesso!");
      loadCertificates(); // Recarregar lista
    } catch (error: any) {
      alert("❌ Erro ao excluir: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Certificados Emitidos
      </h1>

      {certificates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum certificado emitido ainda
          </h3>
          <p className="text-gray-500">
            Vá para eventos e emita certificados para os participantes
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data de Emissão
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {certificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {cert.certificateNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {cert.template.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    Evento #{cert.eventId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(cert.generatedAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <a
                        href={cert.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                      >
                        📥 Baixar
                      </a>
                      <button
                        onClick={() => handleDelete(cert)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600 text-center">
        Total: {certificates.length} certificados
      </div>
    </div>
  );
}
