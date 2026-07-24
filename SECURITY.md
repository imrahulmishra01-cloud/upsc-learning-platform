# Security Policy

## Supported Versions

Only the latest published release line of the **UPSC Learning Platform** receives security updates and patches.

| Version Line | Supported |
| :--- | :--- |
| `0.1.x` | Yes |
| `< 0.1.0` | No |

---

## Reporting a Vulnerability

> [!IMPORTANT]
> **Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

If you discover a potential security vulnerability in this repository, please report it privately:

1. Use **GitHub Private Vulnerability Reporting** via the **Security** tab on the repository (when enabled).
2. Alternatively, submit a report via **GitHub Security Advisory** private report.

### Information to Include in Your Report
To help maintainers evaluate and address the issue efficiently, please include:

- **Component:** The affected page, API route, helper library, or configuration file.
- **Description:** A detailed explanation of the vulnerability.
- **Reproduction Steps:** Step-by-step instructions or proof-of-concept payload to reproduce the issue safely.
- **Potential Impact:** Estimated risk severity (e.g., unauthorized data access, IDOR, authorization bypass).
- **Remediation:** Suggested fix or patch, if known.

---

## Expected Response & Maintainer Process

- **Acknowledgement:** Maintainers will review private vulnerability submissions and acknowledge receipt as promptly as maintainer availability permits.
- **Assessment:** Submissions will be triaged and evaluated against the platform threat model.
- **Patch & Advisory:** Confirmed vulnerabilities will be patched in the repository, accompanied by a public security advisory when appropriate.

---

## Self-Hoster & Deployer Responsibilities

This repository is distributed as open-source software for self-hosted deployment. The public repository provides **no access** to any maintainer-operated production server, live database, or user data.

Self-hosters are responsible for securing their own deployment environments:

1. **Secrets & Credentials Management:** Never commit `.env.local` or production API keys to version control. Store credentials securely in your hosting provider's environment settings.
2. **Service Role Keys:** Keep `SUPABASE_SERVICE_ROLE_KEY` confidential and out of web application routes. Never expose service-role credentials to browser clients.
3. **Allowlist Synchronization:** Ensure `APP_ALLOWED_EMAILS` in application environment settings and database allowlist tables remain synchronized. Revoke active sessions promptly when removing users.
4. **Cloudflare R2 Bucket Security:** Configure private R2 bucket access permissions and restrict bucket CORS origins exclusively to your trusted domain.
5. **Database Row-Level Security (RLS):** Verify that Supabase PostgreSQL RLS policies are enabled on all custom tables before deploying.
6. **Dependency Maintenance:** Keep server runtime, Node.js packages, and framework dependencies updated to receive security releases.
