"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import {
  LoaderCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type WhatsAppState = {
  connection: "open" | "connecting" | "close"
  qrCodeDataUrl: string | null
  pairingCode: string | null
  pairingCodePhone: string | null
  connectedJid: string | null
  lastError: string | null
  lastEvent: string | null
  lastUpdatedAt: string
}

const defaultState: WhatsAppState = {
  connection: "close",
  qrCodeDataUrl: null,
  pairingCode: null,
  pairingCodePhone: null,
  connectedJid: null,
  lastError: null,
  lastEvent: null,
  lastUpdatedAt: "",
}

async function readJson(response: Response) {
  const data = (await response.json()) as WhatsAppState & { error?: string }

  if (!response.ok) {
    throw new Error(data.error || "Request failed.")
  }

  return data
}

export function WhatsAppSettingsPanel() {
  const [state, setState] = useState(defaultState)
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function refreshStatus() {
    try {
      const response = await fetch("/api/whatsapp/status", {
        cache: "no-store",
      })
      const data = await readJson(response)
      setState(data)
      setErrorMessage("")
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load WhatsApp status."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshStatus()

    const interval = window.setInterval(() => {
      void refreshStatus()
    }, 5000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  async function handleConnect() {
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const response = await fetch("/api/whatsapp/connect", {
        method: "POST",
      })
      const data = await readJson(response)
      setState(data)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to start WhatsApp."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogout() {
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const response = await fetch("/api/whatsapp/logout", {
        method: "POST",
      })
      const data = await readJson(response)
      setState(data)
      setPhone("")
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to reset WhatsApp."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRequestPairingCode() {
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const response = await fetch("/api/whatsapp/pairing-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      })
      const data = await readJson(response)
      setState(data)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to request pairing code."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isConnected = state.connection === "open"

  return (
    <Card className="flex h-full min-h-0 flex-col gap-0 overflow-hidden border-border/70 bg-card py-0 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">WhatsApp Settings</CardTitle>
            <CardDescription>
              Manage WhatsApp session connection, QR authentication, and pairing
              code access.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refreshStatus()}
              disabled={isSubmitting}
              className="gap-2"
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConnect}
              disabled={isSubmitting || state.connection === "connecting"}
              className="gap-2"
            >
              {state.connection === "connecting" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Smartphone className="size-4" />
              )}
              {state.connection === "connecting" ? "Connecting" : "Connect"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              disabled={isSubmitting}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Connection status</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Current transport state for the shared WhatsApp session.
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium capitalize",
                    isConnected
                      ? "bg-accent text-accent-foreground"
                      : state.connection === "connecting"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {isLoading ? "loading" : state.connection}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                    Connected JID
                  </p>
                  <p className="mt-2 text-sm font-medium break-all">
                    {state.connectedJid || "Not connected"}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                    Last event
                  </p>
                  <p className="mt-2 text-sm font-medium break-all">
                    {state.lastEvent || "No events yet"}
                  </p>
                </div>
              </div>

              {(state.lastError || errorMessage) && (
                <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  {state.lastError || errorMessage}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-xs">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="size-4" />
                Pairing code
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Request a pairing code for a specific WhatsApp number if QR is
                not the preferred login flow.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="628123456789"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  disabled={isSubmitting}
                  className="h-10 border-border/60 bg-background"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRequestPairingCode}
                  disabled={isSubmitting || !phone.trim() || isConnected}
                  className="gap-2 sm:min-w-44"
                >
                  <QrCode className="size-4" />
                  Request pairing code
                </Button>
              </div>

              {state.pairingCode ? (
                <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-sm font-medium">Current pairing code</p>
                  <p className="mt-2 font-mono text-2xl tracking-[0.3em]">
                    {state.pairingCode}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    For {state.pairingCodePhone || "the requested number"}.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-xs">
            <p className="text-sm font-semibold">QR authentication</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Scan this QR from the WhatsApp mobile app to link the session.
            </p>

            <div className="mt-5 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6">
              {state.qrCodeDataUrl ? (
                <div className="flex flex-col items-center text-center">
                  <Image
                    src={state.qrCodeDataUrl}
                    alt="WhatsApp QR code"
                    width={220}
                    height={220}
                    unoptimized
                    className="size-56 rounded-2xl border border-border bg-white p-3"
                  />
                  <p className="mt-4 text-sm font-medium">Ready to scan</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Open WhatsApp on the phone and scan the code above.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <QrCode className="mx-auto size-10 text-muted-foreground" />
                  <p className="mt-4 text-sm font-medium">
                    {state.connection === "connecting"
                      ? "Waiting for QR"
                      : "No QR available"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Click Connect to start a fresh QR login flow.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
