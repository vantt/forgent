// The committed main-ref sidecar persists the freeze; kernel locks serialize
// transitions only. Persistent tokens stay in the holder checkout's ignored
// .fgos/, never in argv or env; release lends it to the main committer only
// under main-50. SIGKILL/power loss before the release's finally can leave a
// lent token in main: doctor diagnoses it and acquire refuses until it is
// removed after checking the committed lease and holder. This is not a hostile
// same-uid boundary. git clean -fdX deletes the token: only owner abandon recovers.
// Abandon is an explicit owner door in this single-owner repository, not holder
// proof. Cutover consumers recompute digests; sidecar drift is not authority.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { acquireSync, probe, createLockScope } from '../holder-lock/index.mjs';
import { createGitInspect, gitPortOptions } from '../git/inspect.mjs';
import { createGitScopedCommit } from '../git/scoped-commit.mjs';
import { resolveMainCheckoutRoot } from './paths.mjs';
import { mainCheckoutHookWired } from '../setup/git-hooks.mjs';

export const DEFAULT_LOCK_NAME = 'documentation-cutover';
export const DEFAULT_SIDECAR_PATH = 'plans/documentation-cutover-lease.json';
export const DEFAULT_TOKEN_FILE = '.fgos/documentation-cutover.token';
// The switchboard file is frozen alongside the documentation it routes.
const SWITCHBOARD_PATH = 'plans/260925-documentation-authority-unification/transitional-switchboard.json';
export const LEASE_SCOPE_PATTERNS = Object.freeze([
  'docs/**', 'AGENTS.md', 'CLAUDE.md', SWITCHBOARD_PATH,
  'core/skills/**', '.agents/skills/**', 'plugins/fgOS/skills/**', DEFAULT_SIDECAR_PATH,
]);

export function normalizeScopePath(raw) {
  return (Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw ?? '')).replaceAll('\\', '/').replace(/^\.\//, '');
}
export function isScopedPath(target, { sidecarPath = DEFAULT_SIDECAR_PATH } = {}) {
  const name = normalizeScopePath(target);
  const patterns = sidecarPath === DEFAULT_SIDECAR_PATH ? LEASE_SCOPE_PATTERNS : [...LEASE_SCOPE_PATTERNS, sidecarPath];
  return patterns.some(pattern => pattern.endsWith('/**')
    ? name === pattern.slice(0, -3) || name.startsWith(pattern.slice(0, -2))
    : name === pattern);
}
export function intersectsScope(paths, options) {
  return Array.from(paths ?? []).some(name => isScopedPath(name, options));
}
export function generateHolderToken() { return crypto.randomBytes(32).toString('hex'); }
export function hashHolderToken(token) {
  return typeof token === 'string' ? crypto.createHash('sha256').update(token.trim()).digest('hex') : '';
}
export function readTokenFromWorktree(root) {
  try { return fs.readFileSync(path.join(root, DEFAULT_TOKEN_FILE), 'utf8').trim(); }
  catch { return null; }
}
function hasStrayMainToken(mainRoot, lease) {
  return fs.existsSync(path.join(mainRoot, DEFAULT_TOKEN_FILE)) && lease.sidecar?.worktree !== mainRoot;
}
function writeLeaseFileAtomic(file, bytes) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temp, bytes, { mode: 0o600 });
    fs.renameSync(temp, file);
  } finally { fs.rmSync(temp, { force: true }); }
}
export function writeSidecarAtomic(file, data) {
  writeLeaseFileAtomic(file, `${JSON.stringify(data, null, 2)}\n`);
}

/** One parser for Node gates and both Git hooks. Null alone means absent. */
export function parseSidecarJson(raw) {
  if (raw === null) return { status: 'absent' };
  try {
    const data = JSON.parse(raw);
    if (!data || !['held', 'released', 'abandoned'].includes(data.state)
      || !/^[a-f0-9]{64}$/.test(data.holderTokenHash)) throw new Error('invalid lease state or holder hash');
    return { status: data.state === 'held' ? 'held' : 'present', state: data.state, sidecar: data };
  } catch { return { status: 'corrupt', error: 'invalid-sidecar' }; }
}

