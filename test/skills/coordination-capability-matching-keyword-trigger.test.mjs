// test/skills/coordination-capability-matching-keyword-trigger.test.mjs
// Unit I34 (Phase 7 item 5, 10th drift check): every runtime skill that
// dispatches and links `_shared/capability-matching.md` must never trigger
// on bare keyword matching of "implement"/"code" (the I17 trigger-reversal
// bug this doctrine replaced -- a skill must select via declared
// `DemandFacts` + `fgos capability match --demand`, never because the
// user's text happened to contain the word "implement" or "code").

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

// The full set of canonical runtime skills that link capability-matching.md
// (confirmed by direct grep of core/skills/**/SKILL.md and
// domains/*/skills/**/SKILL.md -- not inherited secondhand from another
// unit's context).
const SKILLS_LINKING_CAPABILITY_MATCHING = [
  path.join(REPO_ROOT, 'core/skills/fgos-panel/SKILL.md'),
  path.join(REPO_ROOT, 'core/skills/fgos-capability-dispatching/SKILL.md'),
  path.join(REPO_ROOT, 'core/skills/fgos-architecture-panel/SKILL.md'),
  path.join(REPO_ROOT, 'domains/coding/skills/fgos-code-change/SKILL.md'),
];

function isNegativeInstruction(text) {
  return /\b(?:do\s+not|don't|never|must\s+not|cannot|not\s+for|not\s+a\b|not\s+only|instead\s+of|no\s+keyword)\b/i.test(text);
}

// The I17 trigger-reversal shape: an AFFIRMATIVE statement that ties skill
// selection directly to the literal appearance of "implement"/"code" in the
// user's own words, bypassing DemandFacts/capability match entirely.
const KEYWORD_REVERSAL_PATTERN =
  /\b(?:when|if|whenever)\b[^.!?\n]{0,80}\b(?:user|person|someone|they)\b[^.!?\n]{0,80}\b(?:says?|types?|mentions?|asks?|writes?)\b[^.!?\n]{0,40}["'`]?\b(?:implement|code)\b/i;

function splitStatements(content) {
  return content
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

for (const skillPath of SKILLS_LINKING_CAPABILITY_MATCHING) {
  const name = path.basename(path.dirname(skillPath));

  test(`${name}/SKILL.md links capability-matching.md`, () => {
    assert.ok(fs.existsSync(skillPath), `${skillPath} must exist`);
    const content = fs.readFileSync(skillPath, 'utf8');
    assert.match(
      content,
      /capability-matching\.md/,
      `${name}/SKILL.md must link capability-matching.md`,
    );
  });

  test(`${name}/SKILL.md never affirmatively triggers on the user saying "implement"/"code" (I17 trigger reversal)`, () => {
    const content = fs.readFileSync(skillPath, 'utf8');
    for (const statement of splitStatements(content)) {
      if (isNegativeInstruction(statement)) continue;
      assert.doesNotMatch(
        statement,
        KEYWORD_REVERSAL_PATTERN,
        `${name}/SKILL.md contains an affirmative keyword-trigger statement: "${statement}"`,
      );
    }
  });
}
