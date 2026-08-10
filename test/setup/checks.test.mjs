// checks.test.mjs — fgos doctor's check registry (str87-fgos-setup-doctor
// D2) plus CLI-level proof that `fgos setup`/`fgos doctor` (with/without
// --pretty) actually behave as CTR001/D7 require. Mirrors
// test/cli/fgos-manifest.test.mjs's/test/install-packaging.test.mjs's real
// spawnSync harness — no mocking the CLI process itself.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

import { DOCTOR_CHECKS, FIX_REGISTRATIONS, integrationScriptPath, mainCheckoutHookWired, resolveMainCheckout } from '../../src/setup/checks.mjs';
import { DEFAULT_RUNNER_CONFIG } from '../../src/runner/dispatch.mjs';
import { DEFAULT_LEVEL } from '../../src/state/gate-bypass.mjs';
import { DEFAULT_CLEANUP_TTL_DAYS, DEFAULT_CLEANUP_LEAF_TTL_DAYS } from '../../src/setup/registrations.mjs';
import { initStore, addWork } from '../../src/state/store.mjs';
import { appendEvent } from '../../src/state/events.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

// tsk-4xg: `doctor --fix` now runs the real `claude-plugin-marketplace` fix
// too, which shells out to a real, mutating external CLI (`claude plugin
// marketplace add`/`install`) when the `claude` binary is present --
// FGOS_CLAUDE_COMMAND (registrations.mjs's own test-only seam, mirroring
// bin/fgos.mjs's FGOS_GH_COMMAND for `gh`) points it at a path that never
// exists, so every `doctor --fix` spawned below sees "claude CLI not
// found" and no-ops that fix, never touching this machine's real Claude
// Code config as a side effect of running the test suite.
const NO_CLAUDE_ENV = { ...process.env, FGOS_CLAUDE_COMMAND: '/nonexistent/fgos-test-claude-binary' };

function mkTemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function checkById(id) {
  const entry = DOCTOR_CHECKS.find((c) => c.id === id);
  assert.ok(entry, `DOCTOR_CHECKS is missing "${id}"`);
  return entry;
}

function fixById(id) {
  const entry = FIX_REGISTRATIONS.find((f) => f.id === id);
  assert.ok(entry, `FIX_REGISTRATIONS is missing "${id}"`);
  return entry;
}

// ─── Unit tests: DOCTOR_CHECKS ─────────────────────────────────────────────

test('DOCTOR_CHECKS has exactly the three v1 checks from CONTEXT.md plus main-checkout-hook-wired, tool-registry-configured, config-awareness, dependencies-installed, gate-bypass-configured, root-drift, claude-plugin-marketplace, plugin-skill-cli-reachable, changelog-unreleased-stale, work-classification-vocabulary, and enduser-docs-index-stale', () => {
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
      'claude-plugin-marketplace',
      'plugin-skill-cli-reachable',
      'changelog-unreleased-stale',
      'work-classification-vocabulary',
      'enduser-docs-index-stale',
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

// ─── enduser-docs-index-stale (tsk-1m0, docs/history/doctor-check-enduser- ──
// docs-index-stale/CONTEXT.md): D1 count-only message, D2 one-directional
// (missing-from-index only), D3 read-only check sharing the same
// generation path as the fix, D5 missing-manifest is normal, D6
// QUADRANT_DIR_ALIASES (docs/decisions -> explanation) honored.

function writeEnduserDoc(tmp, quadrantDir, filename, h1) {
  const dirPath = path.join(tmp, 'docs', quadrantDir);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, filename), `# ${h1}\n\nbody\n`);
}

function writeEnduserManifest(tmp, entries) {
  fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'docs', 'enduser-docs-index.json'), `${JSON.stringify(entries, null, 2)}\n`);
}

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

