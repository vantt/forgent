// ansi.mjs — hand-rolled ANSI color helpers for `fgos doctor`/`fgos setup`
// (per CONTEXT.md D5: no new dependency — this codebase already ships zero
// external deps, same rationale as report/entropy.mjs and
// report/frontmatter.mjs). PURE: string in, string out — no
// process.stdout/console usage here; callers own printing.

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

export function green(text) {
  return `${GREEN}${text}${RESET}`;
}

export function red(text) {
  return `${RED}${text}${RESET}`;
}

export function yellow(text) {
  return `${YELLOW}${text}${RESET}`;
}

export function bold(text) {
  return `${BOLD}${text}${RESET}`;
}

/**
 * One formatted `fgos doctor` check line: a green ✓ or red ✗ mark, the
 * label, and an optional detail suffix.
 */
export function formatCheck(passed, label, detail) {
  const mark = passed ? green('✓') : red('✗');
  const suffix = detail ? ` (${detail})` : '';
  return `${mark} ${label}${suffix}`;
}
