# Phase 03 — Plan-Loop Skill And Live Proof

Depends on: Phase 01 AND Phase 02 both closed and merged into the track
branch. Solo cell (no parallel sibling in this wave).

## Objective

Author the `fgos-plan-loop` skill (the group-thinking-native successor to
`master-coordinator.md` for Work-independent tracks) and prove the whole
loop works end to end on a REAL host/dogfood project — never `forgentX`
itself. The proof must exercise cross-provider dispatch, a real forced fix
round, and a killed-and-resumed cell, and must confirm zero Work-engine
involvement throughout.

## Requirements

- **R1**: `.agents/skills/fgos-plan-loop/SKILL.md` written, covering: how
  to resume via `fgos coordination chain <track>`; how to open a cell
  (create a worktree, compose the `open.json` request from the template
  below, dispatch); how to read Reviewer/Red-Team results and disposition
  findings; how to authorize+dispatch a fix round (`fix-N.json`); how to
  close a cell (`close.json`, then the Lead's own merge+worktree-removal);
  the four-condition mutation rule from Phase 01, stated plainly so the
  Lead knows exactly what a Doer/Fixer step must declare; the explicit
  non-goals (no Work involvement, no git authority inside the session,
  the Lead performs every merge into the track/main branch itself). State
  Phase 01's own commit-policy decision plainly: a Doer/Fixer MAY commit
  its own work on the cell's own worktree branch (the default executor
  already permits `git add`/`git commit`); the Lead alone merges that
  branch into the track/main branch — the session itself never merges.
- **R2**: Byte-identical mirror under `plugins/fgOS/skills/fgos-plan-loop/`,
  generated via `npm run build:skills` — never hand-edited, per this
  repo's own `_shared`/generated-projection rule (AGENTS.md's Dispatch
  section names the precedent; confirm the exact build command's real
  name before running it, it may differ from what's assumed here).
- **R3**: Three request templates (`open.json`, `fix-N.json`, `close.json`
  shapes) with real field names confirmed against the CURRENT (post-Phase
  01/02) schema — do not copy the proposal doc's own sketch verbatim
  without re-verifying every field against the real, merged
  `schema.mjs`. Templates must demonstrate per-actor
  `executor`/`tier`/`persona` diversity as a first-class, always-shown
  property, not a buried option.
- **R4**: `master-coordinator.md`'s own "Retirement" section gains ONE
  pointer line naming `fgos-plan-loop` as the intended native path for
  Work-independent tracks (do not remove or restructure anything else in
  that file).
