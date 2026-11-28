# Phase 1: Re-prove the terminal profiles on the installed CLIs

Capability: `code:implement`. Acceptance criterion served: 6 (and through it 1 and 4).

## Inputs

- `plan.md` of this plan, section "Acceptance criteria" (criterion 6 and its paragraph).
- `packages/agent-protocol/rust/src/terminal/{mod,claude,codex,agy,pi,omp}.rs`: `Profile`, `pinned_version`,
  `version_marker`, `composer_state`.
- `packages/agent-protocol/contracts/fixtures/terminal/<cli>/` and `packages/agent-protocol/rust/tests/terminal_vectors.rs`:
  the existing vectors, and how a version mismatch is reported (`terminal_vectors.rs:289`).
- Prior art: commit `ff70302d34` (composer predicate and vectors for claude, codex and agy), and
  `plans/261125-2313-head-communication-agent-to-agent/phase-03-composer-state.md` (how the frames were captured).
- `packages/mailbox/contracts/adapters.v1.json` `typedNudges`, and `packages/mailbox/rust/store/tests/nudge_typed.rs`.

## Footprint

`packages/agent-protocol/rust/src/terminal/claude.rs`, `codex.rs`, `agy.rs`, `pi.rs`, `omp.rs`,
`packages/agent-protocol/rust/tests/terminal_vectors.rs`, `packages/agent-protocol/contracts/fixtures/terminal/**`,
`packages/mailbox/contracts/adapters.v1.json`, `packages/mailbox/rust/store/tests/nudge_typed.rs`, and this plan's
`reports/` for `reports/phase-01-capture.md`.

## Steps

1. Record the installed version of each CLI on the machine that will run phase 4's live check (`<cli> --version`,
   or the version the head's banner shows). Write the list in `reports/phase-01-capture.md`, and note the other
   machine's versions if they are known.
2. For each CLI whose installed version differs from its `pinned_version`, and for pi and omp in any case, get the
   frames through the supervisor's host steps in `plan.md`: idle with an empty composer, working, and idle with a
   half-typed line. The half-typed line goes only into the throwaway capture head, never into a live head. Keep
   each frame with its CLI version and the inspection detail it was captured with. Where a field of an existing
   `.insp.json` cannot be captured, do not invent it: record the gap in the report and leave that vector out.
3. Add the frames as vectors in `fixtures/terminal/<cli>/vectors.json` (same shape as the existing ones), and
   move `pinned_version` in that CLI's profile to the recorded version.
4. pi and omp: replace the always-`Unknown` `composer_state` with a predicate that reads the composer the way the
   claude, codex and agy predicates do (shared prompt reading, `draft_still_in_composer`; no second prompt
   parser). Anything it cannot read with confidence stays `Unknown`.
5. In `packages/mailbox/contracts/adapters.v1.json` `typedNudges`, move the version of each CLI already listed
   (claude, codex, agy) to its new pin. Add no CLI. Update the version literals in `nudge_typed.rs` to match.
6. Run the verify commands.

## Verify

`cargo test -p fgos-agent-protocol --test terminal_vectors && cargo test -p fgos-mailbox --test nudge_typed`
(use the crate names in the package `Cargo.toml` if they differ). Pass: every vector gives its expected composer
state for all five CLIs, pi and omp have at least one `Empty` and one `NotEmpty` vector, and each profile's pin
equals the version recorded in step 1.

## Rollback

Revert the phase commit. The pins and vectors go back to `base`. Nothing else reads them except the gate in phase 2.
