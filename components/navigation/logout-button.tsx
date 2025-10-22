"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

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
    <div className="">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        isLoading={isLoading}
        loadingLabel="Cerrando sesión…"
        className=""
      >
        Cerrar sesión
      </Button>
      {error ? <p className="">{error}</p> : null}
    </div>
  );
}
