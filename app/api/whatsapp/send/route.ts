import { NextResponse } from "next/server"

import { getAuthenticatedUser } from "@/lib/auth"
import { sendWhatsAppText } from "@/lib/whatsapp"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    phone?: string
    message?: string
  }

  if (!body.phone?.trim() || !body.message?.trim()) {
    return NextResponse.json(
      { error: "Phone and message are required." },
      { status: 400 }
    )
  }

  try {
    const adminName = user.name || user.email?.split("@")[0] || "Dashboard Admin"
    const state = await sendWhatsAppText(body.phone, body.message, adminName)

    return NextResponse.json(state)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send message."

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
