"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { ClientResponseError } from "pocketbase"

import {
  createPocketBase,
  getAuthCookieMaxAge,
  getPocketBaseUrl,
} from "@/lib/pocketbase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")

    const pocketBaseUrl = getPocketBaseUrl()

    if (!pocketBaseUrl) {
      setErrorMessage("Set NEXT_PUBLIC_POCKETBASE_URL before signing in.")
      return
    }

    setIsPending(true)

    try {
      const pb = createPocketBase()

      await pb.collection("users").authWithPassword(email, password)

      document.cookie = pb.authStore.exportToCookie({
        httpOnly: false,
        maxAge: getAuthCookieMaxAge(rememberMe),
        path: "/",
        sameSite: "lax",
        secure: window.location.protocol === "https:",
      })

      router.replace("/dashboard")
      router.refresh()
    } catch (error) {
      if (error instanceof ClientResponseError) {
        setErrorMessage(
          error.response.message || "The email or password is incorrect."
        )
        return
      }

      setErrorMessage("Unable to sign in right now. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>JokiHub Dashboard 1.0</CardTitle>
          <CardDescription>
            Silahkan login dengan akun yang sudah di berikan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isPending}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isPending}
                  required
                />
              </Field>
              <Field orientation="horizontal" className="items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="mt-0 size-4 rounded border border-input"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  disabled={isPending}
                />
                <FieldLabel htmlFor="remember-me">Remember me</FieldLabel>
              </Field>
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Logging in..." : "Login"}
                </Button>
                <FieldError>{errorMessage}</FieldError>
                <FieldDescription className="text-center">
                  Silahkan gunakan email dan password akun PocketBase Anda.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
