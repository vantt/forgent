---
type: explanation
title: Why fgos-coding-compounding refuses to commit when MERGE_HEAD is set
tags: [fgos-coding-compounding, merge-head, retrospective-synthesis, audit]
source_capture_ids: [tsk-2oy, tsk-67t, tsk-4dy, tsk-3u8]
authoritative_for: why fgos-coding-compounding's retrospective-synthesis commit step refuses when MERGE_HEAD is already set, the 5 real historical instances that motivated it, and each instance's own per-item audit outcome
---
# Why `fgos-coding-compounding` refuses to commit when `MERGE_HEAD` is set

`fgos-coding-compounding`'s retrospective-synthesis step writes an end-user
document to the main checkout and commits it with `git -C "$root" commit
-m "docs(<id>): retrospective synthesis"`. That commit step used to run
unconditionally — no `MERGE_HEAD` check, no `.fgos/main-checkout.lock`
acquisition, no working-tree-clean precondition — even though it writes
to the same shared main checkout every `fgos approve` merge also writes
to.

## The bug this closes (tsk-2oy)

When a concurrent or crashed `fgos approve` merge was staged but not yet
committed (`MERGE_HEAD` present) at the exact moment `fgos-coding-compounding`'s
step 3 ran its own `git commit`, that plain commit silently **completed**
the other process's staged merge and mislabeled it under the
retrospective item's own commit message — burying the other item's real
diff under an unrelated `docs(<id>): retrospective synthesis` message.

This was not a hypothetical. `docs/history/retrospective-synthesis-merge-
corruption/RESEARCH.md`'s round-1 audit
(`git log --all --min-parents=2 --grep="retrospective synthesis"`) found
the pattern in 5 real commits reachable from the repo's full history:
`tsk-648`, `tsk-4v6`, `tsk-1q5`, `tsk-1vi`, `tsk-2x9`. One of them —
`tsk-2x9`'s synthesis commit, `45aa107f` — buried a genuine code fix
(`fix(tsk-1r3)`), not just a docs-vs-docs collision: a real fix landed on
a branch, then got absorbed and hidden under the wrong item's commit
message, so it looked merged (state said `cleanup`/`done`) while the
actual code never reached `main`.

The specific instance that triggered the investigation — `tsk-4v6`'s own
fix (`687abfb8`, "fgos-runner discovery sweep respects the real
clear/unclear verdict") — turned out, once traced, to have already landed
safely on its *parent* item's branch (`fgw/tsk-4b2`, confirmed via `git
merge-base --is-ancestor dbd31b42 fgw/tsk-4b2`) before `fgos cleanup
tsk-4v6` ran. So `tsk-4v6` itself lost nothing; the systemic root cause
that made the loss *possible* for the other 4 instances is what this fix
addresses. (`fgw/tsk-4b2` reaching `main` is a separate, unrelated bug —
filed as `tsk-13z` — caused by a direct `fgos move --to delivered` bypass
around two failed merges, not by this stray-`MERGE_HEAD` mechanism.)

## The fix

`fgos-coding-compounding` step 3 now refuses instead of silently absorbing:

```bash
if git -C "$root" rev-parse --verify -q MERGE_HEAD >/dev/null; then
  echo "fgos-coding-compounding: refusing to commit — MERGE_HEAD is set on \"$root\" — a merge is already staged there (likely a concurrent or crashed fgos approve). Resolve or abort that merge first; never let this step's own commit silently absorb it." >&2
  exit 1
fi
git -C "$root" add "docs/<quadrant>/<file>.md"
git -C "$root" commit -m "docs(<id>): retrospective synthesis"
```

Mirrored identically in both `.claude/skills/fgos-coding-compounding/SKILL.md`
and `.agents/skills/fgos-coding-compounding/SKILL.md` — this repo keeps the two
skill copies in lockstep.

## Why a plain precondition check, not the full main-checkout lock

The rejected alternative was wrapping step 3 in the same
`acquireMainCheckoutLock` / `git merge --no-commit --no-ff` / `git merge
--abort` sequence `mergeRunnerItem` (`src/runner/merge.mjs`) already uses
for every other main-checkout write. That would close the residual
TOCTOU window completely — a `MERGE_HEAD` could still, in principle,
appear in the narrow gap between the check and the `git commit` two lines
later. It was rejected as scope beyond what the evidence justified: none
of the 5 confirmed real-world instances raced into existence mid-commit —
in each, the stray merge was already staged well before the synthesis
commit ran — and closing that residual window would need a new reusable
lock-acquire-then-release CLI surface that nothing in this repo exposes
today. A plain `MERGE_HEAD` precondition, refusing loudly the same way
`resolveDiscovery`'s missing-`--verdict` case already refuses loudly
rather than guessing, closes the hole every confirmed instance actually
hit.

## Scope

This item's own remediation is deliberately narrow: it guards the
pipeline going forward and reports the 5 already-found instances as
evidence. It does not re-merge or repair the other 4 items' own already-
corrupted synthesis commits — each became its own follow-up item
(`tsk-67t`, `tsk-4dy`, `tsk-3u8`, `tsk-5z9`, the last prioritized first
since it buried a real code fix, same severity as the triggering case).
A related harness gap found mid-investigation — `checkMergeStillResolves`
never validates a decomposed root's own branch against `main`, only
children onto their parent — was filed separately as `tsk-5j0`.

## Per-instance audit outcome: `tsk-648` (`tsk-67t`) — content verified intact

`tsk-67t` audited the `tsk-648` instance specifically: commit `7bf76aaa`
("docs(tsk-648): retrospective synthesis") was a 2-parent merge commit —
one parent was `tsk-3wn`'s own expected prior synthesis, the other was
an entirely unrelated commit, `tsk-5nj`'s own `plan.md` (a plan-split
into `tsk-4mx`/`tsk-49e`), absorbed via the same stray-`MERGE_HEAD`
mechanism this doc's own fix closes.

**Conclusion: no content was actually lost.** Verified at the byte level —
empty `git diff` across all three affected files, plus a live status
check confirming both split children (`tsk-4mx`, `tsk-49e`) existed
correctly. The commit's *label* was misleading (an unrelated item's plan
buried under `tsk-648`'s own commit message), but the actual content
survived intact in both places. This item closed as a verified
non-issue, not a repair — this repo's status vocabulary has no distinct
`wontfix`-shaped status for "investigated, found nothing wrong,"
so a verified non-issue closes via `done` with the decision note as the
record, the same way the other 3 sibling audits (`tsk-4dy`, `tsk-3u8`,
`tsk-5z9`) are expected to close unless one of them finds a real loss.

## Per-instance audit outcome: `tsk-1q5` (`tsk-4dy`) — content verified intact

Same shape, same conclusion: commit `a23ec8a1` ("docs(tsk-1q5):
retrospective synthesis") absorbed an unrelated commit as its second
merge parent. Verified via `git merge-base --is-ancestor` against
current `main`, a single-commit file-history check, and a live
outcome-field check — **no content was lost**. Closed the same way as
`tsk-67t`'s own sibling audit: `done` with a decision note, since this
repo's status vocabulary has no distinct status for "investigated, found
nothing wrong."

## Per-instance audit outcome: `tsk-1vi` (`tsk-3u8`) — content verified intact

Same shape again: `tsk-66t`'s own evidence and the `tsk-1vi` doc it
produced were confirmed to survive intact on `main`, despite the same
stray-`MERGE_HEAD` absorption. No content lost; closed the same way as
the other instances above.
