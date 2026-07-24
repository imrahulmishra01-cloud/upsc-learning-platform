-- =============================================================================
-- Example Database Seed Bootstrap
-- UPSC Prep App — Self-Hosted Edition
-- =============================================================================
-- IMPORTANT:
-- This is an EXAMPLE seed template. Do NOT commit real production emails.
-- Replace the placeholder email addresses below with the exact normalized
-- (trimmed, lowercase) email addresses configured in your server's
-- APP_ALLOWED_EMAILS environment variable.
-- =============================================================================

-- Seed initial allowed users table (must match APP_ALLOWED_EMAILS environment variable)
INSERT INTO allowed_users (email, role, is_active) VALUES
  ('owner@example.com',       'owner',       true),
  ('second-user@example.com', 'second_user', true)
ON CONFLICT (email) DO UPDATE SET
  role      = EXCLUDED.role,
  is_active = EXCLUDED.is_active;
