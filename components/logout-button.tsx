"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { createPocketBase } from "@/lib/pocketbase"

export function LogoutButton() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  function handleLogout() {
    setIsPending(true)

    const pb = createPocketBase()

    pb.authStore.clear()
    document.cookie = pb.authStore.exportToCookie({
      httpOnly: false,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: window.location.protocol === "https:",
    })

    router.replace("/")
    router.refresh()
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={isPending}>
      {isPending ? "Logging out..." : "Log out"}
    </Button>
  )
}
