import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// The attention definitions the host's `dispatch inspect --attention` measures ship as data under
// core/attention/definitions; the view itself is the host's (apps/fgos/src/wiring/dispatch_subs/inspect.rs).
const ATTENTION_DEFINITIONS = new URL('../../core/attention/definitions', import.meta.url).pathname;

test('the shipped attention definitions are named by their file and carry the row they raise', () => {
  const files = fs.readdirSync(ATTENTION_DEFINITIONS).filter((f) => f.endsWith('.query.json')).sort();
  assert.deepEqual(files, ['head-gone.query.json', 'plan-no-progress.query.json']);
  for (const f of files) {
    const def = JSON.parse(fs.readFileSync(path.join(ATTENTION_DEFINITIONS, f), 'utf8'));
    assert.equal(`${def.name}.query.json`, f);
    assert.equal(def.row.kind, def.name);
    assert.ok(def.query.by.includes('subject.id'), 'the row subject comes from the group');
  }
});
