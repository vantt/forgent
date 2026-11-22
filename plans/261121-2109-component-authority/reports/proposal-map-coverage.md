# Proposal map coverage (clause-by-clause)

Source: `docs/platform/proposals/component-authority-boundary-map.md` §6 (14 rows) and §7 (contract matrix).
Target: `packages/component-authority/model/components.json` and `contracts.json`.

## Method

- Split each Owns / Must-not-own cell on `,` and `;` (Dispatch owns hand-normalized because nested parentheses broke naive splits).
- Judge each clause against the matched model row `owns` / `mustNotOwn`; Dispatch also checks `dispatch-transport` and `seat-binding`.
- §7: a concrete relation is covered when some contract row links the ends via `provider` / `consumers`. Allowed/forbidden prose is not a model field.
- This report is evidence after the fill pass.

## §6 clause ledger (14 rows)

### 1. Work Lifecycle Engine

- Model id: `work-state` (status `live`, layer `domain`, tier 7)
- **Owns**
  - `Work identity` → `work-state.owns`
  - `status` → `work-state.owns`
  - `stage` → `work-state.owns`
  - `claim/return` → `work-state.owns`
  - `related refs` → `work-state.owns`
  - `context refs` → `work-state.owns`
  - `document refs` → `work-state.owns`
  - `questions` → `work-state.owns`
  - `human gates` → `work-state.owns`
  - `lifecycle verbs` → `work-state.owns`
  - `domain-agnostic Work event truth` → `work-state.owns`
- **Must not own**
  - `Agent runtime` → `work-state.mustNotOwn`
  - `Assignment membership` → `work-state.mustNotOwn`
  - `executor choice` → `work-state.mustNotOwn`
  - `evidence confidence` → `work-state.mustNotOwn`
  - `coding merge/worktree/technical approval` → `work-state.mustNotOwn`

### 2. Work Driver / Domain Workflow Interpreter

- Model id: `work-driver` (status `planned`, layer `use-case`, tier 6)
- **Owns**
  - `Ready-work selection` → `work-driver.owns`
  - `automation loop policy` → `work-driver.owns`
  - `declared Stage Operation choice` → `work-driver.owns`
  - `cross-flow routing` → `work-driver.owns`
  - `park/halt behavior` → `work-driver.owns`
  - `recovery/anti-loop around Work execution` → `work-driver.owns`
  - `invoking lifecycle verbs and dispatch surfaces` → `work-driver.owns`
- **Must not own**
  - `Domain workflow semantics` → `work-driver.mustNotOwn`
  - `lifecycle writes outside Work Lifecycle verbs` → `work-driver.mustNotOwn`
  - `dispatch target choice` → `work-driver.mustNotOwn`
  - `RunResult confidence` → `work-driver.mustNotOwn`
  - `coding repository isolation` → `work-driver.mustNotOwn`
  - `CoordinationSession progress` → `work-driver.mustNotOwn`

### 3. Agent Coordination Engine

- Model id: `agent-coordination-engine` (status `retired`, layer `use-case`, tier 5)
- **Owns**
  - `CoordinationSession manifest/events` → `agent-coordination-engine.owns`
  - `Assignment membership` → `agent-coordination-engine.owns`
  - `actor/topology/bounds` → `agent-coordination-engine.owns`
  - `session recovery` → `agent-coordination-engine.owns`
  - `session synthesis boundary` → `agent-coordination-engine.owns`
  - `Team Cognition invocation` → `agent-coordination-engine.owns`
  - `optional protocol/dynamic planning consumption` → `agent-coordination-engine.owns`
- **Must not own**
  - `Work stage/status/claim/return` → `agent-coordination-engine.mustNotOwn`
  - `declared Work operation selection` → `agent-coordination-engine.mustNotOwn`
  - `dispatch mechanism` → `agent-coordination-engine.mustNotOwn`
  - `provider/model choice` → `agent-coordination-engine.mustNotOwn`
  - `coding worktree/merge authority` → `agent-coordination-engine.mustNotOwn`

### 4. Team Cognition Engine

