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
  // tsk-55h: docs/decisions/0000-index.md's own table format links every
  // row to its own real filename ([00NN](00NN-slug.md)) -- 0028's row is
  // no exception, so its filename must appear there too, same reasoning
  // as 0026's entry above.
  '0028-doi-ten-orchestrator-thanh-launcher',
];
const WRAP_GAP = '-[\\s*]*';
function buildFrozenPattern(name) {
  return new RegExp(name.split('-').map((seg) => seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(WRAP_GAP), 'g');
}
const FROZEN_PATTERNS = FROZEN_FILENAMES.map(buildFrozenPattern);

// tsk-2au: "herdr-orchestrator" is tsk-2xt's own item nickname (its title
// starts with this exact phrase) -- any file that cites tsk-2xt by name
// necessarily quotes it, recurring across whichever item happens to
// reference it (already recurred twice: fgos-terminal-close-autoclose/
// CONTEXT.md, merge-list-tree-bottleneck-priority/DISCUSSION.md).
// Structural, not incidental -- same reasoning as
// IRON_LAW_EVIDENCE_META_CITATION's own generalization below, but
// content-shaped (a phrase, not a path), so it reuses this same
// hyphen-segment/wrap-gap frozen-pattern mechanism instead of a path
// regex.
const FROZEN_PHRASES = ['herdr-orchestrator'];
const FROZEN_PHRASE_PATTERNS = FROZEN_PHRASES.map(buildFrozenPattern);

// Directories where "orchestrator" names a real, distinct concept and is
// never touched by this rename (item's own PHẠM VI ĐỔI / ALLOWLIST):
const ALLOWED_DIR_PREFIXES = [
  'herdr-plugin/src/', // PaneOrchestrator -- a Rust terminal-pane trait, unrelated concept
  'docs/distillery/', // verbatim upstream extraction, never edited to match fgOS's own vocab
  'plans/reports/', // historical records, per this item's own "khong sua nguoc" rule
  '.fgos/', // the committed, append-only event/state store (decision 0001) -- old fgos-decision text/backups legitimately quote the retired term forever; never rewritten (docs/how-to/write-verify-for-a-skill-prose-change.md trap #2)
];
const HERDR_HISTORY_DOC = /^docs\/history\/herdr-/; // herdr's own PaneOrchestrator, same reasoning

// tsk-2lg: an item's own docs/history/<id>/iron-law-evidence(-<suffix>).md
// documenting a real pre-existing failure of THIS guard necessarily quotes
// this guard's own NEGATIVE assertion message (which itself contains the
// pinned word, e.g. `pinned term "orchestrator" leaked back into: ...`) as
// real transcript evidence -- never fresh prose deploying the term. This is
// structural, not incidental, so it is exempted by path shape instead of
// requiring a new hand-added ALLOWED_FILES entry every time it recurs
// (already happened 6 separate times: see docs/history/tsk-2lg-launcher-
// guard-pattern-allowlist/plan.md). Scoped narrowly to this one file shape
// only -- every other allowlist reason below stays hand-listed because it
// does not share a generalizable path pattern.
const IRON_LAW_EVIDENCE_META_CITATION = /^docs\/history\/[^/]+\/iron-law-evidence(-[^/]+)?\.md$/;

// Every remaining file below still legitimately contains "orchestrator"
// after the frozen-filename strip above, each for a specific, checked
// reason (docs/history/launcher-vocabulary-rename/CONTEXT.md's own scout
// evidence) -- never a blanket skip.
const ALLOWED_FILES_ENTRIES = [
  ['docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md', 'the decision record ABOUT the rename -- its filename and body legitimately discuss the old term while explaining why/how it was retired'],
  ['test/docs/launcher-vocabulary-guard.test.mjs', 'this file itself -- its own source must reference the literal word as pattern-matching data (frozen filenames, allowlist reasons, self-check assertions), not as prose deploying the pinned term'],
  ['docs/architecture-map.md', 'CTR003 gloss + runner-loop ORCHESTRATION label describe the continuous fgos-runner supervision loop (industry sense), not 0026\'s one-shot role -- reserved for the future meaning, not renamed'],
  ['docs/backlog.md', 'STR27/STR42/STR51/STR60 describe a continuous fleet/mechanical-picker loop (industry sense) -- reserved for the future meaning, not renamed'],
  ['docs/decisions/0013-discovered-from-runner-report-channel.md', 'CTR003 gloss, same continuous-loop sense as architecture-map.md'],
  ['docs/history/discover-decompose-skill-wrapper-verdict-routing/CONTEXT.md', 'cites decision 0005 (predates 0026) for fgos-runner\'s own unattended-loop sense, not 0026\'s role'],
  ['docs/history/execution-fanout/DISCUSSION.md', 'cites bee\'s own claim-first-then-spawn pattern ("cách bee"), a different upstream concept'],
  ['docs/history/fanout-and-delegation-rubric/DISCUSSION.md', 'section F is a historical record of the fgOS-vs-bee vocabulary clash itself, plus direct bee citations -- rewriting either would falsify the discussion it documents'],
  ['docs/history/fgos-terminal-close-autoclose/CONTEXT.md', 'fgos-runner\'s own unattended-loop sense ("an unattended orchestrator [run]") and 2 PaneOrchestrator (Rust trait) references, not 0026\'s role -- its "herdr-orchestrator" (tsk-2xt) citation is separately covered by FROZEN_PHRASE_PATTERNS above, tsk-2au'],
  ['docs/history/gate-question-quality-and-routing/DISCUSSION.md', 'a concurrent item\'s discussion, authored against 0026\'s pre-rename text -- describes 0026\'s OLD state as observed at the time (same historical-record reasoning as this item\'s own CONTEXT.md/plan.md); also independently converges on "Launcher" as the name for the same herdr-side role, unprompted -- not this item\'s prose to rewrite'],
  ['docs/history/launcher-vocabulary-rename/CONTEXT.md', 'this item\'s own decision record -- discusses the old term while explaining the rename'],
  ['docs/history/launcher-vocabulary-rename/plan.md', 'this item\'s own plan -- discusses the old term while explaining the rename'],
  ['docs/history/tsk-1s5-orchestrator-leak-guard-check/CONTEXT.md', 'this item\'s own decision record -- documents a real leaked "orchestrator" mention (already fixed by 10c0bed5) as its own subject matter, same reasoning as launcher-vocabulary-rename/CONTEXT.md above'],
  ['docs/history/tsk-1s5-orchestrator-leak-guard-check/RESEARCH.md', 'this item\'s own research notes -- traces the same leaked "orchestrator" mention and its fix, same reasoning as launcher-vocabulary-rename/CONTEXT.md above'],
  ['docs/history/tsk-1s5-orchestrator-leak-guard-check/plan.md', 'this item\'s own plan -- discusses the same leaked "orchestrator" mention while explaining why no code change is needed, same reasoning as launcher-vocabulary-rename/plan.md above'],
  ['docs/history/tsk-18a-merge-conflict-misclassification/repro-notes.md', 'cites a repro script\'s literal filename (tsk-18a-repro-orchestrator.mjs), never committed to the repo'],
  ['docs/history/two-layer-dispatch/DISCUSSION.md', 'cites bee-swarming/SKILL.md\'s own upstream terminology verbatim'],
  ['docs/specs/work-state.md', 'same fleet-orchestrator reserved-future sense as docs/backlog.md STR27'],
  ['docs/history/tsk-2au-herdr-orchestrator-frozen-phrase-exemption/plan.md', 'this item\'s own plan -- discusses the pinned phrase "herdr-orchestrator" (tsk-2xt\'s item nickname) throughout while designing a FROZEN_PHRASES exemption for it in this exact guard test, same reasoning as launcher-vocabulary-rename/plan.md\'s own allowlist entry above'],
  ['docs/decisions/0029-sua-dinh-nghia-roottask-subtask-capacity-t1-cua-0026.md', 'the decision record ABOUT D17 (tsk-5td) -- explains that "orchestrator" is not a third T1 value but the T0 aggregate layer, same reasoning as 0028\'s own allowlist entry above'],
  ['docs/history/tsk-5wf-decision-doc-0029-supersede-0026-vocabulary/plan.md', 'this item\'s own plan -- discusses the old term while explaining D17\'s resolution, same reasoning as launcher-vocabulary-rename/plan.md above'],
  ['docs/history/dispatch-concept-boundary/DISCUSSION.md', 'tsk-5td\'s own shaping discussion -- §6.7/§7.1 work out D17 (orchestrator is the T0 aggregate layer, not a third T1 value) and cite the term throughout while doing so, same reasoning as the other DISCUSSION.md entries above (execution-fanout, fanout-and-delegation-rubric, two-layer-dispatch) and as 0029\'s own allowlist entry for the same D17'],
  ['docs/history/tsk-2lg-launcher-guard-pattern-allowlist/plan.md', 'this item\'s own plan -- discusses the pinned term (including quoting this guard\'s own NEGATIVE assertion message as pattern-matching data) while explaining the new IRON_LAW_EVIDENCE_META_CITATION exemption, same reasoning as launcher-vocabulary-rename/plan.md above'],
  ['docs/history/backlog-execution-reconciliation/RECONCILIATION.md', 'reconciles against docs/backlog.md\'s own STR27 row -- same fleet-orchestrator reserved-future sense already allowlisted there'],
  ['docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md', 'documents a real historical incident in this guard test itself (a git-ls-files false-pass during tsk-2cw\'s original rename) -- a war story, same reasoning as 0028\'s own allowlist entry'],
  ['plans/260808-2210-dispatch-vocabulary-rearrange/next-session-prompt.md', 'tsk-5td\'s own working prompt for its dispatch-vocabulary-rearrange session -- discusses "orchestrator" as its own subject matter (citing 0026/0028/tsk-2cw history while analyzing the dispatch-layer vocabulary), same reasoning as gate-question-quality-and-routing/DISCUSSION.md\'s own allowlist entry above, not prose this item has authority to rewrite mid-session'],
  ['docs/explanation/a-decision-doc-can-be-superseded-twice-superseded-by-becomes-a-list.md', 'cites the orchestrator->launcher rename as a real example while explaining decision-doc superseding -- same historical-example reasoning as 0028/0029\'s own allowlist entries'],
  ['docs/how-to/allowlist-a-historical-mention-in-launcher-vocabulary-guard.md', 'tsk-2uo\'s own how-to guide for allowlisting a historical mention in THIS exact guard test -- necessarily quotes the pinned term throughout as its own worked examples while documenting the allowlist mechanism, same self-referential reasoning as this file\'s own entry above'],
  ['docs/how-to/fix-fgos-write-rejected-merge-block.md', 'quotes a real work.decision capture (tsk-53n) that names this guard test\'s own "orchestrator" leak as a worked example of a pre-existing, unrelated failure a merge-block fix needs to recognize and exclude -- same meta-citation reasoning as the iron-law-evidence.md entries above (now covered by IRON_LAW_EVIDENCE_META_CITATION)'],
  ['docs/history/tsk-4cx-allowed-files-duplicate-key-guard/plan.md', 'this item\'s own plan -- discusses this guard\'s pinned term and the duplicate-key bug it found while explaining the new ALLOWED_FILES_ENTRIES self-check, same self-referential reasoning as tsk-2lg-launcher-guard-pattern-allowlist/plan.md\'s own entry above'],
  ['docs/history/branch-content-mismatch-post-merge-false-positive/plan.md', 'quotes this guard test\'s own pre-existing-failure report ("pinned term \\"orchestrator\\" already present in ...") as a worked example of an unrelated failure a merge-block fix needs to recognize and exclude, not prose deploying the pinned term -- same meta-citation reasoning as fix-fgos-write-rejected-merge-block.md\'s own allowlist entry above'],
  ['scripts/check-decision-codes.baseline.json', 'tsk-3ch\'s own ratchet baseline -- a machine-generated snapshot that mechanically quotes real, pre-existing test-description text verbatim as opaque data (never fresh prose), so it inherits whatever the source test files already say; one baselined line happens to be this exact guard test\'s own tsk-2au self-check ("...a bare \\"orchestrator\\" still trips...", test/docs/launcher-vocabulary-guard.test.mjs), which is itself a real, still-open decision-code-in-test-name violation tsk-3ch correctly grandfathers rather than silently drops'],
];
// tsk-4cx: named as its own array (not inlined into `new Map([...])`
// directly) so a self-check below can assert `ALLOWED_FILES_ENTRIES.length
// === ALLOWED_FILES.size` -- a Map silently collapses a duplicate key at
// runtime with no syntax error and no test failure otherwise, which
// happened twice in quick succession while landing tsk-2au (two concurrent
// sessions each adding an entry for the same file at different, non-
// conflicting positions in this same array).
const ALLOWED_FILES = new Map(ALLOWED_FILES_ENTRIES);
// tsk-2au: docs/history/merge-list-tree-bottleneck-priority/DISCUSSION.md
// (tsk-3cs) used to need its own hand-added entry here for citing
// tsk-2xt's "herdr-orchestrator" nickname -- now covered by
// FROZEN_PHRASE_PATTERNS above instead, same "avoid a stale duplicate of
// what the pattern already subsumes" reasoning tsk-2lg used for its own
// 6 removed iron-law-evidence.md entries. (tsk-4cx: a second such entry,
// re-added by a later concurrent merge after this reasoning already
// applied, was found and removed the same way.)
// tsk-2lg: the 6 docs/history/<id>/iron-law-evidence(-<suffix>).md entries
// this Map used to list by hand (launcher-vocabulary-rename, tsk-33w, tsk-4eu,
// tsk-2uo, automated-changelog-compound-learn x2) are now covered by
// IRON_LAW_EVIDENCE_META_CITATION above instead -- removed to avoid a stale
// duplicate of what the pattern already subsumes.

const BINARY_EXT = /\.(png|jpe?g|gif|ico|woff2?|ttf|eot|pdf)$/i;
const WORD = /\borchestrators?\b/i;

function isDirAllowed(file) {
  return (
    ALLOWED_DIR_PREFIXES.some((prefix) => file.startsWith(prefix)) ||
    HERDR_HISTORY_DOC.test(file) ||
    IRON_LAW_EVIDENCE_META_CITATION.test(file)
  );
}

function stripFrozenFilenames(content) {
  let stripped = content;
  for (const pattern of FROZEN_PATTERNS) stripped = stripped.replace(pattern, '');
  for (const pattern of FROZEN_PHRASE_PATTERNS) stripped = stripped.replace(pattern, '');
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
  assert.equal(isDirAllowed('.fgos/events.jsonl'), true);
  assert.equal(isDirAllowed('docs/history/herdr-dashboard-pane-tracking/CONTEXT.md'), true);
  assert.equal(isDirAllowed('docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md'), false, 'the decision file itself is not dir-allowlisted -- it clears only via the frozen-filename strip');
  assert.equal(ALLOWED_FILES.has('docs/backlog.md'), true);
});

