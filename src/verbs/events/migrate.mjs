// Dormant until phase 09. No Git subprocesses: Inspect/Publication/ScopedCommit
// remain the only Git doors. Q5(a): reviewed code lands before this commit.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { eventStoreFacts } from '../../event-store/index.mjs';
import { isDeepStrictEqual } from 'node:util';
import { checkStopped } from '../../holder-lock/fences.mjs';
import { fixEventStoreLockDirs, fixEventStoreMachineId, fixEventStoreRefspec } from '../../setup/event-store-fixes.mjs';
import { foldEvents, readAllEventsFromDir, buildSnapshotFromDir, serializeView } from '../../state/replay.mjs';
import { listPorting } from '../../state/porting-store.mjs';
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
export function migrationParity({ inventory, events }, { baseline, cache } = {}) {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-migrate-parity-'));
  try {
    for (const [name, bytes] of Object.entries(inventory.files)) if (name.startsWith('.fgos/')) put(scratch, name.slice(6), Buffer.from(bytes));
    const workEvents = events.filter(e => !e.provenance.file.startsWith('porting/')).map(e => JSON.parse(e.raw));
    const imported = foldEvents(workEvents);
    const legacy = foldEvents(readAllEventsFromDir(scratch));
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
      if (isDeepStrictEqual(saved.snapshot, buildSnapshotFromDir(scratch))) { compare('previous-cache', saved); cacheCompared = true; }
    }
    // Porting keeps physical log order and its own reducer, independent of Work.
    const porting = events.filter(e => e.provenance.file.startsWith('porting/'));
    let portingCount = 0;
    if (inventory.portingLog) {
      const original = path.join(scratch, 'original');
      const modern = path.join(scratch, 'modern');
      put(original, 'porting/events.jsonl', Buffer.from(inventory.files[inventory.portingLog]));
      put(modern, 'porting/events.jsonl', porting.map(e => e.raw + '\n').join(''));
      const left = listPorting(original).porting, right = listPorting(modern).porting;
      portingCount = Object.keys(right).length;
      differences.push(...entityDifferences({ porting: left }, { porting: right }).map(d => ({ source: 'porting-fold', ...d })));
    }
    return { equal: differences.length === 0, differences, cacheCompared, workEvents: workEvents.length, portingEntities: portingCount, revision: serializeView(imported).revision };
  } finally { fs.rmSync(scratch, { recursive: true, force: true }); }
}

export async function migrateUseCase(ctx, options = {}) {
  const cwd = path.resolve(ctx.cwd ?? ctx.repoRoot);
  const base = { stateRoot: ctx.stateRoot, trustedMain: ctx.trustedMain ?? cwd, loaderOptions: ctx.loaderOptions };
  const initialFacts = eventStoreFacts(cwd, base);
  if (path.resolve(initialFacts.trustedMain) !== cwd) refuse('event-store-migration-main-required', 'run migrate in the main checkout root');
  const stopped = checkStopped({ workspaces: [cwd], hostBin: ctx.hostBin });
  if (stopped.status !== 'clean') refuse('event-store-writers-active', JSON.stringify(stopped));
  fixEventStoreLockDirs(cwd, base); fixEventStoreMachineId(cwd, base); fixEventStoreRefspec(cwd, base);
  const { store, heldRanks } = eventsContext(ctx, options);
  const snapshot = store.readLegacyFromHead({}, heldRanks);
  const operationId = snapshot.operationId;
  try { store.readLegacyFromHead({ check: true }, heldRanks); }
  catch (error) {
    error.operationId = operationId;
    error.message += `; inspect Git ScopedCommit record ${operationId} if this is an interrupted migration`;
    throw error;
  }
  if (snapshot.inventory.migrated) {
    const check = store.legacyLayout(heldRanks);
    if (!check.passed) refuse('event-store-legacy-mismatch', JSON.stringify(check.problems));
    return { unchanged: true, message: 'Event Store migration already complete' };
  }
  const parity = migrationParity(snapshot, { baseline: options.baseline && path.resolve(cwd, options.baseline), cache: path.join(cwd, '.fgos/cache/state.json') });
  if (!parity.equal) refuse('event-store-migration-parity', JSON.stringify(parity.differences), { differences: parity.differences });
  const files = Object.fromEntries(Object.entries(snapshot.inventory.files).map(([p, bytes]) => [p, Buffer.from(bytes)]));
  const deletions = Object.keys(files).filter(p => p !== '.gitattributes');
  const exactPaths = deletions.filter(p => p.startsWith('.fgos/')).sort();
  const nonStore = deletions.filter(p => !p.startsWith('.fgos/'));
  const attributeBytes = files['.gitattributes'] && attributes(files['.gitattributes']);
  const attributesChanged = attributeBytes && !attributeBytes.equals(files['.gitattributes']);
  const writes = [...nonStore, ...(attributesChanged ? ['.gitattributes'] : [])];
  const plan = { fromCommit: snapshot.inventory.fromCommit, deletions, fence: '.fgos/events', writes, import: importPlan(snapshot), message: 'chore(events): move event truth to refs/fgos (D-ADR0055)' };
  if (options.check) return { check: true, plan, parity };
  const git = await import('../../git/index.mjs');
  if (typeof git.createGitScopedCommit !== 'function') refuse('event-store-git-scoped-commit-unavailable', 'Git phase 05 must be merged and its release active before migration');
  if (typeof ctx.writer !== 'string' || !ctx.writer) refuse('event-store-writer-required', 'migration requires the resolved session writer');
  const scoped = git.createGitScopedCommit({ stateRoot: ctx.stateRoot ?? resolveStateRoot().stateRoot, repoPath: cwd, trustedMain: cwd, writer: ctx.writer }, ctx.loaderOptions);
  const baseline = scoped.preflight();
  // Import revalidates HEAD and dirt under event-seal; that lock is dropped
  // before ScopedCommit borrows main-checkout 50. CAS-before-commit reruns reuse it.
  const pin = store.importLegacy({ expectedHead: plan.fromCommit }, heldRanks);
  if (pin.legacyRefOid !== plan.import.legacyRefOid) refuse('event-store-migration-parity', 'published import differs from HEAD data tree', { operationId });
  if (store.read({ streams: ['project', 'project:porting'] }, heldRanks).sequence.length) refuse('event-store-migration-parity', 'published v4 events exist before cutover', { operationId });
  try {
    for (const p of deletions) fs.unlinkSync(path.join(cwd, p));
    const fence = path.join(cwd, '.fgos/events');
    if (fs.existsSync(fence)) fs.rmdirSync(fence);
    put(cwd, '.fgos/events', JSON.stringify(pin) + '\n');
    if (attributesChanged) {
      if (attributeBytes.length) fs.writeFileSync(path.join(cwd, '.gitattributes'), attributeBytes);
      else fs.unlinkSync(path.join(cwd, '.gitattributes'));
    }
    const result = scoped.commit({ operationId, baseline, request: { writes, message: plan.message, cutoverGrant: { exactPaths, legacyRefOid: pin.legacyRefOid, sealDigest: pin.sealDigest } } });
    if (result.status !== 'committed' || store.readLegacyFromHead({}, heldRanks).inventory.fromCommit === plan.fromCommit) refuse('event-store-cutover-review-required', JSON.stringify(result), { operationId, result });
    return { plan, parity, pin, operationId, commit: result };
  } catch (error) {
    const failure = cutoverFailure(error);
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
    error.message += `; inspect Git ScopedCommit record ${operationId}`;
    throw error;
  }
}

