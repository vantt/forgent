// What is left of the herdr agent vocabulary after every herdr call moved
// behind terminal-control: names and states, no process, no I/O.
//
// herdr is transport and failure detector here, never truth and never receipt:
// nothing in an agent's reported state is proof that the worker did any work.
// That proof is a file the worker itself wrote, and it is read somewhere else.

// herdr rejects an agent name it cannot use as a target (1-32 characters,
// lowercase letters, digits, `-` or `_`, starting with a letter), so a name is
// normalized rather than failed late inside a pane that is already open. The
// normalizer lives with the other proof helpers.
import { normalizeAgentName } from './proof-helpers.mjs';
export { normalizeAgentName };

/** States in which it is safe to type at an agent. `done` is not an error:
 * a `--no-focus` pane settles there because a CLI read never marks it seen,
 * measured, not assumed. */
export const READY_STATES = Object.freeze(['idle', 'done']);

export function isReadyState(state) {
  return READY_STATES.includes(state);
}
