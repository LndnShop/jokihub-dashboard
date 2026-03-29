import { redirect } from "next/navigation"

import { WhatsAppSettingsPanel } from "@/components/whatsapp-settings-panel"
import { getAuthenticatedUser } from "@/lib/auth"

export default async function DashboardSettingsPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect("/")
  }

  if (user.role !== "owner") {
    redirect("/dashboard")
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-background px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-6">
        <div className="min-h-0 flex-1">
          <WhatsAppSettingsPanel />
        </div>
      </div>
    </main>
  )
}
