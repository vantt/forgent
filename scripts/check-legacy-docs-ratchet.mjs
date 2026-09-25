#!/usr/bin/env node
// check-legacy-docs-ratchet.mjs -- verifies that no unreviewed new maintained
// files or unaccounted edits appear under legacy documentation roots (docs/specs,
// docs/architect) during documentation unification migration (Phase 01).
//
// Invariants enforced:
// 1. No new maintained file may appear under legacy roots without an explicit
//    reviewed exception. Maintained platform documentation belongs in docs/platform/**.
// 2. No baselined legacy file may be modified without an explicit accounted
//    entry in the reviewed exceptions ledger.
// 3. No baselined file may be deleted before Phase 08 cutover.
// 4. Baseline generation is deterministic (codepoint-sorted, posix paths, sha256).

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainModule } from './lib/is-main-module.mjs';

export const DEFAULT_ROOTS = ['docs/specs', 'docs/architect'];
export const DEFAULT_BASELINE_PATH = 'scripts/check-legacy-docs-ratchet.baseline.json';
export const DEFAULT_EXCEPTIONS_PATH = 'scripts/check-legacy-docs-ratchet.exceptions.json';

export const MAINTAINED_PROSE_CLASSES = new Set([
  'maintained-authority',
  'retained-source',
]);

export const NON_AUTHORITY_PAYLOAD_CLASSES = new Set([
  'generated',
  'history-evidence',
]);

export function isMaintainedProseClass(fileClass) {
  return MAINTAINED_PROSE_CLASSES.has(fileClass);
}

const DIGEST_ALGORITHM = 'sha256';

/**
 * Normalizes a path to POSIX relative form with forward slashes.
 */
export function normalizePosix(p) {
  return p.split(path.sep).join('/');
}

/**
 * Validates whether a string is a real ISO calendar date in YYYY-MM-DD format.
 * Rejects impossible dates (e.g. 2026-02-30, 2026-13-40, 2026-02-29 on non-leap years).
 */
export function isValidIsoCalendarDate(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = str.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  if (month < 1 || month > 12) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

export const EXPLICIT_GENERATED_PROJECTIONS = new Set([
  'docs/specs/platform-foundations.md',
]);

/**
 * Classifies a legacy root file by its root, nature, and extension.
 * Deterministically recognizes curated/generated projections alongside
 * maintained authority, retained sources, and history/evidence.
 *
 * Rules (F1):
 * - Under docs/specs: every file is maintained authority by default regardless
 *   of extension or case, except explicitly enumerated generated projections.
 *   Non-authority is never inferred merely from arbitrary extensions (.txt, .yml, .MD).
 * - Under docs/architect: Markdown case-insensitively (.md) is maintained or
 *   retained prose, while non-Markdown proof payloads (e.g. proof.json) can be history-evidence.
 */
export function classifyFile(relPath) {
  const norm = normalizePosix(relPath);
  const lower = norm.toLowerCase();

  if (norm.startsWith('docs/specs/') || norm === 'docs/specs') {
    if (EXPLICIT_GENERATED_PROJECTIONS.has(norm)) {
      return 'generated';
    }
    return 'maintained-authority';
  }

  if (norm.startsWith('docs/architect/') || norm === 'docs/architect') {
    if (lower.endsWith('.md')) {
      if (norm.includes('/proposals/') || norm.includes('/roadmap/')) {
        return 'retained-source';
      }
      return 'maintained-authority';
    }
    return 'history-evidence';
  }

  return 'history-evidence';
}


/**
 * Computes sha256 digest string for a buffer or string.
 */
export function computeSha256(content) {
  return crypto.createHash(DIGEST_ALGORITHM).update(content).digest('hex');
}

/**
 * Validates baseline schema. Throws Error if malformed.
 */
export function validateBaselineSchema(baseline) {
  if (!baseline || typeof baseline !== 'object' || Array.isArray(baseline)) {
    throw new Error('Malformed baseline: root must be an object');
  }
  if (baseline.version !== 1) {
    throw new Error(`Malformed baseline: expected version 1, got ${baseline.version}`);
  }
  if (!Array.isArray(baseline.roots) || baseline.roots.length === 0) {
    throw new Error('Malformed baseline: roots must be a non-empty array');
  }
  if (!baseline.files || typeof baseline.files !== 'object' || Array.isArray(baseline.files)) {
    throw new Error('Malformed baseline: files must be an object map');
  }
  for (const [filePath, entry] of Object.entries(baseline.files)) {
    if (typeof filePath !== 'string' || filePath.length === 0) {
      throw new Error('Malformed baseline: invalid file path key');
    }
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`Malformed baseline: entry for ${filePath} must be an object`);
    }
    if (typeof entry.digest !== 'string' || !/^[0-9a-f]{64}$/.test(entry.digest)) {
      throw new Error(`Malformed baseline: entry for ${filePath} has invalid sha256 digest`);
    }
    if (typeof entry.size !== 'number' || entry.size < 0) {
      throw new Error(`Malformed baseline: entry for ${filePath} has invalid size`);
    }
    if (typeof entry.fileClass !== 'string' || entry.fileClass.length === 0) {
      throw new Error(`Malformed baseline: entry for ${filePath} has missing or invalid fileClass`);
    }
  }
  return true;
}

