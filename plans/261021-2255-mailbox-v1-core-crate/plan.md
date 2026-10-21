---
title: "Mailbox V1: the pure core crate fgos-mailbox-core"
description: "Build rung V1 of the Agent Mailbox ladder: the serde-only Rust crate fgos-mailbox-core (envelope, registry and generations, name resolution, state machine with lazy sweep, channel policies, effective wake, bounded counters, peer frame and body escape), proven by cargo test -p fgos-mailbox-core, on branch mailbox/v1-v3 only."
status: pending
priority: P2
effort: ~3.5d (8 phases, strictly sequential)
branch: main (plan only); all code on branch mailbox/v1-v3 in linked worktree ../forgent-mailbox, never merged to main until feasibility is proven
tags: [mailbox, rust, core, feature, tdd]
blockedBy: []
blocks: []
created: 2026-10-21
---

# Mailbox V1: the pure core crate `fgos-mailbox-core`

Main at planning time: `af9f4b109` (2026-10-21 23:04 Asia/Saigon); re-checked on `7ce5672b3` (23:40), docs-only commits in between. Spec: [`docs/platform/agent-mailbox/spec.md`](../../docs/platform/agent-mailbox/spec.md) (G0 signed 2026-10-20). Board row `MAIL` in [the program board](../261017-1313-fgos-platform-program-board/plan.md). Hand-off: [guide](../reports/guide-261021-1132-mailbox-v1-handoff-to-another-machine.md).

## Outcome

`cargo test -p fgos-mailbox-core` proves the mailbox's policy logic with no file, no clock, no process and no CLI: envelope, the four-row registration table and per-process generations, short names and resolution, `recorded → in-flight → offered | refused` with claim/emit/finish and a lazy sweep, every channel policy of spec §5.3, the effective wake, bounded refusal counters, and the peer frame with a hostile-body escape. The scripted pair of the loop test is replayed without a model and reproduces the measured numbers (wake quota at message 6, chain depth at message 8, wake lifetime cap at message 101). V1 proves nothing about storage, hooks, CLIs or models (spec §14).

## Where the code lives (owner, 2026-10-21 22:58)

- All mailbox code, contracts and doc updates live on branch **`mailbox/v1-v3`** in the linked worktree **`/home/vantt/projects/forgent-mailbox`** (`../forgent-mailbox`, sibling of the main checkout). Every phase commits to that branch only.
- **Nothing from this plan merges to main until the owner says feasibility is proven.** Only this plan directory goes to main (the controller commits it).
- V3 continues on the same branch after V1 (board row `MAIL`).

## Branch sync rule (owner, 2026-10-21)

`mailbox/v1-v3` is never merged into main, and it is kept in sync with main often. The branch is shared across leads, so it is updated by **merge, never rebase**:

```bash
cd /home/vantt/projects/forgent-mailbox
git fetch origin
git merge --no-edit origin/main     # resolve conflicts on the branch; for Cargo.lock and the census, regenerate rather than hand-merge
```

Run this **at the start of every phase, at the end of every phase, and immediately before every test run that counts as proof**. Order at the end of a phase: commit the phase's work, then fetch and merge, then run the proof, then commit any regenerated census or lock, then `git push origin mailbox/v1-v3` (push at the end of every phase so another lead or machine sees the branch). After a merge that brought changes, rerun the phase's proof commands. A phase counts as done only when its proof is green on top of a fresh `origin/main` merge. Conflicts in `Cargo.lock` are resolved by taking main's lock and running `cargo build -p fgos-mailbox-core` once without `--locked` and in `packages/git/contracts/mutation-census.v1.json` by `node scripts/git-one-door-scan.mjs --write-census`, then committed in the merge commit.

## Phases

