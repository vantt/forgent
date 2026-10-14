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

  test(`${surface}/_shared/capability-matching ad-hoc delegation leads with the one-liner`, () => {
    const adhoc = section(read(`${surface}/_shared/capability-matching.md`), '## Ad-hoc one-shot delegation');
    assert.ok(adhoc.includes('fgos run "'), 'one-liner missing');
    assert.ok(adhoc.indexOf('fgos run "') < adhoc.indexOf('execute <executor>'), 'one-liner is not the first choice');
    assert.ok(!adhoc.includes('plans and Units still never pin one'), 'stale "Units never pin" sentence');
  });
}
