# Maintainer Security Review

> [!NOTE]
> This document summarizes an internal maintainer-performed security review of the UPSC Learning Platform open-source release candidate. It is not an independent third-party professional audit. Security is an ongoing process and this review does not guarantee the complete absence of vulnerabilities.

## Executive Summary

As part of preparing the UPSC Learning Platform for open-source release, a comprehensive security review and authorization hardening pass was conducted across the application codebase.

Key outcomes:
- Upgraded framework dependencies to Next.js 15.5.21 (Maintenance LTS) and React 19.
- Eliminated all high and critical production dependency vulnerabilities.
- Verified 100% API route coverage with explicit server-side authorization guards.
- Enforced zero-trust user ownership filters across all database mutation routes (preventing IDOR vulnerabilities).
- Ensured no client routes use the Supabase service-role admin key.

---

## Security Architecture & Controls

### 1. Dual-Layer Allowlist Authorization Gate
The platform restricts access exclusively to explicitly approved user email addresses (`APP_ALLOWED_EMAILS`).
- **Middleware Gate (`src/lib/supabase/middleware.ts`):** Validates authentication sessions and checks email allowlist eligibility before serving protected pages. Unallowlisted users are redirected to `/login?error=access_denied` without entering redirect loops.
- **Server API Gate (`src/lib/auth/require-allowed-user.ts`):** Every protected API endpoint invokes `requireAllowedUser()`, which verifies session validity and re-checks the email allowlist server-side. Missing or unauthorized requests fail closed (401 Unauthorized / 403 Forbidden / 503 Service Unavailable).

### 2. Insecure Direct Object Reference (IDOR) Protections
- **User Identity Derivation:** All mutation handlers (POST/PATCH/DELETE) derive `user_id` strictly from the authenticated Supabase session (`auth.user.id`).
- **Payload Sanitization:** Mutation payloads strip client-supplied `user_id` overrides.
- **Row-Level Security (RLS):** All database interactions use standard user-scoped clients respecting Supabase Row Level Security (RLS) policies. Service-role bypasses are strictly prohibited in application routes.

### 3. Object Storage (Cloudflare R2) Hardening
- Presigned S3 URLs are restricted to a maximum 1-hour (3600s) lifetime.
- Uploads are capped at 50MB per file with explicit MIME content-type validation.
- Bucket CORS policies restrict allowed origins to trusted application domains.

---

## Automated Security Test Suite

The project includes an automated security test suite (`npm test`) enforcing authorization contracts and route coverage:

```
✔ Allowlist Parsing: Comma-separated entries with whitespace and uppercase
✔ Allowlist Parsing: Duplicate removal and normalization
✔ Allowlist Parsing: Legacy numbered-variable compatibility merge
✔ Allowlist Parsing: Empty configuration fails closed
✔ Allowlist Masking: getMaskedAllowedEmails masks local part
✔ IDOR & Ownership Audit: No user-data route trusts client-supplied user_id for mutation inserts or updates
✔ IDOR & Ownership Audit: PATCH routes delete or strip client-supplied user_id overrides
✔ IDOR & Ownership Audit: Material completion & download verify file record ownership
✔ requireAllowedUser: Missing database/Supabase configuration returns 503
✔ requireAllowedUser: No authenticated user returns 401
✔ requireAllowedUser: getUser() session error returns 401
✔ requireAllowedUser: Authenticated user without email returns 403
✔ requireAllowedUser: Authenticated user not on allowlist returns 403
✔ requireAllowedUser: Empty allowlist returns 403
✔ requireAllowedUser: Authenticated allowlisted user succeeds and returns user + client
✔ Route Coverage Audit: All API route.ts files are covered in docs/API_SECURITY_MATRIX.md
✔ Route Coverage Audit: Every ALLOWLIST_REQUIRED route method invokes requireAllowedUser()
✔ Route Coverage Audit: No API route imports createAdminClient or SUPABASE_SERVICE_ROLE_KEY
✔ Middleware Routing: Unauthenticated user on protected route redirects to /login
✔ Middleware Routing: Authenticated unallowlisted user on protected route redirects to /login?error=access_denied
✔ Middleware Routing: Authenticated allowlisted user on protected route proceeds
✔ Middleware Routing: Authenticated allowlisted user on /login redirects to /dashboard
✔ Middleware Routing: Authenticated UNALLOWLISTED user on /login stays on /login (no redirect loop)
✔ Middleware Routing: Auth callback, assets, and unauthenticated public paths pass through

Total: 24 tests | Passed: 24 | Failed: 0
```

---

## Dependency & Build Audit Status

- **ESLint:** 0 warnings or errors (`npm run lint`).
- **Production Build:** Succeeded (`npm run build`).
- **Dependency Vulnerabilities (`npm audit --omit=dev`):**
  - Critical: 0
  - High: 0
  - Moderate: 2 (transitive build-time `postcss` under Next.js)

---

## Ongoing Security Responsibility

Self-hosters and maintainers must ensure:
1. Environment variables (`APP_ALLOWED_EMAILS`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.) are securely supplied at runtime and never committed to version control.
2. Supabase Row Level Security (RLS) policies are active on all production tables.
3. Service-role keys (`SUPABASE_SERVICE_ROLE_KEY`) are kept confidential and out of public deployment configurations.