- Model id: `team-cognition-engine` (status `designed`, layer `use-case`, tier 5)
- **Owns**
  - `Typed deliberation interpretation` → `team-cognition-engine.owns`
  - `aggregation-method semantics` → `team-cognition-engine.owns`
  - `source/dissent/omission coverage validation` → `team-cognition-engine.owns`
  - `cognitive outcomes linked to immutable RunResult/artifact evidence` → `team-cognition-engine.owns`
- **Must not own**
  - `CoordinationSession terminal transitions` → `team-cognition-engine.mustNotOwn`
  - `context-grant authority` → `team-cognition-engine.mustNotOwn`
  - `Assignment dispatch` → `team-cognition-engine.mustNotOwn`
  - `RunResult confidence upgrades` → `team-cognition-engine.mustNotOwn`
  - `Work lifecycle` → `team-cognition-engine.mustNotOwn`
  - `chat/mailbox delivery` → `team-cognition-engine.mustNotOwn`
  - `protocol-specific RFC/NGT/Delphi control flow` → `team-cognition-engine.mustNotOwn`

### 5. Dispatch And Execution Engine

- Model id: `execution-core` (status `live`, layer `infra`, tier 5)
- Secondary rows: `dispatch-transport`, `seat-binding`
- **Owns**
  - `Assignment-to-DispatchPlan resolution` → `dispatch-transport.owns`
  - `executor/provider/model/tier/mechanism/adapter selection` → `seat-binding.owns`
  - `governance/egress` → `dispatch-transport.owns`
  - `Run creation` → `execution-core.owns`
  - `launch` → `dispatch-transport.owns`
  - `timeout` → `dispatch-transport.owns`
  - `cancellation` → `dispatch-transport.owns`
  - `retry attempt metadata` → `dispatch-transport.owns`
  - `in-process Run mechanism` → `execution-core.owns`
  - `exactly two routing identities (capability, executor-id) and related purpose/--for / job non-identity rules` → `seat-binding.owns`
- **Must not own**
  - `Semantic operation choice` → `execution-core.mustNotOwn`
  - `Work lifecycle` → `execution-core.mustNotOwn`
  - `evidence confidence` → `execution-core.mustNotOwn`
  - `coding merge/approval` → `execution-core.mustNotOwn`
- Deliberate: long "See the canonical Dispatch Control Plane doc…" pointer not copied into owns (docs live under agent-coordination; model keeps the authority clauses only).

### 6. Run Result Evaluator

- Model id: `run-result` (status `live`, layer `infra`, tier 5)
- **Owns**
  - `Worker result parsing` → `run-result.owns`
  - `evidence collection coordination` → `run-result.owns`
  - `artifact freshness/provenance checks` → `run-result.owns`
  - `confidence decision` → `run-result.owns`
  - `RunResult normalization` → `run-result.owns`
  - `failure classification for one Assignment Run` → `run-result.owns`
- **Must not own**
  - `Executor launch` → `run-result.mustNotOwn`
  - `provider choice` → `run-result.mustNotOwn`
  - `Work lifecycle` → `run-result.mustNotOwn`
  - `session completion policy` → `run-result.mustNotOwn`
  - `domain-specific evidence collection ownership` → `run-result.mustNotOwn`

### 7. Domain Registry And Definition Loader

- Model id: `domain-registry-loader` (status `live`, layer `infra`, tier 7)
- **Owns**
  - `General runtime definition registry and config loader for domains` → `domain-registry-loader.owns`
  - `workflows` → `domain-registry-loader.meaning` (supporting)
  - `workflow/stage/operation declarations` → `domain-registry-loader.owns`
  - `task-spec/skill references` → `domain-registry-loader.owns`
  - `roles` → `domain-registry-loader.owns`
  - `FlowDefinition validation/projection` → `domain-registry-loader.owns`
- **Must not own**
  - `Runtime session state` → `domain-registry-loader.mustNotOwn`
  - `dispatch target choice` → `domain-registry-loader.mustNotOwn`
  - `Work lifecycle writes` → `domain-registry-loader.mustNotOwn`
  - `evidence confidence` → `domain-registry-loader.mustNotOwn`
  - `setup/distribution config authority` → `domain-registry-loader.mustNotOwn`

