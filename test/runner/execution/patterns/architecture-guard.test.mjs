import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PATTERNS_DIR = path.resolve('src/runner/execution/patterns');

const FORBIDDEN_IMPORT_PATTERNS = [
  /from\s+['"][^'"]*\/state\//,
  /from\s+['"][^'"]*\/runner\/coordination\//,
  /from\s+['"][^'"]*\/runner\/dispatch\//,
  /from\s+['"][^'"]*\/runner\/worktree(?:\.mjs)?['"]/,
  /from\s+['"][^'"]*\/runner\/merge(?:\.mjs)?['"]/,
  /import\s*\(\s*['"][^'"]*\/state\//,
  /import\s*\(\s*['"][^'"]*\/runner\/coordination\//,
  /import\s*\(\s*['"][^'"]*\/runner\/dispatch\//,
  /import\s*\(\s*['"][^'"]*\/runner\/worktree(?:\.mjs)?['"]/,
  /import\s*\(\s*['"][^'"]*\/runner\/merge(?:\.mjs)?['"]/,
];

test('architecture-guard: pattern modules do not import forbidden modules (A4 boundary)', () => {
  const files = fs.readdirSync(PATTERNS_DIR).filter((f) => f.endsWith('.mjs') || f.endsWith('.js'));
  assert.ok(files.length >= 5, `Expected at least 5 pattern files, found ${files.length}`);

  for (const file of files) {
    const filePath = path.join(PATTERNS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
      assert.equal(
        pattern.test(content),
        false,
        `File ${file} contains forbidden import matching ${pattern}`,
      );
    }
  }
});
