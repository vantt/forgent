# Executor / policy baseline snapshot — 2026-09-15

Read-only baseline for the executor-identity vs execution-policy shaping thread.
This file records current behavior before any migration. It is intentionally an
evidence report, not a target spec.

## Scope and sources

Sources inspected:

- `.fgos/config.json` runner config, especially capability and executor entries.
- `src/runner/dispatch/resolve.mjs` for current work-tier → policy-tier → model
  resolution.
- `src/runner/dispatch/assignment-policy.mjs` for current assignment policy
  resolution.
- `src/runner/dispatch/transport.mjs` for current argv templating.
- `src/runner/definitions/schema.mjs` and `src/verbs/coordination/run.mjs` for
  current PolicyPatch / actors[] vocabulary.

Key code facts:

- `modelForTier()` maps work tier through `DEFAULT_TIER_TO_POLICY`, unless an
  executor or capability supplies `rigorOverrides`; then it reads
  `modelPolicies.<provider>.<policyTier>`.
- `resolveAssignmentDispatchPolicy()` still ranks
  `lightweight < standard < creative < analytical < critical` as one ordinal
  axis.
- `PolicyPatch` currently accepts only `minTier`, `preferPersona`,
  `preferExecutor`, `fallbackExecutors`, `visibility`, and `repeatMode`.
- Declared-protocol `actors[]` policy forwarding intentionally sends
  `executor/tier/persona` but not `model`.
- Transport currently substitutes only `{prompt}` and `{model}` into executor
  args.

## Headline findings

1. The live config has 16 agent executors plus 2 tool executors. Most agent ids
   are not distinct accounts; they are combinations of account/provider,
   adapter/visibility, confinement, and role/policy flags.
2. `claude-reviewer` / `claude-reviewer-herdr` are role/policy executors:
   they add `--effort high` and read-only-ish `--allowedTools` relative to the
   normal Claude seats.
3. `agy-cli` and `agy-herdr` currently use `heavy -> creative ->
   gemini-3.8-flash-high`. This means the old `creative` model-policy column is
   active and must not disappear silently during the `quality.minRigor/mode`
   split.
4. `fgos-coding-implement` is different from raw `agy-herdr`: its capability
   override maps every work tier, including `heavy`, to policy tier `standard`,
   yielding `gemini-3.8-flash-medium`. That block is a business-case preset
   encoded as capability config.
5. `pi`, `pi-herdr`, `codex-pi`, `glm-cli`, and `agy-bwrap` force all work
   sizes to `lightweight` through executor `rigorOverrides`; this is calibration
   by executor rather than by provider/catalog.
6. `codex-readonly` is already documented as retired-for-dispatch; keeping it as
   an executor id still matters for alias/deprecation migration.

## Model policy table

| provider | lightweight | standard | creative | analytical | critical |
|---|---|---|---|---|---|
| claude | haiku | sonnet | sonnet | opus | opus |
| gemini | gemini-3.8-flash-low | gemini-3.8-flash-medium | gemini-3.8-flash-high | gemini-3.1-pro-low | gemini-3.1-pro-high |
| openai-codex | gpt-5.6-luna | gpt-5.6-terra | gpt-5.6-terra | gpt-5.6-terra | gpt-5.6-sol |
| z-ai | z-ai/glm-5.2 | z-ai/glm-5.2 | z-ai/glm-5.2 | z-ai/glm-5.2 | z-ai/glm-5.2 |

## Executor × legacy work-tier matrix

`policy-shaped flags` are flags that encode execution policy today and therefore
should eventually be rendered by a provider/transport adapter from a
DispatchPlan, not hardcoded in executor identity.

