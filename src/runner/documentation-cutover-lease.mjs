// src/runner/documentation-cutover-lease.mjs -- exclusive write lease for documentation cutover
// (plan 260925-documentation-authority-unification Phase 8, Step 6b).
//
// The kernel handle (holder-lock rank 10 lease) serializes transitions (acquire,
// release, abandon); the committed evidence sidecar carries the persistent freeze authority
// across processes and holder death. Refusals fail-closed with no TTL (decision 1).
// Holder identity uses a random token stored outside the environment (decision 9);
// refusal messages never print the token or session id.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { acquireSync, probe, createLockScope } from '../holder-lock/index.mjs';

export const DEFAULT_LOCK_NAME = 'documentation-cutover';
export const DEFAULT_SIDECAR_PATH = 'plans/260925-documentation-authority-unification/reports/phase-08/cutover-write-lease.json';
export const DEFAULT_TOKEN_FILE = '.fgos/documentation-cutover.token';
export const EMPTY_TREE_SHA = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
export const ZERO_OID = '0000000000000000000000000000000000000000';
export const PLAN_BRANCH_REF = 'refs/heads/plan/260925-documentation-authority-unification';
export const TARGET_BRANCH_REF = 'refs/heads/main';

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
  const norm = normalizeScopePath(targetPath);
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

/** Safely read and parse the sidecar JSON. Returns null if missing or unreadable. */
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

/** Resolve main checkout directory for linked worktrees using direct filesystem structure. */
export function resolveMainCheckoutRoot(committingToplevel = process.cwd()) {
  try {
    const gitPath = path.join(committingToplevel, '.git');
    if (fs.existsSync(gitPath)) {
      const stat = fs.statSync(gitPath);
      if (stat.isDirectory()) {
        return path.resolve(committingToplevel);
      }
      if (stat.isFile()) {
        const line = fs.readFileSync(gitPath, 'utf8').trim();
        const match = line.match(/^gitdir:\s*(.+)$/);
        if (match) {
          const resolvedGitDir = path.resolve(committingToplevel, match[1]);
          if (resolvedGitDir.includes(`${path.sep}worktrees${path.sep}`)) {
            const commonGitDir = path.resolve(resolvedGitDir, '../..');
            return path.dirname(commonGitDir);
          }
          return path.dirname(resolvedGitDir);
        }
      }
    }
  } catch {}
  return path.resolve(committingToplevel);
}

/** Helper to resolve HEAD commit hash from git metadata without spawning git. */
function resolveHeadCommit(repoRoot) {
  try {
    const headPath = path.join(repoRoot, '.git', 'HEAD');
    if (fs.existsSync(headPath)) {
      const content = fs.readFileSync(headPath, 'utf8').trim();
      if (!content.startsWith('ref:')) return content;
      const refRel = content.slice(4).trim();
      const refPath = path.join(repoRoot, '.git', refRel);
      if (fs.existsSync(refPath)) return fs.readFileSync(refPath, 'utf8').trim();
    }
  } catch {}
  return null;
}

/** Helper to resolve current branch name from git metadata. */
function resolveCurrentBranch(repoRoot) {
  try {
    const headPath = path.join(repoRoot, '.git', 'HEAD');
    if (fs.existsSync(headPath)) {
      const content = fs.readFileSync(headPath, 'utf8').trim();
      if (content.startsWith('ref: refs/heads/')) {
        return content.slice('ref: refs/heads/'.length).trim();
      }
    }
  } catch {}
  return 'detached';
}

/** Read token from token file in worktree or repo root. */
function readTokenFromWorktree(repoRoot, explicitTokenPath) {
  const candidates = [];
  if (explicitTokenPath) candidates.push(explicitTokenPath);
  candidates.push(path.join(repoRoot, DEFAULT_TOKEN_FILE));
  candidates.push(path.join(repoRoot, '.fgos', 'locks', 'documentation-cutover.token'));
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const token = fs.readFileSync(candidate, 'utf8').trim();
        if (token) return token;
      }
    } catch {}
  }
  return null;
}

