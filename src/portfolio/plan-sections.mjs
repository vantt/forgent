// plan-sections.mjs -- the one reader of a plan's named sections (core/skills/_shared/plan-contract.md §3).
// The plan contract check finds sections through this module.

/** The sections a contract plan carries, as `[name, heading pattern]`. */
export const PLAN_SECTIONS = Object.freeze([
  ['outcome', /outcome|goal/i], ['acceptance criteria', /acceptance/i], ['non-goals', /non-?goals/i],
  ['phases', /phases/i], ['owner questions', /owner questions/i], ['risks and rollback', /risk/i],
]);

/**
 * The Unattended run section (core/instructions/ready-plan-runs-unattended.md): kept out of PLAN_SECTIONS because
 * only a plan created on or after the contract check's date gate must carry it.
 */
export const UNATTENDED_RUN_SECTION = Object.freeze(['unattended run', /^#{1,6}\s+Unattended run\s*$/i]);

/** The named subsections of the Unattended run section, as `[key, heading pattern]`. */
export const UNATTENDED_SUBSECTIONS = Object.freeze([
  ['hostSteps', /^#{1,6}\s+Host steps\s*$/i], ['cleanup', /^#{1,6}\s+Cleanup\s*$/i],
  ['beyondTheRule', /^#{1,6}\s+Beyond the rule\s*$/i],
]);

const headingLevel = (line) => /^(#{1,6})\s/.exec(line)?.[1].length ?? 0;

/** The lines of `text`, each line inside a fenced code block (``` or ~~~) blanked: a fence holds no heading and no criterion. */
function withoutFences(text) {
  let fence = null;
  return text.split(/\r?\n/).map((line) => {
    const mark = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      if (mark && mark[0] === fence[0] && mark.length >= fence.length) fence = null;
      return '';
    }
    if (mark) { fence = mark; return ''; }
    return line;
  });
}

/** The lines under the heading at `start` up to the next heading of the same or a higher level. */
function bodyUnder(lines, start) {
  const level = headingLevel(lines[start]);
  let end = start + 1;
  while (end < lines.length && !(headingLevel(lines[end]) > 0 && headingLevel(lines[end]) <= level)) end++;
  return lines.slice(start + 1, end);
}

/**
 * Reads the Unattended run section of `body`: `null` when there is no such heading, else `{ body, hostSteps,
 * cleanup, beyondTheRule }` where `body` is every line under the section heading and each subsection is the lines
 * under its own heading inside it, or `null` when that subsection is absent.
 */
export function readUnattendedRun(body) {
  const lines = withoutFences(body);
  const start = lines.findIndex((l) => headingLevel(l) > 0 && UNATTENDED_RUN_SECTION[1].test(l));
  if (start === -1) return null;
  const inside = bodyUnder(lines, start);
  const section = { body: inside };
  for (const [key, re] of UNATTENDED_SUBSECTIONS) {
    const at = inside.findIndex((l) => headingLevel(l) > 0 && re.test(l));
    section[key] = at === -1 ? null : bodyUnder(inside, at);
  }
  return section;
}

/** The lines under the Acceptance criteria heading of `body`; `null` when there is none. */
export function acceptanceCriteriaLines(body) {
  const lines = withoutFences(body);
  const re = PLAN_SECTIONS.find(([n]) => n === 'acceptance criteria')[1];
  const start = lines.findIndex((l) => headingLevel(l) > 0 && re.test(l));
  return start === -1 ? null : bodyUnder(lines, start);
}

/** Every markdown heading line of `body`. */
export function headingLines(body) {
  return body.split(/\r?\n/).filter((l) => /^#{1,6}\s/.test(l));
}

/** Whether `body` has a heading matching the named plan section. */
export function hasSection(body, name) {
  const re = PLAN_SECTIONS.find(([n]) => n === name)?.[1];
  return re ? headingLines(body).some((h) => re.test(h)) : false;
}
