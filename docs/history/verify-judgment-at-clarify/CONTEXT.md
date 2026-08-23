# CONTEXT.md — verify is judged at `clarify`, where the answer does not exist yet

This document started as tsk-5ov's decision record and became the evidence
that tsk-5ov's own premise was wrong. tsk-5ov is closed as superseded; this
is the record that justifies its replacement.

## What tsk-5ov claimed

`resolveDiscovery` (`src/intake/discovery.mjs`) has two "trust the live
session, skip the judge" paths that behave inconsistently:

- the `lockedContext` branch (`discovery.mjs:578-600`, tsk-ozl D2) returns
  early, skipping both `judgeDiscovery` and the second-pass verify check;
- the `callerVerdict` branch (`discovery.mjs:551-563`, tsk-27y D1/D2 —
  `fgos discover --verdict ...`) sets the verdict but does **not** return,
  falling through to `if (verdict.clear)` at line 640, which runs
  `judgeVerifySemanticCorrectness`.

`resolveDecompose` carries the identical fall-through
(`decompose.mjs:551-568`, then `:703` — once **per child**).

The fall-through is real and confirmed. tsk-5ov's explanation of *why it
hurts* was not: it claimed `judgeVerifySemanticCorrectness` is "a second
heuristic guess" that "re-judges the verify command using only the item's
title/kind/risk/tier", so it "can dispute a verify string the calling
session already justified with real evidence".

## What the evidence actually shows

Every recorded dispute, across both items, was substantively correct.

**tsk-1tm** (`view.discovery["tsk-1tm"]` + `gates["tsk-1tm"]`, 2026-08-04):

| time | proposed `verify` | second pass said | correct? |
|---|---|---|---|
| 10:09:19 | `chưa xác định — P15 bổ sung` | not a command at all | yes |
| 10:09:52 / 10:11:57 / 10:12:54 | `node --test test/runner/worktree.test.mjs` | runs pre-existing tests only; nothing guarantees a regression test for this scenario was added | yes |
| 10:13:44 | `rg -n 'live session\|isLiveSessionWorktree' -i src/runner/worktree.mjs && node --test …` | `rg` checks literal presence of *guessed* identifier names — would fail a correct fix using different names, and proves nothing behavioral | yes |
| 10:19:09 | (none — `--verdict` dropped) | — | the `lockedContext` escape |

The human's own `fgos answer` resuming that item conceded the point:
*"CONTEXT.md … now carries its own Verify section explaining the
guessed-symbol-name limitation (fgos-planning owns the real name)."*

