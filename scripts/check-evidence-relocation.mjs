#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { computeSha256, normalizePosix } from './check-legacy-docs-ratchet.mjs';
import { isEvidenceMirrorPath } from './check-doc-inventory-gates.mjs';
import { classifyPath } from './check-doc-constitution.mjs';

/**
 * Reused primitives cited per policy §4.5 and brief:
 * - computeSha256: scripts/check-legacy-docs-ratchet.mjs:112
 * - normalizePosix: scripts/check-legacy-docs-ratchet.mjs:43
 * - isEvidenceMirrorPath: scripts/check-doc-inventory-gates.mjs:1009
 * - classifyPath: scripts/check-doc-constitution.mjs:170
 */

/**
 * Checks whether an entry git mode (100755 vs 100644) matches filesystem permissions.
 */
function checkFileMode(fullPath, expectedGitMode) {
  const stat = fs.statSync(fullPath);
  const isExec = (stat.mode & 0o111) !== 0;
  const expectedExec = expectedGitMode === '100755';
  return {
    matches: isExec === expectedExec,
    actualMode: isExec ? '100755' : '100644',
    size: stat.size,
  };
}

/**
 * Finds all platform payload files present on disk under docs/platform.
 */
export function scanPlatformPayloads(repoRoot) {
  const platDir = path.resolve(repoRoot, 'docs/platform');
  const payloads = [];
  if (!fs.existsSync(platDir)) return payloads;

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() || entry.isSymbolicLink()) {
        const rel = normalizePosix(path.relative(repoRoot, full));
        if (isEvidenceMirrorPath(rel)) {
          payloads.push(rel);
        }
      }
    }
  }

  walk(platDir);
  payloads.sort((a, b) => a.localeCompare(b));
  return payloads;
}

/**
 * Finds any legacy payload file remaining on disk under docs/architect.
 */
export function scanLegacyPayloads(repoRoot) {
  const archDir = path.resolve(repoRoot, 'docs/architect');
  const payloads = [];
  if (!fs.existsSync(archDir)) return payloads;

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() || entry.isSymbolicLink()) {
        const rel = normalizePosix(path.relative(repoRoot, full));
        if (isEvidenceMirrorPath(rel)) {
          payloads.push(rel);
        }
      }
    }
  }

  walk(archDir);
  payloads.sort((a, b) => a.localeCompare(b));
  return payloads;
}

/**
 * Scans maintained text outside history, archive, plans, and the alias table
 * for mentions of legacy payload paths.
 */
export function scanMaintainedTextMentions(repoRoot, legacyPaths, { manifestPath = null } = {}) {
  const violations = [];
  const normManifestPath = manifestPath
    ? normalizePosix(path.relative(repoRoot, path.resolve(manifestPath)))
    : null;

  const targetSet = new Set();
  for (const lp of legacyPaths) {
    if (!lp) continue;
    targetSet.add(lp);
    if (lp.startsWith('docs/')) {
      targetSet.add(lp.slice(5));
    }
  }
  const legacyArray = Array.from(targetSet);

  function isExcludedDir(relDir) {
    const parts = relDir.split('/');
    const first = parts[0];
    if (first === '.git' || first === 'node_modules' || first === '.fgos' || first === 'target' || first === 'dist' || first === '.gitnexus') return true;
    if (parts.includes('target') || parts.includes('node_modules') || parts.includes('.git') || parts.includes('.cargo') || parts.includes('.gitnexus')) return true;
    if (first === 'archive' || first === 'plans') return true;
    if (relDir === 'docs/history' || relDir.startsWith('docs/history/')) return true;
    if (relDir === 'docs/platform/history' || relDir.startsWith('docs/platform/history/')) return true;
    return false;
  }

  function isExcludedFile(relFile) {
    const base = path.basename(relFile);
    if (base.includes('alias-table')) return true;
    if (normManifestPath && relFile === normManifestPath) return true;
    if (isEvidenceMirrorPath(relFile)) return true;
    return false;
  }
  function walk(dir) {
    const relDir = normalizePosix(path.relative(repoRoot, dir));
    if (relDir && isExcludedDir(relDir)) return;

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = normalizePosix(path.relative(repoRoot, full));
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        if (isExcludedFile(rel)) continue;

        try {
          const content = fs.readFileSync(full, 'utf8');
          // Fast filter: all legacy payload paths involve 'verification'
          if (!content.includes('verification')) continue;

          for (const lp of legacyArray) {
            if (content.includes(lp)) {
              violations.push({
                type: 'maintained-text-legacy-mention',
                phase: 'after',
                path: rel,
                legacyPath: lp,
                message: `${rel}: maintained text mentions legacy payload path ${lp}`,
              });
              break;
            }
          }
        } catch {
          // Skip binary or unreadable files
        }
      }
    }
  }

  walk(repoRoot);
  violations.sort((a, b) => a.path.localeCompare(b.path) || a.message.localeCompare(b.message));
  return violations;
}

