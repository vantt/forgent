// bypass-pairing.mjs — the one place that decides whether permissionMode
// "bypass" is paired with full confinement (R5).
//
// Two entry points reach a live dispatch: Authority's
// assessAndPrepare (the canonical production door, which every real
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

/**
 * Who delivers the controls a bypass invocation declares. The pairing above judges the declaration; this judges
 * the delivery. Under a required backend the backend delivers the private home and the session, so the host-side
 * measures that deliver them for a launch without one (a worker home, the worker session) are not taken. A head
 * session also lives in the main checkout, which is allowed only while the policy denies host writes: the grant
 * narrows what it may write, so the declared own workspace is met by that policy rather than by a worktree.
 * That narrowing is not a prompt: under bypass the paths the grant opens (for the secretary, its plans, its
 * discussion files and docs/backlog.md through the door) are written without asking.
 */
export function controlDelivery({ launchKind, requirement, backend }) {
  const backendDelivers = requirement?.mode === 'required' && Boolean(backend);
  const rootWorkspaceAllowed = backendDelivers && launchKind === 'session' && requirement.policy?.controls?.hostWrite === 'deny';
  return { backendDelivers, rootWorkspaceAllowed };
}
