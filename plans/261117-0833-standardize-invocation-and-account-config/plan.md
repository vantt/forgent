---
title: "Standardize agent CLI invocations and provider account config"
description: "One generic invocation per CLI and transport, the account chosen only by the lease, one account inventory shape, and the agy pane brief delivery fixed."
status: pending
priority: P1
effort: 35h
branch: main
tags: [runner, config, confinement, seat-binding, agent-protocol, accounts]
blockedBy: []
blocks: []
created: 2026-11-17
---

# Standardize agent CLI invocations and provider account config

## Goal (owner, quoted)

> "Standardize and simplify how agent CLI invocations and provider accounts are configured, while
> keeping flexibility when configuring accounts and invocations."
>
> Reason: the owner looked at the config and saw many different ways of configuring the same thing.
> Accepted target: per CLI only the generic forms `cli`, `cli-bwrap`, `herdr`, `herdr-bwrap` (no
> account suffix). The runner lease chooses the account, never the invocation name. Other structural
> options (transport, confinement, permission mode, prompt delivery) are declared as separate
> invocations. No new run-time option mechanism ("better, not bigger", RUL104). The old path is
> deleted in the same change (L10). No backward compatibility (single user).

## Outcome

Each agent executor declares only generic invocations, named by one mechanical rule. Each of them
reads a login only through `credentialStore`, which comes from the account the lease picked. A
structural variant is a separately named invocation that is reached only through a pin. Every
account is declared in one inventory shape (`runner.llmAccounts`). The `agy` herdr pane accepts a
long brief. The code paths that only served the legacy shapes are deleted: the `resourceBindings`
inference, the `runner.providers` transition read, and the prompt-delivery env override.

## Constraints

- **Gate:** phase 0 must pass (owner signs) before any other phase starts.
- **No lasting breakage (owner, 2026-11-17):** a temporary break while working is fine; the end of every phase must run everywhere. Back up, go one executor or file at a time, probe after each step, keep a rollback.

- Global `~/.fgos/config.yaml` and `~/.fgos/private/accounts.yaml` are read by every activated
  release on the machine. Today that is forgentX (activated 2026-11-15), momentry (2026-11-10) and
  mcp-skill-hub (2026-10-25), all read from `~/projects/*/.fgos/installation/activation.json`. A
  global write must work under all three. The owner approves every global write. Back up first and
  use `fgos config set|unset|patch --global --reason`. The YAML door replaces whole sequences and
  cannot insert into one.
- Build and verify Rust changes in a separate worktree through `npm run fgos:dev -- <verb>`. Never
  touch the activated release. Use one cargo target dir per checkout. Run heavy builds and suites
  one at a time, because the owner's QLC SSD is slow.
- Edit `core/skills/*` and run `npm run build:skills`. Never edit `.agents/` or `plugins/`. Do not
  touch `ak`, `ck` or `rtk`. Commit with a pathspec. No push.
- Every proof follows design principle 8 (one owning proof per behaviour). No test is weakened.
- Harness and direct probes spend provider quota, so each probe step is owner-gated.

## Non-goals

- No new run-time option mechanism, and no per-run invocation pinning feature (`fgos run --override`
  stays executor-keyed, `docs/platform/seat-binding/spec.md:268`).
- No new confinement backend. No change to how the lease ranks accounts (RUL106).
- No change to `ak`/`ck`/`rtk`. No push. No release staging or activation inside this plan, except
  where a phase gate names the owner's own activation step.

## Acceptance criteria

1. The global config's agent executors contain only invocations named by the rule in
   `phase-04` (no account suffix, no `bypass`). `fgos config check` shows zero
   `config-unknown-key` findings under `runner.executors.*.invocations` (today: 9, all
   `resourceBindings`).
2. `fgos dispatch explain --for <cap>` shows a generic invocation for every family, inside and
   outside herdr: openai `codex-herdr[-bwrap]` and `codex-cli-bwrap`, xai `omp-*`, deepseek and glm
   `pi-cli-bwrap`, gemini `agy-*`.
