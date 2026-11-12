// verb-exit.mjs -- the exit code a verb's own result asks for. Verbs with an execution outcome read Execution's
// outcome table (outcome-exit.mjs); the rest decide from their result shape. Every verb not named here exits 0.
// The error exit codes (a refused or failed call) are not here: they come from `EXIT_CODES` in exit-codes.mjs.
import { exitCodeForOutcome } from '../runner/execution/outcome-exit.mjs';

// `data` is the verb's result; `ctx` is `{ positional, flags }` of the call.
const EXIT_OF = {
  run: (data) => (data?.outcome ? exitCodeForOutcome(data.outcome) : 0),
  'plan-lint': (data) => (data.ok ? 0 : 1),
  'wire-agents': (data) => (data.failed?.length > 0 ? 1 : 0),
  // `doctor --strict` exits 1 when any check still fails after optional fixes ran.
  doctor: (data, { flags }) => (flags.strict === true && !data.ok ? 1 : 0),
  // A foreground start/resume/answer and a gate settle exit with their outcome's code; a proposal exits 1 when it is not ok.
  workflow: (data, { positional, flags }) => {
    const sub = positional[0];
    const settled = data?.outcome !== undefined && data?.outcome !== null;
    if (['start', 'resume', 'answer'].includes(sub) && flags.foreground === true && data?.status !== 'running' && settled) return exitCodeForOutcome(data.outcome);
    if (sub === 'gate' && typeof data?.outcome === 'string') return exitCodeForOutcome(data.outcome);
    if (sub === 'propose') return data.ok ? 0 : 1;
    return 0;
  },
};

export function exitCodeOf(verb, data, ctx) {
  return EXIT_OF[verb]?.(data, ctx) ?? 0;
}
