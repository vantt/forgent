---
phase: 6
title: "The drain: begin, render_reply, finish"
status: pending
priority: P2
effort: "6h"
dependencies: [3, 4, 5]
---

# Phase 6: The drain: begin, render_reply, finish

## Goal

This phase builds the receiver-side checkpoint of spec §6.1. It is three infallible functions over the real `MailboxState`. The payload suite proves them against every recorded fixture for:

- the output shape each CLI injected;
- the quiet reply;
- the `agent_id` skip;
- registration and generation;
- the Stop-block bound;
- an unchanged snapshot on the no-mail path.

This suite is the rung's proof: `cargo test -p fgos-mailbox`, payload suite `tests/hook_payloads.rs`.

## API (crate `fgos-mailbox`, `src/hook/mod.rs`)

The module doc lists the shell's duties, in this order:

1. Take mutex hold 1 and call `begin`.
2. Release the mutex, read the bodies, call `render_reply`, then **write and flush** stdout.
3. Only after a successful write, take mutex hold 2 and call `finish`. If the write failed, do not finish (red-team: finishing first turns a failed write into silent loss).
4. Exit 0 in every case.
5. Before calling `begin`, check that the caller process is the head CLI itself, not a tool process below it (plan decision 13).
6. Never pass an `att-` writer until V5 adds `is_attempt_writer_id`. V3 adds no string prefix test (spec §1).

```rust
pub struct HeadFacts {
    pub record: fgos_process::facts::Record, // the head process, found by the CLI's head finder (V4/V7), never the hook's own pid
    pub own_suffix: Option<String>,          // Claude: the two characters of its derived session name
    pub handle: Option<String>,              // the head's native channel when the shell knows it (Claude pid and socket)
}
pub struct HookCall<'a> {
    pub adapter: Adapter,
    pub event: HookEvent,
    pub stdin: &'a [u8],
    pub writer: WriterKey, // session identity's writer id of the calling head (resolve_current)
    pub project: &'a str,  // main checkout folder name
    pub head: HeadFacts,
}
pub enum QuietReason { Malformed, EventMismatch, Subordinate, HeadUnknown, Registration(RegisterRefusal), NothingEligible, StopBlockCap }
pub struct FinishTicket { key: WriterKey, generation: Generation, token: AttemptToken, stop_block: bool } // private fields; only begin builds it
pub struct Claimed { pub items: Vec<ClaimedItem>, pub ticket: FinishTicket }
pub enum Begun { Quiet { reason: QuietReason }, Claimed(Claimed) }
pub struct HookReply { pub stdout: String }

pub fn begin(state: &mut MailboxState, call: &HookCall<'_>, now: Timestamp,
             limits: &Limits, hook: &HookLimits, ids: &mut dyn IdSource) -> Begun;
pub fn render_reply(claimed: &Claimed, adapter: Adapter, event: HookEvent,
                    bodies: &dyn Fn(&MessageId) -> Option<String>, limits: &Limits) -> HookReply;
pub fn finish(state: &mut MailboxState, ticket: &FinishTicket, now: Timestamp) -> Finished;
```

### What `begin` does

It runs these steps in order. A step that returns Quiet ends the call.

1. **Parse.** Call `adapter.parse(event, stdin)`. `Err(Malformed)` or `Err(EventMismatch)` returns Quiet with that reason.
2. **Subordinate.** If `payload.subordinate` is true, return Quiet(`Subordinate`). Nothing else is touched (decision 6).
3. **Incomplete head.** If `!head::is_complete(&call.head.record)`, return Quiet(`HeadUnknown`). Nothing is touched.
4. **Registration** (decision 5):
   - Look up `state.binding(&writer)`. If there is none, call `register(req, None, …)`. If there is one, call `register(req, Some(head::judge_stored(binding, &head.record)), …)`.
   - Build the request as follows:
     - `req.head = head_text(&head.record)`;
     - `req.cli = adapter.cli()`;
     - `req.own_suffix = head.own_suffix`;
     - `req.handle = head.handle`, or else `payload.thread` when it equals `writer.as_str()` (decision 13), or else `None`.
   - `Err(refusal)` returns Quiet(`Registration(refusal)`). Phase 3 guarantees the state did not change.
5. **Generation.** `generation` is the binding's current generation.
6. **Stop** (decision 8):
   - If `payload.first_stop == Some(true)`, call `note_stop(false)`.
   - Then, if `binding.stop_blocks >= hook.stop_block.max`, call `note_stop(false)` and return Quiet(`StopBlockCap`).
   - Otherwise call `claim(&writer, generation, Checkpoint::Stop, …)`:
     - nothing claimed: call `note_stop(false)` and return Quiet(`NothingEligible`);
     - items claimed: return `Claimed` with `stop_block: true`. The count is **not** raised here.
