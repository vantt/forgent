# Phase 06 report: purpose to executor through Seat Binding, tools through one live lookup

Branch `capability-reads-p06`, based on the integration branch at 3ec1a7812. Phase file:
`phase-06-purpose-executor-through-bind.md`. Owner decisions applied as given: Q1 one path (`for` on the tool executor is
the source), Q2 A (decide reports what `bind()` would run), Q3 A (the reverse `prefer` match is deleted).

## What changed

- `src/runner/dispatch/tool-providers.mjs` (new, tier 5): `toolProvidersOf(runnerConfig, { capability, repoRoot, pathEnv })`,
  `forEntriesOf(executor)`, `servedCapabilitiesOf(executor)`. It reads every `for` entry (compared kebab-folded), probes live
  (`cli`/`binary` on PATH through `findExecutableOnPath` of `src/runner/paths.mjs`; `mcp`/`skill` by `scanTarget`, `stale` when the
  tool's own `meta.json` `lastCommit` is behind `HEAD`; no probe declared is `unknown`), and takes `mcpTool`/`command` from the
  invocations. The load validator (`config.mjs`) and the capability hints (`resolve.mjs`) read `for` only through it.
- `src/runner/dispatch/resolve.mjs`: `resolveExecutorAndOverrides` is replaced by `lookupExecutor` (the three lookup branches, no
  chooser); the reverse `prefer` match and the `capability.prefer` branch are gone, with their comment block; the dead
  `realExecutorId`/`resolved.invocationId` traces in `resolveExecutorConfig` went with them (the cross-provider message now names
  the executor id it was asked about, which is the real one).
- `src/runner/dispatch/plan.mjs`: `purposeSeatOf(cfg, purpose, { repoRoot })` is the one door from a purpose to what serves it
  (registered executor, else tool providers, else `bindWorkSeat` when the row has its own pool, else unconfigured). The `--for`,
  work and positional paths of `compileDispatchPlan` call it; a binding goes on to `policyForPlan` and `launchPinOf`, so the tier,
  model, provenance and the pinned invocation come from the same `bind()` call. A tool answer returns its plan directly.
  `compileDispatchPlan` takes `repoRoot`. `mcpToolFor` is gone.
- `src/runner/dispatch/decide.mjs`: passes the root it loaded the config from; a tool answer carries `providers`, `mcpTool` or
  `command`, and `stale`; a refusal is `unavailable` with `blockedReason`.
- `src/runner/dispatch/mechanism.mjs`, `src/runner/work-dispatch.mjs`: call `lookupExecutor` / `purposeSeatOf`. The Work unit's
  soft `prefer` is the bound executor (or the looked-up id), none for a tool answer or a refusal. The no-executor message names
  "the `prefer` list of capability X" instead of spelling the config path (the old spelling matched the capability door's
  pattern; the spawn-worker test follows the new text).
- `docs/architecture-manifest.json`: file row for `tool-providers.mjs` (infra); the debt entries for `resolve.mjs` and
  `work-dispatch.mjs` are deleted in the same commit. Final row: allowed `src/runner/execution/capability-config.mjs`; debt
  `src/cli/command-registry.mjs`, `src/workflow/propose-validate.mjs` (not this phase's).
- Census (`packages/git/contracts/mutation-census.v1.json`) regenerated with `--write-census`, as the earlier phases did.

## Blast radius (before editing)

GitNexus is not reachable from this session and the tool registry is the thing this plan retires, so impact-analysis is
`inactive` here; the grep cross-check stood in for it. Callers of the changed symbols (`rg` over `src bin`):
`resolveExecutorAndOverrides` -> `plan.mjs` (4 sites), `mechanism.mjs`, `resolve.mjs` (2), `work-dispatch.mjs`;
`compileDispatchPlan` -> `decide.mjs`, `fanout-batch.mjs`, `assignment-runner.mjs`; `resolveExecutorConfig` -> `transport.mjs`,
`plan.mjs`, `work-dispatch.mjs`. HIGH by position (`fgos dispatch decide` and the Agent/Task hook sit on it); the hook case is
proved below.

## Stop condition: probe cost

The dev door cannot resolve 10 ms (the `npm run fgos:dev` wrapper took 5.7 to 10.8 s per run, cargo and staging), so the probe
was measured in a fresh process per run, 25 runs each, through the same modules the verb loads, over a fixture project whose
`impact-analysis` tool is missing / present / stale (the last two read `meta.json` and resolve `HEAD` through the git addon):

| tool state | probe alone, addon already loaded (decide has loaded it) | whole `decide --for impact-analysis` |
|---|---|---|
| missing | p50 0.24 ms, p95 0.27 ms | p50 28.9 ms, p95 30.1 ms |
| present | p50 3.27 ms, p95 3.44 ms | p50 31.3 ms, p95 33.2 ms |
| stale | p50 3.32 ms, p95 3.61 ms | p50 32.2 ms, p95 34.9 ms |

Added cost at p95 is at most 3.6 ms (a cold probe that must also load the git addon is 24.5 ms, but `decide` has already loaded
it for the root lookup, so that is not an added cost). Budget 10 ms: not exceeded; the overlay may go in phase 07. The live
repo answers in 0.3 ms (`.gitnexus` is absent).

## Equivalence (base 781537524 = cap-base, head = this branch, run `phase-06`)

0 failures, 0 notes. Digests: `reports/equivalence/phase-06.summary.json`. The harness gained: the purpose door asked through
`purposeSeatOf` at head and the first-`prefer` chooser at base; `dispatchPlan` with `repoRoot`; new questions `needsSoulPlan`
(the Agent/Task hook's question, incl. the label `red-team`, equal at both sides) and `purposeWithoutClis` (PATH holding none of
the agent CLIs, so `prefer[0]` cannot run); the `m-tools` input (tool purposes with a cli provider present and missing, an mcp
provider present, stale and missing, an unprobeable one, one executor serving two capabilities, a tool whose row also has a
`prefer`, an agent executor with an inert `for`); the `m-prefer` string `prefer` probe through `preferredByString`.
Allowlist entries, each claiming only what its value test shows:

| delta | claims | scope |
|---|---|---|
| `tool-purpose` (Q1) | head answers from a tool provider (`tool.*`) | questions `executorAndOverrides`, `purposeWithoutClis`, `dispatchPlan`, `needsSoulPlan` |
| `purpose-through-bind` (Q2) | head `pool` true (the name's own row declares `prefer`), base `bindingSource` `capability.prefer`, head from Seat Binding or its refusal | same four questions |
| `blank-prefer-is-no-pool` | base threw (blank text; a TypeError for `[]`), head leaves it unconfigured | input `m-prefer-blank`, names `pref:blank`, `pref:empty` |
| `string-prefer-reverse-match` (Q3) | a row names the asked executor as its only `prefer` | question `capabilityDetailsExecutor` |

What the live repo shows (input `repo`): `pane-labeling` base unregistered, head in-process with herdr's command (present);
`impact-analysis` base in-process (mcp hand-back), head `unavailable` (`tool.missing`: no `.gitnexus`); every pooled purpose
base `capability.prefer`, head `seat-binding` (or `agent-cli-missing` on the empty PATH, 472 names). `invalid-config` on all
37 names of `m-prefer-blank` is the whole-config refusal bind makes on a config with a blank `prefer`; base never checked.

## Gates

- Phase gate list (19 files, incl. `test/architecture.test.mjs`) plus the other tests importing a changed file (`rg -l` over
  `test`: 26 more, incl. `loop`, `e2e/synthetic-domain`, the CLI door tests) and `test/scripts/doc-health.test.mjs`: 1259 tests,
  1259 pass, 0 fail. (Bare `node scripts/doc-health.mjs` needs a host binary; its test passes.)
- `check-decision-citation-drift`: no new findings (57 baselined). `git-one-door-scan`: 0 undeclared sites.
- `rg -n "resolveExecutorAndOverrides|capability\.prefer|function mcpToolFor" src bin`: nothing. `rg -n "\.for\b"` over `resolve.mjs`
  and `config.mjs`: only `Symbol.for`.
- `fgos:dev dispatch decide`: `--for red-team --needs-soul --has-live-task-access` -> in-process; `--for impact-analysis` ->
  unavailable (`tool.missing`); `--for pane-labeling` -> in-process, command `herdr`, provider present.

## Deviations and things to decide

1. `decide <tool executor id> --for <purpose it serves>` keeps its old hand-back (in-process with `mcpTool`), now through
   `toolProvidersOf` instead of `mcpToolFor`; `decide <id>` alone and `decide --for <purpose>` are the two documented doors, so
   this combination has no test of its own; say if it should be dropped.
2. Q3 also removes the match the old code made by accident for a one-element `prefer` list of one bare name (it used the list as
   an object key). A project with `prefer: [agy]` loses that candidate too. Real shapes: none in the shipped standard or in this
   repo's config; other projects not checked.
3. A blank or empty `prefer` was an error (a thrown message, a TypeError for `[]`); it is now "no pool", which is what the phase
   file says (`hasOwnPreferPool`). The config validator still refuses a blank `prefer` at load.
4. A tool executor with no probe declared (no invocation, or `mcp`/`skill` without `scanTarget`) answers `unavailable`
   (`tool.unprobeable`), as the phase file says. This repo's `herdr` has a cli invocation in the machine's config, so it is
   present here; a project whose herdr declares none would see `unavailable`.
5. `fanout-batch.mjs` and `assignment-runner.mjs` pass no `repoRoot` (not in this phase's file list): a tool probe there resolves
   `scanTarget` against the process's working directory. Neither can reach a tool answer today (work ids and assignments name
   executors or pooled purposes).
6. Tests that used a `kind: tool` executor with a `command` as a stand-in for an agent now use `kind: agent`; tests whose
   purposes bind through Seat Binding give the config a tier cell for the executor's family and put the CLI on the fixture PATH
   (`seedStubAgentClis`). The snapshot test's `fgos-coding-implement` descriptor names the executor and invocation Seat Binding
   binds (`gemini`, `omp-herdr`), and its fact test asks `purposeSeatOf`.
7. The `dispatch-retired-doors` fixture now writes a baseline project config in `mkStore`, because the helper keeps executors
   in a process-wide machine file and a later test would read an earlier one's tool executor.
8. Docs not touched (not this phase's files; phase 08): `docs/reference/dispatch-module-boundaries.md`, the decision history of
   the dispatch spec (`docs/platform/runner/...`), `docs/explanation/capabilities-prefer-symmetry-removed.md` and
   `decide-for-prefer-fix-and-dispatchplan-minimal.md` still describe the first-`prefer` resolution; the D1/D5 narrative that
   lived in the deleted comment block goes to the decision history there.

## CHANGELOG line (for the big lead; not edited here)

Under `## [Unreleased]`: "`fgos dispatch decide --for <purpose>` names the executor Seat Binding would run (or `unavailable`
with the refusal) instead of the first `prefer` entry, and answers a purpose a tool serves from a live probe of the tool
(`providers`, `stale`, `command` in the answer): `impact-analysis` is `unavailable` where no `.gitnexus` index exists, and
`pane-labeling` is `in-process` where herdr is on PATH."

## Lessons

- A resolver that is also a chooser hides a second decision: the first `prefer` entry was read here and the real choice was made
  again later by Seat Binding; the two disagreed on any machine missing a CLI. One door means the lookup chooses nothing.
- Fixture helpers that keep state process-wide (the machine config file) turn a new field on an executor into a failure in a
  test that never wrote it; give every test a baseline config instead of trusting order.
- A fold in a name comparison (`tool:x` equals `tool-x`) needs fixtures whose executor ids and capability names do not coincide,
  or the first run reports a difference that is only the fixture.
- Measure a probe where it runs: the addon load (24 ms cold) is paid by the caller before the probe, so a probe benchmark in a
  cold process overstates the added cost by the whole addon load.

## Authority

- `purposeSeatOf` (`src/runner/dispatch/plan.mjs`): the one door from a purpose to an executor or a tool answer; the executor
  chosen for a pooled purpose is Seat Binding's (`bind()`), never read from `prefer` here.
- `toolProvidersOf`, `forEntriesOf`, `servedCapabilitiesOf` (`src/runner/dispatch/tool-providers.mjs`): the only reader of an
  executor's `for` and the only presence probe (PATH through `findExecutableOnPath`).
- `lookupExecutor` (`src/runner/dispatch/resolve.mjs`): the only registry lookup by executor id; it chooses nothing.
