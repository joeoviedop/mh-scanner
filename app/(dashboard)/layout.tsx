import type { ReactNode } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";
import { DashboardTopBar } from "@/components/navigation/dashboard-top-bar";
import { PageContainer } from "@/components/layout/page-container";
import { AUTH_COOKIE_NAME, isSessionTokenValid } from "@/lib/auth";

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
    <div className="">
      <div className="" />
      <div className="" />
      <div className="" />

      <div className="">
        <DashboardSidebar />

        <div className="">
          <DashboardTopBar />

          <main className="">
            <PageContainer className="">{children}</PageContainer>
          </main>

          <footer className="">
            <PageContainer className="">
              <p>Datos internos de VoyBien · Terapia y bienestar en español</p>
              <div className="">
                <span className="" />
                Activo
              </div>
            </PageContainer>
          </footer>
        </div>
      </div>
    </div>
  );
}
