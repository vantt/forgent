---
phase: 20
title: "Plain fgos run retention: a read-only measurement of the share and bytes of plain Unit runs for the owner machine (guide), then the retention options and their costs as an owner question; no rule is decided here"
status: pending
depends_on: ["01-15 on main (T6 as closed 2026-11-08)"]
parallel: "final wave: step 1 with 16, 17, 18, 19 (touches only the guide); step 2 waits for the owner's numbers and answer"
effort: ~0.5d (step 1 ~0.25d, step 2 ~0.25d; the owner's measurement and answer are outside the estimate)
net_size: "Node 0 / Rust 0 / tests 0 (step 1 is a guide recipe; any rule that follows is its own phase with its own estimate)"
---

# Phase 20 — Plain `fgos run` retention (owner decision 73 (e); closing report idea 7; backlog `p-tslryr3buq` open clause)

## Context

Owner decision 73 (e): "plain `fgos run` Unit run retention: measure the share on the owner machine first, then a retention rule." Prune (phase 12, `RUL-WF-40`) removes only Unit runs a finished case names; Unit runs of plain `fgos run` have no case and no retention. The T6 smoke could not size them: run history on fg-server2 was wiped earlier on 2026-11-08, three plain runs and no case existed (closing report, "Smokes: Prune"). The arbitration measured `.fgos/assignments` at 1 405 MB in 529 directories on 2026-11-08 (31 MB per Unit run, mostly the worker outbox).

### Does the dry run already report it? No (checked)

`fgos workflow prune --json` returns `{ applied, olderThanDays, cases, unitRuns, kept, bytes }` (`src/workflow/case-verbs.mjs:381-382`, `pruneFinishedCases` return value `case-close.mjs:236`). `unitRuns` are runs a case names; a plain run is never listed, never kept with a reason, never counted in `bytes`. `fgos dispatch inspect --cwd .` lists runs but costs 5.0 s at 912 runs (backlog `p-tslryr3buq`) and has no byte total. So a read-only measurement needs a recipe; none exists.

### What identifies a plain run (traced)

A Unit run admitted through a case carries `unit.json` `workflow: { caseId, activity, reservationId }` (`src/runner/execution/unit-run-start.mjs:413`); a plain `fgos run` has `workflow: null` (checked on this checkout's `.fgos/assignments/unit-run-*/unit.json`: `null`). Settled state is `unit.json` `execution.status === 'settled'` (`src/runner/execution/run.mjs:335`). The directory of a run is `.fgos/assignments/<id>` (`assignmentDir`, `src/runner/dispatch/assignment-layout.mjs:48`).

## Step 1 — measure on the owner machine (read-only)

**Chosen route: a recipe in the guide, no repository code.** Reason: a one-time measurement on two or three machines; a new field on `prune --json` is a feature (RUL104: nothing new unless it earns it) and is offered as the optional follow-up in the question below.

### Requirements

1. A short, self-contained read-only Node snippet in the Vietnamese guide `plans/reports/guide-261108-1230-owner-machine-harden-t6-workflow.md`, as a new section after the P12 section (guide sections are per phase; this one is headed for this phase), with: purpose, the command to run in the project root (`node --input-type=module -e '...' -- <project-root>`), what each output line means, and "chỉ đọc, không xoá gì".
2. The snippet opens nothing for writing; it uses `lstat`, `readdir` and `readFile` only; it never follows a link (a symbolic link directory is counted as `link` and not entered); it never runs `fgos` verbs.
3. Output, JSON on stdout: for the whole `.fgos/assignments` and for each bucket `case` (`unit.json` has `workflow.caseId`), `plain` (`workflow` is `null`/absent), `no-record` (no readable `unit.json`), `link`: the number of directories, the bytes, the share of the total in percent for both, and for `plain` also: settled count and bytes, unsettled count and bytes, and the count and bytes by age of `unit.json` modification time (`< 7 d`, `7-14 d`, `14-30 d`, `> 30 d`), plus the five largest plain runs (id and bytes). Age is the file's mtime, not parsed from the id.
4. A line in the guide says to paste the output into the board line or the owner's answer, and to run it on each machine separately (owner machine and fg-server; fg-server2 is the lead's).
5. The section also records, once, what step 2 will ask, so the owner reads numbers and options together.

### Files

**Create:** none.

**Modify:** `plans/reports/guide-261108-1230-owner-machine-harden-t6-workflow.md` (one new section, append-only; phases 18 and 19 also append sections; rebase, never serialize).

**Delete:** none. **Tests to retire:** none.

### Validation of the recipe (before it goes into the guide)

Run it on the main checkout (`/home/vantt/projects/forgent`, 8 Unit runs at plan time) and on a scratch copy of a `.fgos/assignments` tree built under `/home/vantt/projects/forgent-worktrees/` (never `/tmp`): total bytes equal `du -sb` of the directory; the `case` bucket's directory ids equal the ids `fgos workflow prune --older-than 0d --json` lists as `unitRuns` or `kept` for finished cases; a symbolic link directory is counted `link` and its target untouched; a directory without `unit.json` lands in `no-record`; the snippet leaves every mtime and byte of the tree unchanged (compare a `find -printf` listing before and after). Record the result in the phase report.

## Step 2 — the retention question for the owner (options, not a decision)

Asked after step 1's numbers are in the guide and, if available, pasted by the owner. Template: `core/skills/_shared/decision-question.md` (what is happening, cause, options with cost, recommendation, scope of the answer). The lead fills the numbers; the skeleton:

**What is happening.** Plain `fgos run` Unit runs are never removed. On the owner machine they are X percent of `.fgos/assignments` by bytes and Y percent by count (step 1).

**Cause.** Prune walks from a case ledger to the Unit runs it names; a plain run has no ledger, so nothing names it and nothing decides when its record is no longer needed. A plain run's report and result exist only on disk (no ledger copy), which is why deleting one is not free.

**Options and cost** (each states what it must not remove: a run with a controller, an attempt or custody held, an unsettled run that can be resumed, a link, anything an open case names):

| Option | What it does | Cost | Risk |
|---|---|---|---|
| A. Nothing now | Record the numbers; leave `p-tslryr3buq` partly open | 0 | Disk and `dispatch inspect` time keep growing; the clause stays open |
| B. Age only, opt-in | `fgos workflow prune --plain --older-than <N>d` (dry run by default) removes settled plain runs older than N; not part of the automatic prune at case close | Node about +30..+45, tests about +40, one CHANGELOG line, one registry entry; a new phase | A flag the owner must remember to run; one more path through the same judge (the keep reasons table) |
| C. Age only, automatic | The same rule inside the post-close prune (default 14 days, as for cases) | Same as B plus the post-close prune now touches runs no case owns | A plain run's report disappears after N days without the owner asking; the one surprise-deletion path of the layer |
| D. Longer age for plain runs | B or C with N = 30 or more | Same as B or C | Frees less; harder to explain two defaults |
| E. Size cap at the source | Cap the evidence a run writes (T5's arbitration addition 5, decision 71 6a did not take it; closing report idea 8) | Execution Core change, T5's files | Bounds bytes per run, not the number of runs (`dispatch inspect` cost) |
| F. A `prune --json` field | Report the plain share in the dry run (`plain: { runs, bytes }`) so the owner reads it without the recipe | Node about +15, tests about +20 | A new output field for a one-time measurement |

Options are not exclusive (F with B, E with any). **Recommendation: not made until the number is in.** Preliminary reading only: if plain runs are a small share of bytes, A (record and stop); if most of the bytes, B first (opt-in, reviewed dry run, as phase 12 did), then C only after the owner has seen a real dry run.

**Scope of the answer.** The owner's choice sets the next phase (its own estimate and file list); it does not change phases 16-19 and does not block them. If the owner answers A, step 2 closes the clause in the backlog row as accepted.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| The recipe writes or follows a link | L x H | Read-only by construction; validation compares the tree before and after; links counted, not entered |
| Plain share is misread because case-linked runs of other machines are counted plain | L x M | Bucket is by `unit.json` content, not by name; `no-record` shown separately |
| The owner reads a retention rule as decided | M x M | Step 2 says "options, no recommendation until the number is in" |

## Rollback

Revert the guide section. Nothing else changed.

## Done when

The guide section is on main with the validated recipe; the owner (or the coordinator on the owner's behalf) has the numbers; the decision-question is delivered in the template and answered, or parked with the numbers noted on the backlog row and the board.

## Net size (honest)

Node 0, tests 0, guide about +40 lines. Any rule that follows (B, C, D, F) is a new phase with its own estimate, stated above only as a range so the owner sees the cost; none is added to this wave's totals.

## Dependencies

Step 1: none; parallel with 16-19 (only the guide, append-only). Step 2: step 1's output from the owner machine. The owner's answer is the only blocking input of this wave.
