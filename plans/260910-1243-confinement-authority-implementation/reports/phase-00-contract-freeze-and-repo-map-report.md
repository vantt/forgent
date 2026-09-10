# Phase 00 report — Contract freeze and repo map

Cell: git branch `confinement-authority-implementation--p00` (review-only, `code:review`; no Doer dispatched per this track's own `plan.md` phase-00 requirement R6 — no source edits in this phase). Coordination session: `confinement-authority-implementation--p00b` — `--p00` (no `partialPolicy` declared at open) can never quorum-close for a Doer/Fixer-less review-only cell, since `doer`/`fixer` stay required SessionActors regardless of a request's own `actors[]`; `--p00b` reopens the same cell with `partialPolicy: {allowedOmissions: ["doer","fixer"]}` declared up front. `--p00`'s real reviewer/red-team findings (both `status: done`, obtained after fixing the herdr-spawn brief's status-vocabulary bug, commit `250a3edf`) are folded into this revision directly rather than replayed under `--p00b`.

## R1 — Default-support subset being implemented first

Copied from `docs/specs/confinement-authority.md` §9/§9.1 (spec is the source of truth; this is a pointer, not a restatement a later phase should trust over the spec itself):

- One backend driver `bwrap`, one backend instance `bwrap` in the machine registry.
- Two built-in policies: `host-write-denied` (workspace read-only, `run-output` + `private-home` write grants, `executor-credentials` read grant) and `workspace-write` (adds `workspace`/`workspace-git-metadata` read-write per readiness).
- Modes: `required` and `unconfined` only. `preferred` stays in the contract shape but default v1 rejects config that requests it.
- `hostRead`/`networkEgress`/`process` effective values stay `allow`/`allow`/`host` — requests for `deny`/`filtered`/`isolated` on these axes are `unsupported`, not silently accepted.
- Three executors migrate off hardcoded bwrap argv: `claude-bwrap`, `agy-bwrap`, `codex-bwrap` (names preserved for evidence-trail/capability-binding continuity), each referencing the singular `bwrap` backend instance.
- Legacy herdr session/home/worktree confinement (`establishConfinement` in `herdr-round.mjs`) is normalized into policy v1 shape but is explicitly allowed to remain `partial` maturity until P05 converges it.
- Every committed capability must declare a policy ID or `unconfined` before strict mode can flip (S2 gate).
- Invocation override: a request/config's own confinement override is rejected by default v1 — the contract shape stays, but the loader refuses an override rather than honoring it (spec §9.1). This is the precedence `resolve.mjs:398` already implements today, see R2.
- No network firewall, secret filtering, macOS/container/remote backend, or generic control-combination support in this subset.

## R2 — Call-site inventory

`rg -n "EXECUTOR_ADAPTERS|executeExecutorCli|spawnWorker|resolveExecutorCommand|confinement" src test` → 495 matches / 42 files. Table below covers every **production** (`src/**`) file with a real call/import/definition site (comment-only mentions noted separately); `test/**` is summarized by count since test call sites don't need to move behind the Authority (R3), only possibly need fixture updates once the door exists.

