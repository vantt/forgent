# Phase 00 report — Contract freeze and repo map

Cell: `confinement-authority-implementation--p00` (review-only, `code:review`; no Doer dispatched per this track's own `plan.md` phase-00 requirement R6 — no source edits in this phase).

## R1 — Default-support subset being implemented first

Copied from `docs/specs/confinement-authority.md` §9/§9.1 (spec is the source of truth; this is a pointer, not a restatement a later phase should trust over the spec itself):

- One backend driver `bwrap`, one backend instance `bwrap` in the machine registry.
- Two built-in policies: `host-write-denied` (workspace read-only, `run-output` + `private-home` write grants, `executor-credentials` read grant) and `workspace-write` (adds `workspace`/`workspace-git-metadata` read-write per readiness).
- Modes: `required` and `unconfined` only. `preferred` stays in the contract shape but default v1 rejects config that requests it.
- `hostRead`/`networkEgress`/`process` effective values stay `allow`/`allow`/`host` — requests for `deny`/`filtered`/`isolated` on these axes are `unsupported`, not silently accepted.
- Three executors migrate off hardcoded bwrap argv: `claude-bwrap`, `agy-bwrap`, `codex-bwrap` (names preserved for evidence-trail/capability-binding continuity), each referencing the singular `bwrap` backend instance.
- Legacy herdr session/home/worktree confinement (`establishConfinement` in `herdr-round.mjs`) is normalized into policy v1 shape but is explicitly allowed to remain `partial` maturity until P05 converges it.
- Every committed capability must declare a policy ID or `unconfined` before strict mode can flip (S2 gate).
- No network firewall, secret filtering, macOS/container/remote backend, or generic control-combination support in this subset.

## R2 — Call-site inventory

`rg -n "EXECUTOR_ADAPTERS|executeExecutorCli|spawnWorker|resolveExecutorCommand|confinement" src test` → 495 matches / 42 files. Table below covers every **production** (`src/**`) file with a real call/import/definition site (comment-only mentions noted separately); `test/**` is summarized by count since test call sites don't need to move behind the Authority (R3), only possibly need fixture updates once the door exists.

| File | Real call/def sites (line) | Classification | Notes |
|---|---|---|---|
| `src/runner/dispatch/transport.mjs` | `145` def `resolveExecutorCommand`, `154` adapter-registered check, `197` `confinement: executor.confinement` passthrough, `587-691` `cliSpawnAdapter` def, `691` `EXECUTOR_ADAPTERS` registry def | **Runtime dispatch** (registry + one adapter + resolver) | `EXECUTOR_ADAPTERS` registry and `cliSpawnAdapter` are exactly the adapter surface spec §5.2 rule 4 says only the Authority may call. `resolveExecutorCommand` is config resolution feeding the Authority, not itself an execute call — spec's "config validation" category, but it is the one place `confinement` currently gets attached/dropped (F-a). |
| `src/runner/dispatch/cli.mjs` | `273` def `spawnWorker`, `312` `EXECUTOR_ADAPTERS[adapter]` lookup + call (~346), `485` def `executeExecutorCli`, `682` second `EXECUTOR_ADAPTERS[adapter]` lookup (self-execute branch) | **Runtime dispatch (both production doors)** | These are the exact two direct-adapter call sites P02's gate ("`spawnWorker` and `executeExecutorCli` both call `executeThroughConfinement`") must close. Confirmed via `grep -n "EXECUTOR_ADAPTERS\["` — exactly these two lines in this file, none in `transport.mjs` itself. |
| `src/runner/dispatch.mjs` | `42,49,51` re-exports of `resolveExecutorCommand`/`spawnWorker`/`executeExecutorCli` | **Runtime dispatch (facade)** | This is the facade spec §5.1 says must "publish the runtime door" — callers already import through here, so the Authority swap-in is a facade-level change, not a call-site hunt at every import. |
| `src/runner/dispatch/assignment-runner.mjs` | `33` import, `924` call `executeExecutorCli(...)` | **Runtime dispatch (production caller, door #2)** | Coordination's own dispatch path — in `coordination-consumers` lease per `plan.md`. |
| `src/runner/loop.mjs` | `1005`, `1410` `await spawnWorker(item, config, wt.path, {...})` | **Runtime dispatch (production caller, door #1)** | The runner loop's two worker-spawn sites (main dispatch + a retry/second path). Not in any named lease bucket in `plan.md` — flagged below. |
| `src/runner/dispatch/config.mjs` | `35` import `EXECUTOR_ADAPTERS`, `330` `Object.keys(EXECUTOR_ADAPTERS)` in error message, `747-783` `executor.confinement` shape validation (legacy `privateHome`/`isolatedSession`/`ownWorktree`/`permissionMode:"bypass"` check) | **Config validation** | Reads adapter registry only for the allowed-adapter-name list in an error message — never obtains an execute handle. The `confinement` block here is exactly the legacy shape spec §6.2 says the loader must accept-and-normalize during migration. In `config-registry` lease. |
| `src/runner/dispatch/herdr-round.mjs` | `191-251` `establishConfinement(...)` def, `605-619` call site | **Legacy lifecycle helper (the "session hygiene" mechanism)** | This is exactly the left column of spec §2's two-unconnected-mechanisms table — 0/17 executors currently use it. P05's target, not P01-P04's. Not in any named `plan.md` lease bucket — flagged below. |
| `src/setup/registrations.mjs` | `3358-3416` confinement-bypass-pairing check fn, `3548` doctor check id `executor-confinement` | **Config validation (doctor check)** | Existing doctor check validates the legacy `confinement`+`permissionMode:bypass` pairing only; does not touch adapters. P01 extends doctor registrations here per plan.md goal 7. In `config-registry` lease. |
| `src/runner/dispatch/plan.mjs`, `prepare.mjs`, `resolve.mjs`, `result-ladder.mjs` | comment-only mentions of `resolveExecutorCommand`/`spawnWorker`/`executeExecutorCli` | **N/A (docs-in-code)** | No call/import in the grep window; `resolve.mjs` is still the resolver spec's own "Pointers" section names, worth reading in P01/P02 but has no confinement-specific call site today. |
| `src/runner/dispatch/worker-session-boot.mjs`, `goal-check.mjs`, `prompt-templates.mjs`, `worktree.mjs`, `src/runner/coordination/session-engine.mjs`, `assignment-policy.mjs` | comment-only | **N/A (docs-in-code)** | No behavior to reclassify; several are `spawnWorker`/`executeExecutorCli` caveats already anticipating this track (e.g. `session-engine.mjs:16,2987`). |

`test/**`: 18 files, ~250 matches, all either (a) import the real `spawnWorker`/`executeExecutorCli`/`EXECUTOR_ADAPTERS`/`resolveExecutorCommand` symbols to test them directly (`test/runner/dispatch.test.mjs`, `dispatch-production-call-sites.test.mjs`, `dispatch-executor-profile.test.mjs`, `codex-cli-glm-cli-live-executors.test.mjs`, `egress-governance.test.mjs`), (b) assert on `confinement` config shape (same file), or (c) use `spawnWorker`/`executeExecutorCli` only as a comment/doc-string landmark to describe which run-dir a fixture expects (`coordination-*.test.mjs`, `assignment-runresult.test.mjs`, `herdr-agent.test.mjs`, `goal-check.test.mjs`, `runner-loop.test.mjs`) or as an unrelated local helper name shadow (`coordination-store.test.mjs:493,549` — local test-only `spawnWorker` helper functions, not the real symbol). None require reclassification; `dispatch-production-call-sites.test.mjs` is the direct one-door regression suite P02-P04 must keep green (already in `dispatch-door` lease).

## R3 — Classification rationale

- **Runtime dispatch** = code that currently obtains and invokes an adapter execute handle (`EXECUTOR_ADAPTERS[x](...)`), or is a production caller of `spawnWorker`/`executeExecutorCli`. This is the set P02 must route through `executeThroughConfinement`.
- **Config validation** = reads adapter/confinement metadata for validation or error messages only, never executes. Stays as-is; may need to learn the new `ConfinementPolicyV1`/backend-registry shapes in P01 but does not move behind the Authority itself.
- **Legacy lifecycle helper** = `establishConfinement`/`herdr-round.mjs` — real enforcement today, but a second, disconnected mechanism per spec §2. Explicitly deferred to P05, not touched by P01-P04's one-door work.
- **Test helper** = exercises the above through their public exports; no reclassification needed, but fixtures will need updates once `spawnWorker`/`executeExecutorCli` internally call the Authority (mock adapter shape changes are P02/P04's concern, not P00's).

## R4 — Doc-index impact

| Doc | Touched by this track? | Why |
|---|---|---|
| `docs/architecture-map.md` | Yes, P01+ | Spec §13 risk 7 explicitly requires a new component/slice/contract row before `src/runner/dispatch/confinement/**` exists — must land no later than the phase that creates that directory (P01 per `plan.md`'s Product Gates). |
| `docs/specs/reading-map.md` | Only if a new top-level doc area is added | Confinement authority already has its own spec at `docs/specs/confinement-authority.md`; reading-map likely already points there. No action needed in P00; P07 (docs-closeout) re-verifies. |
| `docs/specs/distribution.md` | Yes, P01 | Spec §6.2.1 + risk 6: `confinementBackends` machine registry is new distribution/setup/doctor state and must be registered there before implementation, matching this repo's install/setup/doctor gate in `AGENTS.md`. |
| `docs/specs/runner.md` | Yes, P07 (possibly earlier if dispatch-vocabulary changes) | Runner-level behavior (one-door dispatch) is runner surface; closeout phase is the named owner in `plan.md`'s `docs-closeout` lease. |
| `docs/reference/dispatch-module-boundaries.md` | Yes, P07 | New `confinement/**` module boundary needs documenting once it exists; named in `docs-closeout` lease already. |

No doc edits are made in this phase (R6 — planning pointer only, confirmed: only this report and no other file changed).

## Risk classification

- **High**: the two `EXECUTOR_ADAPTERS[adapter]` direct-call sites (`cli.mjs:312`, `cli.mjs:682`) and the `cliSpawnAdapter`/`EXECUTOR_ADAPTERS` registry in `transport.mjs` — these are the fail-open surface (F-a/F-b/F-c/F-d) the whole track exists to close. Any P02 change here is the actual security-relevant edit; everything else is scaffolding around it.
- **Medium**: `herdr-round.mjs`'s `establishConfinement` — real enforcement today for 0/17 executors per spec §2, explicitly allowed to stay partial through P04 but must not regress silently; P05 is accountable, not earlier phases.
- **Low**: config validation in `config.mjs`/`registrations.mjs` — additive schema work, no behavior change to existing valid configs (per spec's legacy-shape-accepted invariant).

## File-lease cross-check against `plan.md`'s Shared-File Lease Rule

Two production call sites found in R2 do **not** fit cleanly into any of the five named lease buckets (`config-registry`, `dispatch-door`, `confinement-core`, `coordination-consumers`, `docs-closeout`):

1. **`src/runner/loop.mjs`** (`spawnWorker` caller, lines 1005/1410) and its own tests (`test/e2e/runner-loop.test.mjs`, `test/runner/goal-check.test.mjs` transitively) — this is door #1's production caller, symmetric to `assignment-runner.mjs` which *is* named in `coordination-consumers`. Recommend the Lead either (a) add `src/runner/loop.mjs` + `test/e2e/runner-loop.test.mjs` to `dispatch-door` before P02 opens, or (b) declare a new `runner-loop-consumer` lease. Flagging, not deciding — this is the Lead's call at P02 open, not P00's.
2. **`src/runner/dispatch/herdr-round.mjs`** (P05's target) — not present in any lease bucket at all. P05's own phase file should declare its lease explicitly when P05 opens; no action needed until then.

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

This already covers every production file found runtime-dispatch-classified above except `src/runner/loop.mjs` — its own coverage lives in `test/e2e/runner-loop.test.mjs`, outside the plan's stated `FOCUSED_DISPATCH_TEST`. Recommend whichever phase first edits `loop.mjs`'s `spawnWorker` call sites also runs `test/e2e/runner-loop.test.mjs` explicitly, since it's outside the named focused command.

## Unresolved for the Lead (not asking a person — routing signal only)

- Lease gap for `src/runner/loop.mjs` (see above) — resolve at P02 open, before that cell's `open.json` is composed.
