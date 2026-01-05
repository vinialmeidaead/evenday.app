"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ValidateHomePage() {
    const router = useRouter();
    const [code, setCode] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.trim()) {
            router.push(`/validate/${code.trim()}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Logo/Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full mb-6 shadow-2xl">
                        <svg
                            className="w-12 h-12 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-bold text-gray-900 mb-3">
                        Validação de Certificado
                    </h1>
                    <p className="text-xl text-gray-600">
                        Verifique a autenticidade de certificados emitidos pela plataforma Evenday
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="validation-code"
                                className="block text-sm font-semibold text-gray-700 mb-3"
                            >
                                Código de Validação
                            </label>
                            <input
                                id="validation-code"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Digite o código do certificado"
                                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                required
                            />
                            <p className="mt-2 text-sm text-gray-500">
                                O código de validação está localizado no verso do certificado ou no QR code
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all transform hover:scale-[1.02] shadow-lg"
                        >
                            Validar Certificado
                        </button>
                    </form>

                    {/* Info Section */}
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Como validar seu certificado?
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mt-0.5">
                                    <span className="text-sm font-bold text-indigo-600">1</span>
                                </div>
                                <p className="text-gray-600">
                                    Localize o código de validação no verso do seu certificado
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mt-0.5">
                                    <span className="text-sm font-bold text-indigo-600">2</span>
                                </div>
                                <p className="text-gray-600">
                                    Digite o código no campo acima ou escaneie o QR code
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mt-0.5">
                                    <span className="text-sm font-bold text-indigo-600">3</span>
                                </div>
                                <p className="text-gray-600">
                                    Visualize as informações completas e a autenticidade do certificado
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Security Badge */}
                    <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-3">
                            <svg
                                className="w-6 h-6 text-green-600 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-green-900">
                                    Sistema Seguro de Validação
                                </p>
                                <p className="text-sm text-green-700">
                                    Todos os certificados são verificados em tempo real em nosso banco de dados
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-sm text-gray-500">
                        Powered by{" "}
                        <span className="font-semibold text-indigo-600">Evenday</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
