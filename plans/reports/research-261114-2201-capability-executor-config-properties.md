# Capability and executor config: every property, and what "purpose" means

Date: 2026-11-14. Base: origin/main 781537524. Facts only, no recommendation. Anything I could not confirm is marked "UNCONFIRMED". Account names and keys are shown as [redacted]. The `file:line` references are at 781537524 unless they point at the machine files `~/.fgos/config.yaml` (global) or `.fgos/config.yaml` (project, working copy of this checkout).

## 0. Reading guide

Config comes in three layers: project over global over standard (`docs/platform/config/spec.md:69`). The shipped layer is `core/config-standard/runner.yaml`. A schema key marked `x-fgos-scope: global-only` is refused in the project file, and `project-only` is refused in the global file. The standard layer is not subject to that refusal (the standard file sets `tier` on capability rows, which the schema marks project-only).

The shipped standard file holds only agent executors (claude, glm, openai, gemini, xai, deepseek). The tool executors `gitnexus` and `herdr` exist only in the machine files: global `~/.fgos/config.yaml:25-60` and project `.fgos/config.yaml:122-150`. So every example of a tool executor below comes from those two files, not from `core/config-standard/runner.yaml`.

Three code paths read these rows, and they are different code:

1. **Seat Binding** (`bind()` in `src/runner/execution/bind.mjs`, which calls the Rust crate `packages/seat-binding/rust`). It answers which executor, invocation, model, tier and account an agent seat runs on. It reads only a slice of the capability row (section 1.1) and a launch view of every executor.
2. **The dispatch door** (`fgos dispatch decide`, `src/runner/dispatch/plan.mjs`, `resolve.mjs`, `mechanism.mjs`). It answers which mechanism (in-process, out-of-process, unavailable) and which executor a name resolves to. Its executor choice is not made by `bind()`: it takes the first `prefer` entry of the row (`resolve.mjs:237-263`). `bind()` runs afterwards only to fill tier and model (`plan.mjs:368-395`, `policyForPlan`). The `decide` help text says "via bind()" (`src/cli/command-registry.mjs:1545`), which is true of tier and model but not of the executor choice.
3. **The tool registry** (`fgos tool query`, `src/state/tool-registry.mjs`). It reads executors of `kind: tool` and their `for`, and probes whether the tool is present. It never reads `capabilities`.

## 1. `runner.capabilities.<name>`

The schema is `core/config-schema/runner.schema.yaml`, `$defs.capability` (line 446 onward). It is closed: `additionalProperties: false`, so an unknown key is refused. The older keys `overrides` and `unconfined` were removed and are refused by name.

Name rules. A capability name is any string key; the repo uses two shapes: a plain verb or tool name (`advise`, `execute`, `impact-analysis`) and `domain:verb` (`code:review`). A key written `<domain>:*` (for example `code:*`, `coding:*`, `marketing:*`) is a prefix row. When the crate looks up a capability containing a colon it reads the exact row first, then the `<prefix>:*` row (`packages/seat-binding/rust/src/policy.rs:17-35`, same rule in `seat-resolver.mjs:75-83`). A name without a colon has no prefix row, and a bare verb is not a fallback for `code:review` (`seat-resolver.mjs:68-74` comment; removed on purpose per the plan context).

### 1.1 Property table

"Default" means what happens when the key is absent. "Read by" lists the code that reads the key; "none" means I found no reader in `src/`, `bin/`, or the Rust packages.

