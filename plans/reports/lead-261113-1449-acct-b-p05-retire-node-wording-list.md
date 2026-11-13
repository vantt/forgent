# Lead report: retire the Node wording list (branch harden/acct-b-p05)

Base: origin/harden/acct-b-p04 (f144848c7). Not landed; main is frozen until rc.7.

## Commits
- b7464fd5c refactor(dispatch): both provider probes judge through the agent protocol and the Node wording list is retired

## What changed
- Addon: `agentProtocol.classifyDirect(cli, exitCode, stderrTail, stdoutTail) -> {reason, providerSignal}` (`packages/git/node-addon/src/agent_protocol.rs`, crate depends on `fgos-agent-protocol`). `versions()` reports `agentProtocol: 1`; `combinedAbiMatches` in `src/native/door.mjs` requires it, so an older addon fails by name at load.
- Credential probe: keeps stdout and merged output apart, judges through `classifyDirect` with the plan's `cli` (kept across the `timeout` wrapper); reads the last 5 lines only. A judge failure (addon missing) resolves as a failed probe instead of throwing inside the child `close` handler, so the account stays locked.
- Account probe: `readRunOutcome` carries `cause` and `providerSignal`; `classifyAccountProbe` maps `provider-limit` + credential/quota/provider to auth/quota/other with the signal as evidence; the ok branch no longer reads text.
- Deleted `provider-auth-failure.mjs`, its test, manifest entry, baseline line. `rg provider-auth-failure src test docs/architecture-manifest.json packages/agent-protocol` is empty.
- Addon reachability verified: the credential-probe tests drive the real addon (run-tests stages it).

## Gates
- Focused (credential/account probe, capacity, renewal, per-cli sources, native-load, windows-borrow, architecture, doc-health, citation-drift): 288 tests, 0 fail. /dev/shm/acct-b-p05-focus.log
- Full `npm test`: 8858 tests, 0 fail, no ERROR lines (no COOK HOLD). /dev/shm/acct-b-p05-full2.log (first run hit my 590 s timeout wrapper, SIGTERM, no leftovers)
- cargo fmt, clippy -D warnings, test -p fgos-node-addon: clean (/dev/shm/acct-b-p05-clippy.log, -ctest.log)
- cargo check msvc and aarch64-apple-darwin: ok (only a vendored arraydeque lint warning)
- one-door scan: 0 undeclared sites; census regenerated (no entry for the deleted module remains).

## CHANGELOG line proposed
- A dead login or used-up quota on an account probe or an unlock probe is now judged by the same Rust matcher a supervised run settles through; the duplicate Node wording list is gone.

## Net size
Deleted module 69 lines + test; added ~30 Rust, ~45 Node src; tests rewritten (see diff stat).

## Retired tests and owners
`provider-auth-failure.test.mjs` retired. Owners per the plan table: agent-protocol direct vectors (pi login, quoted key, far-up wording, codex usage limit, 402, quoted/far-up quota, quota transcript with old login); `provider-capacity.test.mjs` (the provider HTTP error case moved there as one test; default-until case exists); `attempt-steps.test.mjs` for settlement-from-caller. New proofs: credential probe "judged ... through the agent protocol", "last JSON event of stdout", "only the final lines count"; account probe "classes ... settled", "run settled as a provider limit ... cause". Behaviour removed: a settled run with a claim that printed a dead login is no longer reported auth (protocol rule 1: outbox wins).

## Deviations
- Touched `src/native/door.mjs` and `test/git/native-load.test.mjs` (not in the file list) for the ABI marker and its versions assertion.
- `Cargo.lock` gained the `fgos-agent-protocol` edge for the addon; unavoidable with `--locked`. Landing may regenerate it.

## Authority
None.

## Lessons
- A new addon namespace needs its version marker in `versions()` and `combinedAbiMatches` in the same change, or an old addon fails at first call.
- Never throw from an event handler that resolves a probe; fold judge errors into the result.
- `withKillTimeout` rewrites `command`, so anything that needs the real CLI must carry it separately.
- `test-proof-inventory --write-baseline` rewrites unrelated counters; delete the one baseline line by hand instead.
