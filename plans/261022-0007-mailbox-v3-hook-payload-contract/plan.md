---
title: "Mailbox V3: hook payload contract tests in crate fgos-mailbox"
description: "Build rung V3 of the Agent Mailbox ladder: record real Stop and PostToolUse hook payloads from Claude Code, Codex and agy, redact them into fixtures, and prove the drain function against them (output shape each CLI accepted, fail-quiet, agent_id skip, generation registration, Stop-block bound) with cargo test -p fgos-mailbox, on branch mailbox/v1-v3 only."
status: completed
priority: P2
effort: ~3d (7 phases, strictly sequential)
branch: main (plan only); all code on branch mailbox/v1-v3 in linked worktree /home/vantt/projects/forgent-mailbox, never merged to main until the owner says feasibility is proven
tags: [mailbox, rust, hooks, fixtures, feature, tdd]
blockedBy: [261021-2255-mailbox-v1-core-crate]
blocks: []
created: 2026-10-22
---

# Mailbox V3: hook payload contract tests in crate `fgos-mailbox`

Planned on main `9670da5ff` (2026-10-22 00:07 Asia/Saigon). Branch `mailbox/v1-v3` at `891467ed7` (V1 phase 8 committed as `e297a7ac1`, merged with main, **not yet pushed**: local branch ahead of `origin/mailbox/v1-v3` by 7). Spec: [`docs/platform/agent-mailbox/spec.md`](../../docs/platform/agent-mailbox/spec.md), G0 signed 2026-10-20; the branch copy carries the V1 additions (read it with `git -C /home/vantt/projects/forgent-mailbox show HEAD:docs/platform/agent-mailbox/spec.md`). V1 plan: [`../261021-2255-mailbox-v1-core-crate/plan.md`](../261021-2255-mailbox-v1-core-crate/plan.md). Board row `MAIL` in [the program board](../261017-1313-fgos-platform-program-board/plan.md).

## Outcome

`cargo test -p fgos-mailbox` proves the receiver-side hook contract against payloads recorded from the real CLIs on this machine. For each of Claude Code, Codex and agy, a recorded `Stop` and `PostToolUse` payload goes into the drain function, and the payload suite asserts:

1. **Output shape.** The reply parses to the same JSON value that the CLI was **seen to inject** in a recorded canary run: block-and-continue at `Stop`, `additionalContext` at `PostToolUse`. "Seen to inject" is judged by the record type in the CLI's own transcript and by the continuation, never by finding the canary string alone.
2. **Fail quiet.** Every malformed, mismatched, subordinate or incomplete-head input gives an empty reply and leaves the snapshot equal to before. The other quiet cases may write, and the plan names which (decision 5). The drain's surface has no error channel: `begin` and `render_reply` are infallible.
3. **`agent_id` skip.** A payload carrying `agent_id` or `agent_type` (a subagent's own tool call) claims, prints and finishes nothing, and the same mail is offered at the head's next event.
4. **Generation registration.** The first drain of a head registers it at generation 1. A stored dead head is replaced at generation 2, and its generation-1 mail is never offered. A different live head holding the key is not drained.
5. **Stop-block bound.** A Stop blocks at most `mailbox.stopBlock.max` times in a row, counting only blocks that were finished. V1 decision 16 deferred this rule to V3.

No live CLI runs in the tests. V3 does **not** prove:

- **Live behaviour:** that today's CLI versions still behave this way, or that delivery reaches a live model.
- **Process exit:** the exit status 0 under panic, timeout or kill. Phase 7 assigns that to V4's test entry and writes the assignment into the branch spec's V4 row.
- **Shell duties:** the order "write stdout, then finish", the stdin cap and the hook's cost (V4/V5).
- **Storage:** V2.
- **Head discovery:** reading a CLI's session file (V4 for Claude, V7 for Codex and agy).
- **Caller check:** that the hook's caller is really the head CLI and not a tool process below it (V4/V5, decision 13).
- **Runner heads:** the `att-` case (moved to V5, prerequisite below).
- **Output size:** whether a large claim's output is shortened by a CLI (a separate item, decision 14).

## Where the code lives (owner, 2026-10-21; unchanged for V3)

- All code, contracts, fixtures and doc updates live on branch **`mailbox/v1-v3`** in the linked worktree **`/home/vantt/projects/forgent-mailbox`**. Every phase commits to that branch only.
- **Nothing merges to main until the owner says feasibility is proven.** Only this plan directory goes to main; the controller commits it.

## Branch sync rule (owner, 2026-10-21; copied from the V1 plan, unchanged)

The branch is shared across leads. It is updated by **merge, never rebase**:

```bash
cd /home/vantt/projects/forgent-mailbox
git fetch origin
git merge --no-edit origin/main     # resolve on the branch; regenerate Cargo.lock and the census rather than hand-merge
```

**When to sync.** Sync at the start of every phase, at the end of every phase, and immediately before every test run that counts as proof.

**End of a phase, in order:**

1. Commit the phase's work.
2. Fetch and merge main.
3. Run the proof.
4. Commit any regenerated census or lock.
5. `git push origin mailbox/v1-v3`.

If a merge brought changes, rerun the phase's proof. A phase counts as done only when its proof is green on top of a fresh `origin/main` merge.

**Regenerating instead of hand-merging:**

- **`Cargo.lock` conflicts:** take main's lock, run `cargo build -p fgos-mailbox` once without `--locked`, and commit the result in the merge commit.
- **Mutation census:** for a conflict in `packages/git/contracts/mutation-census.v1.json`, and for every commit that adds or changes a hashed file (`.rs` under `packages/`, `.mjs` anywhere the scanner reads), run `node scripts/git-one-door-scan.mjs --write-census` and commit the result with that commit.

## Long commands: exit must be observable

Commands that can run longer than a minute need an observable exit. These include `cargo test --workspace`, `npm test`, `cargo clippy --workspace` and each live CLI recording run. Run them one of two ways:

- through the harness's background facility, with exit notification; or
- in the foreground under `timeout`, with output teed to `.fgos/runtime/tmp/mailbox-v3/<step>.log` and the exit status printed (`; echo "exit=$?"`).

Never use a bare `&`. Before reading a result, confirm the process exited and read its exit status, not just the log tail.

## Phases

| # | Phase | Proof | Status |
|---|---|---|---|
| 1 | [Preconditions, crate `fgos-mailbox` skeleton, Stop-block key, shared test support](phase-01-preconditions-crate-skeleton-and-stop-block-key.md) | crate builds; each contract key is owned by exactly one reader, and each reader's missing-key test is green | done (branch `mailbox/v1-v3`) |
| 2 | [Record the real payloads and the accepted outputs](phase-02-record-real-payloads-and-accepted-outputs.md) | fixtures and `adapters.v1.json` committed; redaction guard and fixture contract tests green | done: Claude Code and Codex recorded and accepted; agy Stop only, drain deferred |
| 3 | [Core: Stop-block count; same-head and refused registrations change nothing](phase-03-core-stop-block-count.md) | `cargo test -p fgos-mailbox-core` | done (branch `mailbox/v1-v3`) |
| 4 | [Head judgement over real processes](phase-04-head-judgement-over-real-processes.md) | round trip of the own record; unparseable or incomplete is never the same head | done (branch `mailbox/v1-v3`) |
| 5 | [Adapters: parse each CLI's payload, render each CLI's accepted output](phase-05-adapters-parse-and-render.md) | every fixture parses; the render equals the recorded accepted value | done (branch `mailbox/v1-v3`) |
| 6 | [The drain: begin, render_reply, finish](phase-06-drain-begin-emit-finish.md) | payload suite: shape, fail-quiet, `agent_id` skip, registration and generation, Stop-block bound, no write on the no-mail path | done (branch `mailbox/v1-v3`) |
| 7 | [Branch docs, full gates, review, hand-off](phase-07-branch-docs-gates-and-handoff.md) | workspace cargo gates and `npm test` green on the branch | done (branch `mailbox/v1-v3`) |

The phases share `src/lib.rs`, `Cargo.toml` and the fixtures directory, so they run one after another. Phases 3 and 4 do not need phase 2's fixtures and may run while phase 2 waits on an account. Phases 5 and 6 need the fixtures.

## Architecture in one screen

- **Placement (decided).** The drain lives in crate **`fgos-mailbox`** at `packages/mailbox/rust/store`.
  - Spec §4.1 assigns that crate "record adapter, ports wiring, verbs, hook kind, adapters", with `src/adapters/{claude,codex,agy}.rs` as §4.1 names them.
  - V3 creates the crate; V2 later adds the record module beside it. The core stays serde-only.
- **Functional core, imperative shell.** The drain is three plain functions over the real `fgos_mailbox_core::MailboxState`, so V3 needs no store, no port and no fake. None of them returns an error.
  - `hook::begin(&mut MailboxState, &HookCall, now, &Limits, &HookLimits, &mut dyn IdSource) -> Begun` runs under the first mutex hold. It parses the payload with the CLI's adapter, skips a subordinate or an incomplete head, registers through the core, applies the Stop-block bound, and claims.
  - `hook::render_reply(&Claimed, adapter, event, bodies: &dyn Fn(&MessageId) -> Option<String>, &Limits) -> HookReply` runs outside the mutex. It renders the frames with the core's `render_message` / `render_notice` and wraps them in the CLI's accepted output. A missing body renders the contract's body-missing line (decision 3).
  - `hook::finish(&mut MailboxState, &FinishTicket, now) -> Finished` runs under the second mutex hold. It is the core's `finish`, plus `note_stop(true)` when the ticket is a Stop block (decision 8).
  - **Shell duties (not V3; V4's test entry and V5's host entry build them on V2's store):**
    - take the mutex;
    - read stdin with a cap;
    - resolve the writer key;
    - find the head process;
    - check the caller is the head;
    - read the bodies;
    - **write and flush stdout before calling `finish`, and never finish after a failed write**;
    - exit 0;
    - run the circuit breaker.
  - The `hook` module doc states these duties.
- **Inputs the shell resolves, passed as values.** `HookCall { adapter, event, stdin: &[u8], writer: WriterKey, project: &str, head: HeadFacts { record: fgos_process::facts::Record, own_suffix: Option<String>, handle: Option<String> } }`.
  - The writer key comes from session identity (`fgos_session_identity::resolve_current`), the same door `send` uses.
  - The head record and own suffix come from the CLI adapter's head finder (V4/V7).
  - Tests pass real values: the recorded env through the real `env_identity`, and `Record`s of real processes.
- **Quiet as a type.** `Begun::Quiet { reason: QuietReason }`, where `QuietReason` names every skip: `Malformed`, `EventMismatch`, `Subordinate`, `HeadUnknown`, `Registration(code)`, `NothingEligible`, `StopBlockCap`. V5's breaker and the tests see the reason without anything being printed. `HookReply { stdout: String }`; a quiet reply has empty stdout.
- **No write on the no-mail path.** A registered head with no pending mail must leave the snapshot equal to before. This serves V5's 50 ms p95 target; S0 measured about 10 ms per write, dominated by `fsync`.
  - The core makes this true for the same-head registration and for refused registrations (phase 3). `claim` already returns before any change when nothing is pending.
  - The tests prove it by comparing the snapshot before and after. The API reports no `changed` flag; V5's shell compares the serialized bytes it must produce anyway.
- **Contracts are the authority.**
  - `packages/mailbox/contracts/limits.v1.json` gains `mailbox.stopBlock.max` (3, spec §12) and a `reader` field on every key (`core` or `hook`).
  - `packages/mailbox/contracts/frame.v1.txt` gains a `[message.body-missing]` section.
  - New `packages/mailbox/contracts/adapters.v1.json` holds `testedAgainst: [{cli, version}]` (spec §4.1 shape).
  - Fixtures live under `packages/mailbox/contracts/fixtures/hooks/<cli>/`, with a `vectors.json` per CLI in the precedent shape `{cli, source, vectors}`. `source` names the versions, the date and the exact recording commands. Precedent: `packages/agent-protocol/contracts/fixtures/terminal/<cli>/vectors.json`.
- **Dependencies of `fgos-mailbox`.**
  - Normal: `fgos-mailbox-core`, `fgos-process`, `serde`, `serde_json`.
  - Dev: `fgos-session-identity`, which tests use to derive the key from the recorded env through `env_identity`.
  - Spec §4 allows `fgos-process`, `fgos-holder-lock`, `fgos-durable-file` and `fgos-session-identity`. V3 adds nothing outside that list.

## Hiện trạng tiền đề (kiểm 2026-10-22 00:07, main `9670da5ff`)

| Prerequisite / adjacent component | Exists? | Where | What it changes for V3 |
|---|---|---|---|
| V1 core `fgos-mailbox-core` | **Built; V1 phase 8 committed locally, not pushed; V1 `plan.md` front matter still `pending`** | branch `mailbox/v1-v3` `e297a7ac1`; 78 tests | Phase 1 starts only after V1's lead pushes and closes V1 (precondition check in phase 1) |
| `is_attempt_writer_id` in session identity | **No** | `git grep is_attempt_writer_id origin/main` finds nothing; only `ATTEMPT_PREFIX` and `mint_attempt_writer_id` (`packages/session-identity/rust/src/attempt.rs`) | The runner-head registration case **moves to V5** (spec §14 V3 row). V3 adds no prefix comparison (spec §1 forbids a string test) |
| Holder-lock row `mailbox` | No | `packages/holder-lock/contracts/lock-registry.v1.json` on main | Not needed by V3 (V2 only) |
| Native host route for `hook` | No | `packages/host-runtime/contracts/command-routes.json` (`hook`: legacy-cli) | Not needed by V3 (V5) |
| Main-checkout resolver | Partly (`fgos_distribution::workspace::resolve_workspace_root`) | V1 plan table | Not needed by V3 (the project name is an input) |
| Process facts `Record`, `judge_here`, `identity_of`, `self_identity` | **Yes** | `packages/process/rust/src/facts.rs` (module `fgos_process::facts`; `ProcId` at the crate root) | Phase 4 uses them directly (one door) |
| Session identity `env_identity`, `ENV_ORDER` | **Yes** | `packages/session-identity/rust/src/resolve.rs` | Phase 6 tests derive the key from the recorded env through it |
| HARDEN T1 (holder-lock, session identity) | pending | `plans/261021-1118-harden-low-layers-bottom-up/plan.md` row `MAIL` | A T1 API change in `fgos-session-identity` reaches V3's tests only; watch the board at each sync |
| `packages/mailbox/contracts/adapters.v1.json` (`tested_against`) | **No** (spec §4.1 "planned") | — | Phase 2 creates it with the versions the fixtures were recorded on |
| Old scratch probes with real payloads | **Deleted** 2026-10-21; they covered `Stop` only (spec §14 V3 row) | — | Phase 2 records afresh |

## CLI versions available for recording (checked 2026-10-22 00:10)

| CLI | Installed | Version measured in spec §7 / S0 | How it is run here |
|---|---|---|---|
| Claude Code | **2.1.306** (`command claude`) | 2.1.303 / 2.1.304 | hooks through `--settings <file>`, with other setting sources excluded if the version allows (phase 2) |
| Codex | **0.161.0** (`command codex`, `~/.codex/packages/standalone/releases/0.161.0-…`) | 0.162.1 (the installed one is **older** than the one measured) | isolated `CODEX_HOME` with `auth.json` linked to account `tetnu` (`CODEX_ACCOUNTS[tetnu]`, never the "current" account), `[features] hooks = true`, `--dangerously-bypass-hook-trust` |
| agy | **1.4.4** (`command agy`) | 1.4.2 | `HOME=AGY_ACCOUNTS[tetnu]`; hooks through a project `.agents/hooks.json` (flat `Stop`, nested `PostToolUse`) |
| pi 1.1.0, omp 18.12.5 | installed | — | later parts (spec §15.3); not recorded |

No CLI of the first slice is missing, so no fixture is deferred for a missing CLI. A fixture that a CLI cannot produce, for example a Codex or agy subagent event, is deferred with its reason and never synthesized as if it had been recorded.

## Decisions taken in this plan (agent decisions inside the signed frame)

Phase 7 records these in spec §17 on the branch, attributed to the planning lead (agent), never to the owner. None reverses a §17 decision. The items marked *(red-team)* were changed by the red-team pass.

1. **Placement.** The drain is module `hook` plus `adapters/{claude,codex,agy}.rs` in crate `fgos-mailbox` (spec §4.1 table). It does not go in the core, because it parses CLI shapes, which spec §4 rule 1 keeps out of the core. It does not go in `apps/fgos`, which holds thin wiring only.

2. **No port for the record in V3.** The drain takes `&mut MailboxState` and returns values; the shell (V4/V5) performs the two mutex holds. Spec §4 rule 5 adds a port only with a second real implementation, and an in-memory record would be a fake.

3. **A missing body renders the contract's body-missing line instead of the body** *(red-team: skipping the whole claim poisoned every healthy message claimed with it, which were then refused at the offer cap)*.
   - The line is a new section `[message.body-missing]` in `frame.v1.txt`; frame text has one source. It says the message's text could not be read and gives the sender's name.
   - The message is still finished as `offered`, and the frame says honestly that its text is lost. The other messages in the claim are delivered.
   - A missing body is a store fault (V2); V3 only fixes how it is reported.

4. **The CLI and the event are explicit inputs.** The drain does not guess the CLI from the payload, because Claude and Codex payloads are nearly identical and the CLI decides the short name (`<project>-<cli>-<xx>`). How the entry learns the CLI is V5's installer decision: either an installer-written option beside `--event`, like the legacy `--format=agy`, or env detection. Phase 2 records which id variables each CLI's own hook process sets, with the parent environment cleared (decision 15), so V5 can choose from evidence.

5. **A same-head registration and a refused registration change nothing, and the rule lives in the core** *(red-team: the hook kept a second copy of the core's row 2, and `register` swept before refusing)*.
   - Phase 3 changes `register`:
     - Row 2 (same head) returns `Refreshed` with no mutation; `last_seen` is set only at creation and replacement.
     - The judgement checks (same head, `Conflict`, `Deferred`) run before the sweep.
   - `begin` always calls `register` with the judgement from `head::judge_stored`.
   - Quiet cases that leave the snapshot unchanged: `Malformed`, `EventMismatch`, `Subordinate`, `HeadUnknown`, `Registration(_)`, and `NothingEligible` when nothing is pending.
   - Quiet cases that may write:
     - `NothingEligible` when mail is pending but not eligible. Examples are a Stop with only `wake:false` mail, or mail already in flight. The core's `claim` then sweeps and stamps `last_drain_at` (V1).
     - `StopBlockCap`, which resets the count.
   - Spec §5.1 row 2 is amended on the branch in phase 7.

6. **A subordinate event changes nothing.** There is no registration, no claim, no print and no finish (spec §6.1 "ignored").
   - The event counts as subordinate when the key `agent_id` **or** `agent_type` is present, whatever its value *(red-team: an empty or null value, or `agent_type` alone, must not read as the head; when in doubt, skip)*.
   - Each CLI's adapter reads its own marker.

7. **The Stop-block count lives in the snapshot; the bound lives in the hook.**
   - The count must survive across hook processes and change atomically with the claim and finish, so it is a core field, `Binding.stop_blocks`, with the core mutator `note_stop`.
   - The bound `mailbox.stopBlock.max` is read by the hook layer (`HookLimits`), keeping V1 decision 16.
   - `SNAPSHOT_SCHEMA_VERSION` goes from 1 to 2. No version-1 snapshot exists outside tests (V2 is not built), so no migration is written.

8. **Stop rule** *(red-team: the count was raised before anything was printed, and was never reset by a new turn)*:
   - **New turn.** If the payload marks the first Stop of a turn (Claude/Codex `stop_hook_active: false`; agy `executionNum: 0`, as recorded in phase 2), the count is reset to 0 first.
   - **At the cap.** If `stop_blocks >= stopBlock.max`, the Stop passes without claiming and the count returns to 0 (`StopBlockCap`).
   - **Otherwise** claim at `Checkpoint::Stop`, which takes effective wake only:
     - items found: a `Stop`-tagged ticket. The count rises **only in `finish`**, after the shell wrote the block.
     - nothing found: pass, and the count returns to 0.
   - `PostToolUse` never touches the count.

9. **Frames are joined by one blank line**, with no added wording. Every model-facing text stays in `frame.v1.txt`.

10. **Output shapes come from recorded injection, not from memory or a bare grep** *(red-team: Claude logs every hook's raw stdout as `hook_success`, so a canary string is found even when the CLI ignored the shape)*.
    - Phase 2 runs each CLI once with the candidate shape carrying a canary.
    - A shape is accepted only when the canary sits in the transcript record type that proves injection:
      - Claude `PostToolUse`: an attachment of type `hook_additional_context`.
      - `Stop`, all CLIs: a second `Stop` call that is marked as continued.
      - Codex and agy: the record type found in the `dump` run, named in `vectors.json`.
    - The accepted value is stored as `accepted-<event>.json`. Phase 5's renders must equal it as a JSON value.

11. **`testedAgainst` lives only in `adapters.v1.json`**, in the spec's shape `{cli, version}`, listing the versions the fixtures were recorded on *(red-team: versions were in two files plus a sync test)*.
    - `vectors.json` names the version only inside its human-readable `source` line, as the precedent does.
    - The recorder checks the version before and after every run and refuses to write fixtures if it changed.
    - Spec §4.1 spells the field `tested_against`; repository contracts use camelCase, so phase 7 records the spelling.

12. **The delivery-report sentence is not V3.** The V1 plan's validation row V2 said it is "composed at V3". But the spec's V3 row has no send side, and the sentence needs the tier from `Nudge`/`Presence`. The spec's V4 row runs `send` live, so the sentence belongs to **V4** *(red-team: V5 was named first, but V4 already runs `send`)*. Phase 7 records this for the controller.

13. **The `agent_id` skip is not a security boundary** *(red-team)*.
    - Any process that inherits the head's environment can pipe a forged payload into the hook entry and drain the head's mail. That includes a subagent's tool call.
    - The entry must therefore check that its caller is the head CLI itself, before calling `begin`. This is a V4/V5 shell duty, written in the `hook` module doc and in the hand-off.
    - The Codex adapter takes the payload's thread id as the handle only when it equals the writer key. Otherwise the handle stays `None` (no handle from a forged payload).

14. **Output size is not measured in V3** *(red-team: a 64 KiB probe used a number in no contract and could not change V3's code)*.
    - A claim takes every eligible message, up to `queue.cap × maxBodyBytes` plus frame text. A CLI that shortens a long `additionalContext` or `reason` would make later frames a silent loss, while `finish` marks them offered.
    - The hand-off files this as its own item for V4's live suite, measured at that contract-derived size.

15. **Recordings run in a clean, isolated place** *(red-team)*:
    - The work directory is outside any git checkout.
    - The three `ENV_ORDER` variables are removed from each CLI's environment, so a recorded id variable is one the CLI set itself.
    - Codex's real `auth.json` link is checked after every run.
    - Redaction works by allowlist.

## Câu hỏi cho owner

**Q1. What if a CLI's subagent events carry no field that marks them as a subagent's?**

- **Chuyện gì đang xảy ra:** The mailbox must never inject a head's mail into a subagent (owner principle 2026-10-20, spec §15.6). The drain tells a subagent's event apart by its `agent_id`/`agent_type` field. Claude Code sets it (measured 2026-10-20). Codex has it in its hook schema (S0 report), but no event carrying it was ever recorded. For agy, nobody knows whether it has subagents or a marker at all. Only Claude was measured to fire `SubagentStop`, not `Stop`, for a subagent.
- **Nguyên nhân:** Phase 2 records one subagent run per CLI, with every hook event and the subagent's tool env. The question applies to a CLI in either of these cases:
  - its subagent events have no marker;
  - a subagent could not be triggered in print mode, so nothing is known.
- **Các lựa chọn:**
  - A. For that CLI, drain only at `Stop` and skip its `PostToolUse` drain, but only if the recording shows the subagent fired no `Stop` of its own.
    - Gain: the principle holds.
    - Cost: mail waits until the turn ends; agy can wait up to 45 s longer during a long tool (spec §7). Ordinary (`wake:false`) mail on that CLI is read only through `inbox`. About 10 lines plus one vector.
  - B. Drain at `PostToolUse` anyway, and record the risk.
    - Gain: latency as in spec §7.
    - Harm: a subagent may receive peer mail, against the principle.
  - C. Do not build that CLI's drain yet. Measure further, with another recording design, first.
    - Cost: a delay for that CLI only.
- **Khuyến nghị:** A when its condition holds, otherwise C. The principle is an owner decision with no revisit trigger, and A changes no other path.
- **Phạm vi của câu trả lời:** It applies only to a CLI whose subagent events are unmarked or unknown. Claude Code is not affected.
- **Provisional default:** If phase 2 finds such a CLI, phase 5 implements A for it when the condition holds, and C otherwise (that CLI's drain returns `Subordinate` for every event, which delivers nothing). Phase 7 reports Q1 as an open owner item. If phase 2 finds a marker, or confirms that the CLI has no subagents, Q1 closes with no change.

## Risks the implementer must know

- **Live runs cost money and touch accounts.**
  - About 9 one-shot runs (3 per CLI, plus at most one fallback shape each) use the owner's accounts: `tetnu` for Codex and agy, and the default account for Claude.
  - Use the cheapest model each CLI offers in print mode, for example `--model haiku` for Claude.
  - The recorder never edits a CLI's real config.
  - The CLIs still write their own transcripts under their homes; phase 2 lists what was left behind.
- **The Codex login can be damaged.** If Codex replaces the linked `auth.json` with a plain file while refreshing its token, the owner's `tetnu` login may stop working, and a live token sits in the scratch directory. Phase 2 checks the link after every run, stops if it was replaced, deletes the copy, and asks the owner to log in again.
- **Redaction failures are permanent once pushed.** The redaction guard test runs before the fixture commit; push only after it is green and after one human-eye read of every fixture.
- **Codex is older than the spec's measurement** (0.161.0 vs 0.162.1). Record on what is installed; the fixtures say so. Do not upgrade a CLI as part of this plan.
- **Mutation census.** Every new or changed hashed file needs `node scripts/git-one-door-scan.mjs --write-census` in the same commit.
- **V1 is not closed yet.** Phase 1 refuses to start until V1's lead pushes `mailbox/v1-v3` and closes its plan. The V3 lead never commits V1's files.
- **HARDEN T1** may change the `fgos-session-identity` or `fgos-process` APIs. A sync that breaks V3 is fixed on the branch, and the API change is noted for the board.
- **A stored head judged `Unknown` defers every registration until the head is judged `Dead`.** This happens with an unreadable stored record, another host name, or another PID namespace. Phase 2 records the hook process's PID namespace for each CLI. If a CLI runs hooks in a different namespace, that CLI's head is never judgeable from the hook, so phase 2 stops and reports it. Recovery from a permanent `Deferred` belongs to V5's breaker and `status` (hand-off).
- **Board.** The implementer reports state to the controller, who updates row `MAIL` on main.

## Validation and red-team record

See the sections "Validation Log" and "Red Team Review" below, and [reports/validation-and-red-team.md](reports/validation-and-red-team.md).

## Validation Log

### Session 1 — 2026-10-22

**Trigger:** `ak-plan validate` after drafting. The planning lead cannot ask the owner, so every question the spec, reports, code or installed CLIs could answer was resolved from them; only an owner-intent question went to "Câu hỏi cho owner".
**Questions raised:** 10. Resolved from evidence: 9. Sent to the owner: 1 (Q1, provisional default applied).

| # | Category | Question | Options considered | Resolution | Source |
|---|---|---|---|---|---|
| V1 | Architecture | Where does the drain live? | store crate `fgos-mailbox` / a new crate / the core / `apps/fgos` | store crate, `hook` + `adapters/` (decision 1) | spec §4.1 table ("ports wiring, verbs, hook kind, adapters"), §4 rule 1 |
| V2 | Architecture | How does V3 avoid V2's store? | record port with an in-memory implementation / pure functions over `MailboxState` | pure functions; the shell does the two mutex holds (decision 2) | spec §4 rule 5; owner rule "no fakes"; V1 `MailboxState` is `Clone + PartialEq + serde` |
| V3 | Assumptions | Are real CLI runs allowed for recording? | yes, cheap one-shot / no | yes: about 9 one-shot print-mode runs (12 before the red-team removed the size run), reproducible by one recorded command | controller brief; spec §14 V3 row ("recorded afresh at this rung on the machine that builds it") |
| V4 | Assumptions | Which versions are "the CLI versions in `tested_against`"? | the S0 versions / the installed versions | installed versions; `adapters.v1.json` does not exist yet, phase 2 creates it from what the fixtures were recorded on (decision 11). Codex installed 0.161.0 is older than the measured 0.162.1: recorded as is | `command <cli> --version`; spec §4.1 says the file is planned |
| V5 | Risks | Is the Stop-block count core or hook? | core field + hook bound / hook-only file beside the snapshot / payload `stop_hook_active` | core field and mutator, bound in the hook (decision 7); a bool from the payload cannot count to `max`, and a side file would not change atomically with the claim | V1 decision 16; spec §6.1; S0 payload keys (`stop_hook_active` is a bool) |
| V6 | Tradeoffs | Refresh `last_seen` on every hook? | refresh (spec row 2) / register only when needed | first: only when needed, in the hook; **superseded by the red-team**: the core's row 2 makes no mutation and `begin` always calls `register` (decision 5) | owner p95 target 50 ms (spec §8.7, §12); S0 about 10 ms per write; V1's `last_drain_at` rule |
| V7 | Architecture | Where does the recorder script live? | `packages/mailbox/scripts/` / `scripts/` | `scripts/record-mailbox-hook-fixtures.mjs` | precedent `scripts/regenerate-observe-fixtures.mjs` (verification failure F3) |
| V8 | Scope | Does V3 compose the delivery-report sentence? | yes (V1 plan row V2) / no | no, it moves to V5 (decision 12) | spec §14 V3 row has no send side; the sentence needs the tier (§6.2) |
| V9 | Scope | Does V3 handle the `att-` runner head? | prefix test now / move to V5 | move to V5; no string test | spec §1 and §14 V3 row; `is_attempt_writer_id` absent on main `9670da5ff` |
| V10 | Risks | A CLI whose subagent events carry no marker | drain at Stop only / drain anyway / measure more | owner question Q1, provisional default A | spec §15.6 (owner principle, no revisit trigger) |

#### Confirmed decisions
- Decisions 1-12 stood after validation; the red-team then changed decisions 3, 5, 6, 8, 10, 11, 12 and added 13-15 (see Red Team Review).

#### Impact on phases
- Phase 2: recorder moved to `scripts/` (F3); census note added.
- Phases 4 and 6, plan.md: `fgos_process` paths corrected (F1).
- Phase 1: line reference corrected (F2).

### Verification Results

- Tier: Full (7 phases). Claims checked: 34 (paths, symbols, signatures, CLI flags, commands). Verified: 29 | Failed: 3 (all fixed) | Unverified: 2.
- Verified examples: core `register(req, judged, now, limits, ids)`, `claim(key, generation, Checkpoint, now, limits, ids)`, `finish(key, generation, token, now)`, `render_message(item, body, limits)`, `render_notice(item, limits)`, `send(SendRequest, now, limits, ids)` (`packages/mailbox/rust/core/src/{registry,delivery,frame}.rs` on branch `891467ed7`); `claim` returns before any mutation when nothing is pending for the current generation (`delivery.rs`, `claim`); `MailboxState: Clone + PartialEq`; `Limits` accepts unknown top-level keys; `env_identity(lookup, fgos_dir)` and `ENV_ORDER` (`packages/session-identity/rust/src/resolve.rs`); `codex exec` has `--dangerously-bypass-hook-trust`, `--dangerously-bypass-approvals-and-sandbox`, `-C`, `--skip-git-repo-check`; `claude` has `--settings`, `--model`; `agy` has `-p`, `--dangerously-skip-permissions`; `fgos convention path --kind report --type closing --slug … --json` answers; `scripts/git-one-door-scan.mjs --write-census` exists and scans `.mjs`.
- Failures fixed: (F1) `fgos_process::{Record, judge_here, self_identity, identity_of}` are under `fgos_process::facts` and `identity_of` takes `ProcId`, not `u32` (`packages/process/rust/src/lib.rs` exports `pub mod facts` only); (F2) the `Limits` unknown-keys note is the doc comment at lines 7-8, not line 9; (F3) recorder location changed to the `scripts/` precedent.
- Unverified (resolved by phase 2's recording, not by reading): whether Codex 0.161.0 accepts `hookSpecificOutput.additionalContext` at `PostToolUse` (S0 saw it only in the binary's schema for `UserPromptSubmit`); whether agy 1.4.4 has subagents and a marker.

### Whole-Plan Consistency Sweep

Searched all plan files for `packages/mailbox/scripts` (none left), bare `fgos_process::` paths (all now `::facts::` or `ProcId`), `tested_against` vs `testedAgainst` (decision 11 and phases 2 and 7 agree), the Stop rule (decision 8, phase 3 `note_stop`, phase 6 `begin` step 5 agree), `last_seen` (decision 5, phase 6 step 3, phase 7 spec edit agree), schema version 2 (decision 7, phase 3, phase 7 hand-off agree). No contradiction left.

## Red Team Review

### Session — 2026-10-22

**Findings:** 29 after deduplicating 36: 27 accepted (2 of them partly or modified), 1 rejected, plus 1 open question accepted.
**Severity breakdown:** 0 Critical, 15 High, 14 Medium.
**Reviewers and verification roles:**

- Security Adversary (Fact Checker)
- Failure Mode Analyst (Flow Tracer)
- Assumption Destroyer (Scope Auditor)
- Scope & Complexity Critic (Contract Verifier)

Each reviewer was a `code-reviewer` agent; `fgos dispatch decide --for red-team-review --needs-soul --has-live-task-access` returned `in-process`.

**Key changes:**

- **Recording (phase 2):**
  - runs happen outside any checkout, with the id variables cleared;
  - injection is judged by transcript record type, not by grepping for the canary;
  - redaction works by allowlist, and handles slug-form paths and account names;
  - the Codex `auth.json` link is checked after every run;
  - versions are checked before and after each run;
  - the size probe is gone.
- **Core (phase 3):**
  - same-head and refused registrations change nothing;
  - `note_stop` is added, and the Stop count rises only in `finish`;
  - a missing body gets a frame from the contract instead of poisoning the claim.
- **Contract (phase 1):** a `reader` field on every key keeps the core's missing-key test honest.
- **Drain (phases 4-6):**
  - the API returns no `Result`, and the `changed` flag is gone;
  - a head record without `pid` and `start_time` is never treated as a head (`HeadUnknown`);
  - an event is subordinate when either `agent_id` or `agent_type` is present;
  - a Stop marked as the first of its turn resets the count;
  - the Codex thread handle is taken only when it equals the writer key.
- **Shell duties for V4/V5:** write stdout before `finish`, check that the caller is the head, and prove exit 0. Phase 7 writes these into the branch spec's V4 row, together with the delivery-report sentence and the output-size measurement.

**Rejected:** dropping the env evidence and the key-equality test. The placeholder mapping is one-to-one, the parent environment is now cleared, and the registration key is inside V3's "generation registration".

The full table is in [reports/validation-and-red-team.md](reports/validation-and-red-team.md).

| # | Finding | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | Inherited session ids pollute the recordings | High | Accept | Phase 2; decision 15 |
| 2 | Canary grep fooled by `hook_success` | High | Accept | Phase 2; decision 10 |
| 3 | Core limits test turns red | High | Accept | Phase 1 |
| 4 | Denylist redaction | High | Accept | Phase 2 |
| 5 | Path order, slug form, account names | High | Accept | Phase 2 |
| 6 | Token patterns incomplete | Medium | Accept | Phase 2 |
| 7 | Codex `auth.json` link; "current" account | High | Accept | Phase 2; Risks |
| 8 | Recording inside the worktree; hooks leak in | Medium | Accept | Phase 2 |
| 9 | Unchecked Codex handle | High | Accept, partly | Decision 13; phases 5, 6 |
| 10 | Subordinate marker rule too narrow | Medium | Accept | Decision 6; phase 5 |
| 11 | Hook entry callable by a subagent | Medium | Accept (documentation) | Decision 13; phases 6, 7 |
| 12 | Exit 0 proven by a constant | High | Accept | Outcome; phases 6, 7 |
| 13 | Duplicated same-head rule; sweep before refusal | High | Accept | Decision 5; phase 3 |
| 14 | `changed` clone mechanism | Medium | Accept | Phase 6 |
| 15 | Default `Record`s compare equal | High | Accept | Phases 4, 6 |
| 16 | Stop count before print; no turn reset | High | Accept | Decision 8; phases 3, 6 |
| 17 | Missing body poisons the claim | High | Accept, modified | Decision 3; phases 3, 6 |
| 18 | Unbounded claim size / size probe | High | Partly accepted | Decision 14; phase 7 |
| 19 | Order of write and finish | Medium | Accept | Architecture; phase 6 |
| 20 | Q1 option A assumption | High | Accept | Q1; phase 2 |
| 21 | Versions in two places | Medium | Accept | Decision 11; phase 2 |
| 22 | Head tests at three layers | Medium | Accept | Phase 4 |
| 23 | `SeqIds` copy | Medium | Accept | Phase 1 |
| 24 | Stop test coupled to the wake quota | Medium | Accept | Phase 6 |
| 25 | "Byte-for-byte" overclaim | Medium | Accept | Outcome |
| 26 | Delivery sentence belongs to V4 | Medium | Accept | Decision 12; phase 7 |
| 27 | §12 "per session" wording | Medium | Accept | Phase 7 |
| 28 | Drop the env evidence (tautology) | High | Reject | — |
| 29 | Hook PID namespace (open question) | — | Accept | Phase 2; Risks |

### Whole-Plan Consistency Sweep

**Decision delta:** decisions 3, 5, 6, 8, 10, 11 and 12 changed; decisions 13, 14 and 15 were added.

**Stale terms.** I searched every plan file for the terms the red-team replaced. None remain as live instructions; where one appears, it is only inside the red-team rationale:

- `emit(`;
- `BodyMissing`, `EXIT_CODE` and `changed:`;
- the `size` run and `64 KiB`;
- "12 one-shot", "byte-for-byte" and "seen to accept";
- `proven: [...]` in `adapters.v1.json`.

**Superseded validation row.** Validation row V6 ("register only when needed") is marked as superseded by decision 5.

**Cross-file agreement.** The terms below match between the plan's decisions and the phases:

| Term | Defined in | Agreeing files |
|---|---|---|
| Phase 6's API (`begin` / `render_reply` / `finish`, `FinishTicket.stop_block`, `QuietReason` including `HeadUnknown`) | phase 6 | architecture, Outcome |
| Phase 3's three core changes | phase 3 | decisions 3, 5 and 7, and phase 6's test table |
| The `reader` field | phase 1 | architecture |
| `testedAgainst` | decision 11 | phases 2 and 7 |

**Result:** no unresolved contradiction remains.

### Note on task hydration

The phases were not turned into tasks in a task tool: the controller tracks the lane on the board, and the implementing lead runs `ak-cook` on this plan.