3. An owner-gated `fgos dispatch probe-account --leg harness` returns `ok` for every generic
   invocation of every enabled account, including `agy-herdr*` on gemini/tetcu72 (today `other`).
4. `cargo test -p fgos-agent-protocol --test terminal_vectors` is green with new agy ingestion
   vectors. Every existing vector of all five CLIs is unchanged and green.
5. The standard (`core/config-standard/runner.yaml`) follows the naming rule, declares gemini through
   agy, puts the generic forms first, and passes one owning test that asserts the rule.
6. `~/.fgos/private/accounts.yaml` holds accounts only under `runner.llmAccounts`. Doctor
   `llm-accounts-shape` passes. `runner.providers.*.accounts` is gone.
7. After Phase 6, `rg resourceBindings src core` and `rg FGOS_HERDR_PROMPT_DELIVERY src` return
   nothing. `npm test` and `cargo test --workspace` are green.
8. A flagship or frontier gemini seat never leases mucdong: it sits in its own pool that the high-tier cells do not name. `fgos dispatch explain` shows only tetcu72 and tetnu at those tiers and all three at low tiers. No new key, no code change.
9. Spec formula, decision history, standard and CHANGELOG `[Unreleased]` describe the new rule.
   The plan records `No component-boundary change` (verified against `docs/platform/component-boundary.md`
   scope: no ownership, authority or parent/child change).

## Ownership split (owner decision 2026-11-17 10:53, option c, recorded on the board)

The same files are never edited from two places.

- **This plan (design-lap), per-machine config and decisions:** P0 gate, P2, P3 (V1: each machine's
  global config to `credentialStore` and generic ids, one executor at a time), P5 (V3 data: every
  account on every machine to `runner.llmAccounts`, with `fgos config migrate --global` where it
  applies; then one board line "all machines on llmAccounts"), P7, P8 (gemini pool split on this
  machine), V7 as a decision question for the owner, and V5 as a hand-off (done: board line
  2026-11-17 11:05, HARDEN lands commit `8dbbfaef1`; design-lap never pushes to main for it).
- **S5, `plans/261115-2328-execution-read-door` (lead COMMUNICATION, after S4 lands):** V2 explicit
  selection rule (pins stay hard), V4 deleting `credentialStoreOf`, the executor-level launch
  fields and `FGOS_HERDR_PROMPT_DELIVERY`, and the V3 code (the `runner.providers` reader) after our
  "all machines on llmAccounts" line. So **P6 is not ours**; it becomes S5 work.
- **Files this plan must not edit:** `packages/seat-binding/**`, `src/runner/execution/bind.mjs`,
  `src/runner/dispatch/{provider-capacity,llm-accounts}.mjs`, `core/config-schema/runner.schema.yaml`,
  `core/config-standard/runner.yaml`. The one exception is an owner-approved V7 rename, whose
  landing order is agreed with HARDEN first (S5 phase 03 edits the standard roles).
- **P4 (naming rule, standard, specs)** waits for the V7 decision. It must supersede
  `docs/platform/agent-confinement/spec.md:413` (the frozen `claude-bwrap`, `agy-bwrap`,
  `codex-bwrap` names). No invocation id is renamed before the decision is recorded.
- **Traps for P3:** a global `runner.executors.<id>.invocations` replaces the standard list whole
  (backlog `p-lndtbwbjjl`), so copy the whole claude list with `credentialStore` and `sessionDir` or
  leave the key unset. Headless claude seats stop at the trust prompt (`p-ate7pcs23w`), so probe
  claude interactively or expect `needs-human`. `fgos run --reason` works only with `--case`.

## Phases

