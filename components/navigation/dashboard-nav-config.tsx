import type { ComponentType } from "react";



export type DashboardNavIconProps = {
  className?: string;
};

type DashboardNavIcon = ComponentType<DashboardNavIconProps>;

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: DashboardNavIcon;
  description?: string;
};

const _baseIconClass = "h-5 w-5 flex-none";

export const HomeIcon: DashboardNavIcon = ({ _className }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    _className={""}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m4 10 8-6 8 6" />
    <path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" />
    <path d="M9 21v-6h6v6" />
  </svg>
);

export const EpisodesIcon: DashboardNavIcon = ({ _className }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    _className={""}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 4v16" />
    <path d="M3 8h18" />
  </svg>
);

export const SettingsIcon: DashboardNavIcon = ({ _className }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    _className={""}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.26.5.74.86 1.3.91H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1" />
  </svg>
);

export const DASHBOARD_PRIMARY_NAV: DashboardNavItem[] = [
  {
    label: "Panel",
    href: "/dashboard",
    icon: HomeIcon,
    description: "Resúmenes y acciones rápidas",
  },
  {
    label: "Episodios",
    href: "/dashboard/episodes",
    icon: EpisodesIcon,
    description: "Transcripciones y fragmentos",
  },
  {
    label: "Configuración",
    href: "/dashboard/config",
    icon: SettingsIcon,
    description: "Palabras clave y ajustes",
  },
];