- **R5 — the live proof, on `/home/vantt/projects/fgos-test-drive` (a
  real, existing, separate host project confirmed present with its own
  git history and its own `.fgos/state.json` — named explicitly here so
  no Lead session has to guess or default to `forgentX`; if this path no
  longer exists at execution time, stop and ask, do not silently
  substitute `forgentX`)**:
  - Before starting: `cd /home/vantt/projects/fgos-test-drive && git
    rev-parse --show-toplevel` and paste the real output in this cell's
    own report — it must equal `/home/vantt/projects/fgos-test-drive`,
    never a path under `/home/vantt/projects/forgentX`. Every subsequent
    command in this requirement runs with that as its cwd/repo-root.
  - **Pin the binary before anything else.** A fresh Lead session
    invoking a bare `fgos` on the command line may resolve to a stale
    global install (a known, previously-documented hazard on this
    machine, unrelated to this plan). This proof MUST invoke this
    plan's own track branch explicitly: either `node
    /home/vantt/projects/forgentX/bin/fgos.mjs <args>` directly, or
    confirm a fresh `npm link`/local install from the
    `group-thinking-plan-loop` branch specifically. Record `which fgos`
    AND the real resolved script path actually used for every command in
    this proof's own evidence — a proof that silently ran against a
    stale global binary proves nothing about this plan's own changes.
  - Confirm `fgos-test-drive` has real, distinct executors configured
    (equivalents of `codex-cli`/`agy-cli`) before starting — read its own
    `.fgos/config.json`. If it lacks them, either add them first (a
    small, disclosed setup step recorded in the report) or the
    cross-provider claim in this proof cannot be considered met; do not
    silently narrow to single-provider and still claim R5 done.
  - Submit a small, real 2-cell plan on that project.
  - Cell 1: Doer on one real executor (e.g. `codex-cli`), Reviewer on
    another (e.g. `claude`), Red-Team on a third (e.g. `agy-cli`) — three
    distinct real providers dispatching within one session. Seed ONE
    deliberate, real requirement gap so Reviewer or Red-Team finds a
    genuine, non-trivial issue, forcing a real authorize+revise+recheck
    round (not a rubber-stamp pass). Lead applies the Doer/Fixer's real
    worktree diff (or, per the commit-policy decision above, the
    Doer/Fixer may have already committed it on the cell branch — either
    way the Lead performs the actual merge), runs the project's own real
    test command, merges, dispositions `cell-closed`, records the commit
    hash.
  - Cell 2: chained by id (`<track>--cell2`). The Lead for this whole
    proof MUST be a separate, real OS process (a `claude` CLI session the
    proof's own Doer launches and records the PID of — not the same
    process authoring this cell's own report). Mid-way through Cell 1's
    own first-pass dispatch or immediately after, terminate that process
    for real (`kill <recorded PID>`, cited in the report — never a
    scripted "pretend restart" or a same-process context-clear). Start a
    genuinely FRESH agent session (a new process) with zero prior
    context, give it only `fgos coordination chain <track>` to resume
    from, and confirm it can correctly identify what's done and finish
    Cell 2 without any hand-fed chat history.
  - Negative checks, same live run: a `mutating` step dispatched from the
    main checkout of `fgos-test-drive` (not a worktree) is refused
    (Phase 01's own R3, re-proven on a different project than where it
    was unit-tested); a reviewer/red-team role that (deliberately, for
    this one negative probe) edits a file fails and rolls back, unchanged
    from today.
  - Confirm throughout: `git log`/`git status` on `fgos-test-drive`'s own
    Work state (`.fgos/state.json`, Work event log) is byte-identical
    before and after the whole proof — zero Work engine involvement,
    measured, not merely asserted (mirrors this exact repo's own
    P04.1 "R6" measurement technique from the MVP3-5 track).
- **R6**: Record every real failure the proof surfaces as a named Gap in
  this cell's own report — do not silently patch around a surprise by
  narrowing the proof's own scope. If the proof reveals Phase 01 or
  Phase 02 need a fix round of their own, route that back to those
  cells' own reports (do not fold kernel fixes into this cell's diff
  without the same independent-review bar Phase 01 required).
- **R7**: Update `docs/specs/runner.md`'s Work-boundary stop-gate
  paragraph (the one Phase 01 was explicitly told NOT to edit) to record
  that the live proof this stop gate asked for has now run, with a
  citation to this cell's own report — this is the one doc edit that
  honestly belongs only here, after real evidence exists.

## Files

May touch:
- `.agents/skills/fgos-plan-loop/SKILL.md` (new) + its request templates
  (R1, R3).
- `plugins/fgOS/skills/fgos-plan-loop/**` (generated mirror, R2 — via the
  build command, never hand-edited).
- `docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md`
  — Retirement section only, one line (R4).
- `docs/specs/runner.md` — the specific stop-gate paragraph named in R7,
  nothing else in that file.
- The SEPARATE host/dogfood project's own files, for the live proof
  itself (R5) — out of `forgentX`'s own git history entirely; evidence
  goes under that project's own `docs/history/` or equivalent, per that
  project's own conventions, plus a summary + pointer committed into
  THIS cell's own report in `forgentX`.
- This cell's own report file under
  `docs/architect/agent-coordination/verification/group-thinking-plan-loop/`.

Do NOT touch:
- Any file under `src/runner/coordination/**`, `src/runner/dispatch/**`,
  or `src/verbs/coordination/**` in `forgentX` itself — if the live proof
  finds a real bug requiring a kernel/verbs fix, name it as a Gap/finding
  routed to a NEW cell (or back to Phase 01/02 for a fix round), never
  fixed inline inside this cell's own diff.
- `forgentX`'s own `main`/any track branch for MUTATION purposes — this
  cell's own `forgentX`-side changes are docs/skill-authoring only; all
  real mutation happens on the separate host project.
- `core/coordination-protocols/standalone-master-coordination-loop.yaml`
  — no fixture changes; if the live proof shows a real need for one
  (e.g. `maxInvocations` on revise/recheck), name it as a Gap for a
  future cell, do not add it speculatively here.

## Tests First

This cell is proof-driven, not unit-test-driven in the usual sense — its
"tests" are the live proof's own pass/fail criteria (R5), each of which
must produce real, citable evidence (command output, commit hashes,
`fgos coordination chain`/`show` output), not narration:

1. `fgos-plan-loop/SKILL.md` exists, is internally consistent with the
   REAL (post-Phase-01/02) CLI/schema shapes (re-verify every field name
   against real code, cite file:line for each), and the generated mirror
   under `plugins/fgOS/skills/` matches byte-for-byte.
2. Cell 1 of the live proof: three distinct real executors dispatch
   (cite each RunResult's own recorded executor); a genuine fix round
   happens (cite the accepted finding and the revise/recheck evidence);
   the cell closes `cell-closed` with a real commit hash on the host
   project.
3. Cell 2: the kill-and-resume test succeeds — cite the killed process's
   own recorded PID and the real `kill` command run against it, and the
   fresh (separate-process) session's own first tool call (`fgos
   coordination chain`) and its own correct next-action decision, made
   with zero hand-fed context.
4. Both negative checks (R5) reproduce the expected refusal/rollback,
   cited with real command output.
5. The Work-state-untouched measurement (R5's last bullet) shows
   byte-identical `before`/`after` state on the host project.
6. `which fgos` and the real resolved script path are recorded for every
   command in the proof, confirming this plan's own track-branch code
   was actually exercised, not a stale global install.

## Risks / Rollback

- **Risk**: `fgos-test-drive` may not have real, distinct executors
  configured — R5's own pre-flight check covers this; do not restate it
  here, just enforce it.
- **Risk**: a fresh Lead session runs against a stale global `fgos`
  binary instead of this plan's own track branch, silently invalidating
  every result. R5's own binary-pinning step is non-negotiable for this
  exact reason.
- **Risk**: the proof surfaces MORE bugs than Phase 01/02 anticipated
  (a real, expected possibility per the design proposal's own risk list).
  This is a SUCCESS of the proof, not a failure of this cell — record
  every one honestly, route fixes to the right owning cell, and do not
  let schedule pressure turn into silently working around a real finding.
- **Rollback**: this cell's `forgentX`-side changes are additive
  docs/skill files — clean `git revert`. The host project's own changes
  are that project's own concern, isolated from `forgentX` entirely by
  design.

## Acceptance

- Every Tests First item has real, cited evidence — command output,
  commit hashes, RunResult executor fields — not summarized claims.
- The Work-state-untouched measurement passes.
- No file under `src/runner/coordination/**`/`src/runner/dispatch/**`/
  `src/verbs/coordination/**` in `forgentX` appears in this cell's own
  diff.
- Independent Reviewer + Red-Team both return APPROVE against the real
  evidence (they must independently re-check at least the host project's
  own git log / `fgos coordination chain` output, not merely read this
  cell's own narration of it).
- `docs/specs/runner.md`'s stop-gate paragraph is updated (R7) — this is
  the plan's own closing acceptance criterion: the stop gate that started
  this whole design investigation is honestly resolved by real evidence,
  not by declaration.
