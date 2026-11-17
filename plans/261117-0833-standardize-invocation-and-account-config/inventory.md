# As-is inventory of invocations and accounts (2026-11-17)

Built by parsing the YAML files with the repo's `yaml` package. Only ids, keys and arg templates
were printed, never env values or login paths. Layers: **G** = `~/.fgos/config.yaml` (global; a
sequence there replaces the standard's whole sequence for that executor), **S** =
`core/config-standard/runner.yaml`, **P** = `.fgos/config.yaml` (project; declares no invocations).
Form A = generic, `credentialStore`, account leased. Form B = account-pinned by static env and/or
legacy `resourceBindings`. "Default" = what `bind()` picks when nothing pins
(`bind.mjs:165-172`, first confined cli invocation; inside herdr, first `herdr-spawn`).

Target names follow D1 option A (recommended): `<cli>-cli`, `<cli>-cli-bwrap`, `<cli>-herdr-bwrap`.

## Invocations

| Layer | Executor | id | adapter | confinement | login | Form | Default / pinned by | Verdict |
|---|---|---|---|---|---|---|---|---|
| G | gemini | `agy-cli-bwrap` | cli-spawn | bwrap | cs agy / HOME (no `files`) | A | gemini outside herdr | keep; args per P2; add `files` (P5) |
| G | gemini | `agy-herdr` | herdr-spawn | bwrap | cs agy / HOME | A | gemini inside herdr (broken, P1) | keep, rename `agy-herdr-bwrap` |
| S | gemini | `omp-herdr` | herdr-spawn | bwrap | cs omp | A | pinned by `fgos-coding-implement`, `code:implement`, `coding:implement` | replace by agy forms; drop pins (P4) |
| S | gemini | `omp-cli-bwrap` | cli-spawn | bwrap | cs omp | A | | replace by `agy-cli-bwrap` (P4) |
| G | xai | `omp-cli-vantt` | cli-spawn | none | env PI_CODING_AGENT_DIR, PI_CONFIG_DIR | B | unreachable by bind (no backend) | delete |
| G | xai | `omp-cli-bwrap-vantt` | cli-spawn | bwrap | env + resourceBindings | B (vestigial) | **xai default outside herdr** | delete |
| G | xai | `omp-herdr-vantt` | herdr-spawn | bwrap | env + resourceBindings | B (vestigial) | **xai default inside herdr** | delete |
| G | xai | `omp-cli-bwrap` | cli-spawn | bwrap | cs omp (agent.db, config.yml, models.db); env PI_CONFIG_DIR | A | | keep, move first |
| G | xai | `omp-herdr` | herdr-spawn | bwrap | cs omp | A | | keep, rename `omp-herdr-bwrap`, move first |
| S | xai | `omp-cli-bwrap`, `omp-herdr` | | bwrap | cs omp | A | | keep; rename herdr form |
| G | openai | `codex-cli-bypass-fgovn` | cli-spawn | none | env CODEX_HOME | B | unreachable by bind | delete |
| G | openai | `codex-cli-bwrap` | cli-spawn | bwrap | **resourceBindings only** (inferred codex/CODEX_HOME) | A by inference | openai default outside herdr | keep; replace binding by `credentialStore {use: codex, homeEnv: CODEX_HOME}` |
| G | openai | `codex-herdr-fgovn` | herdr-spawn | bwrap | env CODEX_HOME + resourceBindings | B (vestigial) | **openai default inside herdr** (fact 3) | delete |
| G | openai | `pi-cli-fgovn`, `pi-cli-tetnu`, `pi-cli-tetcu72` | cli-spawn | none | env PI_CODING_AGENT_DIR | B | unreachable by bind | delete (tetcu72's account is already removed) |
| G | openai | `pi-cli-bwrap-fgovn`, `-tetnu`, `-tetcu72` | cli-spawn | bwrap | env + resourceBindings | B (vestigial) | | delete |
| G | openai | `pi-herdr` | herdr-spawn | bwrap | cs pi (+models.json) | A | reached by account pin swap only | keep, rename `pi-herdr-bwrap` |
| G | openai | `codex-herdr` | herdr-spawn | bwrap | cs codex | A | never (declared last) | keep, rename `codex-herdr-bwrap`, **move to first herdr position** |
| G | openai | `pi-cli-bwrap` | cli-spawn | bwrap | cs pi (no models.json) | A | | keep (files question U4) |
| S | openai | `codex-cli-bwrap`, `pi-herdr`, `codex-herdr`, `pi-cli-bwrap` | | bwrap | cs | A | **S default in herdr = pi-herdr (order)** | reorder codex first; rename herdr forms |
| G | deepseek | `pi-cli-openrouter` | cli-spawn | none | env PI_CODING_AGENT_DIR, OPENROUTER_API_KEY | B | unreachable | delete |
| G | deepseek | `pi-cli-bwrap-openrouter` | cli-spawn | bwrap | env + resourceBindings | B | **deepseek default outside herdr** | delete |
| G | deepseek | `pi-cli-bwrap`, `pi-herdr` | | bwrap | cs pi | A | inside herdr: pi-herdr | keep; rename herdr form |
| G | glm | `pi-cli-openrouter`, `pi-cli-bwrap-openrouter` | | none / bwrap | env (+ resourceBindings) | B | **glm default** | delete |
| G | glm | `pi-cli-bwrap` | cli-spawn | bwrap | cs pi | A | pinned by many S capabilities (`{glm, pi-cli-bwrap}`) | keep |
| S | claude | `claude-cli` | cli-spawn | none | host login in place | unconfined | reachable only via `bindWorkSeat` | keep (D2) |
| S | claude | `claude-cli-bwrap` | cli-spawn | bwrap | cs claude / CLAUDE_CONFIG_DIR | A | pinned by `advise` (S and P), `code:review`, `code:debug` | keep |
| S | claude | `claude-herdr-bwrap` | herdr-spawn | bwrap | cs claude | A | claude inside herdr | keep (already matches rule A) |
| G | (default) | `runner.executor` | flat command/args (claude, acceptEdits, allowedTools) | none | host login | flat shape | runs when nothing names an executor (`resolve.mjs:177-190`) | out of scope; listed under D5 |
| G,P | gitnexus, herdr | tool invocations | mcp / cli | | | tool | | out of scope |

Other pins found: project `advise` → `{claude, claude-cli-bwrap}`. **mcp-skill-hub's project config
declares its own executor invocations with `resourceBindings` (12 occurrences)**, which gates P6 (D8).

## Accounts (`~/.fgos/private/accounts.yaml`, key structure only)

| Shape | Where | Accounts |
|---|---|---|
| `runner.providers.<p>.accounts.<a>.credentialSources.<cli>` (per CLI, RUL80) | openai | fgovn {codex, pi}, tetnu {codex, pi} |
| same | gemini | tetcu72 {agy}, mucdong {agy}, tetnu {agy} |
| same | claude | main {claude} |
| `runner.providers.<p>.accounts.<a>.credentialSource` (one store for every CLI) | xai | vantt |
| same | z-ai, deepseek | openrouter |
| `runner.llmAccounts.<pool>.<a>.credentialStore.<cli>` (RUL102 target) | openrouter, thehive | openrouter, thehive |

Three shapes describe the same thing. P5 folds them into the last one.

## Today's bindings (`fgos dispatch explain`, inside herdr)

`review`, `code:test` and `code:implement` bind gemini `agy-herdr` first (broken until P1).
`code:review` binds `{openai, codex-cli-bwrap}` (pinned).
