import { NextResponse } from "next/server"

import { getAuthenticatedUser } from "@/lib/auth"
import { requestWhatsAppPairingCode } from "@/lib/whatsapp"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as { phone?: string }

  if (!body.phone?.trim()) {
    return NextResponse.json(
      { error: "Phone number is required." },
      { status: 400 }
    )
  }

  try {
    const state = await requestWhatsAppPairingCode(body.phone)

    return NextResponse.json(state)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to request pairing code."

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