**tsk-5ov** (this item's own clarify pass, 2026-08-05):

| proposed `verify` | second pass said | correct? |
|---|---|---|
| `chưa xác định — P15 bổ sung` | not a command | yes |
| `node --test test/intake/discovery.test.mjs test/intake/decompose.test.mjs test/state/discover-verdict-override.test.mjs && npm test` | `discover-verdict-override.test.mjs:69-81` asserts the *current* behavior as expected, so this verify passes both before and after the fix; no test asserts the new behavior | yes |

**5 disputes, 5 correct, 0 false.** The judge receives
`(title, description, proposedVerify, priorRejection)`
(`judge-executor.mjs:347-351`) — the full description, not four bare
fields — and in tsk-5ov's second dispute it read the test file's source to
reach its conclusion. It is not guessing.

Two prose claims about this judge are inaccurate and should not be relied
on: tsk-5ov's description ("only title/kind/risk/tier"), and
`docs/explanation/judge-verdict-second-pass-semantic-check.md` ("gets the
same `view` context (graph/impact block, description, prior verdicts) the
first pass got" — it receives no `view` at all).

## The actual defect

At stage `clarify`, a real `verify` **cannot exist yet**. The symbol names,
the new test files, the assertions that would distinguish "fixed" from
"not fixed" are all owned by `fgos-planning` and by implementation — by
construction, later than `clarify`. But `fgos discover --verdict clear`
*requires* `--verify`, and the engine then judges it.

So the gate is structurally near-certain to fail, and it has a silent
bypass: dropping `--verdict` routes into the `lockedContext` branch, which
skips the check entirely. Both items reached `decompose` through that
bypass.

The two-branch inconsistency tsk-5ov found is therefore real but
**inverted**: the problem is that `lockedContext` skips too much, not that
`callerVerdict` skips too little. Removing the check from `callerVerdict`
— tsk-5ov's proposed fix — would have deleted a guard with a 5-for-5 hit
rate in order to make the loophole uniform.

Cost is the one complaint that survives intact: each dispute is a real
subprocess model call, observed at roughly 90 seconds to 4 minutes, on the
documented native-first path.

## Direction for the replacement item

Move ownership of `verify` correctness out of `clarify` and to the stages
where the real command is knowable — `planApprove` / `validateApprove`, and
`resolveDecompose`'s per-child check where a plan already exists. `clarify`
may still record a placeholder `verify` (`FALLBACK_VERIFY` /
`RETIRED_P14_PLACEHOLDER` already exist for exactly this), but nothing at
`clarify` should judge it.

This is a contract-level change (stage-FSM / gate expectations around when
`verify` must be real), not a one-branch bug fix — which is why tsk-5ov,
scoped and described as the latter, is closed rather than rewritten.

Known adjacent hole, **not** opened by this change and not closed by it:
`resolveDecompose`'s pass-through path (`decompose.mjs:542`) moves a root
to `executing` carrying `planApproveVerify` with no check at all.

A smaller slice was considered and rejected in favor of the full change:
removing the second pass from `resolveDiscovery` only (both branches),
leaving `resolveDecompose` and the gates untouched. It fits all five data
points and touches no contract, and remains the fallback if the full change
proves too large once planned.

## Environment note

`impact-analysis: degraded` — `fgos tool query --capability impact-analysis
--status present` returns gitnexus at `status: present`, but its index is
behind HEAD (last indexed `251d0b5`), so blast-radius answers may be stale.

## Locked decisions (tsk-4m4, 2026-08-13)

| D-ID | Decision |
|---|---|
| D1 | Scope narrowed to the "Known adjacent hole" only (`resolvePlan`'s pass-through path, `src/intake/plan.mjs:543`, stamping `planApproveVerify` with zero correctness check). The two-branch `resolveDiscovery` inconsistency ("Direction for the replacement item" above) is explicitly OUT of scope for this item — dropped, not deferred. |

**Why (fgos-coding-discovering's own rescan, `docs/history/verify-judgment-
at-clarify/RESEARCH.md` Round 1, 2026-08-13):** the cost premise that
justified moving verify-judgment out of `clarify`/`discovery`
(`judgeVerifySemanticCorrectness` as an expensive LLM subprocess judge,
90s–4min/dispute, "structurally near-certain to fail") is stale. That
judge was retired for unrelated reasons (tsk-1x3 D9/D17, native-first
dispatch waste) and replaced with a near-free mechanical regex check
(`src/intake/verify-pattern-check.mjs`) that agrees with nearly everything
by construction. The two-branch inconsistency itself still technically
exists, but its cost is now negligible either way — not worth an
engine-contract change. The adjacent hole is a genuinely different,
still-live defect, unaffected by this drift, and is the direct sibling of
the bug tsk-14a already fixed (tsk-14a: sync a pass-through item's
designed verify onto `work.verify` before it reaches `planApproveVerify`;
tsk-4m4, narrowed: CHECK that value once it is real, since tsk-14a is what
makes it worth checking).

**User decision, recorded via `fgos answer tsk-4m4`:** "Narrow to just the
adjacent hole" — selected over (1) full original contract-level scope,
(2) CONTEXT.md's own previously-considered smaller fallback (drop the
second pass from `resolveDiscovery` only), and (4) close as wontfix.

## New feature boundary (post-D1)

`resolvePlan` (`src/intake/plan.mjs`) moves a root to `executing` via
`planApproveVerify = view.gates?.[id]?.planApprove?.verify ?? work.verify`
with **zero check** on that value — unlike `resolveDiscovery`'s own
caller-verdict path, which runs `judgeVerifySemanticCorrectness` on a
proposed verify before accepting it. Fix: run the same mechanical check
on `planApproveVerify` inside `resolvePlan`, at the point it is computed
(both the `hasChildren` early-return branch, `plan.mjs:544-548`, and the
main pass-through branch, `plan.mjs:603-606`) — a disagreement should park
the item in `awaiting-human` the same way `resolveDiscovery`'s own dispute
path does (`putInAwaiting`), never silently proceed with a value the
mechanical check flagged.

**Not in scope:** `resolveDiscovery`'s own two branches (unchanged);
`validateApprove`/the merged gate (unchanged); anything about WHERE verify
correctness judgment conceptually belongs (this item no longer relocates
that — it only adds a check that was structurally absent).

## Environment note

`impact-analysis: full` — `fgos tool query --capability impact-analysis
--status present` returns gitnexus at `status: present`. (The index is
flagged stale by the local hook at time of this scan — `impact()` calls
during Planning/Implement should still be run and cross-checked directly
against the source, per `CLAUDE.md`'s own tsk-j7y guidance, rather than
trusted blind.)

## Outstanding questions

None

## Provenance

Written on branch `fgw/tsk-5ov`. If that branch is discarded with the
closed item, this file needs cherry-picking onto the replacement item's
branch — it is the only record of the five-dispute evidence outside the
event log. Extended on `fgw/tsk-4m4` (2026-08-13) with the locked D1 scope
narrowing above.
