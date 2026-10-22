// src/runner/documentation-cutover-lease.mjs -- exclusive write lease for documentation cutover.
//
// The kernel handle (holder-lock rank 10 lease) serializes transitions (acquire,
// release, abandon); the committed evidence sidecar on refs/heads/main carries
// the persistent freeze authority across processes and holder death. Refusals
// fail-closed with no TTL (decision 1). Holder identity uses a random token stored
// outside the environment (decision 9); refusal messages never print the token or session id.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { acquireSync, probe, createLockScope } from '../holder-lock/index.mjs';
import { createGitInspect, gitPortOptions } from '../git/inspect.mjs';
import { mainCheckoutHookWired } from '../setup/git-hooks.mjs';

export const DEFAULT_LOCK_NAME = 'documentation-cutover';
export const DEFAULT_SIDECAR_PATH = 'plans/documentation-cutover-lease.json';
export const DEFAULT_TOKEN_FILE = '.fgos/documentation-cutover.token';

/** Fixed scope roots and exact files (decision 4 + L12-94 refinement 3). */
export const LEASE_SCOPE_PATTERNS = Object.freeze([
  'docs/**',
  'AGENTS.md',
  'CLAUDE.md',
  'docs/transitional-switchboard.md',
  'plans/260925-documentation-authority-unification/transitional-switchboard.json',
  'core/skills/**',
  '.agents/skills/**',
  'plugins/fgOS/skills/**',
  DEFAULT_SIDECAR_PATH,
]);

