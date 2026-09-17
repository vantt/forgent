# Provider capacity rotator — target design

Status: target architecture and discussion record, not the implementation
contract for slice 1.

Date: 2026-09-16.

## Implementation status audit (2026-09-17)

Re-checked against the current codebase (`src/runner/dispatch/provider-capacity.mjs`
et al., plus the `model-tier-vocabulary-and-coordination-fallback` track that
landed on 2026-09-17). Each `##` section below now carries an inline
**[Implemented]** / **[Partially implemented]** / **[Not implemented]**
marker with a one-line evidence pointer. Summary:

- **Implemented**: 6-value `modelTier` vocabulary (§Tier vocabulary — was the
  biggest gap `plan.md` itself flagged as blocking; landed this session);
  provider/account inventory shape + validation; LRU/sticky/lease/quarantine
  selector; runtime state file; dispatch integration point (after
  `admitRunAttempt`, keyed by `runId`, exactly the "slice 1" narrower
  integration this doc itself calls for); secret-free evidence + redaction;
  `fgos dispatch inspect --provider-capacity`.
- **Partially implemented**: fault classification (2 of 5 classes have real
  quarantine logic — quota and auth; the other 3 the design's own table
  already marks "no account quarantine", so only `provider-unavailable`/
  transient-network is a genuine gap); the account shape omits `env`/
  `accountEnvKeys` entirely — credential handoff took a different,
  simpler path (direct `auth.json` copy into a confined home,
  `confinement/drivers/bwrap.mjs`) instead of env-var overlay, same safety
  goal, different mechanism.
- **Not implemented**: `runner.providers.<provider>.models` /
  `providerFallback` / `providerRuntimes` / `accountEnvKeys` as config
  (still code-level or absent — `providerRuntimes`' goal was independently
  solved by executor-id-consolidation's `invocations[]` instead, an
  **incompatible** shape that any future revival must reconcile with, not
  bolt this design onto); capability target vocabulary (`preferProvider`/
  `minModelTier`/`runtimeClass`/`allowProviderFallback` — capabilities still
  use the legacy `prefer`/`overrides.providerModel`/`rigorOverrides`
  bridge); `executionKind` discriminator as a formal field; all 6 named
  doctor checks; setup defaults for `runner.providers`;
  `legacyExecutorRuntimeProjection`; real provider accounts actually
  configured anywhere (neither `.fgos/config.json` nor `~/.fgos/config.json`
  declares `runner.providers` today — the mechanism is built and tested but
  not yet activated for real dogfood use, "Recommendation" item 7).

Implementation contract: use `plan.md`. Independent reviews found blockers in
the earlier draft: the current `codex-bwrap` credential path ignores
`CODEX_HOME` account overlays, the six-level `modelTier` bridge to live
`modelPolicies` is undefined, and selection must happen after Run admission.
Sections below may describe target architecture; slice 1 is deliberately
smaller and is defined only by `plan.md`.

This document supersedes the first draft in this directory. The first draft
placed account pools too close to executors and capabilities. The settled
direction from discussion is stricter: **capability produces execution need;
provider/modelTier capacity chooses account/model; provider/runtime posture
chooses executor/invocation.**

## Context read

- `AGENTS.md`
- `docs/specs/reading-map.md`
- `docs/specs/runner.md`
- `docs/routing-handoff-contract.md`
- `docs/distribution-vision.md`
- `docs/specs/distribution.md`
- `plans/260915-executor-policy-dispatch-seams/design.md`
- `plans/260915-executor-policy-dispatch-seams/plan.md`
- `plans/reports/executor-policy-baseline-260915.md`
- current dispatch source around assignment policy, dispatch plan, executor
  resolution, transport, Run evidence, and effective execution contract.

## Problem

fgOS currently lets executor identity carry too many unrelated decisions:

- role/persona/read-only posture, for example `claude-reviewer`;
- provider/model/modelTier/effort, via executor args and `rigorOverrides`;
- adapter/visibility, for example `*-herdr`;
- confinement envelope, for example `*-bwrap`;
- account/profile/home binding, for example repeated
  `CODEX_HOME=${HOME}/.codex-fgovn`.

The operational failure is quota concentration. The architecture failure is
that the system can only express "run this executor", while the real flow is:

```text
capability / assignment policy -> provider + modelTier + runtime posture
provider + modelTier           -> model + account capacity
provider + runtime posture     -> executor / invocation
```

