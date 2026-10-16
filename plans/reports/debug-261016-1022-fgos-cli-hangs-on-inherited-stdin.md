# fgos CLI hangs on inherited, unclosed stdin

## Repro (deterministic)

The Rust host (not the shell function, not Node) blocks. With the unfixed host, a stdin pipe whose writer stays open:

```
sleep 30 | fgos convention path --kind report --type x --slug y --json   # waits until sleep exits
```

Regression test `test_native_verb_without_stdin_payload_ignores_open_inherited_stdin` (apps/fgos/tests/cli_tests.rs) holds a stdin pipe writer open and runs the same verb with a 20 s limit. On the unfixed host: `native verb that takes no stdin blocked on an open inherited stdin`, 20.05 s (killed). After the fix: passes in well under 1 s.

## Root cause

`apps/fgos/src/main.rs` native route, `else` branch of the stdin handling (was ~lines 246-255):

```rust
if !std::io::stdin().is_terminal() {
    let _ = std::io::copy(&mut std::io::stdin().take(1024 * 1024), &mut std::io::sink());
}
```

For every native verb that is not `observe.*` the host drained stdin to EOF (up to 1 MiB) and discarded it, whenever stdin was not a TTY. `take(1 MiB)` only bounds size; `copy` returns only at EOF, so an open pipe/heredoc fd with no writer close blocks forever. The drain adds nothing (verbs never look at it). For `observe.*` ops the host read stdin to EOF for every subcommand, so `metrics ...` verbs that need no stdin hung the same way.

Prior art: introduced by c831811fa (feat(rust-host): P07 CLI adapter legacy exec) as an unconditional drain; 120af6b3d added the observe read-to-end. Both are in the same block.

Eliminated: `legacy_exec.rs:249` `Stdio::inherit()` to node is correct (node reads stdin only in `handleHook` `bin/fgos.mjs:4802` and `fgos run --unit -` `src/runner/execution/run.mjs:381`, both legitimate). `scripts/fgos-shell-integration.sh` has no stdin handling. No Node verb reads stdin by default. `identity` is not a route in this checkout; it hits the same native block when native, so the fix covers it.

## Fix

Single owner, `apps/fgos/src/main.rs`: new `native_invocation_reads_stdin(op_id, cli_args)`; stdin is read only for invocations that consume a payload (the only providers reading `ObserveRequest.stdin`):

- `metrics ping`
- `metrics eval record`
- `friction record --detail-stdin` (flag anywhere in args)

All other native verbs never touch stdin; the drain is removed. No env switch, no test-only branch. Hooks (`fgos hook ...`) and `run --unit -` are legacy-node routes and keep inheriting stdin untouched.

## Tests

- `cargo test -p fgos`: 38 passed (cli_tests 22, including the 2 new). Before fix: the new hang test failed at 20 s.
- New `test_native_verb_with_stdin_payload_still_reads_it`: `metrics ping` receives stdin payload.
- `node --test test/rust-host/command-routes.test.mjs help-routes.test.mjs envelope-contract.test.mjs` with `FGOS_HOST_BIN` = this worktree debug build, session env vars unset: 40 pass, 0 fail.
- `node --test test/util/host-bin.test.mjs`: 7 pass.
- Full `npm test` not run (change confined to the host's native route stdin handling).

CHANGELOG: line under `[Unreleased]` / Fixed.

## Other places with the same pattern

None found. Remaining stdin reads (`bin/fgos.mjs:4802` hook, `run.mjs:381` `--unit -`) are explicit payload consumers; not changed. A legacy-node hook invoked with an open-but-silent stdin would still wait, which is inherent to reading a JSON payload.

## Unresolved

- Maintenance coupling: `native_invocation_reads_stdin` must be updated when a new native subcommand starts reading stdin; a provider-declared "needs stdin" flag in the route table would remove the coupling (not done, out of scope).
- The git guard in this agent environment rejected `git` after the rtk rewrite; I used the absolute git binary path. Lead may want to check that guard.
- The worktree's target dir is a symlink to main's, so cargo builds shared artifacts with main.
