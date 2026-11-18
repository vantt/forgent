# Phase 01 facts: account lease for the secretary

Read-only. Dry-binds with `npm run fgos:dev -- dispatch explain` (no lease). No credential or login file was read.

## Verdict
No finding contradicts A1-A8. Three items to carry forward (see "Carry forward").

## Step 1: prior art (history)
| Probe | Result |
|---|---|
| `-S acquireNamedAccountLease` (seat-binding, schema, dispatch) | c79818ff2 "lease the account Seat Binding names and leave one walker": the only commit; the lease door the plan reuses |
| `-S llmAccounts` | 221403acb (runner schema), fd30f9d4f, de39e9cbc, 9c35308d9 (confinement), 9702daec0 + c9395bf8b (the retired `runner.providers` account list refused by name, all callers moved to `llmAccounts`; intended, a rename) |
| `-S excludePools` | 25f6b5f5d, 914c21b56: pool-keyed bind state and pool/account pins; no per-persona exclusion |
| `-S CLI_LOGIN_HOMES` | 9c35308d9, 140dd605f: login homes hidden from confined workers; the table the warn row reads |
| `-S account-pin` | dc65c1049, f881fc582, b127b7960: pins act only inside the seat's first choice (A2 holds) |
| `-S personas` / `-G pool` on `runner.schema.yaml` | 221403acb, 3f26a47c3 only; no per-persona pool key ever existed |
| per-persona/role pool, reserved account, "main session account" exclusion | None found in `git log -S/-G` over seat-binding and agent-confinement docs. Nothing was removed, so the `pool` key is new, not a restoration |

Spec history: `docs/platform/seat-binding/spec.md` section 15 starts with D-ADR0080 (persona and role taste live in `runner.personas` / `runner.roles`, project-only, apply to every capability). A `pool` key on that table fits it; it does not contradict D-ADR0080 or D-ADR0072. Decision 86 Q2 (`docs/platform/agent-confinement/spec.md:773`) says the claude login store is a dedicated fgOS login under `~/.fgos/private`, never the user's `~/.claude`; this supports A4. The RUL102/105/106 section of `runner/subcomponents/h-6979005beaf7/spec.md` was not opened line by line; no `pool`/persona wording turned up in the greps above.

F14: spine phase 12 open question 1 (`phase-12-head-start.md:195`) names option (c) as the follow-up (A7 holds). Spine `reports/phase-18-integration.md` proved live: persona text typed, skill `fgos-secretary` loaded, the head's own Stop hook (`session-rotation`, 109 ms), manual and automatic rotation, a lost successor leaving the old head alive, inside a confined claude head with a private-home login (Claude Code v2.1.327). Left for phase 5: running with Miu's `vantt` account from pool `claude-miu`, one rotation whose successor leases from `claude-miu` again, and user-home settings that only live in the user's real `~/.claude.json` (the confinement spec says a trust seed derives from it; the head has no user hooks or skills outside the project rows).

## Step 2: F13 (claude-cli unconfined in place)
Dry-binds outside herdr (`herdrPresent: false`):
- `code:review`: claude / `claude-cli-bwrap` / pool `claude` / store `claude`.
- `execute`, `judge`, `review`, `critique:red-team`, `shape`: gemini / `agy-cli-bwrap` first, claude second in the walk.
- No capability resolved to `claude-cli`. Source: `core/config-standard/runner.yaml:28` declares `claude-cli` with no `credentialStore` and no confinement, but the rank (`packages/seat-binding/rust/src/rank.rs:777-791`) picks a pin only if it carries the posture, else the transport's choice, which in every dry-bind was the bwrap invocation.
- Answer: no default or tier path reaches unconfined `claude-cli`. Residual: an explicit pin to invocation `claude-cli` is gated by `carries_posture` (not read to the end here); I did not prove that gate refuses it. Proposed backlog row (out of scope, RUL11): "prove that a pin to unconfined `claude-cli` is refused for a seat that needs a posture". F13 is closed for the paths the plan relies on.
- Limit: this worktree has no global `runner.llmAccounts` (`data.accounts` shows pool `claude` with an empty list), so account names (`tetcu`, `anhdvh`, `van.tran`) were not checked here; phase 5's live explain on the owner machine does that.

## Step 3: A5 (where `llm-accounts-shape` is judged)
Still Node: `src/setup/registrations.mjs:777` (`registerCheck id 'llm-accounts-shape'`, `checkLlmAccountsShape`). The registry row `doctor-registry.v1.json:229` is owner `bridge:S6a`. Rust has only a reader: `packages/execution/rust/src/accounts.rs:208` `read_llm_accounts`, which reports `problems` and is not a doctor row. A5 holds: phase 3 writes the Node row; no footprint change needed now. Re-check just before phase 3 starts if S6a lands.

## Step 4: persona path
- `bindHeadSeat` (`src/session-host/head-start.mjs:107`) calls `bind({... persona ...}, { runnerConfig, ... })`; `runnerConfig` goes through whole (`bind.mjs:49-51`, `runner: runnerConfig`) to the Rust host route. No Node-side field whitelist for `personas` was found in the greps, so a new `pool` property needs no Node bind edit.
- Rust side: `Scope` (`packages/seat-binding/rust/src/model.rs:225`) has only `tier` and `prefer`. `pool` on a persona needs a Scope field, a read in the ranking where the pool of an entry is chosen (`rank.rs:874-925`, `pool-unusable` at 894/902), the schema (`core/config-schema/runner.schema.yaml`) and a golden case: all already in phase 4's footprint. I did not confirm whether `Scope` rejects unknown fields (no `deny_unknown_fields` hit in `model.rs`, so serde would ignore it silently); phase 4 must add a golden that fails without the field.
- Confined head start already goes through bind with persona `secretary` (phase 18 proof).

## Step 5: golden cases to extend (AC4)
In `packages/seat-binding/contracts/seat-binding.golden.v1.json`:
- `:2216` "accounts come back sticky first, then probed, and quarantined or failed ones are out"
- `:2277` "a pool where every account is quarantined gives no candidate for that entry"
- `:2316` "an account without a login store for the invocation's CLI is not usable"
- `:877` "a family with no cell is skipped and the next family serves the seat" (family walk)
- `:1106`, `:1145`, `:1174` persona key beats role beats recommendation (taste precedence; phase 4 adds a persona `pool` case beside them)
New phase 4 case: "every pane account quarantined walks to the next family and never names the persona pool".

## Carry forward
1. Phase 3 stays Node (A5).
2. Phase 4 must prove, with a golden, that `Scope` actually carries `pool` (serde may ignore unknown keys).
3. Phase 5 owner-machine explain must show `vantt` absent from pool `claude`; it cannot be checked in this worktree.
