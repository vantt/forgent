// dispatch/work-item-input.mjs -- dispatch takes generic inputs only, never a Work item.

import { RunnerConfigError } from './config.mjs';

// Option names that once carried a Work item (or the pieces dispatch used to read off one)
// into dispatch. Dispatch takes generic inputs only, so a caller still passing one is refused
// instead of having it silently ignored.
export const WORK_ITEM_KEYS = Object.freeze(['work', 'workItem']);
const WORK_ITEM_INPUT_KEYS = Object.freeze([...WORK_ITEM_KEYS, 'workExecutorId']);

/**
 * Throws when `params` still carries a Work item input; `where` names the entry point. `keys`
 * narrows the check (a `--work` hint legitimately carries `workExecutorId`).
 */
export function refuseWorkItemInput(params, where, keys = WORK_ITEM_INPUT_KEYS) {
  const found = params && typeof params === 'object' ? keys.filter((key) => Object.hasOwn(params, key)) : [];
  if (found.length) {
    throw new RunnerConfigError(
      `${where} takes no Work item (${found.join(', ')}): pass its demand as generic inputs (assignment rigor/domain, a work hint, capability hints, agent type)`,
    );
  }
}
