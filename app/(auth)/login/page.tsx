"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const FEATURES = [
  {
    title: "Escaneo enfocado",
    description:
      "Analiza canales y playlists para detectar menciones reales sobre terapia y salud mental.",
  },
  {
    title: "Contexto accionable",
    description:
      "Extrae momentos clave, tono y sensibilidad para que el equipo avance sin ver video completo.",
  },
  {
    title: "Exportación simple",
    description:
      "Descarga resultados a CSV o Google Sheets para compartir hallazgos y coordinar contenidos.",
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
        <header className="mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
            VoyBien · Internal Tool
          </p>
          <h1 className="text-3xl font-semibold">Podcast Therapy Scanner</h1>
          <p className="text-sm text-slate-200">
            Accede con el passcode interno para analizar conversaciones sobre terapia, priorizar
            contenidos y coordinar respuestas con el equipo.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-100">Passcode compartido</span>
            <input
              type="password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/60"
            />
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Validando passcode..." : "Ingresar al dashboard"}
          </button>
        </form>

        <section className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-sm font-semibold tracking-wide text-emerald-200">
            Lo que podrás hacer adentro
          </h2>
          <ul className="space-y-3 text-sm text-slate-100/90">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="rounded-xl border border-white/5 bg-black/10 p-3">
                <p className="font-medium text-white">{feature.title}</p>
                <p>{feature.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          ¿Dudas? Escríbele a Operaciones VoyBien para recuperar el passcode.
        </p>
      </div>
    </div>
  );
}