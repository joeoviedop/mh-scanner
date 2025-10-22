"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/navigation/logout-button";

import { DASHBOARD_PRIMARY_NAV } from "./dashboard-nav-config";

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="">
      <div className="">
        <span className="">
          Vb
        </span>
        <div>
          <p className="">VoyBien</p>
          <p className="">Therapy Scanner</p>
        </div>
      </div>

      <nav className="">
        <div className="">
          <p className="">Workspace</p>
          <ul className="">
            {DASHBOARD_PRIMARY_NAV.map((item) => {
              const _isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={""}
                  >
                    <item.icon
                      className={""}
                    />
                    <div className="">
                      <span className="">{item.label}</span>
                      {item.description ? (
                        <span className="">{item.description}</span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="">
          <p className="">¿Nuevo canal?</p>
          <p className="">
            Agrega un canal o playlist desde el panel y obtén la transcripción en minutos.
          </p>
          <Link
            href="/dashboard#add-source"
            className=""
          >
            Iniciar escaneo →
          </Link>
        </div>
      </nav>

      <div className="">
        <div className="">
          <div className="">
            JB
          </div>
          <div className="">
            <p className="">VoyBien Ops</p>
            <p className="">Equipo interno</p>
          </div>
        </div>
        <div className="">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