/**
 * Canonicalizes an exception path lexically within repo-relative POSIX syntax (R2).
 * Rejects:
 * - Empty strings
 * - Absolute paths (POSIX leading slash or Windows drive letter)
 * - Traversal sequences (.. that escape repo root or appear in path)
 * Canonicalizes:
 * - Backslashes to forward slashes
 * - Redundant ./ and repeated slashes //
 * - Strips leading ./ and trailing /
 */
export function canonicalizeExceptionPath(rawPath) {
  if (typeof rawPath !== 'string' || rawPath.trim().length === 0) {
    throw new Error('Exception path must be a non-empty string');
  }
  const posix = rawPath.replace(/\\/g, '/');

  if (posix.startsWith('/') || path.isAbsolute(rawPath) || path.win32.isAbsolute(rawPath)) {
    throw new Error(`Absolute paths are forbidden in exceptions: "${rawPath}"`);
  }

  if (posix.split('/').includes('..')) {
    throw new Error(`Path traversal is forbidden in exceptions: "${rawPath}"`);
  }

  const normalized = path.posix.normalize(posix);

  if (normalized === '..' || normalized.startsWith('../')) {
    throw new Error(`Path traversal is forbidden in exceptions: "${rawPath}"`);
  }

  const clean = normalized.replace(/^\.\//, '').replace(/\/+$/, '');
  if (!clean || clean === '.') {
    throw new Error(`Invalid exception path: "${rawPath}"`);
  }

  return clean;
}

/**
 * Validates exceptions schema. Throws Error if malformed.
 * Enforces:
 * - only 'allowed-new-file' and 'allowed-edit' (deletions are forbidden by authoring rules)
 * - unique paths across canonical POSIX forms (duplicate exceptions forbidden)
 * - non-empty rationale, approvedBy, and valid 64-hex expectedDigest
 * - rejects absolute paths and path traversal (R2)
 */
export function validateExceptionsSchema(exceptions) {
  if (!exceptions || typeof exceptions !== 'object') {
    throw new Error('Malformed exceptions: root must be an object');
  }
  if (exceptions.version !== 1) {
    throw new Error(`Malformed exceptions: expected version 1, got ${exceptions.version}`);
  }
  if (!Array.isArray(exceptions.exceptions)) {
    throw new Error('Malformed exceptions: "exceptions" must be an array');
  }
  const VALID_KINDS = new Set(['allowed-new-file', 'allowed-edit']);
  const seenPaths = new Set();
  for (const [idx, item] of exceptions.exceptions.entries()) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`Malformed exceptions: exception at index ${idx} must be an object`);
    }
    if (typeof item.path !== 'string' || item.path.length === 0) {
      throw new Error(`Malformed exceptions: exception at index ${idx} missing path`);
    }
    let canonicalPath;
    try {
      canonicalPath = canonicalizeExceptionPath(item.path);
    } catch (err) {
      throw new Error(`Malformed exceptions: exception at index ${idx} has invalid path: ${err.message}`);
    }
    if (seenPaths.has(canonicalPath)) {
      throw new Error(`Malformed exceptions: duplicate exception for path "${item.path}" (canonical: "${canonicalPath}")`);
    }
    seenPaths.add(canonicalPath);
    if (!VALID_KINDS.has(item.kind)) {
      throw new Error(
        `Malformed exceptions: exception at index ${idx} has invalid kind: ${item.kind} (deletions are strictly forbidden during migration)`
      );
    }
    if (typeof item.rationale !== 'string' || item.rationale.trim().length === 0) {
      throw new Error(`Malformed exceptions: exception at index ${idx} missing rationale`);
    }
    if (typeof item.approvedBy !== 'string' || item.approvedBy.trim().length === 0) {
      throw new Error(`Malformed exceptions: exception at index ${idx} missing approvedBy`);
    }
    if (typeof item.owner !== 'string' || item.owner.trim().length === 0) {
      throw new Error(`Malformed exceptions: exception at index ${idx} missing owner`);
    }
    if (typeof item.reviewedAt !== 'string' || !isValidIsoCalendarDate(item.reviewedAt)) {
      throw new Error(`Malformed exceptions: exception at index ${idx} missing or invalid reviewedAt (expected valid ISO calendar date YYYY-MM-DD)`);
    }
    const hasExpiry = typeof item.expiry === 'string' && item.expiry.trim().length > 0;
    const hasRevisitTrigger = typeof item.revisitTrigger === 'string' && item.revisitTrigger.trim().length > 0;
    if (!hasExpiry && !hasRevisitTrigger) {
      throw new Error(
        `Malformed exceptions: exception at index ${idx} requires at least one lifecycle control ('expiry' or 'revisitTrigger')`
      );
    }
    if (hasExpiry && !isValidIsoCalendarDate(item.expiry)) {
      throw new Error(
        `Malformed exceptions: exception at index ${idx} has invalid expiry format or impossible calendar date: "${item.expiry}" (expected valid ISO calendar date YYYY-MM-DD)`
      );
    }
    if (typeof item.expectedDigest !== 'string' || !/^[0-9a-f]{64}$/.test(item.expectedDigest)) {
      throw new Error(`Malformed exceptions: exception for ${item.path} requires valid 64-char hex expectedDigest`);
    }
  }
  return true;
}