| File | Real call/def sites (line) | Classification | Notes |
|---|---|---|---|
| `src/runner/dispatch/transport.mjs` | `145` def `resolveExecutorCommand`, `154` adapter-registered check, `197` `confinement: executor.confinement` passthrough, `294` `cliSpawnAdapter` def, `526` `httpAdapter` def, `679` `herdrSpawnAdapter` def, `691` `EXECUTOR_ADAPTERS` registry def (all three keyed in) | **Runtime dispatch** (registry + all three adapters + resolver) | `EXECUTOR_ADAPTERS` registers **three** adapters — `cli-spawn` (`cliSpawnAdapter`), `http` (`httpAdapter`), `herdr-spawn` (`herdrSpawnAdapter`) — all exactly the adapter surface spec §5.2 rule 4 says only the Authority may call; 5 of 18 configured executors (`.fgos/config.json`) already use `herdr-spawn`, `http` has zero live producers today but is a registered, selectable adapter with no stated track owner (open question below). `resolveExecutorCommand` is config resolution feeding the Authority, not itself an execute call — spec's "config validation" category, but it is one of the two places `confinement` currently gets attached/dropped (F-a; the other is `resolve.mjs:398`, see below). |
| `src/runner/dispatch/cli.mjs` | `273` def `spawnWorker`, `312` `EXECUTOR_ADAPTERS[adapter]` lookup + call (~346), `485` def `executeExecutorCli`, `682` second `EXECUTOR_ADAPTERS[adapter]` lookup (self-execute branch) | **Runtime dispatch (both production doors)** | These are the exact two direct-adapter call sites P02's gate ("`spawnWorker` and `executeExecutorCli` both call `executeThroughConfinement`") must close. Confirmed via `grep -n "EXECUTOR_ADAPTERS\["` — exactly these two lines in this file, none in `transport.mjs` itself. |
| `src/runner/dispatch.mjs` | `42,49,51` re-exports of `resolveExecutorCommand`/`spawnWorker`/`executeExecutorCli`; `42` also re-exports `EXECUTOR_ADAPTERS`/`DEFAULT_ADAPTER` directly | **Runtime dispatch (facade)** | This is the facade spec §5.1 says must "publish the runtime door" — callers already import through here, so the Authority swap-in is a facade-level change, not a call-site hunt at every import. The `EXECUTOR_ADAPTERS`/`DEFAULT_ADAPTER` re-export is unrecorded risk: spec §5.1 says the facade must hide the adapter execute surface, and P02's "no direct adapter call" gate cannot be verified true while this facade still hands the registry itself to any importer. P02 must either stop re-exporting these two names or explicitly scope the gate to exclude config-only consumers. |
| `src/runner/dispatch/assignment-runner.mjs` | `33` import, `924` call `executeExecutorCli(...)` | **Runtime dispatch (production caller, door #2)** | Coordination's own dispatch path — in `coordination-consumers` lease per `plan.md`. |
| `src/runner/loop.mjs` | `1005`, `1410` `await spawnWorker(item, config, wt.path, {...})` | **Runtime dispatch (production caller, door #1)** | The runner loop's two worker-spawn sites (main dispatch + a retry/second path). Not in any named lease bucket in `plan.md` — flagged below. |
| `src/runner/dispatch/resolve.mjs` | `314` def `resolveExecutorConfig` (exported), `398` `confinement: cliInvocation.confinement ?? executorEntry.confinement` | **Runtime dispatch (config resolution feeding fail-open path F-b)** | Not comment-only: this is executable code, the second of the two places (with `transport.mjs:197`) `confinement` is assembled and handed toward an adapter today. Spec's F-b fail-open path names exactly this precedence. P04 (`phase-04-required-enforcement-and-executor-migration.md:43`) already leases this file; the correction here is classification only, not a lease change. |
| `src/runner/dispatch/config.mjs` | `35` import `EXECUTOR_ADAPTERS`, `330` `Object.keys(EXECUTOR_ADAPTERS)` in error message, `747-783` `executor.confinement` shape validation (legacy `privateHome`/`isolatedSession`/`ownWorktree`/`permissionMode:"bypass"` check) | **Config validation** | Reads adapter registry only for the allowed-adapter-name list in an error message — never obtains an execute handle. The `confinement` block here is exactly the legacy shape spec §6.2 says the loader must accept-and-normalize during migration. In `config-registry` lease. |
| `src/runner/dispatch/herdr-round.mjs` | `209` def `establishConfinement` (signature), `191-251` full function body, `618` call site inside `runHerdrRound` | **Legacy lifecycle helper (the "session hygiene" mechanism) — live, not dormant** | This is the left column of spec §2's two-unconnected-mechanisms table, and it is already wired into production today: `transport.mjs`'s `herdrSpawnAdapter` (`:679`, called for the 5/18 configured `herdr-spawn` executors) calls `runHerdrRound`, which calls `establishConfinement` at `:618` — this is real enforcement in the live dispatch path right now, not a dead function. P05 is the phase that converges it with the new Authority; P02-P04 must not silently regress it while building the new door alongside it (also relevant to F-d). Not present in any named `plan.md` lease bucket — flagged below. |
| `src/setup/registrations.mjs` | `3358-3416` confinement-bypass-pairing check fn, `3480` `checkHerdrExecutorKinds` (branches on `invocation.adapter !== 'herdr-spawn'`), `3548` doctor check id `executor-confinement` | **Config validation (doctor check)** | Existing doctor checks validate (a) the legacy `confinement`+`permissionMode:bypass` pairing and (b) herdr-adapter executor-kind shape; neither touches adapters directly. P01 extends doctor registrations here per plan.md goal 7. In `config-registry` lease. |
| `src/runner/dispatch/plan.mjs`, `prepare.mjs`, `result-ladder.mjs` | comment-only mentions of `resolveExecutorCommand`/`spawnWorker`/`executeExecutorCli` | **N/A (docs-in-code)** | No call/import in the grep window. |
| `src/runner/dispatch/worker-session-boot.mjs`, `goal-check.mjs`, `prompt-templates.mjs`, `worktree.mjs`, `src/runner/coordination/session-engine.mjs`, `assignment-policy.mjs` | comment-only | **N/A (docs-in-code)** | No behavior to reclassify; several are `spawnWorker`/`executeExecutorCli` caveats already anticipating this track (e.g. `session-engine.mjs:16,2987`). |

`test/**`: 24 files, ~368 matches (recount; the original 18/~250 figure undercounted), all either (a) import the real `spawnWorker`/`executeExecutorCli`/`EXECUTOR_ADAPTERS`/`resolveExecutorCommand` symbols to test them directly (`test/runner/dispatch.test.mjs`, `dispatch-production-call-sites.test.mjs`, `dispatch-executor-profile.test.mjs`, `codex-cli-glm-cli-live-executors.test.mjs`, `egress-governance.test.mjs`, `herdr-spawn-adapter.test.mjs` — imports `EXECUTOR_ADAPTERS`/`executeExecutorCli` directly at `:7,9` and guards `herdr-round.mjs`'s own imports at `:724`), (b) assert on `confinement` config shape (same files), or (c) use `spawnWorker`/`executeExecutorCli` only as a comment/doc-string landmark to describe which run-dir a fixture expects (`coordination-*.test.mjs`, `assignment-runresult.test.mjs`, `herdr-agent.test.mjs`, `goal-check.test.mjs`, `runner-loop.test.mjs`) or as an unrelated local helper name shadow (`coordination-store.test.mjs:493,549` — local test-only `spawnWorker` helper functions, not the real symbol). None require reclassification; `dispatch-production-call-sites.test.mjs` and `herdr-spawn-adapter.test.mjs` are the direct one-door regression suites P02-P05 must keep green — the former is in the `dispatch-door` lease, the latter is not named in any lease bucket and sits outside `FOCUSED_DISPATCH_TEST` (see below).

## R3 — Classification rationale

- **Runtime dispatch** = code that currently obtains and invokes an adapter execute handle (`EXECUTOR_ADAPTERS[x](...)`), or is a production caller of `spawnWorker`/`executeExecutorCli`. This is the set P02 must route through `executeThroughConfinement`.
- **Config validation** = reads adapter/confinement metadata for validation or error messages only, never executes. Stays as-is; may need to learn the new `ConfinementPolicyV1`/backend-registry shapes in P01 but does not move behind the Authority itself.
- **Legacy lifecycle helper** = `establishConfinement`/`herdr-round.mjs` — real enforcement today, but a second, disconnected mechanism per spec §2. Explicitly deferred to P05, not touched by P01-P04's one-door work.
- **Test helper** = exercises the above through their public exports; no reclassification needed, but fixtures will need updates once `spawnWorker`/`executeExecutorCli` internally call the Authority (mock adapter shape changes are P02/P04's concern, not P00's).

## R4 — Doc-index impact

| Doc | Touched by this track? | Why |
|---|---|---|
| `docs/architecture-map.md` | Yes, P01+ | Spec §13 risk 7 explicitly requires a new component/slice/contract row before `src/runner/dispatch/confinement/**` exists — must land no later than the phase that creates that directory (P01 per `plan.md`'s Product Gates). |
| `docs/specs/reading-map.md` | Yes | Verified, not guessed: `rg -n "confinement" docs/specs/reading-map.md` returns zero matches — the confinement spec is not pointed to from the reading map at all. Line 29's `src/runner/` entry also describes `EXECUTOR_ADAPTERS` in terms this track changes. P07 (docs-closeout) is the named owner; adding here so P07 does not have to rediscover it. |
| `docs/specs/distribution.md` | Yes, P01 | Spec §6.2.1 + risk 6: `confinementBackends` machine registry is new distribution/setup/doctor state and must be registered there before implementation, matching this repo's install/setup/doctor gate in `AGENTS.md`. |
| `docs/specs/runner.md` | Yes, P07 (possibly earlier if dispatch-vocabulary changes) | Runner-level behavior (one-door dispatch) is runner surface; closeout phase is the named owner in `plan.md`'s `docs-closeout` lease. |
| `docs/reference/dispatch-module-boundaries.md` | Yes, P07 | New `confinement/**` module boundary needs documenting once it exists; named in `docs-closeout` lease already. |

No doc edits are made in this phase (R6 — planning pointer only, confirmed: only this report and no other file changed).

## Risk classification

- **High**: the two `EXECUTOR_ADAPTERS[adapter]` direct-call sites (`cli.mjs:312`, `cli.mjs:682`), the `EXECUTOR_ADAPTERS` registry + all three adapters in `transport.mjs`, and `resolve.mjs:398`'s confinement-field assembly — these are the fail-open surface (F-a/F-b/F-c/F-d) the whole track exists to close. Any P02/P04 change here is the actual security-relevant edit; everything else is scaffolding around it.
- **Medium**: `herdr-round.mjs`'s `establishConfinement` — real, live enforcement today for the 5/18 configured executors that use `herdr-spawn` (not 0, see below), explicitly allowed to stay partial through P04 but must not regress silently while P02-P04 build the new door beside it; P05 is accountable for convergence, not earlier phases. `dispatch.mjs`'s facade re-export of `EXECUTOR_ADAPTERS`/`DEFAULT_ADAPTER` is also medium — it does not itself execute anything, but it is an unrecorded gap in the "one door" claim P02 must close or explicitly scope around.
- **Low**: config validation in `config.mjs`/`registrations.mjs` — additive schema work, no behavior change to existing valid configs (per spec's legacy-shape-accepted invariant).

**Correction to the spec-inherited "0/17 executors" framing** (spec §2, `confinement-authority.md:59`): the live `.fgos/config.json` has **18** configured executors — 11 `cli-spawn`, 5 `herdr-spawn`, 2 other/unspecified adapter — and **0 of the 18 declare the legacy `confinement` config block** described in `config.mjs:747-783`. That "0 declaring the legacy block" part of the spec's claim holds. But the 5 `herdr-spawn` executors DO get real confinement enforcement today via `establishConfinement` (see the `herdr-round.mjs` row above) — the spec's own "0/17" phrasing, read as "0 executors have any confinement today," is not accurate, and later phases should not inherit that stale denominator or the stronger reading of the claim.

## File-lease cross-check against `plan.md`'s Shared-File Lease Rule

Two production call sites found in R2 do **not** fit cleanly into any of the five named lease buckets (`config-registry`, `dispatch-door`, `confinement-core`, `coordination-consumers`, `docs-closeout`):

1. **`src/runner/loop.mjs`** (`spawnWorker` caller, lines 1005/1410) and its own tests (`test/e2e/runner-loop.test.mjs`, `test/runner/goal-check.test.mjs` transitively) — this is door #1's production caller, symmetric to `assignment-runner.mjs` which *is* named in `coordination-consumers`. Recommend the Lead either (a) add `src/runner/loop.mjs` + `test/e2e/runner-loop.test.mjs` to `dispatch-door` before P02 opens, or (b) declare a new `runner-loop-consumer` lease. Flagging, not deciding — this is the Lead's call at P02 open, not P00's.
2. **`src/runner/dispatch/herdr-round.mjs`** — already leased at `phase-05-herdr-and-legacy-convergence.md:33` (and its test at `:36`), confirmed by reading that phase file directly. No gap at the plan level; P02-P04 should still avoid touching it since it is P05's own lease, not P00's or an earlier phase's to resolve.
3. **`docs/specs/distribution.md`** appears in both the `config-registry` (`plan.md:112`) and `docs-closeout` (`plan.md:140`) lease buckets. Not a conflict in practice under `MAX_PARALLEL_CELLS: 1`, but worth the Lead's awareness before any future parallel-cell decision touches either P01 or P07.

## Open question for the Lead (routing signal, not asking a person)

Is `http`/`httpAdapter` in scope for this track's one-door subset? It is registered in `EXECUTOR_ADAPTERS` (`transport.mjs:526`), selectable by config, `locus: remote` per spec §5.2, and has zero live producers in the current `.fgos/config.json` — but spec §5.2 rule 4 reads as applying to every adapter unconditionally. Either P02 routes it through the Authority alongside `cli-spawn`/`herdr-spawn`, or the track should say in writing that a remote-locus adapter is out of scope for this default-support subset (R1). Not blocking P00; P02's own `open.json` should resolve it before that cell dispatches.

## Focused test list (from `plan.md` Execution Inputs)

```text
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/dispatch*.test.mjs' \
  'test/runner/assignment-*.test.mjs' \
  'test/runner/coordination*.test.mjs' \
  'test/verbs/coordination*.test.mjs' \
  'test/setup/*.test.mjs' \
  'test/architecture.test.mjs'
```

This already covers every production file found runtime-dispatch-classified above except two: `src/runner/loop.mjs`, whose own coverage lives in `test/e2e/runner-loop.test.mjs` and `test/runner/loop.test.mjs` (neither matched by any `FOCUSED_DISPATCH_TEST` glob), and `src/runner/dispatch/herdr-round.mjs`, covered by `test/runner/herdr-spawn-adapter.test.mjs` (also unmatched). Recommend whichever phase first edits `loop.mjs`'s `spawnWorker` call sites (loop.mjs's own tests) or `herdr-round.mjs`'s confinement wiring (P05, `herdr-spawn-adapter.test.mjs`) runs its own extra suite explicitly, since both sit outside the plan's named focused command.

## Unresolved for the Lead (not asking a person — routing signal only)

- Lease gap for `src/runner/loop.mjs` (see above) — resolve at P02 open, before that cell's `open.json` is composed.
- `http`/`httpAdapter` scope decision (see above) — resolve at P02 open.
- `dispatch.mjs`'s `EXECUTOR_ADAPTERS`/`DEFAULT_ADAPTER` re-export (see above) — P02 either closes it or explicitly scopes its "no direct adapter call" gate around it.