| # | Phase | Proof | Status |
|---|---|---|---|
| 1 | [Worktree, crate skeleton, limits contract, purity lint](phase-01-worktree-crate-skeleton-and-limits-contract.md) | crate builds; contract ↔ `Limits` agreement test; disallowed-I/O lint bites | pending |
| 2 | [Identities, registry, generations, short names, resolution](phase-02-identities-registry-and-names.md) | four-row table; generation rules; names | pending |
| 3 | [Send (plain), claim, emit, finish, inbox view](phase-03-send-claim-finish-state-machine.md) | token and generation checks; duplicate window; inbox read-only | pending |
| 4 | [Lazy sweep: deadlines, offer cap, record TTL, notices lane, retention](phase-04-sweep-ttl-offer-cap-and-notices.md) | sweep and notice rules | pending |
| 5 | [Send policies and bounded refusal counters](phase-05-send-policies-and-bounded-counters.md) | size, derived link and depth, budget, lifetime, loop, group, queue; A→B→C→A; snapshot bounded under a refusal flood | pending |
| 6 | [Effective wake, Stop drain, scripted loop replays](phase-06-effective-wake-stop-drain-and-loop-replays.md) | quota spent at send; Stop selects only effective wake; 6 / 8 / 101 | pending |
| 7 | [Peer frame and body escape](phase-07-peer-frame-and-body-escape.md) | hostile bodies cannot close, forge or imitate | pending |
| 8 | [Branch docs, full gates, hand-off](phase-08-branch-docs-gates-and-handoff.md) | workspace cargo gates and `npm test` green on the branch | pending |

Phases share `src/lib.rs` and `tests/common/mod.rs`, so they run one after another (no parallel leads).

## Architecture in one screen

- Crate `fgos-mailbox-core` at `packages/mailbox/rust/core`; `[dependencies]` = `serde` only; `[dev-dependencies]` = `serde_json` (tests load the contracts). Cargo enforces spec §4 rule 1. A crate-local `clippy.toml` (`disallowed-methods`, `disallowed-types`, `disallowed-macros`) plus `#![deny(clippy::print_stdout, clippy::print_stderr)]` **narrows** rule 3 (no I/O) to the listed entry points; review still owns the rule, as the spec says (the option spec §4 names "to add at V1").
- One aggregate, `MailboxState` (serde): the whole metadata snapshot of spec §6.4 minus bodies. Every operation is a method that takes `now: Timestamp`, `&Limits` and, where it mints ids, `&mut dyn IdSource`. V2 persists `MailboxState` as is; the core never sees a file.
- The core never interprets a process identity: a binding carries the head's identity and native handle as opaque strings written by the store crate (`fgos_process::Record::to_json`, measured at `packages/process/rust/src/facts.rs:117`), and registration takes the store's judgement as plain input, `Option<StoredHead { same_head: bool, liveness: Liveness::{Alive, Dead, Unknown} }>` (spec §5.1). The store reads the stored binding with `binding(&self, key)`, judges it, then calls `register`.
- Snapshot rule: every `MailboxState` field round-trips through `serde_json` from an owned `String`; every map key is a `String` newtype (composite keys are rendered as one canonical string), every enum is a serde enum, nothing borrows. One test owns this and every phase that adds a field extends it.
- A refused `send` still changes state (the attempt counts toward the budget, a counter is bumped), so the store installs the snapshot after `Err` as well as after `Ok`.
- Contracts are the authority (spec §6): `packages/mailbox/contracts/limits.v1.json` holds every core configuration key with its spec §12 starting value (no numeric constant in Rust); `packages/mailbox/contracts/frame.v1.txt` is the one source of the frame and notice text, embedded with `include_str!` (compile time, not I/O).
- Clock: `MailboxState` keeps a high-water mark `last_now`; every operation uses `max(now, last_now)`, so a wall clock that steps back never shrinks a window or extends a deadline.
- Ports: only `IdSource` (one method returning a fresh `u64`); time is a plain parameter. `Nudge` and `Presence` are not defined in V1: they have no caller until V3/V5 and spec §4 rule 5 adds a port only with a real implementation.
- Integration tests in `tests/` drive the public API only; one owning test file per behaviour area (map in each phase). The only test helper that implements a port is `SeqIds` (a counter `IdSource`), a real implementation of the port, not a mock.

## Hiện trạng tiền đề (kiểm 2026-10-21)

Checked on main `af9f4b109` and re-checked on `7ce5672b3` by reading code and `git log`. V1 itself needs none of these; the table says what each finding changes for later rungs.

