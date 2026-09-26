#!/usr/bin/env node
// check-doc-inventory-gates.mjs -- validates a Phase 02 doc-inventory artifact
// (generate-doc-inventory.mjs output) against the plan §7 Phase 02 gates and
// the plan §6.1 claim-and-disposition vocabulary's mechanical constraints
// (requiresTargetOwner / requiresRationale / allowedFileClasses).
//
// Fatal (exit 1): structural corruption, an in-scope file missing from the
// inventory or listed twice, a disposition outside the vocabulary, or a
// disposition used without a required target owner / rationale / allowed
// file class.
//
// Non-fatal (reported, exit 0): gap rows (`unknown-blocking`) and duplicate-
// content groups. Phase 02's gate is that conflicts and gaps are EXPLICIT,
// not that none exist (plan.md §7 Phase 02 Gate) -- later phases resolve them.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { isMainModule } from './lib/is-main-module.mjs';
import { normalizePosix } from './generate-shipped-path-inventory.mjs';
import { SCAN_ROOTS, ADDITIONAL_ROOT_FILES, parseLsTreeLong } from './generate-doc-inventory.mjs';

/**
 * Independently recomputes the in-scope file count directly from the commit
 * tree (deliberately not calling generate-doc-inventory.mjs's own scan
 * function) so a bug shared between generator and checker cannot mask a
 * missing/duplicated file.
 */
