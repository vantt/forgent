# Phase 3: Live check and integration

Proves on a real head that `session type` submits, answers open point O1, and runs the full gate on the combined
tree. Capability: `code:test`.

## Inputs

- `plan.md` acceptance criteria 4 and 5.
- `plans/discussions/ds-itzp2debmh-session-type-submits-enter/DISCUSSION.md` §3 row 5 (O1).
- The landed phases 1 and 2 on `main`.

## Footprint

`plans/261126-0853-session-type-submits-enter/reports/live-check.md`.

## Steps

1. Build and activate the tree so plain `fgos` runs the new verb, or use `npm run fgos:dev -- session type ...`.
2. Pick an idle Claude Code head an open supervision event names (raise one with `fgos supervisor raise` if
   needed). Quote its screen with `fgos session read <head>`.
3. Run `fgos session type <head> --text "<check line>" --json`. Expect `submitted: true`. Quote the screen after:
   the head started a turn, and no second `\r` was sent.
4. O1: on a test head with a half-typed draft, run `fgos session type`; expect `composer-not-empty` with the draft
   quoted and the draft unchanged on screen. Then run `--no-enter` on an empty composer and a draft to see
   whether `pane send-text` replaces or appends. Record which.
5. Run `npm test` and `cargo test --workspace` on the combined tree.
6. Write `reports/live-check.md`: the answers, the quoted screens, O1's result, and the two suite results.

## Verify

`reports/live-check.md` exists with the quoted before and after screens and `submitted: true`; `npm test` and
`cargo test --workspace` exit 0.

## Rollback

Nothing to undo but the report. A failing live check reopens phase 1 or 2 with the quoted screen as evidence.
