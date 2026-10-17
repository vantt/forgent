# Problem: model/tier selection picks expensive models for work that does not need them

Brief for an agent that will design a better selection mechanism. This file
describes the problem, the evidence and the constraints. It does not propose a
design.

## 1. What happened (2026-10-16)

On 2026-10-16 two 5-hour Claude subscription windows each ran out in under an hour:
13:30–13:53 and 18:30–19:07. All four in-flight leads (holder-lock 4.2,
lock-followups 4.4a/4.3, terminal-control 6.5, run-supervisor 6.2) stopped
mid-wave. About 8 of 11 frontier-tier worker runs died without a result, so
most of the spend produced nothing.

Where the spend went, from the session investigation:

| Source | Share / count | Mechanism |
|---|---|---|
| Leads passing `fgos run --override '{"tier":"frontier"}'` | lead 4.2: 9×, 6.2: 5×, followups: 4× | `frontier` → `modelPolicies.claude.frontier = fable`, for code **and** docs phases |
| 4–6 concurrent Opus in-process agents (leads) | lead terminal: 190 calls in 37 min | each relay or idle wake-up re-reads about 200k of context |
| Controller session context | about 440k per turn, about 21% of window 2 | long-running orchestrator never consolidates |
| Peer session on the same account | about 44% of W1, 18% of W2 | sonnet reviewers of another plan, with no shared budget view |

The owner judges that Sonnet is enough for coding; Opus and Fable are a misfit
for implementation work.

## 2. How tier and model are chosen today

There are three separate doors, and each one picks the model its own way.

### 2.1 `fgos run` / workflow units: `bind()` in `src/runner/execution/bind.mjs`

`bind()` picks the model in this order (around lines 385–432):

1. `effectiveRigor` = stronger of unit `rigor` and the capability's `rigor`. The
   default is `standard`.
2. `rigorToTier` maps it: low→nano, standard→standard, high→flagship,
   critical→frontier.
3. An `--override` tier is merged with `resolveStrongerTier(derived, override)`.
   **An override can only raise the tier, never lower it**, and nothing
   validates *who* may raise it or *why*.
4. `runner.maxTier` clamps the result if set. This key exists only here. It is
   not in the `fgos setup` config-merge, not checked by `fgos doctor`, and not
   in any spec, so it was undiscoverable. Until 2026-10-17 it was unset.
5. `resolveTierModel(runnerConfig, tier, providerFamily)` reads
   `runner.modelPolicies.<family>.<tier>`.

### 2.2 Assignment / work-item path: `src/runner/dispatch/assignment-policy.mjs`

This path has its own tier resolution, "strongest required tier, cannot be
weakened", and its own `rigorToTier` read. It does **not** read `maxTier`. So
the same project can get a different ceiling depending on the door.

### 2.3 In-process agents (Agent/Task tool)

These are not governed by fgOS config at all. The model comes from:

- the agent definition's frontmatter (`.claude/agents/*.md`: `planner`,
  `code-reviewer`, `brainstormer` = opus; `kongming`, `advisor` = fable;
  `fullstack-developer`, `debugger` = sonnet; `general-purpose` inherits the
  session model), or
- the caller's `model` argument.

The leads were `general-purpose` agents spawned from an Opus controller, so
they ran on Opus by inheritance. Nobody chose that on purpose.
`fgos dispatch decide --needs-soul` answers *where* the agent runs, not *which
model* it uses.

## 3. Why the current shape fails

1. **Tier says nothing about the kind of work.** One scalar (`nano…frontier`)
   is used for code edits, docs edits, design review and panels. A lead that
   wants "be careful" for a hard phase has only one knob, and it also raises
   cost for a docs phase in the same plan.
2. **Override is a one-way ratchet with no authority model.** Any caller,
   including a sub-lead agent, can raise to frontier. The config cannot say
   "workers on Sonnet; Opus only after two failed rounds; Fable only for design
   review". `maxTier` is a single global ceiling across every provider family,
   so it cannot express "cap claude at sonnet but allow gpt-6.1-sol".
