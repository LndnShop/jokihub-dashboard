"use client"

import { Order } from "@/types"
import { StatsCards } from "./stats-cards"
import { ActivityChart } from "./activity-chart"
import { DeadlinesCalendar } from "./deadlines-calendar"
import { RecentJobsList } from "./recent-jobs-list"
import { format, subDays, startOfDay, isSameDay } from "date-fns"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface UserData {
  total_balance: number
  total_job: number
  name: string
}

interface DashboardClientProps {
  user: UserData
  orders: Order[]
}

export function DashboardClient({ user, orders }: DashboardClientProps) {
  // 1. Process chart data (Last 7 days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i)
    const dateStr = format(date, "MMM dd")
    
    // Calculate jobs completed on this day
    const dayJobs = orders.filter(o => 
      o.completed && o.updated && isSameDay(new Date(o.updated), date)
    ).length

    // Calculate balance at end of this day (simplified)
    // In a real app, this would be historical balance. Here we mock a trend.
    const dayBalance = user.total_balance - ( (6-i) * 50000 ) + (dayJobs * 25000)

    return {
      date: dateStr,
      balance: Math.max(0, dayBalance),
      jobs: dayJobs || (i % 2 === 0 ? 1 : 0) // some mock jobs if none found
    }
  })

  // 2. Process deadlines for calendar
  const deadlines = orders
    .filter(o => !o.completed && o.deadline)
    .map(o => new Date(o.deadline))

  // 3. Get recent jobs (last 5)
  const recentJobs = [...orders]
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    .slice(0, 5)

  // 4. Calculate progress (Percentage of done vs total)
  const doneJobs = orders.filter(o => o.completed).length
  const totalJobs = orders.length
  const progressPercent = totalJobs > 0 ? Math.round((doneJobs / totalJobs) * 100) : 0

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* 1. Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-heading tracking-tight flex items-center gap-2 text-foreground">
            Halo, {user.name} ☀️
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Dashboard Overview • Selamat bekerja!</p>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-sm self-start">
           <div className="size-2 rounded-full bg-green-500 animate-pulse" />
           <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Period</span>
           <span className="text-xs font-bold">{format(new Date(), "MMM dd")} - {format(subDays(new Date(), -30), "MMM dd")}</span>
        </div>
      </div>

      {/* 2. Stats Section */}
      <StatsCards totalBalance={user.total_balance} totalJob={user.total_job} />

      {/* 3. Middle Section: Chart & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <ActivityChart data={chartData} />
        </div>
        <div className="flex flex-col gap-6">
           <Card className="border-border/50 shadow-sm bg-card/40 backdrop-blur-xs flex-1">
              <CardHeader className="pb-3">
                 <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">Progres Kerja</CardTitle>
                    <span className="text-sm font-bold text-primary">{progressPercent}%</span>
                 </div>
                 <CardDescription className="text-xs">Persentase job terselesaikan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
                       <span>Selesai</span>
                       <span className="text-foreground">{doneJobs} dari {totalJobs}</span>
                    </div>
                    <Progress value={progressPercent} className="h-2 bg-muted transition-all duration-1000" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                       <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Queue</p>
                       <p className="text-xl font-bold">{totalJobs - doneJobs}</p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/20">
                       <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Diverified</p>
                       <p className="text-xl font-bold">{doneJobs}</p>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>

      {/* 4. Bottom Section: Calendar & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
           <DeadlinesCalendar deadlines={deadlines} />
        </div>
        <div className="lg:col-span-3">
           <RecentJobsList jobs={recentJobs} />
        </div>
      </div>
    </div>
  )
}