| executor | work tier | provider | policy tier | model | adapter | confinement | env keys | policy-shaped flags |
|---|---:|---|---|---|---|---|---|---|
| claude | light | claude | lightweight | haiku | cli-spawn | none | - | `--model haiku`; `--permission-mode acceptEdits`; `--allowedTools ...git add/git commit...` |
| claude | standard | claude | standard | sonnet | cli-spawn | none | - | `--model sonnet`; `--permission-mode acceptEdits`; `--allowedTools ...git add/git commit...` |
| claude | heavy | claude | critical | opus | cli-spawn | none | - | `--model opus`; `--permission-mode acceptEdits`; `--allowedTools ...git add/git commit...` |
| claude-reviewer | light | claude | lightweight | haiku | cli-spawn | none | - | `--model haiku`; `--effort high`; `--permission-mode acceptEdits`; `--allowedTools ...git diff/log/show/status + tests...` |
| claude-reviewer | standard | claude | standard | sonnet | cli-spawn | none | - | `--model sonnet`; `--effort high`; `--permission-mode acceptEdits`; `--allowedTools ...git diff/log/show/status + tests...` |
| claude-reviewer | heavy | claude | critical | opus | cli-spawn | none | - | `--model opus`; `--effort high`; `--permission-mode acceptEdits`; `--allowedTools ...git diff/log/show/status + tests...` |
| agy-cli | light | gemini | lightweight | gemini-3.8-flash-low | cli-spawn | none | HOME | `--mode accept-edits`; `--model gemini-3.8-flash-low` |
| agy-cli | standard | gemini | standard | gemini-3.8-flash-medium | cli-spawn | none | HOME | `--mode accept-edits`; `--model gemini-3.8-flash-medium` |
| agy-cli | heavy | gemini | creative | gemini-3.8-flash-high | cli-spawn | none | HOME | `--mode accept-edits`; `--model gemini-3.8-flash-high` |
| agy-herdr | light | gemini | lightweight | gemini-3.8-flash-low | herdr-spawn | none | HOME | `--mode accept-edits`; `--model gemini-3.8-flash-low` |
| agy-herdr | standard | gemini | standard | gemini-3.8-flash-medium | herdr-spawn | none | HOME | `--mode accept-edits`; `--model gemini-3.8-flash-medium` |
| agy-herdr | heavy | gemini | creative | gemini-3.8-flash-high | herdr-spawn | none | HOME | `--mode accept-edits`; `--model gemini-3.8-flash-high` |
| claude-bwrap | light | claude | lightweight | haiku | cli-spawn | bwrap | - | `--model haiku` |
| claude-bwrap | standard | claude | standard | sonnet | cli-spawn | bwrap | - | `--model sonnet` |
| claude-bwrap | heavy | claude | critical | opus | cli-spawn | bwrap | - | `--model opus` |
| agy-bwrap | light | gemini | lightweight | gemini-3.8-flash-low | cli-spawn | bwrap | HOME | `--model gemini-3.8-flash-low` |
| agy-bwrap | standard | gemini | lightweight | gemini-3.8-flash-low | cli-spawn | bwrap | HOME | `--model gemini-3.8-flash-low` |
| agy-bwrap | heavy | gemini | lightweight | gemini-3.8-flash-low | cli-spawn | bwrap | HOME | `--model gemini-3.8-flash-low` |
| codex-readonly | light | openai-codex | lightweight | gpt-5.6-luna | cli-spawn | none | CODEX_HOME | `-s read-only`; `--model gpt-5.6-luna` |
| codex-readonly | standard | openai-codex | standard | gpt-5.6-terra | cli-spawn | none | CODEX_HOME | `-s read-only`; `--model gpt-5.6-terra` |
| codex-readonly | heavy | openai-codex | critical | gpt-5.6-sol | cli-spawn | none | CODEX_HOME | `-s read-only`; `--model gpt-5.6-sol` |
| codex-cli | light | openai-codex | lightweight | gpt-5.6-luna | cli-spawn | none | CODEX_HOME | `--dangerously-bypass-approvals-and-sandbox`; `--model gpt-5.6-luna` |
| codex-cli | standard | openai-codex | standard | gpt-5.6-terra | cli-spawn | none | CODEX_HOME | `--dangerously-bypass-approvals-and-sandbox`; `--model gpt-5.6-terra` |
| codex-cli | heavy | openai-codex | critical | gpt-5.6-sol | cli-spawn | none | CODEX_HOME | `--dangerously-bypass-approvals-and-sandbox`; `--model gpt-5.6-sol` |
| codex-pi | light | openai-codex | lightweight | gpt-5.6-luna | cli-spawn | none | - | `--model gpt-5.6-luna`; `--tools read,write,edit,bash,grep,find,ls`; `--mode json`; `--approve` |
| codex-pi | standard | openai-codex | lightweight | gpt-5.6-luna | cli-spawn | none | - | `--model gpt-5.6-luna`; `--tools read,write,edit,bash,grep,find,ls`; `--mode json`; `--approve` |
| codex-pi | heavy | openai-codex | lightweight | gpt-5.6-luna | cli-spawn | none | - | `--model gpt-5.6-luna`; `--tools read,write,edit,bash,grep,find,ls`; `--mode json`; `--approve` |
| glm-cli | light | z-ai | lightweight | z-ai/glm-5.2 | cli-spawn | none | ANTHROPIC_* | `--model z-ai/glm-5.2`; `--permission-mode acceptEdits`; `--allowedTools ...git add/git commit...` |
| glm-cli | standard | z-ai | lightweight | z-ai/glm-5.2 | cli-spawn | none | ANTHROPIC_* | `--model z-ai/glm-5.2`; `--permission-mode acceptEdits`; `--allowedTools ...git add/git commit...` |
| glm-cli | heavy | z-ai | lightweight | z-ai/glm-5.2 | cli-spawn | none | ANTHROPIC_* | `--model z-ai/glm-5.2`; `--permission-mode acceptEdits`; `--allowedTools ...git add/git commit...` |
| claude-herdr | light | claude | lightweight | haiku | herdr-spawn | none | - | `--model haiku`; `--permission-mode acceptEdits`; `--allowedTools ...git add/git commit...` |
| claude-herdr | standard | claude | standard | sonnet | herdr-spawn | none | - | `--model sonnet`; `--permission-mode acceptEdits`; `--allowedTools ...git add/git commit...` |
| claude-herdr | heavy | claude | critical | opus | herdr-spawn | none | - | `--model opus`; `--permission-mode acceptEdits`; `--allowedTools ...git add/git commit...` |
| pi-herdr | light | openai-codex | lightweight | gpt-5.6-luna | herdr-spawn | none | - | `--model gpt-5.6-luna`; `--tools read,write,edit,bash,grep,find,ls`; `--approve` |
| pi-herdr | standard | openai-codex | lightweight | gpt-5.6-luna | herdr-spawn | none | - | `--model gpt-5.6-luna`; `--tools read,write,edit,bash,grep,find,ls`; `--approve` |
| pi-herdr | heavy | openai-codex | lightweight | gpt-5.6-luna | herdr-spawn | none | - | `--model gpt-5.6-luna`; `--tools read,write,edit,bash,grep,find,ls`; `--approve` |
| codex-herdr | light | openai-codex | lightweight | gpt-5.6-luna | herdr-spawn | none | CODEX_HOME | `--dangerously-bypass-approvals-and-sandbox`; `--model gpt-5.6-luna` |
| codex-herdr | standard | openai-codex | standard | gpt-5.6-terra | herdr-spawn | none | CODEX_HOME | `--dangerously-bypass-approvals-and-sandbox`; `--model gpt-5.6-terra` |
| codex-herdr | heavy | openai-codex | critical | gpt-5.6-sol | herdr-spawn | none | CODEX_HOME | `--dangerously-bypass-approvals-and-sandbox`; `--model gpt-5.6-sol` |
| pi | light | openai-codex | lightweight | gpt-5.6-luna | cli-spawn | none | - | `--model gpt-5.6-luna`; `--tools read,write,edit,bash,grep,find,ls`; `--mode json`; `--approve` |
| pi | standard | openai-codex | lightweight | gpt-5.6-luna | cli-spawn | none | - | `--model gpt-5.6-luna`; `--tools read,write,edit,bash,grep,find,ls`; `--mode json`; `--approve` |
| pi | heavy | openai-codex | lightweight | gpt-5.6-luna | cli-spawn | none | - | `--model gpt-5.6-luna`; `--tools read,write,edit,bash,grep,find,ls`; `--mode json`; `--approve` |
| codex-bwrap | light | openai-codex | lightweight | gpt-5.6-luna | cli-spawn | bwrap | resourceBinding:CODEX_HOME | `-s danger-full-access`; `--model gpt-5.6-luna` |
| codex-bwrap | standard | openai-codex | standard | gpt-5.6-terra | cli-spawn | bwrap | resourceBinding:CODEX_HOME | `-s danger-full-access`; `--model gpt-5.6-terra` |
| codex-bwrap | heavy | openai-codex | critical | gpt-5.6-sol | cli-spawn | bwrap | resourceBinding:CODEX_HOME | `-s danger-full-access`; `--model gpt-5.6-sol` |
| claude-reviewer-herdr | light | claude | lightweight | haiku | herdr-spawn | none | - | `--model haiku`; `--effort high`; `--permission-mode acceptEdits`; `--allowedTools ...git diff/log/show/status + tests/build...` |
| claude-reviewer-herdr | standard | claude | standard | sonnet | herdr-spawn | none | - | `--model sonnet`; `--effort high`; `--permission-mode acceptEdits`; `--allowedTools ...git diff/log/show/status + tests/build...` |
| claude-reviewer-herdr | heavy | claude | critical | opus | herdr-spawn | none | - | `--model opus`; `--effort high`; `--permission-mode acceptEdits`; `--allowedTools ...git diff/log/show/status + tests/build...` |