/** Normalize relative path separators and remove leading ./ or / */
export function normalizeScopePath(rawPath) {
  if (rawPath === null || rawPath === undefined) return '';
  const str = typeof rawPath === 'string' ? rawPath : String(rawPath);
  return str.replace(/\\/g, '/').replace(/^\.?\//, '').trim();
}

/** Check if a single file path falls inside the documentation cutover lease scope. */
export function isScopedPath(targetPath, { sidecarPath = DEFAULT_SIDECAR_PATH } = {}) {
  let norm = '';
  if (Buffer.isBuffer(targetPath)) {
    norm = normalizeScopePath(targetPath.toString('utf8'));
  } else {
    norm = normalizeScopePath(targetPath);
  }
  if (!norm) return false;
  if (norm === 'AGENTS.md' || norm === 'CLAUDE.md') return true;
  if (norm === 'docs/transitional-switchboard.md') return true;
  if (norm === 'plans/260925-documentation-authority-unification/transitional-switchboard.json') return true;
  if (sidecarPath && norm === normalizeScopePath(sidecarPath)) return true;
  if (norm === 'docs' || norm.startsWith('docs/')) return true;
  if (norm === 'core/skills' || norm.startsWith('core/skills/')) return true;
  if (norm === '.agents/skills' || norm.startsWith('.agents/skills/')) return true;
  if (norm === 'plugins/fgOS/skills' || norm.startsWith('plugins/fgOS/skills/')) return true;
  return false;
}

/** Check if an array or iterable of paths intersects the lease scope. */
export function intersectsScope(paths, options = {}) {
  if (!paths) return false;
  const list = Array.isArray(paths) ? paths : Array.from(paths);
  for (const p of list) {
    if (isScopedPath(p, options)) return true;
  }
  return false;
}

/** Generate a cryptographically random holder token (32 bytes hex). */
export function generateHolderToken() {
  return crypto.randomBytes(32).toString('hex');
}

/** Compute sha256 hash of a holder token. */
export function hashHolderToken(token) {
  if (typeof token !== 'string') return '';
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/** Safely read and parse the sidecar JSON from disk (convenience/fallback). */
export function readSidecar(sidecarFullPath) {
  try {
    const raw = fs.readFileSync(sidecarFullPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Atomically write sidecar data (write to .tmp then rename). */
export function writeSidecarAtomic(sidecarFullPath, data) {
  fs.mkdirSync(path.dirname(sidecarFullPath), { recursive: true });
  const tmpPath = `${sidecarFullPath}.${process.pid}.${Date.now()}.tmp`;
  const content = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(tmpPath, content, 'utf8');
  fs.renameSync(tmpPath, sidecarFullPath);
}

/** Resolve main checkout directory for linked worktrees using typed Git Inspect port. */
export function resolveMainCheckoutRoot(committingToplevel = process.cwd()) {
  try {
    const port = createGitInspect(gitPortOptions(committingToplevel));
    const facts = port.resolveRepo();
    if (facts && !facts.notARepository && facts.trustedMainRoot) {
      return facts.trustedMainRoot;
    }
  } catch {}
  return path.resolve(committingToplevel);
}

/** Read token from token file in worktree root (never falls back to main checkout). */
export function readTokenFromWorktree(worktreeRoot, explicitTokenPath) {
  if (explicitTokenPath && fs.existsSync(explicitTokenPath)) {
    try {
      const token = fs.readFileSync(explicitTokenPath, 'utf8').trim();
      if (token) return token;
    } catch {}
  }
  const candidate = path.join(worktreeRoot, DEFAULT_TOKEN_FILE);
  if (fs.existsSync(candidate)) {
    try {
      const token = fs.readFileSync(candidate, 'utf8').trim();
      if (token) return token;
    } catch {}
  }
  return null;
}

/** Compute real scope digests (tree or blob IDs) at refs/heads/main via Git Inspect. */
export function computeScopeDigests(repoRoot) {
  const digests = {};
  try {
    const port = createGitInspect(gitPortOptions(repoRoot));
    const trunkRef = port.resolveRef({ name: 'refs/heads/main' });
    if (!trunkRef || !trunkRef.oid) return digests;
    const tree = port.listTree({ revision: trunkRef.oid, prefix: '', maxEntries: 256 });
    const targetNames = new Set([
      'docs',
      'AGENTS.md',
      'CLAUDE.md',
      'docs/transitional-switchboard.md',
      'plans/260925-documentation-authority-unification/transitional-switchboard.json',
      'core/skills',
      '.agents/skills',
      'plugins/fgOS/skills',
    ]);
    for (const entry of tree.entries ?? []) {
      const p = Buffer.from(entry.path).toString('utf8');
      if (targetNames.has(p)) {
        digests[p] = entry.oid;
      }
    }
  } catch {}
  return digests;
}

function parseSidecarJson(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') {
      return { status: 'corrupt', error: 'not-object', raw };
    }
    if (data.state === 'held') {
      return { status: 'held', state: 'held', sidecar: data };
    }
    if (data.state === 'released' || data.state === 'abandoned') {
      return { status: 'present', state: data.state, sidecar: data };
    }
    return { status: 'corrupt', error: 'unknown-state', state: data.state, sidecar: data };
  } catch (err) {
    return { status: 'corrupt', error: 'json-parse-failed', raw };
  }
}

/** Read sidecar blob from refs/heads/main via Git Inspect port. Fail-closed: returns corrupt if unreadable. */
export function readSidecarFromMain(repoRoot, sidecarRelPath = DEFAULT_SIDECAR_PATH, options = {}) {
  if (options.readMainBlob) {
    const raw = options.readMainBlob(sidecarRelPath);
    if (!raw) return { status: 'absent' };
    return parseSidecarJson(raw);
  }

  try {
    const port = createGitInspect(gitPortOptions(repoRoot));
    const trunkRef = port.resolveRef({ name: 'refs/heads/main' });
    if (!trunkRef || !trunkRef.oid) {
      return { status: 'absent' };
    }
    const pathBytes = Array.from(Buffer.from(sidecarRelPath));
    const results = port.pathsAtRevision({
      revision: trunkRef.oid,
      paths: [pathBytes],
      maxBlobBytes: 1048576,
    });
    if (!results || results.length === 0 || results[0].value.kind === 'absent') {
      return { status: 'absent' };
    }
    if (results[0].value.kind !== 'present') {
      return { status: 'corrupt', error: 'not-blob' };
    }
    const raw = Buffer.from(results[0].value.bytes).toString('utf8');
    return parseSidecarJson(raw);
  } catch (err) {
    return { status: 'corrupt', error: err.message };
  }
}

/**
 * Acquire the documentation-cutover write lease.
 * Takes kernel lock first, checks preconditions and sidecar under the lock,
 * writes token file only in holder worktree, commits held sidecar onto refs/heads/main,
 * and returns tokenPath without ever exposing the raw token.
 */
export function acquireDocumentationCutoverLease(options = {}) {
  const callerCwd = path.resolve(options.repoRoot ?? process.cwd());
  const mainRoot = resolveMainCheckoutRoot(callerCwd) ?? callerCwd;
  const holderWorktree = options.worktree ? path.resolve(options.worktree) : callerCwd;
  const fgosDir = options.fgosDir ?? path.join(mainRoot, '.fgos');
  const sidecarRelPath = options.sidecarPath ?? DEFAULT_SIDECAR_PATH;
  const sidecarFullPath = path.isAbsolute(sidecarRelPath) ? sidecarRelPath : path.join(mainRoot, sidecarRelPath);
  const tokenFullPath = path.join(holderWorktree, DEFAULT_TOKEN_FILE);

  // 1. Take kernel lock FIRST to serialize acquire
  const scope = createLockScope('documentation-cutover-acquire');
  const kernelAcquire = acquireSync(scope, DEFAULT_LOCK_NAME, { fgosDir });
  if (kernelAcquire.result !== 'acquired') {
    const error = new Error(`documentation-cutover kernel lock could not be acquired (${kernelAcquire.result})`);
    error.code = 'lock-held';
    throw error;
  }

  try {

    // 2. Under the lock, check if lease is already held on refs/heads/main or local sidecar
    const existing = readSidecarFromMain(mainRoot, sidecarRelPath, options);
    const existingDisk = readSidecar(sidecarFullPath);
    if (existing.status === 'held' || existingDisk?.state === 'held') {
      const acquiredAt = existing.sidecar?.acquiredAt ?? existingDisk?.acquiredAt;
      const error = new Error(`documentation-cutover lease is already held (acquired at ${acquiredAt})`);
      error.code = 'lease-already-held';
      throw error;
    }

    // 3. Generate random holder token and write ONLY to holder worktree's .fgos/
    const token = generateHolderToken();
    const tokenHash = hashHolderToken(token);
    fs.mkdirSync(path.dirname(tokenFullPath), { recursive: true });
    fs.writeFileSync(tokenFullPath, `${token}\n`, { mode: 0o600 });

    // 4. Record baseCommit from main, branch, and scope digests
    let baseCommit = options.baseCommit ?? null;
    if (!baseCommit) {
      try {
        const port = createGitInspect(gitPortOptions(mainRoot));
        const trunkRef = port.resolveRef({ name: 'refs/heads/main' });
        baseCommit = trunkRef?.oid ?? null;
      } catch {}
    }

    const branch = options.branch ?? 'main';
    const scopeDigests = options.scopeDigests ?? computeScopeDigests(mainRoot);

    const sidecarData = {
      contract: { id: 'documentation-cutover-lease', version: 1 },
      state: 'held',
      holderTokenHash: tokenHash,
      acquiredAt: options.now ? options.now() : new Date().toISOString(),
      worktree: holderWorktree,
      branch,
      baseCommit,
      scope: [...LEASE_SCOPE_PATTERNS],
      scopeDigests,
      checkedBranches: options.checkedBranches ?? [],
    };

    // 5. Write sidecar atomic file and invoke commitSidecar hook if supplied
    writeSidecarAtomic(sidecarFullPath, sidecarData);
    if (typeof options.commitSidecar === 'function') {
      options.commitSidecar(sidecarData);
    }

    // Never return the raw token (Ruling 2, Finding H5)
    return {
      result: 'acquired',
      tokenHash,
      tokenPath: tokenFullPath,
      sidecar: sidecarData,
    };
  } finally {
    kernelAcquire.handle.release();
  }
}

/**
 * Inspect the status of the documentation-cutover write lease.
 * Reads from refs/heads/main authority.
 */
export function inspectDocumentationCutoverLease(options = {}) {
  const callerCwd = path.resolve(options.repoRoot ?? process.cwd());
  const mainRoot = resolveMainCheckoutRoot(callerCwd) ?? callerCwd;
  const fgosDir = options.fgosDir ?? path.join(mainRoot, '.fgos');
  const sidecarRelPath = options.sidecarPath ?? DEFAULT_SIDECAR_PATH;

  const lease = readSidecarFromMain(mainRoot, sidecarRelPath, options);
  if (lease.status === 'corrupt') {
    return {
      state: 'corrupt',
      held: true,
      sidecar: null,
    };
  }
  if (lease.status !== 'held') {
    return {
      state: lease.state ?? 'free',
      held: false,
      sidecar: lease.sidecar ?? null,
    };
  }

  const sidecar = lease.sidecar;

  let kernelProbe = { result: 'unknown' };
  try {
    kernelProbe = probe(DEFAULT_LOCK_NAME, { fgosDir });
  } catch {}

  const now = options.now ? new Date(options.now()).getTime() : Date.now();
  const acquiredMs = new Date(sidecar.acquiredAt).getTime();
  const ageMs = Math.max(0, now - acquiredMs);

  return {
    state: 'held',
    held: true,
    acquiredAt: sidecar.acquiredAt,
    ageMs,
    holderTokenHash: sidecar.holderTokenHash,
    kernelLock: kernelProbe.result,
    worktree: sidecar.worktree,
    branch: sidecar.branch,
    baseCommit: sidecar.baseCommit,
    scope: sidecar.scope,
    scopeDigests: sidecar.scopeDigests,
    sidecar,
  };
}

/**
 * Release the documentation-cutover write lease (holder only).
 * Serialized under the kernel lock. Compares scope digests against acquire-time
 * digests to catch drift and hook bypasses.
 */
export function releaseDocumentationCutoverLease(options = {}) {
  const callerCwd = path.resolve(options.repoRoot ?? process.cwd());
  const mainRoot = resolveMainCheckoutRoot(callerCwd) ?? callerCwd;
  const fgosDir = options.fgosDir ?? path.join(mainRoot, '.fgos');
  const sidecarRelPath = options.sidecarPath ?? DEFAULT_SIDECAR_PATH;
  const sidecarFullPath = path.isAbsolute(sidecarRelPath) ? sidecarRelPath : path.join(mainRoot, sidecarRelPath);
  const tokenRelPath = options.tokenPath ?? DEFAULT_TOKEN_FILE;
  const tokenFullPath = path.isAbsolute(tokenRelPath) ? tokenRelPath : path.join(callerCwd, tokenRelPath);

  const scope = createLockScope('documentation-cutover-release');
  const kernelAcquire = acquireSync(scope, DEFAULT_LOCK_NAME, { fgosDir });
  if (kernelAcquire.result !== 'acquired') {
    const error = new Error(`documentation-cutover kernel lock could not be acquired (${kernelAcquire.result})`);
    error.code = 'lock-held';
    throw error;
  }

  try {
    const lease = readSidecarFromMain(mainRoot, sidecarRelPath, options);
    if (lease.status === 'corrupt') {
      const error = new Error('documentation-cutover lease sidecar on refs/heads/main is corrupt or unreadable');
      error.code = 'corrupt-sidecar';
      throw error;
    }
    if (lease.status !== 'held') {
      const error = new Error('documentation-cutover lease is not held');
      error.code = 'lease-not-held';
      throw error;
    }

    const sidecar = lease.sidecar;

    // Verify caller possesses holder token in its worktree
    const token = readTokenFromWorktree(callerCwd, tokenFullPath);
    if (!token || hashHolderToken(token) !== sidecar.holderTokenHash) {
      const error = new Error('caller is not the documentation-cutover lease holder');
      error.code = 'not-holder';
      throw error;
    }

    // Compare scope digests to catch drift (Ruling 8, Finding M2)
    const currentDigests = computeScopeDigests(mainRoot);
    const recordedDigests = sidecar.scopeDigests ?? {};
    const drifted = [];
    for (const [scopePath, acquireDigest] of Object.entries(recordedDigests)) {
      const currentDigest = currentDigests[scopePath];
      if (currentDigest !== acquireDigest) {
        drifted.push(`${scopePath} (was ${acquireDigest}, now ${currentDigest ?? 'missing'})`);
      }
    }
    if (drifted.length > 0) {
      const error = new Error(`documentation-cutover release refused: scoped paths drifted during lease: ${drifted.join(', ')}`);
      error.code = 'scope-drift';
      throw error;
    }

    const releasedAt = options.now ? options.now() : new Date().toISOString();
    sidecar.state = 'released';
    sidecar.releasedAt = releasedAt;
    sidecar.releaseScopeDigests = currentDigests;

    writeSidecarAtomic(sidecarFullPath, sidecar);
    if (typeof options.commitSidecar === 'function') {
      options.commitSidecar(sidecar);
    }

    // Remove local token file
    try {
      if (fs.existsSync(tokenFullPath)) fs.unlinkSync(tokenFullPath);
    } catch {}

    return {
      result: 'released',
      releasedAt,
      sidecar,
    };
  } finally {
    kernelAcquire.handle.release();
  }
}

/**
 * Abandon a held documentation-cutover write lease.
 * Serialized under kernel lock. Requires owner confirmation and written reason.
 * Refuses while kernel lock is actively held by a live process.
 */
export function abandonDocumentationCutoverLease(options = {}) {
  const callerCwd = path.resolve(options.repoRoot ?? process.cwd());
  const mainRoot = resolveMainCheckoutRoot(callerCwd) ?? callerCwd;
  const fgosDir = options.fgosDir ?? path.join(mainRoot, '.fgos');
  const sidecarRelPath = options.sidecarPath ?? DEFAULT_SIDECAR_PATH;
  const sidecarFullPath = path.isAbsolute(sidecarRelPath) ? sidecarRelPath : path.join(mainRoot, sidecarRelPath);
  const tokenRelPath = options.tokenPath ?? DEFAULT_TOKEN_FILE;
  const tokenFullPath = path.isAbsolute(tokenRelPath) ? tokenRelPath : path.join(callerCwd, tokenRelPath);

  const scope = createLockScope('documentation-cutover-abandon');
  const kernelAcquire = acquireSync(scope, DEFAULT_LOCK_NAME, { fgosDir });
  if (kernelAcquire.result !== 'acquired') {
    const error = new Error(`documentation-cutover kernel lock could not be acquired (${kernelAcquire.result})`);
    error.code = 'lock-held';
    throw error;
  }

  try {
    const lease = readSidecarFromMain(mainRoot, sidecarRelPath, options);
    if (lease.status !== 'held' && lease.status !== 'corrupt') {
      const error = new Error('documentation-cutover lease is not held');
      error.code = 'lease-not-held';
      throw error;
    }

    const sidecar = lease.sidecar ?? {
      contract: { id: 'documentation-cutover-lease', version: 1 },
      holderTokenHash: 'corrupt',
      acquiredAt: new Date().toISOString(),
    };

    const ownerConfirmed = Boolean(options.ownerConfirmed || options['owner-confirmed']);
    const reason = typeof options.reason === 'string' ? options.reason.trim() : '';

    if (!ownerConfirmed || !reason) {
      const error = new Error('abandoning a held documentation-cutover lease requires owner confirmation (--owner-confirmed) and a written reason (--reason <text>)');
      error.code = 'owner-confirmation-required';
      throw error;
    }

    const now = options.now ? new Date(options.now()).getTime() : Date.now();
    const acquiredMs = new Date(sidecar.acquiredAt).getTime();
    const ageMs = Math.max(0, now - acquiredMs);
    const abandonedAt = options.now ? options.now() : new Date().toISOString();

    sidecar.state = 'abandoned';
    sidecar.abandon = {
      abandonedAt,
      by: options.by ?? 'owner',
      reason,
      holderTokenHash: sidecar.holderTokenHash,
      ageMs,
    };

    writeSidecarAtomic(sidecarFullPath, sidecar);
    if (typeof options.commitSidecar === 'function') {
      options.commitSidecar(sidecar);
    }

    try {
      if (fs.existsSync(tokenFullPath)) fs.unlinkSync(tokenFullPath);
    } catch {}

    return {
      result: 'abandoned',
      abandonedAt,
      reason,
      sidecar,
    };
  } finally {
    kernelAcquire.handle.release();
  }
}

/**
 * Gate admission check: returns allow/refuse decision for later gates.
 * Reads from refs/heads/main authority.
 * Refusal messages never print the holder identity or token.
 */
export function leaseAdmission(ctx = {}) {
  const repoRoot = path.resolve(ctx.repoRoot ?? process.cwd());
  const mainRoot = resolveMainCheckoutRoot(repoRoot) ?? repoRoot;
  const sidecarRelPath = ctx.sidecarPath ?? DEFAULT_SIDECAR_PATH;

  const lease = readSidecarFromMain(mainRoot, sidecarRelPath, ctx);
  if (lease.status === 'absent') {
    return { allowed: true };
  }
  if (lease.status === 'corrupt') {
    return {
      allowed: false,
      holder: false,
      reason: 'documentation-cutover-lease-corrupt',
      message: 'documentation cutover lease sidecar on refs/heads/main is corrupt or unreadable; non-holder operations are refused. Run "fgos docs-lease status" or "fgos docs-lease abandon".',
    };
  }
  if (lease.state !== 'held') {
    return { allowed: true };
  }

  const sidecar = lease.sidecar;

  let token = ctx.token;
  if (!token && ctx.tokenPath) {
    token = readTokenFromWorktree(repoRoot, ctx.tokenPath);
  }
  if (!token) {
    const worktreeRoot = ctx.worktreePath ?? repoRoot;
    token = readTokenFromWorktree(worktreeRoot);
  }

  const isHolder = Boolean(token && hashHolderToken(token) === sidecar.holderTokenHash);
  if (isHolder) {
    return { allowed: true, holder: true };
  }

  if (ctx.paths && !intersectsScope(ctx.paths, { sidecarPath: sidecarRelPath })) {
    return { allowed: true, holder: false, reason: 'out-of-scope' };
  }

  return {
    allowed: false,
    holder: false,
    reason: 'documentation-cutover-lease',
    message: 'documentation cutover lease is held (mutations to documentation roots are frozen); non-holder operations are refused. Run "fgos docs-lease status" or "fgos docs-lease abandon".',
  };
}

/**
 * Pre-commit hook guard helper: checks staged paths against scope when lease is held.
 * Refuses non-holder commits to scoped files.
 */
export function checkLeaseCommitGuard(committingToplevel = process.cwd(), options = {}) {
  const mainRoot = resolveMainCheckoutRoot(committingToplevel) ?? committingToplevel;
  const sidecarRelPath = options.sidecarPath ?? DEFAULT_SIDECAR_PATH;
  const lease = options.rawSidecarBlob !== undefined
    ? parseSidecarJson(options.rawSidecarBlob)
    : readSidecarFromMain(mainRoot, sidecarRelPath, options);
  if (lease.status === 'corrupt') {
    return 'commit refused: the documentation-cutover write lease sidecar on refs/heads/main is corrupt or unreadable; failing closed. Run "fgos docs-lease status" or "fgos docs-lease abandon".';
  }
  if (lease.status === 'absent' || lease.state !== 'held') {
    return null;
  }

  const sidecar = lease.sidecar;
  const staged = options.stagedPaths ?? [];
  if (!intersectsScope(staged, { sidecarPath: sidecarRelPath })) {
    return null;
  }

  const token = options.token ?? readTokenFromWorktree(committingToplevel);
  if (token && hashHolderToken(token) === sidecar.holderTokenHash) {
    return null;
  }

  return 'commit refused: the documentation-cutover write lease is held (mutations to documentation roots are frozen); non-holder commits to scoped paths are refused. Run "fgos docs-lease status" or "fgos docs-lease abandon".';
}

/** Doctor check helper: verifies health of the documentation-cutover lease. */
export function checkDocumentationCutoverLeaseDoctor(cwd = process.cwd(), options = {}) {
  const mainRoot = resolveMainCheckoutRoot(cwd) ?? cwd;
  const sidecarRelPath = options.sidecarPath ?? DEFAULT_SIDECAR_PATH;
  const fgosDir = options.fgosDir ?? path.join(mainRoot, '.fgos');

  let refHookWired = false;
  try {
    const hookWired = mainCheckoutHookWired(mainRoot);
    const hooksDir = path.join(mainRoot, '.githooks');
    refHookWired = hookWired && fs.existsSync(path.join(hooksDir, 'reference-transaction'));
  } catch {}
  const lease = readSidecarFromMain(mainRoot, sidecarRelPath, options);
  if (lease.status === 'corrupt') {
    return {
      passed: false,
      message: 'documentation-cutover lease sidecar on refs/heads/main is corrupt or unreadable',
    };
  }

  if (lease.status === 'absent' || lease.state !== 'held') {
    if (!refHookWired) {
      return {
        passed: false,
        message: 'documentation-cutover reference-transaction hook is not wired (core.hooksPath must resolve to .githooks)',
      };
    }
    return { passed: true, message: 'no documentation-cutover lease is held; reference-transaction hook wired' };
  }

  const sidecar = lease.sidecar;

  const lockFilePath = path.join(fgosDir, 'locks', `${DEFAULT_LOCK_NAME}.lock`);
  const lockExists = fs.existsSync(lockFilePath);
  if (!lockExists) {
    return {
      passed: false,
      message: 'documentation-cutover lease is marked held in sidecar, but kernel lock file is missing in main checkout',
    };
  }

  const isHolderWorktree = path.resolve(cwd) === path.resolve(sidecar.worktree);
  if (isHolderWorktree) {
    const tokenFullPath = path.join(cwd, DEFAULT_TOKEN_FILE);
    const token = readTokenFromWorktree(cwd, tokenFullPath);
    if (!token || hashHolderToken(token) !== sidecar.holderTokenHash) {
      return {
        passed: false,
        message: 'documentation-cutover lease is held, but holder token file is missing or mismatched in holder worktree',
      };
    }
  }

  const now = options.now ? new Date(options.now()).getTime() : Date.now();
  const ageSec = Math.round(Math.max(0, now - new Date(sidecar.acquiredAt).getTime()) / 1000);
  return {
    passed: false,
    message: `documentation-cutover lease is actively held (age: ${ageSec}s); mutations to documentation roots are frozen -- run "fgos docs-lease status" or "fgos docs-lease abandon"`,
  };
}