| # | Phase | Touches | Depends on | Status |
|---|-------|---------|-----------|--------|
| 0 | [Root-cause gate](phase-00-root-cause-gate.md): design or leftover mess? **Blocks every other phase until the owner signs.** | read-only (git history, specs) | none | findings drafted |
| 1 | [Fix agy-herdr brief delivery](phase-01-fix-agy-herdr-brief-delivery.md) | repo Rust + fixtures; optional global stopgap | P0 | pending |
| 2 | [Review agy invocation args](phase-02-review-agy-invocation-args.md) | global config (gemini) | none, but after P1 stopgap if applied | pending |
| 3 | [Retire legacy invocations in the global config](phase-03-retire-legacy-invocations-global.md) | global config (all agent executors) | D1, D2, P2 | pending |
| 4 | [Naming rule, standard, specs](phase-04-naming-rule-standard-and-specs.md) | repo: standard, tests, fixtures, docs | D1, D2 | pending |
| 5 | [One account inventory shape](phase-05-one-account-inventory-shape.md) | accounts file (global) + global agy files | P3, P4 (agy `files`), D3 | pending |
| 6 | [Delete legacy readers](phase-06-delete-legacy-readers.md) | repo: src, schema, doctor, tests, docs | P3, P5, gates G1-G2, D5 | pending |
| 7 | [Owner-gated cleanups](phase-07-owner-gated-cleanups.md) | global + project config, capacity state | P3; last step after release activation | pending |
| 8 | [Split the gemini pool](phase-08-split-gemini-pool-for-capped-account.md) (owner, 2026-11-17: only mucdong capped at advanced; uses the existing `model@pool` tier cells, as deepseek/thehive does) | global config and accounts file only | none strictly; best after P5 | pending |

As-is inventory: [inventory.md](inventory.md). Decisions in full: [decisions.md](decisions.md).

Parallelism: P1 and P4 touch disjoint repo files and can run in parallel. Global-config phases (P2, P3, P5, P8, P7) have one writer and run in sequence. P6 runs after P4, because both touch `docs/platform/agent-confinement/spec.md`.

## File footprint per phase (for the plan supervisor)

- **P1:** `packages/agent-protocol/rust/src/terminal/{mod.rs,common.rs,agy.rs}`,
  `packages/agent-protocol/contracts/fixtures/terminal/agy/*` (new screens plus `vectors.json`),
  possibly `packages/agent-protocol/rust/tests/terminal_vectors.rs`, `docs/platform/agent-protocol/spec.md`,
  `CHANGELOG.md`. Optional stopgap: global `runner.executors.gemini.invocations`.
- **P2:** global `runner.executors.gemini.invocations` only.
- **P3:** global `runner.executors.{openai,xai,deepseek,glm,gemini}.invocations`; backups under `~/.fgos/private/`.
- **P4:** `core/config-standard/runner.yaml`, `packages/seat-binding/contracts/seat-binding.golden.v1.json`,
  `packages/config/contracts/fixtures/authoring-source.config.json`, `test/fixtures/committed-config.yaml`,
  `test/runner/{herdr-provider-invocations,credential-store,dispatch,dispatch-plan-policy,dispatch-policy-baseline-snapshot,default-executor-merge,provider-account-probe,provider-per-cli-credential-sources}.test.mjs`,
  `test/runner/execution/{bind-committed-config,explain,run-herdr,bind}.test.mjs`,
  `test/setup/{blind-steps-proven-pools-check,omp-natives-check,visibility-checks}.test.mjs`,
  `docs/platform/agent-confinement/spec.md` (13.1), `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`
  (RUL105 text and new decision entry), `docs/platform/seat-binding/spec.md` examples, `CHANGELOG.md`.
- **P5:** `~/.fgos/private/accounts.yaml` (through the door), global agy invocation `files`.
- **P6:** `src/runner/dispatch/{provider-capacity,llm-accounts,assignment-runner,resolve,config}.mjs`,
  `src/runner/dispatch/confinement/{policies,authority,request}.mjs`, `src/runner/dispatch/confinement/drivers/bwrap.mjs`,
  `src/setup/registrations.mjs`, `core/config-schema/runner.schema.yaml`, owning tests, the
  agent-confinement and runner specs, `CHANGELOG.md`.
- **P8:** global `runner.modelPolicies.gemini` cells and `runner.llmAccounts` (new pool). No repo files.
- **P7:** global `runner.executors.*.description`, project `.fgos/config.yaml` descriptions,
  `~/.fgos/runtime/provider-capacity/state.json` (through `fgos dispatch reconcile` only).

