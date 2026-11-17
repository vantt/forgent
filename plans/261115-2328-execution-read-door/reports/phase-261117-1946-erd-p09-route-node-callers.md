# Phase 09 report: route protocol 2 and the Node callers

Branch `execution-read-door/p09`, base `origin/main` `d5628950f`, `origin/main` merged before the last push.
Worktree `/home/vantt/projects/forgent-worktrees/erd-p09`, Cargo target `erd-p09-target`.

## What changed

- **Host route (`apps/fgos/src/wiring/seat_binding.rs`).** `fgos internal seat-binding <op> --protocol 2`, the protocol
  checked before the operation (an old client gets `host-version-mismatch` whatever it asks). Operations `bind`,
  `explain`, `plan`, `preflight`, `digest`, `ladder`; every request but `ladder` carries the `runner` section it is decided
  under, so the route reads no config. Answers: `result: ok` with the body, `result: failed` with `failure: {name, code?,
  message}` (a decision the request cannot make, rethrown by the client as RunnerConfigError / RangeError / named
  Error), `result: error` for a fault of the call. The route stamps `bindingInput.hostVersion` on every binding (bind,
  explain walk, plan seat).
  - `Machine`: PATH through `fgos_process::spawn::resolve_program` (no second walker; a path with a separator is judged
    by its executable bit), `session.pathEnv` when given, else `PATH`; herdr presence from `session.herdrPresent` when the
    request states it, else `HERDR_ENV=1` and an existing `HERDR_SOCKET_PATH`; home through `fgos_config::machine::home_dir`
    (an empty home is `None`); the backend registry from `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH` else
    `<global dir>/confinement-backends.json`, read no-follow (`open_beneath`) under a 1 MiB cap, a missing, invalid or
    foreign document carries nothing.
  - `ToolProbe`: `present` through the same PATH door, `scan_target_exists`, `index_commit` reading `<scan>/meta.json`
    no-follow under the cap, `head` through `fgos-git` (`GitDriver` at the holder-lock state root; a Git port that cannot
    answer reads as an unresolved HEAD, not a repository as not a repository).
  - Non-unix has no no-follow open: a link is refused by its own metadata before a capped read.
  - `packages/seat-binding/rust/src/route.rs` and its `pub mod` are deleted (its tests moved into the wiring module);
    `apps/fgos/Cargo.toml` gains `fgos-execution` (one `Cargo.lock` line).
- **Crate (`fgos-execution`).** `BoundSeat` carries the whole binding; `purpose_seat_answer` gives the purpose door's
  answer in `purposeSeatOf`'s shape (the `plan` op). `preflight` now keys family spellings before reading the pin's
  pool, as the bind does (decision below).
- **Node client (`src/seat-binding/client.mjs`).** `PROTOCOL = 2`; `bind`, `explain`, `plan`, `preflight`, `digest`,
  `tierLadder`; same fail-closed rules and host trust; an older host's `usage` (unknown op) or `host-version-mismatch`
  answer maps to `host-version-mismatch`.
- **Facade (`src/runner/execution/bind.mjs`, 627 -> about 170 lines).** `bind`, `explainSeat` (one call for the whole walk),
  `bindWorkSeat`, `askFor`, `bindingIdentity`, `agentCliMissingRefusal` and `accountQuarantineOf` (both `preflight`,
  keeping their `pre-admission` timing in their callers), `seatConfigDigestOf` (`digest`), `purposeSeatFromHost`
  (`plan`). It sends the ask, the runner snapshot, the session (with `pathEnv`), the walk and, with `ctx.accounts`, the
  lease read (`readAccountStateOverlay`, the adapter phase 06 added). The herdr-first default-invocation override is
  gone with the rest of the Node bind (V2). `seat-policy.mjs` is deleted; the replay check calls `digest`.
- **Dispatch (`plan.mjs`).** The purpose selector asks the route's `plan` op; the executor-id, assignment and Work-hint
  selectors stay in Node and spawn nothing new (their seat binds as before, one `bind` call through `bindWorkSeat`).
  `purposeSeatOf` stays as the declared Node twin for those selectors; `mechanism.mjs` stays (D7).
