# Phase 0: Root-cause gate (design or leftover mess?)

Status: findings drafted 2026-11-17, awaiting owner verdict. **No other phase starts until the
owner signs this gate.**

## Question (owner, 2026-11-17)

Why are invocations and accounts configured in several different ways? Is that designed, or is it
legacy that was never finished? Unfinished legacy gets fixed, and fixing it is the goal of this
plan. A real feature or limitation is stated and discussed with the owner before anything changes.

## Evidence (from git history and the specs, quoted not inferred)

| Shape today | Verdict | Evidence |
|---|---|---|
| `resourceBindings` on an invocation | **Unfinished legacy** | Commit `4f6fc44d7` (2026-10-19) moved the project config to `credentialStore` and says "The older resourceBindings stay so a release without the field still runs this config": a temporary shim. The settled-facts doc (`docs/platform/agent-confinement/history/rollout-and-settled-facts.md`, fact 1) says the inference branch is "deleted when those configs have migrated". The global config never migrated. |
| Account-pinned invocation ids (`codex-herdr-fgovn`, `omp-*-vantt`) | **Unfinished legacy** | Same 2026-10-19 change: "ids that carried an account name drop it" (`codex-herdr-fgovn` became `codex-herdr`), and the account is leased at launch (RUL80, RUL105). Applied to the project config only. |
| `runner.providers.<p>.accounts` | **Unfinished legacy** | Runner spec row 1b calls it a "transition read"; `runner.llmAccounts` (`a7dedce62`, 2026-10-17) is the target. Config spec line 63 still lists both. |
| Three account declaration shapes in one file | Consequence of the two rows above | One shape was added without removing the other. |
| `FGOS_HERDR_PROMPT_DELIVERY` env override | **Leftover** | Added 2026-10-15/18 (`febafe586`, `340cc7d85`) as an escape hatch before `promptDelivery` was an invocation field. |
| Legacy forms win selection | **Accident, not design** | `bind()` takes the first matching invocation in list order. The legacy forms are only listed first. |
| `agy-herdr` returns `other` | **Bug** | Root cause proven: supervisor gives up while agy is still ingesting a long brief. |
| Generic forms plus separate structural variants (unconfined, herdr, bwrap) | **Real design, keep** | Each is a different capability. This is the flexibility the owner wants to keep. |
| Account pin (`pool/account`, RUL91) | **Real feature, keep** | It pins an account, not an invocation, and is independent of invocation ids. |
| No per-account model or tier cap | **Real limitation, already solved by design** | No per-account key exists, but RUL102 lets a tier cell name a pool (`model@pool`), so a capped account sits in its own pool that high-tier cells do not name. Deepseek on thehive already works this way (`822a9f14f`, `5c19c18cf`). Owner agreed 2026-11-17: P8 uses it, no new key. |

Verdict drafted: the inconsistency is **mostly unfinished legacy** (two migrations of 2026-10-17
and 2026-10-19 landed in the repo standard and project config but were never applied to the global
config or accounts file, and their compatibility shims were never deleted). Three items are real
and need the owner's call: the selection rule (list order is implicit, and the naming rule in P4
makes it explicit), the account-pin feature (kept), and the tier cap (new feature).

## Reply from HARDEN (fg-server2, 2026-11-17, `plans/reports/reply-261117-1033-seat-binding-need-ack-design-lap.md`)

Confirms the verdict. V1 to V4, V5, V7 are not solved on their side: nothing converts `resourceBindings` or renames ids by hand-free means (only account pools migrate, `fgos config migrate --global`); `credentialStoreOf`, the executor-level launch fields and `FGOS_HERDR_PROMPT_DELIVERY` are still in code; `llmAccounts` retirement of `runner.providers` is owned by board row MP-C (held). Their fg-server2 config is clean only because it declares no such invocations. Two settled rules to respect: a pin is hard (`seat-binding/spec.md:266`), and `agent-confinement/spec.md:413` freezes the `claude-bwrap`, `agy-bwrap`, `codex-bwrap` names, so D1 (rename four ids) needs a new decision. Collision: S5 (Execution read door) moves `bind()` to a Rust crate and edits `packages/seat-binding/**`, the schema and standard roles, so P4 (naming) and P6 (readers) wait for or fold into S5. Trap `p-lndtbwbjjl`: a global `executors.<id>.invocations` replaces the standard list whole, so P3 must check that claude keeps `credentialStore` and `sessionDir`.

## Still to verify before sign-off (read-only)

1. Fact 1 says the inference branch "is deleted"; the code still has it (`rg resourceBindings src`).
   Find out whether it was deleted and came back, or the doc is ahead of the code.
2. `git log -S` under the pre-rename executor ids for the account-pinned forms, to confirm no
   deliberate reason exists for keeping them (for example a CLI with no login-home variable).
3. Whether any other machine or workspace still needs a legacy shape (design-lap: ask via the
   board log).

## Gate

The owner reads this table, confirms or corrects each verdict, and answers the three real items.
Pass means P1 onward may start. Fail (a row turns out to be a feature) means the plan is
rewritten around that row before any change.

## Safety rule for every later phase (owner, 2026-11-17)

Breaking things temporarily while working is acceptable. Leaving them broken is not. So every phase:
backs up the file it changes first, changes one executor or one file at a time, probes after each
step, and keeps a written rollback. The end state of each phase must run on every activated release
on this machine.