| Property | Type | Default | What it does in plain words | Read by | Example in `core/config-standard/runner.yaml` |
|---|---|---|---|---|---|
| `description` | non-empty string | none | Human text saying what the capability is for. It changes no behaviour. | Printed by `plan-lint` (`bin/fgos.mjs:2395-2399`, exact row then `<prefix>:*`). No behavioural reader found. | `impact-analysis` line 348: "Code-graph blast radius" |
| `aliases` | list of non-empty strings; scope global-only | none | Other names the capability answers to. | `resolveAlias` inside `resolveCapabilityDetailsFromHints` (`resolve.mjs:38-47`, the Work path only); `registeredCapabilityOf` (`src/runner/dispatch/config.mjs:375-379`, used by `decide.mjs:47` and the proposal check); `isKnownCapabilityName` (`plan.mjs:28-32`, only to add the reason code `capability.unknown`). **Not read by `resolveExecutorAndOverrides`**, so `decide --for impact_analysis` does not resolve through the alias (run live: `unavailable`, `selector.unregistered`; same for `"Impact Analysis"`). | `impact-analysis` line 350: `[impact_analysis, "Impact Analysis"]` |
| `prefer` | one executor id string, or a non-empty list. A list entry is an id string or an object `{executor, invocation?, crossProvider?}` (`executor` required, `invocation` pins one invocation id of that executor) | none. When absent the crate uses the families of `tierFallback.<tier>` as the order (`policy.rs:195-204`) | The ordered pool of executors that may serve this capability. | Crate: `resolve_prefer` `policy.rs:160-205` and the ranking in `rank.rs:90-120`. Slice builder: `seat-policy.mjs:23-49` (a bare string becomes a one-item list). Dispatch door: `resolveExecutorAndOverrides` takes the **first entry only** (`resolve.mjs:237-263`; a named executor that is not registered throws). Load validation: `config.mjs:700-717` (every named executor and invocation must exist). The crate refuses an empty list (`policy.rs:44-49`). `crossProvider` is normalised (`config.mjs:421`) but I found no reader after that, and the crate's `Prefer` type has no such field (`model.rs:195-204`): UNCONFIRMED whether it is meant to do anything. | `advise` line 353: claude pinned to `claude-cli-bwrap`, then openai pinned to `codex-cli-bwrap`; `execute` line 366: a mixed list of objects and bare ids |
| `rigor` | `low`, `standard`, `high`, `critical` | none; a unit with neither its own rigor nor the capability's runs at `standard` (`bind.mjs:387`, fallback) | Floor rigor. A unit runs at the stronger of its own rigor and this one. Rigor decides how many checker seats a reviewed unit gets and how independent they are. It never chooses a tier. | `capabilityRigorOf` and `effectiveRigorOf` (`seat-resolver.mjs:91-105`); `plan.mjs:121-124`, `plan.mjs:371` | `architecture:critique` line 508: `rigor: high` |
| `persona` | non-empty string | none | Default persona (the "who sits the seat") for seats of this capability. Used after the seat's own, the unit's and a locked persona. | `resolvePersona` (`bind.mjs:62-82`): reads the exact row then the prefix row. The chosen persona then selects a `personas.<name>` taste (section 1.2). | no standard row sets it |
| `minCheckers` | list of `reviewer`, `red-team`, `tester` | none; the shipped default adds `red-team` for code capabilities (`seat-resolver.mjs:144-147`). An empty list clears that default | Checker seats a reviewed unit of this capability needs at least. | `checkerPlanOf` (`seat-resolver.mjs:139-147`); `legacy-seat-read.mjs:47` (stored snapshots); doctor info row `registrations.mjs:696-705` | no standard row sets it (the `minCheckers` at standard lines 866 and 892 belong to `patterns`, not to a capability) |
| `verify` | non-empty shell command string; scope both, sensitivity command | none; a unit with no verify command records `verify: {ran: false}` (`run.mjs:577`) | The command that proves work of this capability (the unit's own `--verify` wins). | `verifyCommandOf` (`loops/verify.mjs:18`); `workflow/propose.mjs:449` (a writing slice needs `code:implement.verify`); `workflow/case-gate.mjs:66-69` | no standard row sets it |
| `serves` | object, closed; keys below | none | The attribute set the capability promises to serve: a machine-readable "kind of job". | Only the doctor duplicate check (`registrations.mjs:1958-1962`: two rows with an identical set fail). `core/skills/_shared/capability-matching.md` describes steering by `serves`, but I found no runtime reader that selects by it. | `code:review` line 409 onward: `outputKind: finding, domain: code, mutates: false` |
| `serves.outputKind` | string or list | none | Kind of output: `change`, `verification`, `finding`, `decision` per the catalog doc. | doctor only (as above) | `advise`: `decision` |
| `serves.domain` | string or list | none | Domain the work belongs to (`code`, `docs`). | doctor only | `code:implement`: `code` |
| `serves.mutates` | boolean or list | none | Whether the work changes files. | doctor only | `execute`: `true` |
| `serves.behaviorPreserving` | boolean or list | none | Whether the work keeps behaviour unchanged. | doctor only | `code:refactor`: `true` |
| `serves.needsIndependentReview` | boolean or list | none | Whether a reviewer other than the producer is needed. | none | none |
| `serves.hasPlanOrTrack` | boolean or list | none | Whether the work follows a plan or track. | none | none |
| `confinement` | object `{mode, policy?, allowInvocationOverride?}`; scope both, merge rule "tighten" (a project may equal or raise confinement, never lower it) | none (no declared confinement) | How a launch for this capability is sandboxed. | Applied at launch: `confinement/request.mjs:315-337`; capability choice in the Work path: `resolve.mjs:89-130`; strict-mode and policy-name checks: `config.mjs:733-756`; shape: `confinement/policies.mjs:358-381`; doctor `registrations.mjs:3003`, `3519` | `advise` line 353 onward: `mode: required, policy: host-write-denied` |
| `confinement.mode` | `required`, `preferred`, `unconfined` (required key) | none | `required` fails without the policy, `preferred` uses it when possible, `unconfined` runs outside any policy. | as `confinement` | `required` |
| `confinement.policy` | non-empty string | none; absent only when `mode` is `unconfined` | Name of a built-in or `runner.confinementPolicies` policy. | as `confinement` | `host-write-denied` |
| `confinement.allowInvocationOverride` | boolean | none; must be false or absent when `mode` is `unconfined` | Whether an invocation may replace the policy. | `policies.mjs:364-381` | none |
| `tier` | one of the six tiers `nano`, `mini`, `standard`, `advanced`, `flagship`, `frontier`; scope project-only | none; falls to `defaults.tier` (`standard`) | Tier a seat of this capability runs at, unless a narrower scope or a workflow recommendation names one. | Crate `resolve_tier` `policy.rs:97-145` | `execute` line 366 onward: `advanced`; `code:*` line 706: `advanced`; `architecture:shape`: `flagship` |
| `maxTier` | same six tiers; scope project-only | none; falls to the global `maxTier`, else no ceiling | Highest tier a seat of this capability may run at. A higher request is lowered to it and the lowering is recorded. | Crate `resolve_max` and `apply_cap` (`policy.rs:148-157`, `213-230`) | `architecture:shape` line 497: `maxTier: frontier` |
| `roles` | object keyed by `producer`, `synthesizer`, `reviewer`, `red-team`, `judge`; each value is a seat taste (below); scope project-only | none | Tier and executor taste per seat role. An unknown role key is refused by the crate (`policy.rs:50-57`). | Crate `policy.rs:116-126`, `176-186` | `code:*` line 706 onward: `roles.red-team.prefer: [xai, claude, openai]` |
| `personas` | object keyed by persona name; each value a seat taste; scope project-only | none | Tier and executor taste per persona. A persona name must be a lowercase letter then lowercase letters, digits or `-` (`config.mjs` `personaNameProblem`). | Crate `policy.rs:119-123`, `179-183` | none in standard |
| `seats` | object keyed by seat id; each value a seat taste; scope project-only | none | Tier and executor taste for one named seat. A seat id is a lowercase letter then lowercase letters, digits or `-`, not a reserved name (`config.mjs` `SEAT_TASTE_KEY_RULES`). | Crate `policy.rs:116`, `176` | `architecture:critique` line 508 onward: `seats.producer: {tier: frontier, prefer: [openai, claude]}` |

### 1.2 The seat taste (`roles.<role>`, `personas.<name>`, `seats.<seat>`)

The Rust type is `Scope { tier, prefer }` (`packages/seat-binding/rust/src/model.rs:222-230`); the schema calls it `seatTaste`, closed to those two keys.

| Field | Type | Default | What it does | Read by |
|---|---|---|---|---|
| `tier` | one of the six tiers | none | The tier for a seat that matches this scope. | `policy.rs:106-145` |
| `prefer` | executor id string or list in the same shape as the capability `prefer` (the schema reuses `preferList`) | none | The executor pool for a seat that matches this scope. In the Rust type it is a list; the Node slice builder turns a bare string into a one-item list (`seat-policy.mjs:19-27`). The crate refuses an empty list (`policy.rs:63-69`). | `policy.rs:160-205` |

Precedence, as written in the crate. For the tier: seat scope, then persona scope, then role scope, then the workflow's recommended tier, then the capability's own `tier`, then `defaults.tier`; each step looks at the exact row then the `<prefix>:*` row (`policy.rs:97-145`). After that the ceiling applies: capability `maxTier`, else the global `maxTier`. For `prefer`: seat, persona, role, capability row (exact then prefix), then `tierFallback.<final tier>` (`policy.rs:160-205`). An override that names a tier above the resolved one is refused unless the door is authorised to raise a tier (`policy.rs:285-303`).

## 2. `runner.executors.<id>`

The schema is `$defs.executorEntry` and `$defs.invocation` (schema lines 744 onward and 640 onward). The `executorEntry` object is not closed (no `additionalProperties: false`), but removed keys are refused by name in `config.mjs:458-466` (`receipt`, a top-level `trustStore`, `readOnlyRedirect`, `rigorOverrides`). The whole entry has scope both and sensitivity command (it decides what runs on this machine). `kind` is the only required key. `command` and `args` require each other (`dependentRequired`).

Executor ids are free names, but the seat-binding spec says one agent executor serves exactly one provider family, so the id names the family (`docs/platform/seat-binding/spec.md`, vocabulary table; doctor row `executor-family-unique`).

### 2.1 Executor entry properties

| Property | Type | Default | What it does in plain words | Read by | Example |
|---|---|---|---|---|---|
| `kind` | `agent` or `tool` (required) | none | `agent` runs work for a seat. `tool` is only called or probed; Seat Binding never picks it. | `bind.mjs:97`, `108`, `182`; the crate refuses a seat whose candidates are all tools (`not-an-agent-seat`, `rank.rs:228-244`) and skips a tool among agents (`rank.rs:251-257`); `mechanism.mjs:88-95`; `tool-registry.mjs:105` | standard line 14 `agent`; `gitnexus` and `herdr` `tool` |
| `description` | non-empty string | none | What the executor is. | Shown by `fgos tool query` (`tool-registry.mjs:117`). No behavioural reader. | every row |
| `providerModel` | non-empty string | inferred from the command by `familyOf` | The model family of the executor; the key into `modelPolicies`. | `executorFamily` `bind.mjs:48-54`; cross-provider test `resolve.mjs:422-425`; `llm-accounts.mjs:28-32`, `215`; doctor `executor-profile-warnings.mjs:34` | `glm` line 94: `z-ai` (note the executor id `glm` and the family `z-ai` differ) |
| `allowCrossProvider` | boolean | absent means false | Whether prompt content may leave the Claude ecosystem through this executor. A resolved cross-provider launch without `true` throws before any spawn. | `resolve.mjs:439-446`. The Rust crate does not read it (it is on the executor, not in the launch view). | `glm` line 69, `openai` line 99: `true` |
| `forceCliSpawn` | boolean | absent means false | Spawn through the CLI even where a native task would do. | `mechanism.mjs:93` | no row sets it |
| `agentType` | non-empty string | none | The native agent definition a command-less executor runs through the live Task tool. | `plan.mjs:527`; `resolve.mjs:372`; `confinement/policies.mjs:713` | no standard row sets it (tests do) |
| `model` | non-empty string | none | "Model of an executor that has its own vocabulary." | none found: UNCONFIRMED whether anything reads it | no row sets it |
| `carries` | `user-text` or `repo-content` | none | The content class the executor may be given. When set, the caller must declare what it carries; `repo-content` into `user-text` is refused. | `resolve.mjs:299-315`, `428` | no row sets it |
| `for` | non-empty list of non-empty strings | none | Capabilities a tool serves. Inert on an agent executor (doctor names it: `executor-profile-warnings.mjs:59-63`). Every entry must be a declared capability name or alias (`config.mjs:526-531`). | `tool-registry.mjs:106` (**only `for[0]`**); `resolve.mjs:57-62` (adds the entries as candidate names in the Work path); load check `config.mjs:527`. **Not read by `resolveExecutorAndOverrides`**, so it never binds a `decide --for` purpose (section 5). | `gitnexus`: `for: [impact-analysis]` (global `~/.fgos/config.yaml:34`, project `.fgos/config.yaml:131`) |
| `scanTarget` | non-empty string | none | Directory a tool scans; its existence and freshness is the presence probe for `mcp` tools. | `tool-registry.mjs:115`, `203-206` | `gitnexus`: `.gitnexus` |
| `responsibility` | non-empty string | none | The responsibility a tool fills (a label). | `tool-registry.mjs:116` | `gitnexus`: `Verification`; `herdr`: `Chrome` |
| `command` | non-empty string; global-only | none | The program to spawn when the executor has no `invocations`. Requires `args`. | `resolve.mjs:380-381`; `bind.mjs:90`; mechanism test `mechanism.mjs:83-90` | no standard row (all use `invocations`) |
| `args` | list of strings; global-only | none | Arguments for that program; `{prompt}` and `{model}` are replaced at launch. Requires `command`. | `resolve.mjs:389` | none |
| `adapter` | `cli-spawn` or `herdr-spawn` | `cli-spawn` (`plan.mjs:559`) | How the program is spawned. | `resolve.mjs:379-381`; `bind.mjs:432` | none at executor level (set per invocation) |
| `env` | map of name to string | none | Environment variables of the launch. A `BASE_URL`-style variable pointing outside Anthropic marks the launch cross-provider. | `resolve.mjs:397-416` | none at executor level |
| `permissionMode` | `ask` or `bypass`; global-only | none | Whether the worker asks before acting. `bypass` is refused unless the launch is fully confined. | `config.mjs:481-492`; `confinement/authority.mjs:386`, `458` | none at executor level |
| `promptDelivery` | `file-pointer` or `inline` | `inline` (`assignment-runner.mjs:990`; the env `FGOS_HERDR_PROMPT_DELIVERY` can override) | How the prompt reaches the worker. | `resolve.mjs:379`; `transport.mjs:221`; `assignment-runner.mjs:911`, `990` | none |
| `confinement` | launch confinement object (below) | none | Sandbox of the launch. | `resolve.mjs:379`; `confinement/request.mjs:420` | none at executor level |
| `interactiveMode` | object (below) | none | How a herdr pane runs the CLI interactively. | `registrations.mjs:2148`, `2316`; `setup/agent-cli-trust.mjs:49` | none at executor level |
| `identity` | object with `principalRef`, `runtimeBackendRef`, `trustDomain`, `egressClass` (all four required if present) | none | "Who the executor is for audit." | none found in `src/` or the Rust packages (only the schema, fixtures and a golden test); UNCONFIRMED whether audit reads it elsewhere | `claude` line 17 onward |
| `supports` | object (below) | none | What the executor can do. | partly: see below | `claude` line 22 onward |
| `supports.skills` | list of non-empty strings (min 1) | none (treated as empty) | Skills the executor can load; a unit that requires skills only binds to an executor listing them. | `bind.mjs:187`, `364`; doctor `setup/model-pool-checks.mjs:85-102` | global `~/.fgos/config.yaml:73-75`: claude `["ak:cook"]` |
| `supports.reasoningEffort` | list of `low`, `medium`, `high`, `max` (min 1) | none (all rendered levels) | Efforts the executor accepts; narrows the levels an invocation can render. | `bind.mjs:149`, `161` | `claude` line 22: `[low, medium, high]` |
| `supports.providerFamilies` | list of non-empty strings (min 1) | none | Provider families it can serve. | none found: UNCONFIRMED | `claude`: `[claude]` |
| `supports.systemPrompt` | boolean | none | Whether it takes a system prompt. | none found: UNCONFIRMED | `claude`: `false` |
| `supports.toolGating` | non-empty string | none | How its tools are gated. | none found: UNCONFIRMED | `claude`: `allowedTools` |
| `invocations` | list of invocation objects (min 1) | none | The ways to start the executor. | see 2.2 | every standard executor |

Executors may be partial in a higher layer: the global file declares `claude` and `glm` with only `supports.skills` (`~/.fgos/config.yaml:71-81`), and the project file declares `gemini` and `xai` with only a `description` (`.fgos/config.yaml:155-162`); the merge adds them to the standard entries.

### 2.2 Invocation properties (`executors.<id>.invocations[]`)

The schema is `$defs.invocation`. `via` is the only always-required key; `via: cli` additionally requires `command` and `args`; `via: mcp` requires `command`.

| Property | Type | Default | What it does | Read by | Example |
|---|---|---|---|---|---|
| `id` | non-empty string | none; the crate only sees invocations that have an id (`bind.mjs:155`) | Name of the invocation, unique within the executor (a duplicate is refused, `config.mjs:540-548`). `prefer` entries pin by this id. | `resolve.mjs:352`; `bind.mjs:155-164`, `431`; `config.mjs:706-715` | `claude-cli-bwrap`, `omp-herdr`, `codex-cli-bwrap` |
| `via` | `cli`, `task`, `mcp` (required) | none | How it runs. Only `cli` is ever spawned by `resolveExecutorConfig`; an executor with invocations but none `cli` throws (`resolve.mjs:350-360`). `mcp` is the hand-back route for tools. | `resolve.mjs:351-360`; `mechanism.mjs:83-90` (any `cli` invocation makes the executor out-of-process); `plan.mjs:357` | `cli`; `gitnexus`: `mcp` |
| `adapter` | `cli-spawn` or `herdr-spawn` | `cli-spawn` | The spawn driver; `herdr-spawn` runs it in a herdr pane. When this session runs inside herdr and a `herdr-spawn` invocation can carry the posture, `bind()` takes it as the default invocation. | `bind.mjs:170-171`, `432-441`; `resolve.mjs:379` | `claude-herdr-bwrap`: `herdr-spawn` |
| `command` | non-empty string; global-only | none (falls back to the executor's, then to `runner.executor.command`, `bind.mjs:90`) | The program to spawn, or for an `mcp` invocation its identifier. | `resolve.mjs:379`; `bind.mjs:90`; tool probe `tool-registry.mjs:111`, `199-201` | `claude`, `codex`, `pi`, `omp`; `gitnexus`: `mcp:gitnexus` |
| `args` | list of strings; global-only | none | Arguments; `{prompt}` and `{model}` are replaced. | `resolve.mjs:379`, `389` | `["-p", "{prompt}", "--model", "{model}", ...]` |
| `tools` | map capability name to non-empty MCP tool id | none | For an `mcp` invocation, the tool that serves each capability. Each key must be a declared capability (`config.mjs:502-508`). `decide` uses it to answer `in-process` with an `mcpTool`. | `plan.mjs:356-360`, `519-525` | `gitnexus`: `impact-analysis: mcp__gitnexus__impact` (global `~/.fgos/config.yaml:46-48`) |
| `env` | map name to string | none (executor's `env` is the fallback, `resolve.mjs:379`) | Launch environment. | `resolve.mjs:379`, `397` | `CLAUDE_CODE_FORCE_SESSION_PERSISTENCE: "1"` (line 43); `PI_CONFIG_DIR` for omp |
| `permissionMode` | `ask` or `bypass`; global-only | none | As in 2.1; `bypass` needs full confinement. | as 2.1 | none |
| `promptDelivery` | `file-pointer` or `inline` | `inline` | As in 2.1. | as 2.1 | none |
| `confinement` | launch confinement object | falls back to the executor's | Sandbox of the launch. | `resolve.mjs:379`; `confinement/request.mjs:420` | `{backend: bwrap}` (line 45) |
| `credentialStore` | object `{use, homeEnv, files?, sessionDir?}` (`use` and `homeEnv` required) | none | The CLI's login store, copied into the confined launch's private home. It needs a confined `cli` invocation (`config.mjs:509-514`). `sessionDir` is the folder where the CLI writes its transcript, copied into the run directory. | `provider-capacity.mjs:241-266`; `confinement/authority.mjs:767`; `drivers/bwrap.mjs:674`; `session-keep-declared.mjs:14` | claude line 38: `use: claude, homeEnv: CLAUDE_CONFIG_DIR, sessionDir: projects, files: [".credentials.json"]` |
| `interactiveMode` | object `{exitCommand (required), kind?, trustStore?}` | none | How a herdr pane runs the CLI: the exit command, the herdr agent kind (lowercase name), and the trust store format (`claude-json`, `codex-toml`, `agy`, `agy-json`) with an optional path. | `registrations.mjs:2148`, `2316`; `agent-cli-trust.mjs:49-51`; `authority.mjs:738` | line 61: `exitCommand: "/exit", kind: claude, trustStore.kind: claude-json` |
| `liveOutput` | object `{streamFlags, renderer}` (both required) | none | Flags that turn streaming on, and the renderer name. | `resolve.mjs:379`; `transport.mjs:205`; `assignment-runner.mjs:909` | no standard row sets it |
| `resourceBindings` | list | none | Older form of the login store, read only to infer one. | `provider-capacity.mjs:266` | none |

`launchConfinement` (the `confinement` object on an executor or invocation) is closed: `backend`, `privateHome`, `isolatedSession` (all three global-only), `ownWorktree` (merge rule tighten), `contract`, `controls` (global-only), `grants`, `networkFilter`. Only `backend` appears in the standard file (`backend: bwrap`).

### 2.3 What decides the mechanism of an executor

`decideExecutorDispatchMechanism` (`mechanism.mjs:82-95`): an executor that declares a `command`, an `adapter`, or any `via: cli` invocation is `out-of-process` always. Otherwise an `agent` executor is `in-process` when the caller declares `--has-live-task-access` and `out-of-process` when it does not (or when `forceCliSpawn` is true). A `tool` executor has no native mechanism, so it is `out-of-process`, except that `plan.mjs:519-525` upgrades it to `in-process` with an `mcpTool` when its `mcp` invocation has a `tools` entry for the purpose that was asked.

## 3. Related top-level runner keys that take part in choosing a seat

- `modelPolicies` (schema line 41): the model each family uses at each tier, by family then tier; a cell is a model id, `model@pool`, `{model, pool, effort}` or an ordered list. The crate reads the cells at the final tier (`policy.rs:329-336`). Standard example line 724 onward.
- `tierFallback` (schema line 61): per tier, the ordered list of families a seat walks after a failure; with no list the walk follows the rest of `prefer`. Also the last-resort `prefer` when no row names one (`policy.rs:195-205`; `rank.rs:645-680`). Standard example: `advanced: [gemini, deepseek, z-ai, claude, openai]`.
- `defaults.tier` (schema line 118): the tier when nothing else names one; standard value `standard` (`policy.rs:141-144`).
- `maxTier` (schema line 114): the global tier ceiling, used when the capability has none; absent means no ceiling. Standard: unset. The project file sets `flagship` (`.fgos/config.yaml:176`), which the live `explain` output shows as "not applied" for the examples below.
- `governance` (`disallowedProviders`, `disallowedExecutors`): read by `bind.mjs:131-138` from `runnerConfig.governance`, and by the dispatch policy through an `options` argument (`plan.mjs:75`, `executor-governance.mjs:25`). A disallowed executor is marked disallowed in the launch view and not chosen. **It has no entry in `core/config-schema` or `core/config-standard` (grep found none), so I could not confirm how a user sets it in a config file; UNCONFIRMED.** The tests set it directly on the config object (`test/runner/execution/bind.test.mjs:248`).
- `llmAccounts` (schema line 286): the account pools by pool then account id, each naming a login directory per CLI; global-only, lives in `~/.fgos/private/accounts.yaml`, values never printed here ([redacted]). `accountViewOf` (`bind.mjs:211-247`) and `provider-capacity.mjs:290` turn it into the pools a seat may lease from; `llm-accounts.mjs:53-64` reads it. The older `providers.<provider>.accounts` form is still read until every release reads `llmAccounts`.
- Not in your list but adjacent: the singular `runner.executor` (schema line 7) is the default executor (`command` plus `args`, detected from PATH when absent); `resolveExecutorAndOverrides` returns it for an empty name or for a name equal to its command (`resolve.mjs:231-236`), and `plan.mjs:158-161` pins it when no executor is named.

## 4. What "purpose" means

### 4.1 In code

"Purpose" is a parameter name, not a config key and not a second kind of object. It is the string a caller hands to the dispatch door to say what a dispatch is for. The places the word appears as an input:

- `fgos dispatch decide --for <purpose>` (`src/runner/dispatch/cli.mjs:171`, schema text: "Capability or purpose name to resolve when no executor is named", `command-registry.mjs:1549`).
- `compileDispatchPlan(cfg, { for: purpose, ... })` (`plan.mjs:416-478`).
- `resolveExecutorAndOverrides(cfg, executorIdOrPurpose)` (`resolve.mjs:226-266`). Its argument is deliberately either an executor id or a purpose. Resolution order: (1) a literal `cfg.executors[name]` entry wins; (2) an empty name returns the default executor; (3) a name equal to the default executor's command or first invocation also returns it; (4) `cfg.capabilities[name].prefer`, first entry only (`normalizePreferCandidates`, then `candidates[0]`), and the named executor must exist or it throws; (5) otherwise `{executorId: null, configured: false}`. Nothing else is consulted: there is no alias lookup and no executor `for` lookup in this function.
- `decide --for <label> --needs-soul`: the label is a free string used only as the lookup key and as the reported `capability`.

### 4.2 Is a purpose the same thing as a capability name?

In the data, a purpose is looked up as a key of `runner.capabilities`, so a purpose that has a row **is** a capability name. But the two sets are not the same:

- A purpose with no row is legal. It resolves to `configured: false`, and `decide` then answers `unavailable` (or, with `--needs-soul`, native `in-process`). Live: `decide --for pane-labeling` answers `unavailable` because that row has no `prefer`; `decide --for researcher --needs-soul --has-live-task-access` answers `in-process, configured: false`.
- A purpose that equals an executor id binds that executor directly and skips the capability catalog (step 1 of the order above). Live: `decide --for claude --needs-soul --has-live-task-access` answers `out-of-process, executorId claude`, and `decide --for glm ...` the same for `glm`. So a purpose and an executor id share one namespace, with the executor id winning.
- The `--for` flag documentation names the two together ("Capability or purpose name"), and the catalog doc says a capability's name never encodes a provider, model, tier or executor (`core/skills/_shared/capability-catalog.md`, "Catalog entries never pin provider/model/executor").
- There is no separate "purpose" registry, schema type or glossary entry. The seat-binding vocabulary table (`docs/platform/seat-binding/spec.md`, section 2) does not define the word; its term for the same string on a seat is "capability" (`ask.capability`, `unit.capability`).

So: a purpose is the string a caller passes; a capability is a config row that string may match; an executor id is a second thing the same string may match first.

### 4.3 Where purposes come from

1. **Skills and agent doctrine.** The shared dispatch fragments tell an agent to run `fgos dispatch decide --for <capability>` before dispatching (`core/skills/_shared/capability-matching.md:19`, `executor-dispatch-fallback.md:42-67`, `fgos-cook/SKILL.md:69`). The caller picks a canonical name such as `code:implement`, `code:review`, `advise`, `execute`.
2. **The Agent/Task hook.** `src/runner/dispatch/hook.mjs:41-62`: for every Agent/Task tool call the hook runs `decide --for <subagent_type> --needs-soul --has-live-task-access` (`subagent_type` defaults to `general-purpose`) and blocks the call unless the answer is `in-process`. Here the purpose is the agent type name, not a capability the author chose.
3. **Work stages.** `src/runner/work-compat.mjs:38-65` (`workCapabilityHints`) and `src/runner/work-dispatch.mjs:443-466` derive candidate names from the stage, its phase, its skill name, the item kind and role, then pick one by the rules in `resolve.mjs:28-133`. In the coding domain the execute stage maps to `code:implement`; for other stages the name is the step id, qualified with the domain (`coding:discover`).
4. **Workflow units.** Each unit in `core/workflows/*.yaml` declares `capability: <name>` (for example `delphi:propose`, `business:frame`); the standard file has one row per such name (lines 586 to 700).
5. **`fgos run`.** `--capability` defaults to `execute` (`src/runner/execution/run-request.mjs:216`). This door goes through `bind()` directly, not through `decide`'s first-`prefer` rule.
6. **Other CLI reads.** `fgos dispatch explain --for <capability>` (`src/runner/execution/explain.mjs:59`) and `fgos tool query --capability <name>` (the tool registry, which matches an executor's `for[0]`, not a capability row). Plan annotations `- unit: ... / capability: <name>` are checked by `plan-lint` against the catalog.

### 4.4 Four traced examples (live answers on this machine, 2026-11-14)

The effective config is standard, then global, then the project `.fgos/config.yaml`.

**A. `impact-analysis` (a tool executor).**

- Rows read: `capabilities.impact-analysis` has `description` and `aliases` in standard (line 348) and `prefer: gitnexus` only in the project file (`.fgos/config.yaml:20-23`, tracked at HEAD). `executors.gitnexus` is in the global file (`~/.fgos/config.yaml:25-49`) and the project file (`.fgos/config.yaml:122-135`): `kind: tool`, `for: [impact-analysis]`, `scanTarget: .gitnexus`, `responsibility: Verification`, one invocation `{via: mcp, command: mcp:gitnexus, tools: {impact-analysis: mcp__gitnexus__impact}}`.
- Path: `decide --for impact-analysis` runs `resolveExecutorAndOverrides` (`plan.mjs:475`): no executor named `impact-analysis`, so `capabilities.impact-analysis.prefer` gives `gitnexus`. The mechanism is out-of-process first (a tool has no native mechanism), then `mcpToolFor` finds `tools.impact-analysis` and `plan.mjs:519-525` upgrades it to in-process.
- Answer today: `mechanism: in-process`, `mcpTool: mcp__gitnexus__impact`, `executorId: gitnexus`, `configured: true`.
- `bind()` is not involved: `fgos dispatch explain --for impact-analysis` refuses with `not-an-agent-seat` ("every candidate is a tool executor; Seat Binding chooses agent seats only", `rank.rs:228-244`; the spec limits Seat Binding to agent seats, `docs/platform/seat-binding/spec.md:46`).
- Separate path: `fgos tool query --capability impact-analysis` reads only `executors.gitnexus.for[0]` and its first invocation, and reported status `missing` during this run (the `.gitnexus` scan target was not found by the probe).
- Without the project's `prefer: gitnexus` row (a project with only the global and standard layers) the standard row has no `prefer`, so by the code `decide --for impact-analysis` would answer `unavailable` / `selector.unregistered`. I did not run that case: UNCONFIRMED by execution.
- `pane-labeling` is the same shape but has no project row: standard line 351 has only a description, `herdr.for` is `[pane-labeling]`, and live `decide --for pane-labeling` answers `unavailable, configured: false`, while `fgos tool query --capability pane-labeling` finds `herdr` with status `present`.

**B. `decide --for <label> --needs-soul` from the Agent/Task hook.**

- Rows read: `executors[<subagent_type>]` and `capabilities[<subagent_type>]`; for ordinary agent types neither exists.
- Path: `hook.mjs:49` calls `decide(undefined, {for: subagentType, needsSoul: true, hasLiveTaskAccess: true})`. `resolveExecutorAndOverrides` returns nothing, so `plan.mjs:480-488` takes the `needsSoul` branch: native dispatch, `in-process`, `configured: false`, no executor.
- Live: `researcher`, `Explore`, `general-purpose` and `review` all answer `in-process, configured: false`; the hook allows them.
- Collisions change the verdict: a subagent type named `advise` matches `capabilities.advise.prefer[0]` (claude, `claude-cli-bwrap`) and answers `out-of-process, executorId claude`; one named `claude` or `glm` matches the executor id. In those cases the hook blocks the call and tells the caller to use `fgos run` (`hook.mjs:55-62`).

**C. `code:review`.**

- Rows read: `capabilities."code:review"` (standard line 409): `prefer` is openai pinned to `codex-cli-bwrap`, then claude pinned to `claude-cli-bwrap`; `confinement: {mode: required, policy: host-write-denied}`; `serves: {outputKind: finding, domain: code, mutates: false}`. Also the prefix row `capabilities."code:*"` (standard line 706: `tier: advanced`, `roles.red-team.prefer: [xai, claude, openai]`; the project file adds `roles.red-team.prefer [openai, xai]` and `roles.reviewer.prefer [xai, openai]`, `.fgos/config.yaml:92-108`). Executor `openai` (standard line 95; `providerModel: openai`, `allowCrossProvider: true`, invocations `codex-cli-bwrap`, `pi-herdr`, `codex-herdr`, `pi-cli-bwrap`). Model cell `modelPolicies.openai.advanced`.
- `decide` path: `prefer[0]` gives executor `openai` with invocation `codex-cli-bwrap` (`resolve.mjs:249-263`); it has `via: cli` invocations, so the mechanism is out-of-process; `resolveExecutorConfig` resolves the pinned invocation and passes the cross-provider gate because `allowCrossProvider` is true; then `bindWorkSeat` is asked with that executor pinned to fill tier and model.
- Answer today: `out-of-process`, `executorId: openai`, `configured: true`.
- `explain --for code:review` (the `bind()` view): executor `openai` (source `capabilities."code:review".prefer`), invocation `codex-cli-bwrap`, transport `cli`, tier `advanced` (source `capabilities."code:*".tier`), model `gpt-6.1-sol` (source `modelPolicies.openai.advanced`), pool `openai`; the global `maxTier: flagship` is "not applied".
- Difference worth noting: `decide` always reports `prefer[0]`; `bind()` ranks the whole list, skips executors that are disallowed, uninstalled, quarantined or unable to carry the posture, and walks on failure. Today both give openai.

**D. A Work stage (coding domain, execute stage).**

- Rows read: `domains/coding/workflows/feature.yaml:75-78` (stage `executing` has `skill: fgos-coding-implement`; `domains/coding/compiled.json:252`); `capabilities.fgos-coding-implement` (project `.fgos/config.yaml`, same pool as `code:implement`); `capabilities."code:implement"` (project override: `gemini` pinned to `omp-herdr`, then `deepseek`, `glm`, `claude`); `capabilities."code:*".tier`; `executors.gemini` (standard, invocations `omp-herdr` and `omp-cli-bwrap`); `modelPolicies.gemini`.
- Path: `workUnitFor` (`work-dispatch.mjs:443-466`): the executor id of the stage is its skill name `fgos-coding-implement` (`work-compat.mjs:24-28`); `resolveExecutorAndOverrides` finds `capabilities.fgos-coding-implement.prefer[0]` (gemini) and the result is used in two ways only: its `kind`/`for` feed the candidate list, and its executor id becomes a soft `prefer: [gemini]` on the Unit (`work-dispatch.mjs:502`, `515`). The capability name is chosen by `resolveCapabilityDetailsFromHints`: no explicit purpose, no confinement candidate, and the curated coding-execute candidate `code:implement` is the caller's preferred one, so rule 3 (`resolve.mjs:107-110`) picks `code:implement`. The Unit then goes through `bind()`.
- Answer today (`explain --for code:implement`, which has no unit `prefer`): executor `gemini` (source `capabilities."code:implement".prefer`), invocation `omp-herdr`, transport `herdr`, tier `advanced` (`capabilities."code:*".tier`), model `gemini-3.8-flash-high` (`modelPolicies.gemini.advanced`), account [redacted]; on failure it rotates gemini accounts, then `tierFallback.advanced`.
- Another stage for contrast: `coding:discover` has a standard row whose first `prefer` is `claude`; `decide --for coding:discover` answers `out-of-process, claude`, and `explain` shows claude, `claude-herdr-bwrap`, tier `advanced` from `capabilities."coding:*".tier`, model `sonnet`.
- Two rows (`fgos-coding-implement` and `code:implement`) carry the same pool by hand; nothing in code ties them together. This is observed in the project file, not a rule.

## 5. The "August D5 rule": an executor's own `for` never binds a purpose

The exact words are in two places and I could not find them in August.

**Where the sentence is.** `src/runner/dispatch/resolve.mjs:220-223` (inside the doc comment of `resolveExecutorAndOverrides`): "nothing found — `{executorId: null, configured: false}`, a legitimate, expected state, never thrown. An executor's own `for` never binds a purpose here: only `capabilities.<name>.prefer` does." It is pinned by the test at `test/runner/dispatch.test.mjs:2110`: "resolveExecutorAndOverrides never binds a purpose through an executor's own "for" -- only capabilities.<name>.prefer does". The sentence was added by commit 315612e46 on 2026-10-02 ("test: align retired-surface tests with the current contract"), whose body says: "Purpose resolution binds only through capabilities.<name>.prefer, so the dead for-scan resolver is removed and its fixtures declare prefer."

**What D5 actually says.** D5 is `docs/history/capability-capacity-remodel/CONTEXT.md:34` (tsk-1ai, commit 8f967ca1b, 2026-08-19). It does not contain that sentence. It removes the reverse requirement of the earlier D2: D2 had said a `capabilities.<name>.prefer` target must itself declare a `for` naming that capability (symmetry). D5 quote: "`capabilities.<name>.prefer` now names a real registered executor directly; the executor no longer needs to also self-declare a matching `for` entry." The reason it records: "the reverse check forced a second required config edit per wiring decision without a proportional safety benefit — the mechanical `for`-includes check never verified real fitness for a job, only that a matching string existed; a careless `prefer` edit could add a careless `for` entry just as easily." The trigger it records: the `fgos-coding-implement`/`agy` wiring was accidentally dropped by an unrelated cleanup commit (24819bb4); the user was shown "restore as-is" versus "remove the requirement" and chose removal. D5 also says a `prefer` naming a non-existent executor still throws, and the forward check (an executor's `for` entries must be real capability names) stays. The plan's Q1 text attributes the "never binds a purpose" statement to D5; the D5 text does not say it. UNCONFIRMED whether another August record says it.

**Timeline of `for` as a binder.**

1. Before 2026-08-16: executors declared `for` and `decide --for` found the first executor whose `for` included the purpose (`resolveExecutorIdForPurpose`, "first `for` match wins"; origin commits a989211aa 2026-08-17 rename and earlier).
2. 2026-08-16/17 (decision 0033 and D1/D2 of the remodel): `capabilities.<name>.prefer` added as the first lookup, with `for` symmetry required. Commit 3d5b8d444 (2026-08-17, tsk-34n) made `for` the only purpose field and gated the tool registry on `kind: tool`, after an agent executor with `for` was wrongly treated as a probeable tool.
3. 2026-08-19: D5 drops the symmetry requirement. The `for` scan still ran as the last fallback (`bindingSource: 'capability.for'`, the old order step 3).
4. 2026-08-25 (bd306946f, tsk-5x7-1): "Fix decide --for reading capabilities.prefer" and the first DispatchPlan.
5. 2026-10-01: the request-to-run execution-core plan (`plans/261001-0327-request-to-run-p1-execution-core/phase-07-coordination-path-on-bind.md:22`) lists "`executors.<id>.for` + the `capability.for` branch" for deletion. The red-team report flags that `tool-registry.mjs` reads `for` (`plans/261001-0327-request-to-run-track/reports/red-team-scope-complexity-critic.md:159`). Commit cfd670c43 (Wave D) empties the `for` scan and removes the `capability.for` branch from `resolveExecutorAndOverrides`.
6. 2026-10-02: 315612e46 deletes the dead scan function and writes the sentence above.

So since 2026-10-01 a tool-only purpose is bound by `capabilities.<name>.prefer` alone, while `for` on a tool remains live only for the tool registry and the Work-path candidate list. I found no decision narrative for step 5 beyond the plan lines and commit messages (checked `docs/platform/runner/spec.md` and `docs/platform/seat-binding/spec.md`: neither mentions `capability.for`); UNCONFIRMED whether one exists elsewhere.

The seat-binding spec states the related scope boundary in Vietnamese: a capability served by a tool executor ("ví dụ `impact-analysis` → `gitnexus`, `pane-labeling` → `herdr`") "giữ đường đi hiện có; Seat Binding không giải và không viết lại nó" (`docs/platform/seat-binding/spec.md:46`), meaning the tool path stays as it is and Seat Binding neither resolves nor rewrites it.

## 6. Limitations

- I ran only read-only commands (`fgos dispatch decide`, `explain`, `tool query`). My first attempt passed a whole flag string as one argument, and fgos recorded six invocation-fault lines in `.fgos/logs/invocation-faults.jsonl` (an untracked log); no config was changed.
- "Read by" lists were found by grep of `src/`, `bin/` and the Rust packages for the property name and by reading the call chains; a reader that builds a key name dynamically would be missed. "none found" is therefore a strong hint, not a proof.
- I did not run a project that has only global and standard layers, so the `unavailable` answer for `impact-analysis` there is derived from code.
- `governance` could not be tied to any schema or standard key.
- The `core/config-standard` file has no `persona`, `minCheckers`, `verify`, `personas` or `serves.needsIndependentReview/hasPlanOrTrack` examples, and no executor with `forceCliSpawn`, `agentType`, `carries`, `permissionMode`, `promptDelivery`, `liveOutput` or `model`; those rows rely on the schema text and code only.

## Unresolved questions

1. Does anything outside the paths searched read `executors.<id>.identity`, `supports.providerFamilies`, `supports.systemPrompt`, `supports.toolGating`, `executors.<id>.model` or `prefer[].crossProvider`? I found no reader.
2. How is `runner.governance` set in a real config file, given it has no schema or standard entry?
3. Is there a recorded decision (outside the 2026-10-01 plan and commit messages) for removing the `capability.for` branch, and does D5's date (2026-08-19) match the owner's memory of an "August rule", or does the owner mean the 2026-10-02 sentence?
4. Why do the `decide` help text ("via bind()") and the code (first `prefer` entry) differ on who chooses the executor? Only the code path is verified here.