test('tool-registry-configured always passes — inactive is a clean skip, never a failure', () => {
  const { passed, message } = checkById('tool-registry-configured').check(process.cwd());
  assert.equal(passed, true);
  assert.equal(typeof message, 'string');
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
      runner: DEFAULT_RUNNER_CONFIG,
      gateBypass: { level: 'off' },
      cleanup: { ttlDays: DEFAULT_CLEANUP_TTL_DAYS, leafTtlDays: DEFAULT_CLEANUP_LEAF_TTL_DAYS },
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

// ─── config-awareness (docs/history/global-project-config-awareness/ ──────
// CONTEXT.md D1): always passes (informational, read-only, same contract as
// tool-registry-configured) -- only the message and `active` distinguish
// which level is in play. Every case overrides HOME (same pattern the
// shell-integration-sourced tests above already use) so this never touches
// the real ~/.fgos/config.json; project config is checked at the temp cwd's
// own .fgos/config.json, matching describeConfigAwareness's real defaults.

function withHome(homeDir, fn) {
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    return fn();
  } finally {
    process.env.HOME = prevHome;
  }
}

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

// ─── CLI-level tests: real spawned `fgos setup` / `fgos doctor` ───────────

test('fgos setup (no flags) produces valid wrapEnvelope-shaped JSON on stdout', () => {
  const cwd = mkTemp('setup-cli-json-');
  const homeDir = mkTemp('setup-cli-json-home-');
  const result = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const envelope = JSON.parse(result.stdout);
  assert.equal(typeof envelope.contract, 'string');
  assert.ok('data' in envelope);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos setup wires core.hooksPath to .githooks in a real git checkout, and reports hooksWired: true', () => {
  const cwd = mkTemp('setup-cli-hooks-');
  const homeDir = mkTemp('setup-cli-hooks-home-');
  execFileSync('git', ['init', '-q'], { cwd });
  const result = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.data.hooksWired, true);
  const hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd, encoding: 'utf8' }).trim();
  assert.equal(hooksPath, '.githooks');
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos setup in a cwd with no .git reports hooksWired: false and does not throw', () => {
  const cwd = mkTemp('setup-cli-no-git-');
  const homeDir = mkTemp('setup-cli-no-git-home-');
  const result = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.data.hooksWired, false);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos setup leaves a pre-existing custom core.hooksPath untouched — fill-only, never silently repoint someone else\'s hooks', () => {
  const cwd = mkTemp('setup-cli-custom-hooks-');
  const homeDir = mkTemp('setup-cli-custom-hooks-home-');
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'core.hooksPath', 'my-own-hooks'], { cwd });
  const result = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.data.hooksWired, false);
  assert.equal(envelope.data.hooksSkippedExisting, 'my-own-hooks');
  const hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd, encoding: 'utf8' }).trim();
  assert.equal(hooksPath, 'my-own-hooks', 'must not be silently repointed to .githooks');
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos setup initializes ~/.fgos/config.json with the full default shape (tsk-1ri D1) when it does not exist', () => {
  const cwd = mkTemp('setup-cli-global-config-');
  const homeDir = mkTemp('setup-cli-global-config-home-');
  const result = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const envelope = JSON.parse(result.stdout);
  const expectedGlobalPath = path.join(homeDir, '.fgos', 'config.json');
  assert.equal(envelope.data.globalConfigPath, expectedGlobalPath);
  assert.equal(envelope.data.globalConfigCreated, true);
  assert.ok(fs.existsSync(expectedGlobalPath));
  const written = JSON.parse(fs.readFileSync(expectedGlobalPath, 'utf8'));
  assert.deepEqual(written.runner, DEFAULT_RUNNER_CONFIG);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos setup run twice does not rewrite an already-complete ~/.fgos/config.json (tsk-1ri D2, fill-missing-only)', () => {
  const cwd = mkTemp('setup-cli-global-config-repeat-');
  const homeDir = mkTemp('setup-cli-global-config-repeat-home-');
  const env = { ...process.env, HOME: homeDir };
  const first = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env });
  assert.equal(first.status, 0, first.stderr);
  const globalPath = JSON.parse(first.stdout).data.globalConfigPath;
  const mtimeBefore = fs.statSync(globalPath).mtimeMs;

  const second = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env });
  assert.equal(second.status, 0, second.stderr);
  const envelope = JSON.parse(second.stdout);
  assert.equal(envelope.data.globalConfigCreated, false);
  assert.deepEqual(envelope.data.globalConfigAddedKeys, []);
  assert.equal(fs.statSync(globalPath).mtimeMs, mtimeBefore, 'must not rewrite a file that already has every default key');
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos setup fills a missing default key into an existing ~/.fgos/config.json without touching a key the user already customized (tsk-1ri D1)', () => {
  const cwd = mkTemp('setup-cli-global-config-fill-');
  const homeDir = mkTemp('setup-cli-global-config-fill-home-');
  const globalDir = path.join(homeDir, '.fgos');
  fs.mkdirSync(globalDir, { recursive: true });
  const globalPath = path.join(globalDir, 'config.json');
  const customized = { runner: { ...DEFAULT_RUNNER_CONFIG, executor: { command: 'my-custom-cli', args: ['{prompt}'] } } };
  fs.writeFileSync(globalPath, `${JSON.stringify(customized, null, 2)}\n`);

  const result = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const written = JSON.parse(fs.readFileSync(globalPath, 'utf8'));
  assert.equal(written.runner.executor.command, 'my-custom-cli', 'a value the user already customized must never be overwritten');
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
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

