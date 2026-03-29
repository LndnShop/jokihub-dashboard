"use client"

import { useState } from "react"
import { claimOrderAction, completeOrderAction } from "@/app/actions/orders"
import { Button } from "@/components/ui/button"
import { CheckCircle2, UserCheck, PlayCircle, FileBox, Tag, ShoppingBag, Clock } from "lucide-react"
import { Order } from "@/types"

export function OrdersListClient({ initialOrders, currentUserEmail }: { initialOrders: Order[], currentUserEmail: string }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const unclaimedOrders = initialOrders.filter(o => !o.worker)
  const myOrders = initialOrders.filter(o => o.worker === currentUserEmail)
  const otherOrders = initialOrders.filter(o => o.worker && o.worker !== currentUserEmail)

  async function handleClaim(id: string) {
    setLoadingId(id)
    try {
      await claimOrderAction(id)
    } catch (e: any) {
      alert("Failed to claim: " + e.message)
    } finally {
      setLoadingId(null)
    }
  }

  async function handleComplete(id: string) {
    if (!confirm("Are you sure you want to mark this as Done? It will verify and export to History.")) return;
    setLoadingId(id)
    try {
      await completeOrderAction(id)
    } catch (e: any) {
      alert("Failed to mark done: " + e.message)
    } finally {
      setLoadingId(null)
    }
  }

  async function handleAttach(phone: string) {
    alert(`File selection placeholder for ${phone} - This will open an upload modal and hit /api/whatsapp/send-media`)
  }

  const renderOrderRow = (order: Order, type: "unclaimed" | "mine" | "other") => {
    return (
      <div key={order.id} className="flex w-full flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="mt-1 bg-primary/10 p-2.5 rounded-lg text-primary shrink-0">
            <ShoppingBag className="size-5" />
          </div>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-card-foreground truncate">{order.nama_customer}</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-muted text-muted-foreground rounded-full whitespace-nowrap">
                Jumlah: {order.jumlah}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-muted text-muted-foreground rounded-full whitespace-nowrap">
                {order.jenis_joki}
              </span>
              <span className="flex gap-1 items-center text-xs font-semibold px-2 py-0.5 bg-muted text-muted-foreground rounded-full whitespace-nowrap">
                <Clock className="size-3.5" />
                {new Date(order.deadline).toLocaleDateString()}
              </span>
              <span className="flex gap-1 items-center text-xs font-semibold px-2 py-0.5 bg-muted text-muted-foreground rounded-full whitespace-nowrap">
                <Tag className="size-3.5" />
                Rp {(order.total_harga || 0).toLocaleString("id-ID")}
              </span>

            </div>
            <div className="text-sm text-muted-foreground break-words pr-4 line-clamp-2">
              {order.detail_joki}
            </div>
            {order.catatan && (
              <p className="text-xs text-muted-foreground/80 italic mt-1 bg-muted/30 p-2 rounded line-clamp-1 border border-border/40 w-fit max-w-full">
                Notes: {order.catatan}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0">
          {type === "unclaimed" && (
            <Button
              size="sm"
              className="w-full sm:w-auto font-semibold h-8 text-xs px-3"
              onClick={() => handleClaim(order.id)}
              disabled={loadingId === order.id}
            >
              Claim
            </Button>
          )}

          {type === "mine" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none font-semibold bg-background h-8 text-xs px-3"
                onClick={() => handleAttach(order.customer_phone)}
                disabled={loadingId === order.id}
              >
                <FileBox className="size-3.5 mr-1.5" />
                Attach
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1 sm:flex-none font-semibold bg-green-600 hover:bg-green-700 text-white h-8 text-xs px-3"
                onClick={() => handleComplete(order.id)}
                disabled={loadingId === order.id}
              >
                <CheckCircle2 className="size-3.5 mr-1.5" />
                Done
              </Button>
            </>
          )}

          {type === "other" && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-md border border-border/50 text-xs font-semibold text-muted-foreground w-full sm:w-auto justify-center">
              <UserCheck className="size-3.5" />
              {order.worker}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-0 overflow-hidden border border-border/70 bg-card shadow-sm rounded-xl w-full">
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="flex flex-col gap-6 w-full">
          {/* MY ACTIVE QUEUE */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-xs">
            <div className="mb-4">
              <p className="text-sm font-semibold flex items-center gap-2 text-primary">
                <PlayCircle className="size-4" />
                My Active Queue
              </p>
              <p className="mt-1 text-sm text-primary/70">
                Orders you have claimed and are actively working on.
              </p>
            </div>
            {myOrders.length === 0 ? (
              <p className="text-sm text-primary/60 py-8 text-center">You haven't claimed any orders yet.</p>
            ) : (
              <div className="divide-y divide-primary/10 flex flex-col">
                {myOrders.map(o => renderOrderRow(o, "mine"))}
              </div>
            )}
          </div>

          {/* NEW ORDERS */}
          <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-xs">
            <div className="mb-4 flex flex-row items-center justify-between">
              <div>
                <p className="text-sm font-semibold">New Orders</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Unclaimed orders waiting for an assigned worker.
                </p>
              </div>
              {unclaimedOrders.length > 0 && (
                <div className="bg-primary text-primary-foreground font-bold text-sm px-3 py-1 rounded-full">
                  {unclaimedOrders.length}
                </div>
              )}
            </div>
            {unclaimedOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">No unchecked orders waiting.</p>
            ) : (
              <div className="divide-y divide-border/60 flex flex-col">
                {unclaimedOrders.map(o => renderOrderRow(o, "unclaimed"))}
              </div>
            )}
          </div>

          {/* WORKED BY OTHERS */}
          {otherOrders.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-xs opacity-70">
              <div className="mb-4">
                <p className="text-sm font-semibold">Worked By Others</p>
              </div>
              <div className="divide-y divide-border/40 flex flex-col">
                {otherOrders.map(o => renderOrderRow(o, "other"))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
