# Model pool B1 phase 07: post-activation proof

Date 2026-10-20, main checkout, plain `fgos` shim (activated release `sha256:d7b89b24…`). Proposal B round skipped (phase 06 paused). Work files: `.fgos/runtime/tmp/mpb1-p07/` (round JSON, `rotate.sh`, `quarantine-log.txt`, `refusal-check.mjs` and its `.out`).

## 1. Explain table

`fgos dispatch explain --for <cap> --json </dev/null`. Every walk stays inside its tier.

| Capability | Tier (source) | First family / model (source) | Walk (family/invocation/model) | Accounts per pool, declared order |
|---|---|---|---|---|
| `execute` | standard (rigor:standard) | gemini / gemini-3.8-flash-medium (`modelPolicies.gemini.standard[0]`) | gemini/omp-herdr/gemini-3.8-flash-medium, deepseek/pi-herdr/deepseek-v4.1-flash, z-ai/pi-cli-bwrap/glm-5.3, claude/claude-herdr-bwrap/sonnet | gemini: tetcu72; deepseek: openrouter; z-ai: openrouter; claude: none declared |
| `code:implement` | standard | gemini / gemini-3.8-flash-medium | same as `execute` | same as `execute` |
| `code:review` | standard | openai / gpt-5.6-terra (`modelPolicies.openai.standard[0]`) | openai/codex-herdr/gpt-5.6-terra, claude/claude-herdr-bwrap/sonnet | openai (state key `openai-codex`): tetcu72, fgovn, tetnu; claude: none |
| `architecture:shape` | frontier (rigor:critical) | openai / gpt-6-astra (`modelPolicies.openai.frontier[0]`) | openai/codex-herdr/gpt-6-astra, claude/claude-herdr-bwrap/fable, gemini/omp-herdr/gemini-4-argon-high, xai/omp-herdr/grok-4.6 | openai: tetcu72, fgovn, tetnu; claude: none; gemini: tetcu72; xai: vantt |
| `business:perspectives` | standard | claude / sonnet (`modelPolicies.claude.standard[0]`) | claude/claude-herdr-bwrap/sonnet, gemini/omp-herdr/gemini-3.8-flash-medium, z-ai/pi-cli-bwrap/glm-5.3, openai/codex-herdr/gpt-5.6-terra | claude: none; gemini: tetcu72; z-ai: openrouter; openai: tetcu72, fgovn, tetnu |

`problems` is empty and every account `usable: true` in all five.

Note: `code:review` explains as `codex-herdr`, not `codex-cli-bwrap` as the brief said. Herdr is present in this session, so the herdr invocation of the declared prefer entry is chosen. This is not a failure; recorded for the owner's reading of the config.

## 2. Real rounds

All `fgos run … --json </dev/null`, read-only, reading `data.results[-1]`. The account is not in the run JSON; it comes from `.fgos/assignments/<assignment>/runs/01/provider-capacity-selection.json`.

### 2a. `execute`: unit-run-1792469469655-6bf77878

- outcome `pass`, `classification.outcome` = `ok / completed-pass`, exit 0.
- Binding: executor gemini, invocation omp-herdr, pool gemini, model gemini-3.8-flash-medium, tier standard, posture read-only.
- Provenance: `executor` capability:execute; `tier` rigor:standard (ceiling flagship, global); `model` and `pool` `modelPolicies.gemini.standard[0]`; `transport` herdr-invocation-present.
- Account: gemini/tetcu72 (selection file).
- Answer: one sentence describing Forgent from README.md.

### 2b. Forced rotation on pool openai (state key `openai-codex`), `code:review`

Question for each round: one sentence on what `docs/specs/runner.md` says its area is about, read only.

| Round | Quarantined before | Unit run | Result | Binding | Account (selection file) |
|---|---|---|---|---|---|
| b1 | tetcu72 | unit-run-1792469525837-44bb58fb | pass, completed-pass | openai / codex-herdr / openai pool / gpt-5.6-terra, `modelPolicies.openai.standard[0]` | **fgovn** (second declared) |
| b2 | tetcu72, fgovn | unit-run-1792469560103-40e284b1 | pass, completed-pass | same | **tetnu** (third declared) |
| b3 | tetcu72, fgovn, tetnu | unit-run-1792469589552-ea225c49 (assignment `…/producer/1-fb1`) | pass, completed-pass | claude / claude-herdr-bwrap / claude pool / sonnet, `modelPolicies.claude.standard[0]` | none (claude declares no accounts; no capacity selection file) |

b3 provenance `fallbackFrom`: `{"executor":"openai","invocation":"codex-herdr","transport":"herdr","pool":"openai","reason":"provider-limit","kind":"next-candidate","walk":"family"}`. This is the all-openai-accounts-down case: the whole pool was skipped and the walk moved to the next family of the same tier (`walk: family`).

Quarantine log (`quarantine-log.txt`, UTC, `--provider openai-codex --until +40min --reason "mpb1 phase 07 proof"`):

