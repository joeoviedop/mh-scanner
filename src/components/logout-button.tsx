"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("No pudimos cerrar sesión. Intenta de nuevo.");
      }

      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className="btn-ghost text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 micro-bounce group flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="spinner w-3 h-3 border-gray-600 border-t-transparent"></div>
            Cerrando sesión...
          </>
        ) : (
          <>
            <svg 
              className="w-4 h-4 transition-transform group-hover:-translate-x-1" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Cerrar sesión
          </>
        )}
      </button>
      {error ? <p className="text-xs text-error-600 mt-1">{error}</p> : null}
    </div>
  );
}
