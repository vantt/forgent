import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Real runs of the hook script against a real JSONL transcript.

const hookPath = fileURLToPath(new URL('../../scripts/decision-question-hook.mjs', import.meta.url));
const ANALYSIS = [
  '1. **Chuyện gì đang xảy ra:** the live gate is blocked by a provider trust dialog.',
  '2. **Nguyên nhân:** the diagnosis shows TERM=dumb makes Codex ask again.',
  '3. **Các lựa chọn:** (a) patch dispatch, ~200 lines; (b) file a separate item.',
  '4. **Khuyến nghị:** (b), because dispatch is outside this plan.',
  '5. **Phạm vi của câu trả lời:** yes only files the item; no src edits.',
].join('\n');

function runHook(payload) {
  return spawnSync(process.execPath, [hookPath], { encoding: 'utf8', input: JSON.stringify(payload) });
}

function transcript(lines) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'decision-question-hook-')), 't.jsonl');
  fs.writeFileSync(file, lines.map((line) => JSON.stringify(line)).join('\n'));
  return file;
}

const ask = (question) => ({ questions: [{ question, options: [{ label: 'a', description: 'patch' }, { label: 'b', description: 'item' }] }] });

test('passes when this turn already wrote the five-part analysis before the question', () => {
  const file = transcript([
    { type: 'user', message: { content: 'what now?' } },
    { type: 'assistant', message: { content: [{ type: 'text', text: ANALYSIS }] } },
  ]);
  const result = runHook({ tool_name: 'AskUserQuestion', transcript_path: file, tool_input: ask('Which option?') });
  assert.equal(result.status, 0, result.stderr);
});

test('blocks a bare "what do you want" question and prints the template', () => {
  const file = transcript([
    { type: 'assistant', message: { content: [{ type: 'text', text: ANALYSIS }] } },
    { type: 'user', message: { content: 'next topic' } },
  ]);
  const result = runHook({ tool_name: 'AskUserQuestion', transcript_path: file, tool_input: ask('Câu 1: xử lý work.tier thế nào?') });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Phạm vi của câu trả lời/);
});

test('an unreadable transcript still checks the question itself', () => {
  const blocked = runHook({ tool_name: 'AskUserQuestion', transcript_path: '/nonexistent/t.jsonl', tool_input: ask('Which option?') });
  assert.equal(blocked.status, 2);
  const passed = runHook({ tool_name: 'AskUserQuestion', transcript_path: '/nonexistent/t.jsonl', tool_input: ask(ANALYSIS) });
  assert.equal(passed.status, 0, passed.stderr);
});

test('other tools and malformed input pass through', () => {
  assert.equal(runHook({ tool_name: 'Bash', tool_input: { command: 'ls' } }).status, 0);
  assert.equal(spawnSync(process.execPath, [hookPath], { encoding: 'utf8', input: 'not json' }).status, 0);
});