## Capability snapshot

| capability | prefer | policy-like override | confinement |
|---|---|---|---|
| impact-analysis | gitnexus | - | - |
| pane-labeling | - | - | - |
| advise | claude-bwrap | - | `required: host-write-denied` |
| execute | claude | - | - |
| fgos-coding-implement | agy-herdr | `providerModel: gemini`, `rigorOverrides: light/standard/heavy -> standard` | - |
| code:implement | agy-cli | - | - |
| code:review | codex-bwrap | - | `required: host-write-denied` |
| code:test | claude | - | - |
| code:debug | codex-bwrap | - | `required: host-write-denied` |
| code:refactor | claude | - | - |

## Migration implications exposed by this baseline

### Creative column is live

Raw `agy-cli` and `agy-herdr` use:

```text
heavy -> creative -> gemini-3.8-flash-high
```

Therefore the split from legacy `policyTier` to
`quality.{minRigor, mode}` cannot mechanically map `creative` to
`{minRigor: standard, mode: creative}` and key the catalog only by
`minRigor` without a calibration step. If the future catalog is keyed only by
`minRigor`, the migration must explicitly decide where
`gemini-3.8-flash-high` lands.

### Capability override contradicts raw agy executor calibration

The `fgos-coding-implement` capability currently forces:

```text
light -> standard
standard -> standard
heavy -> standard
```

