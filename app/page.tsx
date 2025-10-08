import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME, isSessionTokenValid } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const authenticated = await isSessionTokenValid(sessionToken);

  if (authenticated) {
    redirect("/dashboard");
  }

  redirect("/login");
}
