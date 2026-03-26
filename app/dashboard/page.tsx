import { redirect } from "next/navigation"

import { LogoutButton } from "@/components/logout-button"
import { getAuthenticatedUser } from "@/lib/auth"

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect("/")
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl rounded-2xl border bg-card p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-3 text-muted-foreground">
          Welcome back, {user.name || user.email}.
        </p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </div>
    </main>
  )
}
