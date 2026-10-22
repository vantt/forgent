# Seat Binding phase 05: config schema, cells, `$comment`, fence marker, pure conversion

Branch `worktree-agent-abf95b28ba6601193` (track `seat-binding-wave` at `fb841105d` merged in). One code commit: `acd179d2b`. No runtime behaviour changes: the loader accepts new keys and nothing reads them yet.

## 1. What changed

| File | Change |
|---|---|
| `src/runner/dispatch/tier-cell.mjs` | `parseTierCell` also takes `{model, pool?, effort?}` (unknown key, empty model or pool, effort outside the vocabulary are errors); lists may mix forms; the parsed entry carries `effort` only when declared. `isExtendedTierCell` counts an object as extended. `REASONING_EFFORT_VALUES` now has its single definition here (leaf) and is re-exported unchanged from `config.mjs`. |
| `src/runner/dispatch/config.mjs` | Validates `runner.defaults.tier`, `runner.maxTier`, capability `tier` / `maxTier` / `roles` (five roles) / `personas` (Convention agent-name rule) / `seats` (Convention seat-id rule), each taste entry `{tier?, prefer?}`; `prefer` anywhere uses the existing shape check (empty list is an error) and must name a registered executor and invocation; `patterns.seatBinding` accepts exactly `{schema: 1}`. `stripConfigComments` removes `$comment` at every depth from the merged runner before validation (both loaders). New keys in the global layer are refused through the existing global sanitize hook, naming the project config. Global object cells are dropped like list cells. |
| `src/runner/dispatch/resolve.mjs`, `src/setup/model-pool-checks.mjs` | Parsed-cell doc and message wording only; both already read the parsed form. |
| `src/setup/seat-binding-conversion.mjs` (new) | `convertRunnerConfig(projectRunner, { globalRunner, registeredCapabilities, ladder, workflows? }) -> { runner, changes[], reports[] }`. Pure, deterministic, idempotent, project layer only, never overwrites a key the project declares. |
| `docs/architecture-manifest.json` | new module as `use-case`. |
| `test/fixtures/seat-binding-config/` | `forgentx-runner.json` (the tracked forgentX `.fgos/config.json` runner section, copied) and `global-runner.json` (real global runner section). |

Decisions worth knowing:
- The ladder is one runner-level `$comment` placed just before `modelPolicies` (next to `tierFallback` and `maxTier`). A `$comment` inside `modelPolicies` would be read as a family by raw readers (doctor rows read the file raw), so it is kept at runner level. `ladder` is an input (string or array of lines) because its one source (crate constant) does not exist before phase 06.
- Trigger: `rigorToTier` present in the project layer OR `patterns.seatBinding.schema` absent. The marker alone never counts as converted.
- Conversion order: bare verbs first (read as written), then capability rigor to tier, then delete `rigorToTier`.
- Added optional `workflows` input (loaded definitions from `discoverWorkflows`) because the unit rigor and guide floor lists need the workflow data; absent means those reports are not produced.
- A capability with `rigor: low` becomes tier `nano` (follows the stated rule); today at unit rigor `standard` it would run `standard`. No capability in forgentX has rigor low, so the equality test does not hit it.

## 2. Redaction of fixtures
No file the phase touched under `~/.fgos` or any workspace `.fgos`. The forgentX runner fixture is a copy of a git-tracked file; a grep for token, secret, password and `/home/` found nothing (the file lists credential store file names such as `auth.json`, no values). The global fixture dropped `llmAccounts`, `providers` and `executors` (account inventory, credential store paths, env wiring), which the conversion never reads. Field names kept: executor, timeoutMs, parallel, modelPolicies, rigorToTier, capabilities, confinement, coordination, patterns, generatedPaths.

## 3. Equality table: forgentX capability, today's `resolveSeatTier` at unit rigor `standard` (through `bind()`) vs converted

Today's side: each capability bound by `bind()` to one native agent with a cell at every tier, forgentX rigor and `maxTier` kept. Converted side: `cap.tier ?? defaults.tier`, under `cap.maxTier ?? maxTier`. Global `maxTier` is `flagship`. 39 of 39 equal (tier and ceiling), enforced by the test.

| capability | rigor | today tier | converted tier | today ceiling | converted ceiling |
|---|---|---|---|---|---|
| architecture:frame | high | flagship | flagship | flagship | flagship |
| architecture:shape | critical | frontier | frontier | frontier | frontier |
| architecture:critique | high | flagship | flagship | flagship | flagship |
| architecture:synthesize | critical | frontier | frontier | frontier | frontier |
| architecture:explain | critical | frontier | frontier | frontier | frontier |
| the other 34 (impact-analysis, pane-labeling, advise, execute, review, fgos-coding-implement, code:*, marketing:*, business:*, delphi:*, group-cognition:*, nominal-group:*, coding:*, docs:write) | none | standard | standard | flagship | flagship |

## 4. Conversion on the forgentX fixture (global fixture as the global layer, shipped workflows as `workflows`)

`changes[]` (13): set `runner.defaults.tier` standard; set `architecture:frame.tier` flagship; `architecture:shape` tier frontier + maxTier frontier; `architecture:critique.tier` flagship; `architecture:synthesize` tier frontier + maxTier frontier; `architecture:explain` tier frontier + maxTier frontier; delete `runner.rigorToTier`; set `runner.tierFallback.mini` (copy of nano: gemini, deepseek, z-ai, claude, openai); set `runner.$comment`; set `runner.patterns.seatBinding.schema` 1. No bare-verb copies were needed. Second run: `changes: []`, `reports: []`.

