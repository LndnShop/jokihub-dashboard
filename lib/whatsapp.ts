import "server-only"

import QRCode from "qrcode"
import { Client, LocalAuth } from "whatsapp-web.js"

type WhatsAppConnectionState = "open" | "connecting" | "close"

export type WhatsAppMessage = {
  id: string
  threadId?: string
  from: string
  body: string
  direction: "inbound" | "outbound"
  timestamp: string
}

export type WhatsAppChat = {
  id: string
  displayName: string
  phone: string
  sendTarget: string
  lastMessage: string
  lastTimestamp: string | null
  unreadCount: number
  rawChatId?: string
  profilePictureUrl?: string | null
}

export type WhatsAppState = {
  connection: WhatsAppConnectionState
  qrCodeDataUrl: string | null
  pairingCode: string | null
  pairingCodePhone: string | null
  connectedJid: string | null
  lastError: string | null
  lastEvent: string | null
  lastUpdatedAt: string
  messages: WhatsAppMessage[]
  chats: WhatsAppChat[]
}

type PairingConfig = {
  phoneNumber: string
  showNotification: boolean
  intervalMs: number
}

type RuntimeState = {
  client: Client | null
  initializePromise: Promise<Client> | null
  pairingPromise: Promise<Client> | null
  baseState: Omit<WhatsAppState, "messages" | "chats">
  messagesById: Map<string, WhatsAppMessage>
  chatsById: Map<string, WhatsAppChat>
  profilePictureUrlByChatId: Map<string, string | null>
  lastChatSyncAt: number
  currentMode: "qr" | "pairing"
  currentPairingConfig: PairingConfig | null
}

type MessageLike = {
  id?: { _serialized?: string }
  from?: string
  to?: string
  body?: string
  fromMe?: boolean
  timestamp?: number
  _data?: {
    notifyName?: string
  }
}

type ContactLike = {
  id?: { _serialized?: string }
  name?: string
  pushname?: string
  shortName?: string
  number?: string
  getProfilePicUrl?: () => Promise<string | undefined>
}

type ChatLike = {
  id?: { _serialized?: string; user?: string }
  name?: string
  isGroup?: boolean
  isReadOnly?: boolean
  archived?: boolean
  unreadCount?: number
  timestamp?: number
  lastMessage?: MessageLike
  fetchMessages?: (args?: { limit?: number }) => Promise<MessageLike[]>
  getContact?: () => Promise<ContactLike>
  sendSeen?: () => Promise<boolean>
  sendStateTyping?: () => Promise<void>
  clearState?: () => Promise<boolean>
  sendMessage?: (content: string) => Promise<MessageLike>
}

const MAX_STORED_MESSAGES = 400
const CHAT_SYNC_INTERVAL_MS = 4_000
const PAIRING_CODE_TIMEOUT_MS = 25_000
const DEFAULT_PAIRING_INTERVAL_MS = 180_000

function createInitialBaseState(): RuntimeState["baseState"] {
  return {
    connection: "close",
    qrCodeDataUrl: null,
    pairingCode: null,
    pairingCodePhone: null,
    connectedJid: null,
    lastError: null,
    lastEvent: null,
    lastUpdatedAt: new Date().toISOString(),
  }
}

function createRuntimeState(): RuntimeState {
  return {
    client: null,
    initializePromise: null,
    pairingPromise: null,
    baseState: createInitialBaseState(),
    messagesById: new Map(),
    chatsById: new Map(),
    profilePictureUrlByChatId: new Map(),
    lastChatSyncAt: 0,
    currentMode: "qr",
    currentPairingConfig: null,
  }
}

declare global {
  var __jokihubWhatsAppRuntime: RuntimeState | undefined
}

const runtime =
  globalThis.__jokihubWhatsAppRuntime ??
  (globalThis.__jokihubWhatsAppRuntime = createRuntimeState())

function touchState() {
  runtime.baseState.lastUpdatedAt = new Date().toISOString()
}

function updateBaseState(
  partial: Partial<RuntimeState["baseState"]>,
  options?: { clearError?: boolean }
) {
  runtime.baseState = {
    ...runtime.baseState,
    ...partial,
    lastUpdatedAt: new Date().toISOString(),
    lastError:
      options?.clearError === true
        ? null
        : (partial.lastError ?? runtime.baseState.lastError),
  }
}

function resetEphemeralConnectionState() {
  updateBaseState({
    qrCodeDataUrl: null,
    pairingCode: null,
    pairingCodePhone: null,
    connectedJid: null,
    lastEvent: null,
    lastError: null,
  })
}

function sanitizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "")

  if (!digits) {
    throw new Error("Phone number must contain digits only.")
  }

  return digits
}