3. **No per-capability tier ceiling.** The tier ladder is fine; what is missing
   is "code capabilities resolve to `advanced` at most". The only ceiling is the
   global `maxTier`, which also caps reviews and panels and every provider
   family.
4. **No escalation rule exists in code.** The intent "retry on a stronger model
   after N failures" lives only in prose and lead judgment. With no mechanism,
   leads pre-escalate to the top tier "to be safe".
5. **Cost is invisible at decision time.** `decide` and `bind` return
   `tier/model/tierSource` but no cost class, no remaining-quota signal and no
   per-account budget. Two sessions on one account cannot see each other's
   spend. A quota-exhausted window shows up only as dead runs (no stream
   output, killed after the idle timeout or an abrupt exit).
6. **In-process model choice sits outside the one door.** It breaks principle 7
   (single authority). Agent frontmatter, inheritance and caller arguments are
   three sources nobody reconciles with `modelPolicies`.
7. **Failures are expensive, not just runs.** A frontier run that dies at
   minute 40 spends the tokens and leaves nothing, because `claude -p` emits no
   progress until done. Without streaming (`--output-format stream-json`),
   neither the idle timeout nor the lead can tell "thinking" from "dead".
8. **Silent config traps make this worse.** For headless claude,
   per-invocation `args` are ignored in favor of `runner.executor.args`. Project
   config fully replaces global for some keys and merges others, so an operator
   cannot predict the effective model without running `bind()`.

## 4. Stop-gap applied on 2026-10-17 (not the design)

The owner clarified the rule.

- **The tier ladder is correct as configured:** advanced = Sonnet,
  flagship = Opus, frontier = Fable.
- **The fault is choosing a tier above `advanced` for coding.** Coding work
  belongs at `advanced`.

Final project `.fgos/config.json` state (commits `404b5c43b`, `d95da7c25`,
then the revert of the ladder change):

- `runner.modelPolicies.claude` is unchanged (`flagship: opus`).
- `runner.maxTier: "advanced"` is a **global** ceiling, used only because no
  per-capability ceiling exists.

Effect: every override above advanced is clamped. This was verified by calling
`bind()` with the committed config: no override → standard → sonnet;
`{tier:frontier}` → advanced → sonnet.

Known flaws of the stop-gap:

- It also caps non-code work (panels, reviews, other families such as
  gpt-6.1-sol) at advanced. It must be raised by hand before such a run.
- It does not touch the assignment-policy path or in-process agents.

## 5. Requirements for the new mechanism (from owner statements and the 7 principles)

- **Per-work-kind tier.** Code implement/fix resolves to `advanced` (Sonnet on
  claude). Design/architecture review may use flagship or frontier. Docs use a
  cheap tier. Express this as a per-capability default **and ceiling** in
  config. The family ladders stay as they are.
- **Escalation as a rule, not a caller whim.** For example: start at the
  capability's default; after N failed rounds on the same unit, step up one
  tier, capped by a per-capability ceiling. Record the reason in the unit's
  provenance.
- **Override authority.** Say who may raise a tier (owner/controller, not a
  sub-lead) and how far. A refused raise must be visible (a reason code), not
  silently clamped.
- **One authority for every door.** `bind()`, assignment-policy and the
  in-process `decide --needs-soul` answer must resolve the model from the same
  policy. In-process agents get a recommended model the caller passes to the
  Agent tool.
- **Discoverable.** Every new key goes through `fgos setup` config-merge and a
  `fgos doctor` check, and a spec section in `docs/specs/runner.md`. Global vs
  project precedence must be explicit.
- **Budget awareness (stretch).** Use a cost class per model and, if feasible,
  an account-level spend signal so concurrent sessions do not both burn the same
  window. At minimum, a concurrency cap per expensive tier.
- **Observability.** Streaming progress for headless claude, so a dead
  expensive run is detected in minutes, not at the idle timeout.
