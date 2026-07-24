# Self-Hosting Guide — UPSC Prep Platform

This guide provides complete instructions for self-hosting the UPSC Prep platform, configuring Cloudflare R2 object storage, applying database migrations, and managing access control.

---

## Prerequisites

* **Node.js**: `v18.x` or `v20.x` (LTS recommended)
* **Package Manager**: `npm` v9+
* **Database & Auth**: Free-tier or self-hosted [Supabase](https://supabase.com) project
* **Storage**: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) bucket
* **AI Evaluation (Optional)**: [Google AI Studio](https://aistudio.google.com/) Gemini API key

---

## 1. Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### Access Control Configuration

Configure the server-side email allowlist using comma-separated values:

```env
APP_ALLOWED_EMAILS=owner@example.com,second-user@example.com
```

* **Formatting**: Comma-separated. Spaces around emails are automatically trimmed, and addresses are converted to lowercase.
* **Security**: `APP_ALLOWED_EMAILS` is a server-only variable. Do NOT add `NEXT_PUBLIC_` to this key.

---

## 2. Supabase Database & Auth Configuration

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Under **Authentication → Settings**:
   * Enable **Email** provider.
   * Enable **Magic Link / OTP**.
   * Set **Redirect URL** to `https://your-domain.example/auth/callback`.
3. In **SQL Editor**, execute the migration scripts located in `supabase/migrations/` sequentially:
   * `20240001_phase2a_foundation.sql`
   * `20240002_phase2b_planner_dashboard.sql`
   * `20240003_phase3a_material_vault.sql`
   * `20240004_phase3c_reading_tracker_notes.sql`
   * `20240005_required_reading_matrix.sql`
4. Execute `supabase/seed.example.sql` in the SQL Editor after editing it to insert your matching allowlist email addresses into the `allowed_users` database table.

> ⚠️ **Database Sync Requirement:** The email addresses configured in `APP_ALLOWED_EMAILS` must also exist in the `allowed_users` database table with `is_active = true`.

---

## 3. Cloudflare R2 Bucket & CORS Configuration

The platform uses Cloudflare R2 for storing private study materials (PDFs, notes, documents).

### Step A: Bucket Creation
1. Log in to the Cloudflare Dashboard → **R2**.
2. Click **Create bucket** and enter your bucket name (e.g., `upsc-prep-materials`).
3. Keep the bucket **Private** (do NOT enable public R2 domain access).

### Step B: R2 API Credentials
1. In Cloudflare R2 Dashboard, click **Manage R2 API Tokens**.
2. Click **Create API Token** with `Object Read & Write` permissions for your specific bucket.
3. Copy the **Account ID**, **Access Key ID**, and **Secret Access Key** into `.env.local`:

```env
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=upsc-prep-materials
```

### Step C: R2 CORS Policy (Required for Presigned Browser Uploads)
Direct browser-to-R2 presigned uploads (`PUT`) will fail with CORS errors unless CORS rules are explicitly applied to your R2 bucket.

1. Go to Cloudflare R2 Dashboard → Select your bucket → **Settings** → **CORS Policy**.
2. Add the following JSON configuration (replace origins with your production URL):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-domain.example"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD",
      "PUT"
    ],
    "AllowedHeaders": [
      "Content-Type"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

> ⚠️ **CORS Security Warning:** Do NOT use wildcard `"*"` origins in production. Always specify exact production domain origins.

---

## 4. Storage Specifications & Limits

* **Presigned URL Expiry**: 3600 seconds (1 hour).
* **Max Upload File Size**: Default `50 MB` (configurable via `R2_UPLOAD_MAX_MB`).
* **Allowed Extensions**: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.txt`, `.docx`, `.doc`, `.pptx`, `.xlsx`.
* **Path Traversal Protection**: Storage object keys are generated server-side in the format `${userId}/${timestamp}-${randomStr}.${ext}`.

---

## 5. Local Development & Production Build

### Run Locally
```bash
npm ci
npm run dev
```

### Production Build
```bash
npm run lint
npm run build
npm start
```
