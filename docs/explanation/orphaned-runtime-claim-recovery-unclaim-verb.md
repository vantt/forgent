---
authoritative_for: fgos unclaim <id> — the recovery verb for an orphaned runtime claim (.fgos/runtime/claims/<id>.json) that still refuses `fgos pick`/`fgos take` even though the durable event log's own status no longer justifies it; distinct from /fgOS:unlock, which clears the shared main-checkout lock rather than a per-item claim record
---

# When a claim outlives the work it was claiming

`tsk-uio` was discovered as a side effect of recovering from `tsk-46v`'s
`events.jsonl` truncation. Resubmitting an identical task title after a
truncation-induced durable-state loss reproduced the identical item id —
`generateId` (`src/intake/classify.mjs:124`) hashes only the title, and the
collision check (`existingIds`) found nothing to block since the durable
work record for the original id no longer existed. But
`.fgos/runtime/claims/<id>.json` — the ephemeral, git-ignored runtime claim
from the original, now-vanished, submit+pick — still existed and was keyed
by that same id. `fgos pick <id>` refused with "already claimed by
claimId clm-...", even though `fgos list --id <id>` showed a fresh
`status:todo` record with no matching active claim from the durable event
log's own point of view.

## Why the existing reclaim path didn't cover this

`acquireClaim` (`src/runner/claim-port.mjs`, via `runtime-coordination.mjs`)
only reclaims a stale claim through `isReclaimEligible`
(`claim-liveness.mjs`) — a worktree-activity liveness threshold. It never
asked "does this claim's own id even still have a matching durable status
that would justify the claim in the first place?" A claim can be perfectly
"live" by liveness heuristics while the durable state it once corresponded
to has been wiped out from underneath it — durable-state vs
ephemeral-claim-state divergence, not a staleness problem.
`docs/how-to/recover-a-stuck-doing-claim-after-worktree-creation-failure.md`
didn't cover it either — that runbook is for `status:doing` with a missing
worktree; this case is any non-`doing` durable status (here, `todo`) with
a claim file that still thinks it's held.

The original item's own workaround was not a fix: rewording the resubmit's
title so `generateId` produced a different, non-colliding id (`tsk-3rn`),
sidestepping the collision rather than clearing the orphaned claim.

## What shipped

A new `fgos unclaim <id>` CLI verb (`bin/fgos.mjs`), reusing three
already-tested primitives rather than adding new mechanism:

- Reads the claim via `readClaim(dir, id)`. No claim → `{released: false,
  reason: 'no-claim'}`.
- Rebuilds the durable view (`rebuildViewFromDir`) and checks the durable
  `status` for that id. **If durable status is anything other than
  `doing`** (including "not found" post-truncation) — the claim can no
  longer be justified by durable state, so it releases immediately:
  `{released: true, reason: 'durable-status-mismatch', durableStatus}`.
  This is the exact case `tsk-uio` hit.
- Only when durable status genuinely is `doing` does it fall back to the
  existing liveness check (`isReclaimEligible`) — refusing with a
  `ClaimError('conflict', ...)` naming the holder and claim age if the
  claim is still genuinely live, or releasing with `{released: true,
  reason: 'stale-liveness'}` if not.

This is additive and composes existing primitives (`releaseClaim`,
`rebuildViewFromDir`, `isReclaimEligible`) rather than duplicating any of
their logic — reviewed and auto-approved as REVERSIBLE (never touches the
durable event log).

## Relationship to `/fgOS:unlock`

Same shape, different scope. `/fgOS:unlock` (`fgos unlock`) clears
`.fgos/main-checkout.lock` — the single shared checkout-wide lock. `fgos
unclaim <id>` clears one item's own runtime claim record
(`.fgos/runtime/claims/<id>.json`). Neither substitutes for the other;
both exist because ephemeral runtime state (claims, the checkout lock) can
independently outlive the durable state it was coordinating around.

## Verify

4 test cases added to `test/runner/claim-port.test.mjs` covering: no-claim
no-op, durable-status-mismatch auto-release (the `tsk-uio` repro shape),
live-`doing` claim refusal with holder/age in the error, and
stale-liveness release when durable status genuinely is `doing` but the
worktree has gone quiet.
