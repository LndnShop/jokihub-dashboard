import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getAuthenticatedUser } from "@/lib/auth"
import { getPocketBaseUrl } from "@/lib/pocketbase"

function formatRoleLabel(role?: string) {
  if (!role) {
    return "No Role"
  }

  return role
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect("/")
  }

  const pocketBaseUrl = getPocketBaseUrl()
  const avatarUrl =
    pocketBaseUrl && user.avatar && user.collectionId
      ? `${pocketBaseUrl}/api/files/${user.collectionId}/${user.id}/${user.avatar}`
      : undefined

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen>
        <AppSidebar
          user={{
            name: user.name || user.email.split("@")[0] || "JokiHub User",
            email: user.email,
            role: formatRoleLabel(user.role),
            avatar: avatarUrl,
            isOwner: user.role === "owner",
          }}
        />
        <SidebarInset className="h-svh overflow-hidden">{children}</SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
