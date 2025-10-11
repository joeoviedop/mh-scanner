import type { ReactNode } from "react";

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME, isSessionTokenValid } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              VoyBien · Internal Tool
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              Podcast Therapy Scanner
            </h1>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-700">
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="hover:text-slate-900">
                Inicio
              </Link>
              <Link href="/dashboard/episodes" className="hover:text-slate-900">
                Episodios
              </Link>
              <Link href="/dashboard/config" className="hover:text-slate-900">
                Configuración
              </Link>
            </nav>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white/70 py-4 text-center text-xs text-slate-500">
        Datos internos de VoyBien · Construido para mapear conversaciones reales
      </footer>
    </div>
  );
}