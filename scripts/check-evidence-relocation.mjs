#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { computeSha256, normalizePosix } from './check-legacy-docs-ratchet.mjs';
import { isEvidenceMirrorPath } from './check-doc-inventory-gates.mjs';
import { classifyPath, DEFAULT_CONSTITUTION_PATH } from './check-doc-constitution.mjs';
import { DEFAULT_ALIAS_TABLE_PATH } from './doc-alias-resolver.mjs';
import { isMainModule } from './lib/is-main-module.mjs';

export const DEFAULT_CONSUMER_TABLE_PATH =
  'plans/260925-documentation-authority-unification/reports/phase-08/step-06-evidence-consumer-table.json';

const MANIFEST_KEYS = ['entries', 'generatedBy', 'sourceCommit', 'version'];
const ENTRY_KEYS = ['after', 'before', 'bytes', 'collection', 'gitBlob', 'mode', 'relation', 'sha256'];
const CONSUMER_ROOTS = [
  '.agents/', '.claude/', '.githooks/', 'apps/', 'bin/', 'core/', 'domains/',
  'packages/', 'plugins/', 'scripts/', 'src/', 'test/',
];
const HEX_40 = /^[0-9a-f]{40}$/;
const HEX_64 = /^[0-9a-f]{64}$/;

function codepointCompare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function git(repoRoot, args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

function gitIndex(repoRoot) {
  const raw = git(repoRoot, ['ls-files', '-s', '-z']);
  const entries = new Map();
  for (const record of raw.split('\0').filter(Boolean)) {
    const match = /^(\d+) ([0-9a-f]+) (\d)\t([\s\S]+)$/.exec(record);
    if (!match) throw new Error(`Cannot parse git index record: ${record}`);
    if (match[3] !== '0') throw new Error(`Unmerged git index entry: ${match[4]}`);
    entries.set(normalizePosix(match[4]), { mode: match[1], blob: match[2] });
  }
  return entries;
}

function trackedFiles(repoRoot) {
  return git(repoRoot, ['ls-files', '-z']).split('\0').filter(Boolean).map(normalizePosix);
}

function existingTrackedPayloads(repoRoot, tree, index = gitIndex(repoRoot)) {
  const prefix = `docs/${tree}/`;
  return [...index.keys()]
    .filter((rel) => rel.startsWith(prefix) && isEvidenceMirrorPath(rel))
    .filter((rel) => fs.existsSync(path.resolve(repoRoot, rel)))
    .sort(codepointCompare);
}

export function scanPlatformPayloads(repoRoot) {
  return existingTrackedPayloads(repoRoot, 'platform');
}

export function scanLegacyPayloads(repoRoot) {
  return existingTrackedPayloads(repoRoot, 'architect');
}

function isSafeRepoPath(value) {
  return typeof value === 'string' && value.length > 0 &&
    !value.startsWith('/') && !value.includes('\\') &&
    value.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..');
}

function exactKeys(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.keys(value).sort(codepointCompare)
    : [];
}

function sameKeys(value, expected) {
  const actual = exactKeys(value);
  const wanted = [...expected].sort(codepointCompare);
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function collectionOf(before) {
  const match = /^docs\/architect\/(?:.+\/)?verification\/([^/]+)\//.exec(before);
  return match?.[1] ?? null;
}

export function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Malformed manifest: root must be an object');
  }
  if (!sameKeys(manifest, MANIFEST_KEYS)) {
    throw new Error(`Malformed manifest: root keys must be exactly ${MANIFEST_KEYS.join(', ')}`);
  }
  if (manifest.version !== 1) throw new Error(`Unsupported manifest version: ${manifest.version}`);
  if (typeof manifest.sourceCommit !== 'string' || manifest.sourceCommit.length === 0) {
    throw new Error('Malformed manifest: sourceCommit must be a non-empty string');
  }
  if (typeof manifest.generatedBy !== 'string' || manifest.generatedBy.length === 0) {
    throw new Error('Malformed manifest: generatedBy must be a non-empty string');
  }
  if (!Array.isArray(manifest.entries)) throw new Error('Malformed manifest: entries must be an array');

  const beforeSeen = new Set();
  const afterSeen = new Set();
  let previous = null;
  for (const [index, entry] of manifest.entries.entries()) {
    const label = `entries[${index}]`;
    if (!sameKeys(entry, ENTRY_KEYS)) {
      throw new Error(`Malformed manifest: ${label} keys must be exactly ${ENTRY_KEYS.join(', ')}`);
    }
    if (!isSafeRepoPath(entry.before) || !entry.before.startsWith('docs/architect/') || !isEvidenceMirrorPath(entry.before)) {
      throw new Error(`Malformed manifest: ${label}.before must be a legacy evidence payload path`);
    }
    const expectedAfter = entry.before.replace(/^docs\/architect\//, 'docs/platform/');
    if (entry.after !== null && entry.after !== expectedAfter) {
      throw new Error(`Malformed manifest: ${label}.after must be null or ${expectedAfter}`);
    }
    if (entry.collection !== collectionOf(entry.before)) {
      throw new Error(`Malformed manifest: ${label}.collection does not match its path`);
    }
    if (!HEX_64.test(entry.sha256)) throw new Error(`Malformed manifest: ${label}.sha256 must be 64 lowercase hex characters`);
    if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 0) throw new Error(`Malformed manifest: ${label}.bytes must be a non-negative integer`);
    if (entry.mode !== '100644' && entry.mode !== '100755') throw new Error(`Malformed manifest: ${label}.mode must be 100644 or 100755`);
    if (!HEX_40.test(entry.gitBlob)) throw new Error(`Malformed manifest: ${label}.gitBlob must be 40 lowercase hex characters`);
    const expectedRelation = entry.after === null ? 'moved' : 'identical-mirror';
    if (entry.relation !== expectedRelation) throw new Error(`Malformed manifest: ${label}.relation must be ${expectedRelation}`);
    if (beforeSeen.has(entry.before)) throw new Error(`Malformed manifest: duplicate before path ${entry.before}`);
    if (entry.after !== null && afterSeen.has(entry.after)) throw new Error(`Malformed manifest: duplicate after path ${entry.after}`);
    if (previous !== null && codepointCompare(previous, entry.before) >= 0) {
      throw new Error('Malformed manifest: entries must be unique and sorted by before in codepoint order');
    }
    beforeSeen.add(entry.before);
    if (entry.after !== null) afterSeen.add(entry.after);
    previous = entry.before;
  }
  return manifest;
}

