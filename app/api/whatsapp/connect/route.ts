import { NextResponse } from "next/server"

import { getAuthenticatedUser } from "@/lib/auth"
import { connectWhatsApp } from "@/lib/whatsapp"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST() {
  const user = await getAuthenticatedUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const state = await connectWhatsApp()

  return NextResponse.json(state)
}