function stripChatSuffix(value: string) {
  return value.replace(/@.+$/, "")
}

function canonicalThreadId(value: string) {
  const bare = stripChatSuffix(value)
  const digits = bare.replace(/\D/g, "")

  return digits || bare || value
}

function formatPhoneLabel(value: string) {
  const digits = stripChatSuffix(value).replace(/\D/g, "")

  return digits || stripChatSuffix(value) || value
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

function getTypingDelayMs(message: string) {
  const trimmed = message.trim()
  const perCharacterDelay = Math.min(trimmed.length * 45, 4_000)
  const baseDelay = 900
  const randomDelay = Math.floor(Math.random() * 700)

  return baseDelay + perCharacterDelay + randomDelay
}

function toIsoTimestamp(timestamp?: number) {
  if (!timestamp) {
    return new Date().toISOString()
  }

  const value =
    timestamp > 10_000_000_000 ? timestamp : Math.trunc(timestamp * 1000)

  return new Date(value).toISOString()
}

function normalizeTextBody(value?: string) {
  const text = value?.trim()

  return text && text.length > 0 ? text : "[Media]"
}

function getMessageId(message: MessageLike) {
  return (
    message.id?._serialized ||
    `${message.from || "unknown"}:${message.timestamp || Date.now()}:${Math.random()}`
  )
}

function getMessageThreadId(message: MessageLike) {
  const source = message.fromMe ? message.to || message.from : message.from

  return canonicalThreadId(source || "unknown")
}

function getMessageRawChatId(message: MessageLike) {
  return message.fromMe
    ? message.to || message.from || "unknown"
    : message.from || "unknown"
}

function getChatSerializedId(chat: ChatLike) {
  return chat.id?._serialized || `${chat.id?.user || chat.name || "unknown"}`
}

function getChatDisplayName(chat: ChatLike) {
  const lastMessageName = chat.lastMessage?._data?.notifyName?.trim()

  return (
    chat.name?.trim() ||
    lastMessageName ||
    formatPhoneLabel(getChatSerializedId(chat))
  )
}

function getSendTargetFromRawChatId(rawChatId: string) {
  return rawChatId.trim()
}

function sortMessages(values: WhatsAppMessage[]) {
  return values.sort((first, second) => {
    return (
      new Date(first.timestamp).getTime() - new Date(second.timestamp).getTime()
    )
  })
}

function sortChats(values: WhatsAppChat[]) {
  return values.sort((first, second) => {
    const firstTime = first.lastTimestamp
      ? new Date(first.lastTimestamp).getTime()
      : 0
    const secondTime = second.lastTimestamp
      ? new Date(second.lastTimestamp).getTime()
      : 0

    return secondTime - firstTime
  })
}

function limitStoredMessages() {
  if (runtime.messagesById.size <= MAX_STORED_MESSAGES) {
    return
  }

  const kept = sortMessages(Array.from(runtime.messagesById.values())).slice(
    -MAX_STORED_MESSAGES
  )

  runtime.messagesById.clear()

  for (const entry of kept) {
    runtime.messagesById.set(entry.id, entry)
  }
}

function upsertChatFromMessage(message: WhatsAppMessage, rawChatId?: string) {
  const threadId = message.threadId || canonicalThreadId(message.from)
  const existing = runtime.chatsById.get(threadId)
  const phone = formatPhoneLabel(threadId)
  const nextUnreadCount =
    message.direction === "inbound"
      ? (existing?.unreadCount || 0) + 1
      : existing?.unreadCount || 0
  const resolvedRawChatId =
    rawChatId || existing?.rawChatId || existing?.sendTarget || threadId

  runtime.chatsById.set(threadId, {
    id: threadId,
    displayName: existing?.displayName || phone,
    phone,
    sendTarget: getSendTargetFromRawChatId(resolvedRawChatId),
    rawChatId: resolvedRawChatId,
    profilePictureUrl:
      existing?.profilePictureUrl ??
      runtime.profilePictureUrlByChatId.get(resolvedRawChatId) ??
      null,
    lastMessage: message.body,
    lastTimestamp: message.timestamp,
    unreadCount: nextUnreadCount,
  })
}

function storeMessage(messageLike: MessageLike) {
  const rawChatId = getMessageRawChatId(messageLike)
  const from = canonicalThreadId(rawChatId)

  const entry: WhatsAppMessage = {
    id: getMessageId(messageLike),
    threadId: getMessageThreadId(messageLike),
    from,
    body: normalizeTextBody(messageLike.body),
    direction: messageLike.fromMe ? "outbound" : "inbound",
    timestamp: toIsoTimestamp(messageLike.timestamp),
  }

  runtime.messagesById.set(entry.id, entry)
  upsertChatFromMessage(entry, rawChatId)
  limitStoredMessages()
  touchState()
}

async function setConnectedJid(client: Client) {
  try {
    const info = await client.getState()
    if (info) {
      touchState()
    }
  } catch {
    // ignore transient getState errors
  }

  try {
    const clientWithInfo = client as Client & {
      info?: { wid?: { _serialized?: string } }
    }

    updateBaseState({
      connectedJid: clientWithInfo.info?.wid?._serialized || null,
    })
  } catch {
    updateBaseState({
      connectedJid: null,
    })
  }
}

async function syncChats(force = false) {
  if (runtime.baseState.connection !== "open" || !runtime.client) {
    return
  }

  const now = Date.now()

  if (!force && now - runtime.lastChatSyncAt < CHAT_SYNC_INTERVAL_MS) {
    return
  }

  runtime.lastChatSyncAt = now

  try {
    const chats = ((await runtime.client.getChats()) as ChatLike[])
      .filter((chat) => !chat.isReadOnly)
      .filter((chat) => !chat.archived)
      .slice(0, 50)

    for (const chat of chats) {
      const rawId = getChatSerializedId(chat)
      const threadId = canonicalThreadId(rawId)
      const existing = runtime.chatsById.get(threadId)
      const phone = formatPhoneLabel(rawId)
      const lastBody = normalizeTextBody(chat.lastMessage?.body)
      const lastTimestamp =
        chat.timestamp || chat.lastMessage?.timestamp
          ? toIsoTimestamp(chat.timestamp || chat.lastMessage?.timestamp)
          : null

      let profilePictureUrl =
        runtime.profilePictureUrlByChatId.get(rawId) ??
        existing?.profilePictureUrl ??
        null

      let displayName = existing?.displayName || getChatDisplayName(chat)
      let phoneLabel = phone

      if (
        !runtime.profilePictureUrlByChatId.has(rawId) ||
        !existing?.displayName
      ) {
        try {
          const contact = await chat.getContact?.()

          if (contact?.name?.trim()) {
            displayName = contact.name.trim()
          } else if (contact?.pushname?.trim()) {
            displayName = contact.pushname.trim()
          } else if (contact?.shortName?.trim()) {
            displayName = contact.shortName.trim()
          }

          if (contact?.number?.trim()) {
            phoneLabel = contact.number.trim()
          }

          if (!runtime.profilePictureUrlByChatId.has(rawId)) {
            profilePictureUrl = (await contact?.getProfilePicUrl?.()) || null
            runtime.profilePictureUrlByChatId.set(rawId, profilePictureUrl)
          }
        } catch {
          if (!runtime.profilePictureUrlByChatId.has(rawId)) {
            runtime.profilePictureUrlByChatId.set(rawId, null)
          }
        }
      }

      runtime.chatsById.set(threadId, {
        id: threadId,
        displayName,
        phone: phoneLabel,
        sendTarget: getSendTargetFromRawChatId(rawId),
        rawChatId: rawId,
        profilePictureUrl,
        lastMessage: lastBody,
        lastTimestamp,
        unreadCount: Number(chat.unreadCount || 0),
      })
    }

    touchState()
  } catch (error) {
    updateBaseState({
      lastError:
        error instanceof Error ? error.message : "Unable to load chats.",
      lastEvent: "chat_sync_error",
    })
  }
}

async function resolveChat(chatId?: string) {
  if (runtime.baseState.connection !== "open" || !runtime.client || !chatId) {
    return null
  }

  const chats = (await runtime.client.getChats()) as ChatLike[]

  return (
    chats.find((chat) => {
      const rawId = getChatSerializedId(chat)

      return (
        canonicalThreadId(rawId) === canonicalThreadId(chatId) ||
        rawId === chatId
      )
    }) || null
  )
}

async function markChatAsRead(chatId?: string) {
  if (!chatId) {
    return
  }

  try {
    const target = await resolveChat(chatId)

    if (!target) {
      return
    }

    await target.sendSeen?.()

    const threadId = canonicalThreadId(getChatSerializedId(target))
    const existing = runtime.chatsById.get(threadId)

    if (existing) {
      runtime.chatsById.set(threadId, {
        ...existing,
        unreadCount: 0,
      })
      touchState()
    }
  } catch (error) {
    updateBaseState({
      lastError:
        error instanceof Error ? error.message : "Unable to mark chat as read.",
      lastEvent: "send_seen_error",
    })
  }
}

async function hydrateChatMessages(chatId?: string) {
  if (runtime.baseState.connection !== "open" || !runtime.client || !chatId) {
    return
  }

  try {
    const target = await resolveChat(chatId)

    if (!target?.fetchMessages) {
      return
    }

    const messages = await target.fetchMessages({ limit: 50 })

    for (const message of messages) {
      storeMessage(message)
    }
  } catch (error) {
    updateBaseState({
      lastError:
        error instanceof Error
          ? error.message
          : "Unable to load chat messages.",
      lastEvent: "chat_history_error",
    })
  }
}

function buildStateSnapshot(): WhatsAppState {
  return {
    ...runtime.baseState,
    messages: sortMessages(Array.from(runtime.messagesById.values())),
    chats: sortChats(Array.from(runtime.chatsById.values())),
  }
}

function createClient(options?: { pairing?: PairingConfig }) {
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: "jokihub-dashboard",
      dataPath: ".wwebjs_auth",
    }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
    ...(options?.pairing
      ? {
          pairWithPhoneNumber: {
            phoneNumber: options.pairing.phoneNumber,
            showNotification: options.pairing.showNotification,
            intervalMs: options.pairing.intervalMs,
          },
        }
      : {}),
  } as ConstructorParameters<typeof Client>[0])

  client.removeAllListeners()

  client.on("qr", async (qr: string) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(qr)
      updateBaseState({
        connection: "connecting",
        qrCodeDataUrl,
        pairingCode: null,
        pairingCodePhone: null,
        lastEvent: "qr",
        lastError: null,
      })
    } catch (error) {
      updateBaseState({
        connection: "connecting",
        qrCodeDataUrl: null,
        lastEvent: "qr_error",
        lastError:
          error instanceof Error
            ? error.message
            : "Unable to generate QR code.",
      })
    }
  })

  client.on("code", (code: string) => {
    updateBaseState({
      connection: "connecting",
      pairingCode: code,
      pairingCodePhone: runtime.currentPairingConfig?.phoneNumber || null,
      qrCodeDataUrl: null,
      lastEvent: "code",
      lastError: null,
    })
  })

  client.on("loading_screen", (_percent: number, message: string) => {
    updateBaseState({
      connection: "connecting",
      lastEvent: `loading:${message}`,
    })
  })

  client.on("authenticated", () => {
    updateBaseState({
      connection: "connecting",
      lastEvent: "authenticated",
      lastError: null,
    })
  })

  client.on("ready", async () => {
    updateBaseState(
      {
        connection: "open",
        qrCodeDataUrl: null,
        pairingCode: null,
        pairingCodePhone: null,
        lastEvent: "ready",
        lastError: null,
      },
      { clearError: true }
    )

    await setConnectedJid(client)
    await syncChats(true)
  })

  client.on("auth_failure", (message: string) => {
    updateBaseState({
      connection: "close",
      qrCodeDataUrl: null,
      pairingCode: null,
      pairingCodePhone: null,
      connectedJid: null,
      lastEvent: "auth_failure",
      lastError: message || "Authentication failed.",
    })
  })

  client.on("disconnected", (reason: string) => {
    runtime.client = null
    runtime.initializePromise = null
    runtime.pairingPromise = null
    runtime.currentMode = "qr"
    runtime.currentPairingConfig = null

    updateBaseState({
      connection: "close",
      qrCodeDataUrl: null,
      pairingCode: null,
      pairingCodePhone: null,
      connectedJid: null,
      lastEvent: `disconnected:${reason || "unknown"}`,
    })
  })

  client.on("message", (message: MessageLike) => {
    storeMessage(message)
  })

  client.on("message_create", (message: MessageLike) => {
    storeMessage(message)
  })

  runtime.client = client

  return client
}

