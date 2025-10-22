"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    title: "Escaneo enfocado",
    description:
      "Analiza canales y playlists para detectar menciones reales sobre terapia y salud mental.",
    icon: "🎯",
  },
  {
    title: "Contexto accionable",
    description:
      "Extrae momentos clave, tono y sensibilidad para que el equipo avance sin ver video completo.",
    icon: "🔍",
  },
  {
    title: "Exportación simple",
    description:
      "Descarga resultados a CSV o Google Sheets para compartir hallazgos y coordinar contenidos.",
    icon: "📊",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!passcode.trim()) {
      setError("Ingresa el passcode compartido con el equipo VoyBien.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch("/api/auth/verify-passcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passcode }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(payload.message ?? "Passcode incorrecto.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos validar el passcode.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="">
      <div className="" />
      <div className="" />

      <div className="">
        <div className="">
          <span className="">
            VoyBien · Internal Tool
          </span>
          <h1 className="">
            Accede al panel de{" "}
            <span className="">detección de menciones</span>
          </h1>
          <p className="">
            Usa el passcode interno para analizar canales de YouTube, detectar conversaciones sobre terapia y compartir hallazgos con tu equipo.
          </p>

          <div className="">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="">
                <span className="">{feature.icon}</span>
                <div>
                  <p className="">{feature.title}</p>
                  <p className="">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="">
          <form onSubmit={handleSubmit} className="">
            <div className="">
              <label htmlFor="passcode" className="">
                Passcode compartido
              </label>
              <div className="">
                <span className="">
                  🔒
                </span>
                <input
                  id="passcode"
                  type="password"
                  value={passcode}
                  onChange={(event) => setPasscode(event.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className=""
                />
              </div>
              <p className="">Solo el equipo de VoyBien tiene acceso a este panel interno.</p>
            </div>

            {error ? (
              <div className="">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              loadingLabel="Validando passcode…"
            >
              Ingresar al dashboard
            </Button>
          </form>

          <p className="">
            ¿Dudas? Escríbele a Operaciones VoyBien para recuperar el passcode.
          </p>
        </div>
      </div>
    </div>
  );
}
