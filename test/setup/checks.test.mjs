// checks.test.mjs -- registry check của `fgos doctor` cùng phần chứng minh ở
// mức CLI rằng `fgos doctor` (có/không --pretty) hành xử đúng CTR001/D7.
// Harness spawnSync thật, không mock chính process CLI.
//
// tsk-67g: 10 test dựng môi trường thật cho `fgos setup` đã dọn sang các file
// checks-setup-*.test.mjs bên cạnh.
//
// tsk-25b: main đã thêm nhiều check mới (root-drift, leaf-notify-drift,
// events-jsonl-*, work-*-vocabulary,
// enduser-docs-index-stale, decision-index-stale, ...) từ sau lần chẻ đầu,
// khiến file này lại vượt ngưỡng ~30s. Phần drift/vocabulary/index-staleness
// của chính work-item store ở lại đây; phần config/CLI-wiring/doctor runtime
// tách sang checks-doctor-config.test.mjs cạnh đó -- cùng D2 (chẻ cơ học,
// mỗi file dưới ~30s) tsk-3um/tsk-67g đã áp dụng.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import { writeProjectConfig, writeGlobalConfig } from '../helpers/config-fixture.mjs';
import { DEFAULT_TERMINAL_CONFIG } from '../../src/terminal-control/config.mjs';
import {
  DEFAULT_CLEANUP_LEAF_TTL_DAYS,
  DEFAULT_CLEANUP_TTL_DAYS,
  DEFAULT_HERDR_ORCHESTRATOR_SETTINGS,
  DEFAULT_HERDR_WEB_DASHBOARD_SETTINGS,
  DEFAULT_INVARIANT_CHECK_COMMANDS,
  DEFAULT_RUNNER_CONFIG,
  DOCTOR_CHECKS,
  FIX_REGISTRATIONS,
  addWork,
  appendEvent,
  assert,
  checkById,
  execFileSync,
  fixById,
  fs,
  initRepo,
  initStore,
  mainCheckoutHookWired,
  mkTemp,
  path,
  spawnSync,
  withHome,
  writeEnduserDoc,
  writeEnduserManifest,
} from './helpers/setup-checks-harness.mjs';
import { DEFAULT_CHECKPOINT_FALLBACK_INTERVAL_SEC } from '../../src/state/events-jsonl-truncation-guard.mjs';
import { DEFAULT_CAPABILITY_SLOTS, DEFAULT_IRON_LAW_LEVEL, PI_EXECUTOR_DEFAULT } from '../../src/setup/registrations.mjs';
import { addDecision } from '../../src/state/store.mjs';
import { createSession } from '../../src/runner/session.mjs';
import { activateGitFixture } from '../helpers/git-fixture.mjs';

// ─── Unit tests: DOCTOR_CHECKS ─────────────────────────────────────────────

