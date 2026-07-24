# API Route Security Matrix

This document lists every API endpoint in the application, its HTTP methods, access classification, and security guard status.

## Access Classifications

* **`PUBLIC_UNAUTHENTICATED`**: Pre-authentication endpoint (e.g. login eligibility check). Does not expose application state.
* **`AUTHENTICATED_SESSION`**: Session management endpoint. Requires valid Supabase auth cookie (e.g. sign-out for removed users).
* **`ALLOWLIST_REQUIRED`**: Protected application data endpoint. Strictly requires a valid Supabase session **AND** an email address verified against the server allowlist via `requireAllowedUser()`.

---

## Route Inventory

| Route Path | HTTP Methods | Access Classification | Authorization Guard | Service-Role Client Used? |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/check-email` | `POST` | `PUBLIC_UNAUTHENTICATED` | Pre-auth allowlist match (`isEmailAllowed`) | No |
| `/api/auth/signout` | `POST` | `AUTHENTICATED_SESSION` | Supabase Auth session (`signOut`) | No |
| `/api/ai/evaluate` | `POST`, `GET` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/csat` | `GET`, `POST`, `PATCH` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/current-affairs` | `GET`, `POST`, `PATCH`, `DELETE` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/ingest/current-affairs` | `GET`, `POST` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/ingest/ncert` | `GET`, `POST` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/materials/archive` | `PATCH` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/materials/complete-upload` | `POST` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/materials/download` | `GET` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/materials/notes` | `GET`, `POST`, `PATCH` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/materials/presign-upload` | `POST` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/materials/progress` | `GET`, `PATCH` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/materials/view` | `GET` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/planner/generate` | `POST` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/planner/goals` | `POST`, `PATCH` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/planner/plans` | `POST`, `PATCH` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/planner/tasks` | `POST`, `PATCH` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/pyq` | `GET`, `POST`, `PATCH` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/pyq/attempts` | `GET`, `POST`, `PATCH` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/status/r2` | `GET` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/status/supabase` | `GET` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |
| `/api/tests/sessions` | `POST` | `ALLOWLIST_REQUIRED` | `requireAllowedUser()` | No |

---

## Security Guarantees

1. **No Admin Client Usage:** Zero API routes import or use `createAdminClient()` or `SUPABASE_SERVICE_ROLE_KEY`. All database queries run through the RLS-respecting server client.
2. **Server-Derived Identity:** No route accepts or trusts a client-supplied `user_id`. `user_id` is derived strictly from the verified session object returned by `requireAllowedUser()`.
3. **No Middleware-Only Security:** Every `ALLOWLIST_REQUIRED` route calls `requireAllowedUser()` independently inside its handler, preventing accidental middleware bypasses.
