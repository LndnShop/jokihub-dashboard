"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { MessageSquareMore, CalendarDays, Archive, CheckCircle2, Ticket as TicketIcon } from "lucide-react"
import { Ticket } from "@/types"

export function HistoryListClient({ initialTickets }: { initialTickets: Ticket[] }) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  return (
    <div className="flex h-full min-h-0 flex-col gap-0 overflow-hidden border border-border/70 bg-card shadow-sm rounded-xl w-full">
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="flex flex-col gap-6 w-full">
          <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-xs">
            <div className="mb-4">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Archive className="size-4" />
                Archived Order Tickets
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Historical record of all completed orders.
              </p>
            </div>
          {initialTickets.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <MessageSquareMore className="size-10 text-muted-foreground/30 mb-3" />
              <h2 className="text-sm font-semibold text-muted-foreground">No History Yet</h2>
              <p className="text-xs text-muted-foreground/60 max-w-[400px] mt-1">Completed orders will appear here automatically.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {initialTickets.map((ticket, idx) => (
                <div key={ticket.id || idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 hover:bg-muted/10 transition-colors px-2 rounded-lg -mx-2">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="mt-1 bg-muted p-2 rounded-lg text-muted-foreground shrink-0 border border-border/50">
                      <TicketIcon className="size-5" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-foreground truncate">{ticket.nama_customer}</span>
                        <span className="text-xs text-muted-foreground font-mono">{ticket.customer_phone}</span>
                      </div>
                      <div className="text-sm text-muted-foreground truncate flex items-center gap-2">
                        {ticket.jenis_joki} <span className="text-xs">({ticket.jumlah}x)</span>
                      </div>
                      <div className="text-xs flex items-center gap-1.5 text-muted-foreground mt-1.5">
                        <CheckCircle2 className="size-3 text-green-500/70" />
                        Completed by <span className="font-semibold">{ticket.completed_by || ticket.worker}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
                    <div className="flex flex-col items-start sm:items-end">
                      <span className="text-xs text-muted-foreground uppercase font-semibold">Total</span>
                      <span className="font-mono text-sm tracking-tight text-foreground">
                        Rp {(ticket.total_harga || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket)} className="ml-2 font-semibold bg-background shadow-xs h-8 text-xs px-3">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* TICKET DETAILS MODAL */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden flex flex-col max-h-[85vh]">
          {selectedTicket && (
            <>
              <DialogHeader className="p-6 border-b border-border/60 bg-muted/10">
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl">Ticket: {selectedTicket.id}</DialogTitle>
                    <DialogDescription className="mt-1 flex items-center gap-2">
                       <CalendarDays className="size-3.5" /> 
                       Archived on {new Date(selectedTicket.created).toLocaleString()}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="p-6 overflow-y-auto flex flex-col gap-6 border-b border-border/40 bg-background">
                 <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                   <div>
                     <span className="text-xs font-semibold text-muted-foreground uppercase">Customer Name</span>
                     <p className="text-sm font-medium text-foreground">{selectedTicket.nama_customer}</p>
                   </div>
                   <div>
                     <span className="text-xs font-semibold text-muted-foreground uppercase">Phone Number</span>
                     <p className="text-sm font-medium tracking-tight font-mono text-foreground">{selectedTicket.customer_phone}</p>
                   </div>
                   <div>
                     <span className="text-xs font-semibold text-muted-foreground uppercase">Service</span>
                     <p className="text-sm font-medium text-foreground">{selectedTicket.jenis_joki} ({selectedTicket.jumlah}x)</p>
                   </div>
                   <div>
                     <span className="text-xs font-semibold text-muted-foreground uppercase">Completed By</span>
                     <p className="text-sm font-medium text-foreground">{selectedTicket.completed_by || selectedTicket.worker}</p>
                   </div>
                 </div>

                 <div>
                   <h3 className="text-sm font-bold tracking-tight mb-2 text-foreground">Exported Chat Transcript</h3>
                   <div className="bg-muted/40 border border-border/60 rounded-xl p-4 min-h-[160px] max-h-[400px] overflow-y-auto shadow-inner">
                     <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                        {selectedTicket.chat_history || "No transcript available for this ticket."}
                     </pre>
                   </div>
                 </div>
              </div>

              <div className="p-4 bg-muted/20 flex justify-end">
                <Button variant="ghost" onClick={() => setSelectedTicket(null)}>Close Window</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
