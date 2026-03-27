"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import {
  ChevronRight,
  MessageSquareMore,
  Phone,
  RefreshCw,
  Search,
  SendHorizontal,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type WhatsAppMessage = {
  id: string
  threadId?: string
  from: string
  body: string
  direction: "inbound" | "outbound"
  timestamp: string
}

type WhatsAppState = {
  connection: "open" | "connecting" | "close"
  qrCodeDataUrl: string | null
  pairingCode: string | null
  pairingCodePhone: string | null
  connectedJid: string | null
  lastError: string | null
  lastEvent: string | null
  lastUpdatedAt: string
  messages: WhatsAppMessage[]
  chats: ContactThread[]
}

type ContactThread = {
  id: string
  displayName: string
  phone: string
  sendTarget: string
  lastMessage: string
  lastTimestamp: string | null
  unreadCount: number
  profilePictureUrl?: string | null
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
  messages: [],
  chats: [],
}

function formatPhoneLabel(value: string) {
  const digits = value.replace(/\D/g, "")

  return digits || value || "Unknown contact"
}

function getCanonicalThreadId(value: string) {
  const bareId = value.replace(/@.+$/, "")
  const digits = bareId.replace(/\D/g, "")

  return digits || bareId || value
}

function toThreadMap(messages: WhatsAppMessage[]) {
  const threads = new Map<string, ContactThread>()

  for (const entry of messages) {
    const threadId = entry.threadId || getCanonicalThreadId(entry.from)
    const phone = formatPhoneLabel(threadId)
    const existing = threads.get(threadId)

    if (!existing) {
      threads.set(threadId, {
        id: threadId,
        displayName: phone,
        phone,
        sendTarget: phone,
        lastMessage: entry.body,
        lastTimestamp: entry.timestamp,
        unreadCount: entry.direction === "inbound" ? 1 : 0,
      })
      continue
    }

    existing.lastMessage = entry.body
    existing.lastTimestamp = entry.timestamp
    existing.sendTarget = existing.phone

    if (entry.direction === "inbound") {
      existing.unreadCount += 1
    }
  }

  return Array.from(threads.values()).sort((a, b) => {
    const first = a.lastTimestamp ? new Date(a.lastTimestamp).getTime() : 0
    const second = b.lastTimestamp ? new Date(b.lastTimestamp).getTime() : 0

    return second - first
  })
}

async function readJson(response: Response) {
  const data = (await response.json()) as WhatsAppState & { error?: string }

  if (!response.ok) {
    throw new Error(data.error || "Request failed.")
  }

  data.messages = data.messages.map((entry) => ({
    ...entry,
    threadId: entry.threadId || getCanonicalThreadId(entry.from),
  }))

  data.chats = data.chats || []

  return data
}