test('DOCTOR_CHECKS has exactly the registered setup/doctor checks, including instruction-projections-stale', () => {
  assert.deepEqual(
    DOCTOR_CHECKS.map((c) => c.id).sort(),
    [
      'config-not-stale',
      'convention-conformance',
      'main-checkout-hook-wired',
      'node-version-and-git',
      'shell-integration-sourced',
      'project-fgos-launcher',
      'tool-registry-configured',
      'config-awareness',
      'provider-capacity-state',
      'lock-kernel-semantics',
      'lock-borrow-vectors',
      'lock-holders',
      'process-containment',
      'run-supervisor-route',
      'runtime-socket-dir',
      'run-attempts-stuck',
      'gate-kill-grace',
      'legacy-attempts-stuck',
      'units-awaiting-resume',
      'cancel-wait',
      'credential-copies-retained',
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
      'work-step-vocabulary',
      'domain-workflow-operations-coverage',
      'delivered-not-on-trunk',
      'enduser-docs-index-stale',
      'invariant-checks-configured',
      'worktree-setup-configured',
      'writer-identity-resolvable',
      'identity-machine-id',
      'identity-machine-key',
      'identity-ssh-keygen',
      'identity-pinned-machines',
      'identity-project-id',
      'identity-ids-unique',
      'seat-binding-route',
      'seat-binding-config',
      'events-jsonl-not-truncated',
      'cli-version-visible',
      'worker-slots-ceiling-usable',
      'workflow-capabilities-configured',
      'workflow-case-binding-sentinel',
      'workflow-case-bindings',
      'gateway-token-configured',
      'readme-install-tag-exists',
      'iron-law-configured',
      'dispatch-decide-hook-wired',
      'codex-hook-wired',
      'agy-hook-wired',
      'omp-hook-wired',
      'pi-hook-wired',
      'mailbox-hook',
      'task-specs-resolve',
      'agent-claims-resolve',
      'agent-type-names-unique',
      'domain-registry-compiled',
      'advise-execute-capabilities-configured',
      'capability-serves-valid',
      'decision-index-stale',
      'instruction-projections-stale',
      'doc-registry-enforce',
      'doc-registry-stale',
      'doc-alias-broken',
      'doc-active-duplicate',
      'doc-current-path-missing',
      'doc-source-unreachable',
      'doc-near-duplicate',
      'doc-provisional-aged',
      'doc-topic-oversized',
      'doc-role-underused',
      'doc-source-conservation',
      'agy-permissions-configured',
      'agy-sub-homes-configured',
      'bwrap-available',
      'curl-available',
      'main-checkout-guard-warnings',
      'events-compaction-verified',
      'no-stuck-merge-abort',
      'coordination-protocol-fixtures-valid',
      'coordination-example-requests-valid',
      // Phase 01 group D: the three preconditions for an interactive dispatch.
      'terminal-control',
      'git-component-compatible',
      'git-worktree-recovery',
      'git-repository-config',
      'git-operation-journal',
      'git-native-locks',
      'git-mutation-one-door',
      'terminal-allocations',
      'trust-store-readable',
      // Phase 07 (herdr-trust-supervisor R3): codex-toml/agy trust stores had
      // no doctor coverage at all -- only claude-json's default path did.
      'non-claude-trust-stores-readable',
      'confined-pane-accounts',
      'agent-cli-project-trusted',
      'seat-binding-dry-bind',
      'blind-steps-use-proven-pools',
      'observe-dir-writable',
      'observe-friction-migrated',
      'observe-host-resolvable',
      'observe-run-coverage',
      'executor-confinement',
      'executor-posture-coverage',
      'invocation-git-write-grants',
      'herdr-executor-kinds',
      // Phase 06 (executor-policy-dispatch-seams): legacy policy-shaped
      // executor/capability warnings, named with their migration target.
      'executor-profile-warnings',
      // Phase 09: rust-host-r1-kernel release tree builder and doctor.
      'rust-host-binary-present',
      'rust-host-target-supported',
      'legacy-node-payload-present',
      'active-release-matches-checkout',
      'command-routes-drift',
      'confinement-policies-declared',
      'confinement-backend-registry-readable',
      'confinement-bwrap-platform',
      'confinement-herdr-maturity',
      'confinement-orphaned-resources-reaped',
      'confinement-probe-freshness',
      'confinement-blind-read',
      'confinement-strict-readiness',
      'operation-prompt-templates-valid',
      'operation-capability-resolves',
      'runner-coordination-orgPolicy-shape',
      'runner-patterns-config',
      'runner-generated-paths',
      'shadow-binder-divergence',
      'tier-vocabulary-dead-keys',
      'executor-family-unique',
      'executor-skills-installed',
      'tier-fallback',
      'model-policy-pools',
      'llm-accounts-shape',
      'llm-accounts-vs-legacy',
      'global-model-policies-portable',
      'coordination-protocol-dead-vocabulary',
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
  activateGitFixture(dir);
  createSession(dir, { itemId: 'leaf' });

  const { passed, message } = checkById('leaf-notify-drift').check(dir);
  assert.equal(passed, false);
  assert.match(message, /leaf/);
  assert.match(message, /file\.txt/);
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
  assert.equal(fs.existsSync(path.join(fgosDir, 'runtime', 'events-jsonl.truncation-guard.json')), true, 'a passing check advances/bootstraps the mark');
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

// ─── work-step-vocabulary (tsk-64h) ───────────────────────────────────────
// The stage-axis sibling of work-classification-vocabulary above: an open
// item may sit at a stage its own domain no longer registers, and nothing
// surfaced that until now. Same OPEN-only scoping and the same raw
// `work.add` fixture technique, for the same reason — `validateWorkShape`
// refuses a retired stage at the write door, so a legacy-shaped item can
// only be constructed by appending the event directly.

test('work-step-vocabulary passes on an empty store', () => {
  const dir = initRepo('checks-stage-vocab-empty-');
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);

  const { passed, message } = checkById('work-step-vocabulary').check(dir);
  assert.equal(passed, true);
  assert.match(message, /registered by its domain/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('work-step-vocabulary passes for an item whose stage was never written (lazy Execute default)', () => {
  const dir = initRepo('checks-stage-vocab-unset-');
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);
  addWork(fgosDir, { id: 'a', title: 'a', kind: 'feature', risk: 'light', verify: 'true', status: 'todo', deps: [], refs: [] });

  const { passed, message } = checkById('work-step-vocabulary').check(dir);
  assert.equal(passed, true, message);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('work-step-vocabulary passes when every open item sits at a stage its domain registers', () => {
  const dir = initRepo('checks-stage-vocab-clean-');
  const fgosDir = path.join(dir, '.fgos');
  const logPath = path.join(fgosDir, 'events.jsonl');
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'a', title: 'a', kind: 'feature', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', workflowStep: 'planning' },
  });
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'b', title: 'b', kind: 'feature', status: 'doing', deps: [], risk: 'light', refs: [], verify: 'true', workflowStep: 'executing' },
  });

  const { passed, message } = checkById('work-step-vocabulary').check(dir);
  assert.equal(passed, true, message);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('work-step-vocabulary fails and names an OPEN item sitting at a stage its domain retired', () => {
  const dir = initRepo('checks-stage-vocab-retired-');
  const fgosDir = path.join(dir, '.fgos');
  const logPath = path.join(fgosDir, 'events.jsonl');
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'stranded', title: 'stranded', kind: 'feature', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', workflowStep: 'clarify' },
  });

  const { passed, message } = checkById('work-step-vocabulary').check(dir);
  assert.equal(passed, false);
  assert.match(message, /stranded/);
  assert.match(message, /step: "clarify"/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("work-step-vocabulary judges each item against its OWN domain's stages, not the default domain's", () => {
  const dir = initRepo('checks-stage-vocab-domain-');
  const fgosDir = path.join(dir, '.fgos');
  const logPath = path.join(fgosDir, 'events.jsonl');
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'triaged', title: 'triaged', kind: 'feature', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', workflowStep: 'triage', domain: 'triage' },
  });
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'miscoded', title: 'miscoded', kind: 'feature', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', workflowStep: 'triage' },
  });

  const { passed, message } = checkById('work-step-vocabulary').check(dir);
  assert.equal(passed, false);
  assert.match(message, /miscoded/);
  assert.doesNotMatch(message, /triaged/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('work-step-vocabulary passes despite a retired stage on an already-resolved (done) item', () => {
  const dir = initRepo('checks-stage-vocab-resolved-');
  const fgosDir = path.join(dir, '.fgos');
  const logPath = path.join(fgosDir, 'events.jsonl');
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'old-done', title: 'old-done', kind: 'feature', status: 'done', deps: [], risk: 'light', refs: [], verify: 'true', workflowStep: 'clarify' },
  });

  const { passed, message } = checkById('work-step-vocabulary').check(dir);
  assert.equal(passed, true, message);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('work-step-vocabulary lists every violating id, not just the first', () => {
  const dir = initRepo('checks-stage-vocab-multi-');
  const fgosDir = path.join(dir, '.fgos');
  const logPath = path.join(fgosDir, 'events.jsonl');
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'bad-one', title: 'bad-one', kind: 'feature', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', workflowStep: 'clarify' },
  });
  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'bad-two', title: 'bad-two', kind: 'feature', status: 'awaiting-human', deps: [], risk: 'light', refs: [], verify: 'true', workflowStep: 'clarify' },
  });

  const { passed, message } = checkById('work-step-vocabulary').check(dir);
  assert.equal(passed, false);
  assert.match(message, /bad-one/);
  assert.match(message, /bad-two/);
  fs.rmSync(dir, { recursive: true, force: true });
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
  fs.writeFileSync(path.join(tmp, 'docs', 'enduser-docs-index.json'), '[]\n');
  fixById('enduser-docs-index-stale').fix(tmp);
  const second = fixById('enduser-docs-index-stale').fix(tmp);
  assert.equal(second.changed, false);
  assert.match(second.message, /already up to date/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('outside the fgOS source repo, doctor --fix never creates the end-user or decision index -- it only refreshes an adopted one', () => {
  const tmp = mkTemp('fgos-outside-project-fixes-');
  const fgosDir = path.join(tmp, '.fgos');
  initStore(fgosDir);
  writeEnduserDoc(tmp, 'how-to', 'sample.md', 'Sample Doc');
  addDecision(fgosDir, { text: 'D-ADR9999: example', rationale: 'r', scope: 'example-area', relation: 'none' });

  assert.match(fixById('enduser-docs-index-stale').fix(tmp).message, /skipped/);
  assert.match(fixById('decision-index-stale').fix(tmp).message, /skipped/);
  assert.equal(checkById('decision-index-stale').check(tmp).passed, true);
  assert.equal(fs.existsSync(path.join(tmp, 'docs', 'enduser-docs-index.json')), false);
  assert.equal(fs.existsSync(path.join(tmp, 'docs', 'decisions', 'index.md')), false);
  fs.rmSync(tmp, { recursive: true, force: true });
});

// A fixture that looks like the fgOS source repo, where the decision index is
// mandatory and doctor --fix creates it; any other project only refreshes it.
function markFgosSourceCheckout(root) {
  fs.mkdirSync(path.join(root, 'apps', 'fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, 'apps', 'fgos', 'Cargo.toml'), '[package]\nname = "fgos"\n');
}

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
  markFgosSourceCheckout(tmp);
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
  markFgosSourceCheckout(tmp);
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
  markFgosSourceCheckout(tmp);
  addDecision(fgosDir, { text: 'D-ADR9999: example', rationale: 'r', scope: 'example-area', relation: 'none' });

  const { passed, message } = checkById('decision-index-stale').check(tmp);
  assert.equal(passed, false);
  assert.match(message, /not found/);
  assert.doesNotMatch(message, /nothing to check/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('decision-index-stale check and fix preserve committed decisions absent from the local store', () => {
  const tmp = mkTemp('fgos-decision-index-fix-');
  const populatedFgosDir = path.join(tmp, '.fgos');
  initStore(populatedFgosDir);
  markFgosSourceCheckout(tmp);
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
  assert.equal(checkById('decision-index-stale').check(tmp).passed, true);

  const after = fs.readFileSync(path.join(tmp, 'docs', 'decisions', 'index.md'), 'utf8');
  assert.equal(after, before, 'the real index must survive the refused fix untouched');
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('config-not-stale passes when the existing config already has every default key', () => {
  const cwd = mkTemp('doctor-config-full-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  writeProjectConfig(cwd, ({
      runner: {
        ...DEFAULT_RUNNER_CONFIG,
        capabilities: DEFAULT_CAPABILITY_SLOTS,
        modelPolicies: { ...DEFAULT_RUNNER_CONFIG.modelPolicies, openai: { nano: 'gpt-5.5' } },
        executors: { openai: PI_EXECUTOR_DEFAULT },
      },
      gateBypass: { level: 'off' },
      cleanup: { ttlDays: DEFAULT_CLEANUP_TTL_DAYS, leafTtlDays: DEFAULT_CLEANUP_LEAF_TTL_DAYS },
      herdrOrchestrator: DEFAULT_HERDR_ORCHESTRATOR_SETTINGS,
      herdrWebDashboard: DEFAULT_HERDR_WEB_DASHBOARD_SETTINGS,
      invariantChecks: { commands: DEFAULT_INVARIANT_CHECK_COMMANDS },
      worktreeSetup: { commands: [] },
      workerSlots: { ceiling: null },
      eventStore: { remote: 'origin' },
      terminal: DEFAULT_TERMINAL_CONFIG,
      gateway: { port: 4170, token: null },
      ironLaw: { level: DEFAULT_IRON_LAW_LEVEL },
      docRegistry: { enforce: false },
      checkpoint: { fallbackIntervalSec: DEFAULT_CHECKPOINT_FALLBACK_INTERVAL_SEC },
      mailbox: {},
    }),
  );
  const { passed } = checkById('config-not-stale').check(cwd);
  assert.equal(passed, true);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ─── gate-bypass-configured (docs/history/doctor-fix-gate-bypass/CONTEXT.md
// D1/D3, tsk-2qz-2): the registry's first entry to register all three
// capabilities (check + configDefault + fix). check/fix here are both
// keyed to "is config.gateBypass.level present and a recognized LEVEL",
// deliberately distinct from config-not-stale's generic "key present at
// all" scan above (a malformed-but-present level is never "missing").

// ─── advise-execute-capabilities-configured (tsk-2uf-3, docs/history/
// dispatch-activation-and-handoff-redesign/CONTEXT.md D2): same
// generic-scan/dedicated-check split as gateway/workerSlots/invariantChecks
// above -- config-not-stale already catches runner.capabilities (or either
// slot) being wholly ABSENT; this check catches present-but-malformed.

// ─── capability-serves-valid (I19, core/skills/_shared/capability-matching.md) ───

test('capability-serves-valid fails when runner.capabilities is missing entirely', () => {
  const cwd = mkTemp('doctor-serves-absent-');
  const { passed, message } = checkById('capability-serves-valid').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /runner\.capabilities section missing/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('capability-serves-valid passes on the curated defaults (serves on every slot, none identical, "review" present)', () => {
  const cwd = mkTemp('doctor-serves-ok-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  writeProjectConfig(cwd, ({ runner: { capabilities: DEFAULT_CAPABILITY_SLOTS } }));
  const { passed, message } = checkById('capability-serves-valid').check(cwd);
  assert.equal(passed, true, message);
  assert.match(message, /valid "serves" attribute set, none identical, and "review" is present/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('capability-serves-valid is a no-op pass on a config with no "serves" anywhere (an entry without one stays valid)', () => {
  const cwd = mkTemp('doctor-serves-none-declared-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  writeProjectConfig(cwd, ({ runner: { capabilities: { advise: {}, execute: {}, review: {} } } }));
  const { passed, message } = checkById('capability-serves-valid').check(cwd);
  assert.equal(passed, true, message);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('capability-serves-valid fails when a "serves" value has an unknown key or wrong type', () => {
  for (const badServes of [{ notARealKey: 'change' }, { mutates: 'yes' }, { outputKind: 42 }, { size: 'heavy' }, { rigor: 'high' }]) {
    const cwd = mkTemp('doctor-serves-malformed-');
    fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
    writeProjectConfig(cwd, ({ runner: { capabilities: { review: {}, execute: { serves: badServes } } } }));
    const { passed, message } = checkById('capability-serves-valid').check(cwd);
    assert.equal(passed, false, `serves: ${JSON.stringify(badServes)}`);
    assert.match(message, /invalid "serves"/);
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('capability-serves-valid fails when two entries declare the identical "serves" attribute set', () => {
  const cwd = mkTemp('doctor-serves-duplicate-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  writeProjectConfig(cwd, ({
      runner: {
        capabilities: {
          review: { serves: { outputKind: 'finding', mutates: false } },
          'docs:review': { serves: { outputKind: 'finding', mutates: false } },
        },
      },
    }),
  );
  const { passed, message } = checkById('capability-serves-valid').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /declare the identical "serves" attribute set/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('capability-serves-valid fails when the "review" slot is missing', () => {
  const cwd = mkTemp('doctor-serves-no-review-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  writeProjectConfig(cwd, ({ runner: { capabilities: { execute: { serves: { outputKind: 'change', mutates: true } } } } }));
  const { passed, message } = checkById('capability-serves-valid').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /missing the "review" slot/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ─── herdr-launcher-configured (tsk-2m5, docs/history/
// stage-status-driving-coordination/): the herdr-launcher's own
// auto-launch toggles. Check-only, no fix (YAGNI -- see registrations.mjs's
// own comment on this) -- `config-not-stale` already catches the whole
// section being MISSING; this check adds the one thing that generic
// staleness scan cannot: a PRESENT but non-boolean toggle value.

// ─── herdr-web-dashboard-configured (tsk-48w, D14 of docs/history/herdr-
// web-dashboard-plan-realignment/CONTEXT.md): the web dashboard's static-
// serving toggle. Same check-only shape as herdr-launcher-configured
// above -- config-not-stale already catches the whole section missing;
// this check adds the one thing that generic staleness scan cannot: a
// PRESENT but non-boolean value.

test('provider-capacity-state doctor check reports quarantine without clearing it', () => {
  const homeDir = mkTemp('doctor-provider-capacity-home-');
  const cwd = mkTemp('doctor-provider-capacity-cwd-');
  const fgosHome = path.join(homeDir, '.fgos');
  fs.mkdirSync(fgosHome, { recursive: true });
  writeGlobalConfig(homeDir, ({
    runner: {
      providers: {
        'openai-codex': {
          accounts: {
            tetnu: {
              label: 'Tetnu',
              credentialSource: { kind: 'codex-home', home: path.join(homeDir, 'codex-tetnu') },
            },
          },
        },
      },
    },
  }));
  const stateDir = path.join(fgosHome, 'runtime', 'provider-capacity');
  fs.mkdirSync(stateDir, { recursive: true });
  const statePath = path.join(stateDir, 'state.json');
  fs.writeFileSync(statePath, JSON.stringify({
    contract: 'provider-capacity-state.v1',
    providers: {
      'openai-codex': {
        accounts: {
          tetnu: {
            quarantine: { reasonCode: 'auth-token', kind: 'manual-clear', quarantinedAt: '2026-09-16T00:00:00.000Z' },
            leases: {},
          },
        },
      },
    },
    assignments: {},
    audit: [],
  }, null, 2));
  withHome(homeDir, () => {
    const { passed, message } = checkById('provider-capacity-state').check(cwd);
    assert.equal(passed, false);
    assert.match(message, /auth-token:manual-clear/);
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    assert.equal(state.providers['openai-codex'].accounts.tetnu.quarantine.reasonCode, 'auth-token');
  });
  fs.rmSync(homeDir, { recursive: true, force: true });
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ─── main-checkout-hook-wired (tsk-3w8): str65's main-checkout lock only ───
// guards commits when core.hooksPath actually points at .githooks — str88
// removed the automatic `prepare`-lifecycle wiring (pnpm 10+ blocks it for a
// git-hosted dependency), so this doctor check + fgos setup's own wiring
// (below) are the only paths left that keep it honest.

test('main-checkout-hook-wired doctor check reports passed/failed matching mainCheckoutHookWired, with an actionable message', () => {
  const cwd = mkTemp('doctor-hook-check-');
  execFileSync('git', ['init', '-q'], { cwd });
  const notApplicable = checkById('main-checkout-hook-wired').check(cwd);
  assert.equal(notApplicable.passed, true);
  assert.match(notApplicable.message, /not applicable/);
  fs.mkdirSync(path.join(cwd, '.githooks'));
  const before = checkById('main-checkout-hook-wired').check(cwd);
  assert.equal(before.passed, false);
  assert.match(before.message, /run fgos setup/);

  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd });
  const after = checkById('main-checkout-hook-wired').check(cwd);
  assert.equal(after.passed, true);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ─── D1/D5: dead source lines are reported as a failed check ────────────────

// ─── operation-capability-resolves (Unit I21 fix, round 3, MEDIUM) ────────
function writeRunnerConfig(dir, runner) {
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  writeProjectConfig(dir, { runner });
}

test('operation-capability-resolves reports passing status for retired coordination protocols', () => {
  const dir = mkTemp('checks-operation-capability-retired-');
  try {
    writeRunnerConfig(dir, { executor: { command: 'claude', args: ['{prompt}'] } });
    const { passed, message } = checkById('operation-capability-resolves').check(dir);
    assert.equal(passed, true, message);
    assert.match(message, /retired/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a doctor row keeps its facts under detail so its message stays one sentence', () => {
  const root = initRepo('doctor-detail-');
  try {
    const row = checkById('git-component-compatible').check(root);
    assert.equal(row.passed, true, row.message);
    assert.equal(typeof row.detail.versions.napi, 'number');
    assert.ok(!row.message.includes('{"'), 'a message carries no JSON');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
