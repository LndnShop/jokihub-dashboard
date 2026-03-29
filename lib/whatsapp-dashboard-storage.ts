"use client"

export type WhatsAppQuickReply = {
  id: string
  title: string
  message: string
}

export type WhatsAppContactMetadata = {
  customName: string
  labels: string[]
}

const QUICK_REPLIES_STORAGE_KEY = "jokihub-dashboard:whatsapp:quick-replies"
const CONTACT_METADATA_STORAGE_KEY =
  "jokihub-dashboard:whatsapp:contact-metadata"

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function createId() {
  return `wa-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeQuickReply(input: Partial<WhatsAppQuickReply>): WhatsAppQuickReply | null {
  const title = input.title?.trim() || ""
  const message = input.message?.trim() || ""

  if (!title || !message) {
    return null
  }

  return {
    id: input.id?.trim() || createId(),
    title,
    message,
  }
}

function normalizeLabel(value: string) {
  return value.trim()
}

function normalizeLabels(values: string[]) {
  return Array.from(
    new Set(values.map(normalizeLabel).filter(Boolean))
  )
}

function normalizeContactMetadata(
  input?: Partial<WhatsAppContactMetadata> | null
): WhatsAppContactMetadata {
  return {
    customName: input?.customName?.trim() || "",
    labels: normalizeLabels(input?.labels || []),
  }
}

export function getContactMetadataStorageKey(contactId: string) {
  return contactId.trim()
}

export function getQuickReplies(): WhatsAppQuickReply[] {
  if (!canUseStorage()) {
    return []
  }

  const stored = safeJsonParse<Partial<WhatsAppQuickReply>[]>(
    window.localStorage.getItem(QUICK_REPLIES_STORAGE_KEY),
    []
  )

  return stored
    .map((entry) => normalizeQuickReply(entry))
    .filter((entry): entry is WhatsAppQuickReply => entry !== null)
}

export function saveQuickReplies(replies: WhatsAppQuickReply[]) {
  if (!canUseStorage()) {
    return
  }

  const normalized = replies
    .map((entry) => normalizeQuickReply(entry))
    .filter((entry): entry is WhatsAppQuickReply => entry !== null)

  window.localStorage.setItem(
    QUICK_REPLIES_STORAGE_KEY,
    JSON.stringify(normalized)
  )
}

export function createQuickReply(
  input?: Partial<WhatsAppQuickReply>
): WhatsAppQuickReply {
  return {
    id: input?.id?.trim() || createId(),
    title: input?.title?.trim() || "",
    message: input?.message?.trim() || "",
  }
}

export function getContactMetadataMap(): Record<string, WhatsAppContactMetadata> {
  if (!canUseStorage()) {
    return {}
  }

  const stored = safeJsonParse<Record<string, Partial<WhatsAppContactMetadata>>>(
    window.localStorage.getItem(CONTACT_METADATA_STORAGE_KEY),
    {}
  )

  return Object.fromEntries(
    Object.entries(stored).map(([key, value]) => [
      key,
      normalizeContactMetadata(value),
    ])
  )
}

export function getContactMetadata(
  contactId: string
): WhatsAppContactMetadata {
  const key = getContactMetadataStorageKey(contactId)
  const metadataMap = getContactMetadataMap()

  return normalizeContactMetadata(metadataMap[key])
}

export function saveContactMetadata(
  contactId: string,
  metadata: Partial<WhatsAppContactMetadata>
) {
  if (!canUseStorage()) {
    return
  }

  const key = getContactMetadataStorageKey(contactId)
  const metadataMap = getContactMetadataMap()

  metadataMap[key] = normalizeContactMetadata(metadata)

  window.localStorage.setItem(
    CONTACT_METADATA_STORAGE_KEY,
    JSON.stringify(metadataMap)
  )
}

export function parseLabelsInput(value: string) {
  return normalizeLabels(value.split(","))
}

export function formatLabelsInput(labels: string[]) {
  return normalizeLabels(labels).join(", ")
}
