# tsk-1dsz — plan.md

Mode: tiny

Flag count: 0 (auth, authorization, data model, audit/security, external
systems, public contracts, cross-platform — none apply). No code is
touched at all; the only content is a documentation record and an
administrative status close, which is the smallest lane this repo's
mode-gate recognizes.

## Approach

D1 (`CONTEXT.md`) already locked the outcome: this item's flaked test
(`test/e2e/coexistence-canary.test.mjs`, test (ii) footprint case) is a
single, unreproduced, immediately-clean-on-rerun occurrence with a
confirmed-distinct mechanism from tsk-4fx and no code-level bug found on
static read (`RESEARCH.md` round 1). There is no code fix to plan — the
only action is closing the item as `wontfix`, carrying the evidence
already written to `docs/history/tsk-1dsz-coexistence-canary-footprint-flake/`
so a future occurrence starts from this accumulated finding instead of
zero.

**Alternatives rejected:**
- Writing a code change (e.g. a defensive re-check, a retry) — rejected.
  No mechanism was identified that a code change could target; inventing
  one to "do something" would be exactly the guess D1 already rejected in
  favor of documenting and closing.
- Leaving the item open at `todo`/`doing` pending a future reproduction —
  rejected per D1's explicit instruction: close now, reopen only if it
  recurs (a new item, carrying this one's evidence, per D1's own text).

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| Item closure (`wontfix`) | light | No code path touched; `docs/history/tsk-1dsz-coexistence-canary-footprint-flake/` (`CONTEXT.md` + `RESEARCH.md`) is the durable record. Reversible: the item can be reopened by filing a new one that supersedes it if the flake recurs. |

No medium/high risk items — this item makes no production or test-code
change.

**Impact-analysis posture:** not applicable — no symbol is touched, so no
`impact()` call is needed (`fgos tool query --capability impact-analysis
--status present` already confirmed `full` posture during `exploring`,
recorded in `CONTEXT.md`, for the record).

**Graph position:** `tsk-1dsz` has no deps and no children (`fgos graph
--id tsk-1dsz --json`) — an isolated node; closing it unblocks nothing
else and is unblocked by nothing.

## Shape

Single piece, no split. The one action is administrative: move the item
to `wontfix` with a reason citing D1 and the evidence doc, no code, no
test run required as a completion proof (nothing was changed to verify).

Verify: none — no code or test-file content changes. The completion
evidence is the item's own `wontfix` status plus the linked
`docs/history/tsk-1dsz-coexistence-canary-footprint-flake/` record.

## Outstanding questions

None
