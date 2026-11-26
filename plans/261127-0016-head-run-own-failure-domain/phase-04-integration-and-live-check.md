# Phase 4 — Integration and live check

Capability: `code:test`. Depends on phases 1, 2 and 3.

## Inputs

- `plan.md` acceptance criteria 4 and 5
- the merged tree of phases 1-3 on `main`

## Files it may write

`plans/261127-0016-head-run-own-failure-domain/reports/**` only.

## Steps

1. On the combined tree run `npm test` and `cargo test --workspace`; record the result lines.
2. Build, stage and activate a release with the change (normal release door), so the watcher runs the new code.
3. On fg-server2, unconfined: let the watcher start two heads (or `fgos session start` two test heads). Check with
   `systemctl --user status` that each supervisor sits in its own `fgos-run-*.scope` and none in
   `fgos-watcher-<id>.service`; read each binding's `failureDomain`.
4. `kill -9` one supervisor; confirm the other head's request socket still answers (`fgos session list` / a head
   request). On the next tick confirm a `session-gone` event with state `supervisor-gone` for the killed one.
5. Separately `systemctl --user stop fgos-watcher-<id>.service`; confirm both heads' sockets still answer.
6. Write `reports/live-check.md` with the commands, outputs and pass/fail per step. Ending the killed head through
   `fgos session stop` is proven by the sibling plan; here, retire it by hand if needed and say so.

## Verify

`reports/live-check.md` exists and every step passes; both suites green.

## Rollback

Nothing to undo in code; stop the two test heads.
