import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('../..', import.meta.url).pathname);

// Real transitive static-import graph walk: parse each visited file's own
// `import .. from '...'` / `export .. from '...'` statements and recurse into
// whatever they resolve to. This is NOT a name/regex text-scan of arbitrary
// repo files -- a shallow scan limited to reconciliation-planner.mjs's own
// source alone would have missed a two-hop static
// re-export (visibility-session.mjs used to re-export reconcileHerdrSpawnRun
// from herdr-round.mjs at its top level) that pulled the whole cli-spawn
// process-control adapter chain into this graph transitively, even though
// reconciliation-planner.mjs's own file never names any of those symbols.
// That re-export was dead code (verified: nothing in the repo imports
// reconcileHerdrSpawnRun from visibility-session.mjs's own path, only
// directly from herdr-round.mjs) and is removed as part of this same fix --
// this test is what proves the removal actually closed the gap, and what
// catches any future re-introduction.
const IMPORT_RE = /from\s+['"](\.{1,2}\/[^'"]+)['"]/g;

// run-result.mjs is a proven, already-tested leaf boundary: the identical
// carve-out exists in test/runner/dispatch-runtime-inspect.test.mjs's own
// static import-graph test, which already proves its own further imports
// (agent-result-claim-contract.mjs) are safe. Reusing that proof here avoids
// re-deriving a second walk into the same subtree.
const isProvenLeaf = (file) => file.endsWith('/run-result.mjs');

// Concrete modules -- named explicitly, each confirmed by direct reading, not
// by guessing at names -- that implement process-control, retry/relaunch,
// admission, resume/reattach, reassignment, cancellation, or takeover. This
// list documents exactly what the walk below must never reach; the walk's
// own exact-set assertion further down is the load-bearing proof, this is
// the human-readable cross-check for it.
const BANNED_FILES = [
  'src/runner/dispatch/cli-spawn-supervisor.mjs', // process-control adapter: child_process.spawn, worker PGID signalling, receipt publication
  'src/runner/dispatch/herdr-round.mjs', // process-control: prepares/briefs/signals one interactive herdr round
  'src/runner/dispatch/herdr-agent.mjs', // herdr client: spawns/queries live herdr panes
  'src/runner/dispatch/worker-home.mjs', // creates/removes a spawned worker's confined home directory
  'src/runner/dispatch/trust-store.mjs', // seeds trust for a spawned worker
  'src/runner/dispatch/worker-session-boot.mjs', // resume/reattach: ensures a live worker session exists
  'src/runner/dispatch/liveness.mjs', // process-control signal ladder / pane-fate escalation
  'src/runner/dispatch/assignment-runner.mjs', // launch/execution and Run-lifecycle driving
  'src/runner/dispatch/plan.mjs', // admission: DispatchPlan compiler, Run generation admission
  'src/runner/dispatch/recovery-planner.mjs', // resume/reassign/retry recommendation planning
  'src/runner/recovery.mjs', // retry decision matrix
  'src/verbs/dispatch/recover.mjs', // recovery verb: observes/applies resume/reassign for a standalone Run
  'src/runner/coordination/session-engine.mjs', // CoordinationSession admission/resumption/takeover
  'src/runner/claim-port.mjs', // work-item claim admission gate
  'src/runner/dispatch/run-lock.mjs', // run-lock ledger writer
  'src/runner/dispatch/confinement/policies.mjs', // worker confinement policy for a spawned process
  'src/runner/dispatch/confinement/bypass-pairing.mjs', // confinement bypass pairing for a spawned process
].map((p) => path.join(root, p));

for (const banned of BANNED_FILES) {
  test(`banned-module sanity: ${path.relative(root, banned)} exists on disk (keeps the banned list honest, not fictional)`, () => {
    assert.equal(fs.existsSync(banned), true, `expected ${banned} to exist -- update BANNED_FILES if this module moved`);
  });
}

// Defense in depth: even a file legitimately in the graph must never itself
// perform a process-control call. Patterns require an actual call/import
// form (trailing `(` or the `node:` protocol prefix), never a bare English
// word -- reconciliation-planner.mjs's own comments discuss the cli-spawn
// adapter and process-control concepts in prose (e.g. "child_process.spawn,
// worker PGID signalling"), and a bare-word ban would false-positive on that
// legitimate prose instead of on an actual call.
const BANNED_CALL_PATTERN = /node:child_process|\bspawn\(|\bexecFile\(|\bfork\(|process\.kill\(|\.kill\(|\.signal\(/;

function walk(file, seen) {
  if (seen.has(file)) return;
  seen.add(file);
  if (isProvenLeaf(file)) return;
  const source = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(source, BANNED_CALL_PATTERN, `${path.relative(root, file)} matched a banned process-control call pattern`);
  for (const m of source.matchAll(IMPORT_RE)) {
    let target = path.resolve(path.dirname(file), m[1]);
    if (!path.extname(target)) target += '.mjs';
    walk(target, seen);
  }
}

test('reconcile use-case + reconciliation-planner transitive import graph excludes process-control/retry/admission/resume/reassignment/cancellation/takeover modules', () => {
  const seen = new Set();
  walk(path.join(root, 'src/verbs/dispatch/reconcile.mjs'), seen);
  walk(path.join(root, 'src/runner/dispatch/reconciliation-planner.mjs'), seen);

  for (const banned of BANNED_FILES) {
    assert.equal(seen.has(banned), false, `reconcile's real import graph must never reach ${path.relative(root, banned)}`);
  }

  // Strongest proof: the whole real transitive closure is EXACTLY this known,
  // hand-verified set -- not merely "does not contain a banned name". Any
  // future import added anywhere in this graph must show up here as a
  // deliberate, reviewed addition to `expected`, never silently.
  const expected = [
    'src/verbs/dispatch/reconcile.mjs',
    'src/runner/dispatch/reconciliation-planner.mjs',
    'src/runner/dispatch/runtime-inspection.mjs',
    'src/runner/dispatch/run-result.mjs',
    'src/runner/dispatch/visibility-session.mjs',
    'src/runner/dispatch/worker-artifacts.mjs',
  ].map((p) => path.join(root, p)).sort();
  assert.deepEqual([...seen].sort(), expected);
});