/**
 * Scans directories recursively and collects all file entries deterministically.
 * Enforces containment:
 * - Scans dotfiles (does not skip them)
 * - Captures non-regular entries (FIFOs, sockets, device nodes)
 * - Identifies file symlinks and directory symlinks
 * - Checks for tree escape (symlink pointing outside repository root)
 */
export function scanFiles(repoRoot, roots = DEFAULT_ROOTS) {
  const fileList = [];

  for (const rootRel of roots) {
    const rootAbs = path.resolve(repoRoot, rootRel);
    if (!fs.existsSync(rootAbs)) continue;

    function walk(currentAbs) {
      const entries = fs.readdirSync(currentAbs, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentAbs, entry.name);
        const relPath = normalizePosix(path.relative(repoRoot, fullPath));

        // Path traversal guard
        if (relPath.startsWith('..') || path.isAbsolute(relPath)) {
          fileList.push({
            relPath,
            fullPath,
            isTreeEscape: true,
          });
          continue;
        }

        if (entry.isSymbolicLink()) {
          const rawTarget = fs.readlinkSync(fullPath);
          const resolvedTargetAbs = path.resolve(currentAbs, rawTarget);
          const relTarget = normalizePosix(path.relative(repoRoot, resolvedTargetAbs));
          const isTreeEscape = relTarget.startsWith('..') || path.isAbsolute(relTarget);

          let isDirectory = false;
          let isFile = false;
          try {
            const stat = fs.statSync(fullPath);
            isDirectory = stat.isDirectory();
            isFile = stat.isFile();
          } catch {
            // Broken symlink
          }

          if (isDirectory) {
            // Directory symlinks are refused
            fileList.push({
              relPath,
              fullPath,
              isSymlink: true,
              isDirectorySymlink: true,
              isTreeEscape,
              target: rawTarget,
            });
          } else {
            fileList.push({
              relPath,
              fullPath,
              isSymlink: true,
              isFile,
              isTreeEscape,
              target: rawTarget,
            });
          }
        } else if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile()) {
          fileList.push({
            relPath,
            fullPath,
            isSymlink: false,
          });
        } else {
          // Non-regular entries: FIFOs, sockets, character/block devices
          const entryType = entry.isFIFO()
            ? 'fifo'
            : entry.isSocket()
              ? 'socket'
              : entry.isBlockDevice()
                ? 'block-device'
                : entry.isCharacterDevice()
                  ? 'character-device'
                  : 'non-regular';
          fileList.push({
            relPath,
            fullPath,
            isSymlink: false,
            isNonRegular: true,
            entryType,
          });
        }
      }
    }

    walk(rootAbs);
  }

  // Codepoint ascending order sort
  fileList.sort((a, b) => (a.relPath < b.relPath ? -1 : a.relPath > b.relPath ? 1 : 0));
  return fileList;
}

/**
 * Generates a deterministic baseline object from disk.
 */
