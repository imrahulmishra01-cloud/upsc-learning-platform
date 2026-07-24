# Changelog

All notable changes to the **UPSC Learning Platform** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [0.1.0] - 2026-07-24

### Added
- **Initial Public Pre-Release:** Self-hosted UPSC CSE study companion platform candidate for evaluation and self-hosting experiments.
- **Private Email Allowlist Gate:**
  - Fast middleware-level session and allowlist checking (`src/lib/supabase/middleware.ts`).
  - Server-side API route authorization guard (`requireAllowedUser()`) protecting all API endpoints.
  - Fail-closed behavior returning HTTP 401 Unauthorized, 403 Forbidden, or 503 Service Unavailable when unconfigured.
- **Study Planner & Progress Tracking:**
  - Interactive planner hub with active plan tracking, daily task filters, study goals, and backlog management.
  - Automated study plan generation engine supporting custom target exam dates and daily study hour targets.
- **Material Vault & Document Management:**
  - Cloudflare R2 S3-compatible object storage integration for study materials, books, and notes.
  - Secure presigned upload, download, and inline viewer URL generation with 1-hour expiration limits.
  - Reading tracker with progress logging and user notes.
- **PYQ & Test Tracking:**
  - Prelims and Mains Previous Year Question (PYQ) attempt logging and revision tracking.
  - Practice test session tracker for daily and weekly mock tests.
- **Current Affairs Module:**
  - Article ingestion, categorization by GS Paper (GS1-GS4) and region (National, International, Reports, Explainers), and spaced revision tracking.
- **Optional AI Answer Evaluation:**
  - Google Gemini API integration for automated answer feedback and marks breakdown.
- **Security, Verification & Cross-Platform CI:**
  - Supabase Row Level Security (RLS) policies for all custom database tables.
  - Automated security test suite (`npm test`) with cross-platform Node.js test discovery (`scripts/run-tests.mjs`) running 24 security unit tests.
  - GitHub Actions CI workflow verifying test, lint, typecheck, and build on Node 20.x.
  - Framework security baseline on Next.js 15.5.21 (Maintenance LTS) and React 19.0.0.