- **Vectors.** The four `decided` marks are gone (Node now answers the rule, re-recorded with no expect change) and the
  `decided` mechanism with them (helper `DECIDED_RULE`/`decidedProblem`, the script's branch, the contract doc text).
  New vector: "preflight: a pin written with a family alias is judged on the pool set the bind ranks, where the alias is
  keyed to its family". 38 bind vectors added for retired Node cases (below); 129 bind vectors, 348 executor-model.
- **Parity runner.** `test/rust-host/verb-parity.test.mjs` restored from `9772db47d^`; it reads every
  `parity-cases/*.cases.mjs` file, so phases 10 and 11 add a table file and never edit the runner. No table yet.
- **Smaller.** `capabilityPersonaOf` (its one caller was the Node bind) is deleted; the seat-binding spec pointers name
  the protocol 2 route and the facade; the `seat-binding-route` doctor row text says protocol 2; the manifest drops
  `seat-policy.mjs`.

## Decision taken here: `preflight` keys the runner too

Before, `preflight` read `modelPolicies` as written while the bind keys family spellings first, so a pin written under
an alias (`codex/work` with cells under `codex:`) was judged quarantined on a pool the bind never ranks. Now both read
one pool set: such a pin is not judged by preflight and the bind treats it as another pool (refused in strict mode).
One reading of the runner (design principle 7); vector named above.

## Retired test -> owner now

| Retired test | Owner now |
|---|---|
| `test/runner/execution/seat-policy.test.mjs` (slice, digest) | `seatConfig` vectors of `bind.v1.json` (`golden_bind.rs`); route wiring of `digest` in `test/seat-binding/client.test.mjs` |
| `seat-policy.test.mjs` (stage-1 answer cache) | behaviour removed with `seat-policy.mjs` |
| `test/seat-binding/golden-cases.helper.mjs` and the protocol 1 client cases | `test/seat-binding/client.test.mjs` protocol 2 cases; the crate's own golden test still owns the seat-binding contract |
| `capability-config.test.mjs` persona asserts | persona vectors of `bind.v1.json` |
| `bind.test.mjs`, 38 decision cases (all but the two `askFor` cases) | one named vector each; full table in the subagent table below |
| `bind-committed-config.test.mjs` 5 ranking cases, `tier-fallback.test.mjs` 3, `explain.test.mjs` 5, `tier-cell.test.mjs` 4, `dispatch-execute-effort.test.mjs` 2 | named vectors of `bind.v1.json` |
| `tier-fallback.test.mjs` "explaining a seat with the fallback walk off" | behaviour removed (`explainSeat` has no `chain` option: one call answers the walk) |
| `bind.test.mjs` architecture guard | `test/architecture.test.mjs` tier rule (`src/runner/execution/` tier 5, `src/state/` 7) |

Per case (recorded new vectors were checked against the retired assertion; no existing vector changed):

| File | Retired case | Owner now (vector of `bind.v1.json`; NEW = added here) |
|---|---|---|
| bind | herdr producer, bare entry, takes the herdr transport | bind: inside herdr the herdr invocation runs |
| bind | capability prefer naming an invocation is a hard pin | bind: inside herdr an invocation pin on the cli transport is kept |
| bind | herdr invocation that cannot carry the posture leaves cli | bind: inside herdr a herdr invocation that cannot carry the posture leaves the cli one |
| bind | without herdr the prefer invocation is kept | bind: a prefer pin in the capability is kept |
| bind | human override pinning an invocation not moved to herdr | NEW bind: inside herdr an override invocation pin is not moved to herdr |
| bind | read-only posture (no writes / readOnly) | bind: a seat with no writes is read-only; bind: a read-only seat posture is read-only though the unit writes |
| bind | bind half of the independence case | bind: a hard independence from an executor moves the seat to another family; bind: a hard independence no family satisfies is refused |
| bind | reviewed unit tier: bound tier and source | bind: a workflow recommendation is the tier when nothing raises it |
| bind | governance rejects a disallowed provider | bind: a disallowed provider is passed over |
| bind | headless refusal with no candidate | bind: a headless seat with nothing configured is refused as headless |
| bind | in-process for a native agent | bind: an agent the session runs natively binds in process |
| bind | blind role never in-process, refused by name | NEW bind: a blind seat is never bound in process and is refused by name when nothing else is left; NEW bind: a blind seat with nothing configured outside a headless session is refused |
| bind | blind skips in-process for out-of-process | NEW bind: a blind seat skips an in process candidate for an out of process one; NEW bind: without blind the in process candidate listed first binds |
| bind | plain cli invocation recorded | NEW bind: with no invocation named the cli invocation that can carry the posture is recorded, not an unconfined one declared first |
| bind | herdr recorded inside herdr; herdr-only executor | bind: inside herdr the herdr invocation runs; NEW bind: an executor with only a herdr invocation is refused outside herdr; NEW ... binds inside herdr |
| bind | no invocation able to carry posture | bind: without a confinement backend a writing seat cannot be confined and is refused |
| bind | spread: first unused family | bind: a soft independence spreads seats over families; NEW bind: a soft independence with no seat bound yet records that spread was asked; NEW bind: a soft independence leaves the one family no listed seat uses |
| bind | spread: family reached through another executor | NEW bind: a family the same provider reaches through another executor counts as used for a soft independence |
| bind | family named once whatever spelling | NEW bind: an executor that declares its family under another spelling binds with the cell of the family and names the family once; NEW bind: a hard independence is not met by another spelling of the same family |
| bind | modelPolicies cell under another spelling | bind: a modelPolicies cell written under another spelling of the family is found |
| bind | unit without prefer | NEW bind: a unit with an empty prefer binds as one with none |
| bind | fallbackFrom and skipped provenance | bind: after the first candidate fails the walk takes the next family; ... next entry of the same family; bind: a lease conflict binds the same candidate again and says so; bind: an account rotation keeps the candidate and records the account; NEW bind: a family with no cell at the tier is skipped and recorded |
| bind | persona unit before capability | bind: the unit persona comes before the capability default |
| bind | persona override before unit | NEW bind: an override persona comes before the unit persona |
| bind | locked persona refusals and agreement | bind: a unit persona other than the locked one is refused; bind: an override persona other than the locked one is refused; NEW bind: a unit persona equal to the locked one binds |
| bind | run timeout override / unit / none / ceiling | bind: an override run timeout is checked and recorded; bind: the unit run timeout is used when no override names one; NEW bind: an override run timeout comes before the unit run timeout; NEW bind: an override run timeout above the ceiling is refused |
| bind | bare executor in unit prefer takes herdr | NEW bind: inside herdr a bare executor in the unit prefer takes its herdr invocation; NEW bind: inside herdr a unit prefer that names a cli invocation keeps it |
| bind | tier above global maxTier lowered | bind: a runner-wide maxTier caps a capability tier |
| bind | skills-unavailable | NEW bind: a producer seat asked for skills no executor declares is refused naming them |
| bind | executor with no supports.skills; unit without skills | bind: a producer seat is asked for the unit skills |
| bind | debate seats never in-process, not asked for skills | bind: a forced out-of-process checker is not asked for the unit skills |
| bind | effort not declared / not rendered | NEW bind: an effort the executor does not declare is refused naming what it renders; NEW bind: a cell effort no launch of the CLI can render refuses the seat |
| bind | account the lease takes | bind: a disabled account is passed over; bind: without lease state the bind ranks the config alone |
| bind | no account without a login store | NEW bind: an account that holds no login store for the CLI the launch reads is never named |
| bind | lease state: quarantine, held account, dead login, probe failed | bind: a quarantined account is passed over for the next account of the pool; bind: the account an assignment holds stays its account; bind: when every account of a pool is out one whose lock fgOS guessed is liftable; NEW bind: when every account of a pool is out and none can be lifted the seat is refused by name; NEW bind: the account another assignment holds does not bind this one |
| bind | replay after quarantine | bind: without lease state the bind ranks the config alone |
| bind | capability pins an unconfined invocation | NEW bind: a capability that pins an invocation with no confinement backend is refused, never swapped for another invocation |
| bind-committed-config | Workflow capability with no prefer pool takes the tier list | bind: a producer seat whose capability names nothing runs at the default tier on the first fallback family; bind: a prefix capability entry gives the tier; bind: a tierFallback list written under another spelling of the family is found |
| bind-committed-config | reviewer order applies to a reviewer seat | bind: the role table orders executors for every capability |
| bind-committed-config | no tier list: refused | bind: a headless seat with nothing configured is refused as headless |
| bind-committed-config | same family and model in herdr and headless | bind: inside herdr the herdr invocation runs |
| bind-committed-config | execute binds the CLIs the machine has | bind: a machine with no agent CLI is refused by name; NEW bind: a machine with only claude installed binds claude; NEW bind: a machine with only agy installed binds gemini through agy |
| tier-fallback | executor model no fallthrough for a missing cell | NEW bind: the model of the executor is no fallthrough for a family with no cell at the tier |
| tier-fallback | walk state is the earlier bindings | bind: after the first candidate fails the walk takes the next family; NEW bind: a seat whose every candidate was tried has nothing left and is refused; explain: a capability with a prefer order lists its candidates, cell, walk and accounts per pool |
| explain | entry that runs, entries that follow, pools | explain: a capability with a prefer order lists its candidates, cell, walk and accounts per pool |
| explain | why an entry is out | explain: an invalid account inventory is a problem of the pool |
| explain | no store for an invocation that declares none | NEW explain: an invocation that declares no login store names none |
| explain | accounts per pool with what keeps one from running | explain: a capability inside herdr names the herdr invocation; NEW explain: a disabled account is listed with what keeps it from running |
| explain | refusal instead of a binding | explain: a refused capability shows the refusal and the explanation |
| tier-cell | a global cell reaches the binding | bind: after the first cell entry fails the walk takes the next entry of the same family |
| tier-cell | entry whose pool has no account skipped | NEW bind: a cell entry whose pool has no account is skipped for the next entry served by the family pool |
| tier-cell | entry whose pool nothing can pay for | NEW bind: a cell entry served by a pool with no account gives its family no candidate |
| tier-cell | object cell effort reaches the binding | NEW bind: a cell with an effort binds with that effort as the promise of the cell |
| tier-cell | object cell model like a string cell | NEW bind: an object cell with only a model binds like a string cell |
| dispatch-execute-effort | reasoningEffort override and its source | bind: an override effort the invocation renders is used |
| dispatch-execute-effort | effort outside the vocabulary or not declared | bind: an override effort that is no effort is refused; NEW bind: an effort the executor does not declare is refused naming what it renders |

Kept in Node (not bind decisions): the two `askFor` cases; the committed-config data cases (every capability binds
runnable, labels bind, login-store shapes); the committed walk-stays-in-tier case; explain-agrees-with-bind on the
committed config; the tier-cell parser and config-loading cases; the effort flag wiring and render helpers.

## Measurement (requirement 7)

This repository's committed runner (about 20 KB request), release host, `node` facade through a counting host wrapper.
"Before" is counted from the code on `d5628950f` (`seat-policy.mjs` one `bindSeat` per bind; `explainSeat` one call per
walk step; pre-admission, digest in process).

| Path | Host calls before | Host calls after | Host time per call (p50 / p95) |
|---|---|---|---|
| bind one seat (`fgos run` seat, workflow seat) | 1 | 1 | 7.2 / 9.0 ms |
| explain a seat and its walk (2 steps here) | 3 (1 + one per step) | 1 | 4.7 / 12.5 ms |
| run start pre-admission, no pin | 0 | 1 | 5.0 / 7.3 ms |
| run start pre-admission, one pinned account | 0 | 2 (one per check) | 5.0 / 7.3 ms each |
| replay digest | 0 | 1 | 4.7 / 6.7 ms |
| dispatch `--for` (purpose) | 0 to 2 (bind only when a prefer pool, then the policy bind) | 1, plus the policy bind when the purpose names an executor | 6.8 / 9.4 ms |
| dispatch `--needs-soul` alone | 0 | 0 | - |
| dispatch executor id / Work hint / assignment (bind-free selectors) | 1 (policy bind) | 1 (unchanged, fan-out unchanged) | 7.2 / 9.0 ms |

Node wall time per facade call through the wrapper is 35-45 ms here (it includes two `date` forks of the wrapper and
the JSON of a 20 KB config); S4's spec figure for the protocol 1 bind exec was 3.7 ms p50 on a release host, the bind op
now costs about 7 ms because the whole bind (launch and account view) runs in the host instead of Node.

End to end on the dev host: `npm run fgos:dev -- dispatch explain --for code:review` answers through `explainSeat`
(one call); `npm run fgos:dev -- doctor` row `seat-binding-dry-bind` binds 62 seats of 27 workflow units through the
facade, and `seat-binding-route` answers ladder at protocol 2.

## Gates

| Gate | Result |
|---|---|
| `cargo fmt --all --check` | clean |
| `cargo clippy -p fgos -p fgos-execution -p fgos-seat-binding --all-targets -- -D warnings` | clean |
| `cargo test -p fgos -p fgos-execution -p fgos-seat-binding` (host unit tests incl. 7 route tests, `cli_tests.rs`, goldens) | all green (fgos bin 334/0, golden_bind 129 vectors, golden_decide, golden_executor_model, golden_agents) |
| `cargo check` same crates, `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` | clean |
| `node scripts/executor-model-vectors.mjs --check` | 348 + 129 match |
| git-mutation-census, architecture, doc-health, check-decision-citation-drift | 1/0, 71/0, 8/0, 33/0 |
| `node scripts/git-one-door-scan.mjs --root .` | 0 undeclared |
| seat-binding client, route-doctor-check, executor-model-vectors twin | 18/0, 4/0, 3/0 |
| every test `rg -l "bind.mjs\|seat-policy\|seat-binding/client\|plan.mjs"` lists (bind, bind-committed-config, tier-fallback, explain, account-pin, account-rotation, run-gate, capability-config, tier-cell, dispatch-execute-effort, assignment-dispatch, dispatch, dispatch-plan-policy, dispatch-policy-baseline-snapshot, dispatch-governance-provider-denylist, dead-vocabulary-guard, dispatch-reconciliation-import-graph, registrations, checks-doctor-config, agent-cli-trust-check, capability-catalog-doctrine, seat-binding-dry-bind, visibility-checks, work-size-rigor) | all green (2, 5, 1, 1, 13, 18, 20, 13, 16, 13, 50, 216, 37, 24, 11, 10, 25, 54, 24, 12, 9, 25, 25, 6) |
| the `stubAgentCliDir` users (3 files left) | green, through `pathEnv` |
| `test/rust-host/verb-parity.test.mjs` | 1/0 (no table yet) |
| Not run | full `npm test`, `cargo test --workspace` (plan lead) |

## Anything left

- The parity runner has no table; with no integration branch (each phase lands on main), a table added by 10 or 11
  needs `FGOS_TEST_PARITY_BASE` in every suite run on main or fails; D14 assumed it never reaches main. Plan lead to
  decide how 10 and 11 run their tables.
- `--for` with a purpose that names an executor costs one more host call than before (the plan op, then the policy
  bind); only the Node `decide` (native in phase 10) asks it.
- Kept behaviour: `Machine::on_path` judges a directory named like a program as not startable (Node's bare-name lookup
  accepted any `X_OK` entry); Windows tries only `PATHEXT` (Node also tried the bare name when it had an extension).
- Landing: D16 (drain runs, no open mutating assignment) applies; an old payload meets protocol 2 by name.

## Unresolved questions

1. Parity tables on main (above).

## Proposed `## [Unreleased]` line

- Agent seats choose their invocation by one rule in every session: a generic form (`<cli>-cli`/`<cli>-herdr`) before a
  named one, the session's transport first, then declared order; inside herdr a generic cli invocation is no longer
  replaced by a named herdr one. A pin is kept.