export function WhatsAppPanel() {
  const [state, setState] = useState(defaultState)
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [selectedChatId, setSelectedChatId] = useState("")
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  async function refreshStatus(chatId?: string) {
    try {
      const params = new URLSearchParams()

      if (chatId) {
        params.set("chatId", chatId)
      }

      const response = await fetch(
        `/api/whatsapp/status${params.toString() ? `?${params.toString()}` : ""}`,
        {
          cache: "no-store",
        }
      )
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
    void refreshStatus(selectedChatId || undefined)

    const interval = window.setInterval(() => {
      void refreshStatus(selectedChatId || undefined)
    }, 5000)

    return () => {
      window.clearInterval(interval)
    }
  }, [selectedChatId])

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, message }),
      })
      const data = await readJson(response)
      setState(data)
      setMessage("")
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to send message."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isConnected = state.connection === "open"
  const threads = state.chats.length ? state.chats : toThreadMap(state.messages)
  const filteredThreads = threads.filter((thread) => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return true
    }

    return (
      thread.displayName.toLowerCase().includes(query) ||
      thread.phone.toLowerCase().includes(query) ||
      thread.lastMessage.toLowerCase().includes(query)
    )
  })

  useEffect(() => {
    if (!filteredThreads.length) {
      if (
        selectedChatId &&
        !threads.some((thread) => thread.id === selectedChatId)
      ) {
        setSelectedChatId("")
      }
      return
    }

    if (
      !selectedChatId ||
      !filteredThreads.some((thread) => thread.id === selectedChatId)
    ) {
      setSelectedChatId(filteredThreads[0]?.id ?? "")
      setPhone(filteredThreads[0]?.sendTarget ?? "")
    }
  }, [filteredThreads, selectedChatId, threads])

  const activeThread =
    threads.find((thread) => thread.id === selectedChatId) ?? null
  const visibleMessages = activeThread
    ? state.messages.filter(
        (entry) =>
          (entry.threadId || getCanonicalThreadId(entry.from)) ===
          activeThread.id
      )
    : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeThread?.id, visibleMessages.length])

  return (
    <Card className="flex h-full min-h-0 flex-col gap-0 overflow-hidden border-border/70 bg-card py-0 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Chat</CardTitle>
            <CardDescription>
              Live WhatsApp inbox using the current connected session.
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
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-full overflow-hidden p-0">
        <div className="grid h-full min-h-0 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col overflow-hidden border-r border-border/60 bg-muted/30">
            <div className="space-y-4 border-b border-border/60 px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Inbox</p>
                  <p className="text-xs text-muted-foreground">
                    {threads.length} conversation
                    {threads.length === 1 ? "" : "s"}
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

              <div className="rounded-xl border border-border/60 bg-background px-3 py-2 shadow-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Search className="size-4" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search conversations"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {filteredThreads.length ? (
                filteredThreads.map((thread) => {
                  const isActive = thread.id === activeThread?.id

                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => {
                        setSelectedChatId(thread.id)
                        setPhone(thread.sendTarget)
                        void refreshStatus(thread.id)
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition hover:bg-background",
                        isActive && "bg-background"
                      )}
                    >
                      <Avatar className="size-10 shrink-0 border border-border/60">
                        <AvatarImage
                          src={thread.profilePictureUrl || undefined}
                          alt={thread.displayName || thread.phone}
                        />
                        <AvatarFallback className="bg-muted text-foreground">
                          <UserRound className="size-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-medium text-foreground">
                            {thread.displayName}
                          </p>
                          <span className="text-[11px] text-muted-foreground">
                            {thread.lastTimestamp
                              ? new Date(
                                  thread.lastTimestamp
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {thread.phone}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-3">
                          <p className="truncate text-xs text-muted-foreground">
                            {thread.lastMessage}
                          </p>
                          {thread.unreadCount ? (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                              {thread.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                    </button>
                  )
                })
              ) : (
                <div className="flex h-full min-h-60 items-center justify-center p-6">
                  <div className="text-center text-sm text-muted-foreground">
                    No conversations match this search.
                  </div>
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col overflow-hidden bg-background">
            <div className="border-b border-border/60 bg-card px-5 py-4">
              {activeThread ? (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 border border-border/60">
                      <AvatarImage
                        src={activeThread.profilePictureUrl || undefined}
                        alt={activeThread.displayName || activeThread.phone}
                      />
                      <AvatarFallback className="bg-muted text-foreground">
                        <UserRound className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {activeThread.displayName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="size-3.5" />
                        <span className="truncate">{activeThread.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                      <MessageSquareMore className="size-3.5" />
                      Live inbox
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                      <ShieldCheck className="size-3.5" />
                      WhatsApp
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold">
                    No conversation selected
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose a contact from the inbox to open the thread.
                  </p>
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-5 py-5">
              {visibleMessages.length ? (
                <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-end gap-3">
                  {visibleMessages.map((entry) => {
                    const isOutbound = entry.direction === "outbound"

                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          "flex",
                          isOutbound ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[78%] rounded-2xl border px-4 py-3 shadow-xs",
                            isOutbound
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/70 bg-white text-background"
                          )}
                        >
                          <p className="text-sm leading-6 wrap-break-word whitespace-pre-wrap">
                            {entry.body}
                          </p>
                          <p
                            className={cn(
                              "mt-2 text-[11px]",
                              isOutbound
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            )}
                          >
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex h-full min-h-80 items-center justify-center">
                  <div className="rounded-2xl border border-dashed border-border/70 bg-card px-8 py-10 text-center shadow-xs">
                    <MessageSquareMore className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-4 text-sm font-medium">
                      {activeThread
                        ? "No messages in this thread yet"
                        : "Conversation view is ready"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activeThread
                        ? "Send the first reply from the composer below."
                        : "Select a conversation from the inbox."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <form onSubmit={handleSend} className="bg-card px-5 py-4">
              <div className="mx-auto flex max-w-4xl flex-col gap-3 md:flex-row">
                <Input
                  id="wa-message"
                  placeholder={
                    activeThread
                      ? `Reply to ${activeThread.displayName}`
                      : "Type a message"
                  }
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  disabled={isSubmitting}
                  className="h-11 border-border/60 bg-background"
                />
                <Button
                  type="submit"
                  disabled={!isConnected || isSubmitting || !phone.trim()}
                  className="gap-2 md:min-w-32"
                >
                  <SendHorizontal className="size-4" />
                  {isSubmitting ? "Sending..." : "Send"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </CardContent>
    </Card>
  )
}
