// Screen and stderr wordings that mean a provider cannot serve a round -- its credential is dead,
// or its account has used up its quota -- kept in a module of its own with no imports so the pane
// liveness ladder, the provider capacity classifier and the run settlement can share one list
// without any of them reaching the others.

/**
 * Screen text that means "this agent cannot reach its provider because its credential is dead",
 * not "it is thinking". The pane shows the error and the agent sits idle, so without this the
 * round waits out the whole idle timeout and ends as `timed-out-idle`. Anchored to wordings
 * measured on a real pane (pi: "OAuth refresh failed for xai ... invalid_grant") and a real
 * process exit (pi: "No API key found for openrouter.") plus the standard login prompts. The
 * round ends as `provider-limit`: the provider cannot serve now, so the walk moves to another
 * account or candidate; the capacity classifier reads the same line and quarantines the account
 * as an auth fault, not a quota one.
 *
 * Each pattern is tested against one trimmed line at a time, so a line that merely mentions a
 * wording inside other text does not match when the pattern anchors to the line start.
 */
export const AUTH_FAILURE_PATTERNS = Object.freeze([
  /oauth (?:token )?refresh failed/i,
  /\binvalid_grant\b/i,
  /(?:please )?run \/login/i,
  /authentication (?:failed|required)/i,
  /login required/i,
  /not logged in/i,
  /api key.{0,20}(?:missing|invalid|expired)/i,
  /^(?:error:?\s*)?no api key found for\s+\S+/i,
]);

/** How many trailing lines of a process's stderr count as its final error message. */
export const AUTH_FAILURE_TAIL_LINES = 5;

/**
 * The first line of `text` that reads like a dead credential, or null. With `tailLines` only that
 * many trailing non-empty lines are read: a process that exits on a dead credential prints it as
 * its last words, while a wording far up a long log is just something the agent said or ran.
 */
export function matchAuthFailureLine(text, { tailLines = null } = {}) {
  return firstMatchingLine(text, AUTH_FAILURE_PATTERNS, tailLines);
}

/**
 * Stderr lines that mean "this account has used up its quota", as the provider CLI prints them when
 * it stops. Only wordings seen from a real CLI belong here; the first one was measured on codex
 * (2026-10-13: "ERROR: You’ve hit your usage limit. ... or try again at 11:39 PM.", printed twice
 * before codex's closing "tokens used" tally). Each pattern anchors to the line start, optionally
 * after the CLI's "ERROR:" prefix, because codex streams the agent's whole transcript to stderr and a
 * line that only quotes the wording inside other text must not end the round.
 */
export const QUOTA_LIMIT_PATTERNS = Object.freeze([
  /^(?:error:?\s*)?you(?:'|’)ve hit your usage limit/i,
  /^(?:error:?\s*)?usage limit has been reached/i,
  /^(?:error:?\s*)?individual quota reached/i,
]);

/** The first line of `text` that reads like a used-up quota, or null; `tailLines` as above. */
export function matchQuotaLimitLine(text, { tailLines = null } = {}) {
  return firstMatchingLine(text, QUOTA_LIMIT_PATTERNS, tailLines);
}

function firstMatchingLine(text, patterns, tailLines) {
  if (typeof text !== 'string' || !text) return null;
  let lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (Number.isInteger(tailLines) && tailLines > 0) lines = lines.slice(-tailLines);
  return lines.find((line) => patterns.some((pattern) => pattern.test(line))) ?? null;
}
