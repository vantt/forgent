import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runHook } from '../../src/runner/hook.mjs';

// The verdict of the AskUserQuestion guard against a real JSONL transcript, for each payload format: the standard
// one carries a transcript path, agy's carries none, and both are checked by the same function.

const ANALYSIS = [
  '1. **Chuyện gì đang xảy ra:** the live gate is blocked by a provider trust dialog.',
  '2. **Nguyên nhân:** the diagnosis shows TERM=dumb makes Codex ask again.',
  '3. **Các lựa chọn:** (a) patch dispatch, ~200 lines; (b) file a separate item.',
  '4. **Khuyến nghị:** (b), because dispatch is outside this plan.',
  '5. **Phạm vi của câu trả lời:** yes only files the item; no src edits.',
].join('\n');

function transcript(lines) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'decision-question-hook-')), 't.jsonl');
  fs.writeFileSync(file, lines.map((line) => JSON.stringify(line)).join('\n'));
  return file;
}

const ask = (question) => ({ questions: [{ question, options: [{ label: 'a', description: 'patch' }, { label: 'b', description: 'item' }] }] });

const FORMATS = {
  standard: {
    format: null,
    payload: (tool, input, transcriptPath) => ({ tool_name: tool, tool_input: input, ...(transcriptPath ? { transcript_path: transcriptPath } : {}) }),
    blocked: (out) => { assert.equal(out.stdout, ''); return out.exitCode === 2 ? out.stderr : null; },
  },
  agy: {
    format: 'agy',
    payload: (tool, input) => ({ toolCall: { name: tool, args: input }, workspacePaths: ['/workspace'] }),
    blocked: (out) => { assert.equal(out.exitCode, 0); const d = JSON.parse(out.stdout.trim()); return d.decision === 'deny' ? d.reason : null; },
  },
};

/** The text the agent is told when blocked, or null when the call passes. */
async function judge(name, tool, input, transcriptPath) {
  const f = FORMATS[name];
  return f.blocked(await runHook('decision-question', { stdin: JSON.stringify(f.payload(tool, input, transcriptPath)), format: f.format, env: {}, cwd: '/tmp' }));
}

for (const name of Object.keys(FORMATS)) {
  test(`decision-question hook, ${name} format: a bare "what do you want" question is blocked and the template is printed`, async () => {
    const reason = await judge(name, 'AskUserQuestion', ask('Câu 1: xử lý work.tier thế nào?'));
    assert.match(reason, /Phạm vi của câu trả lời/);
    assert.match(reason, /Missing parts of the decision-question template/);
  });

  test(`decision-question hook, ${name} format: a question that carries the five parts itself passes`, async () => {
    assert.equal(await judge(name, 'AskUserQuestion', ask(ANALYSIS)), null);
  });

  test(`decision-question hook, ${name} format: other tools and a payload that is not JSON pass through`, async () => {
    assert.equal(await judge(name, 'Bash', { command: 'ls' }), null);
    const f = FORMATS[name];
    const out = await runHook('decision-question', { stdin: 'not json', format: f.format, env: {}, cwd: '/tmp' });
    assert.equal(f.blocked(out), null);
  });
}

test('decision-question hook, standard format: this turn already wrote the five-part analysis before the question', async () => {
  const file = transcript([
    { type: 'user', message: { content: 'what now?' } },
    { type: 'assistant', message: { content: [{ type: 'text', text: ANALYSIS }] } },
  ]);
  assert.equal(await judge('standard', 'AskUserQuestion', ask('Which option?'), file), null);
});

test('decision-question hook, standard format: meta entries and background-task notifications do not cut the turn', async () => {
  const file = transcript([
    { type: 'user', message: { content: 'what now?' } },
    { type: 'assistant', message: { content: [{ type: 'text', text: ANALYSIS }] } },
    { type: 'user', message: { content: '<task-notification>agent finished</task-notification>' } },
    { type: 'user', isMeta: true, message: { content: 'skill body' } },
  ]);
  assert.equal(await judge('standard', 'AskUserQuestion', ask('Which option?'), file), null);
});

test('decision-question hook, standard format: analysis written before the owner\'s last message does not count', async () => {
  const file = transcript([
    { type: 'assistant', message: { content: [{ type: 'text', text: ANALYSIS }] } },
    { type: 'user', message: { content: 'next topic' } },
  ]);
  assert.match(await judge('standard', 'AskUserQuestion', ask('Câu 1: xử lý work.tier thế nào?'), file), /Phạm vi của câu trả lời/);
});

test('decision-question hook, standard format: an unreadable transcript still checks the question itself', async () => {
  assert.notEqual(await judge('standard', 'AskUserQuestion', ask('Which option?'), '/nonexistent/t.jsonl'), null);
  assert.equal(await judge('standard', 'AskUserQuestion', ask(ANALYSIS), '/nonexistent/t.jsonl'), null);
});

test('hook entry script: a legacy registration that names the script gets the same verdict as fgos hook decision-question', () => {
  const script = fileURLToPath(new URL('../../scripts/decision-question-hook.mjs', import.meta.url));
  // boundary: the script is only an entry; its exit code and stream are what a registered harness reads
  const blocked = spawnSync(process.execPath, [script], { encoding: 'utf8', input: JSON.stringify({ tool_name: 'AskUserQuestion', tool_input: ask('Which option?') }) });
  assert.equal(blocked.status, 2);
  assert.match(blocked.stderr, /BLOCKED: write the analysis before asking/);
});
