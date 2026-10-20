# Phase lead report: pi and omp brief through the prompt door

## Outcome

pi and omp now deliver the brief through the herdr prompt door (one send, text plus submit), mirroring the codex change in `bcc1ef758`. The supervisor re-reads its stop state before every send into the pane. One commit on branch `worktree-agent-af99e94338e03ac3a`.

## Changes

| File | Change |
|---|---|
| `packages/agent-protocol/rust/src/terminal/pi.rs`, `omp.rs` | `submit_by_prompt_door: true`, doc line why |
| `packages/agent-protocol/contracts/fixtures/terminal/{pi,omp}/vectors.json` | chip and finished-turn vectors: Enter counts lowered by the initial Enter that no longer exists (`minEnters` 2 to 1, `maxEnters` 7 to 6); new vector "brief-goes-in-one-prompt-door-send-that-submits-itself" (`sentTexts 1`, `submitSends 1`, `maxEnters 0`) |
| `packages/agent-protocol/rust/tests/terminal_vectors.rs` | harness understands `submitSends`; two stop tests over all five CLIs |
| `packages/run-supervisor/rust/src/supervise/terminal.rs` | `TermIo::send` runs `tick` first |
| `docs/platform/agent-protocol/spec.md`, `CHANGELOG.md` | pi, omp rows and Brief row; one Unreleased line |

Codex-change parity: the flag, fixture Enter counts, spec row, CHANGELOG line. The codex change also added the Pasted Content chip matcher; pi and omp need none (their chips, `[paste #N ...]` and `📄 #N`, are matched already).

## Where delivery and stop meet

`Sup::begin_stop` sets `stopped`; `TermIo` refuses `send`, `screen` and `inspect` once `Sup::finished()`. But `finished()` is refreshed only by `Sup::tick`, which runs only inside `TermIo::pause`. A cancel, soft deadline or lost gate seen between the last pause and a send was not honoured. Fix: `TermIo::send` calls `tick` before the check (3 lines). `Terminal::deliver_brief` already returns `DeliveryUnknown` without further sends when calls are refused; the new tests lock that in.

What the change cannot do: the 18:32 omp case (a 7 KB `pane send-text` still being echoed when the kill landed) is a call already in flight. With the prompt door the brief is one short call, so the long window goes away. The in-flight call itself cannot be recalled.

## Tests

| Check | Result | Verified |
|---|---|---|
| `cargo test -p fgos-agent-protocol -p fgos-run-supervisor` (private target dir) | all pass; terminal_vectors 9 of 9 | ran here |
| Release build of `fgos` host | ok | ran here |
| Full `npm test` with fresh host, session env unset | 7 files killed at the 600 s per-file limit, no assertion failures; none of the known-failing files listed (`fences-v1-tombstone`, `dispatch-policy-baseline-snapshot`, `herdr-claude-invocations`, `terminal-*`, `client-route`, `skill-wrappers`) failed this run | ran here |
| Rerun alone: `crash-matrix-adopt-resume`, `run`, `operation-choice`, `run-provider-failover`, `fgctl-init`, `fgctl-init-download-sources` | pass, 143 to 566 s each | ran here |
| Rerun alone: `test/rust-host/fgctl-upgrade.test.mjs` | hangs, killed at 900 s ("Promise resolution is still pending but the event loop has already resolved"); not compared against main | ran here |

Reading of the suite result: the six files that pass alone still take 143 to 566 s on this loaded machine (suite 1348 s against a 202 s baseline), so running in parallel inside the suite pushed them past the 600 s limit; load, not a failure. `run-tests` also logged `failed to ensure host binary: spawnSync cargo ENOENT` for child processes, which did not stop those files from passing alone. `fgctl-upgrade` touches no code I changed (fgctl upgrade path); I did not confirm it also hangs on main. The temp-dir leak error in `run-tests` follows from the killed files.

## Not touched, but related

- `docs/platform/agent-mailbox/spec.md:592` says Codex is the only CLI whose `deliver_brief` goes through the prompt door, and that the prompt door moves herdr focus. pi and omp now join codex there, so a mailbox typed nudge to a pi or omp seat would steal focus. That spec is another lane's; not edited.
- Provider errors only visible in the pi screen (402) and private-home case 1: not touched.
- omp through `herdr agent prompt` is covered by fixtures only. The 3 of 3 live proof was for pi. A real omp and pi seat smoke is the big lead's step.
- Report path: the convention tool produced `plans/reports/phase-lead-261020-2027-herdr-brief-prompt-door.md`, not the 2009 name in the brief.

## Unresolved questions

- Does `fgctl-upgrade.test.mjs` hang on main too?
