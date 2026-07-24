import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

function findTestFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'coverage' || entry.name.startsWith('.')) {
        continue;
      }
      results = results.concat(findTestFiles(fullPath));
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const testFiles = findTestFiles(srcDir).sort();

if (testFiles.length === 0) {
  console.error('Error: No test files (.test.ts / .test.tsx) found under src/');
  process.exit(1);
}

console.log(`Discovered ${testFiles.length} test file(s). Running tests...`);

const tsxCli = path.join(rootDir, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const args = [tsxCli, '--test', ...testFiles];

const result = spawnSync(process.execPath, args, {
  stdio: 'inherit',
  cwd: rootDir,
  env: process.env,
});

if (result.error) {
  console.error('Failed to start test runner process:', result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
