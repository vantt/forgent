# Terminal mode P08: doctor, specs, io-contract, boundary, CHANGELOG, carry-overs

Status: DONE. Branch `terminal-mode/p08-docs`, merged (no-ff) into `terminal-mode/integration`.

## Doctor
- `herdr` capability: already probed through the terminal-control `capabilities` route (`terminal-control-checks.mjs`); Windows says "Windows has no herdr build ... direct mode unaffected". No change needed.
- `runtime-socket-dir`: now also reports attempt sockets (`<16 hex>.sock`, a socket of this user) that no process has bound, read from `/proc/net/unix` (Linux; elsewhere the check says it does not judge them, nothing is removed). Connecting to probe was rejected: a live supervisor takes the first connection for its gate. Fix removes only those socket files, re-judged just before each unlink.
- `run-attempts-stuck`: mode-agnostic (any open v3 envelope); a test with a `terminal` envelope pins that.
- Reaper in doctor: `registrations.mjs` has no reaper call left after P07 (`sweepAttempts` only; the confinement check keeps loose-root tightening and empty-dir removal).
- Tests: the plan names `checks.test.mjs`, but the supervisor checks live in `test/setup/run-supervisor-checks.test.mjs`; added there (real killed listener, live listener, plain file with a socket name, no socket table, terminal attempt).

## Docs
run-supervisor spec (new §5.3 terminal mode, receipt/steps/doctor rows, history), agent-protocol spec (§3 AgentIo, §4, §5 table, new §5.1), terminal-control §12 (key = attempt id, no reaper), session-identity (gate scrub, lineage, codex daemon limit), `docs/io-contract.md` (writer id per attempt, `FGOS_PARENT_WRITER_ID`), component-boundary rows, `docs/specs/runner.md` (herdr bullet rewritten, new decision entry D-ADR0057), reading-map, CHANGELOG (Added, Changed, Removed). One H1 per file, no new broken links (pre-existing ones in io-contract/runner untouched).

## Carry-overs
1. **Governance tests (2 red on integration).** They tested the removed controller polling loop. Mapping:
   - "skips pane process-info while the agent reports working" -> the supervisor watch never reads the pane's processes (carrier check asks `foreground: false`); the working verdict keeps idle from firing through the adapter's `inspect`. Test: `an_agent_reported_working_is_alive_without_asking_the_pane_for_its_processes` (Rust, fake herdr, real gate).
   - "failed status read is blind time, not idle" -> **real regression found**: in `terminal` mode an unreadable screen was charged as idle. Fixed in `supervise/terminal.rs` (an unreadable sample moves the idle clock forward by the blind interval; only soft deadline and hard ceiling apply). Test: `a_pane_that_cannot_be_read_is_blind_time_that_runs_to_the_deadline_never_idle`, red before the fix (stop cause `idle`), green after (`soft-deadline`).
   - Old tests removed with their mock herdr; `dispatch-governance-operability.test.mjs`: 6 pass, 0 fail.
2. **Provider-limit fallback** (`test/run-supervisor/terminal-fallback.test.mjs`, real host, real `fgos run`, fake herdr scripted per started command via new `explain.run<N>.json`/`screen.run<N>.txt`): limit -> next candidate in a new pane, stopped pane kept open, one close; chain of three; no candidate left stays `provider-limit` with one pane; a writing unit falls back and is committed through the mutating gate. Old "confined pane on a limit screen" case is covered by the existing `terminal-cutover` limit test. Obsolete and not ported: assertions on `mock-pane-N` ids and `--label` equality of two tabs (the fake keeps one pane; labels are terminal-control's rule, tested in `terminal-groups`).

## Evidence
- `cargo test -p fgos-run-supervisor` (private `CARGO_TARGET_DIR`, examples rebuilt first): all 20 binaries ok; `supervise_terminal_fake_herdr` 7/7.
- `env -u CLAUDE_CODE_SESSION_ID`, `FGOS_HOST_BIN` = host built from this branch: on the phase branch `test/docs/*`, `architecture`, `setup/checks`, `setup/run-supervisor-checks`, `setup/terminal-control-checks`, `convention/*`, `runner/dispatch-governance-operability`, `run-supervisor/*`: 309 pass, 0 fail. Re-run on integration after the merge (docs, architecture, checks, run-supervisor-checks, governance, run-supervisor/*): 282 pass, 0 fail. Full `npm test` not run (P09a).
- GitNexus index stale; callers of the edited `tick` sampling grepped: only `drive`/`pause` in `terminal.rs`. Risk LOW.

## Decisions
- Blind time rule above (keeps the old controller behavior, not new policy).
- D-ADR0057 chosen as the id (unused on any local branch); the decision-index row (`fgos decision`) writes `.fgos` state and is left for the landing step on main.
- Orphan-socket judgement is Linux-only by design.

## Unresolved questions
- Record D-ADR0057 in state and regenerate `docs/decisions/index.md` at landing? (needs main).
- Windows/macOS CI: only unix-only Rust (`supervise/terminal.rs`) and Node test changed; no push requested.
