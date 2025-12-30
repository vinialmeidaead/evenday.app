"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalCertificates: number;
  totalTemplates: number;
}

interface RecentCertificate {
  id: string;
  eventId: number;
  attendeeId: number;
  certificateNumber: string;
  generatedAt: string;
  template: {
    name: string;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentCertificates, setRecentCertificates] = useState<
    RecentCertificate[]
  >([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((res) => res.json()),
      fetch("/api/events").then((res) => res.json()),
    ])
      .then(([statsData, eventsData]) => {
        setStats(statsData.stats);
        setRecentCertificates(statsData.recentCertificates || []);
        setEvents(eventsData.events || []);
      })
      .catch((error) => console.error("Error fetching dashboard data:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-1">Total de Eventos</p>
          <p className="text-3xl font-bold text-indigo-600">{events.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-1">Certificados Emitidos</p>
          <p className="text-3xl font-bold text-green-600">
            {stats?.totalCertificates || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-1">Templates Criados</p>
          <p className="text-3xl font-bold text-purple-600">
            {stats?.totalTemplates || 0}
          </p>
        </div>
      </div>

      {/* Recent Certificates */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Certificados Recentes</h2>
          {recentCertificates.length > 0 && (
            <span className="text-sm text-gray-500">
              Últimos {recentCertificates.length} certificados
            </span>
          )}
        </div>
        {recentCertificates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Número
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Template
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Emitido em
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {cert.certificateNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {cert.template.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(cert.generatedAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Nenhum certificado emitido ainda.
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/events"
          className="block p-6 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <h3 className="font-semibold text-indigo-900 mb-2">Ver Eventos</h3>
          <p className="text-sm text-indigo-700">
            Gerencie eventos e emita certificados
          </p>
        </Link>
        <Link
          href="/templates"
          className="block p-6 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <h3 className="font-semibold text-purple-900 mb-2">Criar Template</h3>
          <p className="text-sm text-purple-700">
            Desenhe novos modelos de certificados
          </p>
        </Link>
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Documentação</h3>
          <p className="text-sm text-gray-700">
            Aprenda a usar o sistema de certificados
          </p>
        </div>
      </div>
    </div>
  );
}
