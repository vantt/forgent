# Phase 4: Integration, gates and live check

Capability: `code:test`. Acceptance criteria served: 4, 5 (the gate part), and the combined tree for 1, 2, 3 and 6.

## Inputs

- The landed or ready branches of phases 1, 2 and 3.
- `plan.md` of this plan: Acceptance criteria, and the Unattended run host steps for phase 4.
- `reports/phase-01-capture.md`: which machine's CLI versions the pins follow. The live check runs on that machine.

## Footprint

`plans/261128-0942-session-type-submits-enter/reports/integration.md`, `live-check.md` and `closing.md`.

## Steps

1. Merge the three phase branches into one integration worktree. A branch that passes alone does not prove the merge.
2. Lead host step: `fgos release check --worktree <integration-worktree>`. This is the full gate (`npm test` and
   `cargo test --workspace`). Record the result in `reports/integration.md`. Land through the land door.
3. Supervisor host steps, on the machine named in `reports/phase-01-capture.md`, after land: `fgos release run` to
   activate the landed release. Then pick an idle Claude Code head whose composer is empty (the throwaway head from
   phase 1 is gone, so use a live idle head or start one), and raise the coordination-help event naming it. Run
   `session read` (before), `session type` with the check line, and `session read` (after).
4. Pass: the `session type` answer is `submitted: true`, and the after-screen shows the head started a turn (or
   replied `ok`), with no second `\r` sent by anyone. Quote both screens and the answer JSON in
   `reports/live-check.md`.
5. O1: from the half-typed frame of phase 1 (made with the type-only release at `base`, see
   `reports/phase-01-capture.md`), record whether herdr `pane send-text` replaces or appends to existing composer
   text. If the frames do not show it, say so. D4 holds either way.
6. Close the coordination event with `fgos supervisor handled`. Then the lead writes its closing report (`reports/closing.md`) in the plan
   directory and sets the plan `done`.

## Verify

`reports/live-check.md` holds the before screen, the answer and the after screen. `reports/integration.md` holds a
green `release check`. Pass: criterion 4 is met as written, and criterion 5's gate part is green.

## Rollback

Revert the plan's merge commit on main and activate the previous release with `fgos release run`. Nothing else
outside the repository changed.
