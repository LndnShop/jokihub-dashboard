"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { isSameDay, parseISO } from "date-fns"

interface DeadlinesCalendarProps {
  deadlines: Date[]
}

export function DeadlinesCalendar({ deadlines }: DeadlinesCalendarProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  // Custom styling for days with deadlines
  const modifiers = {
    deadline: (date: Date) => deadlines.some((d) => isSameDay(d, date)),
  }

  const modifiersStyles = {
    deadline: {
      fontWeight: "bold",
      backgroundColor: "rgba(204, 255, 0, 0.1)",
      color: "#ccff00",
      border: "1px solid rgba(204, 255, 0, 0.3)",
      borderRadius: "8px",
    },
  }

  return (
    <Card className="border-border/50 shadow-sm bg-card/40 backdrop-blur-xs h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-bold">Aktivitas Bulan Ini</CardTitle>
        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter border-[#ccff00]/30 text-[#ccff00]">
          {deadlines.length} Deadline
        </Badge>
      </CardHeader>
      <CardContent className="flex justify-center p-0 sm:p-3">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="rounded-md border-none"
        />
      </CardContent>
    </Card>
  )
}