```
04:12:05 SET tetcu72   -> status quarantined (until 04:52:05)
         round b1 exit=0
04:12:39 SET fgovn     -> status quarantined (until 04:52:39)
         round b2 exit=0
04:13:09 SET tetnu     -> status quarantined (until 04:53:09)
         round b3 exit=0
04:13:45 CLEAR tetcu72 / fgovn / tetnu -> status cleared (all three)
```

The script cleared in an EXIT trap. After it, `fgos dispatch inspect --provider-capacity` shows no quarantined account in any pool.

Only pool `openai-codex` accounts were touched.

### 2c. Pinned seat

Not rerun, as instructed. Landing smoke e: `--account openai/tetnu`, `unit-run-1792462272701-7b2d84f9` (see `landing-261020-0912-agent-wf-and-model-pool-b1-owner-machine.md`).

## 3. Refusal check

`refusal-check.mjs` loads the live config with `loadRunnerConfigFromDir`, deletes cells on an in-memory clone, and calls `bind()` and `resolveAssignmentDispatchPolicy`. No file is written. Run with `env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN=…/d7b89b24…/bin/fgos`. Output:

```
live code:review standard cells: {"openai":"gpt-5.6-terra","claude":"sonnet"}
control bind (unmodified): {"executor":"openai","pool":"openai","model":"gpt-5.6-terra"}
A bind, openai.standard removed: {"executor":"claude","model":"sonnet","skipped":[{"family":"openai","executor":"openai","pool":null,"reason":"tier-cell-missing","detail":"no model for tier \"standard\" under family \"openai\" (runner.modelPolicies.openai.standard)"}]}
B bind, openai.standard + claude.standard removed: {"reason":"tier-cell-missing","detail":"no model for tier \"standard\" under family \"claude\" (runner.modelPolicies.claude.standard)"}
C policy resolver, openai.standard removed: {"name":"RunnerConfigError","code":"tier-cell-missing","message":"tier-cell-missing: no model for tier \"standard\" under family \"openai\" (runner.modelPolicies.openai.standard)"}
C control (unmodified): {"executorPreference":["openai"],"tier":"standard","model":"gpt-5.6-terra"}
```

Reading: when only the first family lacks its cell, `bind()` skips it by name (recorded in `skipped`) and the next family of the same tier serves, never another model of the missing family. When every reachable family lacks the cell, `bind()` refuses `tier-cell-missing` naming the last cell. The assignment-policy resolver throws `tier-cell-missing` naming `runner.modelPolicies.openai.standard`.

## 4. Panes

My four panes (`wS:p5Z9`, `wS:p5ZA`, `wS:p5ZB` and the round-a pane) were already gone from `herdr pane list` when I checked, so nothing needed closing. One pane under `.fgos/assignments/unit-run-1792469657374-64f60c88/` (`wS:p5ZC`, codex, working) belongs to another session; left alone.

## 5. Deviations

- The pinned seat was not rerun (by instruction); Proposal B round skipped (by instruction).
- Account order for rotation matched the brief (tetcu72, fgovn, tetnu), confirmed from explain; no step needed to be abandoned.
- `fgovn` carried a stale `quarantine` record from 2026-10-15 (until 04:54Z that day, `provider-stderr-classifier`, expired long ago). My set and clear replaced it: it now reads `quarantine: null`. Effective behavior is unchanged because the window had expired; flagging only because the old record is gone from the state file.
- `code:review` binds `codex-herdr` here (see section 1), not `codex-cli-bwrap`.
- Run JSON has no account field; account evidence is the selection file per assignment.

## 6. Owner decisions, proven live?

| Decision | Proven | Evidence |
|---|---|---|
| Tier-ordered fallback | Yes | b3 moved openai to claude at the standard tier, provenance `walk: family`; explain walks stay inside the tier |
| Declared account order | Yes | b1 took fgovn, b2 took tetnu after earlier ones were quarantined; explain lists tetcu72, fgovn, tetnu |
| Pool-keyed state | Yes | quarantine keyed `openai-codex` affected only that pool; other pools untouched and unaffected |
| Pin (`--account pool/account`) | Yes, by landing evidence | smoke e `unit-run-1792462272701-7b2d84f9`, not rerun |
| Missing-cell refusal | Yes | section 3: `bind()` and the policy resolver both refuse `tier-cell-missing` naming the cell |

Cell-first model per family (`gemini.standard[0]`) is also visible in the rounds: round a bound gemini-3.8-flash-medium with source `modelPolicies.gemini.standard[0]`.

Status: DONE
Summary: All planned live checks passed (family-first execute, account rotation tetcu72 to fgovn to tetnu, then walk to claude with `walk: family`, and `tier-cell-missing` refusal at `bind()` and the policy resolver); every quarantine I set was cleared and verified.
Concerns: `code:review` binds `codex-herdr` rather than `codex-cli-bwrap`; fgovn's old expired quarantine record was overwritten to null.
