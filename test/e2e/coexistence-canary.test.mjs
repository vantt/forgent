// test/e2e/coexistence-canary.test.mjs — install-coexistence D5/D7 canary.
//
// Three honest proofs, one per direction named in
// docs/history/install-coexistence/CONTEXT.md:
//   (i)   bee->fgos: bee's REAL write-guard (.bee/bin/hooks/bee-write-guard.mjs,
//         the workshop's own hook, spawned as a real child process reading a
//         real stdin event — never a mocked verdict) against 3 fgos-territory
//         writes. Per D7 (user decision, post-probe), the current verdict-map
//         is 2 KNOWN-GAP denies + 1 allow, pinned VERBATIM here on purpose —
//         this feature closes with the gap documented, not hidden. See
//         docs/history/install-coexistence/reports/validation-s1-coexist.md
//         and the probe that first surfaced these verdicts,
//         .bee/spikes/install-coexistence/probe-guard-verdicts.mjs.
//   (ii)  fgos->bee: fgos ships no runtime gate yet, so this direction is
//         vacuous-by-absence — stated plainly rather than asserting a check
//         that doesn't exist. In its place, a footprint proof: a REAL fgos
//         round (init -> submit -> runner --once -> proposed) must not write
//         a single byte into the fixture tree outside fgos's own territory
//         (`.fgos/`) and the source-repo surface D2 names as an OWNED door
//         (`.git/` — a real worker dispatch commits onto a `fgw/*` branch,
//         which is the "runner worker được giao việc" door, not a leak).
//   (iii) init: `fgos init` detects bee's markers and leaves them untouched
//         (nhường-nhịn, D4/D6).
//
// Fixture shape is exactly what validation-s1-coexist.md's probe proved
// necessary and sufficient: a real git repo (fgos-runner needs one) plus
// bee's own bin/lib copied in (the guard dynamically imports its lib
// relative to the resolved storeRoot, not its own script location — see
// .bee/bin/hooks/adapter.mjs's libModuleUrl) and a REAL config/state/
// onboarding trio. onboarding.json is the single most load-bearing file in
// this fixture: the probe's control run proved that without it, bee's root
// resolution never finds a bee presence at all and the guard fails open
// (every write allowed) — a canary run without it would prove nothing. The
// dedicated self-check test below re-proves that fail-open behavior so a
// future accidental omission here fails loudly instead of silently lying.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
// Locate the workshop's bee installation by walking UP from this test file's
// real location (import.meta-based — never cwd): in the workshop checkout the
// parent of REPO_ROOT carries .bee/, but in a disposable tmpdir worktree
// (fgos-worktrees) no ancestor does. The canary can only measure the REAL
// guard, so when no bee installation exists these tests skip honestly
// instead of failing every worktree verify run.
function findWorkshopRoot(startDir, maxHops = 8) {
  let dir = startDir;
  for (let hop = 0; hop < maxHops; hop += 1) {
    if (fs.existsSync(path.join(dir, '.bee/bin/hooks/bee-write-guard.mjs'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}
const WORKSHOP_ROOT = findWorkshopRoot(__dirname);
const GUARD = WORKSHOP_ROOT ? path.join(WORKSHOP_ROOT, '.bee/bin/hooks/bee-write-guard.mjs') : null;
const BEE_SKIP = WORKSHOP_ROOT ? false : 'bee installation not found — canary chỉ chạy trong checkout xưởng (worktree/checkout rời skip trung thực)';
const FGOS = path.join(REPO_ROOT, 'bin/fgos.mjs');
const RUNNER = path.join(REPO_ROOT, 'bin/fgos-runner.mjs');

function mkTemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** A real git repo (fgos-runner requires one) carrying bee's real minimal
 * presence, probe-proven shape: bin/lib copied (the guard needs it to
 * resolve at storeRoot, not its own script path), config.json, state.json
 * pinned to a terminal phase (compounding-complete — same phase this very
 * workshop is in per `bee status` at cell-claim time), and onboarding.json.
 * Plus the bee AGENTS.md managed block coexist.mjs's own detector looks for. */
function makeFixture() {
  const fx = mkTemp('fgos-coexist-canary-');
  execFileSync('git', ['init', '-q'], { cwd: fx });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: fx });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: fx });
  fs.writeFileSync(path.join(fx, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: fx });
  execFileSync('git', ['commit', '-q', '-m', 'root commit'], { cwd: fx });

  fs.mkdirSync(path.join(fx, '.bee'), { recursive: true });
  fs.cpSync(path.join(WORKSHOP_ROOT, '.bee/bin'), path.join(fx, '.bee/bin'), { recursive: true });
  fs.writeFileSync(path.join(fx, '.bee/config.json'), JSON.stringify({ hooks: {}, gate_bypass: false }));
  fs.writeFileSync(
    path.join(fx, '.bee/state.json'),
    JSON.stringify({
      schema_version: '1.0',
      phase: 'compounding-complete',
      mode: 'standard',
      feature: 'fixture',
      approved_gates: { context: true, shape: true, execution: true, review: false },
      workers: [],
      summary: 'fixture',
      next_action: 'fixture',
    }),
  );
  fs.writeFileSync(
    path.join(fx, '.bee/onboarding.json'),
    JSON.stringify({ installed: true, bee_version: '1.3.5', files: {} }),
  );
  fs.writeFileSync(path.join(fx, 'AGENTS.md'), '# Fixture project\n\n<!-- BEE:START -->\nmanaged block\n<!-- BEE:END -->\n');

  return fx;
}

