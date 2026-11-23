# Supervisor wake, 2026-11-24 00:28

## Events
- `079ede550a193f42` session-no-result on `run_unit-run-1795454659933-7ac6e3f5/producer/1_01`: the unit settled `pass` (sonnet, 20 s); only its usage transcript is missing. Its fix (component-authority spec paragraph without a discussion-local id) is on main as `136b79ee9`, and phase 10 landed as `3aa23ccc5`. Handled; nothing to redo.
- `f1f300d76c94f7bf` lane-freed on fg-server2: 3 of 3 leads are live and no plan is admissible. Handled.

## Running plans
- `261121-2110-component-authority-doors`: lead busy; it is moving phase 11 (sweep and integration) into a worktree. Phases 9, 10b and 12 are still draft, 2f, 2g, 3a2, 3b, 3c, 3d and 3e are draft. Left alone.
- `261122-0118-heads-stable-and-able`: lead idle, waiting on owner work: phase 11 needs a green `npm test` and `cargo test --workspace` on main (open owner question `q-5v6jpbmbcy`), Miu's grant probe JSON, and the CHANGELOG lines. The owner chose A on `q-2vehh564d2` in the lead's chat, but the question store still shows it unanswered, so the owner must run `fgos questions answer q-2vehh564d2 ...` and land the six lines. This is a real wait recorded in phase 11; no typing.
- `261123-0828-head-stop-rotation-bad-measure`: lead idle, parked on a green main. It reported 18 red tests on `5a5dde6e0` in `reports/lead-261123-2333-head-stop-rotation-bad-measure-verify.md`. Its coordination event `ef2e452984bcec99` was handled at an earlier wake. This is the same wait as `q-5v6jpbmbcy`.

## Owner questions still open
`q-lnjt5zzbfq` (phase 6 checkout entries), `q-aanvfxaopa` (phase 8 named debt), `q-5v6jpbmbcy` (who runs the full suites on main), `q-t5anmlcb7q` (remove the -p5c and -p8 worktrees).
The component-authority plan's phase 6 row is `done`, and phase 12 cites "owner answer B to q-aanvfxaopa", yet both questions are still open in the store. The asker or the owner should ack or answer them so they stop counting as open.