async function initializeClient(
  mode: "qr" | "pairing",
  pairing?: PairingConfig
) {
  if (
    runtime.client &&
    runtime.currentMode === mode &&
    runtime.baseState.connection !== "close"
  ) {
    return runtime.client
  }

  if (mode === "pairing") {
    runtime.currentPairingConfig = pairing || null
  } else {
    runtime.currentPairingConfig = null
  }

  runtime.currentMode = mode

  resetEphemeralConnectionState()

  updateBaseState({
    connection: "connecting",
    lastEvent: mode === "pairing" ? "initialize_pairing" : "initialize_qr",
  })

  const client = createClient(
    mode === "pairing" && pairing ? { pairing } : undefined
  )

  const initializePromise = client.initialize().then(() => client)

  runtime.initializePromise = initializePromise

  try {
    return await initializePromise
  } catch (error) {
    runtime.client = null
    runtime.initializePromise = null
    runtime.pairingPromise = null

    updateBaseState({
      connection: "close",
      lastEvent: "initialize_error",
      lastError:
        error instanceof Error
          ? error.message
          : "Unable to initialize WhatsApp.",
    })

    throw error
  }
}

async function ensureQrClient() {
  if (runtime.client && runtime.currentMode === "qr") {
    return runtime.client
  }

  if (runtime.initializePromise && runtime.currentMode === "qr") {
    return runtime.initializePromise
  }

  return initializeClient("qr")
}