function runGuard(fixture, evt) {
  const r = spawnSync('node', [GUARD], {
    input: JSON.stringify(evt),
    encoding: 'utf8',
    cwd: fixture,
    env: { ...process.env, CLAUDE_PROJECT_DIR: fixture },
    timeout: 15000,
  });
  return { code: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

/** Byte snapshot of every file under `root`, excluding `excludeDirs` (given
 * as root-relative names, e.g. '.fgos', '.git'). Used for the footprint
 * proof — a real diff of file contents, not a description of one. */
function snapshotTree(root, excludeDirs) {
  const out = new Map();
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full);
      if (excludeDirs.some((ex) => rel === ex || rel.startsWith(ex + path.sep))) continue;
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      out.set(rel, fs.readFileSync(full));
    }
  }
  walk(root);
  return out;
}

function diffSnapshots(before, after) {
  const changed = [];
  for (const [rel, content] of after) {
    if (!before.has(rel)) {
      changed.push(`added:${rel}`);
    } else if (!before.get(rel).equals(content)) {
      changed.push(`modified:${rel}`);
    }
  }
  for (const rel of before.keys()) {
    if (!after.has(rel)) changed.push(`removed:${rel}`);
  }
  return changed;
}

// --- (i) bee->fgos: guard bee THẬT, 3 loại event, thực trạng D7 -------------

test('canary (i) bee->fgos: real bee guard against 3 fgos-territory writes — D7 verdict-map (2 KNOWN-GAP deny, 1 allow)', { skip: BEE_SKIP }, () => {
  const fx = makeFixture();

  // Bash `fgos <verb>` — ALLOWED (D7: "Bash fgos verbs qua").
  const bash = runGuard(fx, {
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command: `node ${FGOS} submit --text abc` },
    cwd: fx,
  });
  assert.equal(bash.code, 0, `Bash fgos submit expected allow (exit 0), got ${bash.code}: ${bash.stderr}`);

  // KNOWN-GAP #1 — Write .fgos/events.jsonl: idle-intake-gate, PHASE-
  // CONTINGENT (guards.mjs TERMINAL_PHASES branch — denies every write
  // outside the static allowlist while bee sits in a terminal phase; a plain
  // src/ write in the identical fixture gets the SAME deny per the probe's
  // control run, so this is not a rule that singles out fgos). FLIP: when
  // bee's idle gate consults a territory manifest (e.g. this feature's own
  // .fgos/coexistence.json) instead of the static allowlist, this assertion
  // flips to exit 0. Friction: .bee/backlog.jsonl, title "bee chặn nhầm lãnh
  // địa fgos (2 cơ chế KHÁC nhau — địa chỉ fix cho canary P10 flip)".
  const writeFgos = runGuard(fx, {
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: path.join(fx, '.fgos/events.jsonl'), content: 'x' },
    cwd: fx,
  });
  assert.equal(writeFgos.code, 2, `KNOWN-GAP: Write .fgos/ expected deny (exit 2), got ${writeFgos.code}`);
  assert.match(writeFgos.stderr, /bee intake gate/);

  // KNOWN-GAP #2 — Write into the tmpdir worktree path: containment guard,
  // PHASE-INDEPENDENT (bee-write-guard.mjs canonicalRelPath — denies any
  // target outside the physical checkout regardless of phase; an
  // INDEPENDENT mechanism from the intake gate above — two separate fixes on
  // the bee side, per D7, never one shared fix). FLIP: when bee's
  // containment exempts a registered territory (a worktree root another
  // harness declares) from this check, this assertion flips to exit 0. Same
  // friction id as above.
  const writeWorktree = runGuard(fx, {
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: path.join(os.tmpdir(), 'fgos-worktrees', 'canary-item', 'f.txt'), content: 'x' },
    cwd: fx,
  });
  assert.equal(writeWorktree.code, 2, `KNOWN-GAP: Write tmpdir worktree expected deny (exit 2), got ${writeWorktree.code}`);
  assert.match(writeWorktree.stderr, /canonically contained/);
});

