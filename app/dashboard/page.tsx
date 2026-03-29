import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"
import { createPocketBase } from "@/lib/pocketbase"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { Order } from "@/types"

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect("/")
  }

  const pb = createPocketBase()

  // Fetch orders for the user
  let ordersList: Order[] = []
  try {
    ordersList = await pb.collection("orders").getFullList({
      sort: "-created",
    })
  } catch (err) {
    console.error("Failed to fetch orders:", err)
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-y-auto bg-background px-4 py-8 md:px-8">
      <div className="mx-auto h-full w-full max-w-7xl">
        <DashboardClient
          user={{
            total_balance: user.total_balance || 0,
            total_job: user.total_job || 0,
            name: user.name || user.email.split("@")[0] || "JokiHub User",
          }}
          orders={ordersList}
        />
      </div>
    </main>
  )
}
