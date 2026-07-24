import test from "node:test";
import assert from "node:assert/strict";
import { requireAllowedUser } from "./require-allowed-user";
import type { SupabaseClient } from "@supabase/supabase-js";

test("requireAllowedUser: Missing database/Supabase configuration returns 503", async () => {
  const result = await requireAllowedUser(null);
  assert.equal(result.authorized, false);
  assert.equal(result.user, null);
  assert.equal(result.supabase, null);
  assert.equal(result.response.status, 503);
  const body = await result.response.json();
  assert.equal(body.error, "Database not configured");
});

test("requireAllowedUser: No authenticated user returns 401", async () => {
  const mockClient = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
  };
  const result = await requireAllowedUser(mockClient as unknown as SupabaseClient);
  assert.equal(result.authorized, false);
  assert.equal(result.user, null);
  assert.equal(result.supabase, null);
  assert.equal(result.response.status, 401);
  const body = await result.response.json();
  assert.equal(body.error, "Authentication required");
});

test("requireAllowedUser: getUser() session error returns 401", async () => {
  const mockClient = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: new Error("Session expired") }),
    },
  };
  const result = await requireAllowedUser(mockClient as unknown as SupabaseClient);
  assert.equal(result.authorized, false);
  assert.equal(result.user, null);
  assert.equal(result.supabase, null);
  assert.equal(result.response.status, 401);
  const body = await result.response.json();
  assert.equal(body.error, "Authentication required");
});

test("requireAllowedUser: Authenticated user without email returns 403", async () => {
  const origEmails = process.env.APP_ALLOWED_EMAILS;
  process.env.APP_ALLOWED_EMAILS = "owner@example.com";
  try {
    const mockClient = {
      auth: {
        getUser: async () => ({ data: { user: { id: "user-123", email: null } }, error: null }),
      },
    };
    const result = await requireAllowedUser(mockClient as unknown as SupabaseClient);
    assert.equal(result.authorized, false);
    assert.equal(result.user, null);
    assert.equal(result.supabase, null);
    assert.equal(result.response.status, 403);
    const body = await result.response.json();
    assert.equal(body.error, "Access denied");
  } finally {
    process.env.APP_ALLOWED_EMAILS = origEmails;
  }
});

test("requireAllowedUser: Authenticated user not on allowlist returns 403", async () => {
  const origEmails = process.env.APP_ALLOWED_EMAILS;
  process.env.APP_ALLOWED_EMAILS = "owner@example.com";
  try {
    const mockClient = {
      auth: {
        getUser: async () => ({ data: { user: { id: "user-456", email: "unauthorized@example.com" } }, error: null }),
      },
    };
    const result = await requireAllowedUser(mockClient as unknown as SupabaseClient);
    assert.equal(result.authorized, false);
    assert.equal(result.user, null);
    assert.equal(result.supabase, null);
    assert.equal(result.response.status, 403);
    const body = await result.response.json();
    assert.equal(body.error, "Access denied");
  } finally {
    process.env.APP_ALLOWED_EMAILS = origEmails;
  }
});

test("requireAllowedUser: Empty allowlist returns 403", async () => {
  const origEmails = process.env.APP_ALLOWED_EMAILS;
  const orig1 = process.env.APP_ALLOWED_EMAIL_1;
  const orig2 = process.env.APP_ALLOWED_EMAIL_2;
  delete process.env.APP_ALLOWED_EMAILS;
  delete process.env.APP_ALLOWED_EMAIL_1;
  delete process.env.APP_ALLOWED_EMAIL_2;

  try {
    const mockClient = {
      auth: {
        getUser: async () => ({ data: { user: { id: "user-123", email: "owner@example.com" } }, error: null }),
      },
    };
    const result = await requireAllowedUser(mockClient as unknown as SupabaseClient);
    assert.equal(result.authorized, false);
    assert.equal(result.user, null);
    assert.equal(result.supabase, null);
    assert.equal(result.response.status, 403);
    const body = await result.response.json();
    assert.equal(body.error, "Access denied");
  } finally {
    process.env.APP_ALLOWED_EMAILS = origEmails;
    process.env.APP_ALLOWED_EMAIL_1 = orig1;
    process.env.APP_ALLOWED_EMAIL_2 = orig2;
  }
});

test("requireAllowedUser: Authenticated allowlisted user succeeds and returns user + client", async () => {
  const origEmails = process.env.APP_ALLOWED_EMAILS;
  process.env.APP_ALLOWED_EMAILS = "owner@example.com";

  try {
    const mockUser = { id: "user-789", email: "owner@example.com" };
    const mockClient = {
      auth: {
        getUser: async () => ({ data: { user: mockUser }, error: null }),
      },
      from: () => ({}),
    };
    const result = await requireAllowedUser(mockClient as unknown as SupabaseClient);
    assert.equal(result.authorized, true);
    assert.equal(result.response, null);
    assert.deepEqual(result.user, mockUser as unknown);
    assert.equal(result.supabase, mockClient as unknown);
  } finally {
    process.env.APP_ALLOWED_EMAILS = origEmails;
  }
});