// Mirrors probe-guard-verdicts.mjs's own control fixture exactly (no git —
// the main canary fixture above adds a real git repo only because
// fgos-runner needs one for test (ii); that git repo is itself enough for
// bee's root resolution to find a project root via locateGitRoot regardless
// of onboarding.json, so this self-check is deliberately git-less to
// reproduce the actual condition the probe proved: NO project root at all
// without onboarding.json).
function makeGitlessBeeFixture({ withOnboarding }) {
  const fx = mkTemp('fgos-coexist-canary-gitless-');
  fs.mkdirSync(path.join(fx, '.bee'), { recursive: true });
  fs.cpSync(path.join(WORKSHOP_ROOT, '.bee/bin'), path.join(fx, '.bee/bin'), { recursive: true });
  fs.writeFileSync(path.join(fx, '.bee/config.json'), JSON.stringify({ hooks: {}, gate_bypass: false }));
  fs.writeFileSync(
    path.join(fx, '.bee/state.json'),
    JSON.stringify({ schema_version: '1.0', phase: 'compounding-complete', mode: 'standard', feature: 'fixture' }),
  );
  if (withOnboarding) {
    fs.writeFileSync(path.join(fx, '.bee/onboarding.json'), JSON.stringify({ installed: true, bee_version: '1.3.5', files: {} }));
  }
  return fx;
}

test('canary self-check: a git-less fixture WITHOUT onboarding.json fails open (all-allow) — proves the deny assertions above are not vacuous', { skip: BEE_SKIP }, () => {
  const fx = makeGitlessBeeFixture({ withOnboarding: false });
  fs.mkdirSync(path.join(fx, 'src'), { recursive: true });

  const r = runGuard(fx, {
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: path.join(fx, 'src/index.mjs'), content: 'y' },
    cwd: fx,
  });
  assert.equal(r.code, 0, 'missing onboarding.json (and no git repo) must fail-open — else the KNOWN-GAP denies above prove nothing about a real bee presence');
});

test('canary self-check control: the SAME git-less fixture WITH onboarding.json denies the identical src/ write — proves the fail-open above is about onboarding.json, not the git-less shape itself', { skip: BEE_SKIP }, () => {
  const fx = makeGitlessBeeFixture({ withOnboarding: true });
  fs.mkdirSync(path.join(fx, 'src'), { recursive: true });

  const r = runGuard(fx, {
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: path.join(fx, 'src/index.mjs'), content: 'y' },
    cwd: fx,
  });
  assert.equal(r.code, 2, 'onboarding.json present must restore the deny — isolates onboarding.json as the load-bearing file');
});

// --- (iii) init: detect + nhường --------------------------------------------

