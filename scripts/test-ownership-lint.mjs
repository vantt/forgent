import fs from 'node:fs';
import path from 'node:path';
import { validateManifest } from './test-select.mjs';

function lintManifest() {
  let hasBlock = false;
  let hasWarn = false;

  const manifestPath = path.resolve(process.argv[2] || "test-ownership.manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error(`Block: Manifest missing at ${manifestPath}`);
    process.exit(1);
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    console.error(`Block: Manifest JSON invalid: ${err.message}`);
    process.exit(1);
  }

  // Check valid schema structure
  if (!manifest.rules || !Array.isArray(manifest.rules)) {
    console.error(`Block: Manifest schema invalid: missing "rules" array`);
    process.exit(1);
  }

  const directTestFiles = new Set();
  
  for (const rule of manifest.rules) {
    if (!rule.directTests || !Array.isArray(rule.directTests)) {
      console.error(`Block: Rule for ${rule.pathPrefix} missing directTests array`);
      hasBlock = true;
      continue;
    }

    for (const testFile of rule.directTests) {
      directTestFiles.add(testFile);
      const absPath = path.resolve(testFile);
      if (!fs.existsSync(absPath)) {
        console.error(`Block: Rule for ${rule.pathPrefix} references non-existent test file: ${testFile}`);
        hasBlock = true;
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
