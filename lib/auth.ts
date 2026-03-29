import "server-only"

import { cookies } from "next/headers"
import { createPocketBase, getPocketBaseUrl } from "@/lib/pocketbase"

export type AuthUser = {
  id: string
  email: string
  name?: string
  role?: string
  avatar?: string
  collectionId?: string
  total_balance?: number
  total_job?: number
}

async function getAuthStore() {
  const baseUrl = getPocketBaseUrl()

  if (!baseUrl) {
    return null
  }

  const cookieStore = await cookies()
  const pb = createPocketBase()

  pb.authStore.loadFromCookie(cookieStore.toString())

  return pb.authStore
}

export async function hasValidAuthCookie() {
  const authStore = await getAuthStore()

  if (!authStore) {
    return false
  }

  return authStore.isValid
}

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const authStore = await getAuthStore()

  if (!authStore?.isValid || !authStore.record) {
    return null
  }

  const record = authStore.record as any

  if (!record.id || !record.email) {
    return null
  }

  return {
    id: record.id,
    email: record.email,
    name: record.name,
    role: record.role,
    avatar: record.avatar,
    collectionId: record.collectionId,
    total_balance: record.total_balance,
    total_job: record.total_job,
  }
}
