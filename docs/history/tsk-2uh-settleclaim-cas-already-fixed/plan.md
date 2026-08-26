# Plan — tsk-2uh: settleClaim CAS refuses legitimate same-writer revision drift

Mode: tiny

Flags counted per `fgos-routing`'s Mode gate: none of auth,
authorization, data model, audit/security, external systems, public
contracts, cross-platform, weak proof, multi-domain apply — this item
touches no code. "existing covered behavior" is the one borderline flag
(the area is `settleClaim`/`revisionDriftIsSelfCaused`), but this plan
does not modify that area, only verifies it — 0-1 flags, a couple of
files, one direct task → tiny.

No CONTEXT.md/`fgos-coding-exploring` round exists for this item —
discovery's verdict was `clear`, which skips `exploring` by design. The
locked source of truth here is `docs/history/tsk-2uh-settleclaim-cas-already-fixed/RESEARCH.md`
(Round 1), not a CONTEXT.md D-id.

## Approach

**Finding (RESEARCH.md Round 1):** the bug this item reports —
`settleClaim`'s CAS check refusing a same-writer's own legitimate
mid-lifecycle `discover`/`plan`/`edit`/`decision`/`handoff` writes as if
they were a concurrent conflict — was independently found and fixed by
tsk-1ht (`d6a2169c`, `revisionDriftIsSelfCaused` in `src/state/store.mjs`).
That commit is an ancestor of `main` and was already present on this
item's own `branchHeadAtTake` before this item was ever claimed. Its test
coverage (`test/state/runtime-coordination.test.mjs:549,586,618,649`)
matches this item's own reproduction shape byte-for-byte: same-writer
drift across discover/plan-shaped edit/decision/handoff calls is
reconciled, a genuinely different writer or a missing writer stamp still
refuses.

**Chosen path: no code change.** Writing a second fix for an already-fixed
bug would either be a no-op duplicate of `revisionDriftIsSelfCaused` or,
worse, a competing mechanism for the same problem. The honest action here
is verification, not implementation: confirm the existing fix's test
coverage still holds, and close this item as a verified duplicate of
tsk-1ht rather than opening scope for a new mechanism.

**Alternative rejected:** build the item's own originally-proposed option
(c) — a documented, discoverable `resync-claim` verb. Rejected because the
chosen fix in `d6a2169c` makes it moot: reconciliation now happens
automatically inside `settleClaim` itself, so the manual recovery path
this item's workaround describes (patching `.fgos/runtime/claims/<id>.json`
by hand) is no longer needed for the case this item reports. Adding a
`resync-claim` verb now would be a solution to a problem `d6a2169c`
already removed.

**Files touched:** none in `src/`, `bin/`, or `test/`. This plan's only
artifact is `docs/history/tsk-2uh-settleclaim-cas-already-fixed/plan.md`
(this file) plus the already-written `RESEARCH.md`.

**Risk map:** light. No code changes, so no blast radius to assess — the
`fgos tool query --capability impact-analysis --status present` gate
reports `gitnexus` present (posture: full), but this plan does not lean
on blast-radius evidence since nothing is being changed. The only residual
risk is a false "already fixed" read; that risk is covered by re-running
the scoped verify below, not by a proof point requiring impact analysis.

**Ordering:** `fgos graph --json`'s `criticalPath` does not include
tsk-2uh, and `topUnblock` is empty — no other item is waiting on this one.
No ordering constraint applies.

## Shape

Single direct action, scaled to `tiny`:

1. Re-run the scoped verify (below) to reconfirm the fix is still green
   at execute time (state may have moved since this planning round).
2. Record the outcome and return the item — no source file needs editing.

Concrete cases already proven by the cited existing tests (not re-proven
here, since no new code is added): same-writer drift across
discover/plan/edit/decision/handoff is reconciled; a genuinely different
writer's drift still refuses; an event with no writer stamp still refuses
(fails closed); side-log-only events (decision, gate-approve) mixed into
the window do not break reconciliation.

## Verify

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/state/runtime-coordination.test.mjs
```

Confirmed green at planning time: 25/25 pass, 0 fail (2026-08-26).

## Outstanding questions

None
