// checks.test.mjs -- registry check của `fgos doctor` cùng phần chứng minh ở
// mức CLI rằng `fgos doctor` (có/không --pretty) hành xử đúng CTR001/D7.
// Harness spawnSync thật, không mock chính process CLI.
//
// tsk-67g: 10 test dựng môi trường thật cho `fgos setup` đã dọn sang các file
// checks-setup-*.test.mjs bên cạnh -- chúng chiếm 117.6s trong 120s của file
// này và một mình quyết định wall-clock của cả bộ test. Phần ở lại đây chạy
// hết trong khoảng 2.5s.
import { test } from 'node:test';
import {
  DEFAULT_CLEANUP_LEAF_TTL_DAYS,
  DEFAULT_CLEANUP_TTL_DAYS,
  DEFAULT_HERDR_ORCHESTRATOR_SETTINGS,
  DEFAULT_HERDR_WEB_DASHBOARD_SETTINGS,
  DEFAULT_INVARIANT_CHECK_COMMANDS,
  DEFAULT_LEVEL,
  DEFAULT_RUNNER_CONFIG,
  DOCTOR_CHECKS,
  FGOS,
  FIX_REGISTRATIONS,
  NO_CLAUDE_ENV,
  __dirname,
  addWork,
  appendEvent,
  assert,
  checkById,
  execFileSync,
  fileURLToPath,
  fixById,
  fs,
  initRepo,
  initStore,
  integrationScriptPath,
  mainCheckoutHookWired,
  mkTemp,
  os,
  path,
  resolveMainCheckout,
  spawnSync,
  withHome,
  writeEnduserDoc,
  writeEnduserManifest,
} from './helpers/setup-checks-harness.mjs';
import { DEFAULT_WORKER_SLOT_CEILING } from '../../src/state/worker-slots.mjs';
import { DEFAULT_CHECKPOINT_EVENT_THRESHOLD } from '../../src/state/events-jsonl-truncation-guard.mjs';
import { DEFAULT_CAPABILITY_SLOTS, DEFAULT_IRON_LAW_LEVEL, PI_EXECUTOR_DEFAULT, findDomainWorkflowSkillMapGaps } from '../../src/setup/registrations.mjs';
import { addDecision } from '../../src/state/store.mjs';


import { createSession } from '../../src/runner/session.mjs';

// ─── Unit tests: DOCTOR_CHECKS ─────────────────────────────────────────────

test('DOCTOR_CHECKS has exactly the three v1 checks from CONTEXT.md plus main-checkout-hook-wired, tool-registry-configured, config-awareness, dependencies-installed, gate-bypass-configured, root-drift, leaf-notify-drift, claude-plugin-marketplace, plugin-skill-cli-reachable, plugin-dev-skills-packaged, changelog-unreleased-stale, herdr-launcher-configured, herdr-web-dashboard-configured, work-classification-vocabulary, work-stage-vocabulary, domain-workflow-skillmap-coverage, delivered-not-on-trunk, enduser-docs-index-stale, events-jsonl-contiguous, invariant-checks-configured, events-jsonl-not-truncated, cli-version-visible, worker-slots-ceiling-usable, gateway-token-configured, readme-install-tag-exists, iron-law-configured, task-specs-resolve, agent-claims-resolve, dispatch-decide-hook-wired, advise-execute-capabilities-configured, decision-index-stale, and agy-permissions-configured', () => {
  assert.deepEqual(
    DOCTOR_CHECKS.map((c) => c.id).sort(),
    [
      'config-not-stale',
      'main-checkout-hook-wired',
      'node-version-and-git',
      'shell-integration-sourced',
      'tool-registry-configured',
      'config-awareness',
      'dependencies-installed',
      'gate-bypass-configured',
      'root-drift',
      'leaf-notify-drift',
      'claude-plugin-marketplace',
      'plugin-skill-cli-reachable',
      'plugin-dev-skills-packaged',
      'changelog-unreleased-stale',
      'herdr-launcher-configured',
      'herdr-web-dashboard-configured',
      'work-classification-vocabulary',
      'work-stage-vocabulary',
      'domain-workflow-skillmap-coverage',
      'delivered-not-on-trunk',
      'enduser-docs-index-stale',
      'events-jsonl-contiguous',
      'invariant-checks-configured',
      'events-jsonl-not-truncated',
      'cli-version-visible',
      'worker-slots-ceiling-usable',
      'gateway-token-configured',
      'readme-install-tag-exists',
      'iron-law-configured',
      'dispatch-decide-hook-wired',
      'task-specs-resolve',
      'agent-claims-resolve',
      'agent-type-names-unique',
      'advise-execute-capabilities-configured',
      'decision-index-stale',
      'agy-permissions-configured',
      'main-checkout-guard-warnings',
      'events-compaction-verified',
    ].sort(),
  );
});

test('root-drift passes when no fgw/<root> branch is ahead of its target', () => {
  const dir = initRepo('checks-root-drift-clean-');
  execFileSync('git', ['checkout', '-q', '-b', 'fgw/root'], { cwd: dir });
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: dir });
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);
  addWork(fgosDir, { id: 'root', title: 'root', kind: 'feature', risk: 'light', verify: 'true', status: 'todo', deps: [], refs: [] });
  addWork(fgosDir, { id: 'leaf', title: 'leaf', kind: 'feature', risk: 'light', verify: 'true', status: 'todo', deps: [], refs: [], parent: 'root' });

  const { passed, message } = checkById('root-drift').check(dir);
  assert.equal(passed, true);
  assert.match(message, /no root branch is drifted/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('root-drift fails and names the drifted root when fgw/<root> is ahead of main', () => {
  const dir = initRepo('checks-root-drift-dirty-');
  execFileSync('git', ['checkout', '-q', '-b', 'fgw/root'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'child-work.txt'), 'merged leaf work\n');
  execFileSync('git', ['add', 'child-work.txt'], { cwd: dir });
  execFileSync('git', ['commit', '-qm', 'leaf merged into root'], { cwd: dir });
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: dir });
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);
  addWork(fgosDir, { id: 'root', title: 'root', kind: 'feature', risk: 'light', verify: 'true', status: 'todo', deps: [], refs: [] });
  addWork(fgosDir, { id: 'leaf', title: 'leaf', kind: 'feature', risk: 'light', verify: 'true', status: 'todo', deps: [], refs: [], parent: 'root' });

  const { passed, message } = checkById('root-drift').check(dir);
  assert.equal(passed, false);
  assert.match(message, /root/);
  assert.match(message, /fgos sync-root/);
  fs.rmSync(dir, { recursive: true, force: true });
});

// tsk-4qu: the drift class this check used to miss entirely. A leaf merges
// into fgw/<root> regardless of the root's status, so a root closed out
// (delivered/retrospective/cleanup/done) can be left holding commits its
// target never got — and driftStatus reports needsSync:false for exactly
// those, keeping them out of every merge bucket. Observed live twice
// (tsk-4ns, tsk-53n) before anything reported it.

test('root-drift reports a CLOSED-OUT root whose branch still holds work outside its target', () => {
  const dir = initRepo('checks-root-drift-stranded-');
  execFileSync('git', ['checkout', '-q', '-b', 'fgw/root'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'leaf-work.txt'), 'leaf work merged into the root branch\n');
  execFileSync('git', ['add', 'leaf-work.txt'], { cwd: dir });
  execFileSync('git', ['commit', '-qm', 'leaf merged into root after the root was closed out'], { cwd: dir });
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: dir });
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);
  // `delivered` is what makes this the tsk-4qu case rather than the ordinary
  // drift one above: isResolvedStatus(root) is true, so needsSync is false.
  addWork(fgosDir, { id: 'root', title: 'root', kind: 'feature', risk: 'light', verify: 'true', status: 'delivered', deps: [], refs: [] });
  addWork(fgosDir, { id: 'leaf', title: 'leaf', kind: 'feature', risk: 'light', verify: 'true', status: 'delivered', deps: [], refs: [], parent: 'root' });

  const { passed, message } = checkById('root-drift').check(dir);
  assert.equal(passed, false, 'a closed-out root holding unsynced work must not pass silently');
  assert.match(message, /closed out with work still outside their target/);
  assert.match(message, /nothing will sync these automatically/);
  assert.match(message, /root \(fgw\/root is 1 commit\(s\) ahead of main\)/);
  assert.match(message, /fgos sync-root/);
  fs.rmSync(dir, { recursive: true, force: true });
});

