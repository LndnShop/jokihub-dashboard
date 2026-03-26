import PocketBase, { BaseAuthStore } from "pocketbase"

const THIRTY_MINUTES_IN_SECONDS = 60 * 30
const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30

export function getPocketBaseUrl() {
  return process.env.NEXT_PUBLIC_POCKETBASE_URL?.trim() ?? ""
}

export function createPocketBase() {
  return new PocketBase(getPocketBaseUrl(), new BaseAuthStore())
}

export function getAuthCookieMaxAge(rememberMe: boolean) {
  return rememberMe ? THIRTY_DAYS_IN_SECONDS : THIRTY_MINUTES_IN_SECONDS
}
