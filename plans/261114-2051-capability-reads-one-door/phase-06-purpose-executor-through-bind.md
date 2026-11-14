---
phase: 06
title: "One way to choose for a purpose: agent purposes through bind(), tool purposes through one probing tool lookup; the first-prefer chooser and the reverse prefer match are deleted"
status: pending
effort: 7h
depends_on: [01, 03]
parallel_with: [02, 04, 05]
---

# Phase 06 — Purpose to executor: bind() for agents, one tool lookup for tools

## Context

Big lead decision (2026-11-14, inside the owner's frame): one door for the whole system; a second executor
chooser is a worse violation than a field reader. Owner decisions 2026-11-14 22:4x (plan.md "Owner decisions"):
Q1 "one path" for tool purposes; Q2 and Q3 option A.

Facts behind Q1 (research branch `research/capability-executor-config-properties` 192085eec, re-verified here):
`fgos tool query --capability X` reads `executors.<tool>.for[0]` plus the local status overlay
(`src/state/tool-registry.mjs:93-115,279-287`); `fgos dispatch decide --for X` reads `capabilities.X.prefer[0]`
(`resolve.mjs:237-262`) and never checks presence. Live on fg-server2 they disagree: pane-labeling — decide
`unavailable` (the standard row has no `prefer`), tool query finds `herdr`; impact-analysis — decide `in-process`
(mcp handback), tool query `missing` (the overlay's last answer).

Read `plan.md` (Facts, Intended deltas, Owner decisions), `src/runner/dispatch/resolve.mjs:28-266`,
`src/runner/dispatch/plan.mjs:280-584`, `src/runner/dispatch/mechanism.mjs:50-95`, `src/runner/dispatch/decide.mjs:160-230`,
`src/runner/work-dispatch.mjs:440-520`, `src/runner/execution/bind.mjs:572-584` (`bindWorkSeat`),
`src/state/tool-registry.mjs` (whole file; phase 07 deletes it), `src/runner/paths.mjs:244-275` (`findExecutableOnPath`,
`isCommandAvailable`). Start when phase 03 is merged (same files).
Impact analysis (as phase 01) on `resolveExecutorAndOverrides`, `resolveExecutorConfig`,
`decideExecutorDispatchMechanism`, `compileDispatchPlan`, `resolveCapabilityDetailsFromHints`, `validateRunnerConfigShape`,
`workUnitFor` (the function holding `work-dispatch.mjs:445`). Expect HIGH: `fgos dispatch decide` and the
Agent/Task PreToolUse hook sit on this path; report the blast radius before editing.

## What exists today (traced)

`resolveExecutorAndOverrides(cfg, idOrPurpose)` (`resolve.mjs:226-266`) has four branches:
1. `executors[id]` -> that entry, `bindingSource: 'executor-id'` — a lookup of a named executor, chooses nothing. **Stays.**
2. no id and `cfg.executor` -> the default executor, `'default'` — a lookup. **Stays.**
3. id equals `'executor'`, `cfg.executor.command`, or its first invocation's command or id -> the default
   executor, `'default'` — a lookup by name. **Stays.**
4. `capabilities[id].prefer` present -> `normalizePreferCandidates(prefer)[0]`, `'capability.prefer'` — **the
   second chooser. Deleted.**

Callers and where the argument can be a purpose (a capability row name):

| Caller | Argument | Branch reached today |
|---|---|---|
| `plan.mjs:453` | `effectiveDispatchPolicy(...).executorId` (already `bind()`'s) | 1 |
| `plan.mjs:468` | `workHint.workExecutorId` (a Work step skill, e.g. `fgos-coding-implement`, a capability row) | 1 or 4 |
| `plan.mjs:476` | `--for <purpose>` | 4 (or 1 when the purpose is an executor id) |
| `plan.mjs:507` | positional `decide <name>` (may be a row name) or the id from 468/476 | 1, 3 or 4 |
| `mechanism.mjs:82` | `plan.mjs:498` (positional name, may be a row) and `bind.mjs:98,148` (real ids) | 1 or 4 |
| `resolve.mjs:274` (`resolveExecutorConfig`) | `transport.mjs:155` <- `assignment-runner.mjs:871` (`bind()`'s id), `work-dispatch.mjs:265` (`binding.executor`), `plan.mjs:327` (unconfigured work id), `plan.mjs:540` (id from 468/476/507) | 1-3, or 4 via 507 |
| `work-dispatch.mjs:445` | `executorIdForWork(item, stage)` (a step skill) | 1 or 4; its result feeds capability hints (447) and the unit's soft `prefer` (502) |

Readers of an executor's `for` (which capability a tool serves) today: `src/state/tool-registry.mjs:106` (`for[0]`
only), `src/runner/dispatch/resolve.mjs:57-63` (capability hints), `src/runner/dispatch/config.mjs:527` (load
validator: each entry is a declared capability), `src/setup/executor-profile-warnings.mjs:59-63` (doctor: an
agent executor declaring `for`; phase 07 moves it).

The reverse match (`resolve.mjs:66-71`) adds every capability whose raw `prefer` `===` the executor id; only a
string `prefer` can match; in this repo only `impact-analysis: prefer: gitnexus`, already covered by `gitnexus`'s `for`.

## Overlay facts (does the probe need stored state?)

- Cost: `probeTool` (`tool-registry.mjs:196-207`) is, for `cli`/`binary`, a PATH scan with `fs.accessSync` per
  directory; for `mcp`/`skill`, `fs.existsSync(scanTarget)`, one `meta.json` read and `resolveCommit({ name: 'HEAD' })`
  through the in-process native Git addon (`src/git/inspect.mjs:11-25`, no child process). `decide` is one CLI process
  that already loads the merged config; probing the one or two tools serving a purpose adds no process and no
  network. The phase report measures it: p50/p95 of `fgos dispatch decide --for impact-analysis --json` over 20 runs
  before and after, through the dev door; the budget is "no more than 10 ms added at p95".
- Staleness: computed at probe time from the tool's own `meta.json` `lastCommit` against live `HEAD`
  (`isIndexStale`, `tool-registry.mjs:170-190`); the overlay stores only the last answer and `checkedAt`. Nothing
  needs remembered state. The stored answer is only as fresh as the last `tool check`: on fg-server2 it dates from
  2026-11-09 (`gitnexus: missing`, `herdr: present`), and `decide` never reads it. Live today `.gitnexus` is absent
  from the main checkout, so after this phase `decide --for impact-analysis` answers `unavailable` here (was `in-process`).
- Conclusion: the overlay is not needed. Probe live; phase 07 deletes `tool check`, the overlay file entry and its
  reader/writer. If the measurement breaks the budget, stop and report to the big lead before phase 07 deletes
  anything (then `tool check` would stay as the overlay's only writer).

## Requirements

1. New module `src/runner/dispatch/tool-providers.mjs` (tier 5, infra; manifest row in this phase): the one way to
   ask which tool executors serve a capability. Exports exactly:
   - `toolProvidersOf(runnerConfig, { capability, repoRoot, pathEnv })` -> `[{ executorId, capability, status, mcpTool?, command? }]`
     for every `kind: 'tool'` executor, in insertion order, whose `for` contains the capability (every entry, not
     only `for[0]`; compared after `normalizeCapability`, the tool registry's kebab-case folding, moved here);
     `capability` omitted -> every tool executor once per served capability (the doctor's view). `status` is the
     live probe (moved from `probeTool`/`isIndexStale`, using `findExecutableOnPath` from `src/runner/paths.mjs`, the
     one PATH scanner; the copy in `tool-registry.mjs` dies in phase 07): `present`, `stale`, `missing`, or `unknown`
     (no probe declared: no invocation, or `mcp`/`skill` without `scanTarget`). `mcpTool` is the executor's `mcp`
     invocation `tools[capability]` (today's `mcpToolFor`, `plan.mjs:356-360`, moved here); `command` is its `cli`
     invocation command.
   - `forEntriesOf(executorEntry)` -> the raw `for` list of any executor (`[]` when absent): the one reader of `for`.
     Callers: the load validator (`config.mjs:527`, every executor kind) and the doctor warning about an agent
     executor declaring `for` (`executor-profile-warnings.mjs:59-63`, phase 07).
   - `servedCapabilitiesOf(executorEntry)` -> `forEntriesOf` for a `kind: 'tool'` executor, `[]` otherwise. Callers:
     `toolProvidersOf` and the capability hints (`resolve.mjs:57-63`).
   These three are the module's whole API.
2. `resolve.mjs`: replace `resolveExecutorAndOverrides` with `lookupExecutor(cfg, id)` = branches 1-3 only (same
   return shape, `configured: false` otherwise). Every caller in the table moves in this phase (L10):
   `mechanism.mjs:82`, `resolve.mjs:274`, `plan.mjs:453/468/476/507`, `work-dispatch.mjs:445`. Delete branch 4,
   its comment block (`resolve.mjs:196-224`; the D1/D5 narrative goes to the decision history in phase 08) and the
   unused `normalizePreferCandidates` import. Capability hints (57-63) read `servedCapabilitiesOf`.
3. Delete the reverse `prefer` match (`resolve.mjs:65-71`) (Q3 A).
4. New `purposeSeatOf(cfg, purpose, { repoRoot })` in `src/runner/dispatch/plan.mjs` (exported; `plan.mjs` already
   imports `bindWorkSeat`; `work-dispatch.mjs`, tier 7, may import tier 5). The one door from a purpose to an executor:
   1. `lookupExecutor(cfg, purpose)` configured -> that (a purpose that is an executor id names it; nothing chosen).
   2. `toolProvidersOf(cfg, { capability: purpose, repoRoot })` non-empty -> a tool purpose (Q1 "one path"); the
      row's `prefer` is not read. Answer from the first provider by status rank `present` > `stale` > `missing`/`unknown`
      (insertion order inside a rank):
      - `present` -> `mechanism: 'in-process'`, `executorId`, `mcpTool` (or `command` for a cli tool), reasonCode `tool.present`;
      - `stale` -> `mechanism: 'in-process'`, `stale: true`, same fields, reasonCode `tool.stale`;
      - `missing` or `unknown` -> `mechanism: 'unavailable'`, reasonCode `tool.missing` / `tool.unprobeable`, `configured: true`.
      Every answer also carries `providers: [{ executorId, status }]` (what `tool query` used to list).
   3. else, when the purpose's own row has a usable pool (`hasOwnPreferPool`, exact key, as branch 4 required an own
      `prefer`): `bindWorkSeat({ runnerConfig: cfg, unit: { id: purpose, capability: purpose } })` ->
      `{ executorId: binding.executor, executor, configured: true, bindingSource: 'seat-binding', invocationId: binding.invocation ?? undefined, binding }`;
      a refusal -> `{ configured: true, executorId: null, refused: { reason, detail } }` reported as
      `mechanism: 'unavailable'`, reasonCode `seat-binding.refused`, `blockedReason` (Q2 A).
   4. else unconfigured, exactly as today (no row, or a row without `prefer`: `selector.unregistered`, or native-first
      with `--needs-soul`; never a `tierFallback` executor). This keeps the Agent/Task PreToolUse hook's
      `decide --for <label> --needs-soul --has-live-task-access` answer `in-process`.
5. `compileDispatchPlan` takes `repoRoot` (from `decide.mjs`, which already resolves the root it loads the config
   from; `fanout-batch.mjs` and `assignment-runner.mjs` callers pass theirs or none — none means tool probes
   resolve `scanTarget` against `process.cwd()`, recorded in the report). The work (468), purpose (476) and positional
   (507) paths call `purposeSeatOf`; a `binding` goes to `policyForPlan` (tier, model and executor from the same
   `bind()`). A tool answer returns its plan directly (no policy, no governance resolution — as today's mcp handback).
   `mcpToolFor` moves into `tool-providers.mjs`.
6. `work-dispatch.mjs:445`: `purposeSeatOf(cfg, executorId, { repoRoot })`; hints take `resolvedExecutor` from it; the
   unit's soft `prefer` (502) is `binding.executor` when bound, or the looked-up executor id, as today.
7. `config.mjs:527` (load validator): read `for` through `forEntriesOf`. Error texts unchanged.
8. Harness (`compare-capability-reads.mjs`; this phase is its second and last writer): allowlist entries for the
   decided deltas (each names its plan.md delta row); probes: a purpose whose `prefer[0]` cannot run here (CLI absent
   from a fixture PATH), tool purposes with present/stale/missing/unprobeable providers, an executor with two `for`
   entries, a string `prefer` naming an agent executor, the PreToolUse label probe.

## Files

- Create: `src/runner/dispatch/tool-providers.mjs`, `test/runner/dispatch/tool-providers.test.mjs`
- Modify: `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/mechanism.mjs`,
  `src/runner/dispatch/decide.mjs` (pass `repoRoot`), `src/runner/dispatch/config.mjs` (line 527 only),
  `src/runner/work-dispatch.mjs`, `docs/architecture-manifest.json` (one file row, layer `infra`; tier from `src/runner/dispatch/` = 5),
  `plans/261114-2051-capability-reads-one-door/reports/equivalence/compare-capability-reads.mjs`
- Tests modified (owning files): `test/runner/dispatch.test.mjs` (decide wiring: one case per tool status, one bound
  purpose, one refused purpose, positional row name, work id), `test/runner/work-unit-for.test.mjs` (Work soft prefer),
  `test/runner/dispatch-plan-policy.test.mjs` (lookup cases).
- Delete: none here (`src/state/tool-registry.mjs` keeps working for `tool check/query` until phase 07 deletes both; the
  interim duplicate of `probeTool`/`normalizeCapability` lives only on the integration branch).

## Tests

- New owning proof `test/runner/dispatch/tool-providers.test.mjs` (why new: the module is new; it takes over cases
  from `test/state/tool-registry.test.mjs`, which phase 07 deletes and names this file as their owner):
  every `for` entry is read (an executor serving two capabilities answers both); spellings fold (`Impact Analysis`,
  `impact_analysis`); an agent executor's `for` is ignored; probe `cli` present/missing on a fixture PATH; `mcp`
  present, missing, and stale against a fixture repo whose `meta.json` `lastCommit` is behind `HEAD`; no probe ->
  `unknown`; `mcpTool` and `command` taken from the invocations; no capability -> every tool once per capability.
- Wiring (one case each in `test/runner/dispatch.test.mjs`): decide on a tool purpose for present (in-process +
  mcpTool), stale (in-process + `stale`), missing (unavailable); decide on an agent purpose answered by `bind()` when
  the first `prefer` entry's CLI is absent from the fixture PATH; a refused purpose is `unavailable` with the
  refusal; a purpose with no own pool stays unregistered and `--needs-soul` stays in-process; a string `prefer`
  naming an agent executor no longer makes that capability a hint candidate.
- Retired here: every assertion on `bindingSource: 'capability.prefer'` and on `resolveExecutorAndOverrides`'s purpose
  branch (`rg -n "capability\.prefer|resolveExecutorAndOverrides" test`), each naming its new owner (cases above) in
  the commit message; lookup cases move to `lookupExecutor` in the same file.
- Fixtures: purpose decides that bind need the agent CLIs the bound executor runs on the fixture PATH; reuse the
  existing fake-CLI helper (`rg -l "PATH" test/helpers`); no env switch or test-only branch.

## Gates

```
node scripts/run-tests.mjs test/runner/dispatch/tool-providers.test.mjs test/runner/dispatch.test.mjs \
  test/runner/dispatch-plan-policy.test.mjs test/runner/dispatch-policy-baseline-snapshot.test.mjs \
  test/runner/dispatch-executor-profile.test.mjs test/runner/egress-governance.test.mjs \
  test/runner/assignment-dispatch.test.mjs test/runner/assignment-provenance.test.mjs test/runner/work-unit-for.test.mjs \
  test/runner/spawn-worker.test.mjs test/runner/operation-choice.test.mjs test/runner/work-path-case-admission.test.mjs \
  test/state/work-size-rigor.test.mjs test/setup/capability-catalog-doctrine.test.mjs \
  test/runner/dispatch-config-patterns.test.mjs test/runner/dispatch-reconciliation-import-graph.test.mjs \
  test/runner/dispatch-confinement-p04.test.mjs test/runner/execution/bind.test.mjs test/architecture.test.mjs
node scripts/doc-health.mjs
node scripts/check-decision-citation-drift.mjs
npm run fgos:dev -- dispatch decide --for red-team --needs-soul --has-live-task-access --json   # in-process
npm run fgos:dev -- dispatch decide --for impact-analysis --json    # in-process + mcpTool, or stale/unavailable as the machine is
npm run fgos:dev -- dispatch decide --for pane-labeling --json      # in-process, herdr command (was unavailable)
```
Plus `rg -l "dispatch/resolve.mjs|dispatch/plan.mjs|dispatch/mechanism.mjs|dispatch/decide.mjs|work-dispatch.mjs|dispatch.mjs" test`.
Rust: not touched.

## Net size

src: −~60 (branch 4, reverse match, local `mcpToolFor`) +~110 (`tool-providers.mjs` ~80 moved/new, `purposeSeatOf` and
call sites ~30); tests: +~120 (new owning file, mostly moved cases), modified wiring cases.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| The Agent/Task PreToolUse hook starts refusing | M x H | no own pool and no tool provider -> unconfigured exactly as today; gate command; hook test if one exists (`rg -l "PreToolUse" test`) |
| Live probe slows `decide` | L x M | measured against a 10 ms p95 budget; stop before phase 07 if broken |
| Purpose decide now depends on CLIs, accounts and tool presence | H x M | decided (Q1, Q2); fixtures; harness probes |
| `repoRoot` missing for some `compileDispatchPlan` caller | M x M | default documented; harness and dispatch tests cover decide; report lists each caller's choice |
| Host exec per Work unit build (`bindWorkSeat`) | M x L | one exec, p95 ~4 ms (seat-binding spec §13) |

## Rollback

Revert the phase merge (plan.md Rollback); 07 and 08 must be reverted first if merged.

## Success criteria

`rg -n "resolveExecutorAndOverrides|capability\.prefer|function mcpToolFor" src bin` finds nothing;
`rg -n "\.for\b" src/runner/dispatch/resolve.mjs src/runner/dispatch/config.mjs` finds no executor `for` read;
decide answers for impact-analysis and pane-labeling match `toolProvidersOf`; probe timing within budget (report);
gates green; harness 0 failures outside the allowlist.
