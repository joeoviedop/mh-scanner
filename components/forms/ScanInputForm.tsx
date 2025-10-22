"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  isValidYouTubeUrl,
  normalizeYouTubeUrl,
  parseYouTubeUrl,
} from "@/lib/integrations/youtube/youtube-parser";

const ScanFormSchema = z.object({
  youtubeUrl: z
    .string()
    .min(1, "YouTube URL is required")
    .refine((url) => isValidYouTubeUrl(url), {
      message: "Please enter a valid YouTube channel, playlist, or video URL",
    }),
  scanFrequency: z.enum(["daily", "weekly", "manual"], {
    message: "Please select a scan frequency",
  }),
});

type ScanFormData = z.infer<typeof ScanFormSchema>;

interface ScanInputFormProps {
  onSubmit: (data: {
    url: string;
    type: "channel" | "playlist" | "video";
    scanFrequency: "daily" | "weekly" | "manual";
  }) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const SCAN_FREQUENCY_OPTIONS: Array<{
  value: ScanFormData["scanFrequency"];
  title: string;
  description: string;
  icon: string;
  recommended?: boolean;
}> = [
  {
    value: "daily",
    title: "Diario",
    description: "Verifica nuevos episodios todos los días",
    icon: "📅",
  },
  {
    value: "weekly",
    title: "Semanal",
    description: "Verifica nuevos episodios semanalmente (recomendado)",
    icon: "📊",
    recommended: true,
  },
  {
    value: "manual",
    title: "Manual",
    description: "Solo escanea cuando se active manualmente",
    icon: "👆",
  },
];

export function ScanInputForm({
  onSubmit,
  isLoading = false,
  _className = "",
}: ScanInputFormProps) {
  const [urlPreview, setUrlPreview] = useState<string | null>(null);
  const [urlType, setUrlType] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset,
    setValue,
  } = useForm<ScanFormData>({
    resolver: zodResolver(ScanFormSchema),
    mode: "onChange",
    defaultValues: {
      scanFrequency: "weekly",
    },
  });

  const watchedUrl = watch("youtubeUrl");
  const watchedScanFrequency = watch("scanFrequency");

  React.useEffect(() => {
    if (watchedUrl && isValidYouTubeUrl(watchedUrl)) {
      const parsed = parseYouTubeUrl(watchedUrl);
      if (parsed) {
        setUrlPreview(normalizeYouTubeUrl(watchedUrl));
        setUrlType(parsed.type);
      }
    } else {
      setUrlPreview(null);
      setUrlType(null);
    }
  }, [watchedUrl]);

  const onFormSubmit = async (data: ScanFormData) => {
    const parsed = parseYouTubeUrl(data.youtubeUrl);
    if (!parsed) {
      return;
    }

    await onSubmit({
      url: data.youtubeUrl,
      type: parsed.type,
      scanFrequency: data.scanFrequency,
    });

    reset();
    setUrlPreview(null);
    setUrlType(null);
  };

  return (
    <div _className={""}>
      <form onSubmit={handleSubmit(onFormSubmit)} _className="">
        <div _className="">
          <label htmlFor="youtubeUrl" _className="">
            URL de YouTube
          </label>
          <div _className="">
            <div _className="">
              🎥
            </div>
            <input
              {...register("youtubeUrl")}
              type="url"
              id="youtubeUrl"
              placeholder="https://www.youtube.com/@username"
              _className={""}
              disabled={isLoading}
            />
          </div>
          {errors.youtubeUrl ? (
            <p _className="">{errors.youtubeUrl.message}</p>
          ) : null}

          {urlPreview ? (
            <div _className="">
              <div _className="">
                <Badge
                  variant={urlType === "channel" ? "success" : urlType === "playlist" ? "default" : "warning"}
                  _className=""
                >
                  {urlType === "channel" && "Canal"}
                  {urlType === "playlist" && "Playlist"}
                  {urlType === "video" && "Video"}
                </Badge>
                <span _className="">
                  {urlType === "channel" && "Canal detectado"}
                  {urlType === "playlist" && "Playlist detectada"}
                  {urlType === "video" && "Video detectado"}
                </span>
              </div>
              <p _className="">{urlPreview}</p>
            </div>
          ) : null}
        </div>

        <div _className="">
          <span _className="">Frecuencia de escaneo</span>
          <div _className="">
            {SCAN_FREQUENCY_OPTIONS.map((option) => {
              const _isSelected = watchedScanFrequency === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setValue("scanFrequency", option.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  _className={""}
                  disabled={isLoading}
                >
                  <div _className="">
                    <span _className="">{option.icon}</span>
                    <div _className="">
                      <div _className="">
                        <span _className="">{option.title}</span>
                        {option.recommended ? (
                          <Badge variant="success">Recomendado</Badge>
                        ) : null}
                      </div>
                      <p _className="">{option.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.scanFrequency ? (
            <p _className="">{errors.scanFrequency.message}</p>
          ) : null}
        </div>

        <div _className="">
          <Button
            type="submit"
            size="lg"
            isLoading={isLoading}
            disabled={!isValid || isLoading}
            _className="w-full sm:w-auto"
          >
            {isLoading ? "Agregando fuente…" : "Agregar fuente"}
          </Button>
        </div>
      </form>

      <div _className="">
        <h3 _className="">
          <span>💡</span>
          <span>Ejemplos de URLs</span>
        </h3>
        <div _className="">
          {[
            { label: "Canal", icon: "📺", example: "youtube.com/@username" },
            { label: "Playlist", icon: "📂", example: "youtube.com/playlist?list=…" },
            { label: "Video", icon: "🎥", example: "youtube.com/watch?v=…" },
          ].map((item) => (
            <div key={item.label} _className="">
              <span _className="">{item.icon}</span>
              <div>
                <p _className="">{item.label}</p>
                <p _className="">{item.example}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ScanInputForm;
