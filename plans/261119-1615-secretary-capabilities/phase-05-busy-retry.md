# Phase 5: Session write waits on a live writer

## Context
p-k6apgwaddh: catch-up refused `resource-recovery-required` while a live `fgos watcher tick` fetch was pending (~10 s).
lead:OPC owns the Git side (a distinct retryable busy code when the pending writer is live). This phase is the
session-write side only. Gate: lead:OPC's Git change returning `resource-busy` (Busy class, retryable; detail names the
pending operation id and kind) has landed on main. `resource-recovery-required` stays for a chain whose process is gone.

## Requirements
1. `catch_up_main` (`apps/fgos/src/wiring/session_write_publish.rs`) retries on `resource-busy` with bounded backoff
   (total under the head request timeout); when it gives up, the route answers `write-busy` (retryable), never
   `write-catch-up-refused`.
2. Test with a live pending writer: the write lands after it settles; with a writer that never settles: `write-busy`.
3. Secretary skill: on `write-busy`, retry later.
