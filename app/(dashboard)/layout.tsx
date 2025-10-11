import type { ReactNode } from "react";

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME, isSessionTokenValid } from "@/lib/auth";
import { LogoutButton } from "@/src/components/logout-button";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const authenticated = await isSessionTokenValid(sessionToken);

  if (!authenticated) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Modern Header */}
      <header className="bg-white border-b border-gray-200 shadow-stripe">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gradient-1 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">V</span>
            </div>
            <div>
              <p className="text-xs font-medium text-brand-dark opacity-70 uppercase tracking-wider">
                VoyBien · Internal Tool
              </p>
              <h1 className="text-lg font-semibold text-gray-900">
                Podcast Therapy Scanner
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            <Link 
              href="/dashboard" 
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 hover-lift"
            >
              Inicio
            </Link>
            <Link 
              href="/dashboard/episodes" 
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 hover-lift"
            >
              Episodios
            </Link>
            <Link 
              href="/dashboard/config" 
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 hover-lift"
            >
              Configuración
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8">
        {children}
      </main>

      {/* Modern Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Datos internos de VoyBien · Construido para mapear conversaciones reales
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">System Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}