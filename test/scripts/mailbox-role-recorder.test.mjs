// mailbox-role-recorder.test.mjs — the recording endpoint of the pi/omp role probes
// (scripts/lib/mailbox-role-recorder.mjs): a harness instrument, not a model. It keeps each
// request body in a 0600 file inside the run directory and serves a scripted exchange in the
// OpenAI Responses stream shape: a tool call running `ls` first, then a final text.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { parseSse, rolesCarrying, startRecorder } from '../../scripts/lib/mailbox-role-recorder.mjs';

const post = async (url, body) => {
  const res = await fetch(`${url}/codex/responses`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer SECRET-NEVER-KEPT' }, body: JSON.stringify(body) });
  return { status: res.status, events: parseSse(await res.text()) };
};

test('the recording endpoint writes each request body to a 0600 file in the run directory and serves the scripted turns', async () => {
  const dir = makeFixtureDir('mailbox-role-recorder');
  const recorder = await startRecorder({ dir });
  try {
    assert.match(recorder.url, /^http:\/\/127\.0\.0\.1:\d+$/);
    // Turn 1: no tool call in the input yet, so the reply is one function call running ls.
    const first = await post(recorder.url, { model: 'm', input: [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: 'hello' }] }] });
    assert.equal(first.status, 200);
    const call = first.events.find((e) => e.type === 'response.output_item.done').item;
    assert.equal(call.type, 'function_call');
    assert.deepEqual(JSON.parse(call.arguments), { command: 'ls' });
    assert.equal(first.events.at(-1).type, 'response.completed');
    // Turn 2: the input holds the call and its output, so the reply is the final text.
    const second = await post(recorder.url, { model: 'm', input: [{ type: 'function_call', call_id: call.call_id, name: 'bash', arguments: '{"command":"ls"}' }, { type: 'function_call_output', call_id: call.call_id, output: 'a\n' }, { type: 'message', role: 'developer', content: [{ type: 'input_text', text: 'MARK-1' }] }] });
    const text = second.events.find((e) => e.type === 'response.output_item.done').item;
    assert.equal(text.type, 'message');
    assert.equal(text.content[0].text, 'done');

    const files = recorder.requests();
    assert.equal(files.length, 2);
    for (const file of files) {
      assert.equal(path.dirname(file), dir);
      assert.equal(fs.statSync(file).mode & 0o777, 0o600);
    }
    const kept = JSON.parse(fs.readFileSync(files[1], 'utf8'));
    assert.equal(kept.path, '/codex/responses');
    assert.deepEqual(kept.body.input.at(-1).content[0].text, 'MARK-1');
    // The request's credentials are never kept: header names only.
    assert.ok(!fs.readFileSync(files[0], 'utf8').includes('SECRET-NEVER-KEPT'));
    assert.ok(kept.headerNames.includes('authorization'));
    // The role table reads the role that carried a marker in each request.
    assert.deepEqual(rolesCarrying(files.map((f) => JSON.parse(fs.readFileSync(f, 'utf8'))), 'MARK-1'), [{ request: 2, carriers: ['message:developer'] }]);
    // A compressed body (the Codex providers send zstd) is kept decoded.
    const zipped = zlib.zstdCompressSync(Buffer.from(JSON.stringify({ input: [{ type: 'message', role: 'user', content: 'MARK-Z' }] })));
    await fetch(`${recorder.url}/codex/responses`, { method: 'POST', headers: { 'content-type': 'application/json', 'content-encoding': 'zstd' }, body: zipped }).then((r) => r.text());
    assert.deepEqual(rolesCarrying([JSON.parse(fs.readFileSync(recorder.requests()[2], 'utf8'))], 'MARK-Z'), [{ request: 1, carriers: ['message:user'] }]);
  } finally {
    await recorder.close();
  }
});