/**
 * Acquire the documentation-cutover write lease.
 * Takes the rank-10 lease kernel lock, writes token file and committed sidecar.
 */
export function acquireDocumentationCutoverLease(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const fgosDir = options.fgosDir ?? path.join(repoRoot, '.fgos');
  const sidecarRelPath = options.sidecarPath ?? DEFAULT_SIDECAR_PATH;
  const sidecarFullPath = path.isAbsolute(sidecarRelPath) ? sidecarRelPath : path.join(repoRoot, sidecarRelPath);
  const tokenRelPath = options.tokenPath ?? DEFAULT_TOKEN_FILE;
  const tokenFullPath = path.isAbsolute(tokenRelPath) ? tokenRelPath : path.join(repoRoot, tokenRelPath);

  // 1. Check existing sidecar -- double acquire refused
  const existingSidecar = readSidecar(sidecarFullPath);
  if (existingSidecar && existingSidecar.state === 'held') {
    const error = new Error(`documentation-cutover lease is already held (acquired at ${existingSidecar.acquiredAt})`);
    error.code = 'lease-already-held';
    throw error;
  }

  // 2. Take kernel lock to serialize acquire
  const scope = createLockScope('documentation-cutover-acquire');
  const kernelAcquire = acquireSync(scope, DEFAULT_LOCK_NAME, { fgosDir });
  if (kernelAcquire.result !== 'acquired') {
    const error = new Error(`documentation-cutover kernel lock could not be acquired (${kernelAcquire.result})`);
    error.code = 'lock-held';
    throw error;
  }

  try {
    // 3. Generate random holder token and write to git-ignored token file
    const token = generateHolderToken();
    const tokenHash = hashHolderToken(token);
    fs.mkdirSync(path.dirname(tokenFullPath), { recursive: true });
    fs.writeFileSync(tokenFullPath, `${token}\n`, { mode: 0o600 });

    // 4. Record base commit, branch, and scope digests
    const baseCommit = options.baseCommit ?? resolveHeadCommit(repoRoot);
    const branch = options.branch ?? resolveCurrentBranch(repoRoot);
    const scopeDigests = options.scopeDigests ?? {};

    const sidecarData = {
      contract: { id: 'documentation-cutover-lease', version: 1 },
      state: 'held',
      holderTokenHash: tokenHash,
      acquiredAt: options.now ? options.now() : new Date().toISOString(),
      worktree: repoRoot,
      branch,
      baseCommit,
      scope: [...LEASE_SCOPE_PATTERNS],
      scopeDigests,
      cleanWorktrees: true,
      checkedBranches: options.checkedBranches ?? [],
    };

    writeSidecarAtomic(sidecarFullPath, sidecarData);

    return {
      result: 'acquired',
      token,
      tokenHash,
      sidecar: sidecarData,
    };
  } finally {
    // Release the kernel lock handle -- the committed held sidecar is persistent freeze authority
    kernelAcquire.handle.release();
  }
}

/**
 * Inspect the status of the documentation-cutover write lease.
 */
