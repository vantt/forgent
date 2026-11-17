# Phase 1: Host-port contract, home and blast radius

Facts phase. Writes the contract and the evidence the build phases rely on; changes no code.

## Inputs (read first)
- `plan.md` sections "Design settled by this plan" (the contract draft, the home decision) and "Risks".
- `docs/discussions/secretary-miu/DISCUSSION.md` SM-D6, SM-D10, SM-D13 and section 6 (binding; do not reopen).
- `docs/platform/component-boundary.md` §4 (rows Run Supervisor, Terminal Control, Identity); `docs/platform/terminal-control/spec.md`
  (stands alone, usable without a run; Windows declares no pane capability); `docs/platform/run-supervisor/spec.md` §5.3, §16.
- Code: `src/run-supervisor/direct-launch.mjs:110-260`, `src/runner/dispatch/herdr-round.mjs:400-520`,
  `src/runner/dispatch/terminal-slot.mjs`, `src/run-supervisor/steps/settle-attempt.mjs:60-100`, `src/runner/dispatch/cli.mjs:240-265`,
  `packages/run-supervisor/rust/src/{supervise.rs,supervise/terminal.rs,terminal_slot.rs,gate.rs,adopt.rs}`,
  `packages/terminal-control/rust/src/{port.rs,core.rs,route.rs,driver/mod.rs}`.
- The impact-analysis gate in `AGENTS.md`: run `fgos dispatch decide --for impact-analysis --json` from the main checkout;
  on `unavailable` record "impact-analysis degraded (GitNexus missing), blast radius from rg".

## Files this phase may write
`docs/platform/session-host/spec.md` (new), `packages/session-host/contracts/host-port.v1.json` (new),
`docs/platform/component-boundary.md` (one new row), `docs/reading-map.md` (one line for the new spec),
`plans/261117-1856-secretary-session-spine/reports/facts-host-port.md`.

## Steps
1. Blast radius by `rg` (record every hit with file:line in the facts report): `writeAttemptIntent`, `buildEnvelope`,
   `terminalSocketPath`, `envelope\["mode"\]|"mode"`, `allocateAsync|releaseAsync|\.allocate\(|\.release\(` on a terminal
   client, `createRoundTerminalControl`, `terminal_slot`, `StartMode::`, readers of `intent.json`/`envelope.json` in
   `src/verbs/dispatch`, `src/runner/dispatch/recover*`, `adopt.rs`, Windows custody. Name each test file that drives them.
2. Fix the cut lines for phase 9 and 11: exactly which Rust functions move into `fgos-session-host` (terminal start =
   allocate + launch + ready-wait + typed opening text; retire = release; alive = inspect/carrier ping; direct start =
   start a prepared command without a screen) and which stay in the run supervisor (lock, containment, deadline, idle,
   settle). Containment never moves. If the facts show a cut that cannot hold, stop and report `NEEDS_CONTEXT`.
3. Write `docs/platform/session-host/spec.md` in the area-spec shape (purpose, owns / does not own, port contract with
   request and answer shapes and refusals, adapters, shared entities, layer, decision history with the home decision and
   its evidence). Paper-check the contract against (a) the pane host: Terminal Control + herdr, `front` via the focus
   operation phase 5 adds; (b) a screenless host (Claude Agent SDK or a cloud session): opening text by argument or
   file, liveness by its own handle, `front` = `unsupported`, `retire` by its own stop call. One table, both columns.
   Include the head-on-direct refusal and the opening-text rule: in a pane the text is typed visibly as full text
   (never a pointer), through the shared delivery step; a screenless host passes it by argument or file.
4. Write `host-port.v1.json` (JSON Schema for `start`/`alive`/`front`/`retire` requests and answers), mirroring
   `packages/terminal-control/contracts/` style.
5. Add the Session Host row to `component-boundary.md` §4 (layer between Terminal Control and Run Supervisor) and one
   reading-map line.

## Verify
- `node -e "JSON.parse(require('fs').readFileSync('packages/session-host/contracts/host-port.v1.json','utf8'))"` exits 0.
- The facts report names every hit of step 1 and the cut lines of step 2; the spec has the two-column paper check.
- `node --test test/docs/*.test.mjs` if any doc-link or reading-map test exists (`rg -l "reading-map" test`); passes.

## Rollback
`git revert` the phase commit (docs and contract only).
