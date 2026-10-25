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
import { parseSse, rolesCarrying, startRecorder, toolCallsIn } from '../../scripts/lib/mailbox-role-recorder.mjs';

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

test('the endpoint also serves the Anthropic Messages stream a pi provider on that API speaks: a bash tool call first, then the final text, and counts the calls of either shape', async () => {
  const dir = makeFixtureDir('mailbox-role-recorder-messages');
  const recorder = await startRecorder({ dir, textFor: () => 'the answer' });
  const send = async (messages) => {
    const res = await fetch(`${recorder.url}/v1/messages?beta=true`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': 'SECRET-NEVER-KEPT' }, body: JSON.stringify({ model: 'm', stream: true, messages }) });
    return { status: res.status, events: parseSse(await res.text()) };
  };
  try {
    const first = await send([{ role: 'user', content: 'hello' }]);
    assert.equal(first.status, 200);
    assert.deepEqual(first.events.map((e) => e.type), ['message_start', 'content_block_start', 'content_block_delta', 'content_block_stop', 'message_delta', 'message_stop']);
    const block = first.events[1].content_block;
    assert.deepEqual([block.type, block.name], ['tool_use', 'bash']);
    assert.deepEqual(JSON.parse(first.events[2].delta.partial_json), { command: 'ls' });
    assert.equal(first.events[4].delta.stop_reason, 'tool_use');
    const history = [{ role: 'user', content: 'hello' }, { role: 'assistant', content: [{ type: 'tool_use', id: block.id, name: 'bash', input: { command: 'ls' } }] }, { role: 'user', content: [{ type: 'tool_result', tool_use_id: block.id, content: 'a' }] }];
    const second = await send(history);
    assert.deepEqual([second.events[1].content_block.type, second.events[2].delta.text, second.events[4].delta.stop_reason], ['text', 'the answer', 'end_turn']);
    assert.ok(!fs.readFileSync(recorder.requests()[0], 'utf8').includes('SECRET-NEVER-KEPT'));
    assert.equal(toolCallsIn({ messages: history }), 1);
    assert.equal(toolCallsIn({ input: [{ type: 'function_call' }, { type: 'message' }, { type: 'function_call' }] }), 2);
  } finally {
    await recorder.close();
  }
});

test('the endpoint also serves the Cloud Code Assist stream omp\'s Gemini provider speaks: a bash function call first, then the final text, and counts its calls', async () => {
  const dir = makeFixtureDir('mailbox-role-recorder-gemini');
  const recorder = await startRecorder({ dir, textFor: () => 'the answer' });
  const send = async (contents) => {
    const res = await fetch(`${recorder.url}/v1internal:streamGenerateContent?alt=sse`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer SECRET-NEVER-KEPT' }, body: JSON.stringify({ model: 'gemini-x', request: { contents } }) });
    return { status: res.status, events: parseSse(await res.text()) };
  };
  try {
    const first = await send([{ role: 'user', parts: [{ text: 'hello' }] }]);
    assert.equal(first.status, 200);
    const part = first.events.at(-1).response.candidates[0].content.parts[0];
    assert.deepEqual(part.functionCall, { name: 'bash', args: { command: 'ls' } });
    const history = [{ role: 'user', parts: [{ text: 'hello' }] }, { role: 'model', parts: [part] }, { role: 'user', parts: [{ functionResponse: { name: 'bash', response: { output: 'a' } } }] }];
    const second = await send(history);
    assert.equal(second.events.at(-1).response.candidates[0].content.parts[0].text, 'the answer');
    assert.equal(second.events.at(-1).response.candidates[0].finishReason, 'STOP');
    assert.equal(toolCallsIn({ request: { contents: history } }), 1);
    assert.ok(!fs.readFileSync(recorder.requests()[0], 'utf8').includes('SECRET-NEVER-KEPT'));
  } finally {
    await recorder.close();
  }
});