Full `reports[]` (12 rows, one JSON per line):

```
{"kind":"run-rigor-no-longer-sets-tier","capabilities":["advise","business:critique","business:frame","business:perspectives","business:plan","business:synthesize","code:debug","code:implement","code:refactor","code:review","code:test","coding:discover","coding:explore","coding:implement","coding:plan","coding:validate","delphi:propose","delphi:synthesize","docs:write","execute","fgos-coding-implement","group-cognition:critique","group-cognition:explore","group-cognition:synthesize","impact-analysis","marketing:publish","marketing:research","marketing:write","nominal-group:generate","nominal-group:rank","nominal-group:share","nominal-group:vote","pane-labeling","review"],"byRigor":{"low":{"was":"nano","now":"standard"},"high":{"was":"flagship","now":"standard"},"critical":{"was":"flagship","now":"standard"}}}
{"kind":"guide-rigor-floor","workflow":"architecture-advisory-reopen","rigorFloor":"standard","detail":"a floor on what a case may propose; it never set a tier"}
{"kind":"unit-rigor-no-longer-sets-tier","workflow":"architecture-advisory-reopen","unit":"synthesize-recommendation","capability":"architecture:synthesize","rigor":"high","was":"frontier","now":"frontier"}
{"kind":"guide-rigor-floor","workflow":"architecture-advisory","rigorFloor":"standard","detail":"a floor on what a case may propose; it never set a tier"}
{"kind":"unit-rigor-no-longer-sets-tier","workflow":"architecture-advisory","unit":"synthesize-recommendation","capability":"architecture:synthesize","rigor":"high","was":"frontier","now":"frontier"}
{"kind":"guide-rigor-floor","workflow":"business-discussion","rigorFloor":"standard","detail":"a floor on what a case may propose; it never set a tier"}
{"kind":"guide-rigor-floor","workflow":"council-lite","rigorFloor":"standard","detail":"a floor on what a case may propose; it never set a tier"}
{"kind":"guide-rigor-floor","workflow":"delphi","rigorFloor":"standard","detail":"a floor on what a case may propose; it never set a tier"}
{"kind":"guide-rigor-floor","workflow":"group-cognition","rigorFloor":"standard","detail":"a floor on what a case may propose; it never set a tier"}
{"kind":"guide-rigor-floor","workflow":"nominal-group","rigorFloor":"standard","detail":"a floor on what a case may propose; it never set a tier"}
{"kind":"guide-rigor-floor","workflow":"coding/feature","rigorFloor":"set-at-approval","detail":"a floor on what a case may propose; it never set a tier"}
{"kind":"guide-rigor-floor","workflow":"marketing/content-publish","rigorFloor":"standard","detail":"a floor on what a case may propose; it never set a tier"}
```

Reading: on forgentX only the run-level `--rigor` changes meaning (a `--rigor high` or `critical` stops raising the 34 capabilities with no rigor of their own; `--rigor low` stops lowering them). The two architecture-advisory `rigor: high` units already ran at frontier through capability rigor, so nothing changes there. On a workspace with no capability rigor (mdview-like, tested) the same units go from flagship to standard; that is the visible loss D2 accepts, listed in the conversion diff.

## 5. Verification (observed)
Env cleared of `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`, `FGOS_SESSION_ID`; `FGOS_HOST_BIN` set to the track host; `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` (what the full-suite door sets).

| Run | Result |
|---|---|
| `test/runner/tier-cell.test.mjs` alone | 24 tests, 24 pass |
| `test/runner/tier-fallback-config.test.mjs` alone | 16 tests, 16 pass |
| `test/setup/seat-binding-conversion.test.mjs` alone | 19 tests, 19 pass |
| `test/setup/model-pool-checks.test.mjs` alone | 8 tests, 8 pass |
| `test/architecture.test.mjs` alone (manifest change) | 29 tests, 29 pass |
| Group over `test/runner`, `test/setup`, `test/workflow` (241 files) | tests 4257, pass 4254, fail 0, cancelled 0, skipped 3 |

The brief's directory form (`node --test … test/runner test/setup test/workflow`) fails on Node 24 with MODULE_NOT_FOUND for the directory, so the group run passes the 241 discovered `*.test.mjs` files explicitly through one `node --test --test-concurrency=2` call. No file failed, so no per-file rerun was needed. A mutation check (disabling the capability-tier rule) made four conversion tests fail, so the equality and fixture tests do exercise the rule.

## 6. Notes for later phases
- A converted file still trips the doctor rows `runner-rigor-config` and `config-not-stale` (they require a project `rigorToTier` / the default key) and the loader still requires `rigorToTier` from the merged layers. That is by design here: files are converted only after the phase that retires those rows; the real fill-missing writer puts `rigorToTier` back into a converted file (tested), and converting again removes only that key.
- The doctor example row for `global-model-policies-portable` in `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:245` still quotes the old "list or model@pool" wording; the message now says "list, model@pool or object cells". Docs phase.
- The tier ladder text has no source yet; the setup caller must pass it.
- I did not edit `CHANGELOG.md` or `bin/fgos.mjs`.
