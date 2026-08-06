// format-duration.mjs — humanize a millisecond count into a short string
// (`1d 3h`, `5h 12m`, `2m 30s`, `45s`). PURE: no fs, no `.fgos/` read.
//
// First occupant of `src/util/`, the repo's cross-cutting pure-utility
// location: this belongs to none of the 9 domain subsystems under `src/`
// (docs/history/parallel-dispatch-demo-format-utils/plan.md, Approach).

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Humanize `ms` into at most two units, starting from the largest non-zero
 * one and descending day -> hour -> minute -> second (D2,
 * docs/history/parallel-dispatch-demo-format-utils/CONTEXT.md). Remainders
 * below the smaller shown unit are truncated, never rounded, so the result
 * never claims more elapsed time than actually passed.
 */
export function formatDuration(ms) {
  const days = Math.floor(ms / DAY);
  const hours = Math.floor(ms / HOUR) % 24;
  const minutes = Math.floor(ms / MINUTE) % 60;
  const seconds = Math.floor(ms / SECOND) % 60;

  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  if (minutes > 0) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  return `${seconds}s`;
}
