"use client"

import { useState, useEffect } from "react"
import { FileText, Wand2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface OrderInputerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialText?: string
}

export function OrderInputerSheet({ open, onOpenChange, initialText = "" }: OrderInputerSheetProps) {
  const [rawText, setRawText] = useState(initialText)
  
  const [parsedData, setParsedData] = useState({
    nama: "",
    jenisJoki: "",
    detailJoki: "",
    deadline: "",
    catatan: "",
  })

  // Synchronize state when sheet is opened with pre-filled initial text (if any)
  useEffect(() => {
    if (open && initialText) {
      setRawText(initialText)
    }
  }, [open, initialText])

  // Core parsing algorithm
  useEffect(() => {
    if (!rawText) {
      setParsedData({
        nama: "",
        jenisJoki: "",
        detailJoki: "",
        deadline: "",
        catatan: "",
      })
      return
    }

    const extractField = (regex: RegExp) => {
      const match = rawText.match(regex);
      return match && match[1] ? match[1].trim() : "";
    };

    setParsedData({
      nama: extractField(/Nama(?:\s*):(.*)/i),
      jenisJoki: extractField(/Jenis Joki(?:\s*):(.*)/i),
      detailJoki: extractField(/Detail Joki(?:\s*):(.*)/i),
      deadline: extractField(/Deadline(?:.*?):(.*)/i), // handles both "Deadline:" and "Deadline (Tanggal & jam WIB/WIT/WITA):"
      catatan: extractField(/Catatan(?:\s*):(.*)/i),
    })
  }, [rawText])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto sm:w-[450px]">
        <SheetHeader className="mb-6 mt-4">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">
            <Wand2 className="size-5 text-primary" />
            Create Auto-Order
          </SheetTitle>
          <SheetDescription>
            Paste the customer's text below to automatically extract the details and fill the fields.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 pb-8">
          <div className="flex flex-col gap-3">
            <Label htmlFor="raw-text" className="text-sm font-semibold text-foreground">Paste Format Here</Label>
            <textarea
              id="raw-text"
              placeholder={`Nama: \nJenis Joki: \nDetail Joki: \nDeadline: \nCatatan: `}
              className="flex min-h-[160px] w-full resize-y rounded-xl border border-input bg-card px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/20 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <FileText className="size-4" />
                Parsed Order Details
              </h3>
            </div>
            
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Nama</Label>
              <Input 
                value={parsedData.nama} 
                onChange={(e) => setParsedData({ ...parsedData, nama: e.target.value })}
                placeholder="Name"
                className="bg-background shadow-xs h-9"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Jenis Joki</Label>
              <Input 
                value={parsedData.jenisJoki} 
                onChange={(e) => setParsedData({ ...parsedData, jenisJoki: e.target.value })}
                placeholder="Service Type"
                className="bg-background shadow-xs h-9"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Detail Joki</Label>
              <Input 
                value={parsedData.detailJoki} 
                onChange={(e) => setParsedData({ ...parsedData, detailJoki: e.target.value })}
                placeholder="Details"
                className="bg-background shadow-xs h-9"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Deadline</Label>
              <Input 
                value={parsedData.deadline} 
                onChange={(e) => setParsedData({ ...parsedData, deadline: e.target.value })}
                placeholder="Deadline (WIB/WIT/WITA)"
                className="bg-background shadow-xs h-9"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Catatan</Label>
              <textarea
                className="flex min-h-[60px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={parsedData.catatan} 
                onChange={(e) => setParsedData({ ...parsedData, catatan: e.target.value })}
                placeholder="Notes" 
              />
            </div>
          </div>

          <div className="pt-2">
            <Button className="w-full font-semibold shadow-sm h-11" disabled={!parsedData.nama && !parsedData.jenisJoki}>
              Create Order
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
