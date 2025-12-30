"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user data
    fetch("/api/auth/user")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isActive = (path: string) => pathname?.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-4 border-b">
            <h1 className="text-xl font-bold text-indigo-600">evenday.app</h1>
            <p className="text-sm text-gray-600">Certificados</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link
              href="/dashboard"
              className={`block px-4 py-2 rounded-lg transition-colors ${
                isActive("/dashboard")
                  ? "bg-indigo-50 text-indigo-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/events"
              className={`block px-4 py-2 rounded-lg transition-colors ${
                isActive("/events")
                  ? "bg-indigo-50 text-indigo-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Eventos
            </Link>
            <Link
              href="/templates"
              className={`block px-4 py-2 rounded-lg transition-colors ${
                isActive("/templates")
                  ? "bg-indigo-50 text-indigo-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Templates
            </Link>
          </nav>

          {/* User info */}
          <div className="px-4 py-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 text-sm text-gray-600 hover:text-gray-900"
                title="Sair"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
