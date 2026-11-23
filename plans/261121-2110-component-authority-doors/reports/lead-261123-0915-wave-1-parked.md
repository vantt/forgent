# Wave 1 parked: three owner questions and a worker that cannot build

Lead: head:lead-forgent-261121-2110-compon-e8af7, 2026-11-23 09:15 +07. Every unit ran with `--provider claude`, on the
owner's 09:01 order relayed by lead:SUPERVISOR.

## Phase 1: crate and `fgos authority locate`, parked

Branch `component-authority-doors/p01`, worktree `/home/vantt/projects/forgent-worktrees/261121-2110-component-authority-doors-p01`.

- Committed: 799f40349 (crate and wiring), cb0cc3eff (fix for E0515 in `apps/fgos/src/wiring/authority.rs`), and
  d10cea585 (the verb test now runs in a temporary project, because a fresh checkout or CI has no `.fgos`).
- Uncommitted in the worktree: an `authority` entry in `src/cli/command-registry.mjs`, plus the unit report's fix
  rounds 3 and 4. A reviewed run with the generator as `--verify` ended `execution-failure` / `verdict-inconclusive`
  (unit-run-1795400028854-c4288677), and the verify never ran.
- What the lead ran itself (cargo target in the scratchpad, because the head is read-only outside its plan directory):
  - `cargo test -p fgos-component-authority --locked`: 7/7 pass.
  - `cargo test -p fgos --locked --test authority` fails with "operation 'authority.locate' not found in catalog".
    The cause is that `apps/fgos/src/main.rs` does not register the provider.
  - `node --test test/rust-host/command-routes.test.mjs` fails 7 of 19, because the host contracts were hand-written
    instead of generated from the registry.
- The independent review (code-reviewer subagent) found one blocking issue: the generated contracts. Fixing it is in
  progress, as above. Non-blocking points:
  - `tierExceptions`, `facts` and `guards` are loaded untyped, so an unknown field inside them is accepted.
  - A one-word canonical name outranks a multi-word alias. For example, "atomic file write for the process" ranks
    `process` first.
  - The model is read from the project root, so the verb fails in every other project. This is question
    q-3iylevstr2.
- Waits on:
  - **q-sieckdvccb**: add `apps/fgos/src/main.rs` and `test/cli/subcommand-flag-drift.test.mjs` to the footprint.
    It supersedes q-6rdolvgvz2.
  - The worker problem below.

## Phases 2 and 3: retire the twins, parked

No change was made. Five of the seven phase-2 rows, and most of the phase-3 rows, have callers outside the
footprint. The lead spot-checked this with `rg` at 94db955. Evidence: `unit-261123-0819-p02-result.md` and
`unit-261123-0819-p03-result.md`. This waits on **q-swxkda2x5r**, which recommends that the planner re-cut those
phases per door row.

## Phase 5: question raised early

**q-3iylevstr2**: should `locate` be a gated capability in projects that have no model, the way impact analysis is?
The answer shapes phase 5's skill wiring.

## Blocker for every phase: the claude worker cannot run node or cargo

In all four phase-1 rounds, the claude worker (claude-cli-bwrap, model sonnet) was refused `cargo` and `node`
because they need approval. Its units therefore commit code they could not compile or test, and the lead has to run
the checks. A reviewed run's `--verify` did not run either. Each phase of this plan builds Rust and regenerates
contracts, so this needs a fix in the worker's permissions or invocation before the plan can move at a useful speed.
It was raised to the supervisor.

## Worktrees kept

`-p01` (branch at d10cea585, plus uncommitted work), and `-p02` and `-p03` (unchanged, kept for reuse).

## Addendum 10:50: after the claude pin was withdrawn

- Fix round 5 (default binding, deepseek/thehive, unit-run-1795405038571-29e4ef38) passed and committed 97e066738.
  That commit regenerates the host contracts and types `tierExceptions`. Its checks: route test 19/19, export
  `--check` clean, crate tests 8/8.
- The runner does not commit a file that was already dirty when the round started (evidence.json `dirtyBefore`). So
  the `authority` registry entry and the report's fix rounds 3-5 are still uncommitted in worktree `-p01`. The
  branch tip has generated contracts but not the registry entry they come from.
- To fix that, worktree `-p01b` (branch `component-authority-doors/p01b`, based on p01 at 97e066738) received a
  clean-state unit carrying both diffs (c-41164). The run was refused at the recheck with the binding mismatch
  (recomputed gemini/gemini, assignment deepseek/thehive). Following lead:SUPERVISOR's order, it is parked and not
  pinned. It waits on the recheck fix plan 261123-0821.
- q-sieckdvccb was decided as option A by lead:SUPERVISOR. The lead's land of the frontmatter footprint was refused
  with `footprint-change-refused`, so the supervisor must land the two footprint lines (event 11ea78162a7d58e7).
- Next unit, once both are cleared: in `-p01b`, re-apply the registry entry and report rounds, then register the
  provider in `apps/fgos/src/main.rs`, list `authority` in `test/cli/subcommand-flag-drift.test.mjs`, and run
  `cargo test -p fgos --test authority`. After that come review and land.