So `fgos-coding-implement` through `agy-herdr` resolves heavy work to
`gemini-3.8-flash-medium`, not `gemini-3.8-flash-high`. This is not a global
agy truth; it is a business-case-specific override.

### Reviewer aliases should not carry permission contracts

`claude-reviewer` and `claude-reviewer-herdr` encode:

```text
persona/tool posture: reviewer-ish
runtime effort: high
tool gating: read-only-ish allowedTools
```

They do not provide sandbox-enforced read-only. A compatibility alias for these
ids should carry persona/toolIntent/reasoningEffort at the caller's original
scope with `viaAlias`, but permission/read-only contract should come from the
operation/business case and be validated during placement.

### Confinement should be modeled as invocation envelope first

`*-bwrap` entries currently multiply executor ids by confinement. The target
design should treat confinement as an invocation capability/envelope by default
and create a new executor identity only when confinement changes principal,
backend trust, or egress boundary in a way an invocation cannot safely represent.

### Snapshot tests should compare rendered invocation, not only model

For migration safety, a golden test should compare:

- resolved provider/model/policy tier;
- command/argv after provider adapter rendering;
- relevant env keys/resource bindings, not secret values;
- prompt delivery mode;
- confinement/read-only enforcement mechanism and whether it is soft
  tool-gating vs sandbox-enforced.

## Baseline script sketch

The matrix above was generated from `.fgos/config.json` using current
`DEFAULT_TIER_TO_POLICY` semantics plus executor/capability `rigorOverrides`.
A production snapshot test should call the real resolver/transport pipeline
instead of reimplementing this logic, but should preserve the same observable
columns.
