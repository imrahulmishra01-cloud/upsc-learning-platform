# UPSC Learning Platform

A self-hosted, private-first learning management and study tracking platform designed for Civil Services Examination (UPSC CSE) preparation.

> [!IMPORTANT]
> **Development Status:** Version 0.1.0 is the initial public pre-release. It is suitable for evaluation and self-hosting experiments, but not yet presented as production-stable. External adopters are responsible for operating their own infrastructure, database, storage, backups, and security configuration.

## Releases

For release notes, version history, and tags, see the repository [Releases](../../releases) section and [CHANGELOG.md](CHANGELOG.md).

---

## Disclaimer & Non-Affiliation

> [!WARNING]
> **Independent Maintenance & Content Responsibility:**
> - The **UPSC Learning Platform** is an independently maintained open-source project.
> - It is **not** affiliated with, authorized by, associated with, or endorsed by the **Union Public Service Commission (UPSC)** or the **Government of India**.
> - Users and self-hosters are solely responsible for verifying the accuracy of official syllabus guidelines, examination schedules, question papers, and study materials through authoritative government portals (e.g., [upsc.gov.in](https://upsc.gov.in)).

---

## Overview & Key Capabilities

The platform provides a unified digital workspace for UPSC aspirants, integrating study planning, material management, revision tracking, current affairs synthesis, and optional AI evaluation:

- **Study Planner & Progress Dashboard:** Create structured study schedules, track daily targets, monitor subject progress, and manage backlog items.
- **Material Vault & Reader:** Self-host study materials and notes with Cloudflare R2 storage integration, inline document viewing, and reading progress tracking.
- **Current Affairs Management:** Ingest, categorize (by GS paper and region), tag, and revise current affairs entries.
- **PYQ & Test Tracking:** Log and review Previous Year Questions (Prelims & Mains) and practice test sessions.
- **Optional AI Answer Evaluation:** Evaluate practice answers using Google Gemini API (requires self-provided API key).
- **Private Allowlist Access Control:** Restrict platform login strictly to explicitly approved email addresses.

---

## Security Model

The application enforces defense-in-depth authorization across both browser and server boundaries:

1. **Email Allowlist Gate:** Authentication is restricted exclusively to user email addresses listed in the `APP_ALLOWED_EMAILS` environment configuration. Unapproved users cannot log in or access protected routes.
2. **Server-Side API Guards:** All protected API routes enforce the `requireAllowedUser()` authorization guard. Requests missing valid session tokens or unallowlisted emails fail closed (401 Unauthorized / 403 Forbidden).
3. **User Ownership & IDOR Protection:** All data mutation handlers derive user identity directly from authenticated Supabase session context (`auth.user.id`). Payload overrides of `user_id` are stripped server-side.
4. **Row-Level Security (RLS):** Database operations use user-scoped clients respecting PostgreSQL RLS policies. Service-role admin keys are prohibited in application routes.

---

## Self-Hosted Architecture Summary

Adopters operate their own infrastructure components:

- **Application Server:** Next.js 15 (App Router) deployed on Node.js 20+ runtime.
- **Database & Authentication:** Managed PostgreSQL instance via [Supabase](https://supabase.com) with Row Level Security and Auth magic links.
- **Object Storage:** [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) S3-compatible storage for study materials and notes.
- **AI Service (Optional):** Google Gemini API for automated answer feedback.

---

## Technology Stack

- **Framework:** Next.js 15.5.21 (App Router, Server Components)
- **UI & Styling:** React 19.0.0, Tailwind CSS 3.4
- **Database & Auth:** `@supabase/ssr`, `@supabase/supabase-js`
- **Object Storage:** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- **Language:** TypeScript 5 (Strict Mode)
- **Testing:** Node.js Native Test Runner (`tsx --test`)

---

## Documentation Links

- 📖 [Self-Hosting & Deployment Guide](docs/SELF_HOSTING.md)
- 🏗️ [Architecture Documentation](docs/ARCHITECTURE.md)
- 🔐 [API Security Matrix](docs/API_SECURITY_MATRIX.md)
- 🛡️ [Security Review](docs/SECURITY_REVIEW.md)
- 🛠️ [Contributing Guide](CONTRIBUTING.md)
- 🔒 [Security Policy](SECURITY.md)
- 📜 [Code of Conduct](CODE_OF_CONDUCT.md)
- 📋 [Changelog](CHANGELOG.md)

---

## Prerequisites

Before deploying or developing locally, ensure you have:

- **Node.js:** v20.0.0 or higher
- **Package Manager:** `npm` (v10+)
- **Supabase Project:** A Supabase project with database schema applied ([supabase/migrations](supabase/migrations)).
- **Cloudflare R2 Bucket:** An R2 bucket configured with CORS policy for document uploads.

---

## Quick Start (Local Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/upsc-learning-platform.git
   cd upsc-learning-platform
   ```

2. **Install dependencies:**
   ```bash
   npm ci
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local` and set your local credentials:
   ```bash
   cp .env.example .env.local
   ```
   *Required variables:* `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `APP_ALLOWED_EMAILS`.

4. **Run Verification Commands:**
   ```bash
   npm test          # Run 24 automated security unit tests
   npm run lint      # Run ESLint code quality checks
   npm run typecheck # Run TypeScript type check
   npm run build     # Verify production build
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```

---

## License

Distributed under the **GNU Affero General Public License v3.0 (AGPL-3.0-only)**. See [LICENSE](LICENSE) for details. Third-party components and fonts retain their respective open-source licenses (see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)).
