// plan-sections.mjs -- the one reader of a plan's named sections (core/skills/_shared/plan-contract.md §3).
// The plan contract check and the owner-question reader both find sections through this module.

/** The sections a contract plan carries, as `[name, heading pattern]`. */
export const PLAN_SECTIONS = Object.freeze([
  ['outcome', /outcome|goal/i], ['acceptance criteria', /acceptance/i], ['non-goals', /non-?goals/i],
  ['phases', /phases/i], ['owner questions', /owner questions/i], ['risks and rollback', /risk/i],
]);

const HEADING = /^(#{1,6})\s+(.*)$/;

/** Every markdown heading line of `body`. */
export function headingLines(body) {
  return body.split(/\r?\n/).filter((l) => /^#{1,6}\s/.test(l));
}

/** Whether `body` has a heading matching the named plan section. */
export function hasSection(body, name) {
  const re = PLAN_SECTIONS.find(([n]) => n === name)?.[1];
  return re ? headingLines(body).some((h) => re.test(h)) : false;
}

/**
 * The text under the first heading that matches the named plan section, up to the next heading of the same or a
 * higher level; null when the plan has no such heading.
 */
export function sectionText(body, name) {
  const re = PLAN_SECTIONS.find(([n]) => n === name)?.[1];
  if (!re) return null;
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((l) => HEADING.test(l) && re.test(l));
  if (start === -1) return null;
  const level = HEADING.exec(lines[start])[1].length;
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const m = HEADING.exec(lines[i]);
    if (m && m[1].length <= level) break;
    out.push(lines[i]);
  }
  return out.join('\n').trim();
}
