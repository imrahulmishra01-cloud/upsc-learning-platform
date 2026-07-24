import test from "node:test";
import assert from "node:assert/strict";

const protectedPrefixes = [
  "/dashboard",
  "/settings",
  "/planner",
  "/materials",
  "/pyq",
  "/reports",
  "/revision",
  "/tests",
  "/csat",
  "/current-affairs",
  "/optional",
  "/ai",
];

function evaluateMiddlewareRouting(
  pathname: string,
  user: { email?: string | null } | null,
  isEmailAllowedFn: (email: string) => boolean
): { action: "next" | "redirect"; location?: string } {
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  const isAllowlisted = !!user?.email && isEmailAllowedFn(user.email);

  if (isProtected && !user) {
    return { action: "redirect", location: "/login" };
  }

  if (isProtected && user && !isAllowlisted) {
    return { action: "redirect", location: "/login?error=access_denied" };
  }

  if (pathname === "/login" && user && isAllowlisted) {
    return { action: "redirect", location: "/dashboard" };
  }

  return { action: "next" };
}

test("Middleware Routing: Unauthenticated user on protected route redirects to /login", () => {
  const res = evaluateMiddlewareRouting("/dashboard", null, () => true);
  assert.equal(res.action, "redirect");
  assert.equal(res.location, "/login");
});

test("Middleware Routing: Authenticated unallowlisted user on protected route redirects to /login?error=access_denied", () => {
  const res = evaluateMiddlewareRouting("/planner", { email: "blocked@example.com" }, () => false);
  assert.equal(res.action, "redirect");
  assert.equal(res.location, "/login?error=access_denied");
});

test("Middleware Routing: Authenticated allowlisted user on protected route proceeds", () => {
  const res = evaluateMiddlewareRouting("/settings", { email: "allowed@example.com" }, () => true);
  assert.equal(res.action, "next");
});

test("Middleware Routing: Authenticated allowlisted user on /login redirects to /dashboard", () => {
  const res = evaluateMiddlewareRouting("/login", { email: "allowed@example.com" }, () => true);
  assert.equal(res.action, "redirect");
  assert.equal(res.location, "/dashboard");
});

test("Middleware Routing: Authenticated UNALLOWLISTED user on /login stays on /login (no redirect loop)", () => {
  const res = evaluateMiddlewareRouting("/login", { email: "blocked@example.com" }, () => false);
  assert.equal(res.action, "next");
});

test("Middleware Routing: Auth callback, assets, and unauthenticated public paths pass through", () => {
  assert.equal(evaluateMiddlewareRouting("/auth/callback", null, () => false).action, "next");
  assert.equal(evaluateMiddlewareRouting("/manifest.webmanifest", null, () => false).action, "next");
  assert.equal(evaluateMiddlewareRouting("/favicon.ico", null, () => false).action, "next");
});
