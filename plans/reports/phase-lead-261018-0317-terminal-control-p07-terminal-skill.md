# Phase report: terminal-control P07 — `/fgOS:terminal` and `terminal-close` through the port

Status: DONE. Branch `terminal-control/p07-skill` merged `--no-ff` into `terminal-control/integration`.

## What changed
- `plugins/fgOS/skills/terminal/rename.sh`: same guard chain (capability gate, herdr env, ownership); `herdr pane rename` replaced by `fgos internal terminal-control attach` then `label`. Key = session writer id (`FGOS_SESSION_ID`, else project-resolved id, else `CLAUDE_CODE_SESSION_ID`, else `pane-<id>`). Missing `fgos` on PATH = silent no-op like the other guards.
- `plugins/fgOS/skills/terminal-close/close.sh`: `attach` (idempotent) then `release` `disposition: close` with `callerPane` = `HERDR_PANE_ID`, after the unchanged `fgos_pane_owned` check.
- New `terminal/terminal-port.sh`: shared client (JSON escape, key, call, attach) sourced by both scripts. `pane-owned.sh` unchanged.
- Core: `Core::release_as(key, disposition, until, caller_pane)`; `release` delegates with `None`. An attached slot closes only for `close` whose `callerPane` equals the slot's pane, with the same incarnation checks as an allocated pane. Route reads optional `callerPane`. Contract `terminal-control.port.v1.json` updated: `callerPane` field, the exception stated in `release` effects and invariants.
- SKILL.md of both skills updated.

## Decisions (lead)
- Exception expressed as an explicit request field `callerPane`, not env read inside the core: testable, no hidden input.
- `close.sh` re-attaches before release, so it works whether or not `rename.sh` ran in the session.
- `test/skills/terminal-pane-ownership.test.mjs` (old herdr-call assertions) now uses a fake `fgos` route stub and asserts the attach/label/release requests; real port behavior is in the new test.

## Evidence
- `cargo test -p fgos-terminal-control` (branch and integration): all result lines ok, 0 failed (new `a_caller_closes_its_own_attached_pane_and_no_other`).
- `test/plugins/terminal-skill-attach.test.mjs` 7/7 (real host route, fake herdr, own socket): attached record + `pane rename` with task id; no herdr → exit 0, nothing changed; foreign pane never renamed/closed; `close.sh` closes only its own pane, bystander stays; no `herdr pane (rename|close)` under `plugins/fgOS/skills`.
- On integration after merge, with `FGOS_HOST_BIN` from a private target: `test/plugins/terminal-skill-attach`, `test/skills/terminal-pane-ownership`, `test/terminal-control/*`, `test/rust-host/internal-routes` = 33 pass, 0 fail.
- Branch run of those plus `test/runner/herdr-agent`, dispatch call-site/graph/governance tests: 272 tests, only the two stale-assertion ownership tests failed before the fix; fixed, 4/4.
- `npm run build:skills` leaves `git status` clean (plugin skill sources not overwritten).
- Not run: full `npm test` (P09's job).

## Impact
GitNexus could not resolve the Rust `release` symbol (index stale, other repos listed). Grep cross-check: callers are `route.rs` and the crate's own tests only; signature of `release` unchanged. Risk: low.

## Unresolved
- The `--protocol` / state root of the real `fgos` on PATH must be the activated release with the P05 route; before activation the scripts no-op (route unavailable → silent).
