---
type: reference
title: Worktree/merge lifecycle audit findings (2026-08-14)
tags: [audit, worktree, merge, lifecycle, code-review]
source_capture_ids: [tsk-25r, tsk-18k, tsk-1mn, tsk-2iz, tsk-ikd, tsk-4bh, tsk-2jn, tsk-4yv]
authoritative_for: the 9 findings from the 2026-08-14 fable code-review audit of fgOS's worktree claim/merge/cleanup lifecycle, and which work item tracks each
---
# Worktree/merge lifecycle audit findings (2026-08-14)

`tsk-25r` (parent/coordinator item). Full report:
`plans/reports/worktree-merge-audit-260814-1809-fable-hidden-bugs-report.md`.
Each finding below was filed as its own separate work item, ready to be
picked up individually or driven as a batch — none had landed a code fix
as of this audit's own capture.

| id | severity | finding |
|---|---|---|
| `tsk-18k` | high | **Fixed.** Merge-target-slot lock's string-identity release/renew could delete a sibling session's live lock after a TTL reclaim — fixed via pid identity (not the nonce first proposed) plus an atomic `git update-ref` hardening a related CAS gap the same discussion surfaced. Full detail: `docs/explanation/why-the-merge-target-ref-slot-disabled-lock-self-recognition.md` (a third round on the same call site `tsk-1wr`/`tsk-70l` already worked on). |
| `tsk-1mn` | medium | **Fixed.** `claimWork` held the main-checkout lock across synchronous `npm ci` with no heartbeat, letting the TTL expire mid-claim and reopen the concurrent-writer race `tsk-18k` also addresses. Fixed by releasing `main-checkout.lock` *before* `claimWork`'s synchronous `npm ci` runs, rather than adding a heartbeat — the two findings are companions: `tsk-18k` fixes what happens *after* a TTL-driven reclaim, this fixes how *often* one happens in the first place. |
| `tsk-2iz` | medium | **Fixed.** Decision-index auto-resolve could mint duplicate decision IDs (reading only one of two relevant trees) and a throw mid-resolve could skip the merge abort. Fixed by having auto-resolve consider both trees and never skip the abort path on a throw. |
| `tsk-ikd` | medium | **Fixed.** `return`'s main-source path had no main-worktree guard, unlike `approve`/`sync-root`/`promote-to-component`, which all already refuse when run outside the main checkout. Fixed: `return`'s main-source path now refuses against an unregistered worktree the same way. |
| `tsk-4bh` | medium | **Fixed.** `checkMergeStillResolves` never skipped `wontfix`/canceled children, causing a permanent cleanup block on a decomposed root that had one. Fixed: the check now skips canceled/`wontfix` children. See `docs/explanation/why-checkmergestillresolves-can-false-positive-after-a-root-branch-prune.md` for the full family of fixes to this same function. |
| `tsk-2jn` | medium-low | **Fixed.** `footprintOverlapAmong` compared raw declared paths without `normalizePath`, so differently-spelled but identical footprints (e.g. `./src/x.mjs` vs `src/x.mjs`) could dodge parallel-dispatch conflict detection. Fixed: both sides now normalize through `normalizePath` before comparison. See `docs/explanation/why-a-partially-materialized-decompose-no-longer-locks-out-the-remaining-children.md` for `tsk-11v`'s earlier, separate fix to the same function (deps-edge "sequence" resolution). |
| `tsk-4yv` | low | **Partially fixed.** A `finishWorktreeSetup` failure leaked a registered worktree. Fixed: on failure, `finishWorktreeSetup` now force-removes the worktree it had just registered. The detached-merge-worktree half of this finding (never reclaimed by anything) was not addressed by this same fix. |
| `tsk-386` | low | `baseRef: 'main'` hardcodes survive in `worktree.mjs` and `approve`'s root-branch fallback despite the earlier trunk-detection work. |
| `tsk-f8f` | low | `lastActivityAt` mis-parses git-quoted paths — activity on filenames with spaces/special characters is invisible to the stale-claim reclaim check. |

## Unresolved questions the audit itself named

- Findings 3 (`tsk-2iz`) and 5 (`tsk-4bh`) both touch the
  decomposed-parent merge/cleanup path — worth confirming whether fixing
  one changes the reproduction shape of the other before implementing
  either.
- Finding 8 (`tsk-386`)'s overlap with an already-`done` trunk-hardcode
  item wasn't fully resolved at capture time.

Each finding is tracked and, where later implemented, synthesized under
its own work item id — this reference is the audit's own index, not a
substitute for each fix's own record.