async function destroyClient() {
  const client = runtime.client

  runtime.client = null
  runtime.initializePromise = null
  runtime.pairingPromise = null
  runtime.currentPairingConfig = null
  runtime.currentMode = "qr"

  if (!client) {
    return
  }

  try {
    await client.destroy()
  } catch {
    // ignore destroy failures
  }
}

async function waitForPairingCode() {
  await Promise.race([
    new Promise<void>((resolve) => {
      const startedAt = Date.now()

      const interval = setInterval(() => {
        if (runtime.baseState.pairingCode) {
          clearInterval(interval)
          resolve()
          return
        }

        if (runtime.baseState.connection === "open") {
          clearInterval(interval)
          resolve()
          return
        }

        if (Date.now() - startedAt >= PAIRING_CODE_TIMEOUT_MS) {
          clearInterval(interval)
          resolve()
        }
      }, 250)
    }),
    runtime.initializePromise ?? Promise.resolve(),
  ])
}

function normalizeSendTarget(phone: string) {
  const trimmed = phone.trim()

  if (!trimmed) {
    throw new Error("Phone number is required.")
  }

  return trimmed
}

export async function connectWhatsApp() {
  await ensureQrClient()
  await syncChats(true)

  return buildStateSnapshot()
}

export async function requestWhatsAppPairingCode(phone: string) {
  const phoneNumber = sanitizePhoneNumber(phone)

  await destroyClient()

  const pairing: PairingConfig = {
    phoneNumber,
    showNotification: true,
    intervalMs: DEFAULT_PAIRING_INTERVAL_MS,
  }

  runtime.pairingPromise = initializeClient("pairing", pairing)
  await waitForPairingCode()

  if (
    !runtime.baseState.pairingCode &&
    runtime.baseState.connection !== "open"
  ) {
    updateBaseState({
      lastEvent: "pairing_pending",
      lastError:
        runtime.baseState.lastError ||
        "Pairing code is not ready yet. Please refresh in a moment.",
    })
  }

  return buildStateSnapshot()
}

