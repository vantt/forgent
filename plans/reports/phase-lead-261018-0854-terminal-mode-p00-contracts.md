# Phase lead report: terminal mode P00 contracts

Status: DONE. Phase branch `terminal-mode/p00-contracts` merged into `terminal-mode/integration` (no-ff).

## Changed
- `envelope.v3.json`: `slot{key,groupKey}`, `terminal{socketPath,exitCommand,orphanSettleMs}`, `identity{writerId,parentWriterId}`; `release-slot` is a builtin step item (`disposition onSuccess close / onFailure retain`); mode rules as invariants (terminal needs slot+terminal+release-slot, direct forbids them; writerId = mint(attemptId) both modes). Existing fields untouched.
- `gate-go.v1.json`: `terminal` section: unix socket, uid peer check (no pid compare), GO + SCM_RIGHTS (`fd0` attempt, `fd1` cwd only when mutating), `BRIEF_DELIVERED` send rule, orphan reasons `abandoned-before-brief` / `orphan-result`.
- `receipt.v1.json`: `abandoned-before-brief` outcome (`carrier-lost` already existed, rule sharpened); `reason` may carry `terminal:<outcome>`.
- `internal-route...v1.json`: `--go-socket` also names the unix socket path in terminal mode.
- New: `attempt-writer-id.v1.json` + vector, `terminal-outcomes.v1.json`.
- Vector `envelope-digest.v1.json`: direct case gained `identity` and the two env vars (digest regenerated); new case `envelope-terminal-read-only`.
- Tests: `test/run-supervisor/contracts-terminal.test.mjs` (new), `contracts.test.mjs` adjusted for the builtin step and new outcome, Rust `packages/session-identity/rust/tests/attempt_writer_id_vector.rs` (new).

## Decisions (left open by the plan)
1. Mint rule: `att-` + attemptId, attemptId must match `^[A-Za-z0-9._-]+$`, length 1..196 so the id fits the resolve rule's 200; invalid input is an error (`invalid-attempt-id`), never trimmed or sanitized.
2. `ORPHAN{reason}` is not a wire frame (the receiver is the party that is gone); it is the `gate-exit.json` record `stoppedBy orphan`, `cause = reason`.
3. `abandoned-before-brief` is a receipt outcome of its own (nothing ran after GO); `orphan-result` keeps the old mapping (exited with outbox, else gate-lost).
4. `stop-requested` cause list stays closed. Early terminal ends (`blocked`, `needs-human`, `delivery-unknown`) stop via cause `cancel`; the outcome name goes in receipt `reason` (`terminal:...`), pane released with retain.
5. `usage-limit` is a direct-only blocked reason; terminal adapters report it as `needs-human`.
6. `identity` is required in both modes (D4/D5 apply to both); `parentWriterId` may be null.

## Tests (env -u CLAUDE_CODE_SESSION_ID, private CARGO_TARGET_DIR)
- `node --test test/run-supervisor/contracts-terminal.test.mjs test/run-supervisor/contracts.test.mjs`: 14 pass, 0 fail (run on phase worktree and on integration after merge).
- `cargo test -p fgos-session-identity --test attempt_writer_id_vector`: 2 pass. `cargo test -p fgos-run-supervisor --test envelope_digest_vectors`: 2 pass (also on integration).
- Not run: full `npm test` and the full crate suites (JSON contracts and two new test files only; no `src/**/*.mjs` added or moved, so the architecture guard does not apply).

## Impact
No existing symbol edited, so no GitNexus `impact` needed; `detect_changes` not applicable (data files and tests). Index is stale anyway.

## Notes for later phases
- P05 owns the Rust/Node `mint_attempt_writer_id`; the new Rust test holds a reference copy and must be pointed at the real function when it lands.
- `src/run-supervisor/steps/settle-attempt.mjs` only special-cases `abandoned-not-started`; P03/P06 decide how settle treats `abandoned-before-brief`.
- Rust step runner (`steps.rs`) must accept builtin items without `hostBin` (P03).
- Windows/macOS CI push not requested: contracts only, nothing platform-specific.

Unresolved: none.
