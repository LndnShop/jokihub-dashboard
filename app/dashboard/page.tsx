import { redirect } from "next/navigation"

import { getAuthenticatedUser } from "@/lib/auth"

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect("/")
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-background px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold font-heading tracking-tight">Dashboard Overview</h1>
            <p className="text-muted-foreground mt-1 text-sm">Welcome back. Here is your quick overview.</p>
          </div>
        </div>
        
        <div className="flex h-full min-h-0 flex-col gap-0 overflow-hidden border border-border/70 bg-card shadow-sm rounded-xl">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex items-center justify-center">
            <p className="text-muted-foreground">Select an option from the sidebar to get started.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
