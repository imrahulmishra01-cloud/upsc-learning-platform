import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const API_DIR = path.join(process.cwd(), "src", "app", "api");
const MATRIX_PATH = path.join(process.cwd(), "docs", "API_SECURITY_MATRIX.md");

// Allowed exceptions to ALLOWLIST_REQUIRED:
// 1. POST /api/auth/check-email -> PUBLIC_UNAUTHENTICATED
// 2. POST /api/auth/signout -> AUTHENTICATED_SESSION
const PUBLIC_EXCEPTIONS: Record<string, string[]> = {
  "/api/auth/check-email": ["POST"],
  "/api/auth/signout": ["POST"],
};

function getAllRouteFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllRouteFiles(filePath));
    } else if (file === "route.ts") {
      results.push(filePath);
    }
  }
  return results;
}

function getRoutePathFromFile(filePath: string): string {
  const relative = path.relative(API_DIR, filePath);
  const dirName = path.dirname(relative);
  if (dirName === ".") return "/api";
  return "/api/" + dirName.replace(/\\/g, "/");
}

function getExportedHttpMethods(fileContent: string): string[] {
  const methods = ["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD", "OPTIONS"];
  const exported: string[] = [];
  for (const m of methods) {
    const regex = new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b`);
    if (regex.test(fileContent)) {
      exported.push(m);
    }
  }
  return exported;
}

test("Route Coverage Audit: All API route.ts files are covered in docs/API_SECURITY_MATRIX.md", () => {
  assert.equal(fs.existsSync(MATRIX_PATH), true, "docs/API_SECURITY_MATRIX.md must exist");
  const matrixContent = fs.readFileSync(MATRIX_PATH, "utf8");

  const routeFiles = getAllRouteFiles(API_DIR);
  assert.ok(routeFiles.length > 0, "Should find API route files");

  for (const file of routeFiles) {
    const routePath = getRoutePathFromFile(file);
    assert.ok(
      matrixContent.includes(routePath),
      `Route ${routePath} is missing from docs/API_SECURITY_MATRIX.md`
    );
  }
});

test("Route Coverage Audit: Every ALLOWLIST_REQUIRED route method invokes requireAllowedUser()", () => {
  const routeFiles = getAllRouteFiles(API_DIR);

  for (const file of routeFiles) {
    const routePath = getRoutePathFromFile(file);
    const content = fs.readFileSync(file, "utf8");
    const exportedMethods = getExportedHttpMethods(content);

    const exceptionMethods = PUBLIC_EXCEPTIONS[routePath] || [];

    for (const method of exportedMethods) {
      if (exceptionMethods.includes(method)) {
        continue; // Permitted exception
      }

      // Must call requireAllowedUser()
      assert.ok(
        content.includes("requireAllowedUser()"),
        `Route ${method} ${routePath} in ${file} does not call requireAllowedUser()`
      );
    }
  }
});

test("Route Coverage Audit: No API route imports createAdminClient or SUPABASE_SERVICE_ROLE_KEY", () => {
  const routeFiles = getAllRouteFiles(API_DIR);

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, "utf8");
    const routePath = getRoutePathFromFile(file);

    assert.ok(
      !content.includes("createAdminClient"),
      `Route ${routePath} illegally imports createAdminClient`
    );
    assert.ok(
      !content.includes("SUPABASE_SERVICE_ROLE_KEY"),
      `Route ${routePath} illegally references SUPABASE_SERVICE_ROLE_KEY`
    );
  }
});
