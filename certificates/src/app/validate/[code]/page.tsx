"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CertificateData {
    valid: boolean;
    certificate?: {
        certificateNumber: string;
        participantName: string;
        eventTitle: string;
        eventDate: string;
        issueDate: string;
        templateName: string;
        hours?: string;
    };
    message?: string;
}

export default function ValidateCertificatePage() {
    const params = useParams();
    const code = params.code as string;

    const [data, setData] = useState<CertificateData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (code) {
            fetch(`/api/validate/${code}`)
                .then((res) => res.json())
                .then((data) => {
                    setData(data);
                })
                .catch((err) => {
                    setError("Erro ao validar certificado");
                    console.error(err);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [code]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Validando certificado...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full mb-4 shadow-lg">
                        <svg
                            className="w-10 h-10 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Validação de Certificado
                    </h1>
                    <p className="text-gray-600">
                        Sistema de verificação de autenticidade Evenday
                    </p>
                </div>

                {/* Result Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {error || !data ? (
                        <div className="p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                                <svg
                                    className="w-8 h-8 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Erro na Validação
                            </h2>
                            <p className="text-gray-600">{error || "Erro desconhecido"}</p>
                        </div>
                    ) : data.valid && data.certificate ? (
                        <>
                            {/* Success Header */}
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-3">
                                    <svg
                                        className="w-8 h-8 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-1">
                                    ✓ Certificado Válido
                                </h2>
                                <p className="text-green-100">
                                    Este certificado foi verificado e é autêntico
                                </p>
                            </div>

                            {/* Certificate Details */}
                            <div className="p-8">
                                <div className="space-y-6">
                                    {/* Participant Name - Destacado */}
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-200">
                                        <p className="text-sm font-medium text-indigo-600 mb-1">
                                            Participante
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {data.certificate.participantName}
                                        </p>
                                    </div>

                                    {/* Event Details */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="bg-gray-50 p-5 rounded-xl">
                                            <p className="text-sm font-medium text-gray-600 mb-1">
                                                Evento
                                            </p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {data.certificate.eventTitle}
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 p-5 rounded-xl">
                                            <p className="text-sm font-medium text-gray-600 mb-1">
                                                Data do Evento
                                            </p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {data.certificate.eventDate}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Certificate Info */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="bg-gray-50 p-5 rounded-xl">
                                            <p className="text-sm font-medium text-gray-600 mb-1">
                                                Número do Certificado
                                            </p>
                                            <p className="text-lg font-mono font-semibold text-indigo-600">
                                                {data.certificate.certificateNumber}
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 p-5 rounded-xl">
                                            <p className="text-sm font-medium text-gray-600 mb-1">
                                                Data de Emissão
                                            </p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {data.certificate.issueDate}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Additional Info */}
                                    {data.certificate.hours && (
                                        <div className="bg-gray-50 p-5 rounded-xl">
                                            <p className="text-sm font-medium text-gray-600 mb-1">
                                                Carga Horária
                                            </p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {data.certificate.hours}
                                            </p>
                                        </div>
                                    )}

                                    <div className="bg-gray-50 p-5 rounded-xl">
                                        <p className="text-sm font-medium text-gray-600 mb-1">
                                            Template
                                        </p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {data.certificate.templateName}
                                        </p>
                                    </div>
                                </div>

                                {/* Security Notice */}
                                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <svg
                                            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-blue-900 mb-1">
                                                Sobre a Validação
                                            </p>
                                            <p className="text-sm text-blue-700">
                                                Este certificado foi emitido através da plataforma
                                                Evenday e possui um código único de validação. A
                                                autenticidade foi verificada em nosso banco de dados.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                                <svg
                                    className="w-8 h-8 text-yellow-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Certificado Não Encontrado
                            </h2>
                            <p className="text-gray-600 mb-4">
                                {data.message || "O código de validação fornecido não corresponde a nenhum certificado em nosso sistema."}
                            </p>
                            <p className="text-sm text-gray-500">
                                Verifique se o código foi digitado corretamente ou entre em
                                contato com o organizador do evento.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-sm text-gray-500 mb-4">
                        Código de validação: <span className="font-mono font-semibold">{code}</span>
                    </p>
                    <Link
                        href="/validate"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                        Validar outro certificado
                    </Link>
                </div>
            </div>
        </div>
    );
}
