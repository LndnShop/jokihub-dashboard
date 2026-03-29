import { Card, CardContent } from "@/components/ui/card"
import { Wallet, Briefcase, TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardsProps {
  totalBalance: number
  totalJob: number
}

export function StatsCards({ totalBalance, totalJob }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Balance Card - Main Highlight (Budggt Style) */}
      <Card className="col-span-1 md:col-span-2 bg-[#0a0a0a] border-[#1a1a1a] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Wallet className="size-24 text-[#ccff00]" />
        </div>
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-[#ccff00] animate-pulse" />
            <p className="text-xs font-medium text-white/60 uppercase tracking-widest">Sekilas Hari Ini</p>
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tighter sm:text-5xl">
            Rp {totalBalance.toLocaleString("id-ID")}
          </h2>
          <p className="text-sm text-white/40 mt-2 font-medium">Total saldo anda saat ini</p>
          
          <div className="mt-8 flex items-center gap-6 border-t border-white/5 pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Pemasukan</span>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="size-3 text-[#ccff00]" />
                <span className="text-sm font-semibold text-[#ccff00]">Rp 0</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Pengeluaran</span>
              <div className="flex items-center gap-1.5">
                <TrendingDown className="size-3 text-rose-500" />
                <span className="text-sm font-semibold text-rose-500 text-opacity-80">Rp 0</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Jobs Card */}
      <Card className="bg-card border-border/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Job</p>
              <h3 className="text-3xl font-bold mt-1">{totalJob}</h3>
            </div>
            <div className="bg-primary/10 p-3 rounded-2xl">
              <Briefcase className="size-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '75%' }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-medium">Aktifitas pengerjaan stabil</p>
        </CardContent>
      </Card>

      {/* Status Card (Mocked based on image progress style) */}
      <Card className="bg-card border-border/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
             <div className="relative size-16 shrink-0">
                <svg className="size-16 -rotate-90">
                  <circle
                    className="text-muted"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="transparent"
                    r="28"
                    cx="32"
                    cy="32"
                  />
                  <circle
                    className="text-[#ccff00]"
                    strokeWidth="4"
                    strokeDasharray={175}
                    strokeDashoffset={175 * (1 - 0.65)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="28"
                    cx="32"
                    cy="32"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold">65%</span>
                </div>
             </div>
             <div>
               <p className="text-xs font-semibold text-muted-foreground uppercase">Progres Kerja</p>
               <h4 className="text-lg font-bold leading-tight mt-0.5">Sangat Baik</h4>
               <p className="text-[10px] text-muted-foreground/70 leading-tight">Meningkat 12% dari kemarin</p>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
