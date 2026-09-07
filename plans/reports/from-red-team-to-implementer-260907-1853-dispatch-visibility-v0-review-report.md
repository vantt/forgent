# Red-team review — Dispatch Visibility V0 (`dispatch-visibility-v0`)

Reviewed at `9f43e4b4`, 26 commits over `main` (merge-base `9f43e4b4`'s parent chain from `80b91858`).
Method: read every module in Part 2 plus the two production callers in `src/runner/dispatch/cli.mjs`,
the collector in `assignment-runner.mjs`, the config door, the `stale` verb, all branch tests, the live
proof, and the real herdr probe captures. Ran `npm test`, then re-ran the three failing files against a
throwaway detached worktree of `main`.

Note on the brief: it is one commit stale. `runHerdrRound` is no longer 328 lines inside `transport.mjs`;
commit `9f43e4b4` moved it to `herdr-round.mjs` and split it into twelve named steps. Section C judges
the code as it is, not as the brief describes it.

---

## Verdict

**Ship after named fixes.** Two correctness defects block merge (C1, C2); both are small and both come from
the same cause — the production call sites were never exercised by the branch's tests, which build the
adapter's invocation by hand. Everything the brief claims as *behaviour* is real and live-proven. Two things
the brief claims as *shipped* are not on any production path: confinement, and `run.json` close-out on the
runner path.

---

## Test state — verified

| | branch (`npm test`, raw) | `main` (same 3 files, detached worktree) |
|---|---|---|
| tests / pass / fail / skipped | 5728 / 5718 / 3 / 7 | 41 / 38 / 3 |
| failing | `fgos-intake-4` ask/answer legacy item (seq 2 vs 3), `enduser-index` missing `docs/tutorials`, `coordination-doctor-check` example requests | identical 3 |

None of the three files, nor the `src/verbs` they exercise, are touched on this branch. The claim holds
(the brief's 5719/5709 is a few tests behind the tree as it stands; same three failures).

---

## Correctness findings, ranked

### C1 — BLOCKING. Declared confinement never reaches the adapter on any production path

- `src/runner/dispatch/cli.mjs:256` (`spawnWorker`, the runner path) and `cli.mjs:532` (`executeExecutorCli`)
  both call `adapterFn({ command, args, argsTemplate, prompt, env, liveOutput, interactiveMode, promptDelivery }, …)`.
  `permissionMode` and `confinement` are not in that object. `resolveExecutorCommand` returns them
  (`transport.mjs:187-188`); the callers drop them.
- `herdr-round.mjs:177` `establishConfinement` therefore always sees `confinement === undefined` and does
  nothing. `grep confinement src/runner/dispatch/cli.mjs` → zero hits.
- Consequence: the C5 invariant at `config.mjs:745` ("bypass requires full confinement") is enforced at load
  and void at dispatch. A profile that declares `permissionMode: bypass` + all three flags is accepted, then
  runs the worker unconfined, in the operator's session, with whatever bypass flag its `args` carry. That is
  the exact hole the invariant exists to close.
- Why the tests are green: every confinement test in `herdr-spawn-adapter.test.mjs` (lines 593-663)
  constructs the invocation literally and hands it to `EXECUTOR_ADAPTERS['herdr-spawn']` directly. Nothing
  goes `loadRunnerConfig → resolveExecutorCommand → adapter`.
- Fix: add `permissionMode, confinement` to both call sites. Add one test that writes a runner config with
  `confinement: { isolatedSession: true }` on a herdr-spawn executor, dispatches through `executeExecutorCli`
  with the mock herdr, and asserts the mock saw a `workspace create` (or refused with `confinement-unavailable`).
  That single test would have caught this.

### C2 — BLOCKING. `run.json` on the runner path is opened `running` and never closed

- `cli.mjs:246` writes `dispatch-runs/<workId>/<stamp>/run.json` with `status: "running"`.
  `markRunSettled` is called from exactly one place in the repo: `assignment-runner.mjs:1103`. The `.then`
  at `cli.mjs:262` never touches `run.json`.
- `prefer` for `fgos-coding-implement` was flipped to `agy-herdr` on this branch (`a6f1a99b`). That
  dispatch goes through `spawnWorker`. So every production implement dispatch from now on leaves a
  `run.json` at `running` forever — the precise defect `visibility-session.mjs:14-17` says it exists to close,
  reintroduced on the path that actually runs.
- `fgos stale` will list every one of them as an orphan. `--reconcile` writes `settled` when an outbox result
  exists and `unknown` otherwise; a cli-spawn worker (`agy-cli`, still the fallback) has no outbox, so those
  become `unknown` permanently.
- Fix: in `spawnWorker`'s `.then`, `markRunSettled(workerRunDir)` on resolve; on reject,
  `markRunSettled(workerRunDir, { status: err.outcome === 'died' ? 'died' : 'settled' })` — the round ended
  and has a named answer either way. Test: dispatch through the mock via `spawnWorker`, assert
  `run.json.status !== 'running'` afterwards, on both the resolve and the reject branch.

### C3 — Should fix. A failed round leaves the operator's provider credential in `/tmp` indefinitely

- `herdr-round.mjs:497` removes the private HOME only in `settleRound`. `concludeFailure` (line 427) and every
  throw before the poll loop (pane split, trust seed, `startAgent`, `deliverBrief`) keep
  `$TMPDIR/worker-<agent>-XXXX/.claude/.credentials.json` (0600, but a plain copy). Nothing sweeps it; no
  doctor check knows the marker.
- Part 4 accepts "the worker holds a copy during the run". This is different: it accumulates one copy per
  failed round, forever, in a world-listable directory. Under C1 this is dormant today; the moment C1 is
  fixed it goes live.
- Fix: on every non-settled exit, delete only `.claude/.credentials.json` and keep the rest of the home for
  forensics (the reason the pane is kept applies to the home's config, not to the secret). Register a
  `fgos doctor` check that counts marker-bearing homes older than the ceiling.

### C4 — Should fix. `fgos stale --reconcile` marks a healthy in-flight run `unknown`

- `bin/fgos.mjs:2957-2975`: for every run whose `run.json` says `running`, `classifyRunOutcome(…, {liveness:'unknown'})`
  returns `unknown` with `changed: true` — regardless of age. With `--reconcile` it writes that into
  `run.json` and stamps `visibility.status = reconciled`.
- A run five minutes into a 35-minute ceiling (`timeoutMs: 2100000` in `.fgos/config.json`) is rewritten
  `unknown`. `watch.mjs:21` treats `unknown` as terminal, so every watcher stops. The driver is still driving.
- Root cause is structural: nothing on disk says "the driver is alive". `visibility.json.lastSeenAt` is only
  stamped when `round.note` fires, and inside `pollForOutcome` that happens once (on ack). For the rest of a
  30-minute round the file does not move.
- Fix: a heartbeat — `round.note({})` every ~10 s inside `pollForOutcome` (one atomic rename, no new field).
  Then `stale` treats `lastSeenAt` younger than, say, 60 s as live and skips it. This heartbeat is also the
  thing V1's "is the driver at rest?" question will need, so it is not throwaway.

### C5 — Should fix. The observe verbs' "read-only by construction" test is defeatable and the claim is overstated

- `test/verbs/dispatch-observe.test.mjs:33-47` greps the *text* of the two verb files for forbidden tokens.
  It does not follow imports.
- `show-run.mjs:15` imports `visibility-session.mjs`, which exports `writeVisibility`, `markDetached`,
  `reconcileRun`, `markRunSettled`. Nothing structural prevents `watch.mjs` from calling `markDetached` on
  the run it is watching; the test would stay green. "Read-only by construction" is currently read-only by
  discipline plus a regex.
- Fix, two parts. (1) Make the test walk relative imports from each verb and assert that neither
  `herdr-agent.mjs` nor `node:child_process` nor any exported writer is reachable. (2) Split the readers
  (`readVisibility`, `visibilityPath`, `findWorkerResult`, `classifyRunOutcome`) into `visibility-read.mjs`
  and have the verbs import only that. Then the sentence in the header becomes literally true.

### C6 — Should fix. Reconcile and collector disagree about the legacy claim name

- `assignment-runner.mjs:162` `resolveWorkerArtifactPath` reads `outbox/result-<n>.json` (highest n, numeric)
  and falls back to the flat `agent-result.json`. `visibility-session.mjs:167` `findWorkerResult` reads
  the outbox the same way, then falls back to the *collector's* `result.json` — never `agent-result.json`.
- A crashed cli-spawn run whose worker did write `agent-result.json` reconciles to `unknown`. The comment at
  line 174 promises "two readers of one directory must not disagree"; they do, on the fallback.
- Fix: move `resolveWorkerArtifactPath` to a tiny shared module and call it from both. Also: the header at
  lines 164-166 says the collector's `result.json` "proves nothing about the worker", then the code accepts
  it as `settled`. It is defensible (`result.json` existing means the collector ran to completion) but say
  that, not the opposite.

### C7 — Minor. The idle clock and the `paused-limit` rung have no production path today

- `pollForOutcome:383` sets `agentState = 'unknown'` when `agent get` throws, and only `working` refreshes
  `lastProgressAt`. With `idleTimeoutMs` set, a herdr outage longer than idle ends a healthy round
  `timed-out-idle`. An unreadable status should pause the idle clock, not run it.
- Today this is moot: `.fgos/config.json` has no `idleTimeoutMs` anywhere, so `stale` never trips, the screen
  is never read, and `paused-limit` is unreachable outside the test. The brief lists it as a shipped outcome;
  it is a shipped *branch*.

### C8 — Minor. The operator-session refusal cannot see a named cockpit

- `worker-session.mjs:81` refuses `default` and `$HERDR_SESSION`. A dispatch started outside herdr (runner
  daemon, cron, a plain shell) has no `HERDR_SESSION`; if the operator's cockpit is a *named* session and
  someone sets `confinement.sessionName` to that name, the refusal passes and the worker lands in the cockpit.
- V0 could simply not accept `sessionName` (one fixed `fgos-worker` session), or refuse any session whose
  socket already exists and carries no fgOS marker beside it.

### C9 — Minor. A stale socket file wedges confined dispatch until someone deletes it by hand

- `worker-session-boot.mjs:65`: `existsSync(socketPath)` is read as "server up". A server that died without
  unlinking leaves the file; `paneList` fails (swallowed), `workspaceCreate` throws a raw `HerdrError`, and
  every confined dispatch thereafter refuses with `confinement-unavailable`. Fix: on connect failure to an
  existing socket, unlink and start.

### C10 — Nit. `normalizeAgentName` truncates the uniqueness suffix, not the workId

- `herdr-agent.mjs:42` slices to 48 after building `fgos-<workId>-<ts36>`. A workId over ~34 chars loses
  the timestamp and two rounds of the same item can share an agent name in one session. Truncate the workId.

### Probed and found sound

- **Kill path.** Could not construct a sequence that kills a healthy worker. `absent` needs three consecutive
  reads; a thrown probe is `unknown` and resets; `unknown` on `agent get` does not feed the death count;
  `pane close` is never called on any non-settled outcome except under `closeAlways`, which never touches
  `paused-limit`. The real `process-info` shape (`process_info.shell_pid`, `foreground_processes[].pid`)
  matches the mock — verified against the probe scripts in `proofs/2026-09-06-isolation/` and by live case B.
- **Atomicity.** `visibility.json` and `run.json` are temp+rename; a reader never sees a torn file. Lost-update
  between driver and `stale --reconcile` needs both to read before either renames — microsecond window,
  acceptable. The lease is gone and the module says why; nothing calls it. Correct call.
- **Collector.** Numeric round ordering is right on both readers; the claim is excluded from companion reports
  under both names (`assignment-runner.mjs:479-481`). `ack-<n>.json` is never listed as an artifact, so it
  cannot pose as a report.
- **Ladder use in the adapter.** `decide()` threads the same `prior` into both calls, reads the screen at most
  once per settle, and stores the second result as `prior`. Faithful to the unit tests.
- **Mock fidelity.** Envelope shapes match herdr 0.8.2 and `herdr-agent.test.mjs`. One thing the mock cannot
  vouch for: `agent prompt --wait --until working` on a turn that completes faster than herdr's own poll.
  The mock always answers `working`. The live runs never hit it; it stays unverified, and if it ever
  misfires it surfaces as `deliverBrief` throwing `timeout` with a result file already on disk. Cheap guard:
  in `deliverBrief`, on `timeout`, check `paths.resultPath` before throwing.

---

## Design and clarity

### D1 — `runHerdrRound` after the split: acceptable

The sequence body (`herdr-round.mjs:511-588`) reads top to bottom in one screen. The remaining seams, if
anyone wants them: `pollForOutcome` carries two concerns (ladder polling and brief-resend policy —
`maybeResendBrief(state)` would take lines 400-414 out), and `settleRound` does five things (read stdout,
`/exit`, drain, close, remove home). Neither is worth a commit on its own. The `openRound` context object
with `note`/`fail` closures is a small pattern a reader gets on first sight.

### D2 — Two vocabularies, and it is worse than the brief says

The brief asks about `confinement` vs `*-bwrap` executor entries. The larger drift is inside the executor
profile itself: fields the adapter reads live in two places with two validators.

| field | validated at | read by adapter from | notes |
|---|---|---|---|
| `trustStore` | `executor.trustStore`, kinds `['claude-json']` | `interactiveMode.trustStore` | the live config puts it under `interactiveMode`; `codex-toml` is accepted there and rejected at top level; `interactiveMode.trustStore` is not validated at all |
| `receipt` | `executor.receipt` | nothing | dead field |
| `confinement`, `permissionMode`, `promptDelivery` | `executor.*` | `invocation.*` | dropped at the call sites (C1) |
| `kind`, `exitCommand`, four timeouts | `interactiveMode.*` | `interactiveMode.*` | consistent |
| `ownWorktree` | config + doctor | nothing at runtime | a declaration nothing enforces |

Concrete: delete `receipt` and top-level `trustStore`; validate `interactiveMode.trustStore` with
`claude-json|codex-toml`; either enforce `ownWorktree` (`cwd !== repoRoot` in `establishConfinement`) or
drop it from V0. On bwrap: keep the field and leave the bwrap entries alone for now — the field is the only
place the bypass⇒confinement invariant can be checked, and when bwrap is folded in it becomes
`confinement.sandbox: "bwrap"`. But fix C1 first, or the field is fiction.

### D3 — Six timeout knobs → two

`readyTimeoutMs` (30 s, herdr's default), `promptTimeoutMs` (20 s, floored by herdr's 5 s stall detector),
`resendAfterMs` (already defaults to `promptTimeoutMs`) and `maxResends` (2) are transport constants. No
executor in the live config sets any of them, and a person configuring an executor has no basis to pick
different values. Move them beside `RECEIPT_POLL_MS`/`EXIT_DRAIN_MS` in `herdr-round.mjs`, delete their
validators. What remains for a person: `timeoutMs` (ceiling) and `idleTimeoutMs`. Cost: none measured.

### D4 — `needsScreen` two-pass: keep

It costs six lines in `decide()` and keeps twelve ladder tests clock-free and terminal-free. Injecting a
`readScreen` callback would make the ladder impure for one rung. Not worth it.

### D5 — Where a cold reader loses the thread

1. **`transport.mjs` header** (lines 1-33) still describes the file as the cli-spawn/http port and "pure move".
   A reader lands here first because `EXECUTOR_ADAPTERS` is here, finds forty lines of herdr glue at 577, and
   the real mechanism is in another file. Three lines at the top: "herdr-spawn lives in `herdr-round.mjs`;
   this file only unpacks the invocation."
2. **Four status vocabularies.** `visibility.status` (ten states), `run.status` (four), ladder `outcome`
   (six), `errorClass` (coarse). `fgos dispatch show-run` prints two of them side by side with the same key
   name. One table in the `visibility-session.mjs` header mapping them, or rename `visibility.status` to
   `phase`.
3. **`herdr-agent.mjs:226`** says `agentGet` is "diagnostic only", while the poll loop uses it to conclude
   `blocked` (a terminal outcome) and to feed progress. `liveness.mjs:30` has it right. Fix the comment.

### V1 — is it painted into a corner?

No. Everything a separate-process `contact` verb needs to rebuild the client is already in `visibility.json`
(`agentName`, `paneId`, `workerSession`). Two things to lift before V1, both trivial: `roundNumber` is the
literal `1` at `herdr-round.mjs:518`, and the resend logic in `pollForOutcome` would type at an agent that a
contact has just put to rest — the lock the lease removal defers is genuinely needed then, and the heartbeat
from C4 is the "is the driver at rest" signal it will read.

---

## The four questions

1. **Implemented or looks implemented?** Implemented: brief-as-file, `agent start`, result-file completion,
   the ladder, typed failures, `run.json` close-out on the assignment path, observe verbs — real, and
   live-proven with the operator's session untouched. Looks implemented: confinement (C1), `run.json` on the
   runner path (C2), `ownWorktree` and `receipt` (declared, read by nothing), `paused-limit` (no config path).
2. **Blocking issues?** C1 and C2. Both are two-line fixes plus one test each through the real call site.
3. **Simple enough?** Close. Out: four timeout knobs, `receipt`, top-level `trustStore`, `ownWorktree` as a
   no-op. In: nothing new.
4. **Cold read?** The round reads in one pass now. The reader loses the thread at `transport.mjs`'s header,
   at the profile fields split across two levels, and at the four "status" words. All three are comment or
   move fixes.

---

## Unresolved

- `agent prompt --until working` on a sub-poll-interval turn: unverifiable without herdr's source.
