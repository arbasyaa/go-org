import { forwardAuth } from "@/lib/session/server"

export async function POST(request: Request) {
  return forwardAuth(request, "/auth/register")
}