### 8. Coding Domain Component

- Model id: `coding-domain` (status `live`, layer `domain`, tier 7)
- **Owns**
  - `Coding Domain Core plus product/design` → `coding-domain.owns`
  - `cook` → `coding-domain.owns`
  - `bugfix` → `coding-domain.owns`
  - `possible small-change policies` → `coding-domain.owns`
  - `repo scope` → `coding-domain.owns`
  - `footprint` → `coding-domain.owns`
  - `worktree/branch/isolation` → `coding-domain.owns`
  - `merge/catchup` → `coding-domain.owns`
  - `technical approval` → `coding-domain.owns`
  - `code verification doctrine` → `coding-domain.owns`
  - `coding evidence adapters` → `coding-domain.owns`
- **Must not own**
  - `Generic Work lifecycle` → `coding-domain.mustNotOwn`
  - `generic Agent Coordination runtime` → `coding-domain.mustNotOwn`
  - `direct executor launch` → `coding-domain.mustNotOwn`
  - `final confidence outside Run Result Evaluator` → `coding-domain.mustNotOwn`

### 9. Setup, Doctor, And Distribution Health

- Model id: `packaging-distribution` (status `live`, layer `infra`, tier 9)
- **Owns**
  - `Config defaults` → `packaging-distribution.owns`
  - `config merge` → `packaging-distribution.owns`
  - `global/project precedence` → `packaging-distribution.owns`
  - `doctor checks/fixes registry` → `packaging-distribution.owns`
  - `install/upgrade/distribution health` → `packaging-distribution.owns`
  - `required binaries/services/directories` → `packaging-distribution.owns`
- **Must not own**
  - `Domain behavior` → `packaging-distribution.mustNotOwn`
  - `lifecycle mutation` → `packaging-distribution.mustNotOwn`
  - `dispatch or evidence truth` → `packaging-distribution.mustNotOwn`

### 10. Host And Surface Layer

- Model id: `host-surface` (status `live`, layer `entry`, tier 9)
- **Owns**
  - `CLI/API/plugin/gateway/Herdr/webhook/chat entrypoints` → `host-surface.owns`
  - `auth` → `host-surface.owns`
  - `envelopes` → `host-surface.owns`
  - `visibility` → `host-surface.owns`
  - `process control` → `host-surface.owns`
  - `operator diagnostics` → `host-surface.owns`
- **Must not own**
  - `Work truth` → `host-surface.mustNotOwn`
  - `CoordinationSession truth` → `host-surface.mustNotOwn`
  - `dispatch governance` → `host-surface.mustNotOwn`
  - `evidence confidence` → `host-surface.mustNotOwn`

### 11. Group-Thinking Protocol Pack

- Model id: `group-thinking` (status `live`, layer `domain`, tier 7)
- Pack + skill share `group-thinking`.
- **Owns**
  - `Versioned` → `group-thinking.owns`
  - `data-first CoordinationProtocol definitions and public-contract request/renderer adapters for reusable group-thinking methods` → `group-thinking.owns`
- **Must not own**
  - `Session state` → `group-thinking.mustNotOwn`
  - `visibility legality` → `group-thinking.mustNotOwn`
  - `aggregation validity` → `group-thinking.mustNotOwn`
  - `terminal authority` → `group-thinking.mustNotOwn`
  - `dispatch` → `group-thinking.mustNotOwn`
  - `Work lifecycle` → `group-thinking.mustNotOwn`
  - `hidden protocol semantics in prompts/adapters` → `group-thinking.mustNotOwn`

### 12. fgos-group-thinking Skill

- Model id: `group-thinking` (status `live`, layer `domain`, tier 7)
- Pack + skill share `group-thinking`.
- **Owns**
  - `Selects an explicit registered protocol` → `group-thinking.owns`
  - `builds a public request` → `group-thinking.owns`
  - `launches/resumes through coordination surfaces` → `group-thinking.owns`
  - `renders public replay/evidence` → `group-thinking.owns`
