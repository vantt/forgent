// plan-sections.mjs -- the one reader of a plan's named sections (core/skills/_shared/plan-contract.md §3).
// The plan contract check finds sections through this module.

/** The sections a contract plan carries, as `[name, heading pattern]`. */
export const PLAN_SECTIONS = Object.freeze([
  ['outcome', /outcome|goal/i], ['acceptance criteria', /acceptance/i], ['non-goals', /non-?goals/i],
  ['phases', /phases/i], ['owner questions', /owner questions/i], ['risks and rollback', /risk/i],
]);

/** Every markdown heading line of `body`. */
export function headingLines(body) {
  return body.split(/\r?\n/).filter((l) => /^#{1,6}\s/.test(l));
}

/** Whether `body` has a heading matching the named plan section. */
export function hasSection(body, name) {
  const re = PLAN_SECTIONS.find(([n]) => n === name)?.[1];
  return re ? headingLines(body).some((h) => re.test(h)) : false;
}
