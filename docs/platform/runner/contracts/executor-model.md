# Executor Model Contract — Execution

```txt
Document type: Contract
Audience: Maintainer, implementer, agent that ports or calls the executor model
Purpose: Name the executor entry, every fact derived from it, the bind answer, the decide answer and the hook verdict, so a second implementation can be proven against the same vectors
Design status: Draft for owner review. Written from the Node code on origin/main (2026-11-17); no behaviour was changed to write it
Implementation: Node today (`src/runner/dispatch`, `src/runner/execution`, `src/runner/hook.mjs`). The golden vectors in `packages/execution/contracts/executor-model.v1.json` are recorded from those functions and replayed by `test/runner/dispatch/executor-model-vectors.test.mjs`. The bind, decide, hook and listing vectors are recorded by the phases that port them
Provenance: Read end to end from the source files named in each section; vectors reviewed by hand against the code path they exercise (plans/261115-2328-execution-read-door/phase-00-facts.md F1 to F3)
Writer type: Agent draft writer
Canonical for: What an executor entry means, which facts Execution derives from it, and the shape of the answers `bind`, `dispatch decide`, `dispatch explain` and the dispatch hook give
Use this when: Porting or calling any part of the executor model, or deciding where a derived fact belongs
Do not use this for: Field syntax of the config (the schema owns it); which executor ranks first for a seat (Seat Binding owns it); how a Unit run is admitted or settled (the Unit Run Result contract)
Last reviewed: 2026-11-17
Related:
- docs/platform/runner/spec.md (Execution Core and Dispatch section)
- docs/platform/seat-binding/spec.md
- docs/platform/runner/contracts/unit-run-result.md
- docs/platform/runner/contracts/routing-handoff.md
- docs/platform/component-boundary.md
- core/config-schema/runner.schema.yaml
- packages/execution/contracts/executor-model.v1.json
Supersedes: None
Superseded by: None
```

## 1. Layers and who decides what

| Question | Owner | Where it lives today |
|---|---|---|
| Which executor, invocation, model, effort, tier and account runs a seat, and where it goes on failure | Seat Binding (ranks, unchanged) | the `fgos-seat-binding` crate |
| What an executor entry means, which facts follow from it, and the bind composed from them | Execution (this contract) | `src/runner/execution/bind.mjs`, `src/runner/dispatch/{config,resolve,mechanism,provider-adapter,executor-governance,tool-providers}.mjs` |
| Launching: argv, transport, confinement request, leases | Dispatch | `src/runner/dispatch/*` (not in this contract) |
| Account state (lease, release, quarantine, probe) | Dispatch, as the account-state adapter of the port Seat Binding defines (`provider-capacity`) | `src/runner/dispatch/provider-capacity.mjs` |

Execution derives facts and composes the request to Seat Binding; it never ranks or filters candidates. Dispatch hands
its account read to the bind as an overlay: the bind reads lease state once, outside any lock, and the lease later takes
exactly the account the bind named. A refusal a decision gives is a decision, not an error: it travels as data with a
reason and a detail.

## 2. The executor entry

An executor is one entry of `runner.executors.<id>`. Field syntax (type, enum, range, scope) is the schema's:
`core/config-schema/runner.schema.yaml`, node `executors`. This section says what each field means to a derivation.

| Field | Meaning to the model |
|---|---|
| `kind` | Required. `agent` runs work for a seat; `tool` is only called (it is present or not) |
| `command`, `args` | The program of an executor that declares no invocations (one pair or none; the schema requires both together) |
| `adapter` | How the executor's own command is spawned; `cli-spawn` or `herdr-spawn` |
| `agentType` | The native agent definition a task runs in the caller's own session. An entry with `agentType` and no `command`, `adapter` or `invocations` is a pure native agent |
| `providerModel` | The provider family of the executor; the key of `modelPolicies` |
| `forceCliSpawn` | Spawn a process even where a native task would do |
| `supports.skills`, `supports.reasoningEffort` | Skills the executor can load; the effort levels it accepts (a narrower list limits what an invocation may render) |
| `invocations[]` | The ways to start it: `{ id, via, adapter, command, credentialStore, confinement, args, ... }`. `via` is `cli`, `task` or `mcp`; `adapter` is `cli-spawn` or `herdr-spawn`; `credentialStore` is `{ use, homeEnv, files?, sessionDir? }`, the login store the invocation reads |
| `permissionMode`, `confinement` | Whether the worker asks before acting, and the confinement it runs under (a `backend` names the machine backend that carries a posture) |
| `for`, `scanTarget` | A tool's served capabilities, and the directory a tool's presence is judged by |
| `carries`, `allowCrossProvider`, `identity`, `env`, `interactiveMode`, `promptDelivery` | Governance, audit and transport fields that Dispatch reads; they take no part in the facts below |