function validateConsumerTable(table) {
  if (!table || typeof table !== 'object' || Array.isArray(table) || table.version !== 1 || !Array.isArray(table.consumers)) {
    throw new Error('Malformed consumer table: expected version 1 with a consumers array');
  }
  const seen = new Set();
  for (const [index, row] of table.consumers.entries()) {
    if (!row || typeof row !== 'object' || !isSafeRepoPath(row.path) ||
        typeof row.classification !== 'string' || row.classification.length === 0 ||
        !Array.isArray(row.matches) || row.matches.length === 0 ||
        row.matches.some((match) => typeof match !== 'string' || match.length === 0)) {
      throw new Error(`Malformed consumer table: consumers[${index}] is invalid`);
    }
    if (seen.has(row.path)) throw new Error(`Malformed consumer table: duplicate path ${row.path}`);
    const sorted = [...new Set(row.matches)].sort(codepointCompare);
    if (sorted.length !== row.matches.length || sorted.some((value, i) => value !== row.matches[i])) {
      throw new Error(`Malformed consumer table: matches for ${row.path} must be unique and codepoint-sorted`);
    }
    seen.add(row.path);
  }
  return table;
}

function isConsumerScope(rel) {
  return CONSUMER_ROOTS.some((prefix) => rel.startsWith(prefix)) ||
    rel === 'AGENTS.md' || rel === 'CLAUDE.md' ||
    rel.endsWith('/AGENTS.md') || rel.endsWith('/CLAUDE.md') || rel.endsWith('/SKILL.md');
}