export function generateBaseline({ repoRoot = process.cwd(), roots = DEFAULT_ROOTS } = {}) {
  const scanned = scanFiles(repoRoot, roots);
  const filesMap = Object.create(null);

  for (const item of scanned) {
    if (item.isTreeEscape) {
      throw new Error(`generateBaseline: tree escape detected at ${item.relPath}`);
    }
    if (item.isDirectorySymlink) {
      throw new Error(`generateBaseline: directory symlink forbidden at ${item.relPath}`);
    }
    if (item.isNonRegular) {
      throw new Error(`generateBaseline: non-regular entry (${item.entryType}) forbidden at ${item.relPath}`);
    }
    const buf = fs.readFileSync(item.fullPath);
    const digest = computeSha256(buf);
    filesMap[item.relPath] = {
      digest,
      size: buf.length,
      fileClass: classifyFile(item.relPath),
      isSymlink: item.isSymlink,
    };
    if (item.isSymlink) {
      filesMap[item.relPath].symlinkTarget = normalizePosix(item.target);
    }
  }

  return {
    $schema: 'https://forgent.dev/schemas/legacy-root-baseline.v1.json',
    version: 1,
    generatedAt: '2026-09-25T00:00:00.000Z',
    generator: 'scripts/check-legacy-docs-ratchet.mjs',
    semantics: {
      digestAlgorithm: DIGEST_ALGORITHM,
      pathNormalization: 'posix-relative',
      sortOrder: 'codepoint-ascending',
      symlinks: 'directory-symlinks-refused; file-symlinks-recorded-with-target-and-identity',
      inclusion: 'all-regular-files-and-symlinks-including-dotfiles'
    },
    roots: [...roots].sort(),
    fileCount: Object.keys(filesMap).length,
    files: filesMap,
  };
}

/**
 * Checks on-disk files against baseline and exceptions.
 * Returns findings and statistics.
 */