An invocation id is unique inside one executor. An invocation without an `id` cannot be pinned by a seat and is left out
of the launch view (section 3, "launch facts").

## 3. Derived facts

Each fact has one definition. The vectors of `packages/execution/contracts/executor-model.v1.json` carry one or more
cases per fact, named by the fact in the first column.

| Fact (vector `fact`) | Definition |
|---|---|
| default-executor merge (`defaultExecutor`) | `withDefaultExecutor`. The legacy default `runner.executor` (`{ command, args }`) fills the `claude` entry and the entry named by its command. When the default runs the same program as an entry (its command's basename equals the executor id) the entry keeps its invocations, supports and the rest, and only `command` and `args` come from the default; for another program the default replaces the entry. `decide` applies the merge to the config it reads; `explain` does not |
| family (`family`) | `familyOf(source, command)`: the key of `modelPolicies`, `tierFallback`, pools and the deny list. `source` is an entry (its `providerModel`, else `provider`) or a spelling; with neither, the family comes from `command` (an entry that names nothing is `claude`). A declared vendor wins over the CLI harness that runs it. Spellings: `openai-codex` and `codex` are `openai`, `glm` is `z-ai`, `agy` is `gemini`; every other value is itself, trimmed and lower-cased. The bind composes the family of an executor id by passing the command of its first `cli` invocation, else the entry's own `command`, else the default executor's command (an entry whose only program name is an `adapter` takes the `claude` family) |
| executor lookup (`executorLookup`) | `lookupExecutor`: a literal registry key is that entry; otherwise the default executor answers to no id, to `executor`, to its own command, and to its first invocation's command or id; anything else is `{ executorId: null, configured: false }`, a state, never an error. It looks a name up and chooses nothing |
| governance (`governance`) | The two checks every dispatch door runs: `resolveExecutorProvider` (the registered entry and its family; an unregistered id that is not the implicit default is refused; a deny list with no registry cannot be verified and is refused) and `resolveExecutorGovernance` (`governance.disallowed-provider` when the family is on `disallowedProviders`, compared in the one family vocabulary; `governance.disallowed-executor` when the id is on `disallowedExecutors`). The bind runs the same comparison as data: a governed-out executor carries `disallowed` in its launch facts instead of throwing |
| mechanism (`mechanism`) | `decideExecutorDispatchMechanism`: `out-of-process` when the entry is cli-spawn-shaped (it declares `command`, `adapter`, or an invocation with `via: cli`), regardless of the session; otherwise `in-process` only when the entry is an `agent`, does not set `forceCliSpawn`, and the caller declared `hasLiveTaskAccess` (a self-declaration, never probed); everything else, an unregistered id and a tool included, is `out-of-process`. The bind reports `in-process` or `out-of-process` only |
| capability confinement (`capabilityConfinement`) | `capabilityConfinementOf`: the `confinement` of the capability's exact entry; never its `<prefix>:*` entry |
| credential-store CLI (`credentialStore`) | `credentialStoreOf(invocation)`: the invocation's declared `credentialStore`, else none. The CLI an account's login is read for is the store's `use`. Nothing is inferred from `resourceBindings` or the command; the legacy read and its two vectors were deleted |
| rendered effort levels (`effortLevels`) | `renderedEffortLevels(command)`: the canonical levels (`low`, `medium`, `high`, `max`) when fgOS knows how to set effort on the command's CLI (`claude`, `agy`, `pi`, `omp`, `codex`, by the command's basename), none otherwise. In the launch facts an executor's `supports.reasoningEffort` narrows the list |
| posture carrying (`posture`) | `resolvePostureInvocation`: whether an executor can apply a posture on this machine, and which invocation carries it. A pure native agent carries it in the lead session. Otherwise the invocation must resolve to a confinement `backend` (its own, else the executor's) that the machine registry lists, enabled, of type `bwrap`, whose executable (the registry's `executable`, else `bwrap`) is on PATH. A named invocation is kept as named or refused; with none named the first `cli` invocation that declares a backend is taken (a `herdr-spawn` one only when the session is in herdr; an id-less one only when it is the first `cli` invocation); an executor with no invocations and a backend of its own carries the posture without naming one |
| backend registry path (inside posture carrying) | The machine registry is read from `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH` when set, else `confinement-backends.json` in the global fgOS directory. Absent file is an empty registry; an unreadable or invalid file is a registry that carries nothing. The override is kept as it is today |
| launch facts (`launchFacts`) | What the bind may know of one executor: `kind`, `family`, `mechanism`, `skills` (`supports.skills`, else none), `invocations[]` (each `{ id, cli?, efforts, carriesPosture }`: `cli` is the credential-store CLI, `efforts` the rendered levels narrowed by `supports.reasoningEffort`, `carriesPosture` the posture-carrying fact for that invocation), `defaultInvocation`, and optional `disallowed`, `missingCli`, `unnamedCarries`. The default invocation is the posture-carrying fact for `read-only` with no invocation named, switched to the first `herdr-spawn` invocation when the session is in herdr and that one carries the posture. When posture is judged at launch (the caller binds only to learn who and which model) every invocation carries it and the first is the default; an executor with no invocations then has one invocation named `command`. `unnamedCarries` marks an executor whose posture is carried with no invocation to name |
| missing CLI (`missingCli`, and `missingCli` in launch facts) | The programs an out-of-process agent executor starts (each invocation's command, else the entry's, else the default executor's), as bare names, when none of them is on PATH; none when one is, when the executor starts no program of its own (a native agent, a tool), or when it is in-process. `agentCliMissingRefusal` answers `agent-cli-missing` with `detail` and `fix` when every agent executor of the config is missing its programs |
| account inventory (`accountInventory`, `llmAccounts`, `stateKey`) | `providerAccountInventory`: accounts per lease-state key, in declared order, each with its login store per CLI. A pool declared in `runner.llmAccounts` supplies its own accounts and replaces the same pool of `runner.providers.<provider>.accounts`; a pool it does not declare keeps the older read. `readLlmAccounts` only reports: what is wrong is listed in `problems` (never thrown). `legacyStateKey(pool)` is the key lease state uses: the family, except `openai` is `openai-codex`. A home path may begin with `~`, `${HOME}` or `$HOME`; it is expanded against the user's home |
| pinned account quarantine (`accountQuarantine`) | `accountQuarantineOf`: when the account the seat's view holds quarantined now ends (epoch milliseconds; the largest safe integer when only a person clears it), or none. A quarantined login that one real call may lift, with no healthy account in the pool, reads as not quarantined |
| tool providers (`toolProviders`) | `toolProvidersOf`: the tool executors serving a capability (every `for` entry counts; compared folded to kebab-case), in registry order, each `{ executorId, capability, status, mcpTool?, command? }`. `status` is judged on the first invocation: a `cli` command is `present` when on PATH, else `missing`; an `mcp` tool is `missing` when its `scanTarget` is not on disk, `stale` when its index records a commit behind HEAD, else `present`; nothing to probe is `unknown`. An agent executor serves nothing whatever its `for` says. A probe never reports a staleness it did not see |

Two reads of the family differ today and are kept as they are (section 11): the bind's, above, and `dispatch explain`,
which reads `familyOf(entry)` with no command.

## 4. The config the facts are read from

### 4.1 The config root

`decide` reads the config of the linked worktree the caller sits in when that worktree carries a project config of its
own; otherwise the config of the main checkout. A worktree whose config file the door refuses surfaces the refusal; only
not finding a repository for the working directory falls back to the main checkout.

### 4.2 Runner semantic validation

The config door has already refused every type, enum, range, required and unknown-key rule of the schema. What
`validateRunnerConfigShape` adds are rules that compare two fields, or a field with a catalog or a registry. Vectors:
fact `validate`. Every refusal is a `RunnerConfigError` (or a sibling) naming the rule and the place; none carries a value.

| Rule | Refusal |
|---|---|
| A retired runner key (`readOnlyExecutorRedirects`, `placementPolicy`, `models`, `rigorToTier`) | names what replaced it |
| A retired executor field (`receipt`, `trustStore`, `readOnlyRedirect`, a retired rigor override) | names why it went |
| A tool's `for` entry, or an `mcp` invocation's `tools` key, that is not a declared capability | add it to `capabilities` first |
| `permissionMode: bypass` without `privateHome`, `isolatedSession` and `ownWorktree` all true | names the missing flags |
| An invocation id repeated inside one executor | each id is unique |
| A `credentialStore` that is not `{ use, homeEnv, files?, sessionDir? }`, or on an invocation that is not a confined `cli` one | names the shape problem or the missing backend |
| A capability's `prefer` (entry, role, persona or seat) naming an unregistered executor or an undeclared invocation | names both |
| A persona key that is not a persona name, a seat key that is not a seat id | names the rule |
| A capability confinement naming an unknown policy; a custom policy redefining a built-in one; strict mode with no capabilities or a capability with no explicit mode | `confinement-policy-missing` text |
| `confinementBackends` in a project config | machine-level only |
| A provider inventory declaring one provider under two spellings, or a malformed account | names the key |
| `generatedPaths`, `patterns` and `loops` rules (literal leading directory, retired pattern keys, reserved pattern names, bounds naming a read parameter, `min` not above `max`) | names the key |

The `config-*` codes in this area are few. A refusal of the door itself carries the door's own failure id (`config-*`).
Of the rules above only the retired pattern keys carry a `config-*` code, `config-key-retired`; every other semantic
rule is thrown with no code. This matters to the hook (section 8) and is recorded as an open question in section 11.

## 5. Machine facts a derivation reads

A derivation reads the machine only through these: the programs on PATH, the confinement backend registry (4 above, with
its override), the user's home directory, the lease state file under the runtime directory, files under the repository
root (a tool's `scanTarget`) and the repository's HEAD. The vectors state each as a `machine` block, so a port replays
them without depending on the machine it runs on.

## 6. The bind

### 6.1 Request

A bind is asked for one seat by `{ ask, ctx, walk }`.

- `ask`: the unit (`id`, `capability`, `writes`, `prefer`, `persona`, `rigor`, `skills`, `timeoutMs`), the seat and its
  role, the seat posture (`readOnly`, `writer`, `forceOutOfProcess`), an optional locked persona and workflow tier,
  `independentOf`, `preferIndependentOf`, overrides (tier, executor, invocation, effort, account, timeout, scope) and
  `raiseAuthorized`.
- `ctx`: the runner config, the session facts (`headless`, `herdrPresent`, `hasNativeAgent`, `pathEnv`,
  `postureAtLaunch`) and optionally the lease-state location and assignment id (without it the account view is the
  config alone, which is what a replay and `explain` read).
- `walk`: where the seat stands after a failure: `tried` (earlier bindings, oldest first), `excludePools`,
  `failedAccounts`, `continuity` (a binding whose executor, model and effort the seat keeps), `from`, `rotation`,
  `detail`, `reason` (default `provider-limit`).

Before Seat Binding is asked, Execution collects: the launch view (launch facts of every executor), the account view
(per pool: accounts, each with `id`, the CLIs it holds a login for, and `disabled`, `sticky`, `quarantinedUntil`,
`probe: failed` when they apply), the persona chain (override, seat, unit, locked, capability default), the effective
rigor, the override checks (tier name, effort, run timeout) and the family-keyed form of `modelPolicies` and
`tierFallback`. A name no seat could take is refused before the crate is called.

### 6.2 Answer

A binding, or `{ refused }`. A binding carries `contractVersion` (`v1alpha1`), `executor`, `invocation`, `transport`
(`herdr` or `cli`), `family`, `pool`, `tier`, `model`, `persona`, `reasoningEffort`, `timeoutMs`, `mechanism`,
`posture` (`read-only` or `workspace-write`), the account the lease takes (`leaseAccount`) and a pinned `account` when
an override named one, `provenance` and `bindingInput`.

`provenance` names, for each of `executor`, `invocation`, `transport`, `tier`, `model`, `persona`, `reasoningEffort`,
`timeoutMs`, `mechanism` and `posture`, a `{ value, source }`; plus `pool`, `skipped` (candidates passed over, each
with a reason), `familySpread`, `account`, `overridesOrigin`, and `fallbackFrom` when the bind follows a walk step
(`next-candidate` with `walk: entry|family`, `account-rotation`, `lease-conflict`, `brief-not-delivered`). A tier's
provenance also carries `recommendation`, `loweredFrom`, `maxTier` and `raisedBy` when they apply. `bindingInput` is what
was decided from: the ask, peers, walk, the config digest, the account-view digest, the protocol and the
host version; never the config body or account facts.

### 6.3 Refusals

A refusal is `{ reason, detail }` plus `fix`, `config`, `peers`, `rendered`, `missingClis` where they apply. Reasons
Execution adds: `agent-cli-missing` (no agent CLI is installed; takes precedence), `headless-no-executor` (nothing is
configured for the capability in a headless session), `run-timeout` (a timeout outside its floor and ceiling),
`reasoning-effort` (an effort outside the vocabulary), `locked-persona` (a unit or override conflicts with the locked
persona), and `cli-missing` with the sorted `missingClis` when the crate refuses for that reason. Every other reason is
the crate's and passes through unchanged. A tier name or effort name no seat could take is thrown as a config error, not
refused.

### 6.4 The walk, `explain` and the config digest

The walk chain is the sequence of bindings a seat takes as each fails: each step binds again with the earlier bindings
in `tried`, and stops at a refusal or at an identity it already visited. The identity of a binding is `executor`,
`invocation`, `pool`, `model` and `reasoningEffort`.

`dispatch explain` asks the same bind as a run (headless, read-only unit) and lays out: `ask`, `family`, `executor`
(`id`, `source`), `invocation`, `credentialStore` (with whether it is `declared` or `inferred`), `transport`, `tier`
(`value`, `source`, `definition`, `recommendation`, `loweredFrom`, `maxTier`), `model`, `effort`, `pool`, `cell.entries`
(each `used`, `fallback` or `unusable`), `candidates` (`in` or `out` with a reason), `walk`, `accounts` per pool on the
walk (in lease order, each usable or not with the reason, plus the `problems` of the inventory) and the crate's
`explanation` lines. A refused bind answers `{ ask, refused, explanation }`.

The seat-config digest is `sha256:` of the canonical JSON of the slice of the runner config seat choice reads
(`defaults`, `maxTier`, `tierFallback`, `modelPolicies` and the per-capability taste), read back from its JSON text so
that the digest is over the bytes the crate receives. A replay recomputes it; a stage-one answer is cached per ask and
digest for the life of the process.

### 6.5 Pre-admission facts

Two facts are read before a run is admitted: the agent-CLI-missing refusal (section 3) and a pinned account's
quarantine. Both come from the same launch and account views the bind uses, so a pinned account is refused for the reason
a ranked one would be passed over.

## 7. The decide answer

`fgos dispatch decide` answers which mechanism and executor a dispatch resolves to, from the committed config, running
nothing. Selectors: an executor id, `--for <purpose>`, `--work <id>`, `--assignment <id>`, or `--needs-soul` alone.
`--has-live-task-access` is the caller's own declaration.

The answer: `mechanism` (`in-process`, `out-of-process` or `unavailable`), `configured`, `reasonCodes` (always a list),
and, when they apply, `blockedReason`, `agentType` (agent) or `mcpTool` / `command` (tool; exclusive with `agentType`),
`stale`, `providers` (what was probed: `{ executorId, status }`), and `executorId` (only when the caller named no
executor and the decision chose one). `reasonCodes` come from: `tool.present`, `tool.stale`, `tool.missing`,
`tool.unprobeable`, `tool.unnamed`, `native-first.rule-1.no-native-mechanism`, `native-first.rule-2.live-task-access`,
`native-first.0033.cli-spawn-shaped`, `selector.unregistered`, `capability.unknown`, `governance.blocked`,
`seat-binding.refused`, `policy.executor-mismatch-ignored`.

The purpose rule, unchanged: a name is resolved in this order. A registered executor under that name is that executor.
Otherwise a tool executor serving it answers with its live presence (`present` or `stale` is `in-process` carrying the
tool to call; `missing` or unprobeable is `unavailable`; the row's `prefer` is never read). Otherwise a purpose routes
through Seat Binding only when its own capability entry (the exact entry, never the prefix entry) has a `prefer` pool;
the executor named is the one that would run, or `unavailable` with the refusal in `blockedReason`. A name with none of
these answers `in-process` under `--needs-soul` (native dispatch by default) and `unavailable` otherwise, with
`selector.unregistered`, plus `capability.unknown` when the purpose was never registered.

## 8. The hook

The PreToolUse hook guards Agent and Task calls by running `decide` for the caller.

- Payload normalization (`normalizeHookPayload`): two formats. The standard format (`tool_name`, `tool_input`,
  `transcript_path`) and agy's (`toolCall.name`, `toolCall.args`, `workspacePaths`). The project directory a verdict is
  judged against is `CLAUDE_PROJECT_DIR` for every standard-format payload, agy's `workspacePaths[0]` for agy, else the
  directory the hook started in; a `cwd` inside a payload is never read. An empty payload, or one that is not a JSON
  object, allows the call.
- Verdict (`decideDispatchHook`): a tool that is not Agent, Task or task allows. For an Agent or Task call it runs
  `decide --for <subagent type> --needs-soul --has-live-task-access` (the type is `subagent_type`, else `agent`, else
  `general-purpose`) and blocks unless the answer is `in-process`, naming the cause and the `fgos run` door to use.
  A project directory that does not exist blocks. A refusal of the project's config (a `config-*` refusal) blocks.
  Any other failure of `decide` allows: the hook is an enforcement layer over a working surface, not a second point of
  failure.
- Exit contract: a block is exit 2 with `BLOCKED: <reason>` on stderr for the standard format, and for agy
  `{"decision":"deny","reason":"BLOCKED: <reason>"}` on stdout with exit 0 (`{"decision":"allow"}` to allow). A missing
  project directory or a config refusal blocks; any other failure, a host panic included, allows.

## 9. The version

The binding keeps `contractVersion` `v1alpha1`: its consumers read it from run records. The route request to Seat Binding
gains protocol 2 in the phase that moves the bind into Rust. The vector file's own version is `executor-model.v1`.

## 10. Proof

Each derived fact has one owning proof: the vectors of `executor-model.v1.json`. Until the Node functions are deleted
the Node twin `test/runner/dispatch/executor-model-vectors.test.mjs` replays every vector against them; a Rust port reads
the same file. A vector marked `knownDefect` records today's output of behaviour that looks wrong: the port keeps it and
the owner decides in a separate item. The vectors are regenerated, never hand-edited in `expect`, by `scripts/executor-model-vectors.mjs` (`--check` fails on drift). Shapes of
the bind, decide, hook and listing answers are written here; their vectors are recorded by the phases that move them,
each in its own file.

## 11. Observed differences and open questions

1. `dispatch explain` reads `familyOf(entry)` with no command, while the bind passes the command of the entry's first
   `cli` invocation. An entry that declares no `providerModel` therefore reads as `claude` in `explain` and as its CLI in
   the bind. Shipped entries declare `providerModel`, so the two agree today.
2. `familyOf` does not reduce a command given as a path to its program name, so `/usr/bin/codex` is a family of its own,
   not `openai` (vector marked `knownDefect`). Shipped configs name bare commands.
3. Only retired pattern keys carry a `config-*` code among the semantic rules (section 4.2), so a config that breaks any
   other rule is refused by `decide` but allowed by the hook, whose header comment says a config refusal blocks. Whether
   semantic refusals should carry a `config-*` code is the owner's call; the port keeps today's behaviour.
4. An id-less first `cli` invocation that declares a backend carries the posture without a name (`unnamedCarries`), and
   is left out of the launch view.
