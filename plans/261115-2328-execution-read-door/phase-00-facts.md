# Phase 00: facts, census and prior art (done at planning time)

Status: done. Read on `origin/main` `8337d8788` and the S4 integration head `origin/rust-verb-migration-program/s4`
`2f490135f`, 2026-11-15. Every later phase re-checks the lines it edits before editing.

## F1. What `bind()` is today

- `src/runner/execution/bind.mjs` (607 lines; its own budget is 520, `docs/platform/runner/spec.md:58`). Exports:
  `BIND_CONTRACT_VERSION = 'v1alpha1'` :22, `bindingIdentity` :27, `agentCliMissingRefusal` :118,
  `accountQuarantineOf` :255, `askFor` :316, `bind` :567, `bindWorkSeat` :576, `explainSeat` :591.
- It already delegates every ranking decision to the Rust crate `fgos-seat-binding` through
  `seat-policy.mjs:73 seatBinding` -> `src/seat-binding/client.mjs:169 bindSeat` -> host `fgos internal seat-binding
  --protocol 1` (`apps/fgos/src/main.rs:161-166` -> `packages/seat-binding/rust/src/route.rs:28`). The crate is pure
  (`packages/seat-binding/rust/src/lib.rs:1-9`, `bind` :29): it takes `ask`, `config`, `peers`, `walk`, `accountView`,
  `launchView`, `now`.
- What Node still computes before the crate call (the part S5 moves):
  - launch view per executor (`executorFacts` :146-192): family (`provider-adapter.mjs:70 familyOf`), mechanism
    (`mechanism.mjs:81 decideExecutorDispatchMechanism`), invocations with credential-store CLI
    (`provider-capacity.mjs credentialStoreOf`), rendered effort levels (`provider-adapter.mjs renderedEffortLevels`),
    posture carrying (`confinement/policies.mjs:703 resolvePostureInvocation`, reads the machine backend registry and
    PATH), governance (`disallowedReason` :132), missing CLIs (PATH, `missingClisOf` :96);
  - account view (`accountViewOf` :211-247): declared accounts (`providerAccountInventory`) plus, only when the caller
    passes `accounts`, lease state read from the runtime dir (`readAccountStates`);
  - persona chain (`resolvePersona` :63-82, `capabilityPersonaOf`), effective rigor (`seat-resolver.mjs effectiveRigorOf`),
    override checks (tier names, effort, timeout), family-keyed config (`familyKeyed` :299), the binding and its
    provenance (`bindingOf` :463-554), the walk chain (`explainSeat` :591-607).
- Callers (non-test), from the census; tier from `docs/architecture-manifest.json` `tiers` (`runner/dispatch` and
  `runner/execution` are tier 5; `runner/*.mjs` tier 7; `setup` tier 9). Step owner in brackets:
  - `bind`: `dispatch/assignment-runner.mjs:315` [S6a], `runner/loop.mjs:1599` [S7], `execution/run.mjs:695,722`
    [S6a], `execution/dry-bind.mjs:35` [S6a], `setup/seat-binding-checks.mjs:61` [doctor row bridge:S6b];
  - `askFor`: `run.mjs:631`, `dry-bind.mjs:35` [S6a]; `bindWorkSeat`: `dispatch/plan.mjs:171,397` [S5 decide, S6a];
  - `explainSeat`: `execution/explain.mjs:61` [S5], `setup/blind-steps-proven-pools.mjs:71` [bridge:S6b];
  - `agentCliMissingRefusal`: `execution/unit-run-start.mjs:216` [S6a]; `accountQuarantineOf`:
    `execution/account-pin.mjs:47` [S6a]; `bindingIdentity`: `execution/account-rotation.mjs:60,65` [S6a].
  - `seatConfigDigestOf`: `dispatch/assignment-runner.mjs:309` [S6a] (replay digest of the config slice).
- Tests importing `bind.mjs`: 13 files (`test/runner/execution/{bind,bind-committed-config,explain,tier-fallback,
  account-rotation,account-pin,run-gate,seat-ledger}.test.mjs`, `test/runner/{tier-cell,dispatch-execute-effort}.test.mjs`,
  `test/setup/seat-binding-dry-bind.test.mjs`, `test/workflow/{unit-handoff-raise-door,core-workflow-seats}.test.mjs`).

## F2. `dispatch decide`, `dispatch explain`, `hook dispatch-decide`, `agents`, `tool`

