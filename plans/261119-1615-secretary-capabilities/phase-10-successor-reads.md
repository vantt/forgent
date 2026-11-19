# Phase 10: A rotation successor reads the question store in its first turn

## Context (found by the phase 7 live audit, 2026-11-19)
The role moves to a rotation successor only on `session answered`, which fires when the successor's first turn ends.
Inside that first turn (when it reads the handoff and needs `fgos questions list`) every role-gated verb waits for
`role-pending-rotation` (phase 8) and is refused after 60 s: Miu gen 16 at 06:52. Decision by the supervisor (option 1 of
three): answer read-only role-gated verbs for such a successor; every write verb keeps waiting or is refused as now.

## Requirements
1. Route `decide()` (`packages/run-supervisor/rust/src/head_request.rs`): a read-only role-gated verb (the question
   store reads: `questions list`, and `questions show` if it is a socket verb) from a head that Identity has registered for
   the same role name while its predecessor is live and still holds the role is answered. The same facts phase 8 uses
   for `role-pending-rotation` decide it (supervisor side, from Identity; nothing from the request args).
2. Every write verb in that state keeps today's behaviour (`role-pending-rotation`, client wait).
3. The list of read-only verbs is one named constant next to the grants' verb lists, not a string match in decide().
4. Contract `head-request.v1.json` and session-host spec name the rule.

## Tests (owning proof in the route's decide())
- Successor of the same role name, predecessor live and holding: a read is answered, a write is refused
  `role-pending-rotation`.
- A successor of another role name gets nothing (role-not-held).
- After the hand-over the successor gets both as today.

## Review
lead:OPC reviews: this widens a trust boundary.