test('NEGATIVE self-check: IRON_LAW_EVIDENCE_META_CITATION matches the real historical paths it replaces (true positive) and stays narrow (true negative)', () => {
  const realPaths = [
    'docs/history/launcher-vocabulary-rename/iron-law-evidence.md',
    'docs/history/tsk-33w-capacity-dispatch-command-audit-field/iron-law-evidence.md',
    'docs/history/tsk-4eu-executors-key-tier-validation/iron-law-evidence.md',
    'docs/history/tsk-2uo-launcher-vocabulary-guard-allowlist/iron-law-evidence.md',
    'docs/history/automated-changelog-compound-learn/iron-law-evidence.md',
    'docs/history/automated-changelog-compound-learn/iron-law-evidence-tsk-3ip.md',
  ];
  for (const p of realPaths) assert.equal(isDirAllowed(p), true, `${p} must be covered by IRON_LAW_EVIDENCE_META_CITATION`);
  // a sibling file in the same feature dir, different name -- must NOT be swept in
  assert.equal(isDirAllowed('docs/history/tsk-2uo-launcher-vocabulary-guard-allowlist/plan.md'), false);
  // nested one level deeper than the pattern allows -- must NOT match
  assert.equal(isDirAllowed('docs/history/tsk-2uo-launcher-vocabulary-guard-allowlist/nested/iron-law-evidence.md'), false);
});