The rotator must not become another capability registry, role registry, or
executor registry.

## Core decision

Rename the concept from account rotator to **Provider Capacity Rotator**.

The rotator answers only this question:

```text
Given desired provider + modelTier, which provider/model/account should this
attempt use, preferring accounts inside the desired provider and falling back to
providers that declare the same modelTier only when explicitly allowed?
```

It does **not** answer:

- which capability is being served;
- whether this is review, red-team, doer, advisor, or debug;
- whether the run is read-only or mutating;
- which concrete executor id should be spawned.

Those belong to higher policy/runtime layers.

## Dependency direction

The dependency direction is fixed:

```text
Capability / Assignment / Work
  -> EffectiveExecutionNeed
       providerPreference
       modelTier
       runtimeClass / visibility / confinement posture
       fallback allowance
  -> ProviderCapacitySelection
       selected provider
       selected model for same modelTier
       selected provider account/profile
       account env overlay
  -> RuntimeResolution
       executor / invocation for selected provider + runtimeClass
  -> Launch
       command/args from executor
       model from provider capacity selection
       env overlay from account profile
```

There is no direct arrow:

```text
executor -> account
account  -> executor
capability -> account
```

Executor and account are siblings. They meet only in a materialized Run.

`EffectiveExecutionNeed` is an internal runtime contract between the existing
policy/capability resolver and dispatch planning. It is not a new user-facing
config block. Config should declare durable facts (`providers`,
`providerFallback`, `providerRuntimes`); code derives the effective need per
run.

## Tier vocabulary