- Routes: `dispatch`, `hook`, `agents` are `legacy-cli` in `packages/host-runtime/contracts/command-routes.json`;
  `hook` already has `native_subcommands: ["mailbox", "mailbox-sync"]`; `tool` has no route: `fgos tool` was
  retired by `bf1a44f8d` (2026-11-15, capability reads plan) and its answer moved into `dispatch decide --for`. **So
  the program row's "`tool` verb" is already gone; S5 ports the tool lookup that `decide` runs (`toolProvidersOf`),
  not a verb.** The two `doors` rows "tool lookup by capability" and "the old tool registry ... gone" exist.
- `dispatch decide`: arm `bin/fgos.mjs:2430-2443`; use case `src/runner/dispatch/decide.mjs:147 decideExecutorCli`,
  `:269 decideCommand`; decision `src/runner/dispatch/plan.mjs:504 compileDispatchPlan` (675-line module), purpose
  seat `plan.mjs:366 purposeSeatOf` -> `bindWorkSeat` (posture judged at launch, so decide never reads the backend
  registry). Compatibility alias `node src/runner/dispatch.mjs decide` (`src/runner/dispatch/cli.mjs:21,166`;
  named in `AGENTS.md` "Dispatch").
  - `--work`: `bin/fgos.mjs:2428` injects `resolveWorkForDispatch` (`src/runner/work-dispatch.mjs:279`), which reads the
    Work view (`listWork`) and `executorIdForWork` (`src/runner/work-compat.mjs:24`) over the Node-only domain registry
    (`DOMAINS`). Work is S7.
  - `--assignment`: reads `.fgos/assignments/<id>/assignment.json` (`decide.mjs:191-204`), the Dispatch record (S6a).
- `compileDispatchPlan` callers besides decide: `dispatch/assignment-runner.mjs:1215` [S6a; uses `.policy`, invocation
  adapter, confinement] and `runner/fanout-batch.mjs:75` [S7; uses `mechanism`, `executorId`]. `launchPinOf`:
  `assignment-runner.mjs:343,597,873,1244`. `purposeSeatOf`: `runner/work-dispatch.mjs:446` [S7].
- `dispatch explain`: arm `bin/fgos.mjs:2446-2453` (`session: { headless: true, herdrPresent: detectHerdrPresent() }`,
  `run.mjs:63`); use case `src/runner/execution/explain.mjs:58 explainCapability` (only caller the arm).
- `hook dispatch-decide`: `src/runner/hook.mjs:17` (in-process kinds), `:66` -> `src/runner/dispatch/hook.mjs:41
  decideDispatchHook`; registry `src/cli/command-registry.mjs:864-894`; host lane `apps/fgos/src/routing.rs:115-121`
  (`HookKind` serves `mailbox`, `mailbox-sync` only; test `routing.rs:591` asserts `dispatch-decide` is Legacy).
  Wired as PreToolUse `Agent|Task` -> `${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos hook dispatch-decide`
  (`.claude/settings.json:86-90`; render `src/setup/agent-hooks.mjs:135,210`, moved to Rust by S4 phase 01).
- `agents list`: arm `bin/fgos.mjs:3484-3490`; `src/runner/agent-listing.mjs:88 listAgents` over
  `src/runner/agent-definitions.mjs` (tier dirs :39-51, lookup :211-227). Other callers of `agent-listing.mjs`:
  `src/setup/registrations.mjs:42,922,931` (row `agent-type-names-unique`, `bridge:S6a`). No Rust reads persona files.

## F3. The executor model: no contract exists

- Prior-art search: `git log --all -S` finds no commit for `dispatch_decide`, `decide_mechanism`, `DispatchDecide`,
  `executor_model`, `ExecutorModel`, `bind_seat`, `lookup_executor`, `agents_list`; no deleted Rust file under
  `apps/`/`packages/` matches dispatch, executor, bind or agent listing. **There was never a Rust dispatch, bind,
  executor model or agent listing.**
- The executor entry is defined only by `core/config-schema/runner.schema.yaml` (`executors` :31, entry :748, `kind`
  :751, `providerModel` :759, `command` :798, `supports` :845, `invocations` :877) and RUL65 (`kind` agent/tool,
  `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:95`). The derived facts (family, mechanism, credential
  store, effort levels, posture carrying, governance) exist only as Node functions. `BIND_CONTRACT_VERSION` and the
  decide answer (`decide.mjs:215-240`: `mechanism`, `configured`, `reasonCodes`, `blockedReason`, `agentType`,
  `mcpTool`, `command`, `stale`, `providers`, `executorId`) are named in no contract document.
- Seat Binding's spec excludes these from its authority: "Seat Binding does not own: ... running the agent,
  transport, confinement ...; loading personas" (`docs/platform/seat-binding/spec.md:66-72`). `docs/platform/runner/spec.md:58`
  puts Execution Core flow in Node ("It is flow, not a decision, so it stays in Node"). **So the executor model is
  Execution's, has no contract, and phase 01 writes it.**
