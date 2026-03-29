import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"
import { createPocketBase } from "@/lib/pocketbase"
import { OrdersListClient } from "./client"
import { Order } from "@/types"

export default async function PesananPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect("/")
  }

  const pb = createPocketBase()

  // Fetch active orders (we assume active if they exist in the order table)
  let ordersList: Order[] = []
  try {
    ordersList = await pb.collection("orders").getFullList({
      sort: "-created",
    })
  } catch (err) {
    console.error("Failed to fetch orders:", err)
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-background px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading tracking-tight">Pesanan</h1>
            <p className="text-muted-foreground mt-1 text-sm">Daftar pesanan yang sedang diproses dan yang baru.</p>
          </div>
        </div>

        <OrdersListClient initialOrders={ordersList} currentUserEmail={user.email} />
      </div>
    </main>
  )
}
