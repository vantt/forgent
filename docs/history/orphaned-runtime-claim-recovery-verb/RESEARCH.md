# orphaned-runtime-claim-recovery-verb — RESEARCH

## Round 1 — 2026-08-26 (tsk-uio discovery)

**Asked:** tsk-uio reports a durable-status-vs-runtime-claim divergence
with no recovery path: `.fgos/runtime/claims/<id>.json` can survive a
durable-state loss (e.g. the events.jsonl truncation tsk-46v fixed) and
then refuse `fgos pick`/`fgos take` with "already claimed" even though
the durable event log no longer supports that claim at all (status
`todo` or the item not existing). `isReclaimEligible`
(`src/runner/claim-liveness.mjs`) only reclaims by worktree-activity
staleness threshold, never by checking whether the durable status still
justifies the claim in the first place. Scope question, explicitly
either/or: fold this into `acquireClaim`/`isReclaimEligible`'s own
automatic path, or ship a dedicated recovery verb (citing `fgos unlock`'s
own shape as the precedent).

**Existing primitives already cover almost all of this — confirmed by
reading the actual code, not assumed:**
- `releaseClaim(fgosDirInput, {id, claimId})`
  (`src/state/runtime-coordination.mjs:258-286`) already does the exact
  file removal needed — when called with NO `claimId` (only `id`), its
  own mismatch guard (`if (claimId && existing.claimId !== claimId)`)
  short-circuits false, so it unconditionally clears whatever claim
  exists for that id. No new low-level primitive is needed for the
  "delete the claim" half.
- `rebuildViewFromDir(dir)` (`src/state/replay.mjs:952-956`, already
  exported) reads the DURABLE view directly, bypassing the claims overlay
  `listWork`/`currentEffectiveView` apply — exactly what's needed to see
  the item's real durable status, since `listWork` alone cannot
  distinguish "durably doing, claim legitimate" from "durably todo/
  nonexistent, claim orphaned" (`buildEffectiveView` overlays the SAME
  `doing` status onto both cases).
- `isReclaimEligible(repoRoot, id, claimRole, opts)`
  (`src/runner/claim-liveness.mjs:112-117`) is the existing, already-
  tested, real liveness check `pick`/`take` already use for the "is
  someone still genuinely working on this" question — directly reusable
  for the case where the claim's OWN durable status genuinely still says
  `doing` (a real, live claim, not the orphan case this item's own
  report describes) so this verb never has to invent a second liveness
  mechanism.
- `fgos unlock` (`bin/fgos.mjs:4302-4329`) is the exact shape already
  cited by both this item and tsk-1sr's own prior research
  (`docs/history/settle-claim-work-add-writer-stamp/RESEARCH.md`, which
  flagged this same gap and deliberately deferred it as a separate,
  larger item — this IS that item): verify via a real primitive, refuse
  and report holder identity when genuinely live, only clear the
  free/stale/ambiguous cases.

## Verdict

`clear`. Answering the item's own either/or scope question: **a
dedicated recovery verb (`fgos unclaim <id>`), not folding this into
`acquireClaim`/`isReclaimEligible`'s own automatic path** — matches both
this item's own citation of `fgos unlock` as the right precedent and
tsk-1sr's prior research reaching the same conclusion independently.
Folding a durable-status check into `acquireClaim` itself would change
the behavior of every ordinary `pick`/`take` call site silently; a
separate, explicitly-invoked verb keeps this a deliberate, human/session-
initiated recovery action, the same posture `fgos unlock` already
established for the analogous main-checkout-lock case.

Shape: `fgos unclaim <id>` reads the claim
(`readClaim`); if none, reports `{released:false, reason:'no-claim'}`
(benign, mirrors `releaseClaim`'s own no-claim outcome). Reads the
DURABLE status via `rebuildViewFromDir` (never the effective/claim-
overlaid view). If the durable status does not support an active claim
(item doesn't exist in the durable log, or exists but its status isn't
`doing`) — the exact shape this item's own incident hit — the claim is
orphaned BY CONSTRUCTION (no liveness check needed, there is nothing left
to be live) and clears unconditionally via `releaseClaim(fgosDir, {id})`.
If the durable status genuinely IS `doing` (a claim that looks legitimate
on its face), apply the existing `isReclaimEligible` liveness check
before clearing — refuse with the holder's identity/age when still live
(mirrors `unlock`'s own HELD-branch refusal), clear when genuinely stale.
Never a raw `rm` — always through `releaseClaim`, so the same atomic
file-removal path every other caller already trusts.

**Verify:** `node --test test/runner/claim-port.test.mjs` (or a new
sibling test file for this verb specifically) — new tests: (a) a claim
whose durable status is `todo`/nonexistent clears unconditionally,
mirroring this item's own reported incident shape; (b) a claim whose
durable status genuinely IS `doing` and is still fresh (within the
liveness threshold) refuses, reporting the holder; (c) a claim whose
durable status is `doing` but genuinely stale (past the threshold)
clears; (d) no claim at all reports the benign no-claim outcome, never an
error.
