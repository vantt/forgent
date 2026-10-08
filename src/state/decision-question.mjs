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