- **Smart selection, short config.** The intelligence lives in the selection
  code, not in the config file. The selection must meet every criterion above;
  the config stays as short and simple as possible, because developers avoid a
  config that is long or hard to write. Today the project
  `.fgos/config.json` is 1598 lines (10 executors, 25 invocations, 38
  capabilities) plus 371 lines of global config. Concretely:
  - The common case needs only a few lines: declaring "deepseek-v4-pro from
    service B with these accounts" must not require copying invocations or
    capability entries.
  - Every fact is written once. Defaults are inferred where the code can infer
    them (tier ladders, fallback order, account rotation), and the developer
    writes only what differs from the default.
  - Adding the supply layer (§5.1) must make the config shorter, not longer:
    the per-account invocation duplicates it removes outweigh the source entries
    it adds.
  - The effective result stays visible without reading code: a command shows
    what a (capability, tier) resolves to and why, so a short config never hides
    the outcome.

### 5.1 Supply layer: who serves a model, separate from what fgOS asks for

Added 2026-10-17 from an owner discussion. The selection mechanism works on
three layers that today's config mixes into each invocation's id and `env`:

| Layer | Who cares | Today |
|---|---|---|
| Capability: model family + tier | fgOS at run time | `modelPolicies.<family>.<tier>` |
| Supply: service provider, account, key | the developer | partly in global `providers.<p>.accounts`, partly in invocation ids and `env` (`pi-cli-tetnu`, `pi-cli-fgovn`, …) |
| Harness: binary and adapter | the developer | `executors.<id>.invocations[]`; already solves which harness can talk to which service, so it is out of scope here |

fgOS should only ask "family X at tier T". The developer declares where that
capability is served from and with which accounts. Neither side needs the other's
details.

Requirements for the supply layer:

- **Per-tier source.** One family's tiers may come from different service
  providers, even different companies. Example: `deepseek-v4-flash`
  (nano/standard) from service A with its own account and key, and
  `deepseek-v4-pro` (advanced and above) from service B. A (family, tier) may
  list one or more sources.
- **Model name per source.** The same model has different ids per service
  (`deepseek/deepseek-v4-pro` on OpenRouter, `deepseek-v4-pro` on the vendor
  API). The capability layer keeps one canonical name; each source maps it to
  its own id.
- **Change in one place.** Switching the source of one tier, or the harness of
  one family, is a single edit. No invocation is duplicated per account.
- **Account rotation per source.** Accounts belong to a source, not to an
  executor or an invocation id.

What already exists and must be kept (verified in code):

- **Account rotation on the same candidate:** `retrySameCandidate`
  (`src/runner/execution/bind.mjs`), provenance `kind: 'account-rotation'`.
  The same executor, invocation and tier run again on another account of the
  same provider.
- **Fallback to another family at the same tier:** `nextCandidate`
  (`src/runner/execution/bind.mjs`), called from `src/runner/execution/run.mjs`
  and `src/runner/dispatch/assignment-runner.mjs`. On a provider limit it walks
  to the next entry of `capabilities.<cap>.prefer`, skips families with a
  credential fault (`excludeFamilies`) and re-runs `bind()` with the same ask, so
  the tier is kept and the model is read from the new family's ladder (gemini
  `advanced` exhausted → claude `advanced` = sonnet). Provenance
  `kind: 'next-candidate'`. `allowCrossProvider` is only the egress permission,
  not this fallback.

Gaps in that fallback, which the supply layer must close:

- The fallback order is declared per capability (`prefer`), not per tier, so
  "advanced falls back deepseek-B → gemini → claude" cannot be expressed.
- "Equivalent intelligence" rests only on equal tier names across family
  ladders; it is as good as the person who keeps the ladders aligned.
- There is no step between account rotation and changing family. The required
  order is: **another account of the same source → another source of the same
  model → another family at the same tier.** Each step is recorded in the unit's
  provenance with its own `kind`.

### 5.2 Decided config shape (owner, 2026-10-17)