test('fgos setup --pretty prints colored ANSI text describing what it did, not JSON', () => {
  const cwd = mkTemp('setup-cli-pretty-');
  const homeDir = mkTemp('setup-cli-pretty-home-');
  const result = spawnSync(process.execPath, [FGOS, 'setup', '--pretty'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes('\x1b['), 'expected ANSI escape codes in --pretty output');
  assert.throws(() => JSON.parse(result.stdout), 'expected --pretty output to NOT be valid JSON');
  assert.ok(result.stdout.includes('.fgos/config.json'), 'expected --pretty output to describe the config file it touched');
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

// ─── D2/D3: the shell-integration path is canonicalized to the main checkout ─

function initRepo(prefix) {
  const dir = mkTemp(prefix);
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: dir });
  execFileSync('git', ['commit', '-qm', 'seed'], { cwd: dir });
  return dir;
}

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

test('setup from a copy of fgos that is not in a git checkout declines the rc write and says why', () => {
  // The `/tmp/tmp.XXXXXXXX` shape observed in the wild: an unpacked copy with
  // no `.git` of its own. Its path is ephemeral, so writing it into a shell
  // profile leaves a `source` line that outlives the directory.
  const copyRoot = mkTemp('checks-nongit-copy-');
  const repoRoot = path.resolve(__dirname, '../..');
  for (const entry of ['bin', 'src', 'scripts', 'package.json']) {
    fs.cpSync(path.join(repoRoot, entry), path.join(copyRoot, entry), { recursive: true });
  }
  assert.equal(fs.existsSync(path.join(copyRoot, '.git')), false);

  const homeDir = mkTemp('checks-nongit-home-');
  const rcFile = path.join(homeDir, '.bashrc');
  fs.writeFileSync(rcFile, 'echo hi\n');

  const result = spawnSync(process.execPath, [path.join(copyRoot, 'bin', 'fgos.mjs'), 'setup'], {
    cwd: copyRoot,
    encoding: 'utf8',
    env: { ...process.env, HOME: homeDir },
  });

  assert.equal(result.status, 0, `setup failed: ${result.stderr}`);
  const { data } = JSON.parse(result.stdout);
  assert.deepEqual(data.rcFilesInserted, []);
  assert.deepEqual(data.rcFilesAlreadyConfigured, []);
  assert.ok(
    /not inside a git checkout/.test(data.rcWriteDeclinedReason ?? ''),
    `expected a stated reason, got: ${JSON.stringify(data.rcWriteDeclinedReason)}`,
  );
  // The whole point: nothing was appended to the profile.
  assert.equal(fs.readFileSync(rcFile, 'utf8'), 'echo hi\n');
  // Setup's other work still happened.
  assert.equal(fs.existsSync(path.join(copyRoot, '.fgos', 'config.json')), true);

  fs.rmSync(copyRoot, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('setup from a real checkout still writes the rc line and reports no declined reason', () => {
  const homeDir = mkTemp('checks-git-home-');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), 'echo hi\n');
  const cwd = initRepo('checks-git-cwd-');

  const result = spawnSync(process.execPath, [FGOS, 'setup'], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, HOME: homeDir },
  });

  assert.equal(result.status, 0, `setup failed: ${result.stderr}`);
  const { data } = JSON.parse(result.stdout);
  assert.equal(data.rcWriteDeclinedReason, undefined);
  assert.deepEqual(data.rcFilesInserted, [path.join(homeDir, '.bashrc')]);
  assert.ok(fs.readFileSync(path.join(homeDir, '.bashrc'), 'utf8').includes('fgos-shell-integration.sh'));

  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
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