// wontfix is the deliberate exception: an abandoned item's branch is SUPPOSED
// to sit outside its target forever, so reporting it would be noise. This is
// why the check spells out the completed statuses instead of reusing
// isResolvedStatus, which folds wontfix in with them.
test('root-drift stays silent for a wontfix root whose branch is ahead — abandoned work is meant to sit outside', () => {
  const dir = initRepo('checks-root-drift-wontfix-');
  execFileSync('git', ['checkout', '-q', '-b', 'fgw/root'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'abandoned.txt'), 'work that was deliberately abandoned\n');
  execFileSync('git', ['add', 'abandoned.txt'], { cwd: dir });
  execFileSync('git', ['commit', '-qm', 'abandoned work'], { cwd: dir });
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: dir });
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);
  addWork(fgosDir, { id: 'root', title: 'root', kind: 'feature', risk: 'light', verify: 'true', status: 'wontfix', deps: [], refs: [] });
  addWork(fgosDir, { id: 'leaf', title: 'leaf', kind: 'feature', risk: 'light', verify: 'true', status: 'wontfix', deps: [], refs: [], parent: 'root' });

  const { passed, message } = checkById('root-drift').check(dir);
  assert.equal(passed, true);
  assert.match(message, /no root branch is drifted/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('leaf-notify-drift passes when no live session branch has post-land drift against its target', () => {
  const dir = initRepo('checks-leaf-drift-clean-');
  execFileSync('git', ['checkout', '-q', '-b', 'fgw/leaf'], { cwd: dir });
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: dir });
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);
  addWork(fgosDir, { id: 'leaf', title: 'leaf', kind: 'feature', risk: 'light', verify: 'true', status: 'doing', deps: [], refs: [] });

  const { passed, message } = checkById('leaf-notify-drift').check(dir);
  assert.equal(passed, true);
  assert.match(message, /no live session branch has post-land drift/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('leaf-notify-drift fails and names the leaf when a live session branch overlaps files with target land', () => {
  const dir = initRepo('checks-leaf-drift-dirty-');
  execFileSync('git', ['checkout', '-q', '-b', 'fgw/leaf'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'file.txt'), 'leaf work\n');
  execFileSync('git', ['add', 'file.txt'], { cwd: dir });
  execFileSync('git', ['commit', '-qm', 'leaf work'], { cwd: dir });

  execFileSync('git', ['checkout', '-q', 'main'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'file.txt'), 'landed work\n');
  execFileSync('git', ['add', 'file.txt'], { cwd: dir });
  execFileSync('git', ['commit', '-qm', 'landed work on main'], { cwd: dir });

  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);
  addWork(fgosDir, { id: 'landed', title: 'landed', kind: 'feature', risk: 'light', verify: 'true', status: 'done', deps: [], refs: [] });
  addWork(fgosDir, { id: 'leaf', title: 'leaf', kind: 'feature', risk: 'light', verify: 'true', status: 'doing', deps: [], refs: [] });
  createSession(dir, { itemId: 'leaf' });

  const { passed, message } = checkById('leaf-notify-drift').check(dir);
  assert.equal(passed, false);
  assert.match(message, /leaf/);
  assert.match(message, /file\.txt/);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ─── events-jsonl-contiguous (tsk-3wq) ─────────────────────────────────────

test('events-jsonl-contiguous passes on a freshly-initialized, untouched log', () => {
  const dir = initRepo('checks-events-contig-clean-');
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);
  addWork(fgosDir, { id: 'a', title: 'a', kind: 'feature', risk: 'light', verify: 'true', status: 'todo', deps: [], refs: [] });

  const { passed, message } = checkById('events-jsonl-contiguous').check(dir);
  assert.equal(passed, true);
  assert.match(message, /contiguous/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('events-jsonl-contiguous fails when the log has a duplicate seq (the union-merge residue shape)', () => {
  const dir = initRepo('checks-events-contig-dup-');
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);
  const logPath = path.join(fgosDir, 'events.jsonl');
  fs.appendFileSync(logPath, `${JSON.stringify({ seq: 100, ts: '2026-01-01T00:00:00.000Z', type: 'race-a', payload: null })}\n`);
  fs.appendFileSync(logPath, `${JSON.stringify({ seq: 100, ts: '2026-01-01T00:00:01.000Z', type: 'race-b', payload: null })}\n`);

  const { passed, message } = checkById('events-jsonl-contiguous').check(dir);
  assert.equal(passed, false);
  assert.match(message, /duplicate seq/);
  assert.match(message, /fgos doctor --fix/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('events-jsonl-contiguous fix resolves the duplicate-seq shape without losing either event', () => {
  const dir = initRepo('checks-events-contig-fix-');
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);
  const logPath = path.join(fgosDir, 'events.jsonl');
  fs.appendFileSync(logPath, `${JSON.stringify({ seq: 100, ts: '2026-01-01T00:00:00.000Z', type: 'race-a', payload: null })}\n`);
  fs.appendFileSync(logPath, `${JSON.stringify({ seq: 100, ts: '2026-01-01T00:00:01.000Z', type: 'race-b', payload: null })}\n`);

  const { changed, message } = fixById('events-jsonl-contiguous').fix(dir);
  assert.equal(changed, true);
  assert.match(message, /resequenced/);

  const { passed } = checkById('events-jsonl-contiguous').check(dir);
  assert.equal(passed, true, 'the check must pass after the fix runs');

  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(lines.map((l) => l.type).sort(), ['race-a', 'race-b'], 'both events must survive the fix, never one dropped');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('events-jsonl-contiguous fix is a no-op when the log is already contiguous', () => {
  const dir = initRepo('checks-events-contig-noop-');
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);
  addWork(fgosDir, { id: 'a', title: 'a', kind: 'feature', risk: 'light', verify: 'true', status: 'todo', deps: [], refs: [] });

  const { changed, message } = fixById('events-jsonl-contiguous').fix(dir);
  assert.equal(changed, false);
  assert.match(message, /already contiguous/);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ─── events-jsonl-not-truncated (tsk-cgg) ──────────────────────────────────

test('events-jsonl-not-truncated has no registered fix — a break means real data is already gone, so auto-repair would erase the loud signal (docs/how-to/resolve-an-events-jsonl-truncation.md is the deliberate manual path instead)', () => {
  assert.equal(
    FIX_REGISTRATIONS.some((f) => f.id === 'events-jsonl-not-truncated'),
    false,
  );
});

test('events-jsonl-not-truncated passes and bootstraps a mark on first run against a healthy log', () => {
  const dir = initRepo('checks-truncguard-bootstrap-');
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);
  addWork(fgosDir, { id: 'a', title: 'a', kind: 'feature', risk: 'light', verify: 'true', status: 'todo', deps: [], refs: [] });

  const { passed, message } = checkById('events-jsonl-not-truncated').check(dir);
  assert.equal(passed, true);
  assert.match(message, /truncation guard holds/);
  assert.equal(fs.existsSync(path.join(fgosDir, 'events-jsonl.truncation-guard.json')), true, 'a passing check advances/bootstraps the mark');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('events-jsonl-not-truncated fails when the log was truncated then reappended past the old mark', () => {
  const dir = initRepo('checks-truncguard-break-');
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);
  const logPath = path.join(fgosDir, 'events.jsonl');
  fs.appendFileSync(logPath, `${JSON.stringify({ seq: 1, ts: '2026-01-01T00:00:00.000Z', type: 'orig', payload: null })}\n`);
  fs.appendFileSync(logPath, `${JSON.stringify({ seq: 2, ts: '2026-01-01T00:00:01.000Z', type: 'orig', payload: null })}\n`);

  const first = checkById('events-jsonl-not-truncated').check(dir);
  assert.equal(first.passed, true, 'first run bootstraps clean');

  // Simulate a stash-style truncation: revert to just line 1, then append a
  // DIFFERENT event reusing seq 2.
  fs.writeFileSync(logPath, `${JSON.stringify({ seq: 1, ts: '2026-01-01T00:00:00.000Z', type: 'orig', payload: null })}\n`, 'utf8');
  fs.appendFileSync(logPath, `${JSON.stringify({ seq: 2, ts: '2026-01-01T09:00:00.000Z', type: 'post-truncation', payload: null })}\n`);

  const { passed, message } = checkById('events-jsonl-not-truncated').check(dir);
  assert.equal(passed, false);
  assert.match(message, /truncation detected/);
  assert.match(message, /resolve-an-events-jsonl-truncation/);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ─── work-classification-vocabulary (tsk-6ax) ──────────────────────────────
// Scoped to OPEN items only (matches the item's own "no open item may carry
// risk/kind outside its domain's vocabulary" wording) — a resolved item's
// stale classification no longer feeds decompose.mjs's heavy-risk gate or
// priority-formula.mjs's risk discount, so flagging it would just be noise.
//
// `addWork` itself rejects an out-of-vocabulary risk/kind at the write door
// (validateWorkShape, untouched-field grandfathering does not apply to a
// brand-new item — every field is "touched"). A legacy-value fixture has to
// be constructed the same way test/state/backward-compat.test.mjs's own
// frozen fixtures are: a raw `work.add` event appended directly, bypassing
// the write door entirely — the exact shape a real pre-vocabulary log
// entry has.

test('work-classification-vocabulary passes on an empty store', () => {
  const dir = initRepo('checks-classification-empty-');
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);

  const { passed, message } = checkById('work-classification-vocabulary').check(dir);
  assert.equal(passed, true);
  assert.match(message, /matches its domain's classification vocabulary/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('work-classification-vocabulary passes when every item is already in-vocabulary', () => {
  const dir = initRepo('checks-classification-clean-');
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);
  addWork(fgosDir, { id: 'a', title: 'a', kind: 'feature', risk: 'light', verify: 'true', status: 'todo', deps: [], refs: [] });
  addWork(fgosDir, { id: 'b', title: 'b', kind: 'bug', risk: 'heavy', verify: 'true', status: 'doing', deps: [], refs: [] });

  const { passed } = checkById('work-classification-vocabulary').check(dir);
  assert.equal(passed, true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('work-classification-vocabulary fails and names an OPEN item carrying a stale risk value', () => {
  const dir = initRepo('checks-classification-bad-risk-');
  const fgosDir = path.join(dir, '.fgos');
  const logPath = path.join(fgosDir, 'events.jsonl');
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'stale-risk', title: 'stale-risk', kind: 'bug', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true' },
  });

  const { passed, message } = checkById('work-classification-vocabulary').check(dir);
  assert.equal(passed, false);
  assert.match(message, /stale-risk/);
  assert.match(message, /risk: "low"/);
  assert.match(message, /fgos edit/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('work-classification-vocabulary fails and names an OPEN item carrying an out-of-vocabulary kind', () => {
  const dir = initRepo('checks-classification-bad-kind-');
  const fgosDir = path.join(dir, '.fgos');
  const logPath = path.join(fgosDir, 'events.jsonl');
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'stale-kind', title: 'stale-kind', kind: 'test', status: 'doing', deps: [], risk: 'light', refs: [], verify: 'true' },
  });

  const { passed, message } = checkById('work-classification-vocabulary').check(dir);
  assert.equal(passed, false);
  assert.match(message, /stale-kind/);
  assert.match(message, /kind: "test"/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('work-classification-vocabulary passes despite a stale risk/kind on an already-resolved (done) item', () => {
  const dir = initRepo('checks-classification-resolved-');
  const fgosDir = path.join(dir, '.fgos');
  const logPath = path.join(fgosDir, 'events.jsonl');
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'old-done', title: 'old-done', kind: 'test', status: 'done', deps: [], risk: 'high', refs: [], verify: 'true' },
  });

  const { passed, message } = checkById('work-classification-vocabulary').check(dir);
  assert.equal(passed, true, message);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('work-classification-vocabulary lists every violating id, not just the first', () => {
  const dir = initRepo('checks-classification-multi-');
  const fgosDir = path.join(dir, '.fgos');
  const logPath = path.join(fgosDir, 'events.jsonl');
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'bad-one', title: 'bad-one', kind: 'bug', status: 'todo', deps: [], risk: 'medium', refs: [], verify: 'true' },
  });
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'bad-two', title: 'bad-two', kind: 'feat', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' },
  });

  const { passed, message } = checkById('work-classification-vocabulary').check(dir);
  assert.equal(passed, false);
  assert.match(message, /bad-one/);
  assert.match(message, /bad-two/);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ─── work-stage-vocabulary (tsk-64h) ───────────────────────────────────────
// The stage-axis sibling of work-classification-vocabulary above: an open
// item may sit at a stage its own domain no longer registers, and nothing
// surfaced that until now. Same OPEN-only scoping and the same raw
// `work.add` fixture technique, for the same reason — `validateWorkShape`
// refuses a retired stage at the write door, so a legacy-shaped item can
// only be constructed by appending the event directly.

test('work-stage-vocabulary passes on an empty store', () => {
  const dir = initRepo('checks-stage-vocab-empty-');
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);

  const { passed, message } = checkById('work-stage-vocabulary').check(dir);
  assert.equal(passed, true);
  assert.match(message, /registered by its domain/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('work-stage-vocabulary passes for an item whose stage was never written (lazy Execute default)', () => {
  const dir = initRepo('checks-stage-vocab-unset-');
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);
  addWork(fgosDir, { id: 'a', title: 'a', kind: 'feature', risk: 'light', verify: 'true', status: 'todo', deps: [], refs: [] });

  const { passed, message } = checkById('work-stage-vocabulary').check(dir);
  assert.equal(passed, true, message);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('work-stage-vocabulary passes when every open item sits at a stage its domain registers', () => {
  const dir = initRepo('checks-stage-vocab-clean-');
  const fgosDir = path.join(dir, '.fgos');
  const logPath = path.join(fgosDir, 'events.jsonl');
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'a', title: 'a', kind: 'feature', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', stage: 'planning' },
  });
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'b', title: 'b', kind: 'feature', status: 'doing', deps: [], risk: 'light', refs: [], verify: 'true', stage: 'executing' },
  });

  const { passed, message } = checkById('work-stage-vocabulary').check(dir);
  assert.equal(passed, true, message);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('work-stage-vocabulary fails and names an OPEN item sitting at a stage its domain retired', () => {
  const dir = initRepo('checks-stage-vocab-retired-');
  const fgosDir = path.join(dir, '.fgos');
  const logPath = path.join(fgosDir, 'events.jsonl');
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'stranded', title: 'stranded', kind: 'feature', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', stage: 'clarify' },
  });

  const { passed, message } = checkById('work-stage-vocabulary').check(dir);
  assert.equal(passed, false);
  assert.match(message, /stranded/);
  assert.match(message, /stage: "clarify"/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("work-stage-vocabulary judges each item against its OWN domain's stages, not the default domain's", () => {
  const dir = initRepo('checks-stage-vocab-domain-');
  const fgosDir = path.join(dir, '.fgos');
  const logPath = path.join(fgosDir, 'events.jsonl');
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'triaged', title: 'triaged', kind: 'feature', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', stage: 'triage', domain: 'triage' },
  });
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'miscoded', title: 'miscoded', kind: 'feature', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', stage: 'triage' },
  });

  const { passed, message } = checkById('work-stage-vocabulary').check(dir);
  assert.equal(passed, false);
  assert.match(message, /miscoded/);
  assert.doesNotMatch(message, /triaged/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('work-stage-vocabulary passes despite a retired stage on an already-resolved (done) item', () => {
  const dir = initRepo('checks-stage-vocab-resolved-');
  const fgosDir = path.join(dir, '.fgos');
  const logPath = path.join(fgosDir, 'events.jsonl');
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'old-done', title: 'old-done', kind: 'feature', status: 'done', deps: [], risk: 'light', refs: [], verify: 'true', stage: 'clarify' },
  });

  const { passed, message } = checkById('work-stage-vocabulary').check(dir);
  assert.equal(passed, true, message);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('work-stage-vocabulary lists every violating id, not just the first', () => {
  const dir = initRepo('checks-stage-vocab-multi-');
  const fgosDir = path.join(dir, '.fgos');
  const logPath = path.join(fgosDir, 'events.jsonl');
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'bad-one', title: 'bad-one', kind: 'feature', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', stage: 'clarify' },
  });
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'bad-two', title: 'bad-two', kind: 'feature', status: 'awaiting-human', deps: [], risk: 'light', refs: [], verify: 'true', stage: 'clarify' },
  });

  const { passed, message } = checkById('work-stage-vocabulary').check(dir);
  assert.equal(passed, false);
  assert.match(message, /bad-one/);
  assert.match(message, /bad-two/);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ─── domain-workflow-skillmap-coverage (tsk-ogx) ───────────────────────────
// The registry-shape sibling of work-classification-vocabulary/
// work-stage-vocabulary above: those two catch a work ITEM drifting from
// its domain's own declared vocabulary; this one catches the domain's own
// DECLARATION drifting internally -- a stage name reachable through a
// domain's registered workflow(s) with no entry at all in that domain's
// own `skillMap` (an explicit `null` is a deliberate "no skill for this
// stage" answer and must not be flagged).
//
// Pure registry check -- no cwd/on-disk state, no fixture repo needed. The
// real `DOMAINS` registry is `Object.freeze`d and can never carry a
// deliberately-broken fixture, so `findDomainWorkflowSkillMapGaps` accepts
// an optional `domains` map (default: the real `DOMAINS`) purely so the
// fail branch is testable with a synthetic domain -- production wiring
// (`registerCheck` in registrations.mjs) always calls it zero-arg, against
// the real registry.

test('domain-workflow-skillmap-coverage passes against the real DOMAINS registry', () => {
  const { passed, message } = checkById('domain-workflow-skillmap-coverage').check();
  assert.equal(passed, true, message);
  assert.match(message, /resolves to a real skillMap entry/);
});

test('findDomainWorkflowSkillMapGaps passes a domain with no workflows field, checked against its own stages', () => {
  const domains = {
    fixture: {
      stages: ['alpha', 'beta'],
      skillMap: { alpha: 'some-skill', beta: null },
    },
  };
  assert.deepEqual(findDomainWorkflowSkillMapGaps(domains), []);
});

test('findDomainWorkflowSkillMapGaps names a stage missing from skillMap entirely, distinct from an explicit null', () => {
  const domains = {
    fixture: {
      stages: ['alpha', 'beta'],
      skillMap: { alpha: null }, // beta missing entirely -- explicit null on alpha is fine
    },
  };
  assert.deepEqual(findDomainWorkflowSkillMapGaps(domains), ['fixture.beta']);
});

test('findDomainWorkflowSkillMapGaps walks every stage across every registered workflow, not just domain.stages', () => {
  const domains = {
    fixture: {
      stages: ['alpha'], // the domain-level default -- workflows below add a second, real workflow
      workflows: {
        feature: { stages: ['alpha'] },
        bugfix: { stages: ['alpha', 'gamma'] },
      },
      skillMap: { alpha: 'some-skill' }, // gamma missing
    },
  };
  assert.deepEqual(findDomainWorkflowSkillMapGaps(domains), ['fixture.gamma']);
});

test('findDomainWorkflowSkillMapGaps skips a domain with no skillMap at all', () => {
  const domains = { fixture: { stages: ['alpha'] } };
  assert.deepEqual(findDomainWorkflowSkillMapGaps(domains), []);
});

test('findDomainWorkflowSkillMapGaps lists every violating domain.stage, not just the first', () => {
  const domains = {
    one: { stages: ['a', 'b'], skillMap: { a: null } },
    two: { stages: ['c'], skillMap: {} },
  };
  const gaps = findDomainWorkflowSkillMapGaps(domains);
  assert.deepEqual(gaps.sort(), ['one.b', 'two.c']);
});

test('dependencies-installed passes when package.json has no dependencies field (pre-tsk-slq behavior)', () => {
  const tmp = mkTemp('fgos-deps-check-');
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: 'x' }));
  const { passed, message } = checkById('dependencies-installed').check(tmp);
  assert.equal(passed, true);
  assert.match(message, /no runtime dependencies declared/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('dependencies-installed fails when a declared dependency is missing from node_modules', () => {
  const tmp = mkTemp('fgos-deps-check-');
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: 'x', dependencies: { yaml: '^2.9.0' } }));
  const { passed, message } = checkById('dependencies-installed').check(tmp);
  assert.equal(passed, false);
  assert.match(message, /missing from node_modules: yaml/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('dependencies-installed passes when every declared dependency is present in node_modules', () => {
  const tmp = mkTemp('fgos-deps-check-');
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: 'x', dependencies: { yaml: '^2.9.0' } }));
  fs.mkdirSync(path.join(tmp, 'node_modules', 'yaml'), { recursive: true });
  const { passed, message } = checkById('dependencies-installed').check(tmp);
  assert.equal(passed, true);
  assert.match(message, /1 dependency installed/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

// ─── changelog-unreleased-stale (tsk-3ip, docs/history/ ────────────────────
// automated-changelog-compound-learn/DISCUSSION.md §6.1/§6.4): observe/
// remind only, never blocks merge. Three required branches per the item's
// own acceptance criteria: no CHANGELOG.md (normal, not an error); file
// present with a pending Unreleased entry; file present with Unreleased
// still empty.

test('changelog-unreleased-stale passes when CHANGELOG.md does not exist', () => {
  const tmp = mkTemp('fgos-changelog-check-');
  const { passed, message } = checkById('changelog-unreleased-stale').check(tmp);
  assert.equal(passed, true);
  assert.match(message, /not found/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('changelog-unreleased-stale fails when CHANGELOG.md exists but ## [Unreleased] has no pending entries', () => {
  const tmp = mkTemp('fgos-changelog-check-');
  fs.writeFileSync(
    path.join(tmp, 'CHANGELOG.md'),
    '# Changelog\n\n## [Unreleased]\n\n### Added\n\n### Changed\n\n### Fixed\n\n### Removed\n\n## [0.1.0]\n\n### Added\n\n- baseline\n',
  );
  const { passed, message } = checkById('changelog-unreleased-stale').check(tmp);
  assert.equal(passed, false);
  assert.match(message, /no pending entries/);
  assert.match(message, /never blocks merge/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('changelog-unreleased-stale passes when ## [Unreleased] has a pending entry', () => {
  const tmp = mkTemp('fgos-changelog-check-');
  fs.writeFileSync(
    path.join(tmp, 'CHANGELOG.md'),
    '# Changelog\n\n## [Unreleased]\n\n### Added\n\n- new thing\n\n### Changed\n\n### Fixed\n\n### Removed\n\n## [0.1.0]\n\n### Added\n\n- baseline\n',
  );
  const { passed, message } = checkById('changelog-unreleased-stale').check(tmp);
  assert.equal(passed, true);
  assert.match(message, /pending entr/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('enduser-docs-index-stale passes when docs/enduser-docs-index.json does not exist yet', () => {
  const tmp = mkTemp('fgos-enduser-index-check-');
  writeEnduserDoc(tmp, 'how-to', 'sample.md', 'Sample Doc');
  const { passed, message } = checkById('enduser-docs-index-stale').check(tmp);
  assert.equal(passed, true);
  assert.match(message, /not found/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('enduser-docs-index-stale fails and reports a count (not a path list) when a doc on disk is missing from the index', () => {
  const tmp = mkTemp('fgos-enduser-index-check-');
  writeEnduserDoc(tmp, 'how-to', 'sample.md', 'Sample Doc');
  writeEnduserDoc(tmp, 'how-to', 'second.md', 'Second Doc');
  writeEnduserManifest(tmp, [
    { quadrant: 'how-to', purpose: 'x', audience: 'y', docPath: 'docs/how-to/sample.md', title: 'Sample Doc', sourceCaptureId: null },
  ]);
  const { passed, message } = checkById('enduser-docs-index-stale').check(tmp);
  assert.equal(passed, false);
  assert.match(message, /1\/2/);
  assert.doesNotMatch(message, /second\.md/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('enduser-docs-index-stale passes when the index already covers every on-disk doc', () => {
  const tmp = mkTemp('fgos-enduser-index-check-');
  writeEnduserDoc(tmp, 'how-to', 'sample.md', 'Sample Doc');
  writeEnduserManifest(tmp, [
    { quadrant: 'how-to', purpose: 'x', audience: 'y', docPath: 'docs/how-to/sample.md', title: 'Sample Doc', sourceCaptureId: null },
  ]);
  const { passed, message } = checkById('enduser-docs-index-stale').check(tmp);
  assert.equal(passed, true);
  assert.match(message, /1\/1/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('enduser-docs-index-stale fails and reports orphan count when an index entry has no matching doc on disk', () => {
  const tmp = mkTemp('fgos-enduser-index-check-');
  writeEnduserDoc(tmp, 'how-to', 'sample.md', 'Sample Doc');
  writeEnduserManifest(tmp, [
    { quadrant: 'how-to', purpose: 'x', audience: 'y', docPath: 'docs/how-to/sample.md', title: 'Sample Doc', sourceCaptureId: null },
    { quadrant: 'how-to', purpose: 'x', audience: 'y', docPath: 'docs/how-to/deleted.md', title: 'Deleted Doc', sourceCaptureId: null },
  ]);
  const { passed, message } = checkById('enduser-docs-index-stale').check(tmp);
  assert.equal(passed, false);
  assert.match(message, /1 tài liệu dư thừa/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('enduser-docs-index-stale counts a doc under docs/decisions toward the explanation quadrant (alias, D6)', () => {
  const tmp = mkTemp('fgos-enduser-index-check-');
  writeEnduserDoc(tmp, 'decisions', '0001-example.md', 'Example Decision');
  writeEnduserManifest(tmp, []);
  const { passed, message } = checkById('enduser-docs-index-stale').check(tmp);
  assert.equal(passed, false);
  assert.match(message, /1\/1/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('enduser-docs-index-stale fix regenerates the index via the same path fgos docs-index uses, resolving the drift', () => {
  const tmp = mkTemp('fgos-enduser-index-fix-');
  writeEnduserDoc(tmp, 'how-to', 'sample.md', 'Sample Doc');
  writeEnduserManifest(tmp, []);
  assert.equal(checkById('enduser-docs-index-stale').check(tmp).passed, false);

  const { changed, message } = fixById('enduser-docs-index-stale').fix(tmp);
  assert.equal(changed, true);
  assert.match(message, /regenerated/);

  const after = checkById('enduser-docs-index-stale').check(tmp);
  assert.equal(after.passed, true);
  assert.match(after.message, /1\/1/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('enduser-docs-index-stale fix is idempotent -- a second run reports changed:false', () => {
  const tmp = mkTemp('fgos-enduser-index-fix-');
  writeEnduserDoc(tmp, 'how-to', 'sample.md', 'Sample Doc');
  fixById('enduser-docs-index-stale').fix(tmp);
  const second = fixById('enduser-docs-index-stale').fix(tmp);
  assert.equal(second.changed, false);
  assert.match(second.message, /already up to date/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('decision-index-stale passes when docs/decisions/index.md does not exist yet (tsk-1lv review-fix F10)', () => {
  const tmp = mkTemp('fgos-decision-index-check-');
  const fgosDir = path.join(tmp, '.fgos');
  initStore(fgosDir);
  const { passed, message } = checkById('decision-index-stale').check(tmp);
  assert.equal(passed, true);
  assert.match(message, /not found/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('decision-index-stale fails when state.decisions has a scope-carrying decision the on-disk index does not reflect', () => {
  const tmp = mkTemp('fgos-decision-index-check-');
  const fgosDir = path.join(tmp, '.fgos');
  initStore(fgosDir);
  fs.mkdirSync(path.join(tmp, 'docs', 'decisions'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'docs', 'decisions', 'index.md'), '# Decisions index\n\n_No platform/repo-wide decisions recorded yet._\n');
  addDecision(fgosDir, { text: 'D-ADR9999: example', rationale: 'r', scope: 'example-area', relation: 'none' });

  const { passed, message } = checkById('decision-index-stale').check(tmp);
  assert.equal(passed, false);
  assert.match(message, /stale/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('decision-index-stale passes when the on-disk index already matches state.decisions', () => {
  const tmp = mkTemp('fgos-decision-index-check-');
  const fgosDir = path.join(tmp, '.fgos');
  initStore(fgosDir);
  addDecision(fgosDir, { text: 'D-ADR9999: example', rationale: 'r', scope: 'example-area', relation: 'none' });
  fixById('decision-index-stale').fix(tmp);

  const { passed, message } = checkById('decision-index-stale').check(tmp);
  assert.equal(passed, true);
  assert.match(message, /up to date/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('decision-index-stale fix regenerates the index via the same path fgos decision-index uses, resolving the drift', () => {
  const tmp = mkTemp('fgos-decision-index-fix-');
  const fgosDir = path.join(tmp, '.fgos');
  initStore(fgosDir);
  fs.mkdirSync(path.join(tmp, 'docs', 'decisions'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'docs', 'decisions', 'index.md'), '# Decisions index\n\n_No platform/repo-wide decisions recorded yet._\n');
  addDecision(fgosDir, { text: 'D-ADR9999: example', rationale: 'r', scope: 'example-area', relation: 'none' });
  assert.equal(checkById('decision-index-stale').check(tmp).passed, false);

  const { changed, message } = fixById('decision-index-stale').fix(tmp);
  assert.equal(changed, true);
  assert.match(message, /regenerated/);

  const after = checkById('decision-index-stale').check(tmp);
  assert.equal(after.passed, true);
  const indexContent = fs.readFileSync(path.join(tmp, 'docs', 'decisions', 'index.md'), 'utf8');
  assert.match(indexContent, /D-ADR9999: example/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('decision-index-stale fix is idempotent -- a second run reports changed:false', () => {
  const tmp = mkTemp('fgos-decision-index-fix-');
  const fgosDir = path.join(tmp, '.fgos');
  initStore(fgosDir);
  addDecision(fgosDir, { text: 'D-ADR9999: example', rationale: 'r', scope: 'example-area', relation: 'none' });
  fixById('decision-index-stale').fix(tmp);
  const second = fixById('decision-index-stale').fix(tmp);
  assert.equal(second.changed, false);
  assert.match(second.message, /already up to date/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('decision-index-stale check FAILS when the index is missing but state.decisions has real rows to index -- H2 tsk-1lv round-2 regression (a missing index with real decisions to project is drift, not "nothing to check")', () => {
  const tmp = mkTemp('fgos-decision-index-check-');
  const fgosDir = path.join(tmp, '.fgos');
  initStore(fgosDir);
  addDecision(fgosDir, { text: 'D-ADR9999: example', rationale: 'r', scope: 'example-area', relation: 'none' });

  const { passed, message } = checkById('decision-index-stale').check(tmp);
  assert.equal(passed, false);
  assert.match(message, /not found/);
  assert.doesNotMatch(message, /nothing to check/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('decision-index-stale fix reports a graceful skip (changed:false, no throw) when generateDecisionIndex refuses to blank an existing populated index -- B3 tsk-1lv round-2 regression (a thrown StoreError here used to abort fgos doctor --fix entirely, discarding every other fix\'s result)', () => {
  const tmp = mkTemp('fgos-decision-index-fix-');
  const populatedFgosDir = path.join(tmp, '.fgos');
  initStore(populatedFgosDir);
  addDecision(populatedFgosDir, { text: 'D-ADR9999: example', rationale: 'r', scope: 'example-area', relation: 'none' });
  fixById('decision-index-stale').fix(tmp);
  const before = fs.readFileSync(path.join(tmp, 'docs', 'decisions', 'index.md'), 'utf8');

  // Simulate the real-world trigger: the .fgos store this check/fix pair
  // reads from is unreadable/empty relative to an already-populated
  // on-disk index -- exactly what a fresh clone or a worktree missing
  // .fgos/ (ADR0020) looks like once this branch's own committed index.md
  // lands.
  fs.rmSync(populatedFgosDir, { recursive: true, force: true });

  let result;
  assert.doesNotThrow(() => {
    result = fixById('decision-index-stale').fix(tmp);
  });
  assert.equal(result.changed, false);
  assert.match(result.message, /skipped/);

  const after = fs.readFileSync(path.join(tmp, 'docs', 'decisions', 'index.md'), 'utf8');
  assert.equal(after, before, 'the real index must survive the refused fix untouched');
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('fgos check (CLI e2e) reports changelogNag and appends a checkpoint to changelog-nag-history.jsonl', () => {
  const cwd = mkTemp('fgos-changelog-nag-cli-');
  execFileSync('git', ['init', '-q'], { cwd, encoding: 'utf8' });
  const fgosDir = path.join(cwd, '.fgos');
  initStore(fgosDir);
  addWork(fgosDir, { id: 'delivered-item', title: 'delivered', kind: 'feature', risk: 'light', verify: 'true', status: 'delivered', deps: [], refs: [] });
  fs.writeFileSync(
    path.join(cwd, 'CHANGELOG.md'),
    '# Changelog\n\n## [Unreleased]\n\n### Added\n\n### Changed\n\n### Fixed\n\n### Removed\n\n## [0.1.0]\n\n### Added\n\n- baseline\n',
  );

  const result = spawnSync(process.execPath, [FGOS, 'check'], { cwd, encoding: 'utf8', env: NO_CLAUDE_ENV });
  assert.equal(result.status, 0, `fgos check failed: ${result.stderr}`);
  const { data } = JSON.parse(result.stdout);
  assert.deepEqual(data.changelogNag, { fileExists: true, hasEntries: false, deliveredCount: 1 });

  const historyLines = fs
    .readFileSync(path.join(fgosDir, 'changelog-nag-history.jsonl'), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  assert.equal(historyLines.length, 1);
  assert.equal(historyLines[0].hasEntries, false);
  assert.equal(historyLines[0].deliveredCount, 1);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// tsk-in1-1 D1: a tool provider is declared directly in
// `runner.executors.<id>` (`.fgos/config.json`), config-edited like every
// other executor, never through a `fgos tool register` event.
function declareExecutor(cwd, id, fields) {
  const configPath = path.join(cwd, '.fgos', 'config.json');
  const cfg = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  cfg.runner ??= {};
  cfg.runner.executors ??= {};
  cfg.runner.executors[id] = fields;
  // tsk-45f D11 (tsk-34n retired the "capability" singular fallback --
  // "for" is the only field read now): "for" is catalog-validated against
  // cfg.runner.capabilities -- declare each entry here so this raw fixture
  // writer keeps producing a loadable config, same as a real executor
  // would need.
  if (Array.isArray(fields.for)) {
    cfg.runner.capabilities ??= {};
    for (const purpose of fields.for) {
      cfg.runner.capabilities[purpose] ??= {};
    }
  }
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
}

test('tool-registry-configured passes when no tool-capable executor is declared at all (inactive — a clean skip, never a failure)', () => {
  const cwd = mkTemp('fgos-tool-registry-inactive-');
  execFileSync('git', ['init', '-q'], { cwd });
  spawnSync(process.execPath, [FGOS, 'init'], { cwd, encoding: 'utf8' });
  const { passed, message } = checkById('tool-registry-configured').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /^inactive/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('tool-registry-configured passes when every declared tool is checked present (full)', () => {
  const cwd = mkTemp('fgos-tool-registry-full-');
  execFileSync('git', ['init', '-q'], { cwd });
  spawnSync(process.execPath, [FGOS, 'init'], { cwd, encoding: 'utf8' });
  declareExecutor(cwd, 'echo-tool', { kind: 'tool', for: ['test-capability'], invocations: [{ via: 'cli', command: 'echo', args: [] }] });
  const check = spawnSync(process.execPath, [FGOS, 'tool', 'check'], { cwd, encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr);
  const { passed, message } = checkById('tool-registry-configured').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /^full/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('tsk-3oa2: tool-registry-configured FAILS when a declared tool is missing or never checked (degraded) -- no longer a silent passed:true', () => {
  const cwd = mkTemp('fgos-tool-registry-degraded-');
  execFileSync('git', ['init', '-q'], { cwd });
  spawnSync(process.execPath, [FGOS, 'init'], { cwd, encoding: 'utf8' });
  declareExecutor(cwd, 'never-checked-tool', { kind: 'tool', for: ['test-capability'], invocations: [{ via: 'cli', command: 'echo', args: [] }] });
  // Deliberately never runs `fgos tool check` -- the tool stays "unknown",
  // which classifyRegistryPosture reports as degraded (never inactive).
  const { passed, message } = checkById('tool-registry-configured').check(cwd);
  assert.equal(passed, false, 'a declared-but-unverified tool must fail the check, not silently pass as before this fix');
  assert.match(message, /^degraded/);
  assert.match(message, /fgos tool check/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('node-version-and-git passes under the current process (real Node, real git)', () => {
  const { passed, message } = checkById('node-version-and-git').check(process.cwd());
  assert.equal(passed, true);
  assert.equal(typeof message, 'string');
});

test('shell-integration-sourced passes trivially when no rc files exist', () => {
  const homeDir = mkTemp('doctor-shell-none-');
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const { passed } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, true);
  } finally {
    process.env.HOME = prevHome;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('shell-integration-sourced fails when a detected rc file is missing the source line', () => {
  const homeDir = mkTemp('doctor-shell-missing-');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), 'echo hi\n');
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, false);
    assert.ok(message.includes('.bashrc'));
  } finally {
    process.env.HOME = prevHome;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('shell-integration-sourced passes when every detected rc file already has the source line, and the sourced function actually works', () => {
  const homeDir = mkTemp('doctor-shell-present-');
  const rcFile = path.join(homeDir, '.bashrc');
  fs.writeFileSync(rcFile, `source "${integrationScriptPath()}"\n`);
  // A disposable fixture with no underscore-prefixed dependency, probed
  // instead of this repo's own real (possibly still-buggy) script -- see
  // FGOS_SHELL_INTEGRATION_PROBE_SCRIPT's own doc comment in
  // registrations.mjs. `hasSourceLine`'s own text check above still reads
  // the real integrationScriptPath() -- only the real-invocation probe is
  // redirected, so this test still proves the file-text half of the check
  // against the real path while proving the invocation half against a
  // known-good fixture.
  const safeFixture = path.join(homeDir, 'safe-fgos.sh');
  fs.writeFileSync(safeFixture, 'fgos() {\n  echo "safe fgos $@"\n}\n');
  const prevHome = process.env.HOME;
  const prevProbe = process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
  process.env.HOME = homeDir;
  process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = safeFixture;
  try {
    const { passed } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, true);
  } finally {
    process.env.HOME = prevHome;
    if (prevProbe === undefined) delete process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
    else process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = prevProbe;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('shell-integration-sourced fails when the source line is present but the sourced function itself is dead (tsk-2wpi: a text-present source line is not proof the command works)', () => {
  const homeDir = mkTemp('doctor-shell-broken-fn-');
  const rcFile = path.join(homeDir, '.bashrc');
  fs.writeFileSync(rcFile, `source "${integrationScriptPath()}"\n`);
  // Mirrors the real pre-fix scripts/fgos-shell-integration.sh shape: a
  // public function whose second line calls a private, underscore-prefixed
  // helper -- exactly the dependency a harness shell-function snapshot can
  // drop.
  const fragileFixture = path.join(homeDir, 'fragile-fgos.sh');
  fs.writeFileSync(
    fragileFixture,
    '_fgos_helper() {\n  echo resolved\n}\n\nfgos() {\n  _fgos_helper >/dev/null || return 1\n  echo "fgos $@"\n}\n',
  );
  const prevHome = process.env.HOME;
  const prevProbe = process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
  process.env.HOME = homeDir;
  process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = fragileFixture;
  try {
    const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, false);
    assert.match(message, /fgos --help.*fails/);
    assert.match(message, /_fgos_helper/);
  } finally {
    process.env.HOME = prevHome;
    if (prevProbe === undefined) delete process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
    else process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = prevProbe;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('config-not-stale reports failed/not-configured when the shared file is absent', () => {
  const cwd = mkTemp('doctor-config-absent-');
  const { passed, message } = checkById('config-not-stale').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /not yet configured/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('config-not-stale passes when the existing config already has every default key', () => {
  const cwd = mkTemp('doctor-config-full-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.fgos', 'config.json'),
    JSON.stringify({
      runner: {
        ...DEFAULT_RUNNER_CONFIG,
        capabilities: DEFAULT_CAPABILITY_SLOTS,
        modelPolicies: { ...DEFAULT_RUNNER_CONFIG.modelPolicies, 'openai-codex': { lightweight: 'gpt-5.5' } },
        executors: { pi: PI_EXECUTOR_DEFAULT },
      },
      gateBypass: { level: 'off' },
      cleanup: { ttlDays: DEFAULT_CLEANUP_TTL_DAYS, leafTtlDays: DEFAULT_CLEANUP_LEAF_TTL_DAYS },
      herdrOrchestrator: DEFAULT_HERDR_ORCHESTRATOR_SETTINGS,
      herdrWebDashboard: DEFAULT_HERDR_WEB_DASHBOARD_SETTINGS,
      invariantChecks: { commands: DEFAULT_INVARIANT_CHECK_COMMANDS },
      workerSlots: { ceiling: null },
      gateway: { port: 4170, token: null },
      ironLaw: { level: DEFAULT_IRON_LAW_LEVEL },
      checkpoint: { eventThreshold: DEFAULT_CHECKPOINT_EVENT_THRESHOLD },
    }),
  );
  const { passed } = checkById('config-not-stale').check(cwd);
  assert.equal(passed, true);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('config-not-stale fails when the shared file is complete except gateBypass', () => {
  const cwd = mkTemp('doctor-config-no-gatebypass-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ runner: DEFAULT_RUNNER_CONFIG }));
  const { passed, message } = checkById('config-not-stale').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /gateBypass/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('config-not-stale fails when the existing config is missing a default key', () => {
  const cwd = mkTemp('doctor-config-stale-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ runner: { executor: { command: 'claude', args: [] } } }));
  const { passed, message } = checkById('config-not-stale').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /stale config/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ─── gate-bypass-configured (docs/history/doctor-fix-gate-bypass/CONTEXT.md
// D1/D3, tsk-2qz-2): the registry's first entry to register all three
// capabilities (check + configDefault + fix). check/fix here are both
// keyed to "is config.gateBypass.level present and a recognized LEVEL",
// deliberately distinct from config-not-stale's generic "key present at
// all" scan above (a malformed-but-present level is never "missing").

// ─── invariant-checks-configured (docs/history/tsk-516-approve-reverify-
// scope/CONTEXT.md D6): same check+configDefault registry shape as
// gate-bypass below. The check deliberately never EXECUTES the configured
// commands — they are arbitrary project-supplied shell strings, and doctor
// is a cheap, side-effect-free diagnosis — so what it can and does answer is
// the misconfiguration that actually bites: a present-but-unusable section
// reads as zero commands at return/merge, silently disabling the gate while
// looking configured.

test('invariant-checks-configured fails when the section is missing entirely', () => {
  const cwd = mkTemp('doctor-invariant-absent-');
  const { passed, message } = checkById('invariant-checks-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /invariantChecks section missing/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('invariant-checks-configured fails when the section is present but yields no runnable command', () => {
  for (const malformed of [{ commands: [] }, { commands: 'not-a-list' }, {}, { commands: ['', '  '] }]) {
    const cwd = mkTemp('doctor-invariant-malformed-');
    fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
    fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ invariantChecks: malformed }));
    const { passed, message } = checkById('invariant-checks-configured').check(cwd);
    assert.equal(passed, false, `malformed: ${JSON.stringify(malformed)}`);
    assert.match(message, /present but yields no runnable command/);
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('invariant-checks-configured passes and names the configured commands', () => {
  const cwd = mkTemp('doctor-invariant-ok-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.fgos', 'config.json'),
    JSON.stringify({ invariantChecks: { commands: ['node --test test/architecture.test.mjs'] } }),
  );
  const { passed, message } = checkById('invariant-checks-configured').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /1 command\(s\)/);
  assert.match(message, /node --test test\/architecture\.test\.mjs/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('worker-slots-ceiling-usable fails when the section is missing entirely', () => {
  const cwd = mkTemp('doctor-slots-absent-');
  const { passed, message } = checkById('worker-slots-ceiling-usable').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /workerSlots section missing/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// The whole point of the check: each of these silently enforces NOTHING,
// because hasWorkerSlotRoom treats anything that is not a positive integer
// as "no ceiling configured" and allows every claim. A project reading its
// own config would believe it is capped.
test('worker-slots-ceiling-usable fails on a ceiling that silently enforces nothing', () => {
  for (const ceiling of ['8', 8.5, 0, -1, true, []]) {
    const cwd = mkTemp('doctor-slots-malformed-');
    fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
    fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ workerSlots: { ceiling } }));
    const { passed, message } = checkById('worker-slots-ceiling-usable').check(cwd);
    assert.equal(passed, false, `malformed ceiling: ${JSON.stringify(ceiling)}`);
    assert.match(message, /enforces NOTHING/);
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

// `null` is the one non-number that is not a mistake -- it is exactly what
// `fgos setup` writes, and it means "deliberately unarmed", so it must pass
// while still saying plainly that nothing is being enforced.
test('worker-slots-ceiling-usable passes on the unarmed null fgos setup writes, and says so', () => {
  const cwd = mkTemp('doctor-slots-unarmed-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ workerSlots: { ceiling: null } }));
  const { passed, message } = checkById('worker-slots-ceiling-usable').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /unarmed/);
  assert.match(message, new RegExp(`recommended: ${DEFAULT_WORKER_SLOT_CEILING}`));
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('worker-slots-ceiling-usable passes and names a real armed ceiling', () => {
  const cwd = mkTemp('doctor-slots-armed-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ workerSlots: { ceiling: 6 } }));
  const { passed, message } = checkById('worker-slots-ceiling-usable').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /workerSlots\.ceiling = 6/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ─── advise-execute-capabilities-configured (tsk-2uf-3, docs/history/
// dispatch-activation-and-handoff-redesign/CONTEXT.md D2): same
// generic-scan/dedicated-check split as gateway/workerSlots/invariantChecks
// above -- config-not-stale already catches runner.capabilities (or either
// slot) being wholly ABSENT; this check catches present-but-malformed.

test('advise-execute-capabilities-configured fails when runner.capabilities is missing entirely', () => {
  const cwd = mkTemp('doctor-capabilities-absent-');
  const { passed, message } = checkById('advise-execute-capabilities-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /runner\.capabilities section missing/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('advise-execute-capabilities-configured fails when a slot is missing or malformed', () => {
  for (const capabilities of [
    { advise: {} }, // execute missing
    { execute: {} }, // advise missing
    { advise: 'not-an-object', execute: {} },
    { advise: [], execute: {} },
    { advise: null, execute: {} },
    {},
  ]) {
    const cwd = mkTemp('doctor-capabilities-malformed-');
    fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
    fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ runner: { capabilities } }));
    const { passed, message } = checkById('advise-execute-capabilities-configured').check(cwd);
    assert.equal(passed, false, `capabilities: ${JSON.stringify(capabilities)}`);
    assert.match(message, /missing or has a malformed slot for/);
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('advise-execute-capabilities-configured passes when both slots are declared', () => {
  const cwd = mkTemp('doctor-capabilities-ok-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.fgos', 'config.json'),
    JSON.stringify({ runner: { capabilities: DEFAULT_CAPABILITY_SLOTS } }),
  );
  const { passed, message } = checkById('advise-execute-capabilities-configured').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /declares both "advise" and "execute"/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('gate-bypass-configured check fails when the shared file has no gateBypass key at all', () => {
  const cwd = mkTemp('doctor-gatebypass-absent-');
  const { passed, message } = checkById('gate-bypass-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /missing or not a recognized level/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('gate-bypass-configured check fails when gateBypass.level is present but not a recognized level', () => {
  const cwd = mkTemp('doctor-gatebypass-bad-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ gateBypass: { level: 'total' } }));
  const { passed, message } = checkById('gate-bypass-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /missing or not a recognized level/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('gate-bypass-configured check passes when gateBypass.level is a recognized level', () => {
  const cwd = mkTemp('doctor-gatebypass-ok-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ gateBypass: { level: 'standard' } }));
  const { passed, message } = checkById('gate-bypass-configured').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /"standard"/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('gate-bypass-configured fix writes a default level when the shared file has no gateBypass key, preserving other keys', () => {
  const cwd = mkTemp('doctor-gatebypass-fix-absent-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ runner: { timeoutMs: 5000 } }));
  const { changed, message } = fixById('gate-bypass-configured').fix(cwd);
  assert.equal(changed, true);
  assert.match(message, new RegExp(`"${DEFAULT_LEVEL}"`));
  const written = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'config.json'), 'utf8'));
  assert.deepEqual(written.gateBypass, { level: DEFAULT_LEVEL });
  assert.deepEqual(written.runner, { timeoutMs: 5000 });
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('gate-bypass-configured fix repairs a malformed level back to the default', () => {
  const cwd = mkTemp('doctor-gatebypass-fix-bad-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ gateBypass: { level: 'total' } }));
  const { changed } = fixById('gate-bypass-configured').fix(cwd);
  assert.equal(changed, true);
  const written = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'config.json'), 'utf8'));
  assert.equal(written.gateBypass.level, DEFAULT_LEVEL);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('gate-bypass-configured fix is idempotent: reports unchanged and never rewrites when level is already valid', () => {
  const cwd = mkTemp('doctor-gatebypass-fix-noop-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  const sharedPath = path.join(cwd, '.fgos', 'config.json');
  fs.writeFileSync(sharedPath, JSON.stringify({ gateBypass: { level: 'heavy' } }));
  const before = fs.statSync(sharedPath).mtimeMs;
  const { changed, message } = fixById('gate-bypass-configured').fix(cwd);
  assert.equal(changed, false);
  assert.match(message, /already "heavy"/);
  assert.equal(fs.statSync(sharedPath).mtimeMs, before);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('fgos doctor --fix (CLI e2e) actually bootstraps gateBypass.level via the real fix', () => {
  const cwd = mkTemp('doctor-cli-fix-gatebypass-');
  execFileSync('git', ['init', '-q'], { cwd, encoding: 'utf8' });
  const result = spawnSync(process.execPath, [FGOS, 'doctor', '--fix'], { cwd, encoding: 'utf8', env: NO_CLAUDE_ENV });
  assert.equal(result.status, 0, `fgos doctor --fix failed: ${result.stderr}`);
  const { data } = JSON.parse(result.stdout);
  const fixedEntry = data.fixed.find((f) => f.id === 'gate-bypass-configured');
  assert.ok(fixedEntry, 'doctor --fix did not report the gate-bypass-configured fix');
  assert.equal(fixedEntry.changed, true);
  const written = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'config.json'), 'utf8'));
  assert.equal(written.gateBypass.level, DEFAULT_LEVEL);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// docs/history/doctor-fix-pretty-status-line/CONTEXT.md D1: a registered
// fix's own contract (register-a-fixable-doctor-check-in-fgos.md step 2)
// has no failing outcome -- `changed: false` means "already correct", not
// "broken". `renderPretty`'s doctor `fixed` lines must render green
// regardless of `changed`, never key that color off `changed` the way a
// `checks` line keys it off `passed`.
test('fgos doctor --fix --pretty (CLI e2e) renders a fix line green even when the fix found nothing to change', () => {
  const cwd = mkTemp('doctor-cli-fix-pretty-noop-');
  execFileSync('git', ['init', '-q'], { cwd, encoding: 'utf8' });
  const first = spawnSync(process.execPath, [FGOS, 'doctor', '--fix'], { cwd, encoding: 'utf8', env: NO_CLAUDE_ENV });
  assert.equal(first.status, 0, `fgos doctor --fix failed: ${first.stderr}`);

  const second = spawnSync(process.execPath, [FGOS, 'doctor', '--fix', '--pretty'], { cwd, encoding: 'utf8', env: NO_CLAUDE_ENV });
  assert.equal(second.status, 0, `fgos doctor --fix --pretty failed: ${second.stderr}`);
  const lines = second.stdout.split('\n');
  const fixLine = lines.find((l) => l.includes('fix: gate-bypass-configured'));
  assert.ok(fixLine, 'expected a "fix: gate-bypass-configured" line in --pretty output');
  assert.match(fixLine, /already "/, 'expected the second run to be the already-correct no-op case');
  assert.ok(fixLine.includes('\x1b[32m'), `expected a green mark on an already-correct fix line, got: ${fixLine}`);
  assert.ok(!fixLine.includes('\x1b[31m'), `expected no red mark on an already-correct fix line, got: ${fixLine}`);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ─── herdr-launcher-configured (tsk-2m5, docs/history/
// stage-status-driving-coordination/): the herdr-launcher's own
// auto-launch toggles. Check-only, no fix (YAGNI -- see registrations.mjs's
// own comment on this) -- `config-not-stale` already catches the whole
// section being MISSING; this check adds the one thing that generic
// staleness scan cannot: a PRESENT but non-boolean toggle value.

test('herdr-launcher-configured check fails when the shared file has no herdrOrchestrator key at all', () => {
  const cwd = mkTemp('doctor-herdr-launcher-absent-');
  const { passed, message } = checkById('herdr-launcher-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /missing/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('herdr-launcher-configured check fails when a toggle is present but not a boolean', () => {
  const cwd = mkTemp('doctor-herdr-launcher-bad-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.fgos', 'config.json'),
    JSON.stringify({ herdrOrchestrator: { autoDiscover: 'yes', autoMerge: false, autoRetro: false, autoCleanup: false } }),
  );
  const { passed, message } = checkById('herdr-launcher-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /autoDiscover/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('herdr-launcher-configured check passes when every toggle is a boolean', () => {
  const cwd = mkTemp('doctor-herdr-launcher-ok-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.fgos', 'config.json'),
    JSON.stringify({ herdrOrchestrator: { autoDiscover: true, autoMerge: false, autoRetro: false, autoCleanup: false } }),
  );
  const { passed, message } = checkById('herdr-launcher-configured').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /autoDiscover=true/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ─── herdr-web-dashboard-configured (tsk-48w, D14 of docs/history/herdr-
// web-dashboard-plan-realignment/CONTEXT.md): the web dashboard's static-
// serving toggle. Same check-only shape as herdr-launcher-configured
// above -- config-not-stale already catches the whole section missing;
// this check adds the one thing that generic staleness scan cannot: a
// PRESENT but non-boolean value.

test('herdr-web-dashboard-configured check fails when the shared file has no herdrWebDashboard key at all', () => {
  const cwd = mkTemp('doctor-herdr-web-dashboard-absent-');
  const { passed, message } = checkById('herdr-web-dashboard-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /missing/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('herdr-web-dashboard-configured check fails when staticServing is present but not a boolean', () => {
  const cwd = mkTemp('doctor-herdr-web-dashboard-bad-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.fgos', 'config.json'),
    JSON.stringify({ herdrWebDashboard: { staticServing: 'yes' } }),
  );
  const { passed, message } = checkById('herdr-web-dashboard-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /staticServing/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('herdr-web-dashboard-configured check passes when staticServing is a boolean', () => {
  const cwd = mkTemp('doctor-herdr-web-dashboard-ok-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.fgos', 'config.json'),
    JSON.stringify({ herdrWebDashboard: { staticServing: true } }),
  );
  const { passed, message } = checkById('herdr-web-dashboard-configured').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /staticServing=true/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('config-awareness is registered on DOCTOR_CHECKS and always passes', () => {
  const { passed, message } = checkById('config-awareness').check(process.cwd());
  assert.equal(passed, true);
  assert.equal(typeof message, 'string');
});

test('config-awareness reports "none" when neither project nor global config exists', () => {
  const homeDir = mkTemp('doctor-awareness-none-home-');
  const cwd = mkTemp('doctor-awareness-none-cwd-');
  withHome(homeDir, () => {
    const { passed, message } = checkById('config-awareness').check(cwd);
    assert.equal(passed, true);
    assert.match(message, /no config at either level/);
  });
  fs.rmSync(homeDir, { recursive: true, force: true });
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('config-awareness reports project active with global not present, when only project config exists', () => {
  const homeDir = mkTemp('doctor-awareness-project-only-home-');
  const cwd = mkTemp('doctor-awareness-project-only-cwd-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), '{}');
  withHome(homeDir, () => {
    const { passed, message } = checkById('config-awareness').check(cwd);
    assert.equal(passed, true);
    assert.match(message, /active: project/);
    assert.match(message, /global config not present/);
  });
  fs.rmSync(homeDir, { recursive: true, force: true });
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('config-awareness reports project active with global also present, when both exist', () => {
  const homeDir = mkTemp('doctor-awareness-both-home-');
  fs.mkdirSync(path.join(homeDir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(homeDir, '.fgos', 'config.json'), '{}');
  const cwd = mkTemp('doctor-awareness-both-cwd-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), '{}');
  withHome(homeDir, () => {
    const { passed, message } = checkById('config-awareness').check(cwd);
    assert.equal(passed, true);
    assert.match(message, /active: project/);
    assert.match(message, /global config also present/);
  });
  fs.rmSync(homeDir, { recursive: true, force: true });
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('config-awareness falls back to global active with project not present, when only global config exists', () => {
  const homeDir = mkTemp('doctor-awareness-global-only-home-');
  fs.mkdirSync(path.join(homeDir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(homeDir, '.fgos', 'config.json'), '{}');
  const cwd = mkTemp('doctor-awareness-global-only-cwd-');
  withHome(homeDir, () => {
    const { passed, message } = checkById('config-awareness').check(cwd);
    assert.equal(passed, true);
    assert.match(message, /active: global/);
    assert.match(message, /project config not present/);
  });
  fs.rmSync(homeDir, { recursive: true, force: true });
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ─── main-checkout-hook-wired (tsk-3w8): str65's main-checkout lock only ───
// guards commits when core.hooksPath actually points at .githooks — str88
// removed the automatic `prepare`-lifecycle wiring (pnpm 10+ blocks it for a
// git-hosted dependency), so this doctor check + fgos setup's own wiring
// (below) are the only paths left that keep it honest.

test('mainCheckoutHookWired is false in a cwd with no .git at all, and never throws', () => {
  const cwd = mkTemp('doctor-hook-no-git-');
  assert.equal(mainCheckoutHookWired(cwd), false);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('mainCheckoutHookWired is false in a real git repo whose core.hooksPath is unset', () => {
  const cwd = mkTemp('doctor-hook-unset-');
  execFileSync('git', ['init', '-q'], { cwd });
  assert.equal(mainCheckoutHookWired(cwd), false);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('mainCheckoutHookWired is false when core.hooksPath points somewhere other than .githooks', () => {
  const cwd = mkTemp('doctor-hook-other-');
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'core.hooksPath', 'some-other-dir'], { cwd });
  assert.equal(mainCheckoutHookWired(cwd), false);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('mainCheckoutHookWired is true once core.hooksPath is set to .githooks', () => {
  const cwd = mkTemp('doctor-hook-wired-');
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd });
  assert.equal(mainCheckoutHookWired(cwd), true);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('mainCheckoutHookWired is true when core.hooksPath is an absolute path resolving to repoRoot/.githooks', () => {
  const cwd = mkTemp('doctor-hook-absolute-');
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'core.hooksPath', path.join(cwd, '.githooks')], { cwd });
  assert.equal(mainCheckoutHookWired(cwd), true);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('mainCheckoutHookWired is true from inside a linked worktree when the main checkout has an absolute core.hooksPath, not just from the main checkout itself', () => {
  const mainCheckout = mkTemp('doctor-hook-absolute-worktree-main-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: mainCheckout });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: mainCheckout });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: mainCheckout });
  fs.writeFileSync(path.join(mainCheckout, 'file.txt'), 'x');
  execFileSync('git', ['add', 'file.txt'], { cwd: mainCheckout });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: mainCheckout });
  execFileSync('git', ['config', 'core.hooksPath', path.join(mainCheckout, '.githooks')], { cwd: mainCheckout });

  const worktreeDir = mkTemp('doctor-hook-absolute-worktree-linked-');
  fs.rmdirSync(worktreeDir);
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'wt-branch', worktreeDir], { cwd: mainCheckout });

  assert.equal(mainCheckoutHookWired(worktreeDir), true, 'must resolve against the main checkout root, not the worktree cwd it was called from');

  execFileSync('git', ['worktree', 'remove', '--force', worktreeDir], { cwd: mainCheckout });
  fs.rmSync(mainCheckout, { recursive: true, force: true });
});

test('main-checkout-hook-wired doctor check reports passed/failed matching mainCheckoutHookWired, with an actionable message', () => {
  const cwd = mkTemp('doctor-hook-check-');
  execFileSync('git', ['init', '-q'], { cwd });
  const before = checkById('main-checkout-hook-wired').check(cwd);
  assert.equal(before.passed, false);
  assert.match(before.message, /run fgos setup/);

  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd });
  const after = checkById('main-checkout-hook-wired').check(cwd);
  assert.equal(after.passed, true);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('fgos doctor (no flags) produces valid wrapEnvelope-shaped JSON on stdout', () => {
  const cwd = mkTemp('doctor-cli-json-');
  const homeDir = mkTemp('doctor-cli-json-home-');
  const result = spawnSync(process.execPath, [FGOS, 'doctor'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const envelope = JSON.parse(result.stdout);
  assert.equal(typeof envelope.contract, 'string');
  assert.ok(Array.isArray(envelope.data.checks));
  assert.equal(envelope.data.checks.length, DOCTOR_CHECKS.length);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos doctor --pretty prints colored ANSI text, not JSON', () => {
  const cwd = mkTemp('doctor-cli-pretty-');
  const homeDir = mkTemp('doctor-cli-pretty-home-');
  const result = spawnSync(process.execPath, [FGOS, 'doctor', '--pretty'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes('\x1b['), 'expected ANSI escape codes in --pretty output');
  assert.throws(() => JSON.parse(result.stdout), 'expected --pretty output to NOT be valid JSON');
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos doctor against a fresh cwd with no runner config never creates the shared config file (read-only proof)', () => {
  const cwd = mkTemp('doctor-cli-readonly-');
  const homeDir = mkTemp('doctor-cli-readonly-home-');
  const configPath = path.join(cwd, '.fgos', 'config.json');
  assert.equal(fs.existsSync(configPath), false);
  const result = spawnSync(process.execPath, [FGOS, 'doctor'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(configPath), false, 'fgos doctor must never create .fgos/config.json');
  const envelope = JSON.parse(result.stdout);
  const configCheck = envelope.data.checks.find((c) => c.id === 'config-not-stale');
  assert.equal(configCheck.passed, false);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('resolveMainCheckout from inside a linked worktree resolves the main checkout, not the worktree', () => {
  const main = initRepo('checks-main-');
  const wt = path.join(mkTemp('checks-wt-parent-'), 'wt');
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'side', wt], { cwd: main });

  // The distinction the dead-source-line bug turned on: --show-toplevel would
  // report the worktree itself here, which is why each worktree used to earn
  // its own shell-profile line.
  assert.equal(
    fs.realpathSync(execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: wt, encoding: 'utf8' }).trim()),
    fs.realpathSync(wt),
  );
  assert.equal(fs.realpathSync(resolveMainCheckout(wt)), fs.realpathSync(main));

  execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: main });
  fs.rmSync(main, { recursive: true, force: true });
});

test('resolveMainCheckout returns null outside a git checkout entirely', () => {
  const plain = mkTemp('checks-plain-');
  assert.equal(resolveMainCheckout(plain), null);
  fs.rmSync(plain, { recursive: true, force: true });
});

test('integrationScriptPath returns a path that actually exists on disk', () => {
  const resolved = integrationScriptPath();
  assert.notEqual(resolved, null, 'this test runs from a git checkout, so a path must resolve');
  assert.equal(fs.existsSync(resolved), true, `${resolved} does not exist`);
});

test('integrationScriptPath names the main checkout even when this copy runs from a linked worktree', () => {
  // Proves the fix at the level the bug lived at: the path handed to a shell
  // profile must outlive the worktree the command happened to run from.
  const resolved = integrationScriptPath();
  const owningCheckout = resolveMainCheckout(path.dirname(resolved));
  assert.equal(fs.realpathSync(path.join(owningCheckout, 'scripts')), fs.realpathSync(path.dirname(resolved)));
});

// ─── D1/D5: dead source lines are reported as a failed check ────────────────

test('shell-integration-sourced fails on a dead fgos source line even when the live line is present', () => {
  const homeDir = mkTemp('doctor-shell-dead-');
  const gone = path.join(homeDir, 'removed-worktree', 'scripts', 'fgos-shell-integration.sh');
  fs.writeFileSync(
    path.join(homeDir, '.bashrc'),
    `source "${integrationScriptPath()}"\nsource "${gone}"\n`,
  );
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, false);
    assert.ok(message.includes(gone), `message did not name the dead path: ${message}`);
    assert.ok(message.includes('1 dead'), `message did not count the dead lines: ${message}`);
  } finally {
    process.env.HOME = prevHome;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('shell-integration-sourced counts dead lines per rc file across both bash and zsh', () => {
  const homeDir = mkTemp('doctor-shell-dead-both-');
  const live = `source "${integrationScriptPath()}"\n`;
  const gone = path.join(homeDir, 'gone', 'scripts', 'fgos-shell-integration.sh');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), `${live}source "${gone}"\n`);
  fs.writeFileSync(path.join(homeDir, '.zshrc'), `${live}source "${gone}"\nsource "${gone}"\n`);
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, false);
    assert.ok(message.includes('3 dead'), `expected 3 dead across both files: ${message}`);
    assert.ok(message.includes(`${path.join(homeDir, '.bashrc')} (1)`), message);
    assert.ok(message.includes(`${path.join(homeDir, '.zshrc')} (2)`), message);
  } finally {
    process.env.HOME = prevHome;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('shell-integration-sourced still passes when every rc file has only the live line', () => {
  const homeDir = mkTemp('doctor-shell-clean-');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), `source "${integrationScriptPath()}"\n`);
  // See FGOS_SHELL_INTEGRATION_PROBE_SCRIPT's doc comment (registrations.mjs)
  // and the earlier "...and the sourced function actually works" test for
  // why this points the real-invocation probe at a known-good fixture
  // rather than this repo's own real script.
  const safeFixture = path.join(homeDir, 'safe-fgos.sh');
  fs.writeFileSync(safeFixture, 'fgos() {\n  echo "safe fgos $@"\n}\n');
  const prevHome = process.env.HOME;
  const prevProbe = process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
  process.env.HOME = homeDir;
  process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = safeFixture;
  try {
    const { passed } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, true);
  } finally {
    process.env.HOME = prevHome;
    if (prevProbe === undefined) delete process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
    else process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = prevProbe;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('shell-integration-sourced samples dead paths instead of printing all of them', () => {
  // Real profiles accumulate these into the hundreds; a check message that
  // names every one scrolls the rest of the doctor report off the screen.
  const homeDir = mkTemp('doctor-shell-dead-many-');
  const dead = Array.from({ length: 12 }, (_, i) =>
    path.join(homeDir, `gone-${i}`, 'scripts', 'fgos-shell-integration.sh'),
  );
  fs.writeFileSync(
    path.join(homeDir, '.bashrc'),
    `source "${integrationScriptPath()}"\n${dead.map((d) => `source "${d}"`).join('\n')}\n`,
  );
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, false);
    assert.ok(message.includes('12 dead'), `expected the full count: ${message}`);
    assert.ok(message.includes('(+9 more path(s))'), `expected the remainder note: ${message}`);
    const named = dead.filter((d) => message.includes(d));
    assert.equal(named.length, 3, `expected exactly 3 sampled paths, got ${named.length}`);
  } finally {
    process.env.HOME = prevHome;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});
