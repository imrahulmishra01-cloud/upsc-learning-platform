# Contributing to UPSC Learning Platform

Thank you for your interest in contributing to the **UPSC Learning Platform**! We welcome bug fixes, documentation improvements, and feature enhancements.

---

## 1. Development Prerequisites

Ensure your local development environment has:
- **Node.js:** v20.0.0 or higher
- **npm:** v10.0.0 or higher
- **Git**

---

## 2. Fork & Branch Workflow

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/upsc-learning-platform.git
   cd upsc-learning-platform
   ```
3. Create a descriptive feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## 3. Local Installation & Environment Setup

1. Install dependencies:
   ```bash
   npm ci
   ```

2. Configure local environment variables:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *Note:* Use dummy local configuration values for development. Never commit `.env.local` or real API keys to Git.

---

## 4. Required Local Verification Commands

Before opening a pull request, all proposed changes must pass the full local validation suite:

```bash
npm test          # Run 24 automated security & authorization unit tests
npm run lint      # Run ESLint code quality rules
npm run typecheck # Run TypeScript type check (tsc --noEmit)
npm run build     # Verify Next.js production build succeeds
```

---

## 5. Security-Sensitive Code Rules

Any contribution affecting authentication, authorization, API routes, or data storage must adhere strictly to these rules:

1. **API Security Guard:** Every new or modified API route in `src/app/api/` must call the server authorization guard `requireAllowedUser()`.
2. **API Security Matrix Update:** Whenever adding an API route or modifying supported HTTP methods, update [docs/API_SECURITY_MATRIX.md](docs/API_SECURITY_MATRIX.md).
3. **No Service Role Keys:** Do not import `createAdminClient` or `SUPABASE_SERVICE_ROLE_KEY` into application routes or client components.
4. **User Ownership & IDOR Protection:** Mutation handlers (`POST`, `PATCH`, `DELETE`) must derive `user_id` strictly from session context (`auth.user.id`). Never trust client-supplied `user_id` overrides in request bodies.
5. **Row-Level Security (RLS):** All database schema changes (`supabase/migrations/`) must include PostgreSQL Row Level Security policies with explicit `USING` and `WITH CHECK` clauses.

---

## 6. Commit Message & PR Guidance

- Write clear, concise commit messages (e.g., `feat(planner): add subject filter to task view`, `fix(auth): handle session refresh error`).
- Keep pull requests focused on a single feature or bug fix.
- Do **not** include absolute local paths, production credentials, real email addresses, or proprietary study materials in commits.

---

## 7. Pull Request Checklist

Before submitting your PR, verify:

- [ ] `npm ci` succeeds cleanly.
- [ ] `npm test` passes with zero failing tests.
- [ ] `npm run lint` reports zero errors or warnings.
- [ ] `npm run typecheck` completes with zero TypeScript errors.
- [ ] `npm run build` succeeds without build failures.
- [ ] [docs/API_SECURITY_MATRIX.md](docs/API_SECURITY_MATRIX.md) is updated if API endpoints were added or changed.
- [ ] No real credentials, API keys, or private user data were committed.

---

## 8. License & Contribution Terms

By contributing to this repository, you agree that your contributions will be licensed under the project's **GNU Affero General Public License v3.0 (AGPL-3.0-only)**.
