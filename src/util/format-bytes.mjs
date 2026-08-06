// format-bytes.mjs — humanize a byte count into a short string.
// Binary base 1024 with decimal-style labels (docs/history/
// parallel-dispatch-demo-format-utils/CONTEXT.md D1): 1 KB is 1024 B, but
// the label stays `KB`/`MB`/`GB`, never `KiB`/`MiB`/`GiB`. PURE: no fs, no
// `.fgos/` read.
const UNITS = ['B', 'KB', 'MB', 'GB'];

/**
 * Format `bytes` as e.g. `0 B`, `512 B`, `1 KB`, `1.43 MB`.
 * Byte-level output stays exact; every larger unit is rounded to at most
 * two decimals with trailing zeros trimmed (`1.50` reads as `1.5`).
 */
export function formatBytes(bytes) {
  let value = bytes;
  let unit = 0;
  while (Math.abs(value) >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const shown = unit === 0 ? value : Number(value.toFixed(2));
  return `${shown} ${UNITS[unit]}`;
}
