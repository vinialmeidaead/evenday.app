"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Event, Attendee } from "@/types/evenday";

type FilterType = "all" | "checked-in" | "not-checked-in" | "has-certificate";

export default function EventAttendeesPage() {
  const params = useParams();
  const router = useRouter();
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

  useEffect(() => {
    Promise.all([
      fetch(`/api/events/${eventId}`).then((res) => res.json()),
      fetch(`/api/events/${eventId}/attendees`).then((res) => res.json()),
    ])
      .then(([eventData, attendeesData]) => {
        setEvent(eventData.event);
        setAttendees(attendeesData.attendees || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    let filtered = attendees;

    // Apply filter
    if (filter === "checked-in") {
      filtered = filtered.filter((a) => a.checked_in);
    } else if (filter === "not-checked-in") {
      filtered = filtered.filter((a) => !a.checked_in);
    }
    // TODO: Add has-certificate filter once certificates are implemented

    // Apply search
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
          <p className="text-sm text-gray-600">Certificados Emitidos</p>
          <p className="text-2xl font-bold text-purple-600">0</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos</option>
            <option value="checked-in">Com Check-in</option>
            <option value="not-checked-in">Sem Check-in</option>
            <option value="has-certificate">Com Certificado</option>
          </select>

          {/* Bulk Actions */}
          {selectedAttendees.size > 0 && (
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              onClick={() =>
                alert(`Emitir ${selectedAttendees.size} certificados`)
              }
            >
              Emitir Certificados ({selectedAttendees.size})
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Certificado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ações
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
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Pendente
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        onClick={() =>
                          alert(
                            `Emitir certificado para ${attendee.first_name}`
                          )
                        }
                      >
                        Emitir
                      </button>
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
    </div>
  );
}
