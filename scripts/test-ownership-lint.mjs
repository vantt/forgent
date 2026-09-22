import fs from 'node:fs';
import path from 'node:path';
import { MANIFEST } from '../test/test-ownership.mjs';
import { validateManifest } from './test-select.mjs';

function lintManifest() {
  let hasBlock = false;
  let hasWarn = false;

  const { valid, errors } = validateManifest(MANIFEST);
  if (!valid) {
    for (const err of errors) {
      console.error(`Block: ${err}`);
      hasBlock = true;
    }
  }

  const directTestFiles = new Set();
  
  for (const rule of MANIFEST) {
    if (rule.directTests && Array.isArray(rule.directTests)) {
      for (const testFile of rule.directTests) {
        directTestFiles.add(testFile);
      }
    }
  }

  // Check orphaned test/direct/* files
  const directTestDir = path.resolve('test/direct');
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
    console.error("Lint failed with blocking errors.");
    process.exit(1);
  }

  if (hasWarn) {
    console.log("Lint passed with warnings.");
  } else {
    console.log("Lint passed cleanly.");
  }
}

lintManifest();