function consumerMatches(content, collections) {
  const matches = [];
  const legacyConsumerRoot = ['docs', 'architect', 'agent-coordination', 'verification'].join('/');
  if (content.includes(legacyConsumerRoot) || content.includes(legacyConsumerRoot.slice(5))) matches.push('legacy-root');
  for (const collection of collections) if (content.includes(collection)) matches.push(`collection:${collection}`);
  return matches.sort(codepointCompare);
}

export function scanConsumerTable(repoRoot, collections) {
  const hits = [];
  const readErrors = [];
  for (const rel of trackedFiles(repoRoot).filter(isConsumerScope).sort(codepointCompare)) {
    if (rel === 'scripts/check-evidence-relocation.mjs' || isEvidenceMirrorPath(rel)) continue;
    try {
      const content = fs.readFileSync(path.resolve(repoRoot, rel), 'utf8');
      const matches = consumerMatches(content, collections);
      if (matches.length > 0) hits.push({ path: rel, matches });
    } catch (error) {
      readErrors.push({ path: rel, error: error.message });
    }
  }
  return { hits, readErrors };
}

function verifyConsumers(repoRoot, manifest, consumerTable) {
  const violations = [];
  const collections = [...new Set(manifest.entries.map((entry) => entry.collection))].sort(codepointCompare);
  const { hits, readErrors } = scanConsumerTable(repoRoot, collections);
  const expected = new Map(validateConsumerTable(consumerTable).consumers.map((row) => [row.path, row]));
  const actual = new Map(hits.map((row) => [row.path, row]));
  for (const { path: rel, error } of readErrors) {
    violations.push({ type: 'consumer-read-error', phase: 'before', path: rel, message: `${rel}: cannot read tracked consumer candidate: ${error}` });
  }
  for (const hit of hits) {
    const row = expected.get(hit.path);
    if (!row) {
      violations.push({ type: 'unclassified-consumer', phase: 'before', path: hit.path, message: `${hit.path}: consumer hit is absent from the classified consumer table (${hit.matches.join(', ')})` });
      continue;
    }
    if (row.classification === 'runtime-reader') {
      violations.push({ type: 'runtime-reader', phase: 'before', path: hit.path, message: `${hit.path}: runtime reader blocks evidence relocation readiness` });
    }
    if (row.matches.length !== hit.matches.length || row.matches.some((value, i) => value !== hit.matches[i])) {
      violations.push({ type: 'consumer-drift', phase: 'before', path: hit.path, message: `${hit.path}: consumer matches changed (expected ${row.matches.join(', ')}, got ${hit.matches.join(', ')})` });
    }
  }
  for (const row of expected.values()) {
    if (!actual.has(row.path)) {
      violations.push({ type: 'consumer-table-stale', phase: 'before', path: row.path, message: `${row.path}: classified consumer no longer matches the legacy root or a collection name` });
    }
  }
  return { hits, violations };
}

function loadConstitution(repoRoot, constitution) {
  if (constitution) return constitution;
  return JSON.parse(fs.readFileSync(path.resolve(repoRoot, DEFAULT_CONSTITUTION_PATH), 'utf8'));
}

function legacyRoots(manifest) {
  const roots = new Set();
  for (const entry of manifest.entries) {
    const marker = `/${entry.collection}/`;
    const prefix = entry.before.slice(0, entry.before.indexOf(marker) + marker.length - 1);
    const verificationRoot = entry.before.slice(0, entry.before.indexOf('/verification/') + '/verification'.length);
    roots.add(prefix);
    roots.add(verificationRoot);
    if (prefix.startsWith('docs/')) roots.add(prefix.slice(5));
    if (verificationRoot.startsWith('docs/')) roots.add(verificationRoot.slice(5));
  }
  return [...roots].sort(codepointCompare);
}

