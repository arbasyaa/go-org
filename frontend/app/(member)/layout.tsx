import { PortalShell } from "@/components/portal-shell"

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PortalShell>{children}</PortalShell>
}