export function checkRatchet({
  repoRoot = process.cwd(),
  baseline,
  exceptions = { version: 1, exceptions: [] },
  roots = DEFAULT_ROOTS,
  today = new Date().toISOString().slice(0, 10),
} = {}) {
  validateBaselineSchema(baseline);
  validateExceptionsSchema(exceptions);

  const scanned = scanFiles(repoRoot, roots);
  const findings = [];
  const onDiskMap = new Map();

  for (const item of scanned) {
    if (item.isTreeEscape) {
      findings.push({
        type: 'tree-escape',
        path: item.relPath,
        message: `${item.relPath}: entry escapes repository root.`,
      });
      continue;
    }
    if (item.isDirectorySymlink) {
      findings.push({
        type: 'forbidden-entry',
        path: item.relPath,
        message: `${item.relPath}: directory symlinks are forbidden under legacy roots.`,
      });
      continue;
    }
    if (item.isNonRegular) {
      findings.push({
        type: 'forbidden-entry',
        path: item.relPath,
        message: `${item.relPath}: non-regular entry (${item.entryType}) is forbidden under legacy roots.`,
      });
      continue;
    }
    if (item.isSymlink && !item.isFile) {
      findings.push({
        type: 'broken-symlink',
        path: item.relPath,
        message: `${item.relPath}: broken or non-file symlink target (${item.target}).`,
      });
      continue;
    }

    try {
      const buf = fs.readFileSync(item.fullPath);
      const digest = computeSha256(buf);
      onDiskMap.set(item.relPath, {
        digest,
        size: buf.length,
        item,
      });
    } catch (err) {
      findings.push({
        type: 'unreadable-entry',
        path: item.relPath,
        message: `${item.relPath}: cannot read file (${err.message}).`,
      });
    }
  }

  // Check for expired exceptions
  // Expiry boundary definition (F4): An exception expires on its expiry date.
  // For any check date today >= exc.expiry, the exception is considered expired
  // (expired-exception) and no longer active. An exception is active only when today < exc.expiry.
  for (const exc of exceptions.exceptions) {
    if (exc.expiry && exc.expiry <= today) {
      findings.push({
        type: 'expired-exception',
        path: exc.path,
        message: `${exc.path}: exception expired on ${exc.expiry} (current check date: ${today}).`,
      });
    }
  }

  // Index exceptions by canonical path
  const exceptionsByPath = new Map();
  for (const exc of exceptions.exceptions) {
    exceptionsByPath.set(canonicalizeExceptionPath(exc.path), exc);
  }

  const usedExceptions = new Set();
  let accountedEditsCount = 0;
  let accountedNewFilesCount = 0;

  // 1. Check every file on disk against baseline
  for (const [relPath, current] of onDiskMap.entries()) {
    const baseEntry = baseline.files[relPath];
    const exception = exceptionsByPath.get(relPath);
    const classified = classifyFile(relPath);

    if (!baseEntry) {
      // New file on disk
      if (isMaintainedProseClass(classified)) {
        if (exception && exception.kind === 'allowed-new-file' && exception.expectedDigest === current.digest) {
          accountedNewFilesCount++;
          usedExceptions.add(canonicalizeExceptionPath(exception.path));
        } else if (exception && exception.kind === 'allowed-new-file') {
          usedExceptions.add(canonicalizeExceptionPath(exception.path));
          findings.push({
            type: 'unaccounted-edit',
            path: relPath,
            message: `${relPath}: new maintained file has exception but digest mismatch (expected ${exception.expectedDigest}, got ${current.digest})`,
          });
        } else {
          findings.push({
            type: 'unreviewed-new-file',
            path: relPath,
            message: `${relPath}: new maintained file under legacy root refused by ratchet (class: ${classified}). Maintained authority belongs in docs/platform/** or requires reviewed exception.`,
          });
        }
      } else if (NON_AUTHORITY_PAYLOAD_CLASSES.has(classified)) {
        // Non-authority payload (generated projection or history-evidence): permitted without exception
        if (exception && exception.kind === 'allowed-new-file' && exception.expectedDigest === current.digest) {
          accountedNewFilesCount++;
          usedExceptions.add(canonicalizeExceptionPath(exception.path));
        }
      } else {
        findings.push({
          type: 'unreviewed-new-file',
          path: relPath,
          message: `${relPath}: new file with unrecognized class "${classified}" refused by ratchet.`,
        });
      }
    } else {
      // Existing file
      // Check symlink identity
      const baseIsSymlink = Boolean(baseEntry.isSymlink);
      const currentIsSymlink = Boolean(current.item.isSymlink);
      if (baseIsSymlink !== currentIsSymlink) {
        findings.push({
          type: 'symlink-identity-mismatch',
          path: relPath,
          message: `${relPath}: symlink identity changed (baseline isSymlink: ${baseIsSymlink}, current isSymlink: ${currentIsSymlink})`,
        });
      } else if (baseIsSymlink && baseEntry.symlinkTarget !== normalizePosix(current.item.target)) {
        findings.push({
          type: 'symlink-target-mismatch',
          path: relPath,
          message: `${relPath}: symlink target changed (baseline: ${baseEntry.symlinkTarget}, current: ${normalizePosix(current.item.target)})`,
        });
      }

      // Check fileClass
      if (baseEntry.fileClass !== classified) {
        findings.push({
          type: 'file-class-mismatch',
          path: relPath,
          message: `${relPath}: file class mismatch (baseline: ${baseEntry.fileClass}, classified: ${classified})`,
        });
      }

      // Check digest
      if (baseEntry.digest !== current.digest) {
        // Fail-closed against baseline spoofing: if either the baseline entry
        // OR the live classification is maintained prose, enforce maintained controls
        const isMaintained = isMaintainedProseClass(baseEntry.fileClass) || isMaintainedProseClass(classified);

        if (isMaintained) {
          if (exception && exception.kind === 'allowed-edit' && exception.expectedDigest === current.digest) {
            accountedEditsCount++;
            usedExceptions.add(canonicalizeExceptionPath(exception.path));
          } else if (exception && exception.kind === 'allowed-edit') {
            usedExceptions.add(canonicalizeExceptionPath(exception.path));
            findings.push({
              type: 'unaccounted-edit',
              path: relPath,
              message: `${relPath}: modified maintained file has exception but digest mismatch (expected ${exception.expectedDigest}, got ${current.digest})`,
            });
          } else {
            findings.push({
              type: 'unaccounted-edit',
              path: relPath,
              message: `${relPath}: maintained file (class: ${baseEntry.fileClass}) modified under legacy root without reviewed exception in exceptions ledger (baseline ${baseEntry.digest}, current ${current.digest}).`,
            });
          }
        } else if (NON_AUTHORITY_PAYLOAD_CLASSES.has(baseEntry.fileClass) && NON_AUTHORITY_PAYLOAD_CLASSES.has(classified)) {
          // Non-authority payload (generated projection or history-evidence): permitted without exception
          if (exception && exception.kind === 'allowed-edit' && exception.expectedDigest === current.digest) {
            accountedEditsCount++;
            usedExceptions.add(canonicalizeExceptionPath(exception.path));
          }
        } else {
          findings.push({
            type: 'unaccounted-edit',
            path: relPath,
            message: `${relPath}: file modified under legacy root without reviewed exception in exceptions ledger (baseline ${baseEntry.digest}, current ${current.digest}).`,
          });
        }
      }
    }
  }

  // 2. Check for missing files (deleted from baseline) - deletions are strictly forbidden
  for (const [relPath, baseEntry] of Object.entries(baseline.files)) {
    if (!onDiskMap.has(relPath)) {
      findings.push({
        type: 'unexpected-deletion',
        path: relPath,
        message: `${relPath}: baselined file missing from disk without approved exception (legacy deletions are forbidden before Phase 08).`,
      });
    }
  }

  // 3. Check for unused / stale exceptions in ledger
  for (const exc of exceptions.exceptions) {
    const canon = canonicalizeExceptionPath(exc.path);
    if (!usedExceptions.has(canon)) {
      findings.push({
        type: 'unused-exception',
        path: exc.path,
        message: `${exc.path}: exception in ledger is unused (no matching edit or new file exists on disk).`,
      });
    }
  }

  return {
    clean: findings.length === 0,
    findings,
    stats: {
      baselineFilesCount: Object.keys(baseline.files).length,
      onDiskFilesCount: onDiskMap.size,
      accountedEditsCount,
      accountedNewFilesCount,
      findingsCount: findings.length,
    },
  };
}

