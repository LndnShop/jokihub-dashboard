"use client"

import { Order } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle2, Clock, MoreVertical, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface RecentJobsListProps {
  jobs: Order[]
}

export function RecentJobsList({ jobs }: RecentJobsListProps) {
  return (
    <Card className="border-border/50 shadow-sm bg-card/40 backdrop-blur-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg font-bold">Pekerjaan Terbaru</CardTitle>
          <CardDescription className="text-xs">Daftar job yang baru anda ambil</CardDescription>
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreVertical className="size-4" />
        </button>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="space-y-4 pt-4">
          {jobs.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground text-sm">Belum ada pekerjaan. Ambil pesanan sekarang!</div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between group p-3 sm:p-4 rounded-2xl hover:bg-muted/50 transition-all border border-transparent hover:border-border/40">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl transition-colors ${job.completed ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                    {job.completed ? <CheckCircle2 className="size-5" /> : <CreditCard className="size-5" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm tracking-tight">{job.nama_customer}</h5>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium flex items-center gap-1">
                      {job.jenis_joki} • <Clock className="size-3" /> {new Date(job.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className="font-bold text-sm text-foreground">
                    Rp {job.total_harga?.toLocaleString("id-ID")}
                  </span>
                  <Badge variant={job.completed ? "default" : "secondary"} className={`text-[9px] font-bold px-1.5 py-0 h-4 uppercase ${job.completed ? 'bg-green-500 hover:bg-green-500 border-none' : 'bg-muted/30 text-muted-foreground border-border/50'}`}>
                    {job.completed ? "Selesai" : "Proses"}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
