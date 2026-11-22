import { redirect } from "next/navigation"

// Dashboard admin digabung ke Portal Pengurus (/dashboard).
export default function AdminDashboardRedirectPage() {
  redirect("/dashboard")
}
