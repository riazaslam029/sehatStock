import { getSession } from "@/lib/auth/session";
import { ClientShell } from "@/components/layout/client-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return <ClientShell user={session}>{children}</ClientShell>;
}