function excludedMaintainedText(rel, constitution, manifestRel, legacyPayloads, syntheticTests) {
  if (rel === manifestRel || rel === DEFAULT_ALIAS_TABLE_PATH || rel === 'CHANGELOG.md') return true;
  if (rel === 'scripts/check-evidence-relocation.mjs' || syntheticTests.has(rel)) return true;
  if (legacyPayloads.has(rel)) return true;
  if (rel.startsWith('archive/') || rel.startsWith('plans/') || rel.startsWith('.fgos/') || rel.startsWith('test/fixtures/')) return true;
  const { kind } = classifyPath(rel, constitution);
  return kind === 'history' || kind === 'evidence-payload';
}

export function scanMaintainedTextMentions(repoRoot, manifest, {
  manifestPath = null,
  constitution = null,
  consumerTable = null,
} = {}) {
  const violations = [];
  const roots = legacyRoots(manifest);
  const rules = loadConstitution(repoRoot, constitution);
  const legacyPayloads = new Set(manifest.entries.map((entry) => entry.before));
  const syntheticTests = new Set((consumerTable?.consumers ?? [])
    .filter((row) => row.classification === 'synthetic-test')
    .map((row) => row.path));
  const manifestRel = manifestPath
    ? normalizePosix(path.relative(repoRoot, path.resolve(repoRoot, manifestPath)))
    : null;
  for (const rel of trackedFiles(repoRoot).sort(codepointCompare)) {
    if (excludedMaintainedText(rel, rules, manifestRel, legacyPayloads, syntheticTests)) continue;
    try {
      const content = fs.readFileSync(path.resolve(repoRoot, rel), 'utf8');
      const legacyRoot = roots.find((root) => content.includes(root));
      if (legacyRoot) {
        violations.push({ type: 'maintained-text-legacy-mention', phase: 'after', path: rel, legacyPath: legacyRoot, message: `${rel}: maintained text mentions legacy payload root ${legacyRoot}` });
      }
    } catch (error) {
      violations.push({ type: 'maintained-text-read-error', phase: 'after', path: rel, message: `${rel}: cannot read tracked maintained text: ${error.message}` });
    }
  }
  return violations.sort((a, b) => codepointCompare(a.path, b.path) || codepointCompare(a.message, b.message));
}

