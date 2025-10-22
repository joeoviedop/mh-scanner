"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/navigation/logout-button";

import { DASHBOARD_PRIMARY_NAV } from "./dashboard-nav-config";

export function DashboardTopBar() {
  const pathname = usePathname();

  const renderNavLink = (href: string, label: string) => {
    const _isActive = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        className={""}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="">
      <div className="">
        <Link href="/dashboard" className="">
          <span className="">
            Vb
          </span>
          <div className="">
            <p className="">VoyBien</p>
            <p className="">Therapy Scanner</p>
          </div>
        </Link>

        <div className="">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className=""
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21 21-4.35-4.35" />
            <circle cx="11" cy="11" r="7" />
          </svg>
          <input
            type="search"
            placeholder="Buscar canales, episodios o fragmentos"
            className=""
          />
        </div>

        <div className="">
          <Link
            href="/dashboard#add-source"
            className=""
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className=""
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Nuevo escaneo
          </Link>
          <div className="">
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="">
        <nav className="">
          {DASHBOARD_PRIMARY_NAV.map((item) => renderNavLink(item.href, item.label))}
        </nav>
      </div>
    </div>
  );
}
