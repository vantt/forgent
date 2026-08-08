import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// chi hoi khi khong hieu -- ap thang roi bao lai mot dong
//
// Anti-recidivism guard for tsk-2cw / docs/decisions/0028: the pinned term
// "orchestrator" (decision 0026's original name for the pick-1-rootTask +
// stand-up + step-out role) was renamed to "launcher" throughout fgOS-owned
// prose. This test fails if "orchestrator" reappears outside the allowlist
// below, so the rename can't silently drift back.
//
// Structural precedent: test/skills/fgos-mirror.test.mjs (path-based check,
// not a behavior unit test). Five real verify traps this test avoids, per
// docs/how-to/write-verify-for-a-skill-prose-change.md (tsk-f38): uses
// `git ls-files` instead of a directory walk, so it (1) never depends on
// `--exclude-dir` basename-only matching, (2) never sees gitignored
// `.fgos/*.backup-*` files, (3) is not fooled by a path that merely
// *contains* the old word (checked separately below), and (4) does not
// silently skip hidden directories like `.claude/skills/**` the way a
// default `rg` walk would. Trap (5) — a too-weak pinned string — is
// addressed by requiring a full, specific defining sentence, not a bare
// word, in the POSITIVE tests below.

const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

function trackedFiles() {
  return execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

function read(relPath) {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

// D2 (docs/history/launcher-vocabulary-rename/CONTEXT.md): these two
// filenames are frozen historical artifacts, never renamed, so their own
// path text legitimately still spells "orchestrator". Word-wrapped prose
// sometimes breaks these filenames across a line (and, in a `.mjs` block
// comment, across a ` * ` continuation prefix) -- the gap pattern below
// tolerates a wrap or a comment-continuation marker after any hyphen
// without weakening what it matches: all eight/eleven hyphen-joined
// segments must still appear in the exact original order.
const FROZEN_FILENAMES = [
  '0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn',
  'internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report',
];
const WRAP_GAP = '-[\\s*]*';
const FROZEN_PATTERNS = FROZEN_FILENAMES.map(
  (name) => new RegExp(name.split('-').map((seg) => seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(WRAP_GAP), 'g'),
);

// Directories where "orchestrator" names a real, distinct concept and is
// never touched by this rename (item's own PHẠM VI ĐỔI / ALLOWLIST):
const ALLOWED_DIR_PREFIXES = [
  'herdr-plugin/src/', // PaneOrchestrator -- a Rust terminal-pane trait, unrelated concept
  'docs/distillery/', // verbatim upstream extraction, never edited to match fgOS's own vocab
  'plans/reports/', // historical records, per this item's own "khong sua nguoc" rule
];
const HERDR_HISTORY_DOC = /^docs\/history\/herdr-/; // herdr's own PaneOrchestrator, same reasoning

// Every remaining file below still legitimately contains "orchestrator"
// after the frozen-filename strip above, each for a specific, checked
// reason (docs/history/launcher-vocabulary-rename/CONTEXT.md's own scout
// evidence) -- never a blanket skip.
const ALLOWED_FILES = new Map([
  ['docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md', 'the decision record ABOUT the rename -- its filename and body legitimately discuss the old term while explaining why/how it was retired'],
  ['test/docs/launcher-vocabulary-guard.test.mjs', 'this file itself -- its own source must reference the literal word as pattern-matching data (frozen filenames, allowlist reasons, self-check assertions), not as prose deploying the pinned term'],
  ['docs/architecture-map.md', 'CTR003 gloss + runner-loop ORCHESTRATION label describe the continuous fgos-runner supervision loop (industry sense), not 0026\'s one-shot role -- reserved for the future meaning, not renamed'],
  ['docs/backlog.md', 'STR27/STR42/STR51/STR60 describe a continuous fleet/mechanical-picker loop (industry sense) -- reserved for the future meaning, not renamed'],
  ['docs/decisions/0013-discovered-from-runner-report-channel.md', 'CTR003 gloss, same continuous-loop sense as architecture-map.md'],
  ['docs/history/discover-decompose-skill-wrapper-verdict-routing/CONTEXT.md', 'cites decision 0005 (predates 0026) for fgos-runner\'s own unattended-loop sense, not 0026\'s role'],
  ['docs/history/execution-fanout/DISCUSSION.md', 'cites bee\'s own claim-first-then-spawn pattern ("cách bee"), a different upstream concept'],
  ['docs/history/fanout-and-delegation-rubric/DISCUSSION.md', 'section F is a historical record of the fgOS-vs-bee vocabulary clash itself, plus direct bee citations -- rewriting either would falsify the discussion it documents'],
  ['docs/history/fgos-terminal-close-autoclose/CONTEXT.md', 'cites work-item title "herdr-orchestrator" (tsk-2xt) and fgos-runner\'s unattended-loop sense, not 0026\'s role'],
  ['docs/history/launcher-vocabulary-rename/CONTEXT.md', 'this item\'s own decision record -- discusses the old term while explaining the rename'],
  ['docs/history/launcher-vocabulary-rename/plan.md', 'this item\'s own plan -- discusses the old term while explaining the rename'],
  ['docs/history/tsk-18a-merge-conflict-misclassification/repro-notes.md', 'cites a repro script\'s literal filename (tsk-18a-repro-orchestrator.mjs), never committed to the repo'],
  ['docs/history/two-layer-dispatch/DISCUSSION.md', 'cites bee-swarming/SKILL.md\'s own upstream terminology verbatim'],
  ['docs/specs/work-state.md', 'same fleet-orchestrator reserved-future sense as docs/backlog.md STR27'],
]);

const BINARY_EXT = /\.(png|jpe?g|gif|ico|woff2?|ttf|eot|pdf)$/i;
const WORD = /\borchestrators?\b/i;

function isDirAllowed(file) {
  return ALLOWED_DIR_PREFIXES.some((prefix) => file.startsWith(prefix)) || HERDR_HISTORY_DOC.test(file);
}

function stripFrozenFilenames(content) {
  let stripped = content;
  for (const pattern of FROZEN_PATTERNS) stripped = stripped.replace(pattern, '');
  return stripped;
}

function findOffenders() {
  const offenders = [];
  for (const file of trackedFiles()) {
    if (isDirAllowed(file) || ALLOWED_FILES.has(file) || BINARY_EXT.test(file)) continue;
    let content;
    try {
      content = readFileSync(path.join(repoRoot, file), 'utf8');
    } catch {
      continue; // symlink or otherwise unreadable as text -- not prose
    }
    if (WORD.test(stripFrozenFilenames(content))) offenders.push(file);
  }
  return offenders;
}

test('NEGATIVE: "orchestrator" does not appear in fgOS-owned prose outside the allowlist', () => {
  const offenders = findOffenders();
  assert.deepEqual(offenders, [], `pinned term "orchestrator" leaked back into: ${offenders.join(', ')}`);
});

test('NEGATIVE self-check: a synthetic in-scope violation is actually caught (true positive)', () => {
  assert.equal(WORD.test(stripFrozenFilenames('the orchestrator decides which rootTask to launch')), true);
  assert.equal(WORD.test(stripFrozenFilenames('see docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md')), false, 'frozen filename must still strip to empty');
});

test('NEGATIVE self-check: real allowlisted paths are not vacuously exempted (true negative)', () => {
  assert.equal(isDirAllowed('herdr-plugin/src/main.rs'), true);
  assert.equal(isDirAllowed('docs/distillery/sources/bee.md'), true);
  assert.equal(isDirAllowed('plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md'), true);
  assert.equal(isDirAllowed('docs/history/herdr-dashboard-pane-tracking/CONTEXT.md'), true);
  assert.equal(isDirAllowed('docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md'), false, 'the decision file itself is not dir-allowlisted -- it clears only via the frozen-filename strip');
  assert.equal(ALLOWED_FILES.has('docs/backlog.md'), true);
});

test('POSITIVE: decision 0026 defines "launcher" (specific sentence, not a bare word)', () => {
  const content = read('docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md');
  assert.match(
    content,
    /\*\*launcher\*\* — tiến trình\/cơ chế QUYẾT ĐỊNH kích hoạt 1 rootTask/,
    '0026 must still define the (renamed) role with its original defining sentence, now under "launcher"',
  );
  assert.match(content, /superseded_by: 0028/, '0026 must point forward to the superseding record (STR72)');
});

test('POSITIVE: decision 0028 exists and partially supersedes 0026 (naming only)', () => {
  const content = read('docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md');
  assert.match(content, /^supersedes: \[0026\]$/m);
  assert.match(content, /pinned term `orchestrator` → `launcher`/);
});

test('POSITIVE: the 12 skill mirrors still point at 0026\'s unchanged filename (D2)', () => {
  const skillDirs = ['.claude/skills', '.agents/skills'];
  const skillNames = ['fgos-clarifying', 'fgos-exploring', 'fgos-planning', 'fgos-code-implement', 'fgos-validating'];
  for (const dir of skillDirs) {
    for (const name of skillNames) {
      const content = read(`${dir}/${name}/SKILL.md`);
      assert.match(
        content.replace(/\s+/g, ' '),
        /0026-vision-orchestrator-roottask-capacity-native-vs-\s*cli-spawn\.md/,
        `${dir}/${name}/SKILL.md must still cite 0026's real, unrenamed filename`,
      );
    }
    const sharedContent = read(`${dir}/_shared/capacity-dispatch-fallback.md`);
    assert.match(
      sharedContent.replace(/\s+/g, ' '),
      /0026-vision-orchestrator-roottask-capacity-native-vs-\s*cli-spawn\.md/,
      `${dir}/_shared/capacity-dispatch-fallback.md must still cite 0026's real, unrenamed filename`,
    );
  }
});

test('POSITIVE: src/runner/*.mjs comments now say launcher, not orchestrator', () => {
  for (const file of ['src/runner/worker-log.mjs', 'src/runner/loop.mjs', 'src/runner/dispatch.mjs']) {
    const content = read(file);
    assert.match(content, /\blauncher\b/, `${file} must mention "launcher"`);
  }
});
