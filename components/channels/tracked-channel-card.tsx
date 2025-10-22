"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type TrackedChannel = {
  _id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  originalUrl: string;
  scanFrequency: "daily" | "weekly" | "manual";
  scanEnabled: boolean;
  status: "active" | "paused" | "error" | "deleted";
  lastScanAt?: number | null;
  lastScanAtFormatted?: string | null;
  addedAt?: number | null;
  addedAtFormatted?: string | null;
  subscriberCount?: string | null;
  videoCount?: string | null;
  itemCount?: number | null;
  type: "channel" | "playlist";
  errorMessage?: string | null;
};

type Props = {
  channel: TrackedChannel;
};

const STATUS_CONFIG: Record<
  TrackedChannel["status"],
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  active: { label: "Activo", variant: "success" },
  paused: { label: "Pausado", variant: "neutral" },
  error: { label: "Error", variant: "danger" },
  deleted: { label: "Inactivo", variant: "outline" },
};

const FREQUENCY_LABELS: Record<TrackedChannel["scanFrequency"], string> = {
  daily: "Diario",
  weekly: "Semanal",
  manual: "Manual",
};

function formatRelativeTime(
  isoDate?: string | null,
  timestamp?: number | null,
  fallback: string = "Sin registro",
) {
  const date = isoDate ? new Date(isoDate) : timestamp ? new Date(timestamp) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return fallback;
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

function getInitials(title?: string | null) {
  if (!title) return "CH";
  const words = title.split(" ").filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

export function TrackedChannelCard({ channel }: Props) {
  const status = STATUS_CONFIG[channel.status];
  const lastScan = formatRelativeTime(channel.lastScanAtFormatted, channel.lastScanAt, "Sin escaneos");
  const addedAt = formatRelativeTime(channel.addedAtFormatted, channel.addedAt, "Sin registro");

  return (
    <Card className="">
      <CardContent className="">
        <div className="">
          <div className="">
            {channel.thumbnailUrl ? (
              <Image src={channel.thumbnailUrl} alt={channel.title} fill className="object-cover" sizes="64px" />
            ) : (
              <div className="">{getInitials(channel.title)}</div>
            )}
          </div>

          <div className="">
            <div className="">
              <div className="">
                <div>
                  <h3 className="">{channel.title}</h3>
                  <p className="">
                    {channel.type === "playlist" ? "Playlist" : "Canal de YouTube"}
                  </p>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>

              <div className="">
                <span className="">
                  {FREQUENCY_LABELS[channel.scanFrequency]}
                </span>
                <span>
                  Último escaneo: <span className="">{lastScan}</span>
                </span>
                <span>
                  Agregado: <span className="">{addedAt}</span>
                </span>
              </div>
            </div>

            {channel.errorMessage ? (
              <p className="">
                ⚠️ {channel.errorMessage}
              </p>
            ) : null}
          </div>
        </div>

        <div className="">
          {channel.subscriberCount ? (
            <div>
              <p className="">{channel.subscriberCount}</p>
              <p>Suscriptores</p>
            </div>
          ) : null}
          {channel.videoCount ? (
            <div>
              <p className="">{channel.videoCount}</p>
              <p>Videos</p>
            </div>
          ) : null}
          {channel.itemCount ? (
            <div>
              <p className="">{channel.itemCount}</p>
              <p>Elementos en playlist</p>
            </div>
          ) : null}
        </div>

        <div className="">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/dashboard/episodes?channelId=${channel._id}`}>Ver episodios</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className=""
          >
            <Link href={channel.originalUrl} target="_blank" rel="noopener noreferrer">
              Abrir en YouTube
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
