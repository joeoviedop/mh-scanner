import { Metadata } from "next";
import EpisodeDetailPageClient from "./EpisodeDetailPageClient";

interface Props {
  params: Promise<{ episodeId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { episodeId } = await params;
  
  return {
    title: `Episode ${episodeId} - Transcript & Analysis`,
    description: "View episode transcript and manage mention detection",
  };
}

export default async function EpisodeDetailPage({ params }: Props) {
  const { episodeId } = await params;

  return <EpisodeDetailPageClient episodeId={episodeId} />;
}
