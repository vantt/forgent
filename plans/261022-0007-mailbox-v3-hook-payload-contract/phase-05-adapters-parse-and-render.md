---
phase: 5
title: "Adapters: parse each CLI's payload, render each CLI's accepted output"
status: pending
priority: P2
effort: "4h"
dependencies: [2]
---

# Phase 5: Adapters: parse each CLI's payload, render each CLI's accepted output

## Goal

Each CLI gets one adapter. Spec §4.1 gives an adapter only one piece of knowledge: its CLI's hook payload shape. The adapter does two jobs:

- **Parse:** it reads a recorded payload into the few facts the drain needs.
- **Render:** it wraps the rendered frames in the exact output that CLI was shown to inject.

Adapters do no I/O and know nothing of the snapshot.

## Types and functions (crate `fgos-mailbox`)

`src/hook/mod.rs` holds the types that phases 5 and 6 share:

- `pub enum HookEvent { Stop, PostToolUse }`, with `pub fn from_flag(&str) -> Option<Self>` for the entry's `--event stop|post-tool-use` (spec §6.1).
- `pub enum Adapter { Claude, Codex, Agy }`, with `pub fn cli(self) -> fgos_mailbox_core::Cli`. It returns `"claude"`, `"codex"` or `"agy"`, the words used in the short name (spec §5.1.1).
- `pub struct Payload { pub event: HookEvent, pub subordinate: bool, pub first_stop: Option<bool>, pub thread: Option<String> }`:
  - `first_stop` is the marker that a Stop is the first of its turn. Claude and Codex give it as `stop_hook_active == false`, agy as `executionNum == 0`. It is `None` at `PostToolUse`, or when the field is absent.
  - `thread` is the native handle a payload carries. For Codex it is `session_id`, the thread id that `codex queue --thread` takes (spec §5.1 and §7). It is `None` for Claude and agy.
- `pub enum Unparsed { Malformed, EventMismatch }`.

`src/adapters/mod.rs` holds `impl Adapter { pub fn parse(self, event: HookEvent, stdin: &[u8]) -> Result<Payload, Unparsed>; pub fn render(self, event: HookEvent, text: &str) -> String }`. These dispatch to the three per-CLI files.

`src/adapters/claude.rs`, `src/adapters/codex.rs` and `src/adapters/agy.rs` each hold a `parse` and a `render`:

- **Parse with `serde_json::Value`.** Unknown keys are expected and ignored. The input must be a JSON object.
  - **Claude and Codex:**
    - `hook_event_name` must equal `"Stop"` or `"PostToolUse"` to match the event, else the result is `EventMismatch`.
    - `subordinate` is true when the key `agent_id` **or** `agent_type` is present, whatever its value or type (plan decision 6).
  - **agy:** its payload has no `hook_event_name` (S0 found camelCase keys).
    - Check the event against the key set that phase 2 recorded as present only for that event. If the recorded `Stop` and `PostToolUse` payloads share every key, trust the `--event` flag alone, and record that the payload cannot confirm the event.
    - Set `subordinate` from the marker phase 2 found. If no marker was found, apply owner question Q1's provisional default as recorded in agy's `source`.
  - **Codex `thread`:** take `session_id` only if it is a non-empty string no longer than `limits.frame.maxHeaderChars`. Phase 6 then decides whether to use it (decision 13).
- **Render:** produce exactly that CLI's `accepted-<event>.json`, with `{{TEXT}}` replaced by `text`. Build it with `serde_json`, never by joining strings, so any text is escaped correctly.

## Tests first (file `tests/adapters.rs`, driven by each CLI's `vectors.json`)

Add `parse` vectors to every `vectors.json`. Each vector names its payload file, its event and the expected result, for example `{ "file": "post-tool-use.json", "event": "post-tool-use", "expect": { "subordinate": false, "firstStop": null, "thread": "<placeholder or null>" } }`. There is one vector for every recorded payload.

Also add synthesized inputs, each labelled `"source": "synthesized"` (the agent-protocol fixtures set this precedent):

- empty input, `not json`, and a JSON array;
- a `Stop` payload sent with `--event post-tool-use`, which must give `EventMismatch`;
- a recorded payload cut at half its length, which must give `Malformed`;
- for Claude and Codex, the head's recorded `post-tool-use.json` with `agent_id` set to `""`, `null` or `7`, and with only `agent_type` added. Each must give `subordinate: true`.