- **Must not own**
  - `Group-thinking runtime logic` → `group-thinking.mustNotOwn`
  - `hidden actor/topology changes` → `group-thinking.mustNotOwn`
  - `context grants` → `group-thinking.mustNotOwn`
  - `aggregate validation` → `group-thinking.mustNotOwn`
  - `specialist authorization` → `group-thinking.mustNotOwn`
  - `Work/git mutation` → `group-thinking.mustNotOwn`

### 13. Learning, Knowledge, And Documentation Registry

- Model id: `learning-docs-registry` (status `live`, layer `domain`, tier 9)
- **Owns**
  - `Retrospective knowledge capture` → `learning-docs-registry.owns`
  - `doc slot/topic registry` → `learning-docs-registry.owns`
  - `projections` → `learning-docs-registry.owns`
  - `traces` → `learning-docs-registry.owns`
  - `end-user docs index` → `learning-docs-registry.owns`
  - `learning outputs` → `learning-docs-registry.owns`
- **Must not own**
  - `Work lifecycle` → `learning-docs-registry.mustNotOwn`
  - `Agent Coordination runtime` → `learning-docs-registry.mustNotOwn`
  - `RunResult confidence` → `learning-docs-registry.mustNotOwn`

### 14. Observe (Metrics & Friction)

- Model id: `observe` (status `live`, layer `infra`, tier 3)
- **Owns**
  - `Measurement and scorecard calculation across substrate entities (`run`` → `observe.owns`
  - ``session`` → `observe.owns`
  - ``executor`` → `observe.owns`
  - ``case`` → `observe.owns`
  - ``work`)` → `observe.owns`
  - `case lifecycle journal (`.fgos/observe/cases/`)` → `observe.owns`
  - `independent friction repository (`.fgos/observe/friction/`)` → `observe.owns`
  - `writer shards` → `observe.owns`
  - `store locks (`.fgos/observe/.lock`)` → `observe.owns`
  - `snapshots` → `observe.owns`
  - `declaring `ObservationSource` / `LegacyFrictionSource` traits` → `observe.owns`
- **Must not own**
  - `Work item status/stage mutation` → `observe.mustNotOwn`
  - `RunResult confidence truth` → `observe.mustNotOwn`
  - `Agent Coordination session lifecycle` → `observe.mustNotOwn`
  - `direct dispatch governance` → `observe.mustNotOwn`

## §7 contract matrix ledger

### Agent Coordination Engine -> Dispatch And Execution Engine
- Ends: `['agent-coordination-engine']` → `['execution-core', 'dispatch-transport', 'seat-binding']`
- Edge `CTR012`: co-consumers `agent-coordination-engine`, `execution-core`
- Edge `CTR013`: co-consumers `agent-coordination-engine`, `execution-core`
- Edge `CTR013`: co-consumers `agent-coordination-engine`, `dispatch-transport`
- Allowed/forbidden prose: not model fields.

### Agent Coordination Engine -> Run Result Evaluator
- Ends: `['agent-coordination-engine']` → `['run-result']`
- Edge `CTR013`: co-consumers `agent-coordination-engine`, `run-result`
- Edge `docs.runner/unit-run-result`: provider `run-result` → consumer `agent-coordination-engine`
- Edge `run-result/run-result.read.v1`: provider `run-result` → consumer `agent-coordination-engine`
- Edge `run-result/unit-summary.read.v3`: provider `run-result` → consumer `agent-coordination-engine`
- Allowed/forbidden prose: not model fields.

### Agent Coordination Engine -> Team Cognition Engine
- Ends: `['agent-coordination-engine']` → `['team-cognition-engine']`
- Edge `CTR013`: co-consumers `agent-coordination-engine`, `team-cognition-engine`
- Edge `docs.runner/unit-run-result`: co-consumers `agent-coordination-engine`, `team-cognition-engine`
- Edge `run-result/run-result.read.v1`: co-consumers `agent-coordination-engine`, `team-cognition-engine`
- Edge `run-result/unit-summary.read.v3`: co-consumers `agent-coordination-engine`, `team-cognition-engine`
- Edge `group-thinking/protocol-public-request`: co-consumers `agent-coordination-engine`, `team-cognition-engine`
- Allowed/forbidden prose: not model fields.