Settled in an owner discussion after two architecture-advisory runs
(`wf-run-1792174763920-e7cf2329`, reopened as `wf-run-1792195366223-9d3876e1`).
The council proposed replacing `executors` with new `sources` and `use` maps. The
owner rejected that, because `executors` is one concept shared with tool
executors (`gitnexus`, `herdr`). The shape below keeps `executors` and gives each
piece one question to answer:

| Piece | Answers | File |
|---|---|---|
| `capabilities.<cap>.prefer` | which families, in which order | project |
| `modelPolicies.<family>` | which model per tier, from which service provider (pool) | project or global |
| `executors.<id>` | which harness runs the family | project |
| `llmAccounts.<pool>` | which accounts a pool has, and where each CLI keeps its login | global only |

Decisions:

1. **`prefer` names a family**, not an executor.
2. **`modelPolicies.<family>.<tier>` is a string or an ordered list of
   `model` / `model@pool`.** Every key of `modelPolicies.<family>` is a tier and
   every value has this one grammar; there is no default-pool key. An entry
   without `@` uses the pool named after the family. Each entry carries the model
   id as that pool spells it (`deepseek-v4-flash@deepseek-api`,
   `deepseek/deepseek-v4-flash@openrouter`), so no id-mapping table exists; the
   part before `@` goes into the invocation's `{model}`. The entry is split at
   the **last** `@`, because some ids contain one (Vertex AI
   `claude-opus-4@20250514@vertex`); a pool name never contains `@`, and
   validation refuses one that does.
3. **A pool is a service provider's set of interchangeable accounts with one
   billing kind.** Usually one pool per service provider (`openrouter`,
   `deepseek-api`, `openai`). One provider splits into two pools when its
   accounts cannot stand in for each other, for example `claude` (subscription,
   5-hour window) and `anthropic-api` (pay per token). The spec calls it
   "service provider (account pool)"; config never names it `provider`, which
   would read as `providerModel`. The list order inside a tier is fallback
   order, not load balancing: the next pool is used only when the previous one
   has no usable account. Load is balanced only among accounts of one pool, by
   today's least-lease then least-recently-used ranking. Fallback never leaves
   the tier, and two ids in one tier cell are equivalent because the owner put
   them there; provenance and `explain` record the id that ran and its pool.
4. **One family has exactly one executor.** An executor carries
   `providerModel` and its `invocations` only; it has no pool field. Transport
   (cli or herdr), harness (codex, pi, omp) and confinement are invocations of
   that one executor, picked by the existing `bind()` rules. Config validation
   refuses two executors with the same `providerModel` and names both.
5. **Accounts move to `runner.llmAccounts.<pool>.<account>` in the global config
   only.** An account holds `credentialStore: { <store>: <path> }` plus optional
   `label` and `disabled`. Store directories stay where each CLI keeps them; no
   machine-wide layout change and no directory per project.
6. **An invocation declares `credentialStore: { use, homeEnv, files? }`.** `use`
   names the store key to read inside the account, `homeEnv` the variable the
   copied private home is bound to, and `files` every file the CLI may need; the
   runner copies the ones present, and an account with none of them is unusable
   rather than run with an empty home. It replaces the hard-coded store path in
   `env` and the `private-home` entry in `resourceBindings`. Invocations no
   longer carry an account name, so `executors.openai` drops from 9 invocations
   to 3.
7. **A pool and an executor match through store keys.** An invocation with
   `use: "codex"` runs only with accounts that have `credentialStore.codex`,
   whatever pool they are in. Adding a pool to a family touches `llmAccounts` and
   `modelPolicies`, never the executor. A tier entry naming a pool where no
   account matches any invocation of the family's executor is reported by
   `fgos dispatch explain` and `fgos doctor`.
8. **The new release also reads `runner.providers.*.accounts` for a transition
   period.** fgOS is installed globally and runs other projects on older
   releases, so the old inventory stays readable until they move.

