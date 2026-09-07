# Red-team review — Dispatch Visibility V0

Branch `dispatch-visibility-v0` @ `dc131ddb`. Reviewed against the brief in
`from-implementer-to-red-team-260907-1050-dispatch-visibility-v0-review-prompt.md`.
Every claim below was checked by reading the code, running a probe, or running
the suite. Where I could not verify, I say so.

## Verdict: ship after named fixes

The core claim holds. Completion is a file the worker wrote; `agent_status` is
never read as completion; the ladder's kill rules are correct and I could not
construct a sequence that kills a healthy worker through the ladder itself. The
mock herdr's envelope and `process-info` shape match what a real herdr 0.8.2
returned to me live (`shell_pid` + `foreground_processes[]`, `{id,result}` /
`{error:{code}}`).

What does not hold is that V0 is wired to the path it was just flipped onto. Four
things are library-complete and caller-absent, and the brief's own scope line
("`prefer` is still `agy-cli`, none of this is on a production path") is no
longer true: commit `a6f1a99b`, landed after the brief was written, sets
`capabilities.fgos-coding-implement.prefer = "agy-herdr"`. So the findings
marked C1/C2 are on the production path today.

Two corrections to the brief's facts before the findings:

| Brief says | Measured |
|---|---|
| 3 pre-existing failures | 4 failures (5722 tests, 5711 pass). The 4th, `fgos-mirror byte-identical`, is a concurrent-write flake: ENOENT on `scope-and-reclaim.md.tmp-2964846-…` while another process was assembling skills. Not this branch. The other 3 are as stated. |
| 26 commits on top of `main` | Local `main` already equals HEAD (`dc131ddb`). `origin/main` is at `aedfe0a3`, 202 commits behind. "Block merge to main" is moot locally; the real gate is the push. |

---

## Correctness findings, ranked

### C1 — HIGH — The production path puts every V0 artifact in `/tmp`

`src/runner/dispatch/cli.mjs:236-244` (`spawnWorker`, the path `loop.mjs`
uses) passes `{cwd, timeoutMs, idleTimeoutMs, maxBuffer, onChunk, workId, tier,
model}` and **no `runDir`**. `transport.mjs:757-759` then falls back to
`fs.mkdtempSync(os.tmpdir(), 'fgos-dispatch-')`.

What breaks on that path:
- `brief-1.md`, `visibility.json`, `outbox/` land in `/tmp/fgos-dispatch-XXXX`,
  not in the run directory.
- `fgos dispatch show-run|watch` walk `.fgos/assignments/*/runs/*` and cannot
  find these runs. The observe door is blind to the path that now carries
  `fgos-coding-implement`.
- The collector never sees the outbox on this path; the loop is fed the report
  text as `stdout` and nothing else.

Only `executeExecutorCli` (`cli.mjs:510`, the assignment-runner path) passes
`runDir`. The live probes all passed `runDir` explicitly, which is why this never
showed.

Fix: `spawnWorker` must pass a real run directory, or the adapter must refuse
without one. Refusal is the smaller change and matches the branch's own
"refuse, never downgrade" stance:

```js
// transport.mjs, runHerdrRound
if (!ctx.runDir) throw fail('invalid-config', 'no-run-dir',
  `herdr-spawn needs a run directory to write its brief and receipt into; none was given`);
```

Then give `spawnWorker` one. `loop.mjs` already owns the item's worktree path;
`<worktree>/.fgos-run/` or the assignment runs dir are both defensible. Pick one
and record it in ADR-011.

### C2 — HIGH — `repoRoot` is dead config: confinement cannot be established for a worktree dispatch

`transport.mjs:797` and `:845` read `ctx.repoRoot`. `herdrSpawnInteractiveAdapter`
never puts `repoRoot` in the ctx it builds (`:669-700`), and neither call site in
`cli.mjs` forwards it (the `executeExecutorCli` site has `repoRoot` in its own
opts and drops it).

Consequences:
- With `confinement.privateHome`, `createWorkerHome` is asked to derive trust for
  `repoRoot = path.resolve(cwd)`. `cwd` is a fresh worktree, which is by
  definition untrusted, so `readTrust` returns `null` and the dispatch is refused
  with `untrusted-root`. Confinement therefore works only when `cwd` itself is
  already trusted. Every live probe pre-seeded trust for its workspace from a
  `TRUSTED_ROOT` the adapter is never told about.
- Without confinement but with `trustStore`, seeding derives from
  `path.dirname(cwd)`. For a worktree under any directory other than the repo
  root, that is the wrong root and seeding fails silently
  (`note({trustSeedFailed})`), leaving the trust dialog exactly where it was.
  `agy-herdr` declares no `trustStore`, which is the only reason this is not
  visible today.

