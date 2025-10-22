"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { TrackedChannelCard, type TrackedChannel } from "@/components/channels/tracked-channel-card";
import { ScanInputForm } from "@/components/forms/ScanInputForm";

type ScanStatus =
  | {
      variant: "success" | "error" | "warning";
      message: string;
    }
  | null;

type RefreshResult =
  | { success: true }
  | { success: false; message: string };

const WORKFLOW_STEPS = [
  {
    title: "1. Escanea fuentes",
    body: "Registra canales, playlists o episodios individuales para mantener todo el catálogo monitoreado.",
  },
  {
    title: "2. Transcribe y detecta",
    body: "Solicita transcripciones y ejecuta la detección semántica para encontrar menciones relevantes.",
  },
  {
    title: "3. Prioriza hallazgos",
    body: "Revisa fragmentos, marca sensibilidad y comparte insight accionable con el equipo.",
  },
  {
    title: "4. Coordina acciones",
    body: "Sincroniza con Operaciones, Terapia y Contenido con resúmenes listos para compartir.",
  },
] as const;

const HERO_HIGHLIGHTS = [
  { emoji: "⚡", label: "Detección automática de episodios" },
  { emoji: "🔐", label: "Datos internos VoyBien" },
  { emoji: "🧠", label: "Resumen asistido por IA" },
] as const;

type DashboardStat = {
  label: string;
  value: string;
  hint: string;
  icon: string;
  variant?: "success" | "danger";
};

type DashboardPageClientProps = {
  initialChannels: TrackedChannel[];
};

