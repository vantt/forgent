// What each role of a collaboration pattern is FOR, as data, and the one helper that tells a role its task.
//
// WHY. Every role of one Unit run is dispatched with the unit's objective, which is the producer's
// task. A reviewer given "replace the placeholder line" tried to replace it instead of checking it.
// The pattern owns what its roles mean, so the pattern wraps the objective for the role; the runner
// only honours the unit it is handed and knows no role names.
//
// OVERRIDE. `params.roleTasks[role]` (or `[kind]`) replaces the default text, so a preset or a
// Workflow can supply its own. `{objective}` in a task stands for the unit's original objective.

export const DEFAULT_ROLE_TASKS = Object.freeze({
  synthesizer: [
    'You are the synthesizer for a panel that answered the task below.',
    'Each panelist\'s report is listed under Context refs. Read every one.',
    'State each panelist\'s position by name (panelist-1, panelist-2, ...), keep any disagreement visible instead of averaging it away, and end with one recommendation and the evidence for it.',
    'Do not answer the task from scratch.',
    '',
    'The task the panel answered:',
    '{objective}',
  ].join('\n'),
  reviewer: [
    'You are the reviewer of work another agent just did. Do not do the work again and do not change any file.',
    'The work is the latest commit in this worktree (git log -1, git show HEAD) plus any uncommitted change (git status, git diff). The producer\'s own account of it is listed under Context refs.',
    'Check it against the task below and report what is wrong or missing, with file and line evidence, or say plainly that you found nothing.',
    '',
    'The task that was assigned:',
    '{objective}',
  ].join('\n'),
  'red-team': [
    'You are the red-team for work another agent just did. Do not change any file.',
    'Try to break the result: wrong claims, missed cases, regressions, and anything the task forbade. The work is the latest commit in this worktree (git log -1, git show HEAD). The producer\'s own account of it is listed under Context refs.',
    'Report concrete failures with evidence, or say plainly that you found none.',
    '',
    'The task that was assigned:',
    '{objective}',
  ].join('\n'),
});

function wrap(task, objective) {
  // A replacer function, so `$&` or `$1` inside the objective is text, never a replacement pattern.
  return task.includes('{objective}') ? task.replaceAll('{objective}', () => objective) : `${task}\n\n${objective}`;
}

/**
 * The unit as `role` should see it.
 *
 * Returns the very same unit when the role has no task and there is nothing to add, so a pattern can
 * call this for every role without changing the ones that need no wrapping (panelists, a producer in
 * its first round).
 *
 * @param {object} unit
 * @param {object} options
 * @param {string} options.role the role being dispatched
 * @param {string} [options.kind] the default-task key when the role is named differently
 * @param {object} [options.params] pattern params; `roleTasks` overrides the defaults
 * @param {string[]} [options.findings] findings from the previous round, listed for a producer
 */
export function roleUnit(unit, { role, kind = role, params = {}, findings = [] } = {}) {
  const task = params?.roleTasks?.[role] ?? params?.roleTasks?.[kind] ?? DEFAULT_ROLE_TASKS[kind];
  const hasFindings = Array.isArray(findings) && findings.length > 0;
  if (typeof task !== 'string' && !hasFindings) return unit;

  let objective = typeof task === 'string' ? wrap(task, unit.objective) : unit.objective;
  if (hasFindings) {
    objective += `\n\nThe previous round's checks reported these findings. Fix them and change nothing else:\n${findings.map((f) => `- ${f}`).join('\n')}`;
  }
  return { ...unit, objective };
}
