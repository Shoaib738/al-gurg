import { getSession } from "@/lib/auth";
import { LoginScreen } from "@/components/login-screen";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    return <LoginScreen />;
  }
  return <AppShell user={session} />;
}
