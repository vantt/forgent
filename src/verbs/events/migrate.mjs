// No Git subprocesses: Inspect/Publication/ScopedCommit
// remain the only Git doors. Q5(a): reviewed code lands before this commit.
import fs from 'node:fs';
import path from 'node:path';
import { decodeLegacyFiles, eventStoreFacts } from '../../event-store/index.mjs';
import { isDeepStrictEqual } from 'node:util';
import { spawnSync } from 'node:child_process';
import { createGitInspect, gitPortOptions } from '../../git/inspect.mjs';
import { resolveHostBin } from '../../util/host-bin.mjs';
import { nativeError } from '../../native/door.mjs';
import { selfChain } from '../../runner/dispatch/process-identity.mjs';
import { fixEventStoreLockDirs, fixEventStoreMachineId, fixEventStoreRefspec } from '../../setup/event-store-fixes.mjs';
import { foldEvents, serializeView } from '../../state/replay.mjs';
import { parseEventLines } from '../../state/event-log.mjs';
import { foldPortingEvents } from '../../state/porting-store.mjs';
import { eventsContext } from './context.mjs';
import { resolveStateRoot } from '../../holder-lock/state-root.mjs';
import { entityDifferences } from './parity.mjs';

function refuse(code, detail, extra = {}) { throw Object.assign(new Error(`${code}: ${detail}`), { code, ...extra }); }
function plainView({ snapshot, revision, viewSchemaVersion, ...view }) { return view; }
function put(root, name, bytes) {
  const file = path.join(root, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, bytes);
}
function attributes(bytes) {
  return Buffer.from(bytes.toString('utf8').split(/(?<=\n)/).filter(line => line.trimStart().startsWith('#') || !['.fgos/events.jsonl', '.fgos/events*.jsonl', '.fgos/events/*.jsonl', '.fgos/events/**'].includes(line.trim().split(/\s+/)[0].replace(/^\//, '')) || !line.split(/\s+/).includes('merge=union')).join(''));
}
// The legacy files of an inventory in the shape the crate's decoder takes: the baseline under '' and shards by name.
function legacyFiles(inventory) {
  return Object.fromEntries(Object.entries(inventory.files)
    .filter(([name]) => name === '.fgos/events.jsonl' || /^\.fgos\/events\/[^/]+\.jsonl$/.test(name))
    .map(([name, bytes]) => [name === '.fgos/events.jsonl' ? '' : path.basename(name), Buffer.from(bytes).toString('utf8')]));
}
// The per-file size and last line a saved view recorded for the legacy files it folded.
export function legacyInventorySnapshot(inventory) {
  const files = { '': { size: 0, lastLine: null } };
  let maxTs = '';
  for (const [name, bytes] of Object.entries(inventory)) {
    if (name !== '.fgos/events.jsonl' && !/^\.fgos\/events\/[^/]+\.jsonl$/.test(name)) continue;
    const raw = Buffer.from(bytes).toString('utf8');
    const lastLine = raw.endsWith('\n') ? raw.slice(0, -1).split('\n').at(-1) || null : null;
    files[name === '.fgos/events.jsonl' ? '' : path.basename(name)] = { size: Buffer.from(bytes).length, lastLine };
    if (lastLine) { const ts = JSON.parse(lastLine).ts; if (typeof ts === 'string' && ts > maxTs) maxTs = ts; }
  }
  return { files, maxTs };
}
export function migrationParity({ inventory, events }, { baseline, cache, loaderOptions } = {}) {
  const workEvents = events.filter(e => !e.provenance.file.startsWith('porting/')).map(e => JSON.parse(e.raw));
  const imported = foldEvents(workEvents);
  const legacy = foldEvents(decodeLegacyFiles(legacyFiles(inventory), loaderOptions).map(e => e.event));
  const differences = entityDifferences(legacy, imported).map(d => ({ source: 'legacy-fold', ...d }));
  if (!differences.length && serializeView(legacy).viewStr !== serializeView(imported).viewStr) differences.push({ source: 'legacy-fold', collection: '$serialization' });
  const compare = (source, value) => {
    const expected = plainView(value);
    const diff = entityDifferences(expected, imported);
    differences.push(...diff.map(d => ({ source, ...d })));
    if (!diff.length && serializeView(expected).viewStr !== serializeView(imported).viewStr) differences.push({ source, collection: '$serialization', legacy: serializeView(expected).viewStr, v4: serializeView(imported).viewStr });
    if (value.revision && value.revision !== serializeView(imported).revision) differences.push({ source, collection: '$revision', legacy: value.revision, v4: serializeView(imported).revision });
  };
  if (baseline) compare('baseline', JSON.parse(fs.readFileSync(baseline, 'utf8')));
  let cacheCompared = false;
  if (cache && fs.existsSync(cache)) {
    const saved = JSON.parse(fs.readFileSync(cache, 'utf8'));
    if (isDeepStrictEqual(saved.snapshot, legacyInventorySnapshot(inventory.files))) { compare('previous-cache', saved); cacheCompared = true; }
  }
  // Porting keeps physical log order and its own reducer, independent of Work.
  const porting = events.filter(e => e.provenance.file.startsWith('porting/'));
  let portingCount = 0;
  if (inventory.portingLog) {
    const left = foldPortingEvents(parseEventLines(Buffer.from(inventory.files[inventory.portingLog]).toString('utf8'), inventory.portingLog)).porting;
    const right = foldPortingEvents(porting.map(e => JSON.parse(e.raw))).porting;
    portingCount = Object.keys(right).length;
    differences.push(...entityDifferences({ porting: left }, { porting: right }).map(d => ({ source: 'porting-fold', ...d })));
  }
  return { equal: differences.length === 0, differences, cacheCompared, workEvents: workEvents.length, portingEntities: portingCount, revision: serializeView(imported).revision };
}

const SCAN_PROTOCOL = 1;
const SCAN_TIMEOUT_MS = 30_000;

/** This process and its ancestors: the pids a scan must not count (`process.ppid` is added where the platform cannot walk the chain). */
const ownPidChain = () => [...new Set([process.pid, process.ppid, ...selfChain()])];

/**
 * The workspace's Git listing the quiesce scan needs, read through Inspect:
 * holder-lock sits below Git and never lists worktrees or branches itself.
 * Empty outside a repository.
 */
export function workspaceListing(repoRoot) {
  const inspect = createGitInspect(gitPortOptions(repoRoot));
  if (inspect.resolveRepo().notARepository) return { worktrees: [], branches: [] };
  const worktrees = [];
  let cursor;
  do {
    const page = inspect.listWorktrees({ cursor, maxEntries: 4096 });
    for (const row of page.entries) worktrees.push(Buffer.from(row.path).toString('utf8'));
    cursor = page.nextCursor;
  } while (cursor);
  const branches = inspect.listBranches({ prefix: 'refs/heads/' }).map((ref) => ref.slice('refs/heads/'.length));
  return { worktrees, branches };
}

function hostError(code, message, extra = {}) {
  const err = new Error(message);
  err.code = code;
  Object.assign(err, extra);
  return err;
}

function scanWorkspace(hostBin, { root, worktrees }, excludePids, timeoutMs) {
  const args = ['internal', 'quiesce-scan', '--protocol', String(SCAN_PROTOCOL), '--root', root];
  for (const dir of worktrees) args.push('--dir', dir);
  for (const pid of excludePids) args.push('--exclude-pid', String(pid));
  const res = spawnSync(hostBin, args, { encoding: 'utf8', timeout: timeoutMs, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
  if (res.error) {
    throw hostError('host-exec-error', `quiesce-scan of ${root} could not run: ${res.error.message}`, { cause: res.error });
  }
  const stderr = (res.stderr ?? '').trim();
  if (res.status === 3) throw hostError('host-version-mismatch', `quiesce-scan: ${stderr || 'host-version-mismatch'}`, { status: res.status });
  if (![0, 10, 12].includes(res.status)) {
    throw hostError('quiesce-scan-failed', `quiesce-scan of ${root} exited ${res.status}${res.signal ? ` (${res.signal})` : ''}: ${stderr || res.stdout}`, { status: res.status, stderr });
  }
  let parsed;
  try {
    parsed = JSON.parse(res.stdout);
  } catch (err) {
    throw hostError('quiesce-scan-invalid-output', `quiesce-scan of ${root} printed no JSON: ${err.message}\n${res.stdout}`);
  }
  if (parsed?.v !== 1 || parsed.protocol !== SCAN_PROTOCOL || !['clean', 'processes', 'unavailable'].includes(parsed.result)) {
    throw hostError('quiesce-scan-invalid-output', `quiesce-scan of ${root} answered outside its contract: ${res.stdout}`);
  }
  return {
    root,
    result: parsed.result,
    processes: Array.isArray(parsed.processes) ? parsed.processes : [],
    unreadable: Number.isInteger(parsed.unreadable) ? parsed.unreadable : 0,
    detail: typeof parsed.detail === 'string' ? parsed.detail : null,
  };
}

/**
 * Ask the host's `quiesce-scan` whether any fgOS process other than this
 * one (and its ancestors) is still running for each workspace. A workspace
 * is its root path, or `{root, worktrees}` with the linked worktree
 * directories the caller listed through Git (holder-lock never lists them
 * itself); a bare root scans that directory alone. Returns
 * `{status, blockers, scans, detail}` with status `clean`, `blocked` (a
 * process was found or an entry could not be read, listed in `blockers`)
 * or `needs-attest` (this platform cannot scan; a person has to confirm).
 * Throws when the host binary is missing or answers outside the contract.
 */
export function checkStopped({ workspaces, hostBin, excludePids = ownPidChain(), timeoutMs = SCAN_TIMEOUT_MS } = {}) {
  if (!Array.isArray(workspaces) || workspaces.length === 0) throw new Error('checkStopped requires at least one workspace root');
  const listed = workspaces.map((workspace) => (typeof workspace === 'string' ? { root: workspace, worktrees: [] } : workspace))
    .map(({ root, worktrees = [] }) => ({ root: path.resolve(root), worktrees: worktrees.map((dir) => path.resolve(dir)) }));
  const bin = hostBin ?? resolveHostBin(listed[0].root);
  if (!bin) throw hostError('host-unavailable', 'Rust host binary unavailable (FGOS_HOST_BIN unset and no active installation manifest)');
  const scans = listed.map((workspace) => scanWorkspace(bin, workspace, excludePids, timeoutMs));
  const blockers = [];
  for (const scan of scans) {
    for (const proc of scan.processes) blockers.push({ kind: 'process', workspace: scan.root, ...proc });
    if (scan.unreadable > 0) blockers.push({ kind: 'unreadable', workspace: scan.root, count: scan.unreadable });
  }
  const unavailable = scans.filter((scan) => scan.result === 'unavailable');
  const status = blockers.length > 0 ? 'blocked' : unavailable.length > 0 ? 'needs-attest' : 'clean';
  return { status, blockers, scans, detail: unavailable.map((scan) => scan.detail).filter(Boolean).join('; ') || null };
}

export async function migrateUseCase(ctx, options = {}) {
  const cwd = path.resolve(ctx.cwd ?? ctx.repoRoot);
  const base = { stateRoot: ctx.stateRoot, trustedMain: ctx.trustedMain ?? cwd, loaderOptions: ctx.loaderOptions };
  const initialFacts = eventStoreFacts(cwd, base);
  if (path.resolve(initialFacts.trustedMain) !== cwd) refuse('event-store-migration-main-required', 'run migrate in the main checkout root');
  const stopped = checkStopped({ workspaces: [{ root: cwd, worktrees: workspaceListing(cwd).worktrees }], hostBin: ctx.hostBin });
  if (stopped.status !== 'clean') refuse('event-store-writers-active', JSON.stringify(stopped));
  fixEventStoreLockDirs(cwd, base); fixEventStoreMachineId(cwd, base); fixEventStoreRefspec(cwd, base);
  const { store, heldRanks } = eventsContext(ctx, options);
  const snapshot = store.readLegacyFromHead({}, heldRanks);
  const { emptyLegacy = [] } = store.readLegacyFromHead({ check: true }, heldRanks);
  if (snapshot.inventory.migrated) {
    const check = store.legacyLayout(heldRanks);
    if (!check.passed) refuse('event-store-legacy-mismatch', JSON.stringify(check.problems));
    return { unchanged: true, message: 'Event Store migration already complete' };
  }
  const parity = migrationParity(snapshot, { baseline: options.baseline && path.resolve(cwd, options.baseline), cache: path.join(cwd, '.fgos/cache/state.json'), loaderOptions: ctx.loaderOptions });
  if (!parity.equal) refuse('event-store-migration-parity', JSON.stringify(parity.differences), { differences: parity.differences });
  const files = Object.fromEntries(Object.entries(snapshot.inventory.files).map(([p, bytes]) => [p, Buffer.from(bytes)]));
  const deletions = Object.keys(files).filter(p => p !== '.gitattributes');
  const exactPaths = deletions.filter(p => p.startsWith('.fgos/')).sort();
  const nonStore = deletions.filter(p => !p.startsWith('.fgos/'));
  const attributeBytes = files['.gitattributes'] && attributes(files['.gitattributes']);
  const attributesChanged = attributeBytes && !attributeBytes.equals(files['.gitattributes']);
  const writes = [...nonStore, ...(attributesChanged ? ['.gitattributes'] : [])];
  const plan = { fromCommit: snapshot.inventory.fromCommit, deletions, emptyLegacy, fence: '.fgos/events', writes, import: importPlan(snapshot), message: 'chore(events): move event truth to refs/fgos (D-ADR0055)' };
  if (options.check) return { check: true, plan, parity };
  const git = await import('../../git/index.mjs');
  if (typeof git.createGitScopedCommit !== 'function') refuse('event-store-git-scoped-commit-unavailable', 'Git phase 05 must be merged and its release active before migration');
  if (typeof ctx.writer !== 'string' || !ctx.writer) refuse('event-store-writer-required', 'migration requires the resolved session writer');
  // Empty untracked legacy files hold no history; they go before the commit's baseline is taken.
  for (const p of emptyLegacy) fs.unlinkSync(path.join(cwd, p));
  const scoped = git.createGitScopedCommit({ stateRoot: ctx.stateRoot ?? resolveStateRoot().stateRoot, repoPath: cwd, trustedMain: cwd, writer: ctx.writer }, ctx.loaderOptions);
  const baseline = scoped.preflight();
  // Import revalidates HEAD and dirt under event-seal; that lock is dropped
  // before ScopedCommit borrows main-checkout 50. CAS-before-commit reruns reuse it.
  const { operationId, ...pin } = store.importLegacy({ expectedHead: plan.fromCommit }, heldRanks);
  if (pin.legacyRefOid !== plan.import.legacyRefOid) refuse('event-store-migration-parity', 'published import differs from HEAD data tree', { operationId });
  if (store.read({ streams: ['project', 'project:porting'] }, heldRanks).sequence.length) refuse('event-store-migration-parity', 'published v4 events exist before cutover', { operationId });
  let commitCalled = false;
  try {
    for (const p of deletions) fs.unlinkSync(path.join(cwd, p));
    const fence = path.join(cwd, '.fgos/events');
    if (fs.existsSync(fence)) fs.rmdirSync(fence);
    put(cwd, '.fgos/events', JSON.stringify(pin) + '\n');
    if (attributesChanged) {
      if (attributeBytes.length) fs.writeFileSync(path.join(cwd, '.gitattributes'), attributeBytes);
      else fs.unlinkSync(path.join(cwd, '.gitattributes'));
    }
    commitCalled = true;
    const result = scoped.commit({ operationId, baseline, request: { writes, message: plan.message, cutoverGrant: { exactPaths, legacyRefOid: pin.legacyRefOid, sealDigest: pin.sealDigest } } });
    if (result.status !== 'committed' || !result.oid || result.oid === plan.fromCommit) refuse('event-store-cutover-review-required', JSON.stringify(result), { operationId, result });
    return { plan, parity, pin, operationId, commit: result };
  } catch (error) {
    const failure = commitCalled ? cutoverFailure(error) : { code: error.code, restore: true };
    error.code = failure.cause ?? failure.code;
    error.gitCode = failure.code;
    if (failure.restore) try {
      const current = store.readLegacyFromHead({}, heldRanks).inventory;
      if (!current.migrated && current.fromCommit === plan.fromCommit) {
        const fence = path.join(cwd, '.fgos/events');
        if (fs.existsSync(fence) && fs.lstatSync(fence).isFile()) fs.unlinkSync(fence);
        for (const p of deletions) put(cwd, p, files[p]);
        if (attributesChanged) put(cwd, '.gitattributes', files['.gitattributes']);
      }
    } catch (restoreError) { error.restoreError = restoreError.message; }
    error.operationId = operationId;
    const stderr = Buffer.from(nativeError(error).stderr ?? []).toString('utf8').trim();
    if (stderr) error.message = `${failure.cause ?? failure.code}: ${stderr}`;
    if (commitCalled) error.message += `; inspect Git ScopedCommit record ${operationId}`;
    throw error;
  }
}

// Dry-run Git object identity: hashes bytes only, never installs an object.
// The real Publication result must equal this plan before any cutover edits.
export function importPlan({ dataTree, legacyRefOid, existingLegacyOid, legacyMirrors = [] }) {
  if (legacyMirrors.some(({ oid }) => oid !== legacyRefOid || oid === existingLegacyOid)) refuse('event-store-legacy-mismatch', 'published legacy refs disagree with HEAD import or local import is published; pull the fenced main; if main has no fence because cutover was reverted after the ref was pushed, the remote legacy ref needs an owner decision');
  return { legacyRefOid, dataTree, existingLegacyOid, action: !existingLegacyOid ? 'create' : existingLegacyOid === legacyRefOid ? 'reuse' : 'replace-unfenced-stale' };
}

// Decode Git's typed envelope; recovery and unknown classes never authorize
// Event Store restoration, even when HEAD happens to remain at the baseline.
// Restore only on refusals Git raises before its attempt, or on commit-rejected
// after Git restored the producer bytes. untrusted-worktree is excluded: Git
// re-checks topology before every child, including after the commit attempt.
export function cutoverFailure(error) {
  let code = error.code, cause;
  try { const native = JSON.parse(error.message); code = native.code ?? code; cause = native.cause; } catch {}
  const ordinary = new Set(['commit-rejected', 'checkout-required', 'lock-order-violation', 'git-dual-borrow-unavailable', 'main-checkout-authority-mismatch', 'checkout-custody-required', 'checkout-custody-stale', 'checkout-authority-required', 'git-lockscope-unavailable-windows', 'invalid-commit-message', 'wal-record-too-large', 'foreign-merge-head', 'foreign-staged-index', 'source-baseline-stale', 'cutover-main-required', 'cutover-exact-deletions-required', 'cutover-legacy-ref-mismatch', 'cutover-seal-digest-mismatch', 'staged-set-mismatch', 'literal-path-staging-failed', 'commit-snapshot-non-file']);
  return { code, cause, restore: (code === 'refused' && ordinary.has(cause)) || ordinary.has(code) };
}
