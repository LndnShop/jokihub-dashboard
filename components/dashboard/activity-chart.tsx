"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

interface ChartData {
  date: string
  balance: number
  jobs: number
}

interface ActivityChartProps {
  data: ChartData[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <Card className="col-span-1 border-border/50 shadow-sm bg-card/40 backdrop-blur-xs">
      <CardHeader className="flex flex-col items-start gap-1 pb-4">
        <CardTitle className="text-lg font-bold">Grafik Aktivitas</CardTitle>
        <CardDescription className="text-xs">Statistik saldo dan penyelesaian job harian</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:p-6 pt-0">
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ccff00" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ccff00" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background/95 p-3 shadow-md backdrop-blur-md">
                        <div className="mb-2 text-xs font-bold text-muted-foreground">{label}</div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5">
                              <div className="size-2 rounded-full bg-[#ccff00]" />
                              <span className="text-xs font-medium">Saldo</span>
                            </div>
                            <span className="text-xs font-bold">Rp {payload[0].value?.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5">
                              <div className="size-2 rounded-full bg-[#3b82f6]" />
                              <span className="text-xs font-medium">Jobs</span>
                            </div>
                            <span className="text-xs font-bold">{payload[1]?.value} Job</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.split(' ')[0]}
              />
              <YAxis
                stroke="#888888"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `Rp ${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#ccff00"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBalance)"
              />
              <Area
                type="monotone"
                dataKey="jobs"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorJobs)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
