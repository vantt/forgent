// open-questions.mjs -- every open owner question across the three stage places, read-only.
//
// A question waits in the place of the stage it belongs to: a discussion (`docs/discussions/<topic>/QUESTIONS.md`),
// a plan still `draft` (its owner-questions section), or a running Workflow case (an open gate). The three stores
// stay apart; this reader only lists them side by side, each item carrying the door that answers it in its own stage.
import fs from 'node:fs';
import path from 'node:path';
import { readFrontmatter, YamlParseError } from '../util/yaml.mjs';
import { runsRoot, isCaseId } from '../runner/execution/case-run-paths.mjs';
import { readCaseProjection } from '../workflow/case-projection.mjs';
import { sectionText } from './plan-sections.mjs';

/** The stages in the order a question travels. */
export const QUESTION_STAGES = Object.freeze(['discussion', 'plan', 'execution']);

const NONE = /^(?:[-*]\s*)?(?:none|n\/a|—|-)\.?$/i;
const rel = (root, file) => path.relative(root, file).split(path.sep).join('/');
const dirsOf = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort() : []);
const cells = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));

/** The `open` rows of one QUESTIONS.md as `{ id, question }`. */
function discussionRows(text) {
  const rows = [];
  let header = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trimStart().startsWith('|')) { header = null; continue; }
    const c = cells(line);
    if (!header) { header = c.map((h) => h.toLowerCase()); continue; }
    if (c.every((x) => /^:?-{2,}:?$/.test(x))) continue;
    const at = (name) => c[header.indexOf(name)] ?? '';
    if (header.includes('id') && header.includes('status') && at('status').toLowerCase() === 'open' && at('question')) {
      rows.push({ id: at('id'), question: at('question') });
    }
  }
  return rows;
}

function discussionQuestions(root) {
  const base = path.join(root, 'docs', 'discussions');
  return dirsOf(base).flatMap((topic) => {
    const file = path.join(base, topic, 'QUESTIONS.md');
    if (!fs.existsSync(file)) return [];
    return discussionRows(fs.readFileSync(file, 'utf8')).map(({ id, question }) => ({
      topic, stage: 'discussion', ref: `${rel(root, file)}#${id}`, question,
      answerDoor: `answer the row in ${rel(root, file)} (fgos-shaping records the outcome)`,
    }));
  });
}

function planQuestions(root) {
  const base = path.join(root, 'plans');
  return dirsOf(base).flatMap((topic) => {
    const file = path.join(base, topic, 'plan.md');
    if (!fs.existsSync(file)) return [];
    let parsed;
    try { parsed = readFrontmatter(fs.readFileSync(file, 'utf8'), file); } catch (err) {
      // A plan whose frontmatter the YAML door refuses has no status to read; any other failure is real.
      if (err instanceof YamlParseError) return [];
      throw err;
    }
    if (parsed.meta?.status !== 'draft') return [];
    const text = sectionText(parsed.body, 'owner questions');
    if (!text || NONE.test(text)) return [];
    return [{
      topic, stage: 'plan', ref: `${rel(root, file)}#owner-questions`, question: text,
      answerDoor: `answer in the owner-questions section of ${rel(root, file)}`,
    }];
  });
}

function executionQuestions(root) {
  return dirsOf(runsRoot(root)).filter(isCaseId).flatMap((runId) => {
    let state;
    let gates;
    try {
      const read = readCaseProjection(root, runId, { retryTail: true });
      state = read.state;
      gates = read.projection.openGates ?? [];
    } catch (err) {
      // An unreadable case must not drop a parked gate silently: list it so the owner sees it.
      return [{
        topic: runId, stage: 'execution', ref: `workflow:${runId}`,
        question: `unreadable workflow case: ${err?.message ?? String(err)}`,
        answerDoor: `fgos workflow status ${runId}`,
      }];
    }
    if (!['running', 'parked'].includes(state.status)) return [];
    return gates.map((g) => ({
      topic: runId, stage: 'execution', ref: `workflow:${runId}#${g.stepId}`, question: String(g.question ?? ''),
      answerDoor: `fgos workflow answer ${runId} --step ${g.stepId} --answer "<answer>"`,
    }));
  });
}

/**
 * Every open owner question under `root`, discussions first, then plans, then Workflow gates. Reads only.
 * @param {string} root the project root
 * @returns {Array<{ topic: string, stage: 'discussion'|'plan'|'execution', ref: string, question: string, answerDoor: string }>}
 */
export function collectOpenQuestions(root) {
  return [...discussionQuestions(root), ...planQuestions(root), ...executionQuestions(root)];
}

/** The questions as one batch of text, grouped by topic; each item keeps its stage, question, and answer door. */
export function renderOpenQuestions(items) {
  if (!items.length) return 'No open owner questions.';
  const byTopic = new Map();
  for (const item of items) byTopic.set(item.topic, [...(byTopic.get(item.topic) ?? []), item]);
  const out = [`${items.length} open owner question${items.length === 1 ? '' : 's'}, ${byTopic.size} topic${byTopic.size === 1 ? '' : 's'}:`];
  for (const [topic, list] of byTopic) {
    out.push('', `## ${topic}`);
    for (const q of list) out.push('', `[${q.stage}] ${q.ref}`, q.question, `-> ${q.answerDoor}`);
  }
  return out.join('\n');
}
