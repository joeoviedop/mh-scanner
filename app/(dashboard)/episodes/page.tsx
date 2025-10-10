import { redirect } from "next/navigation";

export default function EpisodesRedirect() {
  redirect("/dashboard/episodes");
}
