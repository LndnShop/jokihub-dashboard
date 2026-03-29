import { redirect } from "next/navigation"

import { getAuthenticatedUser } from "@/lib/auth"

export default async function GeneralSettingsPage() {
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
          <div className="flex h-full min-h-0 flex-col gap-0 overflow-hidden border border-border/70 bg-card shadow-sm rounded-xl">
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="rounded-2xl border border-border/60 bg-background p-6 shadow-xs">
                <p className="text-lg font-semibold">General Settings</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure generic workspace preferences here.
                </p>
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground">
                    General settings placeholder. More configurations coming soon.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
