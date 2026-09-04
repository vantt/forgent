---
authoritative_for: fgOS submit's (and cook's) dependency-candidate duplicate-detection scan calling `fgos list --json` with no `--all` flag, which silently excludes `delivered`/`retrospective`/`cleanup`/`done` items from duplicate detection since `fgos list`'s default view filters out any resolved-status item (`isResolvedStatus`, `TAIL_RESOLVED_STATUSES`); fixed by widening both call sites to `list --all --json`
---

# A merged-but-not-yet-cleaned-up item was invisible to duplicate detection

`tsk-68j` fixed a real gap in `/fgOS:submit`'s (and `/fgOS:cook`'s, which
reuses the same step) dependency-candidate scan: it silently missed any
item that had already merged to `main` but had not yet run through
`retrospective`/`cleanup`.

## Root cause

`fgos list`'s default view (`bin/fgos.mjs`) filters out any item where
`isResolvedStatus(item)` is true (`src/state/frontier.mjs`,
`TAIL_RESOLVED_STATUSES` = `delivered`/`retrospective`/`cleanup`/`done`)
unless `--all` is passed. `plugins/fgOS/skills/submit/SKILL.md`'s step 2
dependency-candidate scan called exactly `list --json` — no `--all` — so a
`delivered`-but-not-yet-`cleanup` item was structurally invisible to the
one heuristic meant to catch a duplicate submission.

## Live-reproduced collision that surfaced it

`tsk-17m` reconciled the D0026/Native-First Dispatch Doctrine narrative gap
and merged to `main` (commit `7120a3ed`) at 14:56, landing at status
`delivered`. ~90 minutes later `tsk-1dd` was submitted asking to reconcile
the exact same gap. The submit-step's own dependency scan ran against a
live dump that did not include `tsk-17m` at all, because it was already
`delivered` and the scan used the narrow default. The duplicate was only
caught later, during `tsk-1dd`'s own discovery-stage research (git
log/show/merge-base) — after `tsk-1dd` had already gone through submit
plus a full discovery pass, wasting a complete downstream cycle (planning,
validating, an out-of-process dispatch, executing, approve) to reach
"already done, nothing to implement." `tsk-1dd` itself was later processed
in this same retrospective sweep as a verified duplicate needing no new
code — see [`d0026-native-first-dispatch-narrative-reconciliation`](d0026-native-first-dispatch-narrative-reconciliation.md).

## The decision

The item explicitly proposed three options without prescribing one:
widen the scan (either bare `--all` or a narrower
delivered/retrospective/cleanup-only filter), document the blind spot
only, or build a dedicated recency check. A person answered via
`/fgOS:ask`: **Option 1, bare `--all`** — reusing the exact pattern
`herdr-plugin/src/fgos.rs` already used in its own 3 call sites for a
complete cross-status picture, rather than inventing new filter logic.
The narrower delivered/retrospective/cleanup-only filter and the dedicated
recency check were both rejected as unnecessary new machinery (YAGNI/KISS)
when `--all` already exists and does the job. False positives from
`done`/`wontfix` candidates were judged a non-issue — submit's step 3
still requires an explicit human confirm/reject before any dependency
relationship is attached.

## What shipped

Both duplicate call sites were widened from `list --json` to
`list --all --json`:

- `plugins/fgOS/skills/submit/SKILL.md` step 2's own scan command.
- `plugins/fgOS/skills/cook/SKILL.md` step 1, which reuses the same scan.

A one-line-each, two-file change — no new filter logic, no dedicated
recency mechanism.
