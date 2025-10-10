import { Metadata } from "next";
import KeywordConfigPageClient from "./KeywordConfigPageClient";

export const metadata: Metadata = {
  title: "Configuration - Therapy Keywords",
  description: "Manage therapy keywords and semantic detection settings",
};

export default function ConfigPage() {
  return <KeywordConfigPageClient />;
}
