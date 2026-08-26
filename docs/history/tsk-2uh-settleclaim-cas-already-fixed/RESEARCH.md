# Research — tsk-2uh: settleClaim CAS refuses legitimate same-writer revision drift

## Round 1 — 2026-08-26 (discovery stage)

**Asked:** Is the bug this item describes — `fgos return` failing with
"settleClaim: item durable revision changed from X to Y" for a
same-writer's own legitimate `fgos discover`/`plan`/`edit`/`decision`/
`handoff` calls between claim and return — already fixed on this item's
own branch? Is commit `d6a2169c` an ancestor of this item's
`branchHeadAtTake` (`c1b218392371e7b49ee78ec6a4afb3d416e59a2e`)? Does the
existing test suite actually cover the exact reproduction scenario
described (continuous claim across discover/plan/edit calls, side-log-only
events not breaking reconciliation, a genuinely different writer still
refused, a missing writer stamp failing closed)? Was the item's third
proposed option (a documented, discoverable `resync-claim` verb) also
implemented, or only the automatic-reconciliation approach?

**Checked (repo, direct read/search, all in this checkout):**

1. `git log --oneline --all` — found `d6a2169c "fix(tsk-1ht): settleClaim
   reconciles same-writer revision drift instead of refusing"`, preceded
   by `b35588bd`/`520d3e97` (discovery research + plan for the same bug
   under feature dir `docs/history/tsk-1ht-settle-claim-revision-reconcile/`).

2. `git merge-base --is-ancestor d6a2169c main` → exit 0 (yes, ancestor).
   `git branch --all --contains d6a2169c` lists `fgw/tsk-2uh` itself among
   the branches containing this commit — this item's own branch already
   carries the fix. **Confirmed: this item's `branchHeadAtTake` is at or
   after the fix commit.**

3. `src/state/store.mjs:1027-1055` (`revisionDriftIsSelfCaused`, added by
   d6a2169c) — reads every `view.work[id]`-mutating event since the
   claim's `acquiredAt`, requires positive same-`writerId` evidence for
   every one of them (excluding `SIDE_LOG_ONLY_EVENT_TYPES`: decision,
   gate-approve, discovery, outcome, friction, call-summary), fails closed
   on any different or missing writer stamp, and fails closed (never
   vacuously passes) when no same-writer event exists at all. Called from
   `settleClaim` at line 1179 before the CAS throw. This directly
   implements this item's proposed option (a)/(b) — "narrow the hash to
   exclude fields the session's own legitimate writes already touched" /
   "each mutating verb refreshes the claim's own preClaimRevision" — via a
   third mechanism (reconcile-at-settle-time using event writer
   provenance) that achieves the same outcome without either.

4. `test/state/runtime-coordination.test.mjs` — four tests added by
   d6a2169c cover exactly the scenario this item describes:
   - line 549: same-writer drift across discover/plan/edit-shaped calls is
     reconciled, not refused.
   - line 586: side-log-only events (`decision`, `gate-approve`) mixed
     into the same window do not break reconciliation — this is the exact
     "routine `fgos decision`/`fgos gate-approve` calls those skills
     already make" case this item's own reproduction (discover→plan with
     edit/decision/handoff calls in between) depends on.
   - line 618: a genuinely different writer in the window still refuses.
   - line 649: an event with no writer stamp at all still refuses (fails
     closed on legacy/malformed data).

5. This item's third proposed option — a separate, documented
   `resync-claim` verb (parallel to `fgos resync-worktree`) — was **not**
   built. `rg -n "resync-claim|resyncClaim" src bin docs` only matches
   `resyncClaimWorktree` (`src/runner/worktree.mjs`), an unrelated git
   worktree-tree resync, not a claim-revision resync. The chosen fix makes
   this option moot: reconciliation now happens automatically inside
   `settleClaim` itself, so no separate recovery verb or manual
   `.fgos/runtime/claims/<id>.json` patch (the workaround this item
   documents) is needed going forward.

**Found:** The exact bug this item reports was independently discovered
and fixed by tsk-1ht (`d6a2169c`), already merged to `main`, and already
present on this item's own branch before this item was even claimed. The
fix's test coverage matches this item's own reproduction shape
(continuous claim, discover/plan-stage edit/decision/handoff calls,
same-writer drift reconciled, different-writer drift still refused). No
code gap remains for the core symptom; nothing here requires a person's
design judgment — it is a verification question, not a build decision.

**Still open:** No residual code gap identified. The only open question is
whether tsk-2uh should be run through as a real regression test that
byte-for-byte re-enacts the item's own original reproduction steps
(`fgos pick` → `fgos discover` → `fgos plan` → intervening edit/decision/
handoff → `fgos return`) as an integration-level check on top of the
existing unit-level `runtime-coordination.test.mjs` coverage, or closed
as a verified duplicate of tsk-1ht with no new test needed. That is a
scope call for planning, not a fact still missing.