| Prerequisite / adjacent component | Exists? | Where (path:line or commit) | What it changes |
|---|---|---|---|
| Holder-lock registry row `mailbox` (mutex, rank 80, repo scope) | **No** | `packages/holder-lock/contracts/lock-registry.v1.json` lists 22 rows (`sessions`, `observe`, `reconcile`, `repo-config` … at rank 80), none `mailbox`; `docs/platform/holder-lock/spec.md` has no mailbox line | V2 still waits for it. It is one JSON row plus one spec line owned by the holder-lock lane; it can be requested now so V2 starts right after V1. HARDEN T1 (holder-lock) is pending and may touch the registry: coordinate on the board |
| Rust resolver: main checkout's `.fgos` from any cwd | **Partly — a resolver of the main checkout root exists**; spec §6.4 and the hand-off guide say none exists | `fgos_git::GitDriver::open_at(path)` → `RepoHandle::trusted_main_root()` (`packages/git/rust/src/driver.rs:345`, `packages/git/rust/src/lib.rs:135`; landed in `5430a8b68`, 2026-10-20 18:00); wrapped by `fgos_distribution::workspace::resolve_workspace_root` (`packages/distribution/rust/src/workspace.rs:28`), "the main checkout … never the linked worktree's own top level". `apps/fgos` already depends on `fgos-distribution` (`apps/fgos/Cargo.toml:8`). `resolve_target_root` (`apps/fgos/src/main.rs:123`) is unchanged and still walks to the nearest `.fgos` | V5 should reuse `resolve_workspace_root(cwd)?.join(".fgos")` (one door, L10) instead of writing a new `gitdir`/`commondir` reader. Unverified: behaviour from inside a linked worktree (its only test runs in the main checkout, `workspace.rs:85`) and its cost on the hook hot path (it opens the Git driver and its floor verdict). V5 must prove both; the spec's resolver paragraph needs a correction at V5 |
| Native host routing of `hook` | **No** | `packages/host-runtime/contracts/command-routes.json:396-399` (`hook`: `route_kind: legacy-cli`, payload `legacy-node`); native precedent `identity` and `NATIVE_SUBCOMMANDS` in `apps/fgos/src/main.rs:103-121` (`COMPOSITION_PROVIDERS` with `IDENTITY_DESCRIPTOR`) | V5 still waits (host-invocation-routing lane) |
| Session identity `is_attempt_writer_id` | **No** | only `ATTEMPT_PREFIX = "att-"` and `mint_attempt_writer_id` (`packages/session-identity/rust/src/attempt.rs:9,33`; re-exported `lib.rs:16`) | The V3 runner-head case moves to V5 unless exported first (spec §14). HARDEN T1 owns session identity and is pending; ask it there. V1 is unaffected: the core never sees writer-id kinds (the wiring never registers an `att-` head) |
| Confinement hidden roots include the mailbox root | **No** | `BLIND_HIDDEN_ROOTS` at `src/runner/dispatch/confinement/resources.mjs:26-32` (`assignments`, `workflow-runs`, `dispatch-runs`, herdr socket dir, confinement temp root); `docs/specs/confinement-authority.md` has no mailbox | V4 still waits |
| Durable-file atomic replace | **Yes** | `replace_durably` at `packages/durable-file/rust/src/lib.rs:164` (also `replace_durably_observed` `:187` with `ReplacePoint`, usable for V2's kill matrix); hardened in T0 (`1c7b6f8c5`) | V2 can use it as is |
| Process liveness `Alive/Dead/Unknown` | **Yes** | `Verdict` `packages/process/rust/src/facts.rs:19-27`, `Record` `:65` with `to_json`/`from_json` `:90,117`, `judge` `:206`, `judge_here` `:242` | V2 judges with `judge_here` and stores `Record::to_json()` text in the core's opaque head field. No change to V1's design |
| HARDEN T0 process-facts door (`plans/261021-1547-harden-t0-process-facts-door`) | **Landed** on main (`7d1f1c1b2` merge, closed `3eaa29250`) although its `plan.md` front matter still says `pending` | the door is a Node-facing in-process addon; Rust callers use `fgos-process` directly | Mailbox (Rust) calls `fgos-process` directly, not the Node door. No V1 effect |
| HARDEN low layers (`plans/261021-1118-harden-low-layers-bottom-up`) | T0 landed; **T1 (holder-lock, session identity, convention) pending**, waits for SEAT | `plan.md:61-62`; interaction row `MAIL` at `:123`: "Any T0/T1 API change is announced on the board before merge" | V2/V3/V5 may meet T1 API changes in `fgos-holder-lock` and `fgos-session-identity`. V1 has no such dependency |

Net effect: V1 and V3 wait for nobody (unchanged). V2 is one registry row away. V5's resolver prerequisite is largely met by an existing function (needs a linked-worktree test and a cost check); its host `hook` routing is not.

## Decisions taken in this plan (agent decisions inside the signed frame)

Each is recorded in the spec on the branch in phase 8 (L5 question 6) as an agent decision, never attributed to the owner. None reverses a §17 decision. Items marked *(red-team)* were changed by the red-team pass.

1. **Starting values live in one contract file**, `packages/mailbox/contracts/limits.v1.json` (one `keys` list: key, default, unit, meaning, status), never as Rust constants (spec §5.3 "not in code constants"). `Limits` has no `Default`; every field is required. Registration into `fgos setup` config-merge is deferred to **V5**, the first rung with a runtime reader; this is the plan's choice (V1 has no reader), not an owner decision *(red-team)*.
2. **Message ids, attempt tokens and name suffixes come from `IdSource`**, not from a snapshot counter: a lost or reset snapshot must never reuse an id, because the frame tells the model to "ignore a repeated id".
3. **Both the session budget and the lifetime send cap count attempts** that reached the policy checks, refused or not. Spec §5.3 says the budget counts refused attempts and the lifetime cap is "the only brake that does not depend on a reset"; a sender retrying a refused send every turn must meet that brake *(red-team: was "recorded only")*.
4. **Refusal order at `send`** (first match wins, one reason per refusal): group → name resolution (unknown, ambiguous) → `reply_to` hint → size → session budget → lifetime cap → chain depth → loop guard → queue cap (total, then per-sender share). Then the effective wake: exchange quota, then wake lifetime cap.
5. **Header retention ("loop window plus the depth horizon", spec §5.3)**: a header of an `offered` or `refused` message is removed `max(loop.windowSec, record.ttlSec, record.bodyRetentionSec)` after its last state change, and its body reference is dropped `record.bodyRetentionSec` after that change. A body is never kept without the header that references it (with the §12 values both go at 7 days).
6. **Reply link is always derived** (spec §5.4: "only the derived link feeds the guards"): parent = the most recently offered, unanswered `Message` from the recipient to the sender. A caller hint never chooses the parent; it is refused (`reply-to-not-offered`) unless it names an `Offered` message from the recipient to the sender, and otherwise only shown *(red-team: the hint chose the parent and could reset depth)*.
7. **Short names**: project part = folder name with every character outside `[A-Za-z0-9._-]` replaced by `-`, cut so the whole name fits `frame.maxHeaderChars`. Suffix: the Claude head's own two characters only when they match `[0-9a-z]{2}` and are free within project and CLI; otherwise lowercase hex from `IdSource`, 2 characters, 3 on a collision, then 4 … *(red-team: suffix and length unvalidated)*.
8. **Escape** (phase 7): header values keep only `[A-Za-z0-9._-]` (others become `_`), cut to `frame.maxHeaderChars`. Body: CR, CRLF, NEL, U+2028, U+2029 become `\n`; every other control character except `\t`, every Unicode format character (bidi controls, zero-width characters, LRM/RLM/ALM, BOM, tag characters U+E0000-U+E007F), private-use code points and noncharacters are removed; `&`, `<`, `>` become entities; every body line gets the gutter `| `. The gutter is the structural guarantee; entity encoding is not a defence against a model that decodes entities *(red-team: format characters)*. Templates are filled in one left-to-right pass, never re-scanning substituted text.
9. **Notices** go to the refused message's `(from, from_generation)`. They are dropped with a counter when that sender has no head or its generation is no longer current, when they reach `notices.cap`, or when they wait past `record.ttlSec`. They use the claim/emit/finish protocol, are never offered at `Stop`, and are never redelivered after a missed deadline. Their own tag `<mailbox-notice>` distinguishes them from peer frames. A separate record `notice_last[(to, reason)]` enforces "at most one per (sender, reason) per window" even after a notice was delivered *(red-team)*.
10. **Lazy sweep runs inside every mutating operation** (`send`, `claim`, `register`) and is also callable alone (`sweep`, for `status`); `inbox` (read-only) takes `&self`.
11. **No binding pruning in V1** *(red-team: pruning made a live head deaf, restarted generations at 1 against the signed table row, and reset caps that are "never reset")*. Bindings of dead heads stay; how they are retired is owner question Q2, decided before V2, where liveness is available.
12. **Senders with no head** (the runner, the `fgos` CLI, any `from` that names no binding) are accounted as one shared sender, `unregistered`, for the budget, loop guard, per-sender queue share, exchange and counter attribution; the header still records the real `from` for attribution. This bounds every per-sender map by the number of bindings plus one, so rotating `from` (it is unauthenticated, spec §5.1) neither bypasses a policy nor grows the snapshot *(red-team)*. Lifetime caps for this shared sender: owner question Q3.
13. **Queue counts only deliverable mail**: checks 9-10 count pending mail whose `to_generation` is the recipient's current generation, so a replaced head's leftover mail cannot block mail for its successor until the TTL *(red-team)*.
14. **Counters are two-tier**: a fixed, non-evictable total per refusal reason (one entry per enum variant), plus the evictable per-(reason, sender, recipient) map bounded by `counters.maxKeys`; a burst of cheap refusals can no longer evict the totals `status` needs *(red-team)*.
15. **Frame reply command follows the verb contract of spec §6.1** (`fgos mailbox send --to <name> …`), not the positional example in §5.5; phase 8 corrects the §5.5 example on the branch. A frame from a sender with no head has no reply line (nothing can reach it) *(red-team)*.
16. **Out of V1** *(red-team: beyond the V1 rung)*: the Stop-block bound `mailbox.stopBlock.max` (hook behaviour, rung V3, where the payload fixtures show each CLI's block shape) and a body garbage-collection query (rung V2).

## Câu hỏi cho owner

**Owner answered 2026-10-21 23:50 ("ok như đề nghị"): Q1 option A, Q2 option B (prune at V2), Q3 option A — each exactly as recommended below.** The provisional defaults are now decisions; record them in spec §17 on the branch in phase 8.

**Q1. Three numbers the core needs have no configuration key in spec §12.**

- **Chuyện gì đang xảy ra:** Spec §5.3 and §5.5 require a notices-lane cap ("their own small cap"), a dedupe window ("at most one notice per (sender, reason) per window") and a header length bound ("bounded length"), but §12 lists no key or value for any of them. The rule for this work is that every number is a configuration key and no value is invented.
- **Nguyên nhân:** Read spec §5.3 (line 274), §5.5 (line 298) and §12 (lines 456-480): the three are named without numbers. No other component holds them.
- **Các lựa chọn:**
  - A. Three new keys in `limits.v1.json`, each with a borrowed placeholder marked "unmeasured, owner to confirm": `mailbox.notices.cap` = 10 (the value of `mailbox.queue.perSender`), `mailbox.notices.windowSec` = 600 (the value of `mailbox.loop.windowSec`), `mailbox.frame.maxHeaderChars` = 200 (session identity's `MAX_ID_LENGTH`, `packages/session-identity/rust/src/resolve.rs:15`, the bound writer ids already obey). Gain: each meaning tunable alone, no invented number. Cost: 3 keys, ~10 lines.
  - B. No new keys; the core reuses `queue.perSender` and `loop.windowSec` directly and hard-codes 200. Gain: fewer keys. Harm: tuning the queue silently changes the notices cap; a Rust constant breaks decision 1.
  - C. The owner gives three numbers. Gain: owner-chosen. Cost: waits for the owner.
- **Khuyến nghị:** A.
- **Phạm vi của câu trả lời:** A yes authorises three keys with borrowed placeholder values. It signs no value (G0 signs no number) and changes no other key.
- **Decided by owner:** A (phases 1, 4, 7).

**Q2. How are the bindings of dead heads retired?**

- **Chuyện gì đang xảy ra:** Every head that ever registers leaves a binding. Spec §5.1 keeps the generation number across processes ("or the next number if the name was held before") and §5.3 says the lifetime caps are "never reset". Keeping every binding forever satisfies both, but the snapshot, which every hook reads and rewrites, then grows with every session ever started (roughly 300 bytes each; at 30 sessions a day about 3 MB a year), against the 50 ms hook target.
- **Nguyên nhân:** The red-team showed that pruning by idle time (the first draft) makes a live but quiet head deaf for good, because registration happens once per process (spec lines 170, 192), and that it restarts generations at 1. The core cannot tell a dead head from a quiet one; only the store (V2) can, with `fgos_process::judge_here`.
- **Các lựa chọn:**
  - A. Keep all bindings (spec text as signed). Gain: no rule changes. Harm: unbounded growth; cost appears months later.
  - B. At V2, prune a binding only when the store judges its head `Dead`, it has been idle for `record.ttlSec` and no header or notice names it; a later registration of the same key starts at generation 1. Gain: bounded; a dead head cannot send, so resetting its caps changes nothing it can do. Harm: departs from "next number if held before"; generation numbers can repeat for one key, safe only while nothing outside headers stores a generation. Cost: ~40 lines at V2, one test.
  - C. As B, but keep a tombstone `key → last generation` so numbers never repeat. Gain: matches the signed row. Harm: tombstones grow too (smaller, ~60 bytes each). Cost: ~60 lines.
- **Khuyến nghị:** B, decided at V2 with liveness; it bounds growth and nothing in the first slice stores a generation outside headers.
- **Phạm vi của câu trả lời:** A yes amends spec §5.1 row 1 for pruned keys and authorises the V2 pruning rule. It does not change generations for live or recently dead heads.
- **Provisional default applied:** V1 prunes nothing (option A behaviour); V2 waits for this answer before adding pruning.

**Q3. Do the lifetime caps apply to senders with no head (the runner, the `fgos` CLI)?**

- **Chuyện gì đang xảy ra:** The lifetime send cap (200) and the wake lifetime cap (50) are defined "per generation" (spec §5.3, §12) and "never reset". A sender with no head has no generation. If its shared bucket (decision 12) were capped and never reset, the runner and the CLI together could send 200 messages in the life of the project, then never again.
- **Nguyên nhân:** Spec §5.3 and §1 allow the runner and the CLI as senders but define the lifetime caps only for sessions with a generation; no rule covers the gap.
- **Các lựa chọn:**
  - A. Lifetime caps apply only to registered heads; the shared `unregistered` sender is braked by the rolling budget, loop guard, queue share, depth and exchange quota. Gain: the runner and CLI keep working. Harm: no reset-free brake for them; a script looping through the CLI is stopped every window but never for good. Cost: none.
  - B. Apply the caps to the shared bucket and never reset. Gain: strict. Harm: the runner and the CLI eventually lose the mailbox for good.
  - C. Apply the caps to the shared bucket, reset when the snapshot is recreated or by an explicit owner action. Gain: a brake with a human reset. Cost: one verb or flag later (V5/V7).
- **Khuyến nghị:** A for the first slice (no consumer sends through the runner yet, spec §16 Q3); revisit when one does.
- **Phạm vi của câu trả lời:** A yes exempts only the shared unregistered sender from the two lifetime caps; every other policy still applies to it.
- **Decided by owner:** A (phases 5, 6).

## Risks the implementer must know

- **Spec facts found stale**: the main-checkout resolver exists (table above); fix the spec text at V5, not in V1. The §5.5 reply command example disagrees with the §6.1 verb (decision 15); phase 8 fixes the example on the branch.
- **Mutation census**: every new `.rs` file under `packages/` is hashed in `packages/git/contracts/mutation-census.v1.json` (doctor check `git-mutation-one-door`). Each code commit regenerates it with `node scripts/git-one-door-scan.mjs --write-census` in the same commit. Expect a census conflict when the branch finally merges; regenerate then.
- **`Cargo.lock`** changes with the new member; CI runs `--locked`, so the lock is committed with phase 1.
- **Workspace `Cargo.toml` already lists `packages/durable-file/rust` twice** (lines 7 and 24). Out of this plan's scope (RUL11): report it as a separate item, do not fix it on the mailbox branch.
- **Branch drift**: main moves while the branch lives. Follow the branch sync rule above (merge, never rebase); never push or merge the branch into main.
- **V2 snapshot size** (code review M3): the 50 ms hook measurement must include a steady-state snapshot holding a week of headers at the §12 limits (headers live `max(loop.windowSec, record.ttlSec, record.bodyRetentionSec)`, 7 days with the §12 values).
- **V2 dead bindings** (code review, consequence of Q2 option B): until V2 prunes, dead bindings stay addressable, so a name prefix such as `forgent-codex` becomes ambiguous after the second Codex session ever, and mail to a name whose only binding is dead waits for its record TTL instead of being refused as an unknown address. V2's pruning and liveness must address both.
- **Board**: AGENTS.md asks a lane lead to update its board row when it starts, finishes or blocks. The board lives on main; the implementer reports state to the controller, who updates row `MAIL` (the board is plan text, not mailbox code).

## Validation Log

### Session 1 — 2026-10-21

**Trigger:** `ak-plan validate` after drafting; the planning lead cannot ask the owner, so every question that the spec, reports or code could answer was resolved from them, and only owner-intent questions went to "Câu hỏi cho owner".
**Questions raised:** 7. Resolved from evidence: 6. Sent to the owner: 1 (Q1, provisional default applied).

| # | Question | Resolution | Source |
|---|---|---|---|
| V1 | Does V1 define the `Nudge` and `Presence` port traits? | No: no caller or implementation until V3/V5 | spec §4 rule 5 (line 149) |
| V2 | Does V1 compose the delivery-report sentence? | No: V1 returns a typed `WakeDrop`; the sentence needs the tier, composed at V3 | spec §14 V1 row (line 515), §6.2 |
| V3 | Is the Stop-block bound (`mailbox.stopBlock.max`) core or hook? | First answered "core"; **reversed by the red-team**: it is not in the §11 core suite and its shape depends on each CLI's block output, so it moves to V3 (decision 16) | spec §6.1 (line 311), §5.3 heading "core, adapter-independent" |
| V4 | Do config keys register in `fgos setup` / doctor at V1? | No: spec §12 puts the doctor check at V7; the contract is ready for registration then | spec §12 (lines 458, 482) |
| V5 | Is a `CHANGELOG.md` line needed? | No: not user visible; the line lands at V7 | spec §12 (line 458), §14 V7 |
| V6 | Must the new package register in `docs/architecture-manifest.json` / `test/architecture.test.mjs`? | No: they scan only `.mjs` under `src`/`bin`; the crate boundary is enforced by Cargo | spec §4 (line 143), §16 Q7; manifest `components` holds only `packaging-distribution` |
| V7 | Three numbers with no §12 key | Owner question Q1 | spec §5.3 (line 274), §5.5 (line 298) |

### Verification Results

- Claims checked: 52 (paths, line numbers, symbols, commands across plan.md and phases 1-8). Tier: Full (8 phases).
- Verified: 49 | Failed: 3 (all fixed) | Unverified: 1.
- Failures fixed: (1) phase 8 used `fgos convention path --kind report --slug …` without `--type`, which errors (`invalid-type`); now `--type closing`. (2) phase 2 introduced `MailboxState::register` while `MailboxState` was first created in phase 3; `state.rs` now starts in phase 2. (3) `register` lacked `&Limits` although phase 4 makes it run the sweep; signature fixed.
- Verified empirically: a crate-local `clippy.toml` applies to that crate only inside a workspace with a root `clippy.toml` (scratch two-crate workspace, `cargo clippy --workspace --all-targets -- -D warnings`: the crate with the file failed on `std::fs::read` and `SystemTime::now`, its sibling passed).
- Unverified (left to the rung that needs it): whether `resolve_workspace_root` returns the main checkout from inside a linked worktree and what it costs on the hook path (V5).

### Whole-Plan Consistency Sweep

Searched all plan files for `peer-frame` (renamed to `frame.v1.txt` everywhere), `MailboxState::new` (phase 2 now owns it), `register(` signatures (one shape), header-retention wording (decision 5 and phase 4 agree), the escape list (decision 8 and phase 7 agree) and the branch-sync rule (plan.md section plus every phase gate). No contradiction left.

## Red Team Review

### Session — 2026-10-21

**Findings:** 25 after deduplication of 36 (23 accepted, 2 partially accepted with the rejected part recorded)
**Severity breakdown:** 3 Critical, 8 High, 14 Medium

Key changes:
- no binding pruning in V1 (owner Q2);
- snapshot map keys are strings, with one round-trip test extended per phase;
- senders with no head share one accounting identity, and the flood test bounds the serialized size (owner Q3);
- the reply link is always derived;
- notices go to the sender's generation and have a separate dedupe record;
- the queue counts only the current generation;
- the lifetime cap counts attempts;
- format characters are removed and the template fill is single-pass;
- notices get their own tag;
- the reply command follows the `send` verb;
- the purity lint is complete per family and described as narrowing, not enforcing;
- the Stop-block bound and the body-GC query move out of V1.

Rejected parts:
- merging the 6/8/101 replays into the rule tests (spec §14 V1 row requires the replay);
- dropping the missing-key contract check (it guards decision 1).

Full table: [reports/validation-and-red-team.md](reports/validation-and-red-team.md).

## Validation and red-team record

Red-team adjudication: [reports/validation-and-red-team.md](reports/validation-and-red-team.md).