// Dry-run Git object identity: hashes bytes only, never installs an object.
// The real Publication result must equal this plan before any cutover edits.
export function importPlan({ inventory, existingLegacyOid }) {
  const algorithm = inventory.fromCommit.length === 64 ? 'sha256' : 'sha1';
  const object = (kind, bytes) => createHash(algorithm).update(`${kind} ${bytes.length}\0`).update(bytes).digest();
  const tree = files => {
    const entries = new Map();
    for (const [name, bytes] of files) {
      const slash = name.indexOf('/');
      if (slash < 0) entries.set(name, { mode: '100644', oid: object('blob', bytes) });
      else {
        const dir = name.slice(0, slash);
        if (!entries.has(dir)) entries.set(dir, { mode: '40000', files: [] });
        entries.get(dir).files.push([name.slice(slash + 1), bytes]);
      }
    }
    const sorted = [...entries].sort(([a, x], [b, y]) => Buffer.compare(Buffer.from(a + (x.files ? '/' : '')), Buffer.from(b + (y.files ? '/' : ''))));
    return object('tree', Buffer.concat(sorted.map(([name, e]) => Buffer.concat([Buffer.from(`${e.mode} ${name}\0`), e.files ? tree(e.files) : e.oid]))));
  };
  const files = Object.entries(inventory.files).flatMap(([name, bytes]) => name === '.fgos/events.jsonl' || /^\.fgos\/events\/[^/]+\.jsonl$/.test(name) ? [[name.slice(6), Buffer.from(bytes)]] : name === inventory.portingLog ? [[`porting/${name}`, Buffer.from(bytes)]] : []);
  const dataTree = tree(files).toString('hex');
  files.push(['seal.json', Buffer.from(JSON.stringify({ fromCommit: inventory.fromCommit, kind: 'legacy', treeOfFgosEvents: dataTree }) + '\n')]);
  const identity = 'fgOS Event Store <event-store@fgos.invalid> 0 +0000';
  const commit = Buffer.from(`tree ${tree(files).toString('hex')}\nauthor ${identity}\ncommitter ${identity}\n\nfgos-events legacy import`);
  const legacyRefOid = object('commit', commit).toString('hex');
  return { legacyRefOid, dataTree, existingLegacyOid, action: !existingLegacyOid ? 'create' : existingLegacyOid === legacyRefOid ? 'reuse' : 'replace-unfenced-stale' };
}

// Decode Git's typed envelope; recovery and unknown classes never authorize
// Event Store restoration, even when HEAD happens to remain at the baseline.
export function cutoverFailure(error) {
  let code = error.code, cause;
  try { const native = JSON.parse(error.message); code = native.code ?? code; cause = native.cause; } catch {}
  const ordinary = new Set(['commit-rejected', 'checkout-required', 'lock-order-violation', 'git-dual-borrow-unavailable', 'main-checkout-authority-mismatch', 'checkout-custody-required', 'checkout-custody-stale', 'checkout-authority-required', 'git-lockscope-unavailable-windows', 'untrusted-worktree', 'invalid-commit-message', 'foreign-merge-head', 'foreign-staged-index', 'source-baseline-stale', 'cutover-main-required', 'cutover-exact-deletions-required', 'cutover-legacy-ref-mismatch', 'cutover-seal-digest-mismatch', 'staged-set-mismatch', 'literal-path-staging-failed', 'commit-snapshot-non-file']);
  return { code, cause, restore: (code === 'refused' && ordinary.has(cause)) || ordinary.has(code) };
}
