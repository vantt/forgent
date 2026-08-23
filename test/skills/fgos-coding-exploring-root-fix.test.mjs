import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// tsk-5iv D4 (round-3 review, MEDIUM): tsk-59a's own `fgos add` example in
// fgos-coding-exploring/SKILL.md used `--dir "$root"` with no `root=` assignment
// anywhere in that fenced code block — the exact bare-`$root` defect that
// same commit fixed next door in fgos-coding-planning/SKILL.md. Proves the
// assignment now lives INSIDE the same fenced block as the `fgos add`
// call (copy-pasting just that block must actually run), not merely
// somewhere earlier in the file.
//
// tsk-1qi: reads .agents/skills, the canonical source (D5) — .claude/skills
// is now a generated thin wrapper with no prose content of its own to check.
//
// tsk-56w-3: the skill-creator SKILL.md/references split moved this
// example out of SKILL.md itself into references/lock-decisions-and-
// write-context.md (the Step 2/3 mechanics file) — same fenced block,
// same defect class to guard, new location.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_PATH = path.resolve(__dirname, '../../.agents/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md');
const skillText = fs.readFileSync(SKILL_PATH, 'utf8');

function fencedBlockContaining(marker) {
  const markerIndex = skillText.indexOf(marker);
  assert.ok(markerIndex >= 0, `expected to find "${marker}" in ${SKILL_PATH}`);
  const blockStart = skillText.lastIndexOf('```bash', markerIndex);
  const blockEnd = skillText.indexOf('```', markerIndex);
  assert.ok(blockStart >= 0 && blockStart < markerIndex, `expected "${marker}" to sit inside a \`\`\`bash fenced block`);
  return skillText.slice(blockStart, blockEnd);
}

test('fgos-coding-exploring\'s "fgos add" example uses a flat fgos add command without needing explicit --dir', () => {
  const block = fencedBlockContaining('fgos add --title');
  assert.match(
    block,
    /fgos add --title "<title>"/,
    'the example must use flat fgos add without root=$(git rev-parse...)',
  );
  assert.doesNotMatch(block, /root=\$\(git rev-parse/);
});
