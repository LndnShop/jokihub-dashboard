import { redirect } from "next/navigation"

import { WhatsAppPanel } from "@/components/whatsapp-panel"
import { getAuthenticatedUser } from "@/lib/auth"

export default async function DashboardChatPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect("/")
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-background px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-6">
        <div className="min-h-0 flex-1">
          <WhatsAppPanel />
        </div>
      </div>
    </main>
  )
}