test('NEGATIVE self-check: ALLOWED_FILES_ENTRIES has no duplicate key (tsk-4cx)', () => {
  // prove the check actually fires before trusting it against the real array
  const withDuplicate = [['a', 'x'], ['b', 'y'], ['a', 'z']];
  assert.notEqual(withDuplicate.length, new Map(withDuplicate).size, 'sanity: a duplicate key must change size vs length');

  assert.equal(
    ALLOWED_FILES_ENTRIES.length,
    ALLOWED_FILES.size,
    'ALLOWED_FILES_ENTRIES has a duplicate key -- a Map silently collapses it, dropping one reason with no syntax error',
  );
});

test('NEGATIVE self-check: "herdr-orchestrator" strips as a frozen phrase, but a bare "orchestrator" still trips (tsk-2au)', () => {
  assert.equal(
    WORD.test(stripFrozenFilenames('tsk-2xt (herdr-orchestrator) tự launch pane vào tab cố định')),
    false,
    'a citation of tsk-2xt\'s own nickname must strip to empty',
  );
  assert.equal(
    WORD.test(stripFrozenFilenames('the orchestrator decides which rootTask to launch')),
    true,
    'a bare "orchestrator" -- no "herdr-" prefix -- must still be caught as a real regression',
  );
});

test('POSITIVE: decision 0026 defines "launcher" (specific sentence, not a bare word)', () => {
  const content = read('docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md');
  assert.match(
    content,
    /\*\*launcher\*\* — tiến trình\/cơ chế QUYẾT ĐỊNH kích hoạt 1 rootTask/,
    '0026 must still define the (renamed) role with its original defining sentence, now under "launcher"',
  );
  assert.match(
    content,
    /superseded_by: \[0028, 0029\]/,
    '0026 must point forward to both superseding records (STR72) -- 0028 (naming) and 0029 (vocabulary), non-overlapping slices',
  );
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