function readSidecarBlob(repoRoot, sidecarPath, revision) {
  const inspect = createGitInspect(gitPortOptions(repoRoot));
  const oid = revision ?? inspect.resolveRef({ name: 'refs/heads/main' })?.oid;
  if (!oid) return null;
  const [entry] = inspect.pathsAtRevision({ revision: oid, paths: [[...Buffer.from(sidecarPath)]], maxBlobBytes: 1048576 });
  if (entry?.value.kind === 'absent') return null;
  if (entry?.value.kind !== 'present') throw new Error('sidecar is not a blob');
  return Buffer.from(entry.value.bytes);
}
export function readSidecarFromMain(repoRoot, sidecarPath = DEFAULT_SIDECAR_PATH, { revision } = {}) {
  try {
    const raw = readSidecarBlob(repoRoot, sidecarPath, revision);
    return parseSidecarJson(raw === null ? null : raw.toString('utf8'));
  } catch { return { status: 'corrupt', error: 'unreadable-sidecar' }; }
}

/** The exact root sorts before its descendants: its first entry is sufficient,
 * without paging its subtree. Absent roots are explicit so additions cause drift.
 * The sidecar is transition evidence, not payload: exclude it from its own digest. */
export function computeScopeDigests(repoRoot, revision) {
  const inspect = createGitInspect(gitPortOptions(repoRoot));
  const oid = revision ?? inspect.resolveRef({ name: 'refs/heads/main' })?.oid;
  if (!oid) throw leaseError('scope-digests-unavailable', 'main has no readable commit');
  const digests = {};
  for (const pattern of LEASE_SCOPE_PATTERNS.filter(p => p !== DEFAULT_SIDECAR_PATH)) {
    const root = pattern.endsWith('/**') ? pattern.slice(0, -3) : pattern;
    const [entry] = inspect.listTree({ revision: oid, prefix: root, maxEntries: 1 }).entries;
    digests[root] = entry && Buffer.from(entry.path).toString('utf8') === root ? entry.oid : null;
  }
  return digests;
}
function leaseError(code, message) { return Object.assign(new Error(message), { code }); }
function checkoutFacts(cwd) {
  const facts = createGitInspect(gitPortOptions(path.resolve(cwd))).resolveRepo();
  if (facts.notARepository || !facts.trustedMainRoot || !facts.worktreeRoot) throw leaseError('not-a-repository', 'a registered Git checkout is required');
  return facts;
}
function transition(options, change) {
  const facts = checkoutFacts(options.repoRoot ?? process.cwd());
  const mainRoot = resolveMainCheckoutRoot(facts.worktreeRoot);
  if (!mainRoot) throw leaseError('not-a-repository', 'main checkout cannot be resolved');
  const scope = createLockScope('documentation-cutover-transition');
  const params = { fgosDir: path.join(mainRoot, '.fgos') };
  const lease = acquireSync(scope, DEFAULT_LOCK_NAME, params);
  if (lease.result !== 'acquired') throw leaseError('lock-held', 'documentation-cutover kernel lock is held');
  let main;
  try {
    main = acquireSync(scope, 'main-checkout', params);
    if (main.result !== 'acquired') throw leaseError('lock-held', 'main checkout lock is held');
    const port = createGitScopedCommit(gitPortOptions(mainRoot, { mutation: true }));
    const held = [main.handle];
    const baseline = port.preflight({}, held);
    if (baseline.reference !== 'refs/heads/main') throw leaseError('main-not-checked-out', 'main checkout must be on refs/heads/main');
    const old = readSidecarFromMain(mainRoot, DEFAULT_SIDECAR_PATH, { revision: baseline.head });
    if (old.status === 'corrupt' && !options.ownerConfirmed) throw leaseError('corrupt-sidecar', 'lease sidecar on main is corrupt or unreadable');
    const result = change({ facts, mainRoot, old, baseline });
    const sidecarFile = path.join(mainRoot, DEFAULT_SIDECAR_PATH);
    let receipt;
    let restoreToken;
    try {
      // ScopedCommit commits in main, not the calling linked checkout. Lend the
      // already authenticated holder token to that committing checkout only for
      // the synchronous commit, under main-50; restore its prior file afterwards.
      if (result.result === 'released' && facts.worktreeRoot !== mainRoot) {
        const tokenFile = path.join(mainRoot, DEFAULT_TOKEN_FILE);
        const token = readTokenFromWorktree(facts.worktreeRoot);
        if (hashHolderToken(token) !== old.sidecar.holderTokenHash) throw leaseError('not-holder', 'caller is not the lease holder');
        let previous = null;
        try { previous = fs.readFileSync(tokenFile); } catch (error) { if (error.code !== 'ENOENT') throw error; }
        restoreToken = () => previous === null ? fs.rmSync(tokenFile, { force: true }) : writeLeaseFileAtomic(tokenFile, previous);
        writeLeaseFileAtomic(tokenFile, `${token}\n`);
      }
      writeSidecarAtomic(sidecarFile, result.sidecar);
      receipt = port.commit({ baseline, operationId: crypto.randomUUID(), request: {
        writes: [DEFAULT_SIDECAR_PATH], message: `chore(docs): ${result.result} documentation cutover lease`, cutoverGrant: null,
      } }, held);
      if (receipt.status !== 'committed' || receipt.files.length !== 1 || receipt.files[0] !== DEFAULT_SIDECAR_PATH) {
        throw leaseError('lease-commit-failed', `lease commit did not satisfy its contract (${receipt.status})`);
      }
    } catch (error) {
      try {
        // Main may have moved after preflight: restore its current committed
        // bytes, not the attempted transition or a stale baseline copy.
        const raw = readSidecarBlob(mainRoot, DEFAULT_SIDECAR_PATH);
        if (raw === null) fs.rmSync(sidecarFile, { force: true });
        else writeLeaseFileAtomic(sidecarFile, raw);
      } finally { result.onFailure?.(); }
      if (/baseline.*changed|base-moved|head.*changed|stale-baseline|source-baseline-stale/i.test(error.message)) throw leaseError('base-moved', 'base-moved: main moved during lease transition; refusing without retry');
      throw error;
    } finally { restoreToken?.(); }
    result.afterCommit?.();
    delete result.afterCommit;
    delete result.onFailure;
    return { ...result, commit: receipt };
  } finally {
    main?.handle?.release();
    lease.handle.release();
  }
}
export function acquireDocumentationCutoverLease(options = {}) {
  return transition(options, ({ facts, mainRoot, old, baseline }) => {
    if (old.status === 'corrupt') throw leaseError('corrupt-sidecar', 'lease sidecar on main is corrupt or unreadable');
    if (hasStrayMainToken(mainRoot, old)) throw leaseError('stray-main-token', 'documentation-cutover token exists in main, but main is not the recorded holder checkout');
    if (old.status === 'held') throw leaseError('lease-already-held', 'documentation-cutover lease is already held');
    const inspect = createGitInspect(gitPortOptions(mainRoot));
    const holder = options.worktree ? checkoutFacts(options.worktree) : facts;
    if (holder.trustedMainRoot !== facts.trustedMainRoot || !inspect.listWorktrees().entries.some(w => Buffer.from(w.path).toString('utf8') === holder.worktreeRoot)) {
      throw leaseError('invalid-worktree', 'holder must be a registered worktree of this repository');
    }
    const root = holder.worktreeRoot;
    if (isScopedPath(path.relative(mainRoot, root))) throw leaseError('token-inside-scope', 'holder token must not live inside documentation scope');
    const scopeDigests = computeScopeDigests(mainRoot, baseline.head);
    const token = generateHolderToken();
    const tokenPath = path.join(root, DEFAULT_TOKEN_FILE);
    writeLeaseFileAtomic(tokenPath, `${token}\n`);
    const tokenHash = hashHolderToken(token);
    return { result: 'acquired', tokenHash, tokenPath,
      onFailure: () => {
        // A malformed receipt can follow a successful commit. Delete only when
        // main proves this token is not its held capability; unreadable evidence
        // must preserve the token for recovery, not strand a committed holder.
        const committed = readSidecarFromMain(mainRoot);
        if (committed.status === 'corrupt' || (committed.status === 'held' && committed.sidecar.holderTokenHash === tokenHash)) return;
        fs.rmSync(tokenPath, { force: true });
      }, sidecar: {
      contract: { id: 'documentation-cutover-lease', version: 1 }, state: 'held', holderTokenHash: tokenHash,
      acquiredAt: new Date().toISOString(), worktree: root, branch: 'main', baseCommit: baseline.head,
      scope: [...LEASE_SCOPE_PATTERNS], scopeDigests,
    } };
  });
}
export function releaseDocumentationCutoverLease(options = {}) {
  return transition(options, ({ facts, mainRoot, old, baseline }) => {
    if (old.status !== 'held') throw leaseError('lease-not-held', 'documentation-cutover lease is not held');
    if (hashHolderToken(readTokenFromWorktree(facts.worktreeRoot)) !== old.sidecar.holderTokenHash) throw leaseError('not-holder', 'caller is not the lease holder');
    const releaseScopeDigests = computeScopeDigests(mainRoot, baseline.head);
    const drift = Object.keys(releaseScopeDigests).filter(key => old.sidecar.scopeDigests?.[key] !== releaseScopeDigests[key]);
    const releasedAt = new Date().toISOString();
    return { result: 'released', releasedAt, drift,
      sidecar: { ...old.sidecar, state: 'released', releasedAt, releaseScopeDigests, drift },
      afterCommit: () => fs.rmSync(path.join(facts.worktreeRoot, DEFAULT_TOKEN_FILE), { force: true }),
    };
  });
}
export function abandonDocumentationCutoverLease(options = {}) {
  if (!options.ownerConfirmed || typeof options.reason !== 'string' || !options.reason.trim()) throw leaseError('owner-confirmation-required', 'abandon requires --owner-confirmed and a written --reason');
  return transition(options, ({ old, baseline, mainRoot }) => {
    if (!['held', 'corrupt'].includes(old.status)) throw leaseError('lease-not-held', 'documentation-cutover lease is not held');
    const abandonedAt = new Date().toISOString();
    const holderTokenHash = old.sidecar?.holderTokenHash ?? hashHolderToken(generateHolderToken());
    return { result: 'abandoned', abandonedAt, reason: options.reason.trim(), sidecar: {
      contract: { id: 'documentation-cutover-lease', version: 1 },
      ...old.sidecar, state: 'abandoned', holderTokenHash, releaseScopeDigests: computeScopeDigests(mainRoot, baseline.head),
      abandon: { abandonedAt, ownerConfirmed: true, reason: options.reason.trim(), holderTokenHash,
        ...(old.status === 'corrupt' ? { repair: 'corrupt-sidecar' } : { ageMs: Math.max(0, Date.now() - Date.parse(old.sidecar.acquiredAt)) }) },
    } };
  });
}
export function inspectDocumentationCutoverLease(options = {}) {
  const mainRoot = resolveMainCheckoutRoot(options.repoRoot ?? process.cwd());
  const lease = readSidecarFromMain(mainRoot ?? options.repoRoot);
  if (lease.status === 'corrupt') return { state: 'corrupt', held: true, sidecar: null };
  if (lease.status !== 'held') return { state: lease.state ?? 'free', held: false, sidecar: lease.sidecar ?? null };
  let kernelLock = 'unknown';
  try { kernelLock = probe(DEFAULT_LOCK_NAME, { fgosDir: path.join(mainRoot, '.fgos') }).result; } catch {}
  return { ...lease.sidecar, held: true, ageMs: Math.max(0, Date.now() - Date.parse(lease.sidecar.acquiredAt)), kernelLock, sidecar: lease.sidecar };
}
export function leaseAdmission(ctx = {}) {
  // Authority belongs to the gated repository, never the caller's repository.
  // Only a non-repository repoRoot may take the execution door's read-only
  // exception; a non-Git or foreign caller cannot hold a lease on this repo.
  const repo = checkoutFacts(ctx.repoRoot ?? process.cwd());
  const mainRoot = resolveMainCheckoutRoot(repo.worktreeRoot);
  if (!mainRoot) throw leaseError('main-checkout-unavailable', 'gated main checkout cannot be resolved');
  const lease = readSidecarFromMain(mainRoot);
  if (lease.status === 'corrupt') return { allowed: false, holder: false, reason: 'documentation-cutover-lease-corrupt', message: 'documentation cutover lease sidecar is corrupt; failing closed' };
  if (lease.status !== 'held') return { allowed: true };
  const caller = ctx.worktreePath ?? repo.worktreeRoot;
  if (resolveMainCheckoutRoot(caller) !== mainRoot) return {
    allowed: false, holder: false, reason: 'documentation-cutover-lease',
    message: 'documentation cutover lease is held; caller checkout must belong to the gated repository',
  };
  const holder = hashHolderToken(readTokenFromWorktree(checkoutFacts(caller).worktreeRoot)) === lease.sidecar.holderTokenHash;
  if (holder || (ctx.paths && !intersectsScope(ctx.paths))) return { allowed: true, holder };
  return { allowed: false, holder: false, reason: 'documentation-cutover-lease', message: 'documentation cutover lease is held; non-holder operations are refused' };
}
export function checkLeaseCommitGuard(root = process.cwd(), options = {}) {
  const lease = options.rawSidecarBlob !== undefined ? parseSidecarJson(options.rawSidecarBlob) : readSidecarFromMain(root);
  if (lease.status === 'corrupt') return 'commit refused: documentation-cutover lease sidecar is corrupt; failing closed';
  if (lease.status !== 'held' || !intersectsScope(options.stagedPaths)) return null;
  if (hashHolderToken(readTokenFromWorktree(root)) === lease.sidecar.holderTokenHash) return null;
  return 'commit refused: the documentation-cutover write lease is held; non-holder commits to scoped paths are refused';
}
export function checkDocumentationCutoverLeaseDoctor(cwd = process.cwd()) {
  const mainRoot = resolveMainCheckoutRoot(cwd);
  if (!mainRoot) return { passed: true, message: 'not applicable: project does not use repository hooks' };
  const inspect = createGitInspect(gitPortOptions(mainRoot));
  if (!inspect.resolveRef({ name: 'refs/heads/main' })?.oid) return { passed: true, message: 'not applicable: no main branch' };
  const lease = readSidecarFromMain(mainRoot);
  if (lease.status === 'corrupt') return { passed: false, message: 'documentation-cutover lease sidecar is corrupt or unreadable' };
  if (hasStrayMainToken(mainRoot, lease)) return { passed: false, message: 'documentation-cutover token exists in main, but main is not the recorded holder checkout; possible interrupted release' };
  const hookPresent = fs.existsSync(path.join(mainRoot, '.githooks/reference-transaction'));
  if (lease.status !== 'held' && !hookPresent) return { passed: true, message: 'not applicable: project does not use repository hooks' };
  if (!hookPresent || !mainCheckoutHookWired(mainRoot)) return { passed: false, message: `documentation-cutover ${lease.status === 'held' ? 'lease is held but its ' : ''}reference-transaction hook is not wired` };
  if (lease.status !== 'held') return { passed: true, message: 'no documentation-cutover lease is held; reference-transaction hook wired' };
  if (!fs.existsSync(path.join(mainRoot, '.fgos/locks', `${DEFAULT_LOCK_NAME}.lock`))) return { passed: false, message: 'documentation-cutover lease is held but its kernel lock resource is missing' };
  const age = Math.max(0, Math.round((Date.now() - Date.parse(lease.sidecar.acquiredAt)) / 1000));
  return { passed: false, message: `documentation-cutover lease is actively held (age: ${age}s); frozen scope: ${LEASE_SCOPE_PATTERNS.join(', ')}` };
}