export function generateManifest({ repoRoot = process.cwd(), sourceCommit = null, generatedBy = 'scripts/check-evidence-relocation.mjs' } = {}) {
  const commit = sourceCommit ?? git(repoRoot, ['rev-parse', 'HEAD']).trim();
  const index = gitIndex(repoRoot);
  const legacy = [...index.entries()]
    .filter(([rel]) => rel.startsWith('docs/architect/') && isEvidenceMirrorPath(rel))
    .sort(([a], [b]) => codepointCompare(a, b));
  const entries = legacy.map(([before, beforeMeta]) => {
    const afterPath = before.replace(/^docs\/architect\//, 'docs/platform/');
    const afterMeta = index.get(afterPath);
    const bytes = fs.readFileSync(path.resolve(repoRoot, before));
    if (afterMeta && (afterMeta.mode !== beforeMeta.mode || afterMeta.blob !== beforeMeta.blob)) {
      throw new Error(`Mirror mismatch while generating manifest: ${before} <> ${afterPath}`);
    }
    return {
      collection: collectionOf(before), before, after: afterMeta ? afterPath : null,
      sha256: computeSha256(bytes), bytes: bytes.length, mode: beforeMeta.mode,
      gitBlob: beforeMeta.blob, relation: afterMeta ? 'identical-mirror' : 'moved',
    };
  });
  return validateManifest({ version: 1, sourceCommit: commit, generatedBy, entries });
}

function verifyFile(repoRoot, rel, entry, phase, target, index) {
  const violations = [];
  const full = path.resolve(repoRoot, rel);
  if (!fs.existsSync(full)) return [{ type: 'missing-file', phase, target, path: rel, message: `${target} file missing: ${rel}` }];
  try {
    const stat = fs.lstatSync(full);
    if (stat.isSymbolicLink()) return [{ type: 'symlink-payload', phase, target, path: rel, message: `${target} payload must not be a symlink: ${rel}` }];
    if (!stat.isFile()) return [{ type: 'not-a-file', phase, target, path: rel, message: `${target} payload is not a regular file: ${rel}` }];
    const bytes = fs.readFileSync(full);
    const sha256 = computeSha256(bytes);
    if (sha256 !== entry.sha256) violations.push({ type: 'changed-byte', phase, target, path: rel, expected: entry.sha256, actual: sha256, message: `${target} file hash mismatch: ${rel} (expected ${entry.sha256}, got ${sha256})` });
    if (bytes.length !== entry.bytes) violations.push({ type: 'bytes-mismatch', phase, target, path: rel, expected: entry.bytes, actual: bytes.length, message: `${target} file size mismatch: ${rel} (expected ${entry.bytes}, got ${bytes.length})` });
    const fsMode = (stat.mode & 0o111) !== 0 ? '100755' : '100644';
    if (fsMode !== entry.mode) violations.push({ type: 'wrong-mode', phase, target, path: rel, expected: entry.mode, actual: fsMode, message: `${target} filesystem mode mismatch: ${rel} (expected ${entry.mode}, got ${fsMode})` });
    const metadata = index.get(rel);
    if (!metadata) violations.push({ type: 'git-index-missing', phase, target, path: rel, message: `${target} payload is absent from the git index: ${rel}` });
    else {
      if (metadata.mode !== entry.mode) violations.push({ type: 'wrong-git-mode', phase, target, path: rel, expected: entry.mode, actual: metadata.mode, message: `${target} git mode mismatch: ${rel} (expected ${entry.mode}, got ${metadata.mode})` });
      if (metadata.blob !== entry.gitBlob) violations.push({ type: 'git-blob-mismatch', phase, target, path: rel, expected: entry.gitBlob, actual: metadata.blob, message: `${target} git blob mismatch: ${rel} (expected ${entry.gitBlob}, got ${metadata.blob})` });
    }
  } catch (error) {
    violations.push({ type: 'io-error', phase, target, path: rel, message: `error reading ${target} file ${rel}: ${error.message}` });
  }
  return violations;
}

export function checkEvidenceRelocation({ manifest, manifestPath = null, consumerTable = null, repoRoot = process.cwd(), mode = 'before', constitution = null } = {}) {
  validateManifest(manifest);
  if (mode !== 'before' && mode !== 'after') throw new Error(`Invalid mode: ${mode} (expected 'before' or 'after')`);
  if (mode === 'before' && !consumerTable) throw new Error('Missing classified consumer table for --before');
  const violations = [];
  const index = gitIndex(repoRoot);
  const beforeSet = new Set(manifest.entries.map((entry) => entry.before));
  const afterSet = new Set(manifest.entries.flatMap((entry) => entry.after ? [entry.after] : []));
  if (mode === 'before') {
    for (const entry of manifest.entries) {
      violations.push(...verifyFile(repoRoot, entry.before, entry, mode, 'legacy', index));
      if (entry.after) violations.push(...verifyFile(repoRoot, entry.after, entry, mode, 'platform', index));
    }
    for (const rel of existingTrackedPayloads(repoRoot, 'architect', index)) if (!beforeSet.has(rel)) violations.push({ type: 'unlisted-payload', phase: mode, target: 'legacy', path: rel, message: `unlisted legacy payload: ${rel}` });
    for (const rel of existingTrackedPayloads(repoRoot, 'platform', index)) if (!afterSet.has(rel)) violations.push({ type: 'unlisted-payload', phase: mode, target: 'platform', path: rel, message: `unlisted platform payload: ${rel}` });
    violations.push(...verifyConsumers(repoRoot, manifest, consumerTable).violations);
  } else {
    for (const entry of manifest.entries) {
      if (fs.existsSync(path.resolve(repoRoot, entry.before))) violations.push({ type: 'remaining-legacy-file', phase: mode, target: 'legacy', path: entry.before, message: `legacy file still exists: ${entry.before}` });
      if (entry.after) violations.push(...verifyFile(repoRoot, entry.after, entry, mode, 'platform', index));
    }
    for (const rel of existingTrackedPayloads(repoRoot, 'architect', index)) if (!beforeSet.has(rel)) violations.push({ type: 'remaining-legacy-file', phase: mode, target: 'legacy', path: rel, message: `legacy payload still exists outside manifest: ${rel}` });
    for (const rel of existingTrackedPayloads(repoRoot, 'platform', index)) if (!afterSet.has(rel)) violations.push({ type: 'unlisted-payload', phase: mode, target: 'platform', path: rel, message: `unlisted platform payload: ${rel}` });
    violations.push(...scanMaintainedTextMentions(repoRoot, manifest, { manifestPath, constitution, consumerTable }));
  }
  violations.sort((a, b) => codepointCompare(a.path ?? '', b.path ?? '') || codepointCompare(a.type ?? '', b.type ?? '') || codepointCompare(a.message ?? '', b.message ?? ''));
  return { ok: violations.length === 0, mode, checkedCount: manifest.entries.length, violations };
}

export function parseArgs(argv) {
  const result = { manifestPath: null, consumerTablePath: DEFAULT_CONSUMER_TABLE_PATH, mode: null, repoRoot: null, json: false, generate: false };
  const takeValue = (flag, index) => {
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
    return value;
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--manifest') result.manifestPath = takeValue(arg, i++);
    else if (arg === '--consumer-table') result.consumerTablePath = takeValue(arg, i++);
    else if (arg === '--before' || arg === '--after') {
      const mode = arg.slice(2);
      if (result.mode && result.mode !== mode) throw new Error('--before and --after are mutually exclusive');
      result.mode = mode;
    } else if (arg === '--generate') result.generate = true;
    else if (arg === '--repo-root') result.repoRoot = takeValue(arg, i++);
    else if (arg === '--json') result.json = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (result.generate && result.mode) throw new Error('--generate cannot be combined with --before or --after');
  return result;
}

function loadJson(fullPath, label) {
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read ${label}: ${error.message}`);
  }
}

export function runCli(argv, defaultRoot = process.cwd()) {
  try {
    const args = parseArgs(argv);
    const repoRoot = path.resolve(args.repoRoot ?? defaultRoot);
    if (args.generate) {
      const manifest = generateManifest({ repoRoot });
      const output = `${JSON.stringify(manifest, null, 2)}\n`;
      if (args.manifestPath) {
        const destination = path.resolve(repoRoot, args.manifestPath);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.writeFileSync(destination, output, 'utf8');
        console.log(`[check-evidence-relocation] Generated manifest at ${args.manifestPath} (${manifest.entries.length} entries)`);
      } else process.stdout.write(output);
      return 0;
    }
    if (!args.manifestPath || !args.mode) throw new Error('Usage: --manifest <path> (--before | --after) [--consumer-table <path>] [--repo-root <path>] [--json]');
    const manifest = loadJson(path.resolve(repoRoot, args.manifestPath), 'manifest');
    const consumerTable = loadJson(path.resolve(repoRoot, args.consumerTablePath), 'consumer table');
    const result = checkEvidenceRelocation({ manifest, manifestPath: args.manifestPath, consumerTable, repoRoot, mode: args.mode });
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else if (result.ok) console.log(`[check-evidence-relocation] PASS: ${args.mode} mode verified (${result.checkedCount} entries, 0 violations)`);
    else {
      console.error(`[check-evidence-relocation] FAIL: ${args.mode} mode found ${result.violations.length} violation(s):`);
      for (const violation of result.violations) console.error(`  - [${violation.type}] ${violation.message}`);
    }
    return result.ok ? 0 : 1;
  } catch (error) {
    console.error(`[check-evidence-relocation] ERROR: ${error.message}`);
    return 2;
  }
}

if (isMainModule(import.meta.url)) process.exitCode = runCli(process.argv.slice(2), process.cwd());
