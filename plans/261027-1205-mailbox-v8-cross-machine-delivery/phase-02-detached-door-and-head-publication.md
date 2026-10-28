# Phase 02: Rust detached door and head publication

- One Rust door starting one detached child, never waited on, bounded lock, exit 0; modes `seal+push` (sender) and `fetch+ingest` (receiver). Rules copied from the Node end trigger, placed where OPC decides in phase 00. The hook uses it only when the last fetch is older than the interval.
- Head publication: the child publishes a mailbox head's directory entry through the identity `directory` feature, from host wiring; the hook and `register_writer` never publish.
- Doctor facts for later: last publish, last fetch age.
- Files: host wiring under `apps/fgos/src/wiring/`, tests next to it; one-door census regenerated. Verification: tests for the never-wait rule and a killed child leaving no state; msvc and darwin checks (door unix-gated like the rest).

## OPC agreement (2026-10-28 14:25, lead:OPC, board and mail)

The door goes in `packages/process/rust`, policy in host wiring, built on `fgos_process::mapped::spawn_mapped` (not `spawn_with_fds` plus a second `pre_exec(setsid)`; phase 00 Q6 missed this door).

- Helper in `mapped.rs`, `#[cfg(unix)]`: `spawn_detached(argv, cwd, env, log: Option<&Path>) -> io::Result<u32>`. Opens the log append+create, 0o600, close-on-exec (no path: Null), calls `spawn_mapped` with `MappedLead::Session` and `stdio: [Null, File, File]`, returns the pid, drops the `MappedChild` without waiting. Doc contract: the child is never reaped, so the caller must be short-lived (hook and `mailbox send`; not the gateway or a supervisor). Host callers cfg-gate; non-unix is "no child, Unsupported".
- Environment passed through unchanged, including `FGOS_HOST_BIN`; host from `current_exe()`. A child started inside a contained operation inherits the containment marker and is ended by the marker sweep at the operation's end; do not strip it.
- Spawn only after the mailbox mutex is released (after `run()`, before `exit(0)`).
- The parent's due test on `sync.json` is read-only; the parent never writes an attempt record (one writer: the Event Store claim). A rare extra child finds the seal lock busy and exits.
- Run `--write-census` and send OPC the diff (expect none).
- Proof: one case added to `packages/process/rust/tests/spawn_mapped.rs` (own session sid == pid, no descriptor 3 or above beyond those passed, log file 0600, call returns before the child exits). No new test file.
- Send the `fgos-process` diff to OPC for review before landing. Gates: clippy `-D warnings`, msvc check, `aarch64-apple-darwin` check.
