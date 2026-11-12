// ansi.mjs — hand-rolled ANSI color helpers for `fgos doctor`/`fgos setup`
// (per CONTEXT.md D5: no new dependency — this codebase already ships zero
// external deps, same rationale as report/entropy.mjs and
// report/frontmatter.mjs). PURE: string in, string out — no
// console usage here; callers own printing (the colour gate only reads
// whether stdout is a terminal).

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

/**
 * The one gate for colour: on when stdout is a terminal and NO_COLOR is not
 * set (https://no-color.org: any non-empty value turns colour off). Every
 * helper below asks it by default, so redirected or piped output never
 * carries an escape sequence; tests and callers that already know the answer
 * pass it as `enabled`.
 */
export function colorEnabled(env = process.env, isTTY = process.stdout.isTTY) {
  return Boolean(isTTY) && !env.NO_COLOR;
}

function paint(code, text, enabled) {
  return enabled ? `${code}${text}${RESET}` : String(text);
}

export function green(text, enabled = colorEnabled()) {
  return paint(GREEN, text, enabled);
}

export function red(text, enabled = colorEnabled()) {
  return paint(RED, text, enabled);
}

export function yellow(text, enabled = colorEnabled()) {
  return paint(YELLOW, text, enabled);
}

export function bold(text, enabled = colorEnabled()) {
  return paint(BOLD, text, enabled);
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
