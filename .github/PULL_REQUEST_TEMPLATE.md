## Summary of Changes

Provide a brief explanation of what this pull request changes and why.

---

## Type of Change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Security / Authorization hardening
- [ ] Documentation update
- [ ] Database migration

---

## Local Verification Checklist

Confirm that all local validation checks pass on your branch before requesting review:

- [ ] `npm ci` installed dependencies without errors.
- [ ] `npm test` passed with zero failures (24/24 unit tests passing).
- [ ] `npm run lint` reported zero ESLint warnings or errors.
- [ ] `npm run typecheck` completed with zero TypeScript errors (`npx tsc --noEmit`).
- [ ] `npm run build` completed successfully generating all pages.
- [ ] No API keys, passwords, environment secrets, or real user data are included in commits.
- [ ] Updated [docs/API_SECURITY_MATRIX.md](docs/API_SECURITY_MATRIX.md) if API endpoints or methods were modified.
- [ ] Verified Row-Level Security (RLS) implications if database schema or queries were changed.
