// run-timeout.mjs — the floor and ceiling of the time one run may be given instead of
// `runner.timeoutMs` (`fgos run --timeout`, a Unit's `timeoutMs`, a `timeoutMs` key in `--override`).
// A leaf: the confinement reaper reads the ceiling without importing the runner config module.
//
// The floor keeps a typo ("90s" for "90m") from killing a real turn at once. The ceiling bounds how
// long a hung worker can hold its worktree's dispatch lock and the private home holding a copy of an
// account login (the reaper keeps a live run's home until its own timeout, held to this ceiling): four
// times the heaviest turn seen, about an hour.

export const RUN_TIMEOUT_MIN_MS = 60000;
export const RUN_TIMEOUT_MAX_MS = 4 * 3600000;

const formatRunTimeout = (ms) => (ms % 3600000 === 0 ? `${ms / 3600000}h` : `${ms / 60000}m`);

/** Why `value` is not a usable run timeout (whole ms, floor..ceiling), or null when it is. */
export function runTimeoutProblem(value, label = 'run timeout') {
  if (!Number.isSafeInteger(value)) return `${label} must be a whole number of milliseconds, got: ${typeof value === 'number' ? String(value) : JSON.stringify(value)}`;
  if (value < RUN_TIMEOUT_MIN_MS) return `${label} must be at least ${formatRunTimeout(RUN_TIMEOUT_MIN_MS)}, got ${value}ms`;
  if (value > RUN_TIMEOUT_MAX_MS) return `${label} must be at most ${formatRunTimeout(RUN_TIMEOUT_MAX_MS)}, got ${value}ms`;
  return null;
}