### Team Cognition Engine -> Run Result Evaluator outputs
- Ends: `['team-cognition-engine']` → `['run-result']`
- Edge `CTR013`: co-consumers `team-cognition-engine`, `run-result`
- Edge `docs.runner/unit-run-result`: provider `run-result` → consumer `team-cognition-engine`
- Edge `run-result/run-result.read.v1`: provider `run-result` → consumer `team-cognition-engine`
- Edge `run-result/unit-summary.read.v3`: provider `run-result` → consumer `team-cognition-engine`
- Allowed/forbidden prose: not model fields.

### Work Driver -> Work Lifecycle Engine
- Ends: `['work-driver']` → `['work-state']`
- Edge `CTR002`: provider `work-state` → consumer `work-driver`
- Edge `CTR004`: provider `work-state` → consumer `work-driver`
- Edge `docs.runner/unit-run-result`: co-consumers `work-driver`, `work-state`
- Edge `run-result/run-result.read.v1`: co-consumers `work-driver`, `work-state`
- Edge `run-result/unit-summary.read.v3`: co-consumers `work-driver`, `work-state`
- Allowed/forbidden prose: not model fields.

### Work Driver -> Domain Registry And Definition Loader
- Ends: `['work-driver']` → `['domain-registry-loader']`
- Edge `domain-registry/definition-load`: provider `domain-registry-loader` → consumer `work-driver`
- Allowed/forbidden prose: not model fields.

### Work Driver -> Agent Coordination
- Ends: `['work-driver']` → `['agent-coordination-engine']`
- Edge `CTR003`: co-consumers `work-driver`, `agent-coordination-engine`
- Edge `CTR006`: co-consumers `work-driver`, `agent-coordination-engine`
- Edge `CTR012`: co-consumers `work-driver`, `agent-coordination-engine`
- Edge `CTR013`: co-consumers `work-driver`, `agent-coordination-engine`
- Edge `docs.runner/unit-run-result`: co-consumers `work-driver`, `agent-coordination-engine`
- Edge `run-result/run-result.read.v1`: co-consumers `work-driver`, `agent-coordination-engine`
- Edge `run-result/unit-summary.read.v3`: co-consumers `work-driver`, `agent-coordination-engine`
- Allowed/forbidden prose: not model fields.

### Domain Component -> Work Driver / Agent Coordination
- Ends: `['domain-components']` → `['work-driver', 'agent-coordination-engine']`
- Edge `CTR012`: co-consumers `domain-components`, `work-driver`
- Edge `CTR012`: co-consumers `domain-components`, `agent-coordination-engine`
- Edge `domain-registry/definition-load`: co-consumers `domain-components`, `work-driver`
- Allowed/forbidden prose: not model fields.

### Host Surface -> platform engines
- Ends: `['host-surface']` → `['work-state', 'execution-core', 'runner', 'workflow', 'dispatch-transport']`
- Edge `CTR001`: provider `host-surface` → consumer `execution-core`
- Edge `CTR001`: provider `host-surface` → consumer `runner`
- Edge `CTR002`: provider `work-state` → consumer `host-surface`
- Edge `CTR002`: co-consumers `host-surface`, `execution-core`
- Edge `CTR002`: co-consumers `host-surface`, `runner`
- Edge `CTR002`: co-consumers `host-surface`, `workflow`
- Edge `CTR003`: provider `runner` → consumer `host-surface`
- Edge `CTR004`: provider `work-state` → consumer `host-surface`
- … +20 more edges
- Allowed/forbidden prose: not model fields.

