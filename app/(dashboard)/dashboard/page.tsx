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

  const PROCESS_STEPS = [
    {
      step: "1",
      title: "Escanear contenido",
      description: "Registra canales o playlists. El sistema descarga los metadatos de episodios y mantiene un historial en Convex.",
      icon: "🎯",
      color: "brand-blue"
    },
    {
      step: "2", 
      title: "Transcribir / Detectar",
      description: "Desde la vista de episodios puedes pedir transcripciones, ejecutar la detección de menciones y revisar fragmentos clasificados.",
      icon: "🔍",
      color: "brand-pink"
    },
    {
      step: "3",
      title: "Registrar feedback", 
      description: "Próximamente podrás marcar fragmentos útiles o irrelevantes para mejorar el ranking.",
      icon: "⚡",
      color: "accent-blue"
    },
    {
      step: "4",
      title: "Compartir y coordinar",
      description: "Exporta resultados y comparte hallazgos con Operaciones, Terapia y Contenido manteniendo el contexto clave.",
      icon: "🚀",
      color: "brand-light"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Dashboard de Análisis
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Analiza conversaciones sobre terapia y salud mental en YouTube. 
          Escanea canales, detecta menciones clave y comparte insights con tu equipo.
        </p>
      </div>

      {/* Main Scan Section */}
      <section className="card p-8 hover-lift">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-1 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">🔍</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Agregar fuente de YouTube</h2>
            <p className="text-gray-600 mt-1">
              Ingresa la URL de un canal, playlist o video para registrar la fuente y descargar sus episodios.
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">💡 Información importante:</span> El sistema prioriza episodios con subtítulos en español y los prepara para ser 
            transcritos y clasificados automáticamente.
          </p>
        </div>

        <ScanInputForm onSubmit={handleSubmit} isLoading={isSubmitting} className="bg-white rounded-xl p-6 border border-gray-200" />
        
        {status && (
          <div className={`mt-6 alert ${status.variant === "success" ? "alert-success" : "alert-error"}`}>
            <p className="font-medium">{status.message}</p>
          </div>
        )}
        
        <div className="mt-6 flex items-center gap-2">
          <p className="text-sm text-gray-600">
            Cuando el escaneo termine, visita la sección de{" "}
          </p>
          <Link 
            href="/dashboard/episodes" 
            className="btn text-sm text-brand-blue hover:text-brand-blue border-brand-blue hover:bg-brand-blue/10 px-3 py-1"
          >
            Episodios
          </Link>
          <p className="text-sm text-gray-600">
            para solicitar transcripciones y detectar menciones.
          </p>
        </div>
      </section>

      {/* Process Steps */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Flujo de Trabajo</h2>
          <p className="text-gray-600">
            Desde el escaneo inicial hasta la exportación de resultados
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map((item) => (
            <div 
              key={item.step} 
              className="card p-6 card-interactive hover:border-brand-light/30 group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <span className="text-white text-lg">{item.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Paso {item.step}</p>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Overview */}
      <section>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-light rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📊</span>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Estadísticas</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">0</h3>
            <p className="text-sm text-gray-600 mt-1">Canales escaneados</p>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-pink to-brand-light rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🎥</span>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contenido</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">0</h3>
            <p className="text-sm text-gray-600 mt-1">Episodios procesados</p>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-success-500 to-brand-light rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">💡</span>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Insights</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">0</h3>
            <p className="text-sm text-gray-600 mt-1">Menciones detectadas</p>
          </div>
        </div>
      </section>
    </div>
  );
}
