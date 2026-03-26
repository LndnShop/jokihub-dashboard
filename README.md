# JokiHub Dashboard

JokiHub Dashboard is a small admin-style Next.js app with PocketBase authentication.

It currently includes:

- Email and password login with PocketBase
- `Remember me` session handling
- Automatic redirect to `/dashboard` when the session is still valid
- Logout button for quick auth testing
- Dashboard greeting based on the PocketBase user record

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- shadcn/ui
- PocketBase

## Quick Start

Install dependencies:

```bash
npm install
```

Create your local environment file:

```env
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Authentication Notes

This project authenticates against the PocketBase `users` auth collection.

Session behavior:

- If `Remember me` is checked, the auth cookie lasts for 30 days.
- If `Remember me` is not checked, the auth cookie lasts for 30 minutes.
- If the cookie is still valid, visiting `/` redirects the user to `/dashboard`.
- Logging out clears the PocketBase session cookie and sends the user back to `/`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```

## Project Direction

This dashboard is set up as a starting point for JokiHub internal tools, account access, and future admin workflows.

The current focus is clean authentication flow first, then dashboard features after that.