### Group-Thinking Protocol Pack -> Agent Coordination / Team Cognition
- Ends: `['group-thinking']` → `['agent-coordination-engine', 'team-cognition-engine']`
- Edge `CTR012`: co-consumers `group-thinking`, `agent-coordination-engine`
- Edge `docs.runner/unit-run-result`: co-consumers `group-thinking`, `agent-coordination-engine`
- Edge `docs.runner/unit-run-result`: co-consumers `group-thinking`, `team-cognition-engine`
- Edge `run-result/run-result.read.v1`: co-consumers `group-thinking`, `agent-coordination-engine`
- Edge `run-result/run-result.read.v1`: co-consumers `group-thinking`, `team-cognition-engine`
- Edge `run-result/unit-summary.read.v3`: co-consumers `group-thinking`, `agent-coordination-engine`
- Edge `run-result/unit-summary.read.v3`: co-consumers `group-thinking`, `team-cognition-engine`
- Edge `group-thinking/protocol-public-request`: provider `group-thinking` → consumer `agent-coordination-engine`
- … +1 more edges
- Allowed/forbidden prose: not model fields.

### `fgos-group-thinking` Skill -> Group-Thinking Protocol Pack / Host Surface
- Ends: `['group-thinking']` → `['group-thinking', 'host-surface']`
- Edge `CTR012`: co-consumers `group-thinking`, `group-thinking`
- Edge `CTR012`: co-consumers `group-thinking`, `host-surface`
- Edge `docs.runner/unit-run-result`: co-consumers `group-thinking`, `group-thinking`
- Edge `run-result/run-result.read.v1`: co-consumers `group-thinking`, `group-thinking`
- Edge `run-result/unit-summary.read.v3`: co-consumers `group-thinking`, `group-thinking`
- Edge `group-thinking/protocol-public-request`: provider `group-thinking` → consumer `host-surface`
- Allowed/forbidden prose: not model fields.

### Sibling components under one parent
- Ends: `['__generic__']` → `['__generic__']`
- **deliberately not carried**: generic sibling rule, not a concrete provider/consumer edge.

### Observe -> Substrate Sources
- Ends: `['observe']` → `['run-result', 'work-state']`
- Edge `docs.runner/unit-run-result`: provider `run-result` → consumer `observe`
- Edge `docs.runner/unit-run-result`: co-consumers `observe`, `work-state`
- Edge `run-result/run-result.read.v1`: provider `run-result` → consumer `observe`
- Edge `run-result/run-result.read.v1`: co-consumers `observe`, `work-state`
- Edge `run-result/unit-summary.read.v3`: provider `run-result` → consumer `observe`
- Edge `run-result/unit-summary.read.v3`: co-consumers `observe`, `work-state`
- Allowed/forbidden prose: not model fields.

### Platform Components -> Observe
- Ends: `['host-surface', 'runner', 'execution-core']` → `['observe']`
- Edge `CTR008`: provider `observe` → consumer `host-surface`
- Edge `CTR008`: provider `observe` → consumer `runner`
- Edge `observe/observe-names`: provider `observe` → consumer `host-surface`
- Edge `observe/observe-names`: provider `observe` → consumer `runner`
- Edge `observe/observe-names`: provider `observe` → consumer `execution-core`
- Edge `observe/observe.case.v1`: provider `observe` → consumer `host-surface`
- Edge `observe/observe.case.v1`: provider `observe` → consumer `runner`
- Edge `observe/observe.case.v1`: provider `observe` → consumer `execution-core`
- … +15 more edges
- Allowed/forbidden prose: not model fields.

## Summary

**none left** — every §6 clause lives in the model row named above; every concrete §7 matrix pair has at least one contract provider/consumers edge.

## Deliberately not carried

- Sibling components under one parent — generic rule, not a concrete edge.
- §7 allowed/forbidden dependency prose — only provider/consumers edges are modeled.
- Dispatch Control Plane markdown doc pointer inside the proposal Owns cell — authority clauses carried; doc path not duplicated as an owns string.
- Dispatch And Execution Engine remains split across `execution-core`, `dispatch-transport`, `seat-binding` (proposal name aliased on `execution-core`).
- `fgos-group-thinking` Skill folded into `group-thinking` with pack+skill clauses on one row.