7. **PostToolUse.** Call `claim(…, Checkpoint::Step, …)`. Nothing claimed returns Quiet(`NothingEligible`); items return `Claimed` with `stop_block: false`.

### What `render_reply` does

- A message item gets `render_message(item, &body, limits)` when `bodies(&item.id)` is `Some`. When it is `None`, it gets `render_message_body_missing(item, limits)` (phase 3; decision 3).
- A notice item gets `render_notice`.
- The frames are joined with one blank line, then passed to `adapter.render(event, &joined)`.

### What `finish` does

It calls the core's `finish(key, generation, token, now)`. If `ticket.stop_block` is true, it then calls `note_stop(key, generation, true)`.

## Tests first (file `tests/hook_payloads.rs`, the payload suite; driven by each CLI's `vectors.json`)

Every input is a real value:

- **Payloads:** the fixtures from phase 2.
- **Writer key:** derived from a vector's recorded hook id variables through `fgos_session_identity::env_identity(&lookup, None)`. agy has no env id, so its vectors use a pid-shaped key that is labelled as such: its real key comes from the process tree, which a fixture cannot carry.
- **Head record:** this test process's own record, from `fgos_process::facts::self_identity()`. It stands in for a live head; it is a real process, not a fake.
- **Bodies:** a map the test filled when it called `MailboxState::send`.
- **Limits:** from the contract, using the shared support of phase 1.
- **Ids:** the shared `SeqIds`, a real implementation of the port.

The "unchanged" assertions compare a clone of the snapshot taken before the call with the snapshot after it.

