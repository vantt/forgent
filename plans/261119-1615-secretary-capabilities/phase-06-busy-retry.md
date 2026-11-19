# Phase 6: Session write waits on a live writer

## Context
p-k6apgwaddh: catch-up refused `resource-recovery-required` while a live `fgos watcher tick` fetch was pending (~10 s).
Phase 5 is the Git side: `resource-busy` (Busy class, retryable; detail names the pending operation id and kind)
when the pending writer is live. `resource-recovery-required` stays for a chain whose process is gone.

## Note
A Busy refusal of the catch-up needs a `CatchUpRefusal::Busy` variant mapped to `write-busy` in
`packages/run-supervisor/rust/src/head_request.rs` (found by the first seat); that file is shared with phase 8, so this
phase runs after phase 8 lands.

## One door for Busy (supervisor decision after review, 2026-11-19)
Busy is Git's own class (`OperationError.retryable`, `ResultCode::Busy`), never a list of code strings: supervision's
`from_git` (`packages/supervision/rust/src/land.rs` ~122) carries it on `LandRefusal`; the wiring maps it to a real
`CatchUpRefusal::Busy`, which the route answers `write-busy`. Git catch-up's main-checkout take uses
`acquire_or_busy(.., "main-checkout-busy")` (`packages/git/rust/src/land.rs` ~1206; lead:OPC reviews). A wiring test drives
the real catch-up with a held `worktree-admin` (or a live pending op): the write lands after release, `write-busy` if it never is.

## Requirements
1. `catch_up_main` (`apps/fgos/src/wiring/session_write_publish.rs`) retries on `resource-busy` with bounded backoff
   (total under the head request timeout); when it gives up, the route answers `write-busy` (retryable), never
   `write-catch-up-refused`.
2. Test with a live pending writer: the write lands after it settles; with a writer that never settles: `write-busy`.
3. Secretary skill: on `write-busy`, retry later.
