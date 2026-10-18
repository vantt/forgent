# Terminal mode P04: agent-protocol terminal adapters

Status: DONE_WITH_CONCERNS. Branch `terminal-mode/p04-adapters`, merged into `terminal-mode/integration` (`0a35abb52`).

## What landed
- `packages/agent-protocol/rust/src/terminal/`: `mod.rs` (state machines), `common.rs` (hand-written ports of `PASTE_CHIP_RE`, `VISIBLE_WORKING_TAIL_RE`, `isDraftStillInComposer`, timings, `MAX_RESENDS`), one profile file per CLI (exit command, Enter gap, trust wording).
- `AgentIo` grew `screen`, `inspect` (`Inspection` = detector verdict), `now_ms`, `pause` (defaults: unsupported / real clock). No implementor existed yet; direct adapters untouched (three helpers became `pub(crate)`).
- `FsOutbox`: a result counts only when it parses as a JSON object and keeps its size over 20 ms; `*.tmp.*` ignored; 0-byte then filled tested (pi behaviour from P01).
- Contract `agent-protocol.v1.json` io section: `screen`, `inspect`, `clock`.
- Fixtures `contracts/fixtures/terminal/<cli>/`: real screens recorded 2026-10-18 from herdr panes (`*.txt`) plus `herdr agent explain` verdicts (`*.insp.json`), `vectors.json` per CLI (17-19 vectors each) replayed on a virtual clock.

## Decisions
- Readiness timeout maps to `delivery-unknown` (nothing typed). An unrecognised blocking dialog maps to `needs-human` (contract has only trust-dialog/login as blocked reasons).
- Brief typed as text, per-CLI gap (codex 600 ms, others 300 ms), then Enter as keys (P01: codex reads quick text+Enter as a paste).
- `delivered` = working, or composer empty AND brief echoed in the conversation (first/last 24 squashed chars), or a complete result exists. Screen-unchanged is not used (status-bar clocks change).
- Re-type only if the typing call failed AND, after one render interval, the pane equals its pre-send screen, is idle with no draft; max 2. A succeeded typing call is never repeated.
- Windows: no change (terminal mode unsupported there).
- Codex needs `-c shell_environment_policy.set={FGOS_SESSION_ID=...}`: launch argv, belongs to executor config / P05-P06, not the adapter.

## Node test -> vector map (wait logic)
| Node test | Vector |
|---|---|
| rule says idle -> ready | `ready-prompt-takes-the-brief` (claude, codex) |
| no rule: screen changes then holds still | `ready-after-the-screen-drew-and-held-still` (agy, pi, omp) |
| never draws -> bounded wait | `a-process-that-never-draws-is-typed-at-after-a-bounded-wait` |
| blocking dialog / missing detector / still working | `trust-dialog-blocks`, `detector-without-verdict-...`, `working-agent-never-gets-ready-...` |
| blocked pane, nothing typed | readiness vectors assert zero sends |
| isDraftStillInComposer (chips, omp chip, history above composer) | vector `paste-chip-left-in-composer-...` per CLI + `terminal_matchers` unit tests with the Node cases verbatim |
| working agent never gets a second copy | `agent-shows-working-after-submit-is-delivered` (sentTexts 1) |
| re-brief hard cap | `refused-typing-is-retyped-at-most-twice` |
| brief landed nowhere offered again | `refused-typing-on-an-untouched-pane-is-retyped-once` |
| agent leaves without result / provider limit | `outbox-*`, `usage-limit-on-an-idle-screen-is-needs-human` |
Node cases about launch, pane closing, deadlines, confinement are controller concerns removed in P06, not adapter logic.

## Evidence
- `cargo test -p fgos-agent-protocol terminal`: 6 tests pass (all 5 CLIs, ~90 vectors, FsOutbox, matchers). Full crate: 13 pass.
- `cargo test -p fgos-agent-protocol -p fgos-run-supervisor` on integration worktree: 115 passed, 0 failed. `cargo clippy --all-targets` and `cargo fmt` clean.
- `node --test test/run-supervisor/contracts.test.mjs`: 6/6. No `src/**/*.mjs` touched, so no architecture-manifest change.
- Review (Sonnet code-reviewer): no high findings; one medium (re-type judged "untouched" before the TUI redraws) fixed in `0485d78b0`.
- GitNexus impact: `AgentIo` has no implementor or caller outside the crate (grep cross-check, index stale); risk LOW.

## Concerns
- Real screens exist for ready/trust/draft/finished states; the *working* spinner screens (codex, agy, pi, omp) were not captured: turns ended in under 3 s. Working detection for them relies on the detector verdict vector plus the wording regex tests.
- Claude/codex trust vectors pair the real trust screen with a synthesized blocked verdict (detector verdict not recorded); agy's is fully real. Login wordings for claude/codex/agy/pi are standard wordings, not recorded; omp's is real.
- pi/omp have no composer rule: a short echoed brief in the bottom 6 lines of a finished turn reads as an unsent draft, so Enter is offered up to 6 times and the outcome stays `delivery-unknown` unless a result exists (fail-safe; vector `finished-turn-without-result-...`).
- `detect_completed` can return `completed` without a prior `delivered`; the supervisor must enforce the contract's order.
- `brief_echoed` is new logic: a CLI that does not echo user turns, or a pointer line scrolled off, gives a false `delivery-unknown`.
- Sandbox of this lead: first-hand drive of the five CLIs in a private herdr tab; the update prompts were never answered. Tab closed.
- Windows/macOS CI not needed for this phase (pure crate, no OS code).

## Unresolved questions
- Should the supervisor treat `needs-human` for an unrecognised dialog as stop cause `cancel` with the pane retained (as contract mapping says)? Assumed yes.
