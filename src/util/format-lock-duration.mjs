// format-lock-duration.mjs — short human-readable duration for lock messages.

/** Formats a millisecond duration ("2m15s", "45s") for CLI messages.
 * Non-numeric or negative input (no known duration) formats as "unknown"
 * rather than fabricating a number. */
export function formatLockDurationMs(ms) {
  if (typeof ms !== 'number' || Number.isNaN(ms) || ms < 0) return 'unknown';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m${seconds}s` : `${seconds}s`;
}
