# Wave 5: runner seal coalescing (owner decision 2026-10-23 17:57)

Branch `work/es-cutover`, written 2026-10-23 Asia/Saigon.

## Finding first

- Runner: Work writes run in-process through `withWorkState` -> `withConsumerState` (`src/state/consumer-event-gate.mjs`), which sealed after every `sealOnWrite` append. This is where the coalescing applies.
- Gateway: its Work writes are `fgos` CLI invocations (`apps/fgos-gateway/src/gateway.rs` spawns `fgos`/`fgos-runner` through `Command::new`). Nothing to coalesce; gateway code is unchanged. Its stop-time seal row stays.
- Children the runner spawns (settle-attempt, finalize-home) are CLI processes: each seals once per command, as before.

## Which process seals, per path

| Path | Seals | When |
|---|---|---|
| `fgos move` and every other CLI command | the CLI process | immediately after the gate is released (unchanged), plus its opportunistic start/end seals |
| runner, in-process Work writes (`runOnce`, hence `--once` and `--watch`) | the runner process | one seal when a dispatched wave settles, when `runOnce` returns, or by `eventStore.seal.coalesceSec` (30 s) after the first pending event, whichever is first |
| runner poll (`--watch`) | the runner process | `maintain({})` before each cycle (due-by-interval, unchanged) |
| runner clean stop | the runner process | `maintain({ shutdown: true })` seals every stream (unchanged) |
| gateway | its `fgos` children, one seal per command | unchanged |

## Reused, changed

Reused: the gate's existing seal point (`sealedType` branch), `store.seal(..., { opportunistic: true })` and its swallow-on-failure rule, `maintainEventStore` poll/shutdown triggers, the eventStore config shape registered as a config default (`EVENT_STORE_DEFAULTS`), the setup context that already fails every doctor row on an invalid config. No new seal path: the coalescer calls the same `store.seal`.

Commit 1 (code, tests): 
- `src/event-store/seal-coalescing.mjs` (new): `createSealCoalescer(clock)` with `seal`, `flush`, `scope`; `processSealCoalescer` is the process instance. Outside a scope `seal` seals at once (CLI). Inside, it marks pending; flush at unit end/scope exit; a timer (unref'd, injectable) and a deadline check at the next request enforce the window.
- `src/state/consumer-event-gate.mjs`: the lifecycle seal goes through `sealer.seal(...)` (option `sealer`, default process instance).
- `src/runner/loop.mjs`: `runOnce` declares the long-lived scope (explicit, no guessing); a wave flush after each settled wave.
- `src/event-store/config.mjs`: key `eventStore.seal.coalesceSec`, default 30, integer >= 1; error message now names the key (`invalid seal.coalesceSec`).
- `docs/architecture-manifest.json`: new file as `infra`.

Commit 2 (docs): spec section 16 (trigger rows, dated update citing the owner decision, config table, defaults row), setup-doctor registry contract, CHANGELOG `[Unreleased]`.

## Config key

`eventStore.seal.coalesceSec`, default 30. Registered in `fgos setup` config-merge through `EVENT_STORE_DEFAULTS` (the shape registered as the `event-store` config default; merge fills the missing key and keeps a user value). Doctor: a malformed value (0, negative, fractional, string, null) fails every `event-store-*` row with `event-store-config: invalid seal.coalesceSec`, the same path as the other numeric keys. No new doctor row was needed.

## Proofs (one owner each)

- `test/event-store/seal-coalescing.test.mjs` (coalescer logic, fake clock and fake timer, no sleeps): CLI mode seals every request; five requests in a scope make one seal; async scope and failure flush; unit-end flush starts a new window; seal by N seconds after the first (29.999 s no, 30 s yes, timer needs no further request); late request seals with the caller's held ranks; a failing seal never throws.
- `test/event-store/work-gate.test.mjs` (wiring on the real store): three lifecycle appends in a scope leave the receipt at 0 and the events readable, one flush certifies all three; scope exit seals; a real writer process SIGKILLed with pending events: receipt 0, both events still read, the next seal certifies them. The existing `lifecycle events seal after release` test remains the CLI-mode proof.
- `test/setup/event-store-checks.test.mjs`: malformed values fail the doctor row, repaired value passes, default 30. `test/event-store/verbs.test.mjs`: config validation cases and merged shape.

Focused runs, all green: test/event-store, test/state, test/setup, test/architecture.test.mjs (2310 tests, 2 architecture failures fixed by the manifest row, rerun 31/31), test/runner minus loop.test.mjs plus test/runner/dispatch (2401 pass, 0 fail). No Rust touched, so no cargo or clippy run, no census change. loop.test was run only as the single `announce line` case under strace.

## Counts, loop.test `announce line`, strace -f, same method both sides

Before = the same tree with `runOnce` temporarily bypassing the scope; after = committed code. Counts are all successful `git` execve and fsync/fdatasync calls in the process tree (bwrap-wrapped git counts as exec of its own), so absolute numbers differ from the earlier 360/387 method.

| | git execs | fsync |
|---|---|---|
| before | 687 | 345 |
| after | 585 | 229 |

-102 git execs (-15%), -116 fsync (-34%). One run each, host load not controlled; ratios only.

## Concerns

- Runner seal window: a runner can now hold unsealed events for up to 30 s (doctor warns above twice `seal.intervalSec`, 600 s, so unaffected).
- Crash: a killed runner's events are certified by the next trigger: a later `sealOnWrite`, a clean exit, or a command's opportunistic seal once older than `seal.intervalSec` (300 s). Readers see the events at once; only certification waits, which is the existing crash rule.
- A concurrent in-process writer inside `runOnce` that is not the runner's own work would also coalesce; none exists today.
- Accidental stash during measurement was dropped after confirming the working tree held the same bytes.

Status: DONE
Summary: Runner coalesces sealOnWrite seals (wave end, runOnce end, 30 s window via new `eventStore.seal.coalesceSec`); CLI unchanged; gateway needs nothing since it only spawns `fgos`.
