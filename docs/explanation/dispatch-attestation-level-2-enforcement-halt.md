---
authoritative_for: worktree dispatch attestation level 2 enforcement halt, baseCommit/headRef mismatch guard at reap/return/approve, tsk-43z incident it closes, fail-open on missing attestation
---

# From advisory-only to a real halt — closing the gap a wrongly-spawned worker exposed

`tsk-34o5` escalated worktree-dispatch attestation from advisory-only
(level 1, `tsk-2ig`/`tsk-4hl`) to a real enforcement halt at
reap/return/approve, closing the exact gap
[`tsk-43z`](dispatch-execute-repo-root-cwd-separation.md)'s own incident
exposed: a wrongly-spawned worker committed straight to `main`, caught
only by luck plus a manual revert.

## What level 1 already had, unchanged here

Level 1 already captured `baseCommit`/`headRef` for a real worktree
dispatch before spawn (`captureDispatchAttestation`,
`src/runner/dispatch/transport.mjs:113-127`) and persisted it into an
`executor.dispatch` event (`src/runner/loop.mjs`), plus an advisory-only
`footprintDiffHits` check (`src/runner/frozen-judge.mjs`). None of that
capture/persist machinery changed — this item only added a consumer that
actually acts on what was already being recorded.

## Why enforcement, and why now

Three reasons recorded directly in the item's own text: (1) `tsk-43z` is
real proof this failure mode happens — the root-cause fix for that
incident already landed, but nothing enforced the *next* variant of the
same class. (2) It complements schedule-ahead dispatch
(`computeSchedule`'s footprint-declared wave planning): rather than
paying the cost of a live, global runtime ledger the way upstream
`beehive` does, fgOS enforces at the boundary instead — paying the cost
only when a real violation occurs. (3) It converts a silent incident into
an automatic halt — directly serving priority #2 ("Release con người").

## Scope held deliberately narrow

Only identity divergence halts: a mismatched `headRef`, or a branch tip
that is not a descendant of the recorded `baseCommit` — never
`footprintDiffHits`, which stays advisory (a footprint diff beyond what
was declared is a product-intent question, not something to auto-halt
on). The item's own round-7 shaping note records two related design
questions explicitly resolved against wider scope: rejecting
same-transaction adoption, and confirming parent-scope enforcement over a
global ledger — keeping this a narrow, boundary-only check rather than a
new tracking system.

## What shipped

A new shared guard, `checkDispatchAttestation` (`src/runner/attestation-guard.mjs`):
reads `.fgos/events.jsonl` for the **last** `executor.dispatch` event
matching a work item's id (so a retry's later dispatch is what's checked,
not a stale earlier one), and:

- **Fails open (skip, `ok: true`) on anything absent** — no matching
  event, or a `baseCommit`/`headRef` missing from the payload (the
  in-session dispatch path, which never carries this attestation at all).
  Never halts on absence.
- **Check 1**: the recorded `headRef` must match the expected branch name
  (`fgw/<id>`) — a mismatch halts.
- **Check 2**: the actual branch tip must be a git descendant of the
  recorded `baseCommit` (`git merge-base --is-ancestor`) — not, halts. A
  branch that can't be read at all also fails open (lets the caller's own
  branch-existence handling take over), rather than halting on an
  unrelated error.

Wired into three call sites: `startupReap`, `fgos return`'s
branch-source path, and `fgos approve`'s merge path
(`bin/fgos.mjs`/`src/verbs/merge/approve.mjs`). A real mismatch halts
with a typed park reason (`attestation-mismatch`), never a generic throw
— the item's own item park carries typed evidence, not just a failure.

## Verified against the exact failure shape, and against a false-positive risk

Acceptance was framed around three concrete cases, all covered by tests:
a dispatch with real attestation followed by a commit landing on the
wrong branch → reap/approve halts with the typed park reason; the normal
green path (a commit on the correct branch) → behavior unchanged; and a
legitimate retry on a branch that already has older commits, whose tip
still descends from the recorded `baseCommit` → explicitly proven NOT to
be falsely halted.

## Not a duplicate

Level 1 (`tsk-2ig`/`tsk-4hl`, the capture/advisory piece this item
consumes but does not modify) — not yet separately retro-processed as of
this doc's own writing;
[`tsk-43z`](dispatch-execute-repo-root-cwd-separation.md) — the root-cause
fix for the original incident, already closed; this item is the
enforcement layer that now catches the next occurrence automatically.
