import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const API_DIR = path.join(process.cwd(), "src", "app", "api");

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

test("IDOR & Ownership Audit: No user-data route trusts client-supplied user_id for mutation inserts or updates", () => {
  const routeFiles = getAllRouteFiles(API_DIR);

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, "utf8");
    // Skip static catalog seed ingest route which hardcodes server-side NCERT metadata
    if (file.includes("ingest\\ncert") || file.includes("ingest/ncert")) {
      continue;
    }

    // If file performs insert
    if (content.includes("insert(")) {
      if (content.includes("user_id")) {
        const matchesDerivedUser = /user_id\s*:\s*user\.id/.test(content);
        assert.ok(
          matchesDerivedUser,
          `File ${file} inserts user_id without deriving from authenticated user.id`
        );
      }
    }

    // If file performs update or delete
    if (content.includes("update(") || content.includes("delete(")) {
      const enforcesUserFilter = content.includes('.eq("user_id", user.id)') || /user_id\s*:\s*user\.id/.test(content);
      assert.ok(
        enforcesUserFilter,
        `File ${file} performs mutation without enforcing user.id filter`
      );
    }
  }
});

test("IDOR & Ownership Audit: PATCH routes delete or strip client-supplied user_id overrides", () => {
  const routeFiles = getAllRouteFiles(API_DIR);

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, "utf8");
    if (content.includes("export async function PATCH") && content.includes("update(")) {
      assert.ok(
        content.includes('.eq("user_id", user.id)') || content.includes("delete updates.user_id"),
        `File ${file} PATCH handler does not enforce user_id isolation`
      );
    }
  }
});

test("IDOR & Ownership Audit: Material completion & download verify file record ownership", () => {
  const completeUploadPath = path.join(API_DIR, "materials", "complete-upload", "route.ts");
  const downloadPath = path.join(API_DIR, "materials", "download", "route.ts");

  const completeUploadContent = fs.readFileSync(completeUploadPath, "utf8");
  const downloadContent = fs.readFileSync(downloadPath, "utf8");

  assert.ok(
    completeUploadContent.includes('.eq("user_id", user.id)'),
    "complete-upload route must restrict file lookup to authenticated user.id"
  );
  assert.ok(
    downloadContent.includes("uploaded_files") && downloadContent.includes("requireAllowedUser()"),
    "download route must enforce RLS or explicit user ownership lookup before issuing signed download URL"
  );
});