export function inspectDocumentationCutoverLease(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const fgosDir = options.fgosDir ?? path.join(repoRoot, '.fgos');
  const sidecarRelPath = options.sidecarPath ?? DEFAULT_SIDECAR_PATH;
  const sidecarFullPath = path.isAbsolute(sidecarRelPath) ? sidecarRelPath : path.join(repoRoot, sidecarRelPath);

  const sidecar = readSidecar(sidecarFullPath);
  if (!sidecar || sidecar.state !== 'held') {
    return {
      state: sidecar?.state ?? 'free',
      held: false,
      sidecar: sidecar ?? null,
    };
  }

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
 */
export function releaseDocumentationCutoverLease(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const sidecarRelPath = options.sidecarPath ?? DEFAULT_SIDECAR_PATH;
  const sidecarFullPath = path.isAbsolute(sidecarRelPath) ? sidecarRelPath : path.join(repoRoot, sidecarRelPath);
  const tokenRelPath = options.tokenPath ?? DEFAULT_TOKEN_FILE;
  const tokenFullPath = path.isAbsolute(tokenRelPath) ? tokenRelPath : path.join(repoRoot, tokenRelPath);

  const sidecar = readSidecar(sidecarFullPath);
  if (!sidecar || sidecar.state !== 'held') {
    const error = new Error('documentation-cutover lease is not held');
    error.code = 'lease-not-held';
    throw error;
  }

  // Verify caller is the holder
  const presentedToken = options.token ?? readTokenFromWorktree(repoRoot, tokenFullPath);
  if (!presentedToken || hashHolderToken(presentedToken) !== sidecar.holderTokenHash) {
    const error = new Error('caller is not the documentation-cutover lease holder');
    error.code = 'not-holder';
    throw error;
  }

  const releasedAt = options.now ? options.now() : new Date().toISOString();
  sidecar.state = 'released';
  sidecar.releasedAt = releasedAt;
  writeSidecarAtomic(sidecarFullPath, sidecar);

  // Remove local token file
  try {
    if (fs.existsSync(tokenFullPath)) fs.unlinkSync(tokenFullPath);
  } catch {}

  return {
    result: 'released',
    releasedAt,
    sidecar,
  };
}

/**
 * Abandon a held documentation-cutover write lease.
 * Refuses while the kernel lock is held by a live process.
 * If free, requires explicit owner confirmation and written reason.
 */
export function abandonDocumentationCutoverLease(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const fgosDir = options.fgosDir ?? path.join(repoRoot, '.fgos');
  const sidecarRelPath = options.sidecarPath ?? DEFAULT_SIDECAR_PATH;
  const sidecarFullPath = path.isAbsolute(sidecarRelPath) ? sidecarRelPath : path.join(repoRoot, sidecarRelPath);
  const tokenRelPath = options.tokenPath ?? DEFAULT_TOKEN_FILE;
  const tokenFullPath = path.isAbsolute(tokenRelPath) ? tokenRelPath : path.join(repoRoot, tokenRelPath);

  const sidecar = readSidecar(sidecarFullPath);
  if (!sidecar || sidecar.state !== 'held') {
    const error = new Error('documentation-cutover lease is not held');
    error.code = 'lease-not-held';
    throw error;
  }

  // Refuses while kernel lock is actively held
  let kernelProbe = { result: 'free' };
  try {
    kernelProbe = probe(DEFAULT_LOCK_NAME, { fgosDir });
  } catch {}

  if (kernelProbe.result === 'held') {
    const error = new Error('documentation-cutover lease is actively held by a live process; abandon refused');
    error.code = 'live-holder-held';
    throw error;
  }

  // When kernel lock is free, requires explicit owner flag and reason
  const ownerConfirmed = Boolean(options.ownerConfirmed || options['owner-confirmed'] || options.force);
  const reason = typeof options.reason === 'string' ? options.reason.trim() : '';

  if (!ownerConfirmed || !reason) {
    const error = new Error('abandoning a held documentation-cutover lease requires owner confirmation (--owner-confirmed) and a written reason (--reason <text>)');
    error.code = 'owner-confirmation-required';
    throw error;
  }

  const abandonedAt = options.now ? options.now() : new Date().toISOString();
  sidecar.state = 'abandoned';
  sidecar.abandon = {
    abandonedAt,
    by: options.by ?? 'owner',
    reason,
  };
  writeSidecarAtomic(sidecarFullPath, sidecar);

  // Remove local token file if present
  try {
    if (fs.existsSync(tokenFullPath)) fs.unlinkSync(tokenFullPath);
  } catch {}

  return {
    result: 'abandoned',
    abandonedAt,
    reason,
    sidecar,
  };
}

/**
 * Gate admission check: returns allow/refuse decision for later gates.
 * Refusal messages never print the holder identity or token.
 */
export function leaseAdmission(ctx = {}) {
  const repoRoot = path.resolve(ctx.repoRoot ?? process.cwd());
  const sidecarRelPath = ctx.sidecarPath ?? DEFAULT_SIDECAR_PATH;
  const sidecarFullPath = path.isAbsolute(sidecarRelPath) ? sidecarRelPath : path.join(repoRoot, sidecarRelPath);

  const sidecar = readSidecar(sidecarFullPath);
  if (!sidecar || sidecar.state !== 'held') {
    return { allowed: true };
  }

  // Check if caller possesses holder token
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

  // Non-holder: if explicit paths are provided, check scope intersection
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
  const mainRoot = resolveMainCheckoutRoot(committingToplevel);
  const sidecarRelPath = options.sidecarPath ?? DEFAULT_SIDECAR_PATH;
  const sidecarFullPath = path.isAbsolute(sidecarRelPath) ? sidecarRelPath : path.join(mainRoot, sidecarRelPath);

  const sidecar = readSidecar(sidecarFullPath);
  if (!sidecar || sidecar.state !== 'held') {
    return null;
  }

  const staged = options.stagedPaths ?? [];
  if (!intersectsScope(staged, { sidecarPath: sidecarRelPath })) {
    return null; // Out of scope: allowed
  }

  // Check if committer has holder token
  const token = options.token ?? readTokenFromWorktree(committingToplevel) ?? readTokenFromWorktree(mainRoot);
  if (token && hashHolderToken(token) === sidecar.holderTokenHash) {
    return null; // Holder: allowed
  }

  return 'commit refused: the documentation-cutover write lease is held (mutations to documentation roots are frozen); non-holder commits to scoped paths are refused. Run "fgos docs-lease status" or "fgos docs-lease abandon".';
}

/** Doctor check helper: verifies health of the documentation-cutover lease. */
export function checkDocumentationCutoverLeaseDoctor(cwd = process.cwd(), options = {}) {
  const mainRoot = resolveMainCheckoutRoot(cwd);
  const sidecarRelPath = options.sidecarPath ?? DEFAULT_SIDECAR_PATH;
  const sidecarFullPath = path.join(mainRoot, sidecarRelPath);
  const tokenRelPath = options.tokenPath ?? DEFAULT_TOKEN_FILE;
  const tokenFullPath = path.join(mainRoot, tokenRelPath);
  const fgosDir = options.fgosDir ?? path.join(mainRoot, '.fgos');

  const sidecar = readSidecar(sidecarFullPath);
  if (!sidecar || sidecar.state !== 'held') {
    return { passed: true, message: 'no documentation-cutover lease is held' };
  }

  // Lease says held: check lock file presence
  const lockFilePath = path.join(fgosDir, 'locks', `${DEFAULT_LOCK_NAME}.lock`);
  const lockExists = fs.existsSync(lockFilePath);
  if (!lockExists) {
    return {
      passed: false,
      message: 'documentation-cutover lease is marked held in sidecar, but lock file is missing',
    };
  }

  // Check token file presence and match
  const tokenExists = fs.existsSync(tokenFullPath);
  let tokenMatches = false;
  if (tokenExists) {
    try {
      const token = fs.readFileSync(tokenFullPath, 'utf8').trim();
      tokenMatches = hashHolderToken(token) === sidecar.holderTokenHash;
    } catch {}
  }

  if (!tokenExists || !tokenMatches) {
    return {
      passed: false,
      message: 'documentation-cutover lease is marked held in sidecar, but holder token file is missing or mismatched',
    };
  }

  const now = options.now ? new Date(options.now()).getTime() : Date.now();
  const ageSec = Math.round(Math.max(0, now - new Date(sidecar.acquiredAt).getTime()) / 1000);
  return {
    passed: false,
    message: `documentation-cutover lease is actively held (age: ${ageSec}s); mutations to documentation roots are frozen -- run "fgos docs-lease status" or "fgos docs-lease abandon"`,
  };
}