export async function sendWhatsAppText(phone: string, message: string) {
  const client = await ensureQrClient()

  if (runtime.baseState.connection !== "open") {
    throw new Error("WhatsApp is not connected yet.")
  }

  const chatId = normalizeSendTarget(phone)
  const body = message.trim()

  if (!body) {
    throw new Error("Message cannot be empty.")
  }

  let sent: MessageLike | null = null
  const targetChat = await resolveChat(chatId)

  if (targetChat) {
    await targetChat.sendSeen?.()
    await targetChat.sendStateTyping?.()
    await sleep(getTypingDelayMs(body))
    await targetChat.clearState?.()
    sent = ((await targetChat.sendMessage?.(body)) ||
      null) as MessageLike | null
  }

  if (!sent) {
    sent = (await client.sendMessage(chatId, body)) as MessageLike
  }

  storeMessage({
    ...sent,
    body,
    fromMe: true,
    to: chatId,
  })

  await syncChats(true)
  await markChatAsRead(chatId)

  return buildStateSnapshot()
}

export async function logoutWhatsApp() {
  const client = runtime.client

  try {
    if (client) {
      try {
        await client.logout()
      } catch {
        // continue with destroy/reset even if logout fails
      }

      try {
        await client.destroy()
      } catch {
        // ignore destroy errors
      }
    }
  } finally {
    runtime.client = null
    runtime.initializePromise = null
    runtime.pairingPromise = null
    runtime.currentMode = "qr"
    runtime.currentPairingConfig = null
    runtime.messagesById.clear()
    runtime.chatsById.clear()
    runtime.profilePictureUrlByChatId.clear()
    runtime.lastChatSyncAt = 0

    runtime.baseState = {
      ...createInitialBaseState(),
      lastEvent: "logged_out",
    }
  }

  return buildStateSnapshot()
}

export async function getWhatsAppState(chatId?: string) {
  if (runtime.client && runtime.baseState.connection === "open") {
    await setConnectedJid(runtime.client)
    await syncChats()
    await hydrateChatMessages(chatId)
    await markChatAsRead(chatId)
  }

  return buildStateSnapshot()
}
