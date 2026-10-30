// Fixtures and the in-process call of approve, shared by the approve test files next to this one.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveFgosFile, FGOS_FILE } from '../../../src/state/fgos-file-registry.mjs';
import { addWork, EXIT_CODES, StoreError } from '../../../src/state/store.mjs';
import { approveUseCase } from '../../../src/verbs/merge/approve.mjs';
import {
  REAL_REPO_ROOT,
  addOk,
  commitFile,
  commitPending,
  commitPendingBeforeApprove,
  gitAtCwd,
  moveOk,
  run,
} from '../../cli/helpers/fgos-cli-harness.mjs';

export const fgosDir = (cwd) => path.join(cwd, '.fgos');

// What the CLI resolves from its flags when none are given, except a fixed verify timeout in place of the runner config's.
const APPROVE_OPTIONS = {
  resolveTimeoutMs: () => 60_000,
  resolveWaitFlags: () => ({ noWait: false, waitMs: undefined }),
  acknowledgeIronLaw: false,
  acknowledgeDrift: false,
  github: false,
};

export const approve = (cwd, id, options = {}, repoRoot = cwd) => approveUseCase({ dir: fgosDir(cwd), repoRoot }, { ...APPROVE_OPTIONS, ...options, id });

/** Matches the StoreError the CLI turns into `exitCode`, with a message matching every pattern given. */
export function refusal(exitCode, ...patterns) {
  return (err) => err instanceof StoreError && EXIT_CODES[err.category] === exitCode && patterns.every((pattern) => pattern.test(err.message));
}

export function moveFixture(cwd, id, to) {
  const options = to === 'awaiting-approval' ? { skipReturnGuard: "test fixture setup, not exercising return's own guard" } : {};
  const result = moveOk(cwd, id, to, options);
  assert.equal(result.status, 0, `fixture move of ${id} to ${to}: ${result.stderr}`);
}

/** An item awaiting approval with no branch and no take: approve re-runs its verify on the checkout. */
export function proposeLegacy(cwd, id, extra = {}) {
  assert.equal(addOk(cwd, id, extra).status, 0);
  moveFixture(cwd, id, 'awaiting-approval');
}

/** A pull-door item: taken on the main checkout, its proof committed, returned. `return` has no use case to call
 * in process, so it runs as the CLI, and so does the take it settles: a claim settles only as its own writer. */
export function proposePull(cwd, id) {
  assert.equal(addOk(cwd, id, { verify: 'test -f proof.txt' }).status, 0);
  // boundary: `return` has no use case to call in process, and a claim settles only as the writer that took it.
  assert.equal(run(cwd, ['take', '--id', id]).status, 0);
  commitFile(cwd, 'proof.txt');
  // boundary: `return` is written inline in bin/fgos.mjs, with no use case to call in process.
  const returned = run(cwd, ['return', id]);
  assert.equal(returned.status, 0, returned.stderr);
}

/** A root/standalone item whose own fgw/<id> branch changes shared.txt one way while main changes it another. */
export function proposeConflictingRunnerItem(cwd, id, { withChild = false } = {}) {
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'base\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'seed shared.txt']);
  assert.equal(addOk(cwd, id).status, 0);
  // A child (any status) marks the root as one that actually had children.
  if (withChild) addWork(fgosDir(cwd), { id: `${id}-child`, title: 'child', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', parent: id });
  commitPending(cwd, `state: add ${id}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${id}`]);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'branch-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'branch changes shared.txt']);
  gitAtCwd(cwd, ['checkout', 'main']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'main-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'main changes shared.txt']);

  moveFixture(cwd, id, 'awaiting-approval');
  commitPending(cwd, `state: propose ${id}`);
}

/** A root added under rootId and a leaf whose own fgw/<leafId> commit (file relPath) forks from fgw/<rootId>. */
export function proposeLeafForkedFromRoot(cwd, rootId, leafId, relPath, { beforeFork } = {}) {
  addWork(fgosDir(cwd), { id: rootId, title: `Title ${rootId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, `state: add ${rootId}`);
  gitAtCwd(cwd, ['branch', `fgw/${rootId}`, 'main']);
  beforeFork?.();

  addWork(fgosDir(cwd), { id: leafId, title: `Title ${leafId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: `test -f ${relPath}`, parent: rootId });
  commitPending(cwd, `state: add ${leafId}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${leafId}`, `fgw/${rootId}`]);
  fs.mkdirSync(path.dirname(path.join(cwd, relPath)), { recursive: true });
  fs.writeFileSync(path.join(cwd, relPath), 'ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${leafId}`]);
  gitAtCwd(cwd, ['checkout', 'main']);

  moveFixture(cwd, leafId, 'awaiting-approval');
  commitPendingBeforeApprove(cwd, leafId);
}

export function moveRootToResolved(cwd, rootId, finalStatus) {
  if (finalStatus === 'wontfix') {
    moveFixture(cwd, rootId, 'wontfix');
  } else {
    moveFixture(cwd, rootId, 'awaiting-approval');
    moveFixture(cwd, rootId, 'delivered');
  }
  commitPending(cwd, `state: resolve ${rootId} to ${finalStatus}`);
}

/** Another item's merge already staged on the main checkout by a concurrent session, never committed or aborted. */
export function stageOtherItemsMerge(cwd, otherId) {
  gitAtCwd(cwd, ['checkout', '-b', `fgw/${otherId}`]);
  fs.writeFileSync(path.join(cwd, `${otherId}-produced.txt`), 'other\n');
  gitAtCwd(cwd, ['add', `${otherId}-produced.txt`]);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${otherId}`]);
  gitAtCwd(cwd, ['checkout', 'main']);
  gitAtCwd(cwd, ['merge', '--no-commit', '--no-ff', `fgw/${otherId}`]);
}

/** A legacy item whose verify, while approve runs it, moves the item itself from another process. */
export function proposeWithConcurrentMove(cwd, id, to) {
  const storeUrl = pathToFileURL(path.join(REAL_REPO_ROOT, 'src', 'state', 'store.mjs')).href;
  fs.writeFileSync(path.join(cwd, 'verify-cas.mjs'), `import { moveWork } from ${JSON.stringify(storeUrl)};
moveWork(".fgos", { id: ${JSON.stringify(id)}, to: ${JSON.stringify(to)}, expectedStatus: "awaiting-approval", reason: "concurrent-${to}", role: "system" });
process.exit(1);
`);
  proposeLegacy(cwd, id, { verify: 'node verify-cas.mjs' });
}

export function branchesUnder(cwd, prefix = 'refs/heads/fgw/') {
  return gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', prefix]);
}

export function approveFaultRecord(cwd, id) {
  const logPath = resolveFgosFile(fgosDir(cwd), FGOS_FILE.APPROVE_FAULT_LOG);
  assert.ok(fs.existsSync(logPath), 'diagnostic log file must exist');
  return fs.readFileSync(logPath, 'utf8').trim().split('\n').map((line) => JSON.parse(line)).find((record) => record.id === id);
}
