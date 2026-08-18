# CONTEXT — tsk-13z: land fgw/tsk-4b2's real content on main

## Feature boundary

Land `fgw/tsk-4b2`'s real content (tip `7add82b8`) on `main` for real,
closing the gap where `tsk-4b2` was marked `delivered` via a direct
`fgos move --to delivered` bypass instead of a successful `fgos approve`
(event seq 11979, 2026-08-10T10:45:37Z). Scope is exactly: get `7add82b8`
onto `main`'s ancestry, verified by the item's own `verify` command
(`git merge-base --is-ancestor 7add82b8 main && npm test`). Nothing else.

Explicitly OUT of scope (deferred to the sibling item the description
itself points at): fixing `checkMergeStillResolves`' decomposed-root
gap — the harness bug that let `tsk-4b2` replay
`delivered -> retrospective -> cleanup` without ever catching the missing
merge. This item repairs the one instance; the sibling item repairs the
detector.

## Locked decisions

| ID | Decision |
|---|---|
| D1 | Scope is landing `7add82b8` only — the `checkMergeStillResolves` decomposed-root detector gap stays with its own sibling item, not this one (see Feature boundary). |
| D2 | **SUPERSEDED by D4.** The item's own `verify` command is correct and runnable as stated — confirmed via `fgos-researching`'s round 1 (`docs/history/tsk-13z-land-tsk-4b2-on-main/RESEARCH.md`): `git merge-base --is-ancestor 7add82b8 main && npm test`. "Runnable" was true, but the command is unsatisfiable through the mechanical gate pipeline — see D4. |
| D3 | No `CHANGELOG.md` entry — per `AGENTS.md`'s install/setup/doctor gate ("does this change something a user of fgOS would see?"), this restores intended-but-never-landed internal wiring (a `fgos-routing` table correction plus discovery/exploring stage refinements already documented as landed in `5b394faf`'s commit message); it is not new user-visible behavior. |
| D4 | **Supersedes D2.** Found during `fgos-coding-implement`, after the real merge landed: `fgos approve`'s goal-check (`src/runner/merge.mjs`'s `mergeRunnerItemLocked`, lines ~929-1016) runs the item's `verify` on a `git merge --no-commit --no-ff` staged tree — BEFORE the `git commit` (line 1036) that would actually advance the `main` ref. At that exact moment `main` still points to its pre-merge SHA, so `git merge-base --is-ancestor 7add82b8 main` can never return true through this pipeline — confirmed empirically both by tracing the code and by running the exact command in this worktree after a real merge commit on `fgw/tsk-13z` (still reports NOT ANCESTOR, since `main` is a ref shared across all worktrees and hadn't moved). Replaced with a content-based `npm test && POSITIVE && NEGATIVE` check per `docs/how-to/write-verify-for-a-skill-prose-change.md` (this item touches `.claude/skills/fgos-routing/SKILL.md`, a skill-prose path): asserts the fixed `clarify -> fgos-clarifying` row is present in both `.claude/` and `.agents/` mirrors, and that no line still pairs `clarify` with the wrong `fgos-coding-exploring` target. Empirically confirmed to FAIL against current `main` (bug present) and PASS against the merged content (bug fixed) — a real discriminating check, evaluable at both `fgos return` and `fgos approve`'s staged-pre-commit point, unlike the original. Confirmed with the user via `AskUserQuestion` before editing the item's `verify` field (an acceptance-criteria change, not silently swapped). |

No candidate question in this round met the material+grounded+answerable
bar — the item's own description already fully specifies the fix and the
completion path (fresh conflict check, then land via the standard
`fgos cleanup -> move --to blocked/awaiting-approval -> fgos approve`
sequence tsk-4v6 used), and round 1 research confirmed that path is clear.
The remaining open item — *which concrete git/state mechanism actually
lands the branch* (re-driving `tsk-4b2`'s own already-terminal status
machine vs. merging `fgw/tsk-4b2` directly into `fgw/tsk-13z` and landing
through this item's own lifecycle) — is an implementation-strategy choice
for whoever builds it, not a product decision; left to `fgos-coding-planning`.

## Pinned terms

- **"land"** — make `7add82b8` an ancestor of `main`, verified by the
  item's own `verify` command. Not merely "the same content exists on
  main" (main already has *part* of tsk-4b2's own fix through unrelated
  commit `5b394faf` — see RESEARCH.md — but the literal ancestor check
  still fails, and a real, still-live bug remains: `.claude/skills/fgos-
  routing/SKILL.md` on main still reads `clarify -> fgos-coding-exploring`
  instead of the registry's real `clarify -> fgos-clarifying`).

## Scout evidence

- `docs/history/tsk-13z-land-tsk-4b2-on-main/RESEARCH.md` (round 1,
  2026-08-11T06:24Z) — full merge-tree dry-run evidence: `fgw/tsk-4b2`
  merges cleanly against current main (0 conflicts, 9 files touched), the
  two historical friction failures are stale, and one concrete still-live
  bug (`fgos-routing` table) is confirmed and would be fixed by the
  merge.
- `src/state/workflow-stage-graphs.mjs:148` — registry entry
  `clarify: 'fgos-clarifying'`, confirming the routing table on main is
  currently wrong.
- `fgos tool query --capability impact-analysis --status present` →
  `gitnexus` registered and `present`. **Degraded**, per `CLAUDE.md`'s own
  gate: a separate hook check in this same session flagged the index as
  stale (`last indexed: 4ce7a96`, behind current HEAD). Blast radius from
  GitNexus should be treated as unconfirmed until `gitnexus analyze` is
  re-run — this item's own risk is low regardless (landing an already-
  written, already-reviewed branch, not new code), so this gap is noted
  rather than blocking, per the gate's own "plausible but depends on
  product intent" framing (here: intent is a mechanical branch-land, not
  new logic, so a stale graph is a low-consequence gap).

## Canonical references

- Item description's own two cited frictions: `main@277a64be` (merge
  conflict) and `main@480c2a39` (goal-check failure) — both superseded;
  current main is `11f04361`.
- `docs/history/tsk-4b2-discovery-exploring-stage-wiring/` — the original
  feature's own plan/decisions, for anyone who wants the full history of
  why `fgw/tsk-4b2` exists.

## Outstanding questions

None
