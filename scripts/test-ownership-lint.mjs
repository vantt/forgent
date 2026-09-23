import fs from 'node:fs';
import path from 'node:path';
import { MANIFEST } from '../test/test-ownership.mjs';
import { validateManifest } from './test-select.mjs';
import { isMainModule } from './lib/is-main-module.mjs';

export function lintManifest(manifest = MANIFEST, cwd = process.cwd()) {
  let hasBlock = false;
  let hasWarn = false;

  const { valid, errors } = validateManifest(manifest, { repoRoot: cwd });
  if (!valid) {
    for (const err of errors) {
      console.error(`Block: ${err}`);
      hasBlock = true;
    }
  }

  const directTestFiles = new Set();
  
  for (const rule of manifest) {
    if (rule.directTests && Array.isArray(rule.directTests)) {
      for (const testFile of rule.directTests) {
        directTestFiles.add(testFile);
      }
    }
  }

  // Check orphaned test/direct/* files
  const directTestDir = path.resolve(cwd, 'test/direct');
  if (fs.existsSync(directTestDir)) {
    const files = fs.readdirSync(directTestDir).filter(f => f.endsWith('.test.mjs') || f.endsWith('.mjs'));
    for (const f of files) {
      const relPath = `test/direct/${f}`;
      if (!directTestFiles.has(relPath)) {
        console.warn(`Warn: Orphaned test file not referenced in manifest: ${relPath}`);
        hasWarn = true;
      }
    }
  }

  if (hasBlock) {
    if (process.env.NODE_ENV !== 'test') {
      console.error("Lint failed with blocking errors.");
      process.exit(1);
    }
    throw new Error("Lint failed with blocking errors.");
  }

  if (hasWarn) {
    console.log("Lint passed with warnings.");
  } else {
    console.log("Lint passed cleanly.");
  }
}

if (isMainModule(import.meta.url)) lintManifest();