## Prior art (what existed, what removed it, reused vs missing)

- **Generic leased forms already decided (2026-10-19).** `d2b08e011` added `credentialStore` on the
  invocation (RUL105). `4f6fc44d7` ("confined invocations declare the login store they read")
  collapsed per-account pi invocations into one `pi-cli-bwrap` in the **project** config, dropped
  account names from ids (`codex-herdr-fgovn` became `codex-herdr`), and removed unconfined
  per-account forms nobody selects. It kept `resourceBindings` "so a release without the field still
  runs this config". The machine-global config was never migrated. That is why the legacy forms
  survive in `~/.fgos/config.yaml`, and why `credentialStoreOf` still infers a store from
  `resourceBindings` (`src/runner/dispatch/provider-capacity.mjs:257-269`, comment: "it goes when
  those configs have moved"). Intended, but unfinished. **Reused:** the whole form-A mechanism.
  **Missing:** the global migration and deletion of the inference.
- **Account inventory transition (2026-10-17/19).** RUL102 introduced `runner.llmAccounts`
  (`docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:204`). `bc57e8550` made the lease read
  a pool from `llmAccounts` when declared, else from `runner.providers` ("the transition read ... it
  goes, with the runner.providers key, once every fgOS release on the machine reads
  runner.llmAccounts", `provider-capacity.mjs:284-296`). All three activations postdate it.
  **Reused:** `readLlmAccounts`, `deriveLegacyInventory`. **Missing:** the inventory move and
  deletion of the legacy read.
- **Per-CLI stores (RUL80, 2026-10-13).** `1f911229f` added `credentialSources`; the singular
  `credentialSource` was kept for other projects. Both shapes fold into `llmAccounts`.
- **Confined herdr for non-claude CLIs** (agent-confinement spec 13.1, history at line 768): solved
  in `acde5fd07` (2026-10-02), lost through renames, re-derived. That history is why this plan leans
  on `git log -S` under old ids (`agy`, `codex-bwrap`, `omp-gemini`).
- **gemini via omp (2026-10-16/17).** `68d9ed0f3`, `95885e6d3` and `3e1a61f07` moved gemini to omp
  because agy was not installed. The owner moved it back to agy on 2026-11-17. The standard still
  says omp and pins `{gemini, omp-herdr}` (`core/config-standard/runner.yaml:191,215` and
  capabilities). That has been stale since today.
- **Prompt door (2026-10-18).** `bcc1ef758` switched codex to `submit_by_prompt_door: true`, and
  omp/pi followed. agy and claude stayed `false`
  (`packages/agent-protocol/rust/src/terminal/agy.rs:11`, `claude.rs:9`). `253efe1d4` deferred a
  "typed nudge for idle agy". No prior fix for slow ingestion exists. **Missing:** P1.
- **promptDelivery (`febafe586`).** `inline` became the herdr default so a person sees the brief.
  `file-pointer` exists as an invocation field (`src/runner/dispatch/herdr-round.mjs:307-317`). An
  env override `FGOS_HERDR_PROMPT_DELIVERY` (`src/runner/dispatch/assignment-runner.mjs:989`) has no
  test and is a run-time option mechanism. **Reused:** the field (P1 stopgap). **Deleted:** the env override (P6).

## Selection analysis (why legacy pinned forms win today, proven by code)

1. `bind()` asks the crate with each executor's facts. The **default invocation** is computed in
   Node (`src/runner/execution/bind.mjs:165-172`): first `resolvePostureInvocation(..., 'read-only')`.
   That calls `pickConfinedInvocation`, which takes **the first `via: cli` invocation in declaration
   order that has a confinement backend** (`src/runner/dispatch/confinement/policies.mjs:674-684`).
   Then, inside herdr, it is replaced by **the first `herdr-spawn` invocation in declaration
   order** when that one carries the posture (`bind.mjs:170-171`). The crate takes
   `base.invocation` (a pin) or else this default (`packages/seat-binding/rust/src/rank.rs:267-270`).
2. Global openai order: `codex-cli-bypass-fgovn` (no backend, skipped), `codex-cli-bwrap`,
   `codex-herdr-fgovn`, ..., `codex-herdr` (last). So inside herdr the default is
   `codex-herdr-fgovn`. Outside herdr it is `codex-cli-bwrap`. deepseek and glm default to
   `pi-cli-bwrap-openrouter` outside herdr. xai defaults to `omp-cli-bwrap-vantt` / `omp-herdr-vantt`.
   **The legacy forms win only because they are declared first.** In the standard, openai lists
   `pi-herdr` before `codex-herdr` (`runner.yaml:118,140`), so openai inside herdr defaults to **pi**
   in every project without a global override. That is another order surprise.
3. The account pin swap (`rank.rs:340-373`) changes the invocation only for a pinned account whose
   CLI the current invocation lacks. It never prefers a generic form.
4. **Capability `confinement.mode: unconfined` never removes bwrap for a bound run.**
   `assignment-runner.mjs:1230-1241`: "an Assignment bound by bind() carries its posture, and that
   posture alone picks the requirement". `resolvePosture` always returns `mode: 'required'`
   (`policies.mjs:656-666`), `workspace-write` for a writer and `host-write-denied` otherwise. Also,
   an invocation without a backend never `carriesPosture` (`bind.mjs:162`), and a pin must carry the
   posture (`rank.rs:777-786`). So unconfined invocations are reachable only through `bindWorkSeat`
   (`postureAtLaunch`, `bind.mjs:576-583`, used by `src/runner/dispatch/plan.mjs:171,397`). An
   unconfined `herdr-spawn` invocation is unreachable: `herdrPresent` is unset there. Fact 3's
   suspicion is settled by code, and the cause is not `readOnlyRedirect`. The writer-unit experiment
   is now optional confirmation only (Phase 3, step E, owner-gated).
5. **What changes.** Config: remove the legacy forms and declare the generic forms first (P3). Repo:
   fix the standard's order and add one test that the default per executor is the generic form (P4).
   No selection code changes. Order stays the documented rule: "the generic forms come first; a
   variant comes after them and is reached by a pin". The rejected alternative is a code-level
   `default` flag, because it would add a key (listed under Ideas).

## Extension trace

Next credible variant: a sixth CLI, or a second confinement backend (macOS). The stable contract is
the invocation shape `{id, via, adapter, command, args, confinement, credentialStore,
interactiveMode, promptDelivery}` plus the account store `llmAccounts.<pool>.<account>.credentialStore.<cli>`.
A new CLI changes three things: a terminal profile (`packages/agent-protocol/rust/src/terminal/<cli>.rs`)
for herdr, a `CLI_LOGIN_HOMES` row (`src/runner/dispatch/llm-accounts.mjs:268-274`), and its
invocations in the standard. A new backend changes the name suffix (`-<backend>`) and the driver.
The P4 naming test proves the rule for every standard invocation, so a new CLI that breaks it fails
`npm test`.

## Verification plan

- Lowest-layer proofs: terminal vectors (P1), the standard naming/default test in the owning
  committed-config binding test (P4), credential-store tests (P6), and the schema golden in
  `packages/config` (P6).
- Narrow first, then broad, one heavy run at a time: `cargo test -p fgos-agent-protocol`,
  `cargo test -p fgos-run-supervisor`, `cargo test -p fgos-seat-binding`, `cargo test -p fgos-config`,
  the named `node --test` files per phase, then `npm test` and `cargo test --workspace`.
- No-quota live checks after each global write: `fgos config check`, `fgos doctor`,
  `fgos dispatch explain --for {review,code:review,code:test,code:implement,advise}`, plus each of
  momentry running `fgos config check` with `--dir` (read-only).
- Quota-spending probes (owner-gated, listed per phase with expected rows): `fgos dispatch
  probe-account --provider <p> --account <a> --leg harness`.
- Impact analysis: `fgos dispatch decide --for impact-analysis` reports `stale: true`, so the posture
  is Degraded. Every symbol edit in P1/P6 needs an `rg` cross-check, and blast radius from GitNexus
  is weak evidence until reindexed (`node .gitnexus/run.cjs analyze` in the implementing worktree).

## Decisions needed from the owner

Full questions in the decision-question form are in [decisions.md](decisions.md). Summary with
recommendations:

- **D1 naming:** always state `-bwrap` (`<cli>-<transport>[-bwrap]`, rename 4 herdr ids). Recommended.
- **D2 unconfined forms:** delete every unconfined account-pinned form, keep `claude-cli` only, add no
  new unconfined forms. Recommended.
- **D3 accounts:** move all accounts to `runner.llmAccounts` and delete `runner.providers.*.accounts`. Recommended.
- **D4 global vs standard:** explicit generic lists in the global now, then unset them when every
  activation runs the new standard. Recommended.
- **D5 executor-level launch fields and env override:** delete in P6. Recommended.
- **D6 agy-herdr stopgap:** set `promptDelivery: file-pointer` on agy-herdr until P1 ships. Recommended if gemini seats are needed this week.
- **D7 state writes:** clear the gemini/mucdong quarantine. Owner call.
- **D8 mcp-skill-hub:** out of scope by owner decision (2026-11-17); P6 is not gated on it.
- **D9/D10:** withdrawn. The pool split in P8 replaces the interim and the order change.

## Ideas (not in scope; owner chooses, RUL104)

- A config-check row that warns when an invocation id's `-bwrap` suffix disagrees with
  `confinement.backend`. Real problem: the name lied for `claude-herdr-bwrap` vs `codex-herdr`.
  Benefit: catches drift in user files. Cost: one row in the config door.
- An explicit `default: true` on an invocation instead of declaration order. Real problem: fact 3.
  Benefit: order no longer matters. Cost: a new key across schema, Node facts and crate.

## Unresolved questions

1. Does herdr's `agent prompt` wait until the CLI has ingested a paste before it submits? Unverified.
   P1 step E2 answers it.
2. Where are today's per-second agy pane samples stored? Unverified. P1 step E1 re-captures them
   if they are not found.
3. Are `runner.providers.z-ai` and `.deepseek` accounts dead? Every global cell names `@thehive` or
   `@openrouter`, but RUL102 says the global file drops list and `@` cells. P5 step 1 checks with
   `explain`.
4. Does the openai `pi-cli-bwrap` `files` list leave out `models.json` on purpose, when `pi-herdr`
   includes it (global and standard)? P4 asks before unifying.
5. Does design-lap's global config still carry `resourceBindings` or `runner.providers`? This gates
   shipping P6 there (G3). Ask through the board log.
6. Does `fgos config set` on a whole `invocations` sequence refuse because nested notes are lost?
   No dry run exists. P3 has a fallback.
7. Residual (Q-A): "fgovn meant tetnu, and only mucdong is capped" is the assistant's reading of a
   terse owner reply. Reconfirm it at review.
8. Q-B: gemini is preferred in flagship `architecture:*` seats today. Should it stay there?
9. Does the agy invocation work when a second pool serves it? Step 0 and 4 of P8 prove it with `explain` before any reliance.

## Validation Log

### Verification Results (session 1, 2026-11-17, planner self-check; Full tier, 8 phases)
- Claims checked: 34 (file:line citations sampled across all phases, plus live read-only commands)
- Verified: 33 | Corrected: 1 (`provider-capacity.mjs` inventory lines were 277-286, now 284-296 and 57-141) | Unverified (tagged in text): agy ingestion-sample location, herdr `agent prompt` ingestion wait, agy `-p` edit behaviour without `--mode`, classification of mucdong's invalid-model launch
- Live read-only evidence: `fgos dispatch explain` (review, code:test, code:implement bind `agy-herdr`; code:review binds `codex-cli-bwrap`), `fgos config check` (9 `config-unknown-key` on `resourceBindings`), `fgos dispatch decide --for impact-analysis` (stale, so Degraded), activation records of three workspaces
- Interview step not run: a subagent cannot ask the owner. The questions are batched in decisions.md (D1-D10, Q-A, Q-B) for the coordinator to relay.