| Test | Behaviour | Why no existing test owns it |
|---|---|---|
| `every_payload_vector_parses_as_it_says` | Each `parse` vector of each CLI, recorded or synthesized, gives the expected `Payload` or `Unparsed` | The payload contract against recorded reality |
| `a_subagent_event_is_subordinate_however_the_marker_is_written` | The recorded `post-tool-use-subagent.json` (Claude; others only if recorded) and the synthesized marker variants give `subordinate: true`. The head's `post-tool-use.json` gives `false` | The marker the drain skips on |
| `the_rendered_output_equals_what_the_cli_injected` | For each CLI and event, `render(event, "MBX-CANARY")` parsed as JSON equals `accepted-<event>.json` with `{{TEXT}}` replaced by `MBX-CANARY` | The output shape is the recorded injected one |
| `rendered_output_survives_hostile_text` | Text holding `"`, `\`, newlines, `</mailbox-message>`, U+2028 and a NUL renders as valid JSON whose text field round-trips exactly | The JSON layer does the escaping, never hand-built strings |

## Steps

1. Sync.
2. Add the `parse` vectors.
3. Write the tests and see them fail.
4. Implement until they pass.
5. Run clippy.
6. Regenerate the census. Commit `feat(mailbox): parse recorded hook payloads and render each CLI's injected output`.
7. Sync, run the proof, push.

## Deviations and results (implementation lead, 2026-10-22)

- **Render through a proven shape.** `Adapter::shape(event) -> Option<Shape>` returns a shape only where the CLI was recorded injecting it (Claude Stop and PostToolUse; agy Stop); `Shape::render(text)` builds the JSON with `serde_json`. The test asserts that a shape exists exactly when an `accepted-<event>.json` exists.
- **Drained only when tested.** `Adapter::is_tested()` reads `adapters.v1.json`'s `testedAgainst` (embedded at compile time). Phase 6's `begin` stays quiet for a CLI that is not tested, so the contract is the one switch.
- **agy (plan owner decision 2, Q1 option C).** Every agy event parses as `subordinate: true`: no recorded field tells the head from a subagent. The event is checked by the keys recorded for one event only (`executionNum` at Stop, `toolCall` at PostToolUse); `first_stop` is `executionNum == 0`.
- **Codex (plan owner decision 3).** Parse uses the S0 report's real Codex payload keys (`hook_event_name`, `session_id`) and the binary schema's `agent_id`/`agent_type`; `first_stop` is always `None` because no Codex Stop payload was recorded; no shape. Its vectors are all labelled synthesized. `thread` is any non-empty `session_id`; the header bound is enforced later because phase 6 takes the handle only when it equals the writer key, which registration already bounds.
- **`Adapter::cli()` returns `Option<Cli>`** (the core's constructor validates); a test proves every adapter word is accepted.
- **One binding per head (plan owner decision 1).** `register` with no stored binding for the key now looks for a binding holding the same head text; if one exists, the new key takes it over at the next generation with its own name and `stop_blocks` 0, the old binding and its generation's records are removed, and the result is `Replaced`. Its exhausted-generation refusal is decided before the sweep. Owning test: `a_second_key_from_the_same_head_takes_its_binding_over_at_a_new_generation_and_never_sees_the_old_mail` (core `tests/registry.rs`). The name test's loop registered five keys from one head text `"h"`; each now has its own head (`h-<key>`), as the test intended.

## Plan owner decisions (2026-10-22, after phase 3; plan owner (agent))

1. **M4, one binding per head.** A second key from the same head replaces the old binding like a dead-head takeover: a new generation, its own name, `stop_blocks` 0, and mail queued for the old key is never shown to the new context. Implemented in phase 5 with its owning test.
2. **agy drain deferred in V3, for every event.** An agy subagent carries no marker and fires its own Stop; under decision 1 a subagent's first hook would replace the head's binding and take its mail, which is worse than missing mail. The agy fixtures stay as contract evidence (parse tests only); agy stays under `deferred` in `adapters.v1.json` (no subagent marker; 1.4.4 refuses `additionalContext`). `overwriteResult` is rejected as a delivery channel: it rewrites a tool's real output with peer text and mixes trust levels. Q1 resolves as option C for agy. What would unblock agy: a payload field naming the parent conversation, or a hook scope that fires for the head conversation only.
3. **Codex deferred** until the owner logs the `tetnu` account in again; Codex is not run. Its parse and render are built only where a report already recorded the real shape; everything else stays deferred.
4. **Phases 4 to 7 continue** with Claude Code as the only live-proven adapter. Phase 7 runs the branch docs and the crate and workspace gates; `npm test` only if a Node file changes; no code-review step (the plan owner runs an independent review).

## Acceptance criteria

- `cargo test --locked -p fgos-mailbox --test adapters` is green for all three CLIs.
- Each adapter file holds only its CLI's payload field names and output shapes. `rg -n 'MailboxState|frame' packages/mailbox/rust/store/src/adapters` finds nothing.
- A CLI whose subordinate marker is unknown is handled as owner question Q1 provides, and its `source` says so.