export function recomputeInScopePaths(repoRoot, commitSha) {
  const out = execFileSync('git', ['ls-tree', '-r', '--name-only', commitSha], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 60 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const all = out.split('\n').filter(Boolean).map(normalizePosix);
  return all.filter((p) => ADDITIONAL_ROOT_FILES.includes(p) || SCAN_ROOTS.some((root) => p === root || p.startsWith(root + '/')));
}

export function validateStructure(inventory) {
  const findings = [];
  if (!inventory || typeof inventory !== 'object') {
    return [{ type: 'malformed-inventory', message: 'Inventory root must be an object' }];
  }
  if (!Array.isArray(inventory.items)) {
    return [{ type: 'malformed-inventory', message: '"items" must be an array' }];
  }

  const seenPaths = new Set();
  for (const [idx, item] of inventory.items.entries()) {
    if (!item || typeof item !== 'object') {
      findings.push({ type: 'malformed-item', message: `items[${idx}] must be an object` });
      continue;
    }
    if (typeof item.path !== 'string' || item.path.length === 0) {
      findings.push({ type: 'malformed-item', path: item.path, message: `items[${idx}] missing path` });
      continue;
    }
    if (seenPaths.has(item.path)) {
      findings.push({ type: 'duplicate-path', path: item.path, message: `${item.path}: appears more than once in inventory (file-level accounting must be exactly once)` });
    }
    seenPaths.add(item.path);

    for (const field of ['area', 'authorityStatus', 'fileClass', 'corpus', 'proposedDisposition']) {
      if (typeof item[field] !== 'string' || item[field].length === 0) {
        findings.push({ type: 'malformed-item', path: item.path, message: `${item.path}: missing or empty required field "${field}"` });
      }
    }
    if (!Array.isArray(item.headings)) {
      findings.push({ type: 'malformed-item', path: item.path, message: `${item.path}: "headings" must be an array (source-coverage floor)` });
    } else {
      for (const [hIdx, h] of item.headings.entries()) {
        if (!h || typeof h.anchor !== 'string' || h.anchor.length === 0) {
          findings.push({ type: 'malformed-heading', path: item.path, message: `${item.path}: headings[${hIdx}] missing a non-empty anchor` });
        }
      }
    }
  }

  if (typeof inventory.summary?.scannedFilesCount === 'number' && inventory.summary.scannedFilesCount !== inventory.items.length) {
    findings.push({
      type: 'summary-mismatch',
      message: `summary.scannedFilesCount (${inventory.summary.scannedFilesCount}) does not match items.length (${inventory.items.length})`,
    });
  }

  return findings;
}

export function validateAgainstVocabulary(inventory, vocabulary) {
  const findings = [];
  const dispositionsById = new Map((vocabulary?.sourceDispositions || []).map((d) => [d.id, d]));
  const RECOGNIZED_FILE_CLASSES = new Set(['maintained-authority', 'retained-source', 'generated', 'history-evidence']);

  for (const item of inventory.items || []) {
    const disposition = dispositionsById.get(item.proposedDisposition);
    if (!disposition) {
      findings.push({ type: 'unknown-disposition', path: item.path, message: `${item.path}: proposedDisposition "${item.proposedDisposition}" is not in the plan §6.1 vocabulary` });
      continue;
    }
    if (disposition.requiresTargetOwner && (!item.proposedTargetOwner || typeof item.proposedTargetOwner !== 'string')) {
      findings.push({ type: 'missing-target-owner', path: item.path, message: `${item.path}: disposition "${item.proposedDisposition}" requires proposedTargetOwner` });
    }
    if (disposition.requiresRationale && (!item.proposedRationale || typeof item.proposedRationale !== 'string')) {
      findings.push({ type: 'missing-rationale', path: item.path, message: `${item.path}: disposition "${item.proposedDisposition}" requires proposedRationale` });
    }
    if (
      Array.isArray(disposition.allowedFileClasses) &&
      RECOGNIZED_FILE_CLASSES.has(item.fileClass) &&
      !disposition.allowedFileClasses.includes(item.fileClass)
    ) {
      findings.push({
        type: 'file-class-not-allowed-for-disposition',
        path: item.path,
        message: `${item.path}: fileClass "${item.fileClass}" is not allowed for disposition "${item.proposedDisposition}" (allowed: ${disposition.allowedFileClasses.join(', ')})`,
      });
    }
  }
  return findings;
}

export function checkInventory({ repoRoot, inventory, vocabulary }) {
  const fatalFindings = [
    ...validateStructure(inventory),
    ...validateAgainstVocabulary(inventory, vocabulary),
  ];

  let coverageFindings = [];
  if (fatalFindings.length === 0 && inventory.commit) {
    const expected = recomputeInScopePaths(repoRoot, inventory.commit).sort();
    const actual = inventory.items.map((i) => i.path).sort();
    const expectedSet = new Set(expected);
    const actualSet = new Set(actual);
    for (const p of expected) {
      if (!actualSet.has(p)) {
        coverageFindings.push({ type: 'missing-from-inventory', path: p, message: `${p}: in-scope at commit ${inventory.commit} but absent from inventory` });
      }
    }
    for (const p of actual) {
      if (!expectedSet.has(p)) {
        coverageFindings.push({ type: 'not-in-scope', path: p, message: `${p}: present in inventory but not in-scope at commit ${inventory.commit} (stale or out-of-scope entry)` });
      }
    }
  }

  const gapItems = (inventory.items || []).filter((i) => i.gap);
  const duplicateGroups = inventory.duplicateContentGroups || [];

  const allFatal = [...fatalFindings, ...coverageFindings];

  return {
    clean: allFatal.length === 0,
    fatalFindings: allFatal,
    explicitOpenFindings: {
      gapCount: gapItems.length,
      gapPaths: gapItems.map((i) => i.path),
      duplicateContentGroupCount: duplicateGroups.length,
      duplicateContentGroups: duplicateGroups,
    },
  };
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export const DEFAULT_INVENTORY_PATH = 'plans/260925-documentation-authority-unification/phase-02-doc-inventory.json';
export const DEFAULT_VOCABULARY_PATH = 'plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json';

export function runCli(argv, cwd = process.cwd()) {
  const inventoryIdx = argv.indexOf('--inventory');
  const vocabIdx = argv.indexOf('--vocabulary');
  const repoRootIdx = argv.indexOf('--repo-root');

  const inventoryPath = path.resolve(cwd, inventoryIdx >= 0 ? argv[inventoryIdx + 1] : DEFAULT_INVENTORY_PATH);
  const vocabularyPath = path.resolve(cwd, vocabIdx >= 0 ? argv[vocabIdx + 1] : DEFAULT_VOCABULARY_PATH);
  const repoRoot = path.resolve(cwd, repoRootIdx >= 0 ? argv[repoRootIdx + 1] : cwd);
  const asJson = argv.includes('--json');

  let inventory;
  let vocabulary;
  try {
    inventory = loadJson(inventoryPath);
    vocabulary = loadJson(vocabularyPath);
  } catch (err) {
    console.error(`check-doc-inventory-gates error loading input: ${err.message}`);
    return 1;
  }

  let result;
  try {
    result = checkInventory({ repoRoot, inventory, vocabulary });
  } catch (err) {
    console.error(`check-doc-inventory-gates evaluation error: ${err.message}`);
    return 1;
  }

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return result.clean ? 0 : 1;
  }

  if (!result.clean) {
    console.error(`check-doc-inventory-gates: ${result.fatalFindings.length} fatal finding(s):`);
    for (const f of result.fatalFindings) {
      console.error(`  - [${f.type}] ${f.message}`);
    }
    return 1;
  }

  console.log(
    `check-doc-inventory-gates: structural and vocabulary gates pass. ` +
    `Explicit open findings (not blocking Phase 02, must be resolved before Phase 05): ` +
    `${result.explicitOpenFindings.gapCount} gap(s), ${result.explicitOpenFindings.duplicateContentGroupCount} duplicate-content group(s).`
  );
  return 0;
}

if (isMainModule(import.meta.url)) {
  process.exitCode = runCli(process.argv.slice(2), process.cwd());
}
