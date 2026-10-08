#!/usr/bin/env node
// PreToolUse hook for AskUserQuestion: the question the owner sees, together
// with the analysis written in this turn before it, must carry the five parts
// of the decision-question template (core/skills/_shared/decision-question.md).
// The check itself is src/state/decision-question.mjs, the same one `fgos ask`
// uses; this file only gathers the text.
//
// Fails open on unreadable stdin, like dispatch-decide-hook.mjs. An
// unreadable transcript is not a reason to pass: the question and option
// descriptions are still checked on their own.

import fs from 'node:fs';
import { checkDecisionQuestion, describeDecisionQuestion } from '../src/state/decision-question.mjs';

const TRANSCRIPT_TAIL_BYTES = 256 * 1024;

function readTail(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const size = fs.fstatSync(fd).size;
    const length = Math.min(size, TRANSCRIPT_TAIL_BYTES);
    const buffer = Buffer.alloc(length);
    fs.readSync(fd, buffer, 0, length, size - length);
    return buffer.toString('utf8');
  } finally {
    fs.closeSync(fd);
  }
}

// Assistant text written since the owner's last real message (tool results
// also arrive as user entries, so those do not end the turn).
function textOfThisTurn(transcriptPath) {
  const texts = [];
  for (const line of readTail(transcriptPath).split('\n').reverse()) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const content = entry?.message?.content;
    if (entry.type === 'user') {
      const isToolResult = Array.isArray(content) && content.every((block) => block?.type === 'tool_result');
      if (!isToolResult) break;
    } else if (entry.type === 'assistant' && Array.isArray(content)) {
      for (const block of content) if (block?.type === 'text' && block.text) texts.unshift(block.text);
    }
  }
  return texts.join('\n');
}

function missingParts(data) {
  if (data?.tool_name !== 'AskUserQuestion') return [];
  const questions = Array.isArray(data.tool_input?.questions) ? data.tool_input.questions : [];
  const parts = questions.flatMap((q) => [q?.question, ...(Array.isArray(q?.options) ? q.options.map((o) => `${o?.label ?? ''}: ${o?.description ?? ''}`) : [])]);
  let turnText = '';
  try {
    if (typeof data.transcript_path === 'string') turnText = textOfThisTurn(data.transcript_path);
  } catch {
    turnText = '';
  }
  return checkDecisionQuestion([turnText, ...parts].filter(Boolean).join('\n'));
}

let missing = [];
try {
  missing = missingParts(JSON.parse(fs.readFileSync(0, 'utf8')));
} catch {
  missing = [];
}
if (missing.length > 0) {
  process.stderr.write(
    `BLOCKED: write the analysis before asking. Missing parts of the decision-question template: ${missing.map((part) => part.title).join(', ')}. ` +
      `Write each as a labeled part in your message (or in the question), then ask again:\n${describeDecisionQuestion()}\n`,
  );
  process.exit(2);
}
process.exit(0);