- Argv building from the executor entry (`transport.mjs resolveExecutorCommand`) is Node; `packages/agent-protocol`
  holds adapters, not the executor model.

## F4. Prior art, in order

- `dc65c1049` (2026-10-20) added `packages/seat-binding/rust` (policy, rank, tier, explain, model). `d08948c86`
  (2026-10-21) added the host route and `src/seat-binding/client.mjs` (fail closed, no JS fallback). `3133ed474`
  (2026-10-21) deleted `src/runner/dispatch/assignment-policy.mjs` (the JS policy; message body empty, intent in
  seat-binding spec :450-452, :94). `c79818ff2` left one walker; `a7b744311` moved the tier ladder to a contract;
  `5a33989fa` removed the one-shot config conversion (intended, stated). The ranking moved; the launch-view, account-view
  and walk-chain composition stayed in Node by design ("Node keeps placement, independence, spread, walk and lease",
  seat-binding spec :94). Nothing was removed by accident.
- Capability reads plan (landed `1c30f30f8`, change `0eba567d8`, 2026-11-15): every reader of `runner.capabilities`
  goes through `capability-config.mjs` or `bind()`; `doors` rows enforce it (`docs/architecture-manifest.json` rows
  ":667", ":680", ":695", ":705", ":721", ":737"); `fgos tool` retired (`bf1a44f8d`). S5 reuses these rows and moves
  their authority.
- `ad5142b8a` ("decide the lane in one module") is host routing, not dispatch.

## F5. The eight doctor rows labelled `bridge:S5` (S4 registry)

`packages/distribution/contracts/doctor-registry.v1.json` on the S4 head (95 rows; `inRust` lists the rows the host
judges). Registration lines on `origin/main`:

| id | registration | judge (file:line) | facts it reads |
|---|---|---|---|
| `runner-generated-paths` | `registrations.mjs:1051` | `checkRunnerGeneratedPathsConfig` :510 | `runner.generatedPaths`, `validateGeneratedPathsShape` (`dispatch/config.mjs:659`) |
| `tool-registry-configured` | :1202 | `checkToolRegistryConfigured` :965 | `toolProvidersOf` live probe |
| `agy-sub-homes-configured` | :1214 | `checkAgySubHomesConfigured` `src/setup/agy-permissions.mjs:245` | agy executors' sub-HOMEs, their `settings.json` |
| `capability-serves-valid` | :1942 | `checkCapabilityServesValid` :1916 | `capabilityServesOf` (`capability-config.mjs:105`) |
| `omp-natives-present` | :2329 | `checkOmpNativesPresent` `src/setup/omp-natives-checks.mjs:54` | omp executors; `omp --version`; natives dir |
| `executor-confinement` | :2447 | `checkExecutorConfinement` :2182 | `executors.*.permissionMode`, `confinement` |
| `invocation-git-write-grants` | :2461 | `checkInvocationGitWriteGrants` :2215 | executor and invocation `args` |
| `seat-binding-route` | :3755 | `checkSeatBindingRoute` :3734 | `resolveSeatBindingHost` (`client.mjs:43`), `tierLadder` (:173) |

All eight read the executor model or the capability section, so they belong with S5. S4 phase 07 deletes
`agy-permissions.mjs` and possibly `omp-natives-checks.mjs` (its phase file lines 31-33, 48-49): where those two bodies
live after S4 is a re-read item. The port recipe is S4's ("Port recipe", S4 `plan.md` lines 103-130): registry owner
flips from `bridge:S5` to `rust:<component>`, adapter file registers the row, Node body deleted, per-row parity on the
S4 fixtures (00 report section 4 lists volatile rows).

## F6. Capability rows (step 2 of the owner's 2026-11-14 decision, `docs/platform/vision.md:166-186`)

- `core/config-standard/runner.yaml:347-722` holds 42 keys: tool abilities 2 (`impact-analysis` 348, `pane-labeling`
  351); generic jobs 3 (`advise` 353, `execute` 366, `review` 378); business-named 34 (`fgos-coding-implement`, five
  `code:*`, three `marketing:*`, five `architecture:*`, five `business:*`, two `delphi:*`, three `group-cognition:*`,
  four `nominal-group:*`, five `coding:*`, `docs:write`); prefix wildcards 3 (`coding:*` 651, `code:*` 706,
  `marketing:*` 711). **37 = 34 business rows + 3 wildcards.**
