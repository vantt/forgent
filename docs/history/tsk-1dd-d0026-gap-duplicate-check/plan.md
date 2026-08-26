# tsk-1dd-d0026-gap-duplicate-check — plan.md

Mode: tiny (0 flags of auth/authorization/data-model/audit-security/
external-systems/public-contracts/cross-platform/existing-covered-behavior/
weak-proof/multi-domain apply — this is a documentation-accuracy check with
no production code change, and discovery's own research (RESEARCH.md round
1) already found the requested change is already live on `main`). No
CONTEXT.md exists — discovery's verdict was `clear`, which skips
`exploring` by design.

## Approach

`RESEARCH.md` round 1 already did the real work: it re-verified all 4 of
`tsk-1dd`'s own evidence citations live against the current worktree and
found every one of them already reconciled — not as claimed in the item's
own text, but because a separate, already-`delivered` work item,
`tsk-17m`, did this exact reconciliation ~90 minutes before `tsk-1dd` was
even submitted (commit `7120a3ed`, confirmed a live ancestor of this
item's own branch via `git merge-base --is-ancestor`). `tsk-17m`'s own
`plan.md` (`docs/history/d0026-narrative-reconciliation/plan.md`) covered
the identical scope: same 2 files, same cite points
(`mechanism.mjs:42`/`:82`), same resolution direction (supersede/clarify:
4/5 phases done, Pha 5/`tsk-6db` deliberately deferred/YAGNI).

Concretely, every one of `tsk-1dd`'s own Acceptance Criteria is already
true on `main` today:
- `dispatch-control-plane-redesign.md:15` already states `decide` is "the
  concrete result of D0026's 4 done phases, with phase 5 extending native
  detection to agy deliberately deferred per `docs/specs/runner.md`'s
  'Lớp còn thiếu...' section".
- `runner.md`'s "Lớp còn thiếu" section already states 4/5 phases done,
  Pha 5 deferred/YAGNI, with the deliberate-narrowing paragraph and the
  5-phase status table.
- `mechanism.mjs`'s docblocks already state `hasLiveTaskAccess` is
  caller-self-declared, never probed/inferred.
- `docs/how-to/wire-a-skill-through-the-native-vs-cli-spawn-dispatch-
  decision.md` already states the same self-declaration distinction.
- No doc anywhere claims DispatchPlan auto-detects live soul/provider
  (confirmed via a targeted `rg` sweep for auto-detect phrasing).

Two considered shapes: (a) re-apply the same prose edits `tsk-17m` already
made — rejected, this would either be a silent no-op (identical text
already present) or introduce a spurious second edit/duplicate wording
into files `tsk-17m` already finished; (b) write no further doc edits and
record the duplicate finding for a human to close the item — chosen,
because the honest "smallest plan" for a request whose entire acceptance
criteria are already satisfied is to do nothing further and say so
plainly, the same shape this repo's own `docs/history/agy-herdr-
interactive-mode-multiline-prompt-corruption/plan.md` (`tsk-5cr`)
precedent already used for a different "research already answered
everything this item needs" case.

Files touched: none beyond what discovery already committed
(`RESEARCH.md` in this same feature dir).

Risk map: none — no production code or doc changes, no behavior change.

## Shape

Nothing further to implement. The one real action here is the human
approval-gate decision: mark `tsk-1dd` `wontfix`/`supersededBy tsk-17m`
rather than merge a no-op branch, since `tsk-17m` is already `delivered`
and already live on `main`. This plan does not perform that edit itself —
`fgos edit --superseded-by` is a decision for whoever reviews this item at
`awaiting-approval`, not something `fgos-coding-planning` applies on its
own authority.

## Split decision

No split. One piece, one item, stays as `tsk-1dd` itself through
`executing` — there is nothing to divide when the honest answer is "no
further work."

## Outstanding questions

None — the duplicate finding is fully evidenced in `RESEARCH.md` round 1,
not a gap needing a person's product judgment.
