import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The always-loaded layer and the rendered skills teach the two doors of one
// runUnit: `fgos run "<prompt>"` for one task, `fgos workflow start --units`
// for planned work. A one-off Unit may carry a soft `prefer`; presets and
// plans still never pin a provider.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

function section(text, heading) {
  const start = text.indexOf(heading);
  assert.ok(start >= 0, `missing section "${heading}"`);
  const rest = text.slice(start + heading.length);
  const next = rest.search(/\n#{1,2} /);
  return next < 0 ? rest : rest.slice(0, next);
}

test('AGENTS.md Dispatch teaches both doors of one runUnit as the preferred path', () => {
  const dispatch = section(read('AGENTS.md'), '## Dispatch');
  assert.ok(dispatch.includes('fgos run "<prompt>"'), 'one-liner door missing');
  assert.ok(dispatch.includes('fgos workflow start <preset>|--units <file>'), 'planned-work door missing');
  assert.match(dispatch, /runner commits/i);
});

for (const surface of ['core/skills', '.agents/skills', 'plugins/fgOS/skills']) {
  test(`${surface}/fgos-run teaches the one-liner and --units, and lets an ad-hoc Unit prefer`, () => {
    const skill = read(`${surface}/fgos-run/SKILL.md`);
    assert.ok(skill.includes('fgos run "'), 'one-liner missing');
    assert.ok(skill.includes('fgos workflow start --units'), '--units missing');
    const g2 = skill.split('\n').find((line) => line.includes('G2'));
    assert.ok(g2, 'G2 invariant missing');
    assert.doesNotMatch(g2, /Units[^.]*MUST NOT pin[^.]*providers/);
    assert.match(g2, /prefer/);
  });

  test(`${surface}/_shared/capability-matching ad-hoc delegation runs through the one-liner, provider soft`, () => {
    const adhoc = section(read(`${surface}/_shared/capability-matching.md`), '## Ad-hoc one-shot delegation');
    assert.ok(adhoc.includes('fgos run "'), 'one-liner missing');
    assert.ok(adhoc.includes('--writes'), 'write scope missing');
    assert.match(adhoc, /--provider[^.]*soft preference/, 'provider is not taught as a soft preference');
    assert.ok(!adhoc.includes('plans and Units still never pin one'), 'stale "Units never pin" sentence');
  });
}

// The raw dispatch doors are gone: `dispatch execute` (with `--contract` and
// `--assignment`), `dispatch log` and `dispatch fanout-batch`. Neither the
// always-loaded layer nor any skill source or render may still teach them,
// and `decide --work` runs only through `fgos dispatch decide`.
const REMOVED_DOOR_PATTERNS = [
  /dispatch\.mjs"?\s+(execute|log|fanout-batch)\b/,
  /\bdispatch (execute|log|fanout-batch)\b/,
  /\bexecute [a-z][\w-]* --for\b/,
  /--contract\b/,
  /\bexecute <(executor|agent|EXECUTOR_ID|executorId)/i,
  /dispatch\.mjs"?\s+decide --work/,
];

function doctrineFiles(rel) {
  const abs = path.join(repoRoot, rel);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isFile()) return [rel];
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const child = path.join(rel, entry.name);
    if (entry.isDirectory()) out.push(...doctrineFiles(child));
    else if (/\.(md|txt|ya?ml)$/.test(entry.name)) out.push(child);
  }
  return out;
}

for (const surface of ['AGENTS.md', 'core/skills', 'core/instructions', 'core/prompt-templates', 'domains', '.agents/skills', 'plugins/fgOS/skills', '.claude/skills']) {
  test(`${surface} teaches no removed dispatch door`, () => {
    const hits = [];
    for (const file of doctrineFiles(surface)) {
      read(file).split('\n').forEach((line, i) => {
        if (REMOVED_DOOR_PATTERNS.some((re) => re.test(line))) hits.push(`${file}:${i + 1}: ${line.trim().slice(0, 160)}`);
      });
    }
    assert.deepEqual(hits, [], `removed dispatch doors still taught:\n${hits.join('\n')}`);
  });
}
