"use client";

import React, { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Tone = "positivo" | "neutro" | "critico" | "preocupante";
type Theme = "testimonio" | "recomendacion" | "reflexion" | "dato" | "otro";
type Sensitivity =
  | "autolesion"
  | "suicidio"
  | "abuso"
  | "trauma"
  | "crisis"
  | "ninguna";

interface FragmentFeedbackSummary {
  total: number;
  positive: number;
  negative: number;
  approvalRate: number | null;
}

interface Fragment {
  _id: string;
  videoId: string;
  text: string;
  context: string;
  startTime: number;
  endTime: number;
  detectedAt: number;
  detectedAtIso?: string;
  confidenceScore: number;
  rankScore: number;
  feedbackSummary: FragmentFeedbackSummary;
  classification: {
    tema: Theme;
    tono: Tone;
    sensibilidad: Sensitivity[];
    confianza: number;
    razon?: string;
  };
}

interface FeedbackStats {
  totalFragments: number;
  fragmentsWithFeedback: number;
  feedbackCount: number;
  positiveFeedback: number;
  negativeFeedback: number;
  approvalRate: number | null;
  coverageRate: number;
  averageConfidence: number;
  averageRankScore: number;
  topIssues: { issue: string; count: number }[];
  promptRecommendations: string[];
}

type SortOption = "rank" | "time" | "confidence" | "theme" | "feedback";

interface MentionResultsProps {
  fragments: Fragment[];
  episodeTitle?: string;
  channelName?: string;
  onRefresh?: () => void | Promise<void>;
  onFeedback?: (
    fragmentId: string,
    rating: "useful" | "not_useful",
    options?: { issues?: string[]; comment?: string },
  ) => Promise<void> | void;
  feedbackSubmitting?: Record<string, boolean>;
  feedbackStats?: FeedbackStats | null;
}

const THEME_DETAILS: Record<
  Theme,
  { label: string; className: string; description: string }
> = {
  testimonio: {
    label: "Testimonio",
    className: "bg-brand-100/80 text-brand-700",
    description: "Experiencias personales relacionadas con terapia o salud mental",
  },
  recomendacion: {
    label: "Recomendación",
    className: "bg-success-100 text-success-600",
    description: "Consejos o sugerencias de tratamiento y recursos",
  },
  reflexion: {
    label: "Reflexión",
    className: "bg-warning-100 text-warning-700",
    description: "Análisis, ideas y aprendizajes del anfitrión/invitado",
  },
  dato: {
    label: "Dato",
    className: "bg-skywave-100 text-skywave-700",
    description: "Información factual o educativa sobre salud mental",
  },
  otro: {
    label: "Otro",
    className: "bg-lavender-100 text-sand-700",
    description: "Contenido relacionado difícil de clasificar en otra categoría",
  },
};

const TONE_DETAILS: Record<Tone, { icon: string; label: string; className: string }> = {
  positivo: { icon: "😊", label: "Positivo", className: "text-success-600" },
  neutro: { icon: "😐", label: "Neutro", className: "text-sand-500" },
  critico: { icon: "⚠️", label: "Crítico", className: "text-warning-600" },
  preocupante: { icon: "🚨", label: "Preocupante", className: "text-danger-600" },
};

const SENSITIVITY_STYLES: Record<Sensitivity, string> = {
  autolesion: "bg-danger-50/80 text-danger-600",
  suicidio: "bg-danger-100 text-danger-700",
  abuso: "bg-danger-50 text-danger-600",
  trauma: "bg-warning-100 text-warning-700",
  crisis: "bg-warning-50 text-warning-700",
  ninguna: "bg-success-100 text-success-600",
};

const ISSUE_OPTIONS = [
  { value: "false_positive", label: "Falso positivo (no menciona terapia)" },
  { value: "wrong_category", label: "Tema incorrecto" },
  { value: "poor_context", label: "Falta contexto" },
  { value: "incomplete_text", label: "Texto incompleto" },
  { value: "timing_off", label: "Timestamps incorrectos" },
  { value: "other", label: "Otro" },
] as const;

const ISSUE_LABELS = ISSUE_OPTIONS.reduce<Record<string, string>>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const SORT_LABELS: Record<SortOption, string> = {
  rank: "⭐ Re-rank (feedback)",
  time: "⏰ Tiempo",
  confidence: "🎯 Confianza",
  theme: "🏷️ Tema",
  feedback: "💬 Feedback positivo",
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatPercentage(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return `${Math.round(value * 100)}%`;
}

function getYouTubeUrl(videoId: string, startTime: number) {
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.max(0, Math.floor(startTime))}s`;
}

function buildFallbackStats(fragments: Fragment[]): FeedbackStats | null {
  if (fragments.length === 0) {
    return null;
  }

  let fragmentsWithFeedback = 0;
  let feedbackCount = 0;
  let positiveFeedback = 0;
  let negativeFeedback = 0;
  let rankAccumulator = 0;
  let confidenceAccumulator = 0;

  for (const fragment of fragments) {
    confidenceAccumulator += fragment.confidenceScore;
    if (fragment.feedbackSummary.total > 0) {
      fragmentsWithFeedback += 1;
      feedbackCount += fragment.feedbackSummary.total;
      positiveFeedback += fragment.feedbackSummary.positive;
      negativeFeedback += fragment.feedbackSummary.negative;
      rankAccumulator += fragment.rankScore;
    }
  }

  const approvalRate =
    feedbackCount > 0 ? Number((positiveFeedback / feedbackCount).toFixed(3)) : null;
  const coverageRate = Number((fragmentsWithFeedback / fragments.length).toFixed(3));
  const averageConfidence = Number(
    (confidenceAccumulator / fragments.length || 0).toFixed(2),
  );
  const averageRankScore =
    fragmentsWithFeedback > 0
      ? Number((rankAccumulator / fragmentsWithFeedback).toFixed(3))
      : 0;

  return {
    totalFragments: fragments.length,
    fragmentsWithFeedback,
    feedbackCount,
    positiveFeedback,
    negativeFeedback,
    approvalRate,
    coverageRate,
    averageConfidence,
    averageRankScore,
    topIssues: [],
    promptRecommendations: [],
  };
}

export default function MentionResults({
  fragments,
  episodeTitle,
  channelName,
  onRefresh,
  onFeedback,
  feedbackSubmitting,
  feedbackStats,
}: MentionResultsProps) {
  const [sortBy, setSortBy] = useState<SortOption>("rank");
  const [filterTheme, setFilterTheme] = useState<string>("all");
  const [filterSensitivity, setFilterSensitivity] = useState<string>("all");
  const [issueSelections, setIssueSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    setIssueSelections((prev) => {
      const next = { ...prev };
      for (const fragment of fragments) {
        if (!next[fragment._id]) {
          next[fragment._id] = ISSUE_OPTIONS[0].value;
        }
      }
      return next;
    });
  }, [fragments]);

  const availableThemes = useMemo(
    () =>
      Array.from(new Set(fragments.map((fragment) => fragment.classification.tema))),
    [fragments],
  );

  const availableSensitivities = useMemo(
    () =>
      Array.from(
        new Set(
          fragments.flatMap((fragment) => fragment.classification.sensibilidad),
        ),
      ),
    [fragments],
  );

  const sortedFragments = useMemo(() => {
    const copy = [...fragments];

    copy.sort((a, b) => {
      switch (sortBy) {
        case "rank":
          return b.rankScore - a.rankScore;
        case "time":
          return a.startTime - b.startTime;
        case "confidence":
          return b.confidenceScore - a.confidenceScore;
        case "theme":
          return a.classification.tema.localeCompare(b.classification.tema);
        case "feedback": {
          const ratioA = a.feedbackSummary.approvalRate ?? 0;
          const ratioB = b.feedbackSummary.approvalRate ?? 0;
          if (ratioB !== ratioA) {
            return ratioB - ratioA;
          }
          return b.feedbackSummary.positive - a.feedbackSummary.positive;
        }
        default:
          return 0;
      }
    });

    return copy;
  }, [fragments, sortBy]);

  const filteredFragments = useMemo(() => {
    return sortedFragments.filter((fragment) => {
      if (filterTheme !== "all" && fragment.classification.tema !== filterTheme) {
        return false;
      }

      if (filterSensitivity === "none") {
        return fragment.classification.sensibilidad.includes("ninguna");
      }

      if (filterSensitivity !== "all") {
        return fragment.classification.sensibilidad.includes(
          filterSensitivity as Sensitivity,
        );
      }

      return true;
    });
  }, [sortedFragments, filterTheme, filterSensitivity]);

  const summary = useMemo(() => {
    if (feedbackStats) {
      return feedbackStats;
    }
    return buildFallbackStats(fragments);
  }, [feedbackStats, fragments]);

  const totalDurationSeconds = useMemo(() => {
    return filteredFragments.reduce((acc, fragment) => {
      const duration = fragment.endTime - fragment.startTime;
      return acc + (Number.isFinite(duration) ? duration : 0);
    }, 0);
  }, [filteredFragments]);

  const handleUseful = async (fragmentId: string) => {
    if (!onFeedback) return;
    await onFeedback(fragmentId, "useful");
  };

  const handleNotUseful = async (fragmentId: string) => {
    if (!onFeedback) return;
    const issue = issueSelections[fragmentId] ?? ISSUE_OPTIONS[0].value;
    await onFeedback(fragmentId, "not_useful", { issues: [issue] });
  };

  if (fragments.length === 0) {
    return (
      <div className="">
        <div className="">🔍</div>
        <h3 className="">
          No se detectaron menciones terapéuticas
        </h3>
        <p className="">
          El análisis de IA no encontró fragmentos relevantes en este episodio. Puedes reintentar la
          detección si crees que hubo un error.
        </p>
        {onRefresh ? (
          <Button variant="outline" onClick={() => onRefresh()} className="">
            🔄 Re-analizar episodio
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="">
      <section className="">
        <div className="">
          <div className="">
            <h2 className="">
              🎯 Análisis de menciones terapéuticas
            </h2>
            <div className="">
              {episodeTitle ? (
                <div>
                  <strong>Episodio:</strong> {episodeTitle}
                </div>
              ) : null}
              {channelName ? (
                <div>
                  <strong>Canal:</strong> {channelName}
                </div>
              ) : null}
              <div>
                Total re-rankeado: {filteredFragments.length} fragment
                {filteredFragments.length === 1 ? "o" : "os"} ·{" "}
                ~{Math.round(totalDurationSeconds)} segundos de contenido relevante
              </div>
            </div>
          </div>

          {summary ? (
            <div className="">
              <div className="">
                <p className="">
                  Cobertura
                </p>
                <p className="">
                  {formatPercentage(summary.coverageRate)}
                </p>
                <p className="">
                  Fragmentos con feedback
                </p>
              </div>
              <div className="">
                <p className="">
                  Aciertos
                </p>
                <p className="">
                  {summary.approvalRate !== null
                    ? formatPercentage(summary.approvalRate)
                    : "—"}
                </p>
                <p className="">
                  {summary.positiveFeedback} útiles · {summary.negativeFeedback} no útiles
                </p>
              </div>
              <div className="">
                <p className="">
                  Ranking promedio
                </p>
                <p className="">
                  {summary.averageRankScore.toFixed(1)}
                </p>
                <p className="">
                  Confianza media {summary.averageConfidence.toFixed(1)}%
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {summary?.promptRecommendations && summary.promptRecommendations.length > 0 ? (
        <section className="">
          <h3 className="">
            🧠 Hallazgos para mejorar el prompt
          </h3>
          <ul className="">
            {summary.promptRecommendations.map((recommendation, index) => (
              <li key={`${recommendation}-${index}`}>{recommendation}</li>
            ))}
          </ul>

          {summary.topIssues.length > 0 ? (
            <div className="">
              {summary.topIssues.map((issue) => (
                <Badge key={issue.issue} variant="warning" className="">
                  {ISSUE_LABELS[issue.issue] ?? issue.issue} · {issue.count}
                </Badge>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="">
        <div className="">
          <div className="">
            <div>
              <label className="">
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className=""
              >
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="">
                Tema
              </label>
              <select
                value={filterTheme}
                onChange={(event) => setFilterTheme(event.target.value)}
                className=""
              >
                <option value="all">Todos los temas</option>
                {availableThemes.map((theme) => (
                  <option key={theme} value={theme}>
                    {THEME_DETAILS[theme].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="">
                Sensibilidad
              </label>
              <select
                value={filterSensitivity}
                onChange={(event) => setFilterSensitivity(event.target.value)}
                className=""
              >
                <option value="all">Todos los niveles</option>
                <option value="none">Sin bandera de sensibilidad</option>
                {availableSensitivities
                  .filter((option) => option !== "ninguna")
                  .map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {onRefresh ? (
            <Button variant="outline" onClick={() => onRefresh()} className="">
              🔄 Actualizar resultados
            </Button>
          ) : null}
        </div>
      </section>

      <div className="">
        {filteredFragments.map((fragment, index) => {
          const themeDetails = THEME_DETAILS[fragment.classification.tema];
          const toneDetails = TONE_DETAILS[fragment.classification.tono];
          const approvalRate = fragment.feedbackSummary.approvalRate;
          const totalFeedback = fragment.feedbackSummary.total;
          const positiveFeedback = fragment.feedbackSummary.positive;
          const negativeFeedback = fragment.feedbackSummary.negative;
          const isSubmitting = feedbackSubmitting
            ? Boolean(feedbackSubmitting[fragment._id])
            : false;
          const selectedIssue =
            issueSelections[fragment._id] ?? ISSUE_OPTIONS[0].value;

          return (
            <article
              key={fragment._id}
              className=""
            >
              <header className="">
                <div className="">
                  <div className="">
                    <span>#{index + 1}</span>
                    <span>•</span>
                    <span>{formatTime(fragment.startTime)}</span>
                    <span>•</span>
                    <span>{Math.max(fragment.endTime - fragment.startTime, 0)}s</span>
                  </div>

                  <div className="">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${themeDetails.className}`}
                    >
                      {themeDetails.label}
                    </span>
                    <span className={`text-sm font-medium ${toneDetails.className}`}>
                      {toneDetails.icon} {toneDetails.label}
                    </span>
                    <span className="">
                      Conf. IA: {Math.round(fragment.confidenceScore)}%
                    </span>
                    <span className="">
                      Rank: {fragment.rankScore.toFixed(1)}
                    </span>
                  </div>

                  <p className="">{themeDetails.description}</p>
                </div>

                <div className="">
                  <Button asChild variant="secondary" size="sm">
                    <a href={getYouTubeUrl(fragment.videoId, fragment.startTime)} target="_blank" rel="noopener noreferrer">
                      ▶️ Ver en YouTube
                    </a>
                  </Button>
                  {onFeedback ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseful(fragment._id)}
                      disabled={isSubmitting}
                      isLoading={isSubmitting}
                      loadingLabel="Registrando…"
                    >
                      ✅ Útil
                    </Button>
                  ) : null}
                  {onFeedback ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNotUseful(fragment._id)}
                      disabled={isSubmitting}
                      isLoading={isSubmitting}
                      loadingLabel="Registrando…"
                    >
                      ⚠️ No útil
                    </Button>
                  ) : null}
                </div>
              </header>

              <section className="">
                <div>
                  <h4 className="">
                    Fragmento detectado
                  </h4>
                  <div className="">
                    {fragment.text}
                  </div>
                </div>

                {fragment.context && fragment.context !== fragment.text ? (
                  <div>
                    <h4 className="">
                      Contexto ampliado
                    </h4>
                    <div className="">
                      {fragment.context}
                    </div>
                  </div>
                ) : null}

                <div className="">
                  <div className="">
                    <p className="">
                      Sensibilidad
                    </p>
                    <div className="">
                      {fragment.classification.sensibilidad.map((sensitivity) => (
                        <span
                          key={sensitivity}
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            SENSITIVITY_STYLES[sensitivity as Sensitivity] ??
                            "bg-lavender-100 text-sand-700"
                          }`}
                        >
                          {sensitivity}
                        </span>
                      ))}
                    </div>
                  </div>
                  {fragment.classification.razon ? (
                    <div className="">
                      <p className="">
                        Análisis IA
                      </p>
                      <div className="">
                        “{fragment.classification.razon}”
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              <footer className="">
                <div className="">
                  <span>
                    Detectado:{" "}
                    {fragment.detectedAtIso
                      ? new Date(fragment.detectedAtIso).toLocaleString()
                      : new Date(fragment.detectedAt).toLocaleString()}
                  </span>
                  <span>ID: {fragment._id.slice(-8)}</span>
                  <span>
                    Feedback:{" "}
                    {totalFeedback > 0
                      ? `${positiveFeedback} útil · ${negativeFeedback} no útil (${formatPercentage(
                          approvalRate,
                        )})`
                      : "Aún sin feedback"}
                  </span>
                </div>

                {onFeedback ? (
                  <div className="">
                    <label className="">
                      Motivo si no es útil
                    </label>
                    <select
                      value={selectedIssue}
                      onChange={(event) =>
                        setIssueSelections((prev) => ({
                          ...prev,
                          [fragment._id]: event.target.value,
                        }))
                      }
                      className=""
                    >
                      {ISSUE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {totalFeedback === 0 ? (
                      <Badge variant="outline" className="">
                        Necesita evaluación humana
                      </Badge>
                    ) : null}
                  </div>
                ) : null}
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}