Fix: thread `repoRoot` from `spawnWorker` (it has `opts.fgosDir`, whose parent is
the main checkout) and from `executeExecutorCli` (`opts.repoRoot`) into the
adapter opts, then into ctx. Refuse when absent instead of guessing from `cwd`.

### C3 — MEDIUM — Two implementations of "latest round", one wrong

`visibility-session.mjs:findWorkerResult` uses `.sort().pop()`, which is
lexicographic. Measured: with `result-{1,2,9,10,11}.json` present it picks
`result-9.json`. `assignment-runner.mjs:resolveWorkerArtifactPath` sorts
numerically and is right. `round` is hard-coded to `1` in
`runHerdrRound`, so this is unreachable today and becomes reachable the day V1
adds a second round.

Fix: delete the scan in `findWorkerResult` and call `resolveWorkerArtifactPath`
(or move that function next to `briefPaths` in `brief.mjs`, which is where the
file-naming contract already lives, and import it from both).

### C4 — MEDIUM — The actor lease is unenforceable and unused

`claimActor` is read-then-decide-then-write with no exclusion primitive
(`visibility-session.mjs:157-178`). Two processes that both read before either
writes both succeed, and both hold. The interleaving is trivial: A reads (no
actor), B reads (no actor), A writes, B writes. Both `claimActor` calls return.

More important: nothing calls `claimActor` or `releaseActor` outside the tests.
`runHerdrRound` never claims. ADR-011's "exactly one actor holding a
pid-and-token lease" is a statement about a function nobody invokes.

Fix, pick one:
- **Delete it** (recommended). V0 has one driver by construction (the dispatch
  process) and observers hold nothing. Ship the lease when V1's `contact` verb
  needs a second process to claim the seat, and implement it then as
  `fs.openSync(path.join(runDir, 'actor.lock'), 'wx')` with pid+token inside,
  which is the only atomic primitive available here. Edit ADR-011 to say the
  lease is V1.
- Keep it and call it from `runHerdrRound`, implemented on `O_EXCL`.

An unenforced lock that reads as enforced is worse than none.

### C5 — MEDIUM — `reconcileRun` has no caller

Only tests call it. A dispatch process that dies still leaves `run.json` at
`running` forever, which is the exact defect the module header describes. The
brief's "a crashed run reconciles to settled/died/unknown" is true of the
function and false of the system.

Fix: the smallest honest caller is the existing `fgos stale` verb, which already
sweeps for stuck `doing` items. Have it visit each `running` run whose
`visibility.actor.pid` (or the runner pid recorded in `run.json`) is dead and
call `reconcileRun(runDir, {liveness})`, with `liveness` read once via
`paneProcessInfo` if a `paneId` is bound, else `unknown`. That is a read plus one
write, no new verb.

### C6 — MEDIUM — A stale result file kills a freshly briefed healthy worker

