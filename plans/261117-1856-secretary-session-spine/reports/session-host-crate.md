# Session Host crate: additions for the spec (fold in at phase 14)

Facts of the crate as built; the spec itself was not edited.

- **Direct liveness handle.** The direct adapter keeps its own handle file at `<state root>/session-host/direct/<key>.json`, body `{ "key", "process": <identity record> }`, mode 0600. Spec section 4 says the supervisor's handle; the crate does not read the supervisor's. Spec and crate disagree here: fold one way.
- **Missing handle.** A key with no handle file answers `gone` (also what a never-started key answers). An unreadable handle answers `unknown`, and a start on it is refused `key-in-use`.
- **Route envelope fields** (`fgos internal session-host <op> --protocol 1 --json`, stdin JSON): `v` (1), `driver` (`herdr`, default), `request`, `timeoutMs` (herdr budget, nine tenths used), `herdrBin`, `env`, `config` (terminal config, same keys and refusals as the terminal-control route; it is built by the same `CoreParts`), plus:
  - `cli`: string; agent CLI an opening is typed for; default is the command's file name.
  - `readyMs`: non-negative integer; how long an agent gets to put its prompt up; default 60000.
  - `graceMs`: non-negative integer; how long a screenless process gets after the ask before the kill; default 10000.
  - `timeoutMs`: integer >= 1.
- **Route exit codes.** 0 for every port answer (refusals included); 2 for a usage error (bad flag, op, JSON, envelope field); 3 for a protocol other than 1 (`host-version-mismatch`).
- **beside** needs `groupKey` (the groupKey of the placement it opens next to); without it the start is refused `placement-unknown`.
- **Opening delivery on the direct host.** `file`: written to `<state root>/session-host/direct/<key>.opening.txt`, mode 0600, its path appended to argv; it is written only after the key is judged not live, so a start on a live key never overwrites the live session's opening. `argument`: the text is appended to argv and is visible in the process list. `typed` is refused `opening-delivery-unsupported`.
- **Terminal host start failures.** When the opening is typed but not confirmed, the pane the call opened is closed (as for not-ready), so a retry starts clean.
- **Direct stop.** Retire signals the whole process group (the process is started with `process_group(0)`), asks (SIGTERM), waits `graceMs`, then kills; where the ask is unsupported (Windows) it kills at once. The program is resolved with `fgos_process::spawn::resolve_program`.
- **Shared terminate primitive.** `fgos_process::control::terminate_with_grace` (with `signal_record_group` for group leaders) is the one ask, wait, kill loop; `fgos-holder-lock`'s fence and the Session Host direct adapter both use it. Another copy of this shape that was not folded: `packages/process/src/lib.rs` around line 195 (`signal_settled` after a kill of a gate), and the terminal-control driver's own kill paths were not inspected beyond grep.
