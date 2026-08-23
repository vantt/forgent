import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// retrospective-doc-write-path D1/D3: `fgos-coding-compounding`'s own document is
// pure prose read by an agent, with no function boundary `npm test` can call
// directly — so what these tests prove is the artifact the phase actually
// produces: the skill text itself carries the write-before-tag order and
// the main-checkout root resolution the decision record locked, the same
// way `test/skills/fgos-mirror.test.mjs` already asserts on live skill file
// content rather than simulating an agent following it.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// tsk-1qi: reads .agents/skills, the canonical source (D5) — .claude/skills
// is now a generated thin wrapper with no prose content of its own to check.
const SKILL_PATH = path.resolve(__dirname, '../../.agents/skills/fgos-coding-compounding/SKILL.md');
const skillText = fs.readFileSync(SKILL_PATH, 'utf8');

function stepIndex(stepLabel) {
  const match = skillText.match(new RegExp(`^\\d+\\. \\*\\*${stepLabel}`, 'm'));
  assert.ok(match, `expected to find a numbered step starting with "${stepLabel}" in ${SKILL_PATH}`);
  return match.index;
}

test('fgos-coding-compounding writes the document before it stores the tag (D1/D3 order)', () => {
  const writeStep = stepIndex('Gather every linked capture, then grow or create the document');
  const tagStep = stepIndex('Store the tag\\.');
  assert.ok(writeStep < tagStep, 'the document-writing step must appear before the tag-storing step — write first, tag second, per D3');
});

test('fgos-coding-compounding\'s document-writing step uses fgos doc-sources to gather captures before writing or committing', () => {
  const writeStep = stepIndex('Gather every linked capture, then grow or create the document');
  const tagStep = stepIndex('Store the tag\\.');
  const writeStepText = skillText.slice(writeStep, tagStep);
  assert.match(writeStepText, /fgos doc-sources docs\/<quadrant>\/<file>\.md/, 'the no-loss gather must run via fgos doc-sources');
  assert.match(writeStepText, /\$root\/docs\/<quadrant>\/<file>\.md/, 'grow-vs-create must check file existence at the resolved root, not at cwd');
  assert.match(writeStepText, /git (-C "\$root" )?add "docs\/<quadrant>\/<file>\.md"/, 'the write step must stage the document before committing');
});

test('fgos-coding-compounding\'s tag-storing step names the D3 refusal it now depends on', () => {
  const tagStep = stepIndex('Store the tag\\.');
  const nextStep = stepIndex('Confirm the close');
  const tagStepText = skillText.slice(tagStep, nextStep);
  assert.match(tagStepText, /retrospective-doc-write-path D3/, 'the tag step must name the decision record that governs the refusal it now depends on, not just the mechanics');
  assert.match(tagStepText, /fgos compound <id> --doc-type <quadrant> --doc-path docs\/<quadrant>\/<file>\.md/, 'the tag call must run via fgos compound');
});

// retrospective-doc-write-path D2: the one document (tsk-5z2) present in no
// commit at all is regrown here, sourced from tsk-5z2's own decision record
// (docs/history/lock-status-visibility/) and the shipped lock-status
// behaviour — not from `fgos doc-sources`, which returns capture metadata
// only for this path (verified by running it: count 1, no prose). This is
// exactly the class of failure D3 now prevents at the point of tagging: a
// docPath recorded with no file behind it.

const REGROWN_DOC_PATH = path.resolve(__dirname, '../../docs/how-to/check-main-checkout-lock-status-before-retrying.md');

test('the regrown document exists on disk at its recorded docPath', () => {
  assert.ok(fs.existsSync(REGROWN_DOC_PATH), `expected ${REGROWN_DOC_PATH} to exist — this is the one document tsk-5z2 recorded that was present in no commit at all`);
});

test('the regrown document is sourced from tsk-5z2\'s own decision record and the shipped lock-status behaviour, not fabricated', () => {
  const text = fs.readFileSync(REGROWN_DOC_PATH, 'utf8');
  assert.match(text, /source_capture_ids: \[tsk-5z2\]/, 'must attribute its source capture, same convention every other retrospective document already uses');
  assert.match(text, /fgos lock-status/, 'must document the real shipped verb tsk-5z2 added, not a placeholder');
  assert.match(text, /"outcome": "live"/, 'must include a real, run transcript excerpt (this session\'s own fgos lock-status --json output), not an invented example');
  for (const outcome of ['free', 'live', 'stale', 'ambiguous']) {
    assert.match(text, new RegExp(`\`${outcome}\``), `must document the "${outcome}" outcome — the real vocabulary inspectMainCheckoutLock returns, not a partial guess`);
  }
});