- Fields of the 37 (dump of the file): every row has `prefer` except the wildcards; `tier` on 12; `rigor` on the five
  `architecture:*`; `maxTier: frontier` on `architecture:{shape,critique,synthesize}`; `seats.producer` on
  `architecture:{critique,synthesize}`; `roles.red-team.prefer` on `code:*` `[xai, claude, openai]` and `marketing:*`
  `[claude, openai]`; `confinement {mode: required, policy: host-write-denied}` on `code:review`, `code:debug`;
  `serves` on the five `code:*` concrete rows and `docs:write`. The 34 `prefer` lists fall into three shapes: writer
  order `gemini, deepseek, glm, claude, openai` (some pin `gemini#omp-herdr`), judgment order
  `claude, openai, gemini, xai, glm#pi-cli-bwrap`, reviewer pins `openai#codex-cli-bwrap, claude#claude-cli-bwrap`;
  plus five architecture-specific orders.
- Schema: `core/config-schema/runner.schema.yaml:36-40` (`capabilities`), `$defs.capability` :446-530
  (`additionalProperties: false`), `roles` :540, `personas` :556, `seats` :561 are `project-only`; `tier`/`maxTier`
  `project-only`. No top-level `runner.personas` or `runner.roles` exists.
- Crate: `packages/seat-binding/rust/src/model.rs:233-245` `CapabilityEntry {tier, maxTier, prefer, roles, personas,
  seats}`, `:224-231` `Scope {tier, prefer}`, `:269-280` `Config`; `policy.rs:24-35` entries (exact, then
  `<prefix>:*`), `resolve_tier` and `resolve_prefer` (seat > persona > role > workflow tier > entry). Precedence table:
  seat-binding spec section 6.3 (:200-226). The Node slice `bindingTasteOf` (`capability-config.mjs:126-148`) keeps
  `tier, maxTier, prefer, roles, personas, seats`.
- Persona rule (D-ADR0072, seat-binding spec :232, :445): persona files never carry `tier`/`prefer`; guard
  `src/runner/agent-definitions.mjs:233-240 personaModelTasteProblem` refuses only `tier` and `prefer` and its message
  points at `capabilities.<cap>.personas.<name>`.
- Consumers that require a row today: `src/workflow/propose-validate.mjs:159`, `capability-plan-lint.mjs:499` refuse
  unregistered names; doctor `workflow-capabilities-configured` (`registrations.mjs:1903`, `bridge:S6b`) fails a
  Workflow capability without an entry (:1883-1885) and warns without `prefer` (:1896). `capability-serves-valid`
  compares `serves` sets (:1916-1942).
- Users of business names outside the config: council workflows (below); `domains/marketing/workflows/content-publish.yaml`
  (`marketing:research|write|publish`); coding skills and shared docs (`core/skills/_shared/{capability-catalog,
  capability-matching,planning-capability-awareness,executor-dispatch-fallback}.md`, `core/skills/fgos-run/SKILL.md`,
  `domains/coding/skills/fgos-coding-planning/SKILL.md`, `domains/coding/slice-kinds.yaml`), Work dispatch candidates
  (`work-compat.mjs:38-54`: `code:implement`, phase, step; `work-dispatch.mjs` `coding:discover`).
- Live project config of this repo (`.fgos/config.yaml:94,112`) carries `roles.red-team` under `code:*` and
  `marketing:*`: removing per-capability `roles` from the schema without a migration would refuse this file.

## F7. Councils and the domain move

- `core/workflows/` holds seven council workflows: `architecture-advisory.yaml`, `architecture-advisory-reopen.yaml`,
  `business-discussion.yaml`, `council-lite.yaml`, `delphi.yaml`, `group-cognition.yaml`, `nominal-group.yaml`; they
  use the 19 `architecture|business|delphi|group-cognition|nominal-group` capabilities.
- `src/workflow/loader.mjs:25-37 workflowDirs()` already walks every domain's `workflowsDir` (`domainCatalog()`), so a
  council in `domains/<d>/workflows/` is found with no loader change; it gains `owningDomain` (persona lookup adds the
  domain tier, core stays visible, `agent-definitions.mjs:211-227`). `src/util/domain-compile.mjs:25-40` embeds domain
  workflows into `domains/<d>/compiled.json` (regenerate). A domain needs no `registry.yaml`
  (`domain-compile.mjs:24-26`). Domains today: `coding`, `marketing`.
- Workflow units already declare `rigor?` and seats declare `tier?` (seat-binding spec 6.1 :172;
  `architecture-advisory.yaml:39` seat `tier: frontier`, :67 `rigor: high`), so the rows' `tier`/`rigor` can move into
  the workflows with no schema change.
