#!/usr/bin/env node
/**
 * Release Tree Builder for fgOS Rust Host (Phase 09).
 *
 * Stages a self-contained release tree into a disposable directory:
 * - bin/fgos (copied from target/release/fgos)
 * - bin/fgos-runner (POSIX sh shim)
 * - libexec/legacy-node/ (package.json files array payload)
 * - manifest.json (canonical release manifest with artifactDigest)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { releaseBinaryPath } from '../src/util/release-binary-path.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

/**
 * Deterministic, key-sorted canonical JSON serializer (RFC 8785 / JCS compatible).
 * Formats objects with lexicographically sorted keys at all depths and no extra whitespace.
 */
export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  const pairs = keys.map((k) => JSON.stringify(k) + ':' + canonicalJson(value[k]));
  return '{' + pairs.join(',') + '}';
}

/**
 * Computes sha256 of file bytes formatted as "sha256:<hex>".
 */
export function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return 'sha256:' + crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Classifies an entry path according to §5 Release Tree Canonicalization.
 */
export function classifyReleasePath(relPath) {
  if (relPath.startsWith('bin/')) {
    return 'immutable-entry';
  }
  const sub = relPath.startsWith('libexec/legacy-node/')
    ? relPath.slice('libexec/legacy-node/'.length)
    : relPath;

  if (sub.startsWith('.agents/') || sub.startsWith('core/') || sub.startsWith('domains/')) {
    return 'immutable-workshop-source';
  }
  if (sub.startsWith('docs/') || sub === 'README.md' || sub === 'LICENSE') {
    if (sub.endsWith('.json')) return 'metadata';
    return 'immutable-doc';
  }
  if (sub === 'package.json') {
    return 'metadata';
  }
  return 'immutable-runtime';
}

/**
 * Computes artifactDigest from manifest payload without artifactDigest.
 */
export function computeArtifactDigest(manifestWithoutDigest) {
  const serialized = canonicalJson(manifestWithoutDigest);
  return 'sha256:' + crypto.createHash('sha256').update(serialized).digest('hex');
}

/**
 * Recursively walks a directory or file and returns list of relative paths.
 * Refuses symlinks.
 */