/**
 * Loads and parses JSON file.
 */
function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function runCli(argv, cwd = process.cwd()) {
  const baselineIdx = argv.indexOf('--baseline');
  const exceptionsIdx = argv.indexOf('--exceptions');
  const rootsIdx = argv.indexOf('--roots');
  const repoRootIdx = argv.indexOf('--repo-root');

  const baselinePath = path.resolve(
    cwd,
    baselineIdx >= 0 ? argv[baselineIdx + 1] : DEFAULT_BASELINE_PATH
  );
  const exceptionsPath = path.resolve(
    cwd,
    exceptionsIdx >= 0 ? argv[exceptionsIdx + 1] : DEFAULT_EXCEPTIONS_PATH
  );
  const repoRoot = path.resolve(
    cwd,
    repoRootIdx >= 0 ? argv[repoRootIdx + 1] : cwd
  );
  const roots = rootsIdx >= 0
    ? argv[rootsIdx + 1].split(',').map((r) => r.trim())
    : DEFAULT_ROOTS;

  const writeBaseline = argv.includes('--write-baseline');
  const asJson = argv.includes('--json');

  if (writeBaseline) {
    const generated = generateBaseline({ repoRoot, roots });
    // Keep deterministic ISO timestamp if already existing or reproducible
    fs.writeFileSync(baselinePath, JSON.stringify(generated, null, 2) + '\n');
    console.log(`check-legacy-docs-ratchet: wrote baseline for ${generated.fileCount} file(s) across roots [${roots.join(', ')}] to ${path.relative(cwd, baselinePath)}`);
    return 0;
  }

  let baseline;
  try {
    baseline = loadJson(baselinePath);
  } catch (err) {
    console.error(`check-legacy-docs-ratchet error loading baseline: ${err.message}`);
    return 1;
  }

  let exceptions = { version: 1, exceptions: [] };
  if (fs.existsSync(exceptionsPath)) {
    try {
      exceptions = loadJson(exceptionsPath);
    } catch (err) {
      console.error(`check-legacy-docs-ratchet error loading exceptions: ${err.message}`);
      return 1;
    }
  }

  let result;
  try {
    result = checkRatchet({ repoRoot, baseline, exceptions, roots });
  } catch (err) {
    console.error(`check-legacy-docs-ratchet evaluation error: ${err.message}`);
    return 1;
  }

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return result.clean ? 0 : 1;
  }

  if (result.clean) {
    console.log(
      `check-legacy-docs-ratchet: clean (${result.stats.onDiskFilesCount} legacy files checked; ` +
      `${result.stats.accountedEditsCount} accounted edit(s), ${result.stats.accountedNewFilesCount} accounted new file(s)).`
    );
    return 0;
  }

  console.error(`check-legacy-docs-ratchet: ${result.findings.length} violation(s) found under legacy roots:`);
  for (const f of result.findings) {
    console.error(`  - [${f.type}] ${f.message}`);
  }
  return 1;
}

if (isMainModule(import.meta.url)) {
  process.exitCode = runCli(process.argv.slice(2), process.cwd());
}