/**
 * Generates the deterministic relocation manifest from the working tree.
 */
export function generateManifest({
  repoRoot = process.cwd(),
  sourceCommit = null,
  generatedBy = 'scripts/check-evidence-relocation.mjs',
} = {}) {
  let commit = sourceCommit;
  if (!commit) {
    try {
      commit = execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: repoRoot,
        encoding: 'utf8',
      }).trim();
    } catch {
      commit = 'unknown';
    }
  }

  let lsLines = [];
  try {
    const raw = execFileSync(
      'git',
      ['ls-files', '-s', 'docs/architect', 'docs/platform'],
      { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
    );
    lsLines = raw.trim().split('\n').filter(Boolean);
  } catch {
    // If not a git repo, fallback to directory scan
  }

  const archMap = new Map();
  const platMap = new Map();

  for (const line of lsLines) {
    const parts = line.split(/\s+/);
    const mode = parts[0];
    const blob = parts[1];
    const p = parts.slice(3).join(' ');
    if (isEvidenceMirrorPath(p)) {
      if (p.startsWith('docs/architect/')) {
        archMap.set(p, { mode, blob });
      } else if (p.startsWith('docs/platform/')) {
        platMap.set(p, { mode, blob });
      }
    }
  }

  // If git ls-files was not populated, scan from disk
  if (archMap.size === 0) {
    const archOnDisk = scanLegacyPayloads(repoRoot);
    for (const p of archOnDisk) {
      const full = path.resolve(repoRoot, p);
      const stat = fs.statSync(full);
      const mode = (stat.mode & 0o111) !== 0 ? '100755' : '100644';
      archMap.set(p, { mode, blob: null });
    }
    const platOnDisk = scanPlatformPayloads(repoRoot);
    for (const p of platOnDisk) {
      const full = path.resolve(repoRoot, p);
      const stat = fs.statSync(full);
      const mode = (stat.mode & 0o111) !== 0 ? '100755' : '100644';
      platMap.set(p, { mode, blob: null });
    }
  }

  const entries = [];
  for (const [before, meta] of archMap) {
    const after = before.replace(/^docs\/architect\//, 'docs/platform/');
    const match = before.match(
      /^docs\/architect\/(?:.+\/)?verification\/([^/]+)\//
    );
    const collection = match ? match[1] : 'unknown';

    const fullBefore = path.resolve(repoRoot, before);
    const stat = fs.statSync(fullBefore);
    const buf = fs.readFileSync(fullBefore);
    const sha = computeSha256(buf);

    entries.push({
      collection,
      before,
      after: platMap.has(after) ? after : null,
      sha256: sha,
      bytes: stat.size,
      mode: meta.mode,
      gitBlob: meta.blob,
      relation: platMap.has(after) ? 'identical-mirror' : 'moved',
    });
  }

  entries.sort((a, b) => a.before.localeCompare(b.before));

  return {
    version: 1,
    sourceCommit: commit,
    generatedBy,
    entries,
  };
}

/**
 * Validates evidence relocation in --before or --after mode.
 */
export function checkEvidenceRelocation({
  manifest,
  manifestPath = null,
  repoRoot = process.cwd(),
  mode = 'before',
} = {}) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Malformed manifest: must be an object');
  }
  if (manifest.version !== 1) {
    throw new Error(`Unsupported manifest version: ${manifest.version}`);
  }
  if (!Array.isArray(manifest.entries)) {
    throw new Error('Malformed manifest: entries must be an array');
  }
  if (mode !== 'before' && mode !== 'after') {
    throw new Error(`Invalid mode: ${mode} (expected 'before' or 'after')`);
  }

  const violations = [];
  const manifestAfterSet = new Set();
  const legacyPaths = [];

  for (const entry of manifest.entries) {
    if (entry.after) manifestAfterSet.add(entry.after);
    if (entry.before) legacyPaths.push(entry.before);
  }

  if (mode === 'before') {
    // 1. Verify every entry: legacy and platform file exist, match sha256, mode, and bytes
    for (const entry of manifest.entries) {
      // Legacy file check
      if (entry.before) {
        const fullLegacy = path.resolve(repoRoot, entry.before);
        if (!fs.existsSync(fullLegacy)) {
          violations.push({
            type: 'missing-file',
            phase: 'before',
            target: 'legacy',
            path: entry.before,
            message: `legacy file missing: ${entry.before}`,
          });
        } else {
          try {
            const buf = fs.readFileSync(fullLegacy);
            const sha = computeSha256(buf);
            if (sha !== entry.sha256) {
              violations.push({
                type: 'changed-byte',
                phase: 'before',
                target: 'legacy',
                path: entry.before,
                expected: entry.sha256,
                actual: sha,
                message: `legacy file hash mismatch: ${entry.before} (expected ${entry.sha256}, got ${sha})`,
              });
            }
            const modeCheck = checkFileMode(fullLegacy, entry.mode);
            if (!modeCheck.matches) {
              violations.push({
                type: 'wrong-mode',
                phase: 'before',
                target: 'legacy',
                path: entry.before,
                expected: entry.mode,
                actual: modeCheck.actualMode,
                message: `legacy file mode mismatch: ${entry.before} (expected ${entry.mode}, got ${modeCheck.actualMode})`,
              });
            }
            if (modeCheck.size !== entry.bytes) {
              violations.push({
                type: 'bytes-mismatch',
                phase: 'before',
                target: 'legacy',
                path: entry.before,
                expected: entry.bytes,
                actual: modeCheck.size,
                message: `legacy file size mismatch: ${entry.before} (expected ${entry.bytes}, got ${modeCheck.size})`,
              });
            }
          } catch (err) {
            violations.push({
              type: 'io-error',
              phase: 'before',
              target: 'legacy',
              path: entry.before,
              message: `error reading legacy file ${entry.before}: ${err.message}`,
            });
          }
        }
      }

      // Platform file check
      if (entry.after) {
        const fullPlatform = path.resolve(repoRoot, entry.after);
        if (!fs.existsSync(fullPlatform)) {
          violations.push({
            type: 'missing-file',
            phase: 'before',
            target: 'platform',
            path: entry.after,
            message: `platform file missing: ${entry.after}`,
          });
        } else {
          try {
            const buf = fs.readFileSync(fullPlatform);
            const sha = computeSha256(buf);
            if (sha !== entry.sha256) {
              violations.push({
                type: 'changed-byte',
                phase: 'before',
                target: 'platform',
                path: entry.after,
                expected: entry.sha256,
                actual: sha,
                message: `platform file hash mismatch: ${entry.after} (expected ${entry.sha256}, got ${sha})`,
              });
            }
            const modeCheck = checkFileMode(fullPlatform, entry.mode);
            if (!modeCheck.matches) {
              violations.push({
                type: 'wrong-mode',
                phase: 'before',
                target: 'platform',
                path: entry.after,
                expected: entry.mode,
                actual: modeCheck.actualMode,
                message: `platform file mode mismatch: ${entry.after} (expected ${entry.mode}, got ${modeCheck.actualMode})`,
              });
            }
            if (modeCheck.size !== entry.bytes) {
              violations.push({
                type: 'bytes-mismatch',
                phase: 'before',
                target: 'platform',
                path: entry.after,
                expected: entry.bytes,
                actual: modeCheck.size,
                message: `platform file size mismatch: ${entry.after} (expected ${entry.bytes}, got ${modeCheck.size})`,
              });
            }
          } catch (err) {
            violations.push({
              type: 'io-error',
              phase: 'before',
              target: 'platform',
              path: entry.after,
              message: `error reading platform file ${entry.after}: ${err.message}`,
            });
          }
        }
      }
    }

    // 2. No platform payload file exists that is absent from the manifest
    const platformPayloads = scanPlatformPayloads(repoRoot);
    for (const p of platformPayloads) {
      if (!manifestAfterSet.has(p)) {
        violations.push({
          type: 'unlisted-payload',
          phase: 'before',
          target: 'platform',
          path: p,
          message: `unlisted platform payload: ${p}`,
        });
      }
    }
  } else if (mode === 'after') {
    // 1. No legacy file remains
    for (const entry of manifest.entries) {
      if (entry.before) {
        const fullLegacy = path.resolve(repoRoot, entry.before);
        if (fs.existsSync(fullLegacy)) {
          violations.push({
            type: 'remaining-legacy-file',
            phase: 'after',
            target: 'legacy',
            path: entry.before,
            message: `legacy file still exists: ${entry.before}`,
          });
        }
      }
    }

    const legacyPayloads = scanLegacyPayloads(repoRoot);
    for (const lp of legacyPayloads) {
      if (!violations.some((v) => v.type === 'remaining-legacy-file' && v.path === lp)) {
        violations.push({
          type: 'remaining-legacy-file',
          phase: 'after',
          target: 'legacy',
          path: lp,
          message: `legacy payload still exists: ${lp}`,
        });
      }
    }

    // 2. Every platform file hashes to recorded sha256 and modes match
    for (const entry of manifest.entries) {
      if (entry.after) {
        const fullPlatform = path.resolve(repoRoot, entry.after);
        if (!fs.existsSync(fullPlatform)) {
          violations.push({
            type: 'missing-file',
            phase: 'after',
            target: 'platform',
            path: entry.after,
            message: `platform file missing: ${entry.after}`,
          });
        } else {
          try {
            const buf = fs.readFileSync(fullPlatform);
            const sha = computeSha256(buf);
            if (sha !== entry.sha256) {
              violations.push({
                type: 'changed-byte',
                phase: 'after',
                target: 'platform',
                path: entry.after,
                expected: entry.sha256,
                actual: sha,
                message: `platform file hash mismatch: ${entry.after} (expected ${entry.sha256}, got ${sha})`,
              });
            }
            const modeCheck = checkFileMode(fullPlatform, entry.mode);
            if (!modeCheck.matches) {
              violations.push({
                type: 'wrong-mode',
                phase: 'after',
                target: 'platform',
                path: entry.after,
                expected: entry.mode,
                actual: modeCheck.actualMode,
                message: `platform file mode mismatch: ${entry.after} (expected ${entry.mode}, got ${modeCheck.actualMode})`,
              });
            }
            if (modeCheck.size !== entry.bytes) {
              violations.push({
                type: 'bytes-mismatch',
                phase: 'after',
                target: 'platform',
                path: entry.after,
                expected: entry.bytes,
                actual: modeCheck.size,
                message: `platform file size mismatch: ${entry.after} (expected ${entry.bytes}, got ${modeCheck.size})`,
              });
            }
          } catch (err) {
            violations.push({
              type: 'io-error',
              phase: 'after',
              target: 'platform',
              path: entry.after,
              message: `error reading platform file ${entry.after}: ${err.message}`,
            });
          }
        }
      }
    }

    // 3. No unlisted platform payload exists
    const platformPayloads = scanPlatformPayloads(repoRoot);
    for (const p of platformPayloads) {
      if (!manifestAfterSet.has(p)) {
        violations.push({
          type: 'unlisted-payload',
          phase: 'after',
          target: 'platform',
          path: p,
          message: `unlisted platform payload: ${p}`,
        });
      }
    }

    // 4. No maintained text outside history, archive, and alias table names a legacy payload path
    const textViolations = scanMaintainedTextMentions(repoRoot, legacyPaths, { manifestPath });
    for (const tv of textViolations) {
      violations.push(tv);
    }
  }

  // Deterministic sort of violations
  violations.sort((a, b) =>
    (a.path || '').localeCompare(b.path || '') ||
    (a.type || '').localeCompare(b.type || '') ||
    (a.message || '').localeCompare(b.message || '')
  );

  return {
    ok: violations.length === 0,
    mode,
    checkedCount: manifest.entries.length,
    violations,
  };
}