**[Implemented, 2026-09-17]** `MODEL_POLICY_TIERS`/`MIN_TIER_VALUES`
(`src/runner/dispatch/config.mjs`, `src/runner/definitions/schema.mjs`) are
exactly this 6-value vocabulary. `policyTier`/`effort` as separate axes are
also real (`assignment-policy.mjs`'s `TIER_STRENGTH`/`REASONING_EFFORT_VALUES`).

Use three separate words:

- `policyTier`: upstream/legacy policy input from Work, capability, or caller
  intent. It can be `light`, `standard`, `heavy`, or today's policy vocabulary.
- `modelTier`: fgOS' cross-provider equivalence tier. Provider fallback compares
  this value only.
- `effort`: provider-local reasoning/compute knob. It may render into a provider
  option, but it does not define cross-provider equivalence.

The fixed `modelTier` vocabulary is:

```text
nano | mini | standard | advanced | flagship | frontier
```

This is an fgOS normalization layer, not a claim that every provider publicly
offers exactly six tiers. Each provider maps its own models into these six
fixed equivalence tiers. A provider may map several tiers to the same model,
declare only a subset, or attach provider-specific `effort` values. Missing
`modelTier` means fail closed for that provider/fallback candidate.

Validation must reject unknown `modelTier` keys. Custom provider naming belongs
inside the provider's model values/options, not in the cross-provider
equivalence vocabulary.

## Initial provider mapping

**[Partially implemented]** Tier vocabulary matches; the live model choices
in `.fgos/config.json`'s `modelPolicies` are the repo's own operator
baseline (real gpt-5.6-luna/terra/sol, sonnet/opus, gemini-3.x names) and
intentionally do not copy this table's illustrative names verbatim — matches
the doc's own framing ("operator policy baseline, not a benchmark claim").
`mini` is not populated by any current provider; `advanced`/`flagship` collapse
to the same model on 3 of 4 providers, same as this table's own claude column.

This table is an operator policy baseline, not a benchmark claim. It is useful
because every provider maps into the same six fixed `modelTier` names, while
provider-specific model names and thinking budgets stay provider-local.

| Tier | OpenAI / Codex | Claude | Google / agy | GLM / Z.AI | DeepSeek |
|---|---|---|---|---|---|
| `nano` | GPT-5.6 Luna | omit | Gemini 3.5 Flash-Lite | GLM-4.7 Flash | omit |
| `mini` | GPT-5.6 Luna | Haiku | Gemini 3.1 Flash-Lite | GLM-4.7 FlashX / 4.5 Air | DeepSeek V4 Flash non-thinking |
| `standard` | GPT-5.6 Terra | Sonnet | Gemini 3.8 Flash | GLM-4.7 | DeepSeek V4 Flash thinking |
| `advanced` | GPT-5.6 Sol medium | Opus medium | Gemini 3.1 Pro | GLM-5 | DeepSeek V4 Pro low/high |
| `flagship` | GPT-5.6 Sol high/max | Opus high | Gemini 3.1 Pro high-thinking | GLM-5.1 | DeepSeek V4 Pro max |
| `frontier` | GPT-6 Astra | specialized frontier Claude | Gemini 3.1 Pro max* | GLM-5.1 long-horizon* | DeepSeek V4 Pro max* |

`frontier` entries marked `*` are opt-in operator mappings, not automatic
provider equivalence. They are acceptable when the operator wants that provider
to stand in for frontier work despite using the same underlying family as
`flagship`.

For current dogfood config, reflect the models actually available to the local
executors first; newer names can be adopted by editing the provider model table,
without changing executor identities:

```jsonc
{
  "openai-codex": {
    "models": {
      "nano": "gpt-5.6-luna",
      "mini": "gpt-5.6-luna",
      "standard": "gpt-5.6-terra",
      "advanced": { "model": "gpt-5.6-sol", "effort": "medium" },
      "flagship": "gpt-5.6-sol",
      "frontier": "gpt-6-astra"
    }
  },
  "claude": {
    "models": {
      "mini": "haiku",
      "standard": "sonnet",
      "advanced": "sonnet",
      "flagship": "opus"
    }
  },
  "gemini": {
    "models": {
      "nano": "gemini-3.5-flash-lite",
      "mini": "gemini-3.1-flash-lite",
      "standard": "gemini-3.8-flash",
      "advanced": "gemini-3.1-pro",
      "flagship": { "model": "gemini-3.1-pro", "effort": "high-thinking" }
    }
  },
  "z-ai": {
    "models": {
      "standard": "glm-4.7",
      "advanced": "glm-5",
      "flagship": "glm-5.1"
    }
  }
}
```

If the currently available OpenAI/Codex model is `gpt-5.5`, map it as
`flagship` for today's config and reserve `frontier` for Astra/Sol-max style
operator opt-in. The important invariant is that model availability changes the
provider table, not executor identity.

## Existing capability in context

**[Not implemented]** Capabilities still bind through the legacy `prefer`/
`overrides.providerModel`/`rigorOverrides` bridge this section itself calls
out as "a legacy bridge" -- `preferProvider`/`minModelTier`/`runtimeClass`/
`allowProviderFallback` do not exist anywhere in `src/`.

`runner.capabilities` stays important, but it lives above the rotator.

Capability may influence:

- provider preference;
- minimum `modelTier` / model rigor;
- runtime class or visibility preference;
- confinement requirement;
- whether provider fallback is allowed.

Capability must not contain:

- account ids;
- account pools;
- provider CLI home paths;
- env overlays such as `CODEX_HOME`;
- role-named account pools such as `codex-review-pool`.

Today, capability config often binds to concrete executor ids through `prefer`
and may carry `overrides.providerModel` / `rigorOverrides`. That is a legacy
bridge. The target shape is for capability to compile into an effective
execution need, not directly into account selection.

Example target capability vocabulary:

```jsonc
{
  "runner": {
    "capabilities": {
      "code:review": {
        "preferProvider": "openai-codex",
        "minModelTier": "frontier",
        "runtimeClass": "bwrap",
        "allowProviderFallback": true,
        "confinement": {
          "mode": "required",
          "policy": "host-write-denied"
        }
      }
    }
  }
}
```

This does not mean the rotator knows `code:review`. It means the capability
resolver has internally produced:

```jsonc
{
  "executionKind": "provider-model",
  "preferredProvider": "openai-codex",
  "modelTier": "frontier",
  "runtimeClass": "bwrap",
  "allowProviderFallback": true
}
```

## Tool executor boundary

**[Partially implemented]** The underlying boundary is respected --
`gitnexus` (`kind: "tool"`) never touches Provider Capacity Rotator, since
nothing in the dispatch path calls `hasProviderAccounts`/`acquireProviderAccountLease`
for a tool-kind executor. But there is no formal `executionKind` discriminator
field anywhere in `src/` -- the boundary holds structurally, not by an explicit
typed contract this section describes.

One existing boundary must stay explicit: a capability does not always resolve
to a model-backed agent provider.

The live config already has `impact-analysis -> gitnexus`, where `gitnexus` is
an executor with `kind: "tool"` and an `invocations[].via: "mcp"` handback. That
path has no provider modelTier, no provider account home, and no provider
capacity to rotate. It must bypass Provider Capacity Rotator entirely.

The effective execution need therefore needs a discriminator before provider
capacity selection. Provider-backed runs use:

```jsonc
{
  "executionKind": "provider-model",
  "preferredProvider": "openai-codex",
  "modelTier": "frontier",
  "runtimeClass": "bwrap",
  "allowProviderFallback": true
}
```

Tool-backed runs use the existing tool handback shape instead:

```jsonc
{
  "executionKind": "tool",
  "executorId": "gitnexus",
  "via": "mcp",
  "tool": "mcp__gitnexus__impact"
}
```

Provider Capacity Rotator only accepts `executionKind: "provider-model"`.
For `executionKind: "tool"` or any other mechanical/non-provider execution, the
rotator returns not-applicable or is not called at all. The existing MCP
handback path remains the owner of those runs.

This keeps capability useful without making `runner.providers` a shadow copy of
the capability registry. `providerRuntimes` also must not point at tool-only
executors such as `gitnexus`; it maps provider runtime classes for
model-backed agents only.

## Target Config Shape

**[Partially implemented]** `providers.<provider>.accounts` (id/label/
`credentialSource`) is real and validated (`validateProviderAccountInventory`,
`rejectProjectProviderAccountInventory` -- global-only, exactly as this
section's own rules require). Everything else here is NOT implemented as
config: no `providers.<provider>.models` table, no `accountEnvKeys` (credential
handoff instead copies `auth.json` directly into a confined home --
`confinement/drivers/bwrap.mjs`'s `provisionSelectedCodexCredential`, no
bind-mount, no env overlay at all), no `selection`/`faultPolicy` as config
(both are hardcoded behavior in `provider-capacity.mjs`), no `providerFallback`,
no `providerRuntimes` (its goal was independently solved by
executor-id-consolidation's `invocations[]` -- an INCOMPATIBLE shape; do not
bolt this section's `providerRuntimes` onto that later without reconciling
the two).

This section describes a possible later target after PlacementPolicy/model-tier
seams exist. It is not slice-1 implementation config. Slice 1 must not add
`providerFallback`, `providerRuntimes`, or `providers.<provider>.models`.

Provider capacity config is keyed by provider, not capability, role, or
executor.

```jsonc
{
  "runner": {
    "providers": {
      "openai-codex": {
        "models": {
          "nano": "gpt-5.6-luna",
          "mini": "gpt-5.6-luna",
          "standard": "gpt-5.6-terra",
          "advanced": "gpt-5.6-terra",
          "flagship": "gpt-5.6-sol",
          "frontier": "gpt-5.6-sol"
        },
        "accountEnvKeys": ["CODEX_HOME"],
        "accounts": [
          {
            "id": "tetcu72",
            "label": "codex/tetcu72",
            "env": {
              "CODEX_HOME": "${HOME}/.codex-tetcu72"
            }
          },
          {
            "id": "tetnu",
            "label": "codex/tetnu",
            "env": {
              "CODEX_HOME": "${HOME}/.codex-tetnu"
            }
          },
          {
            "id": "fgovn",
            "label": "codex/fgovn",
            "env": {
              "CODEX_HOME": "${HOME}/.codex-fgovn"
            }
          }
        ],
        "selection": {
          "strategy": "least-recently-used",
          "sticky": "assignment",
          "leaseTtlMs": 900000
        },
        "faultPolicy": {
          "quota-exhausted": { "quarantineMs": 21600000 },
          "unavailable": { "quarantineMs": 600000 },
          "transient-provider-error": { "quarantineMs": 120000 },
          "authentication-failed": { "quarantine": "manual-clear" }
        }
      },
      "claude": {
        "models": {
          "nano": "haiku",
          "mini": "haiku",
          "standard": "sonnet",
          "advanced": "sonnet",
          "flagship": "opus",
          "frontier": "opus"
        },
        "accounts": [
          {
            "id": "main",
            "label": "claude/main"
          }
        ]
      }
    },
    "providerFallback": {
      "openai-codex": ["openai-codex", "claude", "gemini"],
      "claude": ["claude", "openai-codex", "gemini"],
      "gemini": ["gemini", "openai-codex", "claude"]
    },
    "providerRuntimes": {
      "openai-codex": {
        "bwrap": "codex-bwrap",
        "headless": "codex-cli",
        "visible": "codex-herdr"
      },
      "claude": {
        "bwrap": "claude-bwrap",
        "headless": "claude",
        "visible": "claude-herdr"
      },
      "gemini": {
        "headless": "agy-cli",
        "visible": "agy-herdr"
      }
    }
  }
}
```

Rules:

- `providers.<provider>.accounts` is provider/account inventory only.
- Account entries may define `env` overlays only for keys allowed by
  `accountEnvKeys`.
- Account entries must not define executor ids, mutation posture, tools,
  allowed commands, confinement policy, modelTier, effort, or capability.
- `providerRuntimes` maps provider + runtime class to executor id. It must not
  mention accounts and must not target tool-only or MCP-only executors.
- `providerFallback` maps provider fallback order. It must not mention
  capabilities.
- Provider model tables are operator-declared equivalence. Missing tier means
  fail closed; fgOS does not infer model intelligence from model names.

Settled operating defaults:

- Same-provider account rotation is enabled by default.
- Cross-provider fallback is opt-in per effective execution need/operator
  policy; it must never happen silently.
- Selection inside one provider uses least-recently-used with a deterministic
  tie-break, sticky by `assignmentId`, and guarded by a short lease TTL.
- Provider capacity selection never downgrades `modelTier`.
- Tool/MCP-only executors bypass provider capacity.

## Runtime example

**[Partially implemented]** Illustrates the same selection algorithm §Selection
policy implements; the runtime-resolution half (`provider=X + runtimeClass=Y
-> executor`) is NOT implemented as shown -- that seam is `invocations[]`/Gate
B2 today, not a `providerRuntimes` table lookup.

Input from policy:

```jsonc
{
  "preferredProvider": "openai-codex",
  "modelTier": "frontier",
  "runtimeClass": "bwrap",
  "allowProviderFallback": true
}
```

If an OpenAI Codex account is healthy:

```jsonc
{
  "provider": "openai-codex",
  "modelTier": "frontier",
  "model": "gpt-5.6-sol",
  "account": {
    "id": "tetnu",
    "label": "codex/tetnu"
  },
  "envOverlay": {
    "CODEX_HOME": "${HOME}/.codex-tetnu"
  },
  "reasonCodes": ["preferred-provider", "least-recently-used"]
}
```

Runtime resolution then maps:

```text
provider=openai-codex + runtimeClass=bwrap -> executor codex-bwrap
```

If all OpenAI Codex accounts are quota-exhausted and fallback is allowed:

```jsonc
{
  "provider": "claude",
  "modelTier": "frontier",
  "model": "opus",
  "account": {
    "id": "main",
    "label": "claude/main"
  },
  "envOverlay": {},
  "reasonCodes": ["openai-codex.quota-exhausted", "fallback-provider", "same-modelTier:frontier"]
}
```

Runtime resolution maps:

```text
provider=claude + runtimeClass=bwrap -> executor claude-bwrap
```

## Selection policy

**[Implemented]** `rankProviderAccounts`/`acquireProviderAccountLease`
(`provider-capacity.mjs`) match this algorithm: open-leases + lastSelectedAt +
stable-hash tie-break, short lease TTL, sticky-by-`assignmentId`. Cross-provider
fallback (step 2's `providerFallback` walk) is NOT implemented -- same-provider
selection only; `attemptProviderCapacityFallback` (assignment-runner.mjs) does
something related but keys off `opPolicy.fallbackExecutors` (an executor list),
not a `providerFallback` provider-order table.

Inside a provider, default selection is `least-recently-used` with deterministic
tie-break.

Algorithm:

1. Resolve desired provider and modelTier from effective execution need.
2. Build provider order: desired provider first; then `providerFallback` only
   when fallback is explicitly allowed.
3. For each provider:
   - verify the provider declares the requested modelTier;
   - filter out accounts with active quarantine or incompatible health state;
   - prefer the least recently used account;
   - break ties by stable hash of assignment/run seed and account id;
   - acquire a short lease under a local lock.
4. Return selected provider/model/account, or fail with a structured capacity
   refusal.

Same-provider account rotation is the normal path. Cross-provider fallback is a
larger behavior change and must be explicit in the effective need or operator
policy. Every cross-provider fallback must be recorded in evidence.

## State

**[Implemented]** `defaultProviderCapacityRuntimeDir()` = `~/.fgos/runtime/provider-capacity`
(global, matching accounts being global-only), `providerCapacityStatePaths`
returns `state.json`/`state.lock`. Shape matches closely (`providers.<id>.accounts.<id>`
with lease/quarantine/fault fields).

Store runtime state in `.fgos/runtime/provider-capacity/state.json` plus a lock
file `.fgos/runtime/provider-capacity/state.lock`.

State shape:

```jsonc
{
  "schema": "provider-capacity-state.v1",
  "updatedAt": "2026-09-16T00:00:00.000Z",
  "providers": {
    "openai-codex": {
      "accounts": {
        "tetnu": {
          "lastSelectedAt": "...",
          "lastSuccessAt": "...",
          "lastFaultAt": null,
          "quarantinedUntil": null,
          "fault": null,
          "openLeases": {
            "run_001": {
              "assignmentId": "asgn_...",
              "expiresAt": "...",
              "pid": 12345
            }
          }
        }
      }
    }
  }
}
```

State is local runtime state, not product truth. It must never authorize
recovery, settlement, approval, Work mutation, Assignment mutation, or
CoordinationSession mutation.

## Fault classification

**[Partially implemented]** Only 2 of the 5 listed classes have real
quarantine logic (`classifyProviderCapacityFault`): quota-exhausted (pattern-matched
`quota-limit`) and authentication-failed (`auth-token`, manual-clear). The
other 3 rows in this section's own table already say "No account quarantine",
so the only genuine remaining gap is `provider-unavailable`/transient-network
(falls through to `evidence-only` today, never a short cooldown).

Quarantine means "temporarily skip this account during selection". It never
locks a real account, modifies credentials, recovers work, approves work, or
changes mutation authority.

Only high-confidence provider/account faults should quarantine capacity. The
classifier consumes normalized adapter facts such as `exitCode`, `stderr`,
`stdout`, `adapterError.kind`, and `completion.kind`; it emits a structured
decision:

```jsonc
{
  "faultKind": "quota-exhausted",
  "confidence": "high",
  "scope": "account",
  "patternId": "openai.rate_limit_exceeded"
}
```

Initial fault actions:

| Fault class | Detection source | Quarantine action |
|---|---|---|
| `quota-exhausted` / `rate-limit` | Provider/API codes or provider-specific allowlisted patterns such as quota exceeded, usage limit, rate limit, too many requests, 429 | Account quarantine with long TTL, for example 6 hours or provider reset window when known |
| `authentication-failed` | Credential/session/login/token-specific 401/403 patterns | Manual-clear quarantine |
| `provider-unavailable` / transient network | Timeout, ECONNRESET, ENOTFOUND, ETIMEDOUT, 502/503/504, service unavailable, overload | Short provider/account-uncertain cooldown only when pattern is high-confidence |
| `executor/config failure` | Spawn ENOENT, missing binary, invalid args, unknown model, config validation, template render failure | No account quarantine |
| `prompt/test/confinement failure` | Tests failed, review/red-team failure, sandbox/confinement denial, work-product failure | No account quarantine |

Low-confidence or unknown failures are logged for inspect/debug but do not
quarantine. The first implementation should quarantine only high-confidence
quota/rate-limit and authentication failures; transient cooldown can be added
only with clear provider-specific patterns.

## Target Dispatch Integration

**[Implemented, the narrower "slice 1" variant this section itself calls for]**
`assignment-runner.mjs`: selection happens after `admitRunAttempt`
(`!admitted.resumed` guard), keyed by `runId`, lease acquired via
`acquireProviderAccountLease`, persisted to its own
`provider-capacity-selection.json` (referenced from `run.json`) rather than
into `dispatch-plan.json` -- exactly "requirements only, not the selected
account" as required. `legacyExecutorRuntimeProjection` (the compatibility
bridge) does NOT exist -- the actual compat path is the executor id itself
carrying `providerModel` (already-existing field), not a new bridge table.

This section is target architecture. Slice 1 integration is narrower:
selection happens after `admitRunAttempt`, keyed by `runId`, and is persisted
in Run-owned evidence/effective contract before launch. `dispatch-plan.json`
contains requirements only, not the selected account.

Near-term integration should not deepen executor-account coupling.

Implementation should insert a provider-capacity step after effective policy
resolution and before command rendering:

```text
resolveAssignmentDispatchPolicy / compileDispatchPlan
-> provider capacity selection
-> provider runtime resolution
-> resolveExecutorCommand / ProviderAdapter render
```

The current code still derives provider from executor in several places. First
implementation may use a compatibility projection:

```text
legacy executor id -> preferredProvider + runtimeClass
```

but the selected account must be keyed by provider, not by executor id.

No compatibility bridge should be named `executors.<id>.accountPool`; that
would recreate the old coupling. If a temporary bridge is unavoidable, name it
as a migration table and keep it provider-oriented, for example:

```jsonc
{
  "runner": {
    "legacyExecutorRuntimeProjection": {
      "codex-bwrap": {
        "provider": "openai-codex",
        "runtimeClass": "bwrap"
      },
      "claude-bwrap": {
        "provider": "claude",
        "runtimeClass": "bwrap"
      }
    }
  }
}
```

The target is to retire this bridge once provider/runtime can be resolved from
first-class seams.

## Evidence

**[Partially implemented]** Real shape differs: a dedicated
`provider-capacity-selection.json` per Run (not a `providerCapacity` key
nested in a generic `evidence.json`), written via `redactProviderCapacitySelection`
-- same safety property (account id/label + env KEY NAMES only, per
`FORBIDDEN_ACCOUNT_KEYS`, never raw values/paths/tokens), different file
layout.

Persist safe facts only:

```jsonc
{
  "providerCapacity": {
    "requestedProvider": "openai-codex",
    "selectedProvider": "claude",
    "modelTier": "frontier",
    "model": "opus",
    "providerFallback": true,
    "account": {
      "id": "main",
      "label": "claude/main"
    },
    "envKeys": [],
    "reasonCodes": ["openai-codex.quota-exhausted", "fallback-provider"]
  },
  "runtime": {
    "runtimeClass": "bwrap",
    "executorId": "claude-bwrap"
  }
}
```

Never persist raw env values, tokens, cookies, credentials, or absolute home
paths in committed evidence, `result.json`, `run.json`,
`dispatch-plan.json`, `effective-execution-contract.json`, worker briefs, or
ordinary CLI output. The default evidence exposes account id/label and env key
names only.

## Safety invariants

**[Largely upheld structurally]** #9/#10 (capability names never in account
inventory, account ids never in capability config) enforced directly by
`FORBIDDEN_ACCOUNT_KEYS`. #1-3/#11 hold because `provider-capacity.mjs` never
touches mutation/confinement/tools and tool-kind executors never reach it
(structural, see §Tool executor boundary). #4 holds (state file is never read
by any recovery/approval path). #5-8 hold via the selector/classifier code
read above. None of these 11 has its own dedicated cross-cutting audit test
(unlike e.g. RUL68's confinement-preservation fix, which DOES have one) --
verified by reading, not by a named test asserting each invariant.

1. Provider capacity selection never changes mutation.
2. Provider capacity selection never grants tools or approval bypass.
3. Provider capacity selection never lowers confinement.
4. Provider capacity state is not recovery authority.
5. Provider fallback is explicit and audit-visible.
6. Account env overlay is restricted to provider-declared `accountEnvKeys`.
7. Executor and account must match the selected provider.
8. Missing provider/modelTier equivalence fails closed.
9. Capability names never appear in provider account inventory.
10. Account ids never appear in capability config.
11. Tool/MCP-only executions bypass provider capacity selection.

## Operability

**[Not implemented]** Zero matches for any of the 6 named checks
(`provider-capacity-shape`, `provider-capacity-env-keys`, `provider-runtime-map`,
`provider-capacity-state-readable`, `provider-capacity-quarantine`,
`provider-singleton-warning`) in `src/setup/checks.mjs`. No `runner.providers`
setup default registered either.

Doctor checks to add with implementation:

- `provider-capacity-shape`: provider config, modelTier tables, fallback order, and
  accounts validate.
- `provider-capacity-env-keys`: account env overlays use only allowed env keys
  and contain no secret-looking keys.
- `provider-runtime-map`: every provider/runtimeClass pair needed by current
  executors or policy resolves to an executor; resolved executor's provider
  agrees with selected provider; tool-only and MCP-only executors are rejected
  from this map.
- `provider-capacity-state-readable`: state directory and lock are readable and
  writable when provider capacity rotation is configured.
- `provider-capacity-quarantine`: report currently quarantined accounts without
  secrets or home paths.
- `provider-singleton-warning`: warn when a provider used for high-volume
  dispatch has only one configured account.

Setup/defaults:

- Register new config defaults through the setup registry if a default key is
  added.
- Default should be empty/inert, not machine-specific.
- Do not create provider home directories or credential files.
- Do not assume global vs project install; project config still overrides
  global config by existing distribution rules.

## Test plan

**[Partially implemented]** `test/runner/provider-capacity.test.mjs` (10 tests)
covers: LRU/stable-hash ranking, sticky-honored-while-present-and-not-quarantined,
lease acquire/release keyed by runId (not elapsed time), lease reclaim requires
dead-run proof, classifier confidence gating (4 tests), manual-clear.
`assignment-dispatch.test.mjs`'s "Phase B" battery separately covers real
fallback-executor dispatch end to end. NOT covered by name: provider config
shape rejecting capability/account/executor cross-leaks as its own test
(covered implicitly by `FORBIDDEN_ACCOUNT_KEYS` validation tests elsewhere),
cross-provider `providerFallback` fallback (doesn't exist to test), runtime
resolver provider/account/executor mismatch refusal (no such resolver exists
yet), tool executor bypass as its own explicit test.

Unit tests:

- provider config validation rejects capability/account/executor cross-leaks;
- account env overlay rejects keys outside provider `accountEnvKeys`;
- same-provider LRU/sticky/lease/quarantine selection;
- cross-provider fallback only when allowed;
- missing equivalent modelTier fails closed;
- runtime resolver refuses provider/account/executor mismatch.
- capability preferring a tool executor bypasses provider capacity selection;
- provider runtime validation rejects a tool/MCP-only executor target.

Integration tests:

- no provider-capacity config preserves Phase 00 baseline snapshots;
- Codex singleton `CODEX_HOME` config can be migrated into provider accounts
  without changing no-fallback behavior;
- quota-exhausted account is quarantined and another same-provider account is
  selected;
- when all preferred-provider accounts are quarantined and fallback is allowed,
  same-modelTier provider/model/account is selected and evidence records the
  fallback;
- persisted evidence includes env key names but not env values or absolute home
  paths.

Concurrency tests:

- two concurrent selections do not lease the same account when alternatives
  exist;
- expired leases are ignored;
- settlement releases only the current Run's lease.

Full implementation proof: `npm test`.

## Relationship to executor-policy-dispatch-seams

This remains a separate operational track, but it is tightly coupled to the
seams vocabulary.

- `executor-policy-dispatch-seams` separates semantic policy, provider/model,
  runtime posture, executor profile, and invocation.
- Provider capacity rotator consumes the provider/modelTier part of that result.
- Runtime resolver consumes selected provider + runtime posture and chooses an
  executor/invocation.

Do not merge the tracks into one large implementation plan. The seams track is
behavior-preserving vocabulary work; provider capacity rotation is stateful
runtime behavior with leases, quarantine, fault classification, and inspect
surface. They should share an integration contract, not a single scope blob.

Phase 00 baseline snapshot has landed on local `main` via `47639eab`, so this
track can start from main as long as every no-capacity-config behavior remains
snapshot-equivalent.

## Recommendation

**[5 of 7 done, differently in 1 case]** (1) provider/account/model config
shape -- done (accounts only, no `models` sub-table). (2) selector/state/lease/
quarantine -- done. (3) compatibility projection legacy-executor-id ->
provider/runtimeClass -- NOT done as a named bridge; superseded by
executor-id-consolidation's `invocations[]` + `providerModel` field instead.
(4) provider runtime resolver -- NOT done as a `providerRuntimes` table;
`invocations[]`/Gate B2 fills this role differently. (5) secret-free evidence
and inspect -- done (`redactProviderCapacitySelection`,
`fgos dispatch inspect --provider-capacity`). (6) doctor/setup coverage --
NOT done. (7) minimal Codex dogfood conversion -- NOT done: neither
`.fgos/config.json` nor `~/.fgos/config.json` declares `runner.providers`
today; the mechanism is built and tested but not yet activated.

Implement the smallest provider-capacity slice now:

1. provider/account/model config shape;
2. selector/state/lease/quarantine;
3. compatibility projection from legacy executor id to provider/runtimeClass;
4. provider runtime resolver;
5. secret-free evidence and inspect;
6. doctor/setup coverage;
7. minimal Codex dogfood conversion.

Do not add capability-named pools, executor-owned pools, or account-owned
executors.

Because fgOS is still unstable and the current operator set is small, there is
no need for a broad migration framework in the first implementation. Preserve
old behavior when `runner.providers` is absent, convert the current dogfood
Codex homes by hand in `.fgos/config.json`, and keep compatibility logic narrow
enough to delete later.
