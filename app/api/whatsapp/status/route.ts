import { NextResponse } from "next/server"

import { getAuthenticatedUser } from "@/lib/auth"
import { getWhatsAppState } from "@/lib/whatsapp"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: Request) {
  const user = await getAuthenticatedUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const chatId = searchParams.get("chatId") || undefined

  return NextResponse.json(await getWhatsAppState(chatId))
}
