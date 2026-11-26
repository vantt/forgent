import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const agentsLines = fs.readFileSync(path.join(repoRoot, 'AGENTS.md'), 'utf8').split('\n');

const anchors = [
  {
    unit: 'core/instructions/convention-paths.md',
    command: 'fgos convention name|path --json',
    required: ['paths placed in briefs', 'parallel agents MUST choose distinct slugs'],
  },
  {
    unit: 'core/instructions/writes-to-main.md',
    command: 'Land on main only what another session must rely on later',
    required: ['a settled decision', 'a plan status change', 'never a wake or progress report', 'a discussion round'],
  },
];

// Each line is owned by one rule unit and reaches AGENTS.md through the projection of the compiled rule set.
for (const anchor of anchors) {
  test(`AGENTS.md keeps ${anchor.command} guidance on one always-loaded line, owned by ${anchor.unit}`, () => {
    const body = fs.readFileSync(path.join(repoRoot, anchor.unit), 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
    const unitLines = body.split('\n').filter((line) => line.includes(anchor.command));
    assert.equal(unitLines.length, 1, `${anchor.unit} must hold the line once`);
    const matches = agentsLines.filter((line) => line.includes(anchor.command));
    assert.equal(matches.length, 1);
    assert.equal(matches[0], unitLines[0], 'AGENTS.md must render the unit line unchanged');
    for (const phrase of anchor.required) assert.ok(matches[0].includes(phrase), `missing "${phrase}"`);
  });
}