Rejected alternatives: `model@pool:executor` (no case in the current config
needs a second executor per family; a harness per pool is already expressed by
which stores the pool's accounts have); a default-pool key inside
`modelPolicies.<family>` (a non-tier key among tiers; writing `@pool` in each
cell is longer but uniform and explicit); a separate `modelSources` map keyed by
model (the owner preferred the simpler per-tier form); an `accountPool` field on
the executor (it put a supply fact on the harness layer).

Prerequisites found in the current config:

- `claude` and `claude-herdr` are split only because `claude` has no herdr
  invocation (the "merged with `runner.executor`" reason in its description is
  stale, see 5.3); 26 capabilities name `claude-herdr`.
- `glm` and `glm-herdr` differ only in transport and merge into one executor.
- The gemini invocations pass no `--model {model}`; the omp profile fixes the
  model, so `modelPolicies.gemini` has no effect today.
- Today an unpinned lease picks among all accounts and refuses a missing CLI
  store late, at `credential-provisioning` (RUL80). Account selection must filter
  by the chosen invocation's `credentialStore.use`, or rotation trips over
  unusable accounts.

How the pieces join at run time:

```
capabilities.<cap>.prefer            -> family, in order
modelPolicies.<family>.<tier>        -> [model | model@pool, ...]   (source order; no @ = pool named after the family)
executors (providerModel = family)   -> the family's one executor -> invocation by bind() rules
invocation.credentialStore.use       -> llmAccounts.<pool>.<account>.credentialStore.<use>
invocation.credentialStore.homeEnv   <- private-home copy of that store path
```

Recovery order: another account of the same pool (an account without the
invocation's store, or `disabled`, is skipped), then the next entry of the same
tier, then the next family of `prefer` at the same tier.

Full example. Global `~/.fgos/config.json`:

```json
{
  "runner": {
    "llmAccounts": {
      "openai": {
        "tetnu":   { "credentialStore": { "codex": "${HOME}/.codex-tetnu",
                                          "pi":    "${HOME}/.pi/accounts/openai-tetnu" } },
        "tetcu72": { "label": "tetcu72 (Plus)",
                     "credentialStore": { "codex": "${HOME}/.codex-tetcu72",
                                          "pi":    "${HOME}/.pi/accounts/openai-tetcu72" } },
        "fgovn":   { "disabled": true,
                     "credentialStore": { "codex": "${HOME}/.codex-fgovn" } }
      },
      "openrouter": {
        "or-a": { "credentialStore": { "pi": "${HOME}/.pi/accounts/openrouter" } }
      },
      "deepseek-api": {
        "main": { "credentialStore": { "pi": "${HOME}/.pi/accounts/deepseek-main" } }
      }
    }
  }
}
```

Project `.fgos/config.json`:

```json
{
  "runner": {
    "capabilities": {
      "review": {
        "prefer": ["deepseek", "openai", "claude"],
        "serves": { "outputKind": "report", "mutates": false },
        "rigor": "standard"
      }
    },
    "modelPolicies": {
      "deepseek": {
        "nano":     "deepseek-v4-flash@deepseek-api",
        "standard": ["deepseek-v4-flash@deepseek-api", "deepseek/deepseek-v4-flash@openrouter"],
        "advanced": ["deepseek/deepseek-v4-pro@openrouter", "deepseek-v4-pro@deepseek-api"],
        "flagship": "deepseek/deepseek-v4-pro@openrouter",
        "frontier": "deepseek/deepseek-v4-pro@openrouter"
      },
      "z-ai": { "standard": "z-ai/glm-5.3@openrouter", "advanced": "z-ai/glm-5.3@openrouter" },
      "claude": { "advanced": "sonnet", "flagship": "opus", "frontier": "fable" }
    },
    "rigorToTier": { "low": "nano", "standard": "standard", "high": "flagship", "critical": "frontier" },
    "maxTier": "advanced",
    "executors": {
      "openai": {
        "kind": "agent", "providerModel": "openai", "allowCrossProvider": true,
        "invocations": [
          { "id": "codex-cli-bwrap", "via": "cli", "adapter": "cli-spawn", "command": "codex",
            "args": ["exec", "--skip-git-repo-check", "-s", "danger-full-access", "--model", "{model}", "{prompt}"],
            "confinement": { "backend": "bwrap" },
            "credentialStore": { "use": "codex", "homeEnv": "CODEX_HOME" } },
          { "id": "codex-herdr", "via": "cli", "adapter": "herdr-spawn", "command": "codex",
            "args": ["-s", "danger-full-access", "-a", "never", "--no-daemon", "--model", "{model}"],
            "confinement": { "backend": "bwrap" },
            "interactiveMode": { "exitCommand": "/quit", "kind": "codex", "trustStore": { "kind": "codex-toml" } },
            "credentialStore": { "use": "codex", "homeEnv": "CODEX_HOME" } },
          { "id": "pi-cli-bwrap", "via": "cli", "adapter": "cli-spawn", "command": "pi",
            "args": ["--model", "{model}", "--thinking", "medium", "--tools", "read,write,edit,bash,grep,find,ls", "--mode", "json", "--approve", "-p", "{prompt}"],
            "confinement": { "backend": "bwrap" },
            "credentialStore": { "use": "pi", "homeEnv": "PI_CODING_AGENT_DIR", "files": ["auth.json"] } }
        ]
      },
      "deepseek": {
        "kind": "agent", "providerModel": "deepseek", "allowCrossProvider": true,
        "invocations": [
          { "id": "pi-cli-bwrap", "via": "cli", "adapter": "cli-spawn", "command": "pi",
            "args": ["--model", "{model}", "--thinking", "medium", "--tools", "read,write,edit,bash,grep,find,ls", "--mode", "json", "--approve", "-p", "{prompt}"],
            "confinement": { "backend": "bwrap" },
            "credentialStore": { "use": "pi", "homeEnv": "PI_CODING_AGENT_DIR", "files": ["settings.json"] } },
          { "id": "pi-herdr", "via": "cli", "adapter": "herdr-spawn", "command": "pi",
            "args": ["--model", "{model}", "--thinking", "medium", "--tools", "read,write,edit,bash,grep,find,ls", "--approve"],
            "confinement": { "backend": "bwrap" },
            "interactiveMode": { "exitCommand": "/quit", "kind": "pi" },
            "credentialStore": { "use": "pi", "homeEnv": "PI_CODING_AGENT_DIR", "files": ["settings.json"] } }
        ]
      }
    }
  }
}
```

Assumptions the spike must check: the deepseek vendor API runs through `pi`
with its key in the store's `settings.json`; `${HOME}/.pi/accounts/deepseek-main`
does not exist yet; the three unconfined openai invocations
(`codex-cli-bypass-fgovn`, `pi-cli-<account>`) have no remaining caller.

### 5.3 Impact review and order of work (2026-10-17)

Two read-only `rfc` reviews checked 5.2 against the code, both configs, the
specs and the in-flight plans. The first (producer on claude,
`unit-run-1792205702240-a1927d84`) wrote the assessment; its checkers were
refused because the `advise` capability serves only claude. The second
(`unit-run-1792206977582-39f8e89a`: producer xai, reviewer and red-team
deepseek) verified it claim by claim. Both reached the same verdict: **start
only an additive slice; the account/lease half and the confinement half wait.**

Corrections the verification made to earlier statements:

- `executors.claude` declares no `providerModel`; only `claude-herdr` declares
  `claude`. `glm` and `glm-herdr` both declare `z-ai`.
- The "merged with `runner.executor`, loses its invocations" reason in
  `claude-herdr`'s description is stale: `resolveExecutorAndOverrides`
  (`src/runner/dispatch/resolve.mjs:270-276`) returns the entry verbatim. The only
  real reason for the split is that `claude` has no herdr invocation.
- 26 capabilities name `claude-herdr`, and 27 `prefer` entries pin an invocation
  (21 glm `pi-cli-bwrap-openrouter`, 3 gemini, 2 codex, 1 claude).
- `261014-1400-two-doors-one-rununit` is complete (commit `cb0acb254`) despite
  `status: pending`. No `261016-*` plan has code on main and none has a worktree
  on this machine; the collisions below are with the files those plans declare
  they will change.

Findings the shape does not settle yet: the global config has no claude
accounts; `bind()` falls back to model `default` on a missing tier cell
(`bind.mjs:421-433`) while `assignment-policy` throws and ignores `maxTier`
entirely; in-process agent models (`.claude/agents/*.md`) stay outside
`modelPolicies`; tier ceilings, escalation and override authority (section 5)
are not part of 5.2.

**Wave 0. Decide, no code.** Record the answers in `docs/specs/runner.md`. Every
core change in wave B depends on them.

1. Where account health reaches source choice: inside `bind()`, or in a lease
   walk over the tier entries after `bind()` (then the model id must be
   recomputed, because each pool spells it differently).
2. Whether changing pool inside one tier re-chooses the invocation (the first
   pool's accounts may hold only a `pi` store while `bind()` chose codex).
3. Whether a pool declares its billing kind, and whether fallback from a
   subscription pool to a pay-per-token pool needs an explicit opt-in.
4. Where the 27 invocation pins in `prefer` go once `prefer` names a family.
5. How an account that is an environment-variable API key is expressed (glm
   reads `GLM_OPENROUTER_API_KEY` today).
6. Whether a credential fault excludes a family or only a pool
   (`credentialFaultFamilies`, `src/runner/execution/account-rotation.mjs:55-68`,
   excludes the family, so a dead OpenRouter key also skips a healthy
   `deepseek-api` entry).
7. Whether pool names pass through `normalizeProviderFamily`
   (`src/runner/dispatch/provider-adapter.mjs:82-101`), which maps `openai` to
   `openai-codex` and `glm` to `z-ai`.

**Wave A. Start now, additive, no file owned by an in-flight plan.**

- **A1. Config cleanup so "one family, one executor" holds.** Merge `glm-herdr`
  into `glm`. Add a herdr invocation to `claude`, point the 26 capabilities at
  `claude`, delete `claude-herdr` and its stale description. Add
  `--model {model}` to the gemini invocations. File: `.fgos/config.json` only.
  Proof: `fgos dispatch decide` for every affected capability gives the same
  mechanism and invocation before and after. The owner's uncommitted gemini
  edit to that file must land first.
- **A2. Tier-cell reader and one model rule.** A pure module reads a cell as a
  string or a list of `model` / `model@pool`, split at the last `@`; old callers
  still get a string. `supportsPolicyTier` accepts a list. The validator allows
  lists in the project config only, never in the global config (an older release
  throws on a list there, for every project on the machine). A missing tier cell
  is refused with a reason code instead of falling back to `default`. Files:
  `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/config.mjs`, the model
  step of `src/runner/execution/bind.mjs`.
- **A3. `llmAccounts` reader beside the old inventory.** A new file reads
  `runner.llmAccounts` and returns the exact shape `providerAccountInventory`
  returns today, merged with `runner.providers`; lease and quarantine keys do not
  change. Older releases ignore the key (no reference in `src/`). One call line
  in `src/runner/dispatch/provider-capacity.mjs:234`, a file holder-lock P09 will
  rewrite: a small, announced merge conflict.
- **A4. Read-only checks.** `fgos dispatch explain` prints family, tier cell,
  pool, account and store, each marked declared, inferred or refused. New doctor
  checks: duplicate `providerModel`, a pool missing from `llmAccounts`, a pool
  with no account matching the executor's stores, a pool name containing `@`.
  Files: `src/setup/registrations.mjs`, `docs/specs/runner.md`, `CHANGELOG.md`.
  The final phase of every `261016-*` plan edits these three files, so these
  changes go in small separate commits.

**Wave B. Wait for the in-flight plans that own the same code.**

| Work | Waits for | Why |
|---|---|---|
| B1. Pool-keyed lease, state and quarantine; rotation filtered by `credentialStore.use`; account pin as `pool/account` | holder-lock P09 | P09 rewrites the lock functions of `provider-capacity.mjs` (`withFileLock`, `acquireAccountLock`, the generation-lock block); doing B1 first forces P09 to rebase its lock cutover |
| B2. `credentialStore {use, homeEnv, files}` in `confinement-request.v1` and the bwrap driver, replacing `env` and `resourceBindings` | run-supervisor P07-P09, terminal-mode P05-P06 | They change `authority.mjs`, `drivers/bwrap.mjs`, `transport.mjs`, `assignment-runner.mjs` and `provider-credential-renewal.mjs`, the credential path itself |
| B3. The source-fallback step (provenance `source-rotation`) between account rotation and family change | controller-death P02 | P02 changes the attempt and resume bookkeeping in `run.mjs` where the new step records its provenance |

B1 and B3 also need wave-0 answers 1, 2 and 6; B1 and B2 need 3, 5 and 7. If the
owner shelves a `261016-*` plan for long, its wave-B item may start earlier, and
that plan records that it rebases onto this change.

**Wave C. Wait until a release that reads `llmAccounts` is active for every
project on the machine.**

- C1. `prefer` names a family, with the 27 pins placed per answer 4.
- C2. Move the accounts in `~/.fgos/config.json` to `llmAccounts`, delete
  `runner.providers`, and allow lists and `@` in the global `modelPolicies`.

Why: every project on the machine reads the global config; one still on an
older release would refuse it or run the wrong model. RUL80 records the same
lesson: change the inventory only after the release that reads it is active.

**Out of scope here.** Per-capability tier ceilings, escalation rules, override
authority, `assignment-policy` ignoring `maxTier`, and in-process agent models
are the part of section 5 that addresses the cost incident itself. They become a
separate item, so they do not block the waves above.

## 6. Constraints

- **Single user, no backward compatibility:** delete old surfaces in the same
  change (no aliases). Exception decided in 5.2 item 8: the account inventory
  keeps a read path for `runner.providers.*.accounts`, because other projects run
  older fgOS releases against the same machine-wide config.
- **One Door:** `fgos run` / `workflow start` stay the only execution doors.
- **Do not edit other people's tooling** (ak/ck/rtk, Claude Code itself).
  Design around them.
- **No test-only switches.** Proof is real `bind()` resolution tests against
  the committed config.

## 7. Evidence pointers

- Tier logic: `src/runner/execution/bind.mjs:385-432`;
  `src/runner/dispatch/assignment-policy.mjs:11,107-115,253,314`;
  `src/runner/work-dispatch.mjs:346`.
- Config: `.fgos/config.json` `runner.{modelPolicies,rigorToTier,maxTier,executor}`;
  `~/.fgos/config.json` (global ladder differs: `claude.flagship=sonnet`,
  `frontier=opus`).
- Agent frontmatter: `.claude/agents/*.md` (`model:` lines).
- Quota investigation: session memory
  `project_low_level_standardization_round_2026_10_15.md`.

## Unresolved questions

- Which capabilities get which ceiling (code → advanced is decided by the
  owner; review/advise/panel → ?).
- Is an account-level spend signal obtainable from the providers at all, or
  only estimable from local run logs?
- Should leads (in-process orchestrators) be capped by the same policy, or by a
  separate "orchestrator" capability?
- Is the cross-family fallback order declared per tier only, or can a capability
  still narrow it (for example a review that must never leave claude)?
- Is cross-family fallback on by default, or only when allowlisted (the council's
  provisional default is off)?
- Does account rotation follow the declared order in `llmAccounts`, or keep
  today's least-lease then least-recently-used ranking
  (`rankProviderAccounts`, `src/runner/dispatch/provider-capacity.mjs:806`)?
- When the provider serving the tier a capability needs is unavailable, may that
  capability switch straight to another family at the same tier? Today the order
  is implicit and fixed: rotate accounts within the same family first, change
  family only after that. Should the order be configurable per capability or per
  tier (for example "change family first, rotate accounts later"), and who
  declares it?
