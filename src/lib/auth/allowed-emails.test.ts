import test from "node:test";
import assert from "node:assert/strict";
import {
  getAllowedEmails,
  isEmailAllowed,
  hasConfiguredAllowlist,
  getMaskedAllowedEmails,
} from "./allowed-emails";

test("Allowlist Parsing: Comma-separated entries with whitespace and uppercase", () => {
  const original = process.env.APP_ALLOWED_EMAILS;
  try {
    process.env.APP_ALLOWED_EMAILS = " Owner@Example.com , SECOND-USER@EXAMPLE.COM ";
    delete process.env.APP_ALLOWED_EMAIL_1;
    delete process.env.APP_ALLOWED_EMAIL_2;

    const emails = getAllowedEmails();
    assert.deepEqual(emails, ["owner@example.com", "second-user@example.com"]);
    assert.equal(hasConfiguredAllowlist(), true);
    assert.equal(isEmailAllowed("owner@example.com"), true);
    assert.equal(isEmailAllowed("OWNER@EXAMPLE.COM"), true);
    assert.equal(isEmailAllowed("  second-user@example.com  "), true);
    assert.equal(isEmailAllowed("unauthorized@example.com"), false);
  } finally {
    process.env.APP_ALLOWED_EMAILS = original;
  }
});

test("Allowlist Parsing: Duplicate removal and normalization", () => {
  const original = process.env.APP_ALLOWED_EMAILS;
  try {
    process.env.APP_ALLOWED_EMAILS = "user@example.com, USER@example.com , user@example.com";
    delete process.env.APP_ALLOWED_EMAIL_1;
    delete process.env.APP_ALLOWED_EMAIL_2;

    const emails = getAllowedEmails();
    assert.deepEqual(emails, ["user@example.com"]);
  } finally {
    process.env.APP_ALLOWED_EMAILS = original;
  }
});

test("Allowlist Parsing: Legacy numbered-variable compatibility merge", () => {
  const origEmails = process.env.APP_ALLOWED_EMAILS;
  const orig1 = process.env.APP_ALLOWED_EMAIL_1;
  const orig2 = process.env.APP_ALLOWED_EMAIL_2;
  try {
    process.env.APP_ALLOWED_EMAILS = "primary@example.com";
    process.env.APP_ALLOWED_EMAIL_1 = "legacy1@example.com";
    process.env.APP_ALLOWED_EMAIL_2 = "primary@example.com"; // Duplicate should be merged

    const emails = getAllowedEmails();
    assert.deepEqual(emails, ["primary@example.com", "legacy1@example.com"]);
    assert.equal(isEmailAllowed("legacy1@example.com"), true);
  } finally {
    process.env.APP_ALLOWED_EMAILS = origEmails;
    process.env.APP_ALLOWED_EMAIL_1 = orig1;
    process.env.APP_ALLOWED_EMAIL_2 = orig2;
  }
});

test("Allowlist Parsing: Empty configuration fails closed", () => {
  const origEmails = process.env.APP_ALLOWED_EMAILS;
  const orig1 = process.env.APP_ALLOWED_EMAIL_1;
  const orig2 = process.env.APP_ALLOWED_EMAIL_2;
  try {
    delete process.env.APP_ALLOWED_EMAILS;
    delete process.env.APP_ALLOWED_EMAIL_1;
    delete process.env.APP_ALLOWED_EMAIL_2;

    assert.equal(hasConfiguredAllowlist(), false);
    assert.equal(isEmailAllowed("anyone@example.com"), false);
    assert.equal(isEmailAllowed(""), false);
    assert.equal(isEmailAllowed(null), false);
  } finally {
    process.env.APP_ALLOWED_EMAILS = origEmails;
    process.env.APP_ALLOWED_EMAIL_1 = orig1;
    process.env.APP_ALLOWED_EMAIL_2 = orig2;
  }
});

test("Allowlist Masking: getMaskedAllowedEmails masks local part", () => {
  const origEmails = process.env.APP_ALLOWED_EMAILS;
  try {
    process.env.APP_ALLOWED_EMAILS = "owner@example.com, second-user@example.com";
    delete process.env.APP_ALLOWED_EMAIL_1;
    delete process.env.APP_ALLOWED_EMAIL_2;

    const masked = getMaskedAllowedEmails();
    assert.deepEqual(masked, ["o***@example.com", "s***@example.com"]);
  } finally {
    process.env.APP_ALLOWED_EMAILS = origEmails;
  }
});
