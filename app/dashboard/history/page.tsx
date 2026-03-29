import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"
import { createPocketBase } from "@/lib/pocketbase"
import { HistoryListClient } from "./client"
import { Ticket } from "@/types"

export default async function HistoryPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect("/")
  }

  const pb = createPocketBase()

  let ticketsList: Ticket[] = []
  try {
    ticketsList = await pb.collection("history_tickets").getFullList({
      sort: "-created",
    })
  } catch (err) {
    console.error("Failed to fetch tickets:", err)
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-background px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading tracking-tight">Ticket History</h1>
            <p className="text-muted-foreground mt-1 text-sm">Archived orders and exported customer transcripts.</p>
          </div>
        </div>

        <HistoryListClient initialTickets={ticketsList} />
      </div>
    </main>
  )
}