function collectSourceFiles(baseDir, relativePath, results) {
  if (path.isAbsolute(relativePath)) {
    throw new Error(`Absolute path refused in declared release payload entry: ${relativePath}`);
  }
  const fullPath = path.join(baseDir, relativePath);
  // Round-2 red-team HIGH: `../outside-payload` is not absolute, so the
  // isAbsolute guard above doesn't catch it, but path.join still resolves
  // it outside baseDir. Refuse anything that escapes the source checkout,
  // matching the same containment discipline the staged-tree side already
  // applies via the disposable-outDir check.
  const resolvedFull = path.resolve(fullPath);
  const resolvedBase = path.resolve(baseDir);
  // Round-3 red-team MEDIUM: a declared entry must resolve to something
  // STRICTLY inside baseDir, never baseDir itself -- an in-root
  // dot-segment like "bin/.." lexically resolves to exactly baseDir
  // without ever leaving it, which the round-2 fix's `!==` exception let
  // through, staging (and packaging) the entire checkout root including
  // unlisted workspace state.
  if (!resolvedFull.startsWith(resolvedBase + path.sep)) {
    throw new Error(`Declared release payload entry escapes the source checkout: ${relativePath}`);
  }
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Declared release payload entry does not exist: ${relativePath}`);
  }

  const stat = fs.lstatSync(fullPath);
  if (stat.isSymbolicLink()) {
    throw new Error(`Symlink refused in release payload: ${relativePath}`);
  }

  if (stat.isFile()) {
    results.push(relativePath);
    return;
  }

  if (stat.isDirectory()) {
    const entries = fs.readdirSync(fullPath).sort();
    for (const ent of entries) {
      if (ent === '.git' || ent === 'node_modules') continue;
      const childRel = path.join(relativePath, ent);
      collectSourceFiles(baseDir, childRel, results);
    }
  }
}

/** Source payload selection shared by release packaging and checkout diagnosis. */
export function listLegacyNodeSourceFiles(repoRoot) {
  const resolvedRepo = path.resolve(repoRoot);
  const pkg = JSON.parse(fs.readFileSync(path.join(resolvedRepo, 'package.json'), 'utf8'));
  const sourceFiles = [];
  for (const declared of Array.isArray(pkg.files) ? pkg.files : []) {
    collectSourceFiles(resolvedRepo, declared, sourceFiles);
  }
  collectSourceFiles(resolvedRepo, 'package.json', sourceFiles);
  return [...new Set(sourceFiles.map((file) => path.relative(resolvedRepo, path.resolve(resolvedRepo, file)).replaceAll('\\', '/')))].sort();
}

/**
 * Finds the installed directory of every production dependency (and of their own dependencies),
 * so the staged legacy-node payload can load them without a checkout around it.
 *
 * A dependency that is not installed is a build error, never a silently thinner payload: the
 * released CLI would then fail at the first verb that imports it. Two different installed copies
 * of one name are refused too, since the staged tree keeps one flat copy per name.
 *
 * @returns {Map<string, string>} package name to its real directory
 */
export function resolveProductionDependencies(repoRoot, pkg) {
  const resolvedRepo = fs.realpathSync(repoRoot);
  const found = new Map();
  const queue = Object.keys(pkg.dependencies ?? {}).map((name) => ({ name, from: resolvedRepo }));
  while (queue.length > 0) {
    const { name, from } = queue.shift();
    let dir = null;
    for (let at = from; ; at = path.dirname(at)) {
      const candidate = path.join(at, 'node_modules', name);
      if (fs.existsSync(path.join(candidate, 'package.json'))) {
        dir = fs.realpathSync(candidate);
        break;
      }
      if (at === resolvedRepo || at === path.dirname(at)) break;
    }
    if (!dir) {
      throw new Error(`Production dependency "${name}" is not installed; run "npm ci" before building the release tree`);
    }
    if (!dir.startsWith(resolvedRepo + path.sep)) {
      throw new Error(`Production dependency "${name}" resolves outside the checkout: ${dir}`);
    }
    if (found.has(name)) {
      if (found.get(name) !== dir) {
        throw new Error(`Production dependency "${name}" is installed in two places; the staged tree keeps one copy per name`);
      }
      continue;
    }
    found.set(name, dir);
    const own = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    for (const child of Object.keys(own.dependencies ?? {})) {
      queue.push({ name: child, from: dir });
    }
  }
  return found;
}

/**
 * Copies every production dependency into <legacyNodeRoot>/node_modules/<name>/, files only,
 * refusing symlinks like the rest of the payload.
 */
function stageProductionDependencies(repoRoot, pkg, legacyNodeRoot) {
  const copyTree = (srcDir, dstDir) => {
    fs.mkdirSync(dstDir, { recursive: true });
    for (const ent of fs.readdirSync(srcDir).sort()) {
      if (ent === 'node_modules' || ent === '.bin') continue;
      const src = path.join(srcDir, ent);
      const dst = path.join(dstDir, ent);
      const stat = fs.lstatSync(src);
      if (stat.isSymbolicLink()) {
        throw new Error(`Symlink refused in release payload dependency: ${src}`);
      }
      if (stat.isDirectory()) {
        copyTree(src, dst);
      } else if (stat.isFile()) {
        fs.copyFileSync(src, dst);
        fs.chmodSync(dst, stat.mode & 0o111 ? 0o755 : 0o644);
      }
    }
  };
  for (const [name, dir] of resolveProductionDependencies(repoRoot, pkg)) {
    copyTree(dir, path.join(legacyNodeRoot, 'node_modules', ...name.split('/')));
  }
}

/**
 * Stages the release tree into outDir.
 */
export function buildRustDistribution({
  outDir,
  repoRoot = REPO_ROOT,
  releaseVersion = null,
  stateSchemas = { read: ['1'], write: ['1'], migrations: [] },
} = {}) {
  if (!outDir) {
    throw new Error('outDir is required (--out)');
  }

  const resolvedOut = path.resolve(outDir);
  const resolvedRepo = path.resolve(repoRoot);

  // Refuse if outDir is inside checkout (unless it is under dist/ disposable build output)
  const isDist =
    resolvedOut === path.join(resolvedRepo, 'dist') ||
    resolvedOut.startsWith(path.join(resolvedRepo, 'dist') + path.sep);
  if (!isDist && (resolvedOut === resolvedRepo || resolvedOut.startsWith(resolvedRepo + path.sep))) {
    throw new Error(`Refusing to stage release tree inside checkout directory: ${resolvedOut}`);
  }

  const releaseBin = releaseBinaryPath(path.join(resolvedRepo, 'target', 'release'), 'fgos');
  if (!fs.existsSync(releaseBin)) {
    throw new Error(`Compiled Rust binary not found at ${releaseBin}. Run "cargo build --release --workspace" first.`);
  }

  // Refuse a non-empty pre-existing --out: silently absorbing stale or
  // planted content into the staged tree (and its artifactDigest) breaks
  // the "reproducible from a virgin directory" property P11/P12 stage and
  // verify against. An empty pre-existing directory (e.g. from
  // fs.mkdtempSync) is still fine.
  if (fs.existsSync(resolvedOut) && fs.readdirSync(resolvedOut).length > 0) {
    throw new Error(`Refusing to stage release tree into non-empty directory: ${resolvedOut}`);
  }

  fs.mkdirSync(resolvedOut, { recursive: true });

  // 1. Stage bin/fgos
  const stagedBinDir = path.join(resolvedOut, 'bin');
  fs.mkdirSync(stagedBinDir, { recursive: true });

  const stagedFgos = path.join(stagedBinDir, 'fgos');
  fs.copyFileSync(releaseBin, stagedFgos);
  fs.chmodSync(stagedFgos, 0o755);
  if (process.platform === 'win32') {
    fs.copyFileSync(releaseBin, path.join(stagedBinDir, 'fgos.exe'));
  }

  // 2. Stage bin/fgos-runner shim
  const stagedRunner = path.join(stagedBinDir, 'fgos-runner');
  const runnerShimContent = [
    '#!/bin/sh',
    'exec node "$(dirname "$0")/../libexec/legacy-node/bin/fgos-runner.mjs" "$@"',
    '',
  ].join('\n');
  fs.writeFileSync(stagedRunner, runnerShimContent, { mode: 0o755 });

  // 3. Stage libexec/legacy-node/ from package.json files
  const pkgPath = path.join(resolvedRepo, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    throw new Error(`package.json not found at ${pkgPath}`);
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const legacyNodeRoot = path.join(resolvedOut, 'libexec', 'legacy-node');
  fs.mkdirSync(legacyNodeRoot, { recursive: true });

  const sourceFiles = listLegacyNodeSourceFiles(resolvedRepo);

  for (const rel of sourceFiles) {
    const srcFull = path.join(resolvedRepo, rel);
    const dstFull = path.join(legacyNodeRoot, rel);
    const stat = fs.lstatSync(srcFull);
    if (stat.isSymbolicLink()) {
      throw new Error(`Symlink refused in release payload: ${rel}`);
    }
    fs.mkdirSync(path.dirname(dstFull), { recursive: true });
    fs.copyFileSync(srcFull, dstFull);
    // Copy executable bit if set
    if (stat.mode & 0o111) {
      fs.chmodSync(dstFull, 0o755);
    } else {
      fs.chmodSync(dstFull, 0o644);
    }
  }

  // 3b. The payload's production dependencies. The source copy above skips node_modules on
  // purpose (the checkout's tree holds dev tooling too); without this the staged CLI cannot
  // import them and every verb that does (workflow, setup registrations) fails after install.
  stageProductionDependencies(resolvedRepo, pkg, legacyNodeRoot);

  // 4. Build files[] descriptor array over the staged tree
  const stagedFiles = [];
  function collectStagedFiles(dir, prefix) {
    const entries = fs.readdirSync(dir).sort();
    for (const ent of entries) {
      const full = path.join(dir, ent);
      const rel = prefix ? prefix + '/' + ent : ent;
      const lstat = fs.lstatSync(full);
      if (lstat.isSymbolicLink()) {
        throw new Error(`Symlink refused in staged tree: ${rel}`);
      }
      if (lstat.isDirectory()) {
        collectStagedFiles(full, rel);
      } else if (lstat.isFile()) {
        if (path.isAbsolute(rel)) {
          throw new Error(`Absolute path refused in manifest files: ${rel}`);
        }
        if (rel === 'manifest.json') {
          // Ratified (round-1 review MEDIUM-3): manifest.json cannot list
          // its own digest in files[], since files[] is itself part of
          // the payload artifactDigest hashes -- including manifest.json
          // with a digest of its own not-yet-final content is circular.
          // manifest.json's identity IS artifactDigest; that is its
          // digest, expressed at the top level instead of a self-entry.
          continue;
        }
        stagedFiles.push(rel);
      }
    }
  }
  collectStagedFiles(resolvedOut, '');

  // Check case collision
  const seenLower = new Set();
  for (const p of stagedFiles) {
    const lower = p.toLowerCase();
    if (seenLower.has(lower)) {
      throw new Error(`Case-insensitive path collision detected: ${p}`);
    }
    seenLower.add(lower);
  }

  // Normalize and sort
  const normalizedFiles = stagedFiles
    .map((p) => p.replaceAll('\\', '/').normalize('NFC'))
    .sort();

  const fileEntries = normalizedFiles.map((relPath) => {
    const full = path.join(resolvedOut, relPath);
    const stat = fs.statSync(full);
    const isExec = Boolean(stat.mode & 0o111) || relPath.startsWith('bin/');
    return {
      path: relPath,
      kind: 'file',
      digest: hashFile(full),
      mode: isExec ? '755' : '644',
      class: classifyReleasePath(relPath),
    };
  });

  // 5. Build manifest
  const legacyNodeEntryPath = path.join(legacyNodeRoot, 'bin', 'fgos.mjs');
  if (!fs.existsSync(legacyNodeEntryPath)) {
    throw new Error(`Legacy node entry missing at ${legacyNodeEntryPath}`);
  }
  const legacyNodeDigest = hashFile(legacyNodeEntryPath);

  const manifestWithoutDigest = {
    schemaVersion: 1,
    entries: {
      fgos: 'bin/fgos',
      fgosRunner: 'bin/fgos-runner',
    },
    components: {
      legacyNode: {
        root: 'libexec/legacy-node',
        entry: 'bin/fgos.mjs',
        digest: legacyNodeDigest,
      },
    },
    requires: {
      node: pkg.engines?.node ?? '>=18',
    },
    target: {
      os: 'linux',
      arch: 'x64',
      libc: 'glibc',
    },
    stateSchemas,
    files: fileEntries,
  };

  if (releaseVersion) {
    manifestWithoutDigest.releaseVersion = releaseVersion;
  }

  const artifactDigest = computeArtifactDigest(manifestWithoutDigest);

  const manifest = {
    schemaVersion: manifestWithoutDigest.schemaVersion,
    artifactDigest,
    ...(manifestWithoutDigest.releaseVersion
      ? { releaseVersion: manifestWithoutDigest.releaseVersion }
      : {}),
    entries: manifestWithoutDigest.entries,
    components: manifestWithoutDigest.components,
    requires: manifestWithoutDigest.requires,
    target: manifestWithoutDigest.target,
    ...(manifestWithoutDigest.stateSchemas
      ? { stateSchemas: manifestWithoutDigest.stateSchemas }
      : {}),
    files: manifestWithoutDigest.files,
  };

  const manifestPath = path.join(resolvedOut, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  return {
    outDir: resolvedOut,
    artifactDigest,
    fileCount: fileEntries.length,
    manifestPath,
  };
}

// CLI entry point
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  let outDir = null;
  let repoRoot = REPO_ROOT;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) {
      outDir = args[i + 1];
      i++;
    } else if (args[i] === '--repo-root' && args[i + 1]) {
      repoRoot = path.resolve(args[i + 1]);
      i++;
    }
  }

  if (!outDir) {
    console.error('Usage: node scripts/build-rust-distribution.mjs --out <output-directory>');
    process.exit(1);
  }

  try {
    const result = buildRustDistribution({ outDir, repoRoot });
    console.log(`Release tree staged successfully to ${result.outDir}`);
    console.log(`artifactDigest: ${result.artifactDigest}`);
    console.log(`Staged files: ${result.fileCount}`);
  } catch (err) {
    console.error(`Build failed: ${err.message}`);
    process.exit(1);
  }
}