- No plan, backlog row or branch exists for the move (rg over `docs/backlog.md`, `plans/*/plan.md`, `git branch -r`).
  The persona `advisor` (`architecture-advisory.yaml:27,89`) resolves in no agent directory today: unchanged by S5,
  recorded for the move phase.
- **Conclusion (D8):** the move has no code prerequisite and the rows' removal needs it (or the workflows would lose
  their tier and rigor), so it belongs in S5, landing before the rows go; it need not come before S5.

## F8. Rust building blocks already present

- Config: `fgos-config` reads the merged config in process (`packages/config/rust/src/bundle.rs:19,24` embeds runner
  schema and standard); no typed runner struct; `machine.rs:255-270` reads `runner.providers` only.
- PATH lookup exists three times (`packages/config/rust/src/detect.rs:92`, `packages/run-supervisor/rust/src/attempt_step.rs:82`,
  `packages/git/rust/src/driver.rs:294`); the phase that needs it reuses one and names it (design principle 1).
- Herdr presence: Node `run.mjs:63 detectHerdrPresent` (`HERDR_ENV=1` and `HERDR_SOCKET_PATH` exists); Rust reads
  `HERDR_SOCKET_PATH` in `packages/terminal-control/rust/src/route.rs:249,505` only.
- YAML: `fgos-yaml-doc` (persona files are YAML). Global directory: the holder-lock home door (`home_for_state_root`).
- No Rust confinement backend-registry reader (`rg confinementBackends packages apps` finds only the census).

## F9. Collisions found

- S4 (COOK, integration `origin/rust-verb-migration-program/s4`, 49 commits ahead of main, phases 04, 05, 07, 10, 12
  still open): owns `src/setup/**`, `registrations.mjs`, `apps/fgos/src/wiring/doctor/**`, `doctor-registry.v1.json`,
  `doctor-bridge.mjs`, `apps/fgos/src/{main.rs,routing.rs}`, `catalog.rs`, `docs/architecture-manifest.json`,
  `docs/backlog.md`, `CHANGELOG.md`. S5 starts after S4 lands, so these are sequential, not parallel.
- MAIL CI shards (`origin/mail/ci-shards-p01` `403cc5f35`, `p02` `8e1021897`, OPC MERGE 22:42): `scripts/run-tests.mjs`,
  `scripts/lib/test-shards.mjs`, `scripts/merge-test-shards.mjs`, `.github/workflows/ci.yml`, `docs/reading-map.md`
  (the `test/` row), `test/scripts/*shards*`; shards are weighted by `test/suite-baseline.json` `fileCpu`.
- Program S1 (hook verdicts, not started): `apps/fgos/src/routing.rs` `HookKind`, `src/cli/command-registry.mjs` hook
  entry, `src/runner/hook.mjs`.
- Generated: mutation census, `command-routes.json`, `command-manifest.json`, `domains/<d>/compiled.json`,
  `test/suite-baseline.json`, `.agents/skills`/`plugins/fgOS/skills` renders (`npm run build:skills`).

## Re-read after S4 lands (named per phase)

1. `doctor-registry.v1.json`: ids and owners of the eight `bridge:S5` rows, `inRust`, `layers`; host `NativeOwner`. (11)
2. `apps/fgos/src/wiring/doctor/{mod.rs,bridge.rs}` adapter and bridge pattern; `doctor-bridge.mjs` and
   `doctor-bridge.v1.json` after S4 phase 10 adds `work-store-init`. (10, 11)
3. Where `agy-sub-homes-configured` and `omp-natives-present` bodies live after S4 phase 07. (11)
4. S4 "Port recipe" line numbers: `CATALOG` count (`catalog.rs`), `COMPOSITION_PROVIDERS` and registration block
   (`main.rs`), `NATIVE_SUBCOMMANDS` and `LENIENT_ROOT_VERBS` (`routing.rs`), `ARM_STATIC_IMPORTS`
   (`test/architecture.test.mjs`), `EXIT_OF` (`src/cli/verb-exit.mjs`), the shared presenter answer type (S4 D11). (09, 10)
5. The parity runner restore source (`test/rust-host/verb-parity.test.mjs` from `92671a21d^`, as S4 restored it) and
   S4's doctor fixtures. (10, 11)
6. S4's new `doors` rows ("doctor readiness registry", "Node rows bridge", "agent hook table", "retired Node S4 verb
   code") and their allowed lists. (11, 12)
7. `registrations.mjs` line numbers of the eight rows and of `workflow-capabilities-configured`. (05, 11)
8. Route counts at S4 close (S4 expects 78 selectors: 60 legacy, 18 native). (10, 12)