`runHerdrRound` never checks that `outbox/result-1.json` is absent before it
starts polling. If a run directory is reused (any caller passing the same
`runDir` twice, which the probes' `.runs/NN` scheme is one off-by-one from), the
first poll sees the old result, settles, types `/exit` into a worker that has
just started reading its brief, and closes the pane. This is the "sequence that
kills a healthy worker" from Part 3B, found outside the ladder rather than inside
it.

Fix, three lines at round start:

```js
if (fs.existsSync(paths.resultPath)) throw fail('invalid-config', 'stale-result',
  `run directory ${runDir} already holds ${paths.resultPath}; refusing to start a round that would settle on it`);
```

### C7 — MEDIUM — Session refusal is by name, and `sessionName` is not validated at the config door

`worker-session.mjs:assertNotOperatorSession` refuses `default` and whatever
`HERDR_SESSION` the runner process was started with. A runner started outside
herdr (systemd, cron, a VS Code terminal) has no `HERDR_SESSION`. An operator
whose cockpit is a named session (`herdr --session work`) plus an executor with
`confinement.sessionName: "work"` places the worker in the cockpit. `config.mjs`
never looks at `sessionName` at all; only the runtime regex sees it.

Fix: require `sessionName` to match `^fgos-` at the config door and in
`assertNotOperatorSession`. Operators do not name cockpits `fgos-*`; workers
always are. One regex closes the configuration hole without needing herdr to
tell us which session has a human attached.

Secondary: `ensureWorkerSession` spawns `herdr --session X server` with the
caller's full environment, including the operator's `HERDR_SOCKET_PATH`. The
live proof shows `--session` wins, so this is not a defect today, but passing an
explicit `env` with `HERDR_*` stripped costs one line and removes a dependency on
herdr's precedence rules.

### C8 — LOW — A stale socket file wedges the worker session permanently

`worker-session-boot.mjs:70` treats `existsSync(socketPath)` as "server is up".
After a SIGKILL or reboot the socket file can remain with no listener.
`paneList()` throws (swallowed), `workspaceCreate()` throws a `HerdrError`, and
every subsequent confined dispatch is refused with `confinement-unavailable`
until someone deletes the file by hand. The test file stubs `existsSync` and
never exercises this.

Fix: if `paneList` fails while the socket file exists, unlink the socket and
start the server, once. Refuse if it fails again.

### C9 — LOW — For agy, the idle timeout is either unarmed or unusable

`.fgos/config.json` sets no `idleTimeoutMs` (ceiling is 2 100 000 ms). Rung 5 of
the ladder never fires in production. That is a configuration fact, not a bug.
The bug-shaped part: herdr reports `antigravity-cli: not installed`, so
`agentState` is always `unknown` for agy. `lastProgressAt` is then bumped only by
the ack. If anyone sets `idleTimeoutMs` to, say, 5 minutes, every agy task that
takes longer than 5 minutes after its ack is reported `timed-out-idle` while
working normally. Document on the executor: for an agent kind herdr cannot
observe, `idleTimeoutMs` behaves as a second ceiling measured from the ack. Do
not set it for agy until a real progress signal exists.

### C10 — LOW — The observe-door purity test checks two files, not their import closure

`test/verbs/dispatch-observe.test.mjs:34` greps the source of `show-run.mjs`
and `watch.mjs`. Today their closure is `fs`, `path`, `paths.mjs`,
`visibility-session.mjs`, all clean, so the guarantee holds. It holds by luck of
the current import list, not by the test. A 12-line walker that follows relative
`import` specifiers from the two files and applies the same forbidden patterns to
every module reached would make the test say what the comment says.

### C11 — LOW — `reconcileRun` calls one `absent` reading "died"

The ladder requires three consecutive absences; `reconcileRun` accepts one. It is
self-correcting (a later result file flips it to `settled`) and the caller is
expected to have probed carefully, but the module never says so. Either take an
`absentStreak` and apply the same threshold, or state in the docstring that the
caller owns the streak.

---

## Clarity and design findings

### D1 — `runHerdrRound` is six things, and here are the seams

Lines `746-1076`. The seams are clean because each stage already ends by writing
one `note()`:

| Stage | Lines | Input → output |
|---|---|---|
| `prepareRound` | 757-773 | ctx → `{runDir, paths, agentName, briefText, note, fail}` |
| `establishConfinement` | 793-822 | ctx, note → `{sessionEnv, workerHomePath}` or throw |
| `openPane` | 824-885 | client, confinement → `paneId` (split, trust seed, `agent start`, `agentGet`) |
| `brief` | 893-916 | client, message → void or throw (first delivery) |
| `awaitReceipt` | 918-995 | client, paths, limits → `decision` (the poll loop, resend inside) |
| `settle` | 997-1076 | decision → return or throw (screen quote, pane fate, exit drain, home teardown) |

`awaitReceipt` as a named function is the one that most helps a cold reader,
because the ladder threading (`ladderPrior = decision`, `screen = null` reset,
`continue` after `needsScreen`) is currently interleaved with resend logic and
visibility notes. Nothing about behaviour changes; the function bodies move.

### D2 — Two confinement vocabularies: collapse into the field, not into executor entries

The declarative `confinement:{privateHome, isolatedSession, ownWorktree}` is the
one the config door's bypass invariant reads, and the one the adapter acts on.
`claude-bwrap`/`agy-bwrap` express confinement by existing. Collapse toward the
field: give the `*-bwrap` entries a `confinement` declaration (add a flag such
as `osSandbox: true` if bwrap is a distinct property), so one reader answers
"how confined is this executor" for every entry. Not this branch; it touches
entries this branch did not create.

### D3 — Six timeout knobs, three needed

| Knob | Keep? | Why |
|---|---|---|
| `timeoutMs` (ceiling) | yes | the only promise the caller makes |
| `idleTimeoutMs` | yes | the only staleness knob |
| `maxResends` | yes | a cap on typing, not a time |
| `readyTimeoutMs` | no → constant | herdr's own default, 30 s, measured |
| `promptTimeoutMs` | no → constant | must exceed herdr's 5 s stall detector; 20 s measured; a person has no reason to tune it |
| `resendAfterMs` | no | already defaults to `promptTimeoutMs`; drop the override |

Cost: none measured. The two constants stay overridable by a test through the
adapter's opts if a test needs them.

### D4 — `needsScreen`: inject the reader

The two-pass protocol is correct but a reader has to notice that `continue`
skips the sleep and re-runs every probe. Passing `readScreen: () => string` into
`evaluateLadder` removes `needsScreen`, the `screen` variable, and the
`continue` from the caller, and the ladder is still testable with a stub that
returns a string. The cost is that the ladder is no longer pure in the strict
sense. I would pay it; the purity is buying a protocol, not a proof.

### D5 — `visibility.json` mixes three vocabularies in one field

`VISIBILITY_STATES` holds lifecycle (`requested`…`reconciled`), outcomes
(`died`, `blocked`) and observer state (`detached`). `transport.mjs:1013-1017`
then writes `outcome` beside `status` and has to decide which outcomes are also
statuses. Two fields for one idea. Simplify: `status` = where in life;
`outcome` = how it ended; remove `died`/`blocked` from the status list.

### D6 — Where a cold reader loses the thread

1. `transport.mjs:757` — three possible run directories (`ctx.runDir`,
   `opts.runDir`, a tmpdir) and no statement of which one production uses.
   Answered by C1.
2. `transport.mjs:948` — `ladderPrior = decision`: the whole return value
   becomes next tick's prior. Name it `absentStreak` and pass only that.
3. `transport.mjs:955` — `continue` after `needsScreen`. Answered by D4.
4. `transport.mjs:817` — confinement failure is thrown as `errorClass:
   'invalid-config'`, so a runtime failure (server did not come up) is
   classified as a config error and the recovery matrix treats it as one.
5. `visibility-session.mjs:157` — a reader assumes `claimActor` is called
   somewhere and goes looking. Answered by C4.

---

## Does V0's shape make V1 cheap?

Mostly yes, with two things to pin now:

- `deliver()` is a closure over `message` inside `runHerdrRound`. V1's contact
  delivery needs the same `agent prompt --wait --until working` call with a
  different one-liner. Extract `deliverPointer(client, agentName, text,
  promptTimeoutMs)` as a named function now; it is the "one delivery path" the
  proposal says V1 reuses.
- Pin the meaning of `round` versus contact `seq`. The collector takes the
  highest `result-<n>` as the claim. If a V1 contact ever produced a
  `result-<n>`, it would replace the work's claim. The proposal's
  `ack-contact-<seq>` naming avoids this; write that rule into `brief.mjs` next
  to `briefPaths` so the collector's "highest round wins" cannot be surprised.

Nothing in V0 paints V1 into a corner.

---

## The four questions

**1. Implemented, or looks implemented?** The adapter, the ladder, the brief, the
herdr client, and the observe verbs are real and tested against a mock that
matches the real transport. Four pieces are implemented as functions with no
caller on the real path: `runDir` on `spawnWorker` (C1), `repoRoot` (C2), the
actor lease (C4), reconciliation (C5). Confinement works in the probe harness
and cannot work on a worktree dispatch (C2).

**2. Critical issues that should block?** C1 and C2 together mean the path
`prefer` was flipped onto has no visibility and cannot be confined. Either
revert the `prefer` flip until C1/C2 land, or land C1/C2 (both are small) before
pushing. C6 is a real kill sequence and is a three-line fix.

**3. Simple enough?** Close. Delete: the unused lease (C4), the second
round-scanner (C3), three timeout knobs (D3), the outcome-as-status overlap (D5).
Split: `runHerdrRound` at the six seams (D1). Inject: the screen reader (D4).

**4. Would a developer get it cold?** The module headers are unusually good;
`liveness.mjs` and `brief.mjs` explain themselves on first read. The place the
thread is lost is `runHerdrRound`'s poll loop, at `ladderPrior = decision` and
the `continue`, and at the three run-directory candidates. D1 and D4 fix the
first two; C1 fixes the third.

---

## Verdict

**Ship after named fixes.** The design claim is right and the code that carries
it is sound: I could not make the ladder kill a healthy worker, the mock is
faithful to the real envelope, and the failure taxonomy is real. But the branch
flipped `fgos-coding-implement` onto a path where the run directory is a tmpdir
the observe verbs cannot see and where confinement is structurally refused for
every worktree. Land C1, C2 and C6 before pushing (all three are under twenty
lines), decide C4 and C5 (delete or wire), and file D1/D3/D4 as the cleanup that
makes the next reader's first read a short one.
