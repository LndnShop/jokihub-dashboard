import { redirect } from "next/navigation"

import { getAuthenticatedUser } from "@/lib/auth"

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect("/")
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-background px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl items-center justify-center">
        <p className="text-2xl font-semibold tracking-tight">
          THIS IS DASHBOARD
        </p>
      </div>
    </main>
  )
}
