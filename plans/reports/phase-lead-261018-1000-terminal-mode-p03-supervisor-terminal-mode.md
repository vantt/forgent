# Phase lead report: terminal mode P03, supervisor in `terminal` mode + `release-slot` step

Status: DONE_WITH_CONCERNS. Branch `terminal-mode/p03-supervisor` merged into `terminal-mode/integration` (no-ff).

## What landed
- `supervise/terminal.rs` (new, unix): socket (dir must be owner-only, 0600 file, path <=107 bytes, removed on exit) -> launcher script (`exec bwrap prefix -- host internal gate --go-socket`, or the gate directly without bwrap) -> `terminal-control.launch` in-process -> accept HELLO (uid check, attempt id) -> gate tuple (SO_PEERCRED pid inside pane-root subtree, else namespace-init child; fail closed behind a sandbox) -> `declare_domain` + binding -> GO with SCM_RIGHTS (attempt lock, cwd lease) -> AGENT -> adapter: ready -> brief -> `BRIEF_DELIVERED` (once, only on `delivered`, connection kept open to the end) -> completed -> exit command -> receipt/steps.
- Watch: soft deadline, cancel file, idle (screen change or `working`), heartbeat, carrier (`pane` Gone => `carrier-lost`, nothing closed, gate not asked to stop, domain swept after grace). Unknown is never read as lost.
- Early end (`blocked`, `needs-human`, `delivery-unknown`, completed-no-exit): stop cause `cancel` (closed list kept), receipt `reason` = `terminal:...`, slot retained.
- `terminal_slot.rs`: `Backend` (driver+core from `FGOS_HERDR_BIN`/`HERDR_SESSION`/`HERDR_SOCKET_PATH`, else `terminal-endpoint.json` recorded at supervise time so adopt works), `release`, `disposition_for`.
- `steps.rs`: builtin `release-slot` runs after the process steps; close only for clean `exited` + outbox + no reason + every earlier step done; else retain (24 h); `kept-unknown`/unknown => no receipt (Retry); unsupported => Failed. A step that asks for Retry leaves the slot undecided. Adopt reuses it unchanged.
- `supervise.rs`: `abandoned-before-brief` receipt mapping, `TerminalEnd` into the receipt, `bind_record` extracted, `finish` shared tail, mode `terminal` refused with `terminal-mode-unsupported` off unix.
- Tiny edits elsewhere: terminal-control `route.rs` default consts made `pub`; `Cargo.lock` (new dep edge); contract text for `launch.briefPath`; `contracts-terminal.test.mjs` expectation for the parent writer id (stale since the identity phase).

## Tests (private `CARGO_TARGET_DIR`, `env -u CLAUDE_CODE_SESSION_ID`)
- `cargo test -p fgos-run-supervisor`: all 20 binaries ok on the phase branch (incl. 16 lib, `supervise_terminal_fake_herdr` 5, `release_slot_step` 5, all direct/gate/adopt files unchanged and green). clippy: no warning in touched files (pre-existing ones elsewhere).
- Plan's five cases, real gate under a pty against `tests/fixtures/fake-herdr-pane.py` (real pane process, real terminal-control core/driver): full lifecycle (one `pane close`, no `tab close`); blocked -> retain; pane gone -> `carrier-lost`; launch proves nothing -> no GO, gate meets closed socket, no agent; supervisor SIGKILL after brief -> gate runs on (orphan-result), adopt runs `release-slot` (close).
- Integration after merge: `-p fgos-run-supervisor -p fgos-terminal-control -p fgos-agent-protocol` 68 pass, 2 fail in `gate_pid1` (sigterm..., no_process...) under that combined run; `--test gate_pid1` alone 9/9 pass (57 s). Looks like load flake, untouched code.
- `node --test test/run-supervisor/contracts*.test.mjs`: 14/14. No `src/**/*.mjs` touched, architecture guard not applicable. Full `npm test` not run.

## Review (Sonnet code-reviewer) and handling
Fixed: Retry then permanent retain; gate not found must fail closed; process-group domain never held the agent (agent now killed by identity); herdr endpoint lost under adopt; `briefPath` contract text; MSG_NOSIGNAL. Left as is: `disposition` field of the item is informational (rule hardcoded in `disposition_for`); final wait loop has no cap (domain Unknown + refused kill); `accept_gate` ignores cancel up to 15 s; incarnation-changed not distinguished from Unknown (core never reports it as gone).

## Decisions
1. Brief typed inline from `launch.briefPath` (required in terminal mode). 2. Launch `NotStarted`/`Unknown`/`Unsupported` and a silent gate => `abandoned-not-started` with `start-refused:<code>`, no binding, steps still run (retain). 3. Retain window 24 h (no config key exists). 4. completed-no-exit stops with cause `cancel` + reason `terminal:completed-no-exit` (cause list closed). 5. Carrier lost only on `Gone`. 6. Settle: `settle-attempt.mjs` default branch already gives a named execution error per outcome (`abandoned-before-brief`, `carrier-lost`); baseline exists before launch; no code change (P06 owns the file).

## Impact
GitNexus index stale; callers grepped: `run_steps` (supervise, adopt), `publish_receipt_as` (adopt), `outcome_for` (supervise), `bind` (supervise) — signatures kept. No HIGH/CRITICAL.

## For later phases
- Controller (P06) must start the supervisor with `FGOS_HERDR_BIN`/`HERDR_SESSION`/`HERDR_SOCKET_PATH` (or leave them to the recorded file), `terminal.socketPath` in an owner-only dir, `launch.briefPath` set, `containment.bwrapPrefix` carrying `--die-with-parent` and the socket-dir bind.
- Windows/macOS CI: terminal module is unix-only code, untested on macOS (peer uid via getpeereid, gate = pane root); ask `forgentx-95` to push `terminal-mode/p03-supervisor`.
- Tests need `cargo build -p fgos-run-supervisor --examples` before `--test X` (examples are not rebuilt by a single-test run).

## Unresolved
- Sandboxed gate with real bwrap in a real herdr pane (SO_PEERCRED pid across the namespace, `namespace_init_under`) is only exercised on P09.