test('canary (iii) fgos init detects bee and leaves it untouched (nhường-nhịn, D4/D6)', { skip: BEE_SKIP }, () => {
  const fx = makeFixture();
  const stateBefore = fs.readFileSync(path.join(fx, '.bee/state.json'));
  const agentsBefore = fs.readFileSync(path.join(fx, 'AGENTS.md'));

  const init = spawnSync(process.execPath, [FGOS, 'init'], { cwd: fx, encoding: 'utf8' });
  assert.equal(init.status, 0, `fgos init failed: ${init.stderr}`);
  const initData = JSON.parse(init.stdout).data;
  assert.ok(initData.detectedHarnesses.some((h) => h.name === 'bee'));

  const manifest = JSON.parse(fs.readFileSync(path.join(fx, '.fgos/coexistence.json'), 'utf8'));
  const beeEntry = manifest.detected_harnesses.find((h) => h.name === 'bee');
  assert.ok(beeEntry, 'bee must be detected in the manifest');
  assert.deepEqual([...beeEntry.markers].sort(), ['.bee', '<!-- BEE:START -->'].sort());

  assert.deepEqual(fs.readFileSync(path.join(fx, '.bee/state.json')), stateBefore, 'nhường: .bee/state.json byte-unchanged');
  assert.deepEqual(fs.readFileSync(path.join(fx, 'AGENTS.md')), agentsBefore, 'nhường: AGENTS.md byte-unchanged');
});

// --- (ii) footprint: real fgos round, snapshot diff -------------------------

test('canary (ii) footprint: a real fgos round (init->submit->runner --once->proposed) writes no byte outside .fgos/ and the owned .git/ door (D2); bee-fixture files stay byte-identical; fgos->bee stays vacuous-by-absence', { skip: BEE_SKIP }, () => {
  const fx = makeFixture();
  assert.equal(spawnSync(process.execPath, [FGOS, 'init'], { cwd: fx, encoding: 'utf8' }).status, 0);

  // A minimal discovery+dispatch executor (mirrors runner-loop.test.mjs's own
  // clear-discovery pattern) so `submit` chains clarify -> decompose ->
  // executing -> proposed in one --once call, same as that suite's stage-
  // decompose (a) case — nothing new invented here, just reused inline
  // since this cell may not edit that file.
  const scriptDir = mkTemp('fgos-coexist-canary-exec-');
  const executorPath = path.join(scriptDir, 'executor.mjs');
  fs.writeFileSync(
    executorPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const prompt = process.argv[2] ?? '';
if (prompt.includes('# Context-discovery')) {
  process.stdout.write(JSON.stringify({ clear: true, verify: 'test -f canary-done.txt' }));
} else if (prompt.includes('# Chia-việc (decompose)')) {
  process.stdout.write(JSON.stringify({ verdict: 'pass-through' }));
} else {
  fs.writeFileSync('canary-done.txt', 'produced by canary worker\\n');
  execFileSync('git', ['add', 'canary-done.txt']);
  execFileSync('git', ['commit', '-q', '-m', 'worker: canary-done.txt']);
}
`,
  );
  fs.writeFileSync(
    path.join(fx, '.fgos-runner.json'),
    JSON.stringify({
      executor: { command: process.execPath, args: [executorPath, '{prompt}', '--model', '{model}'] },
      models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
      timeoutMs: 15000,
    }),
  );

  // Snapshot AFTER init and the runner-config write (both are real, intended
  // fgos-territory / project-file writes that predate the round under test)
  // so the diff below measures only what the round itself does.
  const before = snapshotTree(fx, ['.fgos', '.git']);

  const submitted = JSON.parse(
    spawnSync(process.execPath, [FGOS, 'submit', 'Canary footprint proof'], { cwd: fx, encoding: 'utf8' }).stdout,
  ).data;
  assert.equal(submitted.stage, 'clarify');

  const runOnce = spawnSync(process.execPath, [RUNNER, '--once'], { cwd: fx, encoding: 'utf8' });
  assert.equal(runOnce.status, 0, `runner --once failed: ${runOnce.stderr}`);
  assert.match(runOnce.stdout, /proposed/);

  const after = snapshotTree(fx, ['.fgos', '.git']);
  const diff = diffSnapshots(before, after);
  assert.deepEqual(
    diff,
    [],
    `a real fgos round must leave the fixture tree (outside .fgos/ and .git/) byte-identical: ${diff.join(', ')}`,
  );

  // fgos->bee direction, stated honestly (D5/D7): fgos ships no runtime gate
  // yet, so there is no verdict for it to produce — this is vacuous-by-
  // absence, not a passing check. Nothing is asserted here on purpose.
});
