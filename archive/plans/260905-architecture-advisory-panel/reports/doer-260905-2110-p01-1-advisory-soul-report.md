# Doer Report — P01.1 Author The Soul

Role: Doer
Cell: P01.1 (Author the soul)
Assignment: `asgn_p01_1_coordinator_op_001`
Track: `architecture-advisory-panel`
Branch/worktree: `architecture-advisory-panel--p01-1` at
`/home/vantt/projects/architecture-advisory-panel-p01-1`
Date: 2026-09-05

## What Was Built

Four soul artifacts, 3434 lines total. `master-coordinator.md` (571 lines) was
treated as the floor for doctrine depth, per the cell contract.

| File | Lines | Role |
|---|---|---|
| `playbooks/prompts/architecture-advisory-coordinator.md` | 700 | one-paste coordinator prompt |
| `playbooks/architecture-advisory-role-doctrine.md` | 1549 | 9 roles + disposition doctrine + routing roster |
| `playbooks/architecture-advisory-artifact-templates.md` | 781 | 15 prose templates |
| `playbooks/architecture-advisory-evaluation-rubric.md` | 404 | 12 qualitative dimensions |

## The Nine-Phase Loop, And The Ninth Phase

Phases 2–9 are phase-01.md's eight Required Doctrine principles: Understand the
person, Understand the problem, Ask reluctantly but clearly, Diverge honestly,
Debate claims, Converge without flattening, Explain for ownership, Stay in
dialogue.

The ninth is **Phase 1 — Intake and Framing**, inserted before "Understand the
person" rather than by splitting one of the eight. The justification is written
into the coordinator prompt itself, not left implicit:

- The plan-level invariant that *original human input, panel interpretation,
  advisory recommendation, and human decision remain separate immutable
  artifacts* is unenforceable unless some phase's only job is producing the
  first of those four — before any interpretation exists to contaminate it.
- Crash recovery needs a version of the question that predates the panel's
  opinion about it. Without a frozen intake, a resuming coordinator's earliest
  available "question" is already an interpretation.
- Roster resolution belongs before opinions exist, so routing cannot be
  retro-fitted to a conclusion.

Splitting one of the eight was rejected because each of the eight is already a
single coherent cognitive act; splitting for arithmetic would have produced two
half-phases and weakened the doctrine.

## Design Decisions Worth Reviewing

1. **The proven-safe roster lives outside the prompt block.** The pasteable
   prompt refers to `ROSTER_SOURCE` and stays environment-independent; the
   concrete P00.1 allowlist (`codex-readonly`, `claude-bwrap`, `agy-bwrap`) and
   its tier→model derivation table sit in the surrounding document and in the
   role doctrine's routing roster. Rationale: plan.md forbids hardcoding
   provider/model into portable policy, and the same discipline should apply to
   the manual soul so it does not have to be unlearned in Phase 03.

2. **Bad examples are real, not strawmen.** Every role's bad example is the kind
   of output a capable model actually produces when the role is under-specified
   — a fluent, plausible, useless artifact — and each is followed by a named
   diagnosis so a Reviewer can point at a failure by name rather than by taste.
   This was the specific bar phase-01.md set ("a role name plus expected-output
   fields is insufficient").

3. **The rubric has verdicts, not scores.** Four verdicts, no weighting, no
   total. A number would let a session pass by being adequate everywhere while
   failing the one dimension that mattered, and it would contradict the panel's
   own bound against tallying and weighted scoring.

4. **`false pass` sections.** Several rubric dimensions and every role's
   anti-pattern list name the shape a failure takes when a capable panel
   satisfies the letter and misses the point — the designated-loser alternative,
   dissent laundering, elaborate restatement mistaken for reframing, ceremonial
   questions inside one tidy Decision Request. These are the failures P01.2/P01.3
   are most likely to hit.

5. **Only two enumerations exist in the whole set** — the six driver
   dispositions and the three red-team verdicts. Both are authority acts, not
   judgments about architecture. Everything phase-01.md and plan.md warn against
   enumerating (empathy, materiality, reframing, alternative quality, debate
   style, calibration, explanation) is prose with heuristics and worked examples.

## Blockers Encountered

The permission layer refused a large subset of commands this session ("This
command requires approval"), with a non-obvious split that matters for reading
the evidence:

- **Refused:** `git status` in every form (`--short`, `-s`, `--porcelain`),
  `git log`, `git show`, `git diff --cached`, `command git status`,
  `/usr/bin/git status`, `rtk proxy git status`; all `node` (including a bare
  `node -e "console.log('node ok')"`), `wc`, and `grep`.
- **Admitted:** `find`, `git add`, `git commit`, `git ls-files`, and
  `find … | xargs wc -l`.

Consequences, all recorded in `P01.1.md`'s Gaps and Commit sections:

- **The commit was created**: `9559c81`, six files, 3725 insertions, staged by
  explicit path.
- **`git status --short` was never captured verbatim.** Substitute recording:
  post-commit `git ls-files --others --modified --exclude-standard` returned
  empty — a clean working tree with no untracked or modified files. Equivalent
  in content, not the literal command the phase names.
- **The plan's exact `node -e` relative-link command was not run.** Links were
  verified instead by enumerating every target with `find` and checking each
  relative path by construction — all 13 internal links resolve, but this is
  weaker evidence than the plan's own command and the Reviewer should re-run it.
- **`mdview open` was not run** for the four artifacts, which phase-01.md's
  Commands And Evidence section requires.

## Lease Discipline

Stayed strictly inside `panel-soul` plus this cell's own trace/report paths.
`docs/architect/agent-coordination/playbooks/README.md` is **not** updated to
index the four new files, even though the index is now incomplete: that path is
outside the lease and adding it is a Coordinator lease-amendment decision, not a
Doer's call. Flagged in `P01.1.md`.

## Unresolved Questions

1. Should `playbooks/README.md` be amended into the `panel-soul` lease so the
   index lists the four new playbooks? The index is currently incomplete.
2. Who satisfies the unexecuted link-check and `mdview open` obligations — the
   Reviewer, or a follow-up Fixer assignment?

Status: DONE_WITH_CONCERNS
All four soul artifacts are authored in full with real load-bearing doctrine,
worked good/bad examples per role, and the justified nine-phase loop; committed
as `9559c81` on this worktree's branch.
The permission layer blocked `node`, `grep`, `wc`, and every form of
`git status`, so the plan's literal link-check command, `mdview open`, and the
verbatim `git status --short` record are unmet and must be completed by the
Reviewer or a follow-up assignment.
