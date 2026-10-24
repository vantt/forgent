# Work CLI background seal: the seal moves to a short detached child

2026-10-24 (Asia/Saigon). Branch `work/es-cutover`, commits `bd8ba8057` (feature) and `195f898eb` (review fixes). Owner decision 2026-10-24, option c.

## Door reused
`spawnDetachedAdvance` (`src/workflow/case-start.mjs`, the workflow's detached `fgos workflow resume`) was lifted into one leaf module, `src/cli/detached-child.mjs` (`spawnDetachedCli`): `process.execPath` + this payload's own `bin/fgos.mjs`, `detached: true`, stdio to a log file or `ignore`, `windowsHide`, `unref()`, an `error` handler, caller's env kept (host and writer identity resolve as in the parent). `case-start` runs on it (no second copy); a spawn that cannot start now throws a named error there instead of returning a null pid. The run supervisor (`startSupervisor`) was not used: it is for untrusted attempts. Other ad-hoc detached spawns (gateway, goal-check, holder-lock) untouched.

## Design
- `processSealCoalescer.handOff()` (called at the start of `main()` only when `currentDispatchDepth() === 0`): a `sealOnWrite` append at depth 0 records `{root, stream, checkpointPath}` instead of sealing. A runner `scope` still coalesces in process; a dispatched worker still seals inline.
- `bin/fgos.mjs` `handSealsToChild()`, in the `finally` after the answer is printed and before the end trigger: one `spawnDetachedCli(['events','seal','--stream',s,'--history',path,'--dir',root])` per recorded pair.
- New verb `fgos events seal --stream <s> [--history <file>]` (`src/verbs/events/seal.mjs`, registry entry, manifest rows): `store.seal` non-opportunistic (waits the store's bounded 5 s for the seal lock), certifies every open event of the stream, extends `.fgos/cache/event-history.json`, exits; nothing open returns at once; lock still busy after the wait answers `{busy:true}`, exit 0 (the holder or the next seal covers the backlog). `--history` must be a file under the main `.fgos/cache`. `events seal` opens the store through no start/end trigger (`opensEventStore`), so the child does one seal and no sweep or publish.
- Burst: always one child per command. Coverage was not provable without a handshake, so no skip-if-alive. Children serialize on the seal lock; the later ones find nothing open. A child whose wait times out exits 0 and the holder covers it only if the holder started after the event, otherwise the next seal does (spec §16).
- Failure: spawn refused or child killed leaves the event durable and readable (same state as a crash between append and seal); next command / later `sealOnWrite` / clean exit / interval trigger seals; doctor `event-store-unsealed` (existing proof `test/setup/event-store-checks.test.mjs`) reports a tail that stays. Spec §16 states it with the 2026-10-24 note and the new table row.
- Dispatched worker: seals inline (rule above, HARDEN M1). Inside a bwrap attempt the project store is read-only (EROFS), so a Work command is refused before it appends: no event, no child.

## Proofs (owning, lowest layer)
`test/event-store/background-seal.test.mjs` (real CLI, real child, seal lock held from a real process to order events):
- returns before the seal; the child then certifies the event; the child exits (process door, identity, not a bare pid).
- burst of 5 commands: every event sealed, no child left, seal lock free.
- child killed by identity before sealing: nothing lost (event readable), next command seals both.
- spawn refused (preload makes a detached spawn throw): command still exit 0, next command seals.
- CLI process group interrupted (SIGINT to the CLI group): the seal child leads its own group and survives, then seals. Skipped on win32.
- dispatched worker (`FGOS_DISPATCH_DEPTH=1`): returns sealed, no child.
`test/event-store/background-seal-confined.test.mjs` (real bwrap attempt through `fgos run`): the worker's Work command fails EROFS, appends nothing, no seal child exists, the next command outside seals.
`test/event-store/triggers.test.mjs`: `events seal` makes zero maintenance (trigger) calls.
No-orphan teardown: `test/helpers/process-tmp-root.mjs` waits (test code only), through the process door, for seal children naming the process's own temp root before removing it; no production switch.

## Tests changed
- `test/event-store/triggers.test.mjs`: the `events` usage message now lists `seal`; one added assertion for the no-trigger child.
- No other test assumed an in-process CLI seal: event-store, state, setup, architecture, cli, workflow, runner (minus `loop.test.mjs`) all pass. Findings: `test/cli/fgos-lock-fence.test.mjs` "escalates to SIGKILL" failed once under load and passes alone (no event store involved); the runner dirs print `run-tests: ERROR ... fgos-tp-*: 1 left behind`, which reproduces with my teardown hook disabled (pre-existing).

## Concerns and gaps
1. **Real unconfined-attempt test not possible here.** On this Linux machine every writing seat needs a bwrap-capable invocation (`resolvePostureInvocation`): omitting confinement, invocation `mode: unconfined` and capability-level `unconfined` all end in `policy-refusal posture-unavailable`. The macOS/Windows/pgroup attempt paths cannot be exercised here; the depth rule is proven at the CLI with the real env fact.
2. **No direct containment kill test.** Node has no caller of the containment port, and a bwrap worker never reaches the seal. The existing `direct-crash-matrix` setsid-grandchild proof covers "a session leader the worker leaves behind dies with the domain".
3. **Total work grew.** The child opens the store fresh: 32 git children and 65 fsyncs (vs 26/63 inline), because it re-resolves store facts. Wall time for the user fell; machine work for a move rose from 37 git / 69 fsync to 11 + 32 git and 4 + 65 fsync. A cheaper child entry (skip the facts resolve) is possible; not done (no new mechanism).
4. Loss window: the event is unsealed for about 0.6 s after the command exits on ext4 (see below), longer under load or a held seal lock.
5. Measurement rows `sealMs` include about 85 ms of the test's own receipt probe (`store.read` after exit); the Bb row shows the same artifact (exit 901, probe 986 though its seal is inline).

## Measurement (ext4 fixtures under forgent-worktrees, debug addon, median of 5 `move` processes)
Conditions: loads 1.6 to 2.9 at start of the runs (first run 1.61, second 2.88, below the 3 limit), other lanes held. A = origin/main `1fa580e07` (inline seal, no event store), B-before = `f78f679ed`, B-after = `195f898eb`. Each side's workspace crates were cleaned before its build and the three addons confirmed distinct by sha256 (A `e62143d8`, B-before `c66a2afb`, B-after `c0940dbb`). B-before and the first B-after run (code `bd8ba8057`) were measured in run 1; A and B-after of the final code in run 2.

| side | ms until result prints (range) | ms until CLI exits | ms until seal child exits (probe incl.) | git children: CLI / child | fsyncs: CLI / child |
|---|---|---|---|---|---|
| A (main) | 230 (228-242) | 243 | 243 (inline) | 5 / none | 0 / none |
| B-before | 880 (742-935) | 901 | 901 (inline; probe artifact 986) | 37 / none | 69 / none |
| B-after, first run (`bd8ba8057`) | 437 (406-446) | 462 | 1062 (1021-1091) | 11 / 32 | 4 / 65 |
| B-after, final (`195f898eb`) | 435 (388-501) | 465 | 1022 (1001-1092) | 11 / 32 | 4 / 65 |

The earlier wave measured B-before at 1114 ms and B-after at 944 ms for the whole command; this run's B-before was 901 ms (quieter host), so compare rows within the same table. Per move the user waits about 435 ms (print) instead of about 880 ms, roughly half; the seal work left over is about 550 to 600 ms after the CLI exits. M2 (no trigger around the child) shortened the child by about 40 ms (1062 to 1022).

## Docs and changelog
Spec §16 (table row, 2026-10-24 note, failure and dispatched-worker rules), the `events seal` verb row and scope row; `CHANGELOG.md` `[Unreleased]`; architecture manifest rows for the two new source files. Cleaned: measurement worktrees and the ext4 temp dir removed, no processes left.

Status: DONE_WITH_CONCERNS
Summary: Per CLI move on ext4 the answer prints in about 435 ms (B-before 880 ms, A 230 ms) and the CLI exits at 465 ms; the seal child ends about 1020 ms after the start (probe included).
Concerns: no real unconfined-attempt test is possible on this machine; total machine work rose (child 32 git / 65 fsync); lock-fence test flaked once under load.
