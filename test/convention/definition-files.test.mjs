// The file names of workflow and persona definitions are Convention's: the Rust crate and this reader
// load the same contract entries and run the same golden vectors.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { definitionNameOf, definitionFileName } from '../../src/convention/definition-names.mjs';

const golden = JSON.parse(fs.readFileSync(new URL('../../packages/convention/contracts/convention.golden.v1.json', import.meta.url), 'utf8'));

test('the shared golden vectors give the same answer here as in the Rust crate', () => {
  assert.ok(golden.definitionFileCases.length >= 10);
  for (const { rule, fileName, expectedName } of golden.definitionFileCases) {
    assert.equal(definitionNameOf(rule, fileName), expectedName, `${rule} ${fileName}`);
  }
});

test('a file name built from a valid name reads back to that name, and an invalid name is refused', () => {
  assert.equal(definitionFileName('workflow-file', 'council-lite'), 'wf.council-lite.yaml');
  assert.equal(definitionFileName('agent-file', 'critic'), 'agent.critic.yaml');
  assert.equal(definitionNameOf('agent-file', definitionFileName('agent-file', 'critic')), 'critic');
  assert.throws(() => definitionFileName('agent-file', '../critic'), /not a valid agent-name/);
});