export default function DashboardPageClient({ initialChannels }: DashboardPageClientProps) {
  const [channels, setChannels] = useState<TrackedChannel[]>(initialChannels);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<ScanStatus>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setChannels(initialChannels);
  }, [initialChannels]);

  const refreshChannels = useCallback(async (): Promise<RefreshResult> => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/channels", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "No fue posible recargar los canales");
      }

      setChannels(data.channels);
      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No fue posible recargar los canales";
      return { success: false, message };
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleSubmit = useCallback(
    async ({
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
          throw new Error(data?.error ?? "No fue posible iniciar el escaneo");
        }

        const summary = data.summary ?? {};
        const processed = summary.episodesProcessed ?? 0;
        const skipped = summary.skippedEpisodes ?? 0;

        const refreshOutcome = await refreshChannels();

        const baseMessage = [
          "Escaneo iniciado correctamente.",
          `Episodios procesados: ${processed}.`,
          skipped > 0 ? `Omitidos por duración: ${skipped}.` : null,
        ]
          .filter(Boolean)
          .join(" ");

        if (refreshOutcome.success) {
          setStatus({
            variant: "success",
            message: `${baseMessage} Revisa el progreso en Episodios.`,
          });
        } else {
          setStatus({
            variant: "warning",
            message: `${baseMessage} Sin embargo, no pudimos actualizar el listado: ${refreshOutcome.message}`,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No fue posible iniciar el escaneo";
        setStatus({ variant: "error", message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshChannels],
  );

  const handleRefresh = useCallback(async () => {
    const outcome = await refreshChannels();
    if (!outcome.success) {
      setStatus({ variant: "error", message: outcome.message });
    } else {
      setStatus({
        variant: "success",
        message: "Listado de canales actualizado.",
      });
    }
  }, [refreshChannels]);

  const stats = useMemo<DashboardStat[]>(() => {
    const total = channels.length;
    const active = channels.filter((channel) => channel.status === "active").length;
    const withErrors = channels.filter((channel) => channel.status === "error").length;
    const automated = channels.filter(
      (channel) => channel.scanEnabled && channel.scanFrequency !== "manual",
    ).length;

    return [
      {
        label: "Fuentes activas",
        value: total.toString(),
        hint:
          active === total
            ? "Todas en curso"
            : `${active} activas / ${total - active} pendientes`,
        icon: "📡",
      },
      {
        label: "Escaneos automáticos",
        value: automated.toString(),
        hint: automated > 0 ? "Programados cada semana" : "Configura una frecuencia",
        icon: "🗓️",
      },
      {
        label: "Atención requerida",
        value: withErrors.toString(),
        hint: withErrors > 0 ? "Revisa errores recientes" : "Sin incidencias",
        icon: withErrors > 0 ? "🚨" : "✅",
        variant: withErrors > 0 ? "danger" : "success",
      },
    ];
  }, [channels]);

  return (
    <div className="">
      <section
        id="add-source"
        className=""
      >
        <div className="">
          <div className="">
            <span className="">
              VoyBien · Insights
            </span>
            <div className="">
              <h1 className="">
                Centraliza la escucha de canales clave de terapia
              </h1>
              <p className="">
                Inserta un canal, playlist o video y deja que el escáner ejecute transcripciones, menciones sensibles y resúmenes accionables en minutos.
              </p>
            </div>
            <div className="">
              {HERO_HIGHLIGHTS.map((item) => (
                <span
                  key={item.label}
                  className=""
                >
                  <span>{item.emoji}</span>
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <ScanInputForm onSubmit={handleSubmit} isLoading={isSubmitting} className="" />
        </div>

        <aside className="">
          <Card className="">
            <CardContent className="">
              <Badge variant="default" className="">
                Equipo VoyBien
              </Badge>
              <h2 className="">
                Visibilidad compartida para Operaciones, Terapia y Contenido
              </h2>
              <p className="">
                Cada escaneo mantiene el contexto centralizado: metadatos, transcriptos y fragmentos listos para revisión sin reproducir horas de video.
              </p>
              <div className="">
                <div className="">
                  <span className="">📈</span>
                  <div>
                    <p className="">Alertas automáticas</p>
                    <p className="">Recibe avisos cuando detectemos nuevas menciones sensibles.</p>
                  </div>
                </div>
                <div className="">
                  <span className="">🗂️</span>
                  <div>
                    <p className="">Contexto organizado</p>
                    <p className="">Fragmentos rankeados, sensibilidad y resumen listos para compartir.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="">
            <CardContent className="">
              <div className="">
                <div>
                  <h3 className="">
                    Estado del monitoreo
                  </h3>
                  <p className="">
                    Datos actualizados desde Convex
                  </p>
                </div>
                <Badge variant="outline" className="">
                  En vivo
                </Badge>
              </div>
              <div className="">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className=""
                  >
                    <div className="">
                      <span>{stat.label}</span>
                      <span>{stat.icon}</span>
                    </div>
                    <p
                      className={""}
                    >
                      {stat.value}
                    </p>
                    <p className="">{stat.hint}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>

      {status ? (
        <div
          className={""}
        >
          {status.message}
        </div>
      ) : null}

      <section className="">
        <div className="">
          <div className="">
            <h2 className="">Fuentes rastreadas</h2>
            <p className="">
              Mantén visibles los canales que monitoreamos y su frecuencia de escaneo.
            </p>
          </div>
          <div className="">
            <Badge variant="outline" className="">
              {channels.length} fuentes
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
            >
              Refrescar listado
            </Button>
          </div>
        </div>

        {channels.length === 0 && !isRefreshing ? (
          <div className="">
            Aún no hay canales registrados. Agrega tu primera fuente para comenzar a monitorear episodios.
          </div>
        ) : null}

        {isRefreshing ? (
          <div className="">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`channel-skeleton-${index}`}
                className=""
              >
                <div className="">
                  <div className="">
                    <div className="" />
                    <div className="">
                      <div className="" />
                      <div className="" />
                      <div className="" />
                    </div>
                  </div>
                  <div className="" />
                  <div className="" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {channels.length > 0 && !isRefreshing ? (
          <div className="">
            {channels.map((channel) => (
              <TrackedChannelCard key={channel._id} channel={channel} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="">
        <div className="">
          <div>
            <h2 className="">Workflow sugerido</h2>
            <p className="">
              De la ingesta de fuentes a los hallazgos compartidos en cuatro pasos.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="">
            <Link href="/dashboard/episodes">Ir a Episodios</Link>
          </Button>
        </div>
        <div className="">
          {WORKFLOW_STEPS.map((step) => (
            <div
              key={step.title}
              className=""
            >
              <h3 className="">{step.title}</h3>
              <p className="">{step.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
