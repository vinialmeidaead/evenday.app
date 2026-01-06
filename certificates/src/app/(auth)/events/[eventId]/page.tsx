"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Event, Attendee } from "@/types/evenday";

type FilterType = "all" | "checked-in" | "not-checked-in" | "has-certificate";

interface Template {
  id: string;
  name: string;
}

interface IssuanceResult {
  summary: {
    total: number;
    success: number;
    failed: number;
    skipped: number;
  };
  results: {
    success: any[];
    failed: any[];
    skipped: any[];
  };
}

export default function EventAttendeesPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [selectedAttendees, setSelectedAttendees] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  // Modal de seleção de template
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [sendEmail, setSendEmail] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issuanceResult, setIssuanceResult] = useState<IssuanceResult | null>(
    null
  );

  useEffect(() => {
    Promise.all([
      fetch(`/api/events/${eventId}`).then((res) => res.json()),
      fetch(`/api/events/${eventId}/attendees`).then((res) => res.json()),
      fetch("/api/templates").then((res) => res.json()),
    ])
      .then(([eventData, attendeesData, templatesData]) => {
        setEvent(eventData.event);
        setAttendees(attendeesData.attendees || []);
        setTemplates(templatesData.templates || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    let filtered = attendees;

    if (filter === "checked-in") {
      filtered = filtered.filter((a) => a.checked_in);
    } else if (filter === "not-checked-in") {
      filtered = filtered.filter((a) => !a.checked_in);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.first_name.toLowerCase().includes(term) ||
          a.last_name.toLowerCase().includes(term) ||
          a.email.toLowerCase().includes(term)
      );
    }

    setFilteredAttendees(filtered);
  }, [attendees, filter, searchTerm]);

  const toggleSelectAll = () => {
    if (selectedAttendees.size === filteredAttendees.length) {
      setSelectedAttendees(new Set());
    } else {
      setSelectedAttendees(new Set(filteredAttendees.map((a) => a.id)));
    }
  };

  const toggleSelectAttendee = (attendeeId: number) => {
    const newSelected = new Set(selectedAttendees);
    if (newSelected.has(attendeeId)) {
      newSelected.delete(attendeeId);
    } else {
      newSelected.add(attendeeId);
    }
    setSelectedAttendees(newSelected);
  };

  const handleIssueCertificates = async () => {
    if (!selectedTemplate) {
      alert("Por favor, selecione um template");
      return;
    }

    setIssuing(true);
    setIssuanceResult(null);

    try {
      const res = await fetch("/api/certificates/issue-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate,
          eventId: parseInt(eventId),
          attendeeIds: Array.from(selectedAttendees),
          sendEmail,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao emitir certificados");
      }

      const result = await res.json();
      setIssuanceResult(result);
      setSelectedAttendees(new Set());
    } catch (error: any) {
      alert("❌ Erro: " + error.message);
    } finally {
      setIssuing(false);
    }
  };

  const handleIssueSingle = async (attendeeId: number) => {
    if (templates.length === 0) {
      alert("Nenhum template disponível. Crie um template primeiro.");
      return;
    }

    const templateId = templates[0].id; // Usar primeiro template como default

    try {
      const res = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          eventId: parseInt(eventId),
          attendeeId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao emitir certificado");
      }

      alert("✅ Certificado emitido com sucesso!");
      // Recarregar dados
      window.location.reload();
    } catch (error: any) {
      alert("❌ Erro: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Erro ao carregar evento
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/events"
          className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block"
        >
          ← Voltar para eventos
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
        <p className="text-gray-600">
          {new Date(event.start_date).toLocaleDateString("pt-BR")}
          {event.location && ` • ${event.location}`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total de Participantes</p>
          <p className="text-2xl font-bold text-gray-900">{attendees.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Com Check-in</p>
          <p className="text-2xl font-bold text-green-600">
            {attendees.filter((a) => a.checked_in).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Sem Check-in</p>
          <p className="text-2xl font-bold text-orange-600">
            {attendees.filter((a) => !a.checked_in).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Templates Disponíveis</p>
          <p className="text-2xl font-bold text-purple-600">
            {templates.length}
          </p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos</option>
            <option value="checked-in">Com Check-in</option>
            <option value="not-checked-in">Sem Check-in</option>
          </select>

          {selectedAttendees.size > 0 && (
            <button
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              onClick={() => setShowTemplateModal(true)}
            >
              📄 Emitir Certificados ({selectedAttendees.size})
            </button>
          )}
        </div>
      </div>

      {/* Attendees Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredAttendees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum participante encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        filteredAttendees.length > 0 &&
                        selectedAttendees.size === filteredAttendees.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Check-in
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAttendees.map((attendee) => (
                  <tr
                    key={attendee.id}
                    className={
                      selectedAttendees.has(attendee.id)
                        ? "bg-indigo-50"
                        : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedAttendees.has(attendee.id)}
                        onChange={() => toggleSelectAttendee(attendee.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {attendee.first_name} {attendee.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {attendee.email}
                    </td>
                    <td className="px-4 py-3">
                      {attendee.checked_in ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Sim
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Não
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results info */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        Exibindo {filteredAttendees.length} de {attendees.length} participantes
      </div>

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Selecionar Template
              </h2>
              <p className="text-gray-600 mb-6">
                {selectedAttendees.size} participante(s) selecionado(s)
              </p>

              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    Nenhum template disponível.
                  </p>
                  <Link
                    href="/templates/new"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Criar primeiro template →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {templates.map((template) => (
                    <label
                      key={template.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedTemplate === template.id
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-300"
                        }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={template.id}
                        checked={selectedTemplate === template.id}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded flex items-center justify-center">
                            📄
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {template.name}
                          </h3>
                        </div>
                        {selectedTemplate === template.id && (
                          <div className="text-indigo-600">✓</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Opção de Enviar Email */}
              <div className="mb-6">
                <label className="flex items-center space-x-3 cursor-pointer p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <span className="block font-medium text-gray-900">
                      Enviar por email
                    </span>
                    <span className="block text-sm text-gray-500">
                      Envia o certificado PDF automaticamente para o participante
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    setSelectedTemplate("");
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={issuing}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleIssueCertificates}
                  disabled={!selectedTemplate || issuing}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {issuing ? "Emitindo..." : "Emitir Certificados"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issuance Result Modal */}
      {issuanceResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Resultado da Emissão
              </h2>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {issuanceResult.summary.success}
                  </div>
                  <div className="text-sm text-green-700">Sucesso</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {issuanceResult.summary.skipped}
                  </div>
                  <div className="text-sm text-yellow-700">Ignorados</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {issuanceResult.summary.failed}
                  </div>
                  <div className="text-sm text-red-700">Falhas</div>
                </div>
              </div>

              {/* Details */}
              {issuanceResult.results.success.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-green-700 mb-2">
                    ✓ Emitidos com Sucesso
                  </h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {issuanceResult.results.success.map((item, idx) => (
                      <div key={idx} className="text-sm text-gray-600 flex justify-between items-center">
                        <span>• {item.name} - {item.certificateNumber}</span>
                        {item.emailSent && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            Email enviado
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {issuanceResult.results.failed.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-red-700 mb-2">✗ Falhas</h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {issuanceResult.results.failed.map((item, idx) => (
                      <div key={idx} className="text-sm text-red-600">
                        • {item.name}: {item.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setIssuanceResult(null);
                  setShowTemplateModal(false);
                  window.location.reload();
                }}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
