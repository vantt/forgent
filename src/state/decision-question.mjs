// The one check for every door that asks the owner to decide: the `fgos ask`
// validator (status-fsm.mjs) and the AskUserQuestion hook both call it, so
// the rule is written once. The full template lives in
// core/skills/_shared/decision-question.md.
//
// A part is found by a label line: a Markdown heading ("## Nguyên nhân"), or
// a line whose label is followed by ":" or a dash ("2. **Cause:** ..."), so a
// sentence that merely starts with the word ("Lựa chọn (a) rẻ hơn") does not
// open a part. Its content runs until the next label line; echoing a part's
// hint does not count as content. Labels are compared after
// NFC normalisation with a letter-boundary check instead of `\b`, which only
// understands ASCII and so never matches a Vietnamese word like "nghị".

import fs from 'node:fs';

export const DECISION_QUESTION_PARTS = [
  { key: 'happening', title: 'Chuyện gì đang xảy ra', hint: '1-2 câu, ngôn ngữ thường', labels: ['chuyện gì đang xảy ra', 'chuyện gì', 'what is happening'] },
  { key: 'cause', title: 'Nguyên nhân', hint: 'đã kiểm bằng gì; chưa biết nguyên nhân thì chỉ xin phép điều tra', labels: ['nguyên nhân', 'cause'] },
  { key: 'options', title: 'Các lựa chọn', hint: '2-4 lựa chọn, mỗi cái: làm gì, lợi, hại, giá (dòng code, thời gian, tầng bị đụng)', labels: ['các lựa chọn', 'lựa chọn', 'options'] },
  { key: 'recommendation', title: 'Khuyến nghị', hint: 'chọn cái nào, vì sao', labels: ['khuyến nghị', 'recommendation'] },
  { key: 'scope', title: 'Phạm vi của câu trả lời', hint: 'đồng ý thì được làm gì, và không được làm gì', labels: ['phạm vi của câu trả lời', 'phạm vi', 'scope of the answer', 'scope'] },
];

const ALL_KEYS = DECISION_QUESTION_PARTS.map((part) => part.key);
// Discovery-shaped stages ask open questions whose options are not known
// yet, so only the parts every question shares are required there.
const DISCOVERY_STAGES = new Set(['discovery', 'exploring']);
const DISCOVERY_KEYS = ['happening', 'cause', 'scope'];
const MIN_PART_CONTENT = 20;
const LETTER = /\p{L}/u;

export function requiredPartsForStage(stage) {
  return DISCOVERY_STAGES.has(stage) ? DISCOVERY_KEYS : ALL_KEYS;
}

function normalize(text) {
  return text.normalize('NFC').toLowerCase();
}

function stripMarkers(line) {
  return line.replace(/^[\s>#*_\-+]*(?:\d+[.)]\s*)?[\s*_]*/u, '');
}

function matchLabel(line) {
  const isHeading = /^\s*#/.test(line);
  const bare = normalize(stripMarkers(line));
  for (const part of DECISION_QUESTION_PARTS) {
    for (const label of part.labels) {
      if (!bare.startsWith(label)) continue;
      const after = bare.slice(label.length).replace(/^[*_]+/u, '');
      if (LETTER.test(after.charAt(0))) continue;
      if (isHeading || after.trim() === '' || /^\s*[:—–-]/u.test(after)) {
        return { key: part.key, rest: after.replace(/^[\s*_:\-—–]+/u, '') };
      }
    }
  }
  return null;
}

/** Returns the parts (from `required`) that are absent or under 20 characters. */
export function checkDecisionQuestion(text, required = ALL_KEYS) {
  const content = {};
  let current = null;
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const label = matchLabel(line);
    if (label) {
      current = label.key;
      content[current] = (content[current] ?? '') + label.rest;
    } else if (current) {
      content[current] += `\n${line}`;
    }
  }
  return DECISION_QUESTION_PARTS.filter(
    (part) =>
      required.includes(part.key) &&
      (content[part.key] ?? '').replace(normalize(part.hint), '').trim().length < MIN_PART_CONTENT,
  );
}

/** The template for `required`, used in error messages so any reader learns it. */
export function describeDecisionQuestion(required = ALL_KEYS) {
  return DECISION_QUESTION_PARTS.filter((part) => required.includes(part.key))
    .map((part) => `## ${part.title} — ${part.hint}`)
    .join('\n');
}

/** Renders the given parts as Markdown under their canonical headings. */
export function formatDecisionQuestion(parts) {
  return DECISION_QUESTION_PARTS.filter((part) => parts[part.key])
    .map((part) => `## ${part.title}\n\n${parts[part.key]}`)
    .join('\n\n');
}

const QUESTION_TOOL_NAMES = new Set(['AskUserQuestion', 'ask', 'ask_question']);
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

// Assistant text written since the owner's last real message. Tool results, meta entries (skill bodies,
// command caveats) and background-task notifications also arrive as user entries; they do not end the turn.
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
      const isNotification = typeof content === 'string' && content.trimStart().startsWith('<task-notification>');
      if (!isToolResult && !entry.isMeta && !isNotification) break;
    } else if (entry.type === 'assistant' && Array.isArray(content)) {
      for (const block of content) if (block?.type === 'text' && block.text) texts.unshift(block.text);
    }
  }
  return texts.join('\n');
}

/**
 * The verdict of the AskUserQuestion hook for a normalized call `{ toolName, toolInput, transcriptPath }`: the
 * question the owner sees, with its options (part 3) and the analysis written in this turn before it, must carry
 * the five parts. An unreadable transcript is not a reason to pass: the question and options are still checked.
 */
export function decisionQuestionHookVerdict({ toolName, toolInput, transcriptPath }) {
  if (!QUESTION_TOOL_NAMES.has(toolName)) return { blocked: false };
  const questions = Array.isArray(toolInput?.questions) ? toolInput.questions : [];
  const parts = questions.flatMap((q) => [
    q?.question,
    Array.isArray(q?.options) && q.options.length > 0 ? `Options:\n${q.options.map((o) => `- ${o?.label ?? ''}: ${o?.description ?? ''}`).join('\n')}` : '',
  ]);
  let turnText = '';
  try {
    if (transcriptPath) turnText = textOfThisTurn(transcriptPath);
  } catch {
    turnText = '';
  }
  const missing = checkDecisionQuestion([turnText, ...parts].filter(Boolean).join('\n'));
  if (missing.length === 0) return { blocked: false };
  return {
    blocked: true,
    reason:
      `write the analysis before asking. Missing parts of the decision-question template: ${missing.map((part) => part.title).join(', ')}. ` +
      `Write each as a labeled part in your message (or in the question), then ask again:\n${describeDecisionQuestion()}`,
  };
}
