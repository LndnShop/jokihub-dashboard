import { NextResponse } from "next/server"

import { getAuthenticatedUser } from "@/lib/auth"
import { logoutWhatsApp } from "@/lib/whatsapp"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST() {
  const user = await getAuthenticatedUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const state = await logoutWhatsApp()

  return NextResponse.json(state)
}
