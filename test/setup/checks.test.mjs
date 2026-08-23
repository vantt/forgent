// checks.test.mjs -- registry check của `fgos doctor` cùng phần chứng minh ở
// mức CLI rằng `fgos doctor` (có/không --pretty) hành xử đúng CTR001/D7.
// Harness spawnSync thật, không mock chính process CLI.
//
// tsk-67g: 10 test dựng môi trường thật cho `fgos setup` đã dọn sang các file
// checks-setup-*.test.mjs bên cạnh.
//
// tsk-25b: main đã thêm nhiều check mới (root-drift, leaf-notify-drift,
// events-jsonl-*, work-*-vocabulary, domain-workflow-skillmap-coverage,
// enduser-docs-index-stale, decision-index-stale, ...) từ sau lần chẻ đầu,
// khiến file này lại vượt ngưỡng ~30s. Phần drift/vocabulary/index-staleness
// của chính work-item store ở lại đây; phần config/CLI-wiring/doctor runtime
// tách sang checks-doctor-config.test.mjs cạnh đó -- cùng D2 (chẻ cơ học,
// mỗi file dưới ~30s) tsk-3um/tsk-67g đã áp dụng.
import { test } from 'node:test';
import {
  DOCTOR_CHECKS,
  FGOS,
  FIX_REGISTRATIONS,
  NO_CLAUDE_ENV,
  addWork,
  appendEvent,
  assert,
  checkById,
  execFileSync,
  fixById,
  fs,
  initRepo,
  initStore,
  mkTemp,
  path,
  spawnSync,
  writeEnduserDoc,
  writeEnduserManifest,
} from './helpers/setup-checks-harness.mjs';
import { findDomainWorkflowSkillMapGaps } from '../../src/setup/registrations.mjs';
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
      'no-stuck-merge-abort',
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
