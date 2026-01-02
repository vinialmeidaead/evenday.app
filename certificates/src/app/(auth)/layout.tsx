"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FiHome, FiCalendar, FiLayout, FiLogOut, FiUser } from "react-icons/fi";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0"></div>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => pathname?.startsWith(path);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: FiHome },
    { href: "/events", label: "Eventos", icon: FiCalendar },
    { href: "/templates", label: "Templates", icon: FiLayout },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-72 bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50">
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="px-6 py-6 border-b border-slate-200/50">
            <div className="relative w-full h-12 mb-3">
              <Image
                src="/logo-escura.png"
                alt="evenday.app Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
            <p className="text-sm font-medium text-slate-500 pl-1">
              Certificados
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-5 py-8 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    active
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]"
                      : "text-slate-700 hover:bg-slate-100/80 hover:scale-[1.02] hover:shadow-md"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-300 ${
                      active ? "scale-110" : "group-hover:scale-110"
                    }`}
                  />
                  <span className="font-medium">{item.label}</span>
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="px-5 py-5 border-t border-slate-200/50 bg-gradient-to-br from-slate-50/50 to-transparent">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm border border-slate-200/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
                <FiUser className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-300 hover:scale-110"
                title="Sair"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-72">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
