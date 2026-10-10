import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const agentsLines = fs.readFileSync(path.join(repoRoot, 'AGENTS.md'), 'utf8').split('\n');

const anchors = [
  {
    command: 'fgos convention name|path --json',
    required: ['paths placed in briefs', 'parallel agents MUST choose distinct slugs'],
  },
];

for (const anchor of anchors) {
  test(`AGENTS.md keeps ${anchor.command} guidance on one always-loaded line`, () => {
    const matches = agentsLines.filter((line) => line.includes(anchor.command));
    assert.equal(matches.length, 1);
    for (const phrase of anchor.required) assert.ok(matches[0].includes(phrase), `missing "${phrase}"`);
  });
}
