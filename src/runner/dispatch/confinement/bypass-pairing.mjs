// bypass-pairing.mjs — the one place that decides whether permissionMode
// "bypass" is paired with full confinement (R5).
//
// Two entry points reach a live dispatch: Authority's
// executeThroughConfinement (the canonical production door, which every real
// dispatch goes through) and herdr-round's establishConfinement (an adapter
// primitive reachable directly by a caller that bypasses Authority entirely —
// tests, or a future direct caller). A "bypass" permission mode with an
// incomplete confinement pairing must refuse the same way at both, so this
// function is the single source of truth both call into rather than each
// keeping its own copy of the rule.
export function evaluateBypassPairing({ isBypass, hasOwnWorktree, hasPrivateHome, hasIsolatedSession }) {
  if (!isBypass) return { satisfied: true, missing: [] };
  const missing = [];
  if (!hasPrivateHome) missing.push("home: private (privateHome)");
  if (!hasIsolatedSession) missing.push("session: isolated (isolatedSession)");
  if (!hasOwnWorktree) missing.push("workspace: own (ownWorktree)");
  return { satisfied: missing.length === 0, missing };
}