| Test | Behaviour asserted | Why no existing test owns it |
|---|---|---|
| `a_recorded_post_tool_use_offers_pending_mail_in_the_shape_the_cli_injected` (per CLI) | The first hook registers the head. A peer sends a message with `wake: false`. The recorded `post-tool-use.json` gives `Claimed`. `render_reply` parsed as JSON equals the CLI's accepted value, with the joined frames as text. `finish` offers the message | the hook contract end to end over recorded payloads |
| `a_recorded_stop_blocks_with_wake_mail_and_passes_without_it` (per CLI) | `wake: true` mail (the test asserts `effective_wake` on each send) gives a Stop `Claimed` whose output equals the accepted block value; after `finish` the count is 1. With only `wake: false` mail, Stop gives Quiet(`NothingEligible`), the mail stays recorded, and the next `post-tool-use` takes it | Stop drains only effective wake, through the adapter |
| `inputs_that_cannot_be_a_head_event_are_quiet_and_change_nothing` | Every `Unparsed` vector of phase 5, plus a head record with no `start_time` (`HeadUnknown`), gives Quiet with an unchanged snapshot. `render_reply` is never reached | a quiet result at the drain boundary |
| `a_subagent_event_takes_nothing_and_the_head_gets_the_mail_next` | With mail pending, `post-tool-use-subagent.json` and the synthesized marker variants give Quiet(`Subordinate`) with an unchanged snapshot. Then the head's `post-tool-use.json` gives `Claimed` with that mail (spec §11 item 9) | the `agent_id` skip |
| `the_first_hook_registers_the_head_at_generation_one` (per CLI) | From an empty state, the recorded `post-tool-use.json` creates a binding for the env-derived key at generation 1, with short name `forgent-<cli>-<suffix>`. For Claude with `own_suffix` `2b`, that is `forgent-claude-2b`. The result is Quiet(`NothingEligible`) | registration wiring from a payload |
| `a_stored_dead_head_is_replaced_and_its_old_mail_never_offered` | A binding at generation 1 whose head is a killed and reaped `sleep 30` child, plus mail for generation 1. The hook from this live process moves the binding to generation 2 and gives Quiet(`NothingEligible`). The generation-1 mail is never claimed | the generation rule through the drain |
| `a_different_live_head_holding_the_key_is_not_drained_and_nothing_changes` | A binding held by a live `sleep 30` child (killed when the test ends), with mail pending. The hook from this process gives Quiet(`Registration(Conflict)`), nothing is claimed, and the snapshot is unchanged | the conflict row reaches the reply as quiet |
| `a_same_head_hook_with_no_mail_changes_nothing` | A registered head with nothing pending. `post-tool-use` and `stop` both give Quiet(`NothingEligible`) with an unchanged snapshot | the write-free hot path (decision 5) |
| `stop_blocks_at_most_the_configured_times_in_a_row_counting_only_finished_blocks` | <ul><li>Before each Stop, a **different** registered sender sends `wake: true` mail, and the test asserts `effective_wake` so a quota drop fails loudly.</li><li>`stopBlock.max` finished Stop blocks happen; then the next Stop gives Quiet(`StopBlockCap`), leaves the mail recorded and resets the count to 0; the Stop after that blocks again.</li><li>A Stop that was claimed but never finished (the shell's write failed) leaves the count unchanged.</li><li>A payload with `first_stop: true` resets a count left over from an interrupted turn.</li></ul>The max is read from the contract and never written in the test | the bound V1 decision 16 deferred to V3; decision 8 |
| `a_missing_body_is_framed_honestly_and_the_rest_of_the_claim_is_delivered` | Two messages are claimed together and the lookup lacks one body. `render_reply` holds a normal frame for one and the body-missing frame for the other; `finish` offers both | decision 3 (red-team: no poisoning of healthy mail) |
| `the_codex_thread_handle_is_taken_only_when_it_is_the_writer` | For Codex's recorded payload, the registered binding's handle is the thread when the writer key equals it, and `None` when the key differs (for example a sender with `FGOS_SESSION_ID`) | decision 13 |
| `the_writer_key_the_hook_derives_equals_the_one_its_tool_sees` (Claude, Codex) | With the recording's cleared parent environment, `env_identity` over the recorded hook id variables and over the tool's id variables gives the same key, and that key equals the payload's `session_id` placeholder. The placeholder mapping is one-to-one, so equal placeholders mean equal real values | answers spec §5.1's open question ("whether the registration side and the `send` side derive the same key") for the recorded runs; evidence for decision 4 |

Each per-CLI case is one loop over the three CLIs' vectors, not three copies. Each behaviour above has this one owning test. The core's own tests keep ownership of the four-row table, claim and finish, the Stop count and the frame text.

## Steps

1. Sync.
2. Write the suite and see it fail.
3. Implement `begin`, `render_reply` and `finish` until it passes.
4. Fill each `vectors.json` `vectors` list with the cases the suite reads. Each case names its fixture and its expected reason or output.
5. Run `cargo clippy --locked -p fgos-mailbox --all-targets -- -D warnings`. Add `#![deny(clippy::unwrap_used, clippy::expect_used, clippy::panic)]` to `src/hook` and `src/adapters`.
6. Regenerate the census. Commit `feat(mailbox): drain recorded hook payloads into each CLI's injected output`.
7. Sync, then run **the rung proof**: `cargo test --locked -p fgos-mailbox` and `cargo test --locked -p fgos-mailbox-core`, both green on a fresh merge. Push.

## Deviations (implementation lead, 2026-10-22, recorded at phase 1)

- **Rendering.** Every claimed item is rendered through the core's single `render(item, body: Option<&str>, limits)` (phase 3 deviation): `bodies(&item.id)` is passed as is, and `None` gives the body-missing frame. There is no `render_message`, `render_notice` or `render_message_body_missing`.
- **Shared accounts.** The core now writes the shared senders as `~unregistered` and `~unresolved`, outside the writer-key alphabet; the drain needs no change for it.

## Plan owner decisions (2026-10-22, after phase 3; plan owner (agent))

1. **M4, one binding per head.** A second key from the same head replaces the old binding like a dead-head takeover: a new generation, its own name, `stop_blocks` 0, and mail queued for the old key is never shown to the new context. Implemented in phase 5 with its owning test.
2. **agy drain deferred in V3, for every event.** An agy subagent carries no marker and fires its own Stop; under decision 1 a subagent's first hook would replace the head's binding and take its mail, which is worse than missing mail. The agy fixtures stay as contract evidence (parse tests only); agy stays under `deferred` in `adapters.v1.json` (no subagent marker; 1.4.4 refuses `additionalContext`). `overwriteResult` is rejected as a delivery channel: it rewrites a tool's real output with peer text and mixes trust levels. Q1 resolves as option C for agy. What would unblock agy: a payload field naming the parent conversation, or a hook scope that fires for the head conversation only.
3. **Codex deferred** until the owner logs the `tetnu` account in again; Codex is not run. Its parse and render are built only where a report already recorded the real shape; everything else stays deferred.
4. **Phases 4 to 7 continue** with Claude Code as the only live-proven adapter. Phase 7 runs the branch docs and the crate and workspace gates; `npm test` only if a Node file changes; no code-review step (the plan owner runs an independent review).

## Acceptance criteria

- `cargo test --locked -p fgos-mailbox --test hook_payloads` is green for Claude, Codex and agy.
- Every fixture from phase 2 is used by at least one vector. Check by searching for each fixture's file name in the `vectors.json` files.
- The crate's `src` has no `println!`, no `eprintln!` and no `std::io::stdout` (the lint enforces this).
- No limit number appears in the tests or the source; every number comes from `limits.v1.json`.
- `begin`, `render_reply` and `finish` return no `Result`.

## Risks

- `MailboxState` equality includes `last_now`. If a no-change test fails because `last_now` moved, find the actual mutation; do not loosen the assertion.
- agy's key cannot be derived from a fixture, so its registration case proves only the drain's wiring. V7's live suite proves the real key.