export function parseArgs(argv) {
  let manifestPath = null;
  let mode = null;
  let repoRoot = process.cwd();
  let json = false;
  let generate = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--manifest') {
      manifestPath = argv[++i];
    } else if (arg === '--before') {
      mode = 'before';
    } else if (arg === '--after') {
      mode = 'after';
    } else if (arg === '--generate') {
      generate = true;
    } else if (arg === '--repo-root') {
      repoRoot = argv[++i];
    } else if (arg === '--json') {
      json = true;
    }
  }

  return { manifestPath, mode, repoRoot, json, generate };
}

export function runCli(argv, defaultRoot = process.cwd()) {
  const args = parseArgs(argv);
  const repoRoot = args.repoRoot || defaultRoot;

  if (args.generate) {
    const manifest = generateManifest({ repoRoot });
    const outputJson = JSON.stringify(manifest, null, 2) + '\n';
    if (args.manifestPath) {
      const fullOut = path.resolve(repoRoot, args.manifestPath);
      fs.mkdirSync(path.dirname(fullOut), { recursive: true });
      fs.writeFileSync(fullOut, outputJson, 'utf8');
      console.log(`[check-evidence-relocation] Generated manifest at ${args.manifestPath} (${manifest.entries.length} entries)`);
    } else {
      process.stdout.write(outputJson);
    }
    return 0;
  }

  if (!args.manifestPath) {
    console.error('Usage: check-evidence-relocation.mjs --manifest <path> [--before | --after] [--repo-root <path>] [--json]');
    return 2;
  }

  if (args.mode !== 'before' && args.mode !== 'after') {
    console.error('Error: specify either --before or --after mode.');
    return 2;
  }

  const fullManifestPath = path.resolve(repoRoot, args.manifestPath);
  if (!fs.existsSync(fullManifestPath)) {
    console.error(`Error: manifest file not found: ${args.manifestPath}`);
    return 2;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(fullManifestPath, 'utf8'));
  } catch (err) {
    console.error(`Error parsing manifest JSON: ${err.message}`);
    return 2;
  }

  const result = checkEvidenceRelocation({
    manifest,
    manifestPath: args.manifestPath,
    repoRoot,
    mode: args.mode,
  });

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.ok) {
    console.log(`[check-evidence-relocation] PASS: ${args.mode} mode verified (${result.checkedCount} entries, 0 violations)`);
  } else {
    console.error(`[check-evidence-relocation] FAIL: ${args.mode} mode found ${result.violations.length} violation(s):`);
    for (const v of result.violations) {
      console.error(`  - [${v.type}] ${v.message}`);
    }
  }

  return result.ok ? 0 : 1;
}

function isMainModule(metaUrl) {
  if (!process.argv[1]) return false;
  return fileURLToPath(metaUrl) === path.resolve(process.argv[1]);
}

if (isMainModule(import.meta.url)) {
  process.exitCode = runCli(process.argv.slice(2), process.cwd());
}
