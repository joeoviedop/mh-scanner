"use client";

import Link from "next/link";
import { useState } from "react";

import { ScanInputForm } from "@/src/components/forms/ScanInputForm";

type ScanStatus = {
  variant: "success" | "error";
  message: string;
} | null;

export default function DashboardPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<ScanStatus>(null);

  const handleSubmit = async ({
    url,
    type,
    scanFrequency,
  }: {
    url: string;
    type: "channel" | "playlist" | "video";
    scanFrequency: "daily" | "weekly" | "manual";
  }) => {
    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/youtube/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ youtubeUrl: url, scanFrequency, sourceType: type }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const message = data?.error ?? "No fue posible iniciar el escaneo";
        throw new Error(message);
      }

      const summary = data.summary;
      const processed = summary?.episodesProcessed ?? 0;
      const skipped = summary?.skippedEpisodes ?? 0;
      const messageSuffix = skipped > 0
        ? ` Episodios omitidos por ser cortos: ${skipped}.`
        : "";
      setStatus({
        variant: "success",
        message: `Escaneo iniciado correctamente. Episodios procesados: ${processed}.${messageSuffix} Revisa el progreso en la sección de episodios.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible iniciar el escaneo";
      setStatus({ variant: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Agregar fuente de YouTube</h2>
        <p className="mt-2 text-sm text-slate-600">
          Ingresa la URL de un canal, playlist o video para registrar la fuente y descargar sus episodios.
          El sistema prioriza episodios con subtítulos en español y los prepara para ser transcritos y
          clasificados.
        </p>
        <ScanInputForm onSubmit={handleSubmit} isLoading={isSubmitting} className="mt-6" />
        {status && (
          <div
            className={`mt-4 rounded-md border px-4 py-3 text-sm ${
              status.variant === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {status.message}
          </div>
        )}
        <p className="mt-6 text-sm text-slate-600">
          Cuando el escaneo termine, visita la sección de {" "}
          <Link href="/dashboard/episodes" className="text-blue-600 hover:text-blue-800">
            episodios
          </Link>{" "}
          para solicitar transcripciones y detectar menciones.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">1. Escanear contenido</h3>
          <p className="mt-1 text-sm text-slate-600">
            Registra canales o playlists. El sistema descarga los metadatos de episodios y mantiene un
            historial en Convex.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">2. Transcribir / Detectar</h3>
          <p className="mt-1 text-sm text-slate-600">
            Desde la vista de episodios puedes pedir transcripciones, ejecutar la detección de menciones
            y revisar fragmentos clasificados.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">3. Registrar feedback</h3>
          <p className="mt-1 text-sm text-slate-600">
            Próximamente podrás marcar fragmentos útiles o irrelevantes para mejorar el ranking.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">4. Compartir y coordinar</h3>
          <p className="mt-1 text-sm text-slate-600">
            Exporta resultados y comparte hallazgos con Operaciones, Terapia y Contenido manteniendo el
            contexto clave.
          </p>
        </article>
      </section>
    </div>
  );
}
