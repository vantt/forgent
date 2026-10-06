// Screen and stderr wordings that mean a provider credential is dead, kept in a module of its own
// with no imports so both the pane liveness ladder and the provider capacity classifier can share
// one list without either module reaching the other.

/**
 * Screen text that means "this agent cannot reach its provider because its credential is dead",
 * not "it is thinking". The pane shows the error and the agent sits idle, so without this the
 * round waits out the whole idle timeout and ends as `timed-out-idle`. Anchored to wordings
 * measured on a real pane (pi: "OAuth refresh failed for xai ... invalid_grant") plus the
 * standard login prompts. The round ends as `provider-limit`: the provider cannot serve now,
 * so the walk moves to the next candidate; the capacity classifier reads the same line and
 * quarantines the account as an auth fault, not a quota one.
 */
export const AUTH_FAILURE_PATTERNS = Object.freeze([
  /oauth (?:token )?refresh failed/i,
  /\binvalid_grant\b/i,
  /(?:please )?run \/login/i,
  /authentication (?:failed|required)/i,
  /login required/i,
  /not logged in/i,
  /api key.{0,20}(?:missing|invalid|expired)/i,
]);
