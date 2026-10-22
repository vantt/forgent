# Code review: Mailbox rung V3 (hook payload contract)

- Branch `mailbox/v1-v3` at `1ad03e9d2`, diff `35079dce3..1ad03e9d2` (`packages/mailbox`, `scripts`, `Cargo.toml`, `docs`). The `docs/platform/{config,identity,yaml-document}` changes come in through the merges from main and are not V3 scope.
- Reviewer: independent and read-only. Nothing was edited or committed in the worktree.
- Scratch copy: `git archive 1ad03e9d2` in `/tmp/fgos-work/v3rev/src`, built with `CARGO_TARGET_DIR=/tmp/fgos-work/v3rev/cbuild`, `--offline`. The baseline `cargo test -p fgos-mailbox -p fgos-mailbox-core` is green.
- Evidence: 20 source mutations (`/tmp/fgos-work/v3rev/tools/mut.py`), 6 throwaway probe tests (`/tmp/fgos-work/v3rev/src/packages/mailbox/rust/store/tests/probe.rs`), 1 redaction-guard injection, and the Claude Code hooks reference (code.claude.com/docs/en/hooks) for `agent_id` and `agent_type`.

## Scope and what was checked

| Focus | Result |
|---|---|
| 1. Fail-quiet | `begin`, `render_reply` and `finish` are infallible. The hostile-input probe hit no panic and no claim on any of the 3 adapters × 2 events. Inputs: 100k `[`, 5000-deep objects, a 20 MB string, invalid UTF-8, duplicate keys, `null`, `{}`. serde's recursion limit turns deep input into `Malformed`. A broken `adapters.v1.json` makes every CLI quiet (`unwrap_or(Null)`). Gaps: see M2 and L2. |
| 2. Subagent safety | The Claude Code and Codex `agent_id`/`agent_type` skip runs before any state access, for both events (M8 killed). Duplicate keys resolve last-wins and still read as subordinate. agy is subordinate on every event (M13 killed). Claude Code in-process teammates carry `agent_id` (the hooks reference), so the same skip covers them. Gap: see M1. |
| 3. Takeover | "Same head" is full `Record` equality (host, boot id, pid ns, pid, start time, anchor), so pid reuse cannot pass. A pid-ns mismatch or an `Unknown` verdict yields `Deferred`. The one-binding-per-head lookup, however, accepts any second writer key whose head text matches, with no other check (H1). |
| 4. Output shapes | They match the recorded `accepted-*.json` exactly, and hostile text round-trips. The Stop count: the first Stop resets it, it counts only finished blocks, at the cap the Stop passes and the count resets, and a passing Stop resets it. That bounds a Stop loop to `stopBlock.max` blocks per turn (M1–M4, M14 killed). Gap: see M3. |
| 5. Fixtures and recorder | All 23 committed fixture files were scanned and hold no secret or personal value. The guard is a denylist, not an allowlist (M4). The recorder's own redactor is an allowlist and is sound. Its protections hold only partly (L4, L5). |
| 6. Contract gating | Only the CLI name is gated, never the version. That is correct, because the owner's 2026-10-20 decision keeps the drain running at an untested version (spec §4.1, §17). The `Untested` gate itself has no proof (M2). |
| 7. Quality | One owning proof per behaviour mostly holds: 18 of 20 mutants were killed. No invented numbers (`stopBlock.max` = 3 is from spec §12). Contract paths are named once in tests and once in `include_str!`. Gaps: M2, M3, L3. |

## Critical

None.

## High

### H1. The one-binding-per-head takeover accepts any second writer key from the same head process, with no cross-check. The head's mail gets stranded and its name changes on every swap.

- **Where:** `packages/mailbox/rust/core/src/registry.rs:144` (`(None, None) => … find(|b| b.head == req.head)`) and `packages/mailbox/rust/store/src/hook/drain.rs:152-166`.
- **Failure scenario (CONFIRMED in mechanics):** probe `probe_forged_key_from_same_head_steals_binding_and_strands_mail`.
  1. The head registers as `head-key`, named `forgent-codex-03`. A peer sends it mail.
  2. A hook call arrives with the same head `Record` and writer `forged-key`.
  3. The result is `Quiet(NothingEligible)`. `head-key` now has no binding, and `forged-key` holds `forgent-codex-04` at generation 2. The peer's message stays `Recorded` for a key with no binding. It is never offered and is refused only at `record.ttlSec` (24 h).
  4. The real head's next hook takes the binding back, now as `forgent-codex-05` at generation 3. Every swap drops queued mail and renames the address peers use.
- **Exploit path (PLAUSIBLE, lands at V5):** for Codex the writer key will come from the payload's `session_id` (spec §7.3, closing report V5). Any process that can pipe a payload into the entry, with the head process as the head finder's answer, then picks the key. The spec's caller check ("the caller is the head CLI itself") is the only barrier. If it is implemented as "parent pid is the head", `bash -c 'fgos hook mailbox …'` defeats it, because bash execs the last simple command, so the entry's parent becomes the CLI. Measured fact that makes the second key real: a Codex subagent's tool process sees its own `CODEX_THREAD_ID` while running inside the head's process (codex `vectors.json` source).
- **Scope:** this does not reverse the M4 decision. A second key from one process replacing the binding stays as decided. The finding is that the rule trusts the key and the head text with nothing to corroborate them.
- **Suggested fix:**
  1. For Claude Code, add a cheap corroboration in `begin`. When the payload carries `session_id` and it differs from `call.writer`, return a quiet reason and never register. Equality is recorded and asserted by `the_writer_key_the_hook_derives_equals_the_one_its_tool_sees`.
  2. Put the same check into the V5 Codex entry contract, and make the caller check compare the entry's caller against the head's `Record`, not just its parent pid.
  3. Add one payload-suite test: a hook with a mismatched key leaves the head's binding untouched.
  4. Record in spec §5.1 that a takeover strands the old key's queued mail until the TTL refusal. Senders hear nothing for 24 h. Consider refusing that mail with a notice at takeover time.

## Medium

### M1. A head started with `claude --agent <name>` is treated as a subagent forever: it is never registered and never drained.

- **Where:** `packages/mailbox/rust/store/src/adapters/mod.rs:102-104`; vector `agent-type-alone` in `contracts/fixtures/hooks/claude/vectors.json:150`.
- **Scenario (PLAUSIBLE; documented by the vendor but not measured):** the Claude Code hooks reference says `agent_type` is "present when the session uses `--agent` or the hook fires inside a subagent". `agent_id` is the field that identifies "the subagent or in-process teammate". So a person's head session started with `--agent` sends `agent_type` on its main-thread events. It becomes `Subordinate`, never registers, and every `send` to it is refused as an unknown address. fgOS itself launches `claude --agent <agentType>` in `src/runner/dispatch/resolve.mjs:219`. Those are runner heads today, but the pattern exists. The rule fails safe (no wrong injection), but a whole class of heads goes silent with no reason surfaced.
- **Fix:** measure one `claude --agent` run with the recorder. If main-thread events carry `agent_type` without `agent_id`, make `agent_id` the marker for Claude Code and keep `agent_type` alone as a head. Codex recorded both keys on subagent events, so measure it separately. Until then, record the gap in spec §6.1 and §7.3.

### M2. The `Untested` gate has no proof: deleting it fails no test.

- **Where:** `packages/mailbox/rust/store/src/hook/drain.rs:140-146`. The test is `tests/hook_payloads.rs:530` (`a_cli_that_is_not_tested_is_never_drained`).
- **Evidence (CONFIRMED):** mutant M6 replaced `call.adapter.is_tested()` with `true`, and all 117 tests passed. The test that claims to prove the gate never reaches it. Every agy vector expects `subordinate: true`, so the test only ever asserts `Subordinate`, and agy's PostToolUse shape is `None` anyway.
- **Risk:** today agy is kept quiet only by `subordinate: true`. Spec §17 names how agy gets unblocked: "a payload field naming the parent conversation". Once that lands and the head's events stop being subordinate, the `deferred` list is the only guard left, and nothing tests it.
- **Fix:** add a test that drives `begin` with a CLI that is not in `testedAgainst` and a non-subordinate payload, and asserts `Untested` and an unchanged state. One way is an agy payload with `subordinate` cleared in a test-only parse result. Another is to load the `testedAgainst` list from an injected contract. Retire the misleading part of the existing test.

### M3. Nothing proves that only a Stop delivery counts as a Stop block.

- **Where:** `packages/mailbox/rust/store/src/hook/drain.rs:232` (`if ticket.stop_block`).
- **Evidence (CONFIRMED):** mutant M5 (`if true`) survived. A PostToolUse delivery would then count as a Stop block. A busy head that took 3 PostToolUse deliveries would hit `StopBlockCap` at its next Stop and never be woken for wake mail.
- **Fix:** in `stop_blocks_at_most_…` or the PostToolUse test, assert `stop_blocks() == 0` after a PostToolUse `deliver`.

### M4. The committed redaction guard is a denylist, not an allowlist. Several kinds of personal value pass it.

- **Where:** `packages/mailbox/rust/store/tests/fixtures_contract.rs:17,113-175,179-183`.
- **Evidence (CONFIRMED):** these were injected into `claude/stop.json` and run with `USER=runner` (as on CI):
  - `/Users/vantt/projects/forgent`
  - `/root/.claude/...`
  - `Van Tran tetcu at fgorg`
  - a hostname `vantt-thinkpad`
  - a 58-character base64url key with `_` and `-` in it

  `fixtures_contract` stayed green. Why each escapes:
  - The OS-user check depends on the machine running the test.
  - `foreign_homes` knows only `/home/`.
  - `secret_runs` splits on `_` and `-`.
  - The account list holds `tetcu72` but not the `tetcu` stem.
- **Today's fixtures are clean:** all 23 files scanned. Every UUID is a placeholder, homes are `/home/user`, and free text is `<redacted>`. The recorder's own `makeRedactor` is a real allowlist.
- **Fix:** make the guard check allowed shapes instead of searching for forbidden ones:
  - Every string leaf must be a placeholder UUID, `<redacted>`, `{{TEXT}}`, a path under `/run-dir`, `/repo` or `/home/user`, or a literal from a short per-key list (`hook_event_name`, `tool_name`, `permission_mode`, `level`, the two tool commands, `done`, …).
  - The prose `source` and `note` fields keep a denylist that also covers `/Users/` and `/root/`.

## Low

### L1. A registration refused with `NameDoesNotFit` changes the state, against the spec's "every refusal is decided before the sweep".

- **Where:** `packages/mailbox/rust/core/src/registry.rs:174` (sweep) runs before `create` at line 231 can return `NameDoesNotFit`. The spec sentence is in §5.1.
- **Evidence (CONFIRMED):** probe `probe_name_refusal_after_sweep` (project `""`) returns `Quiet(Registration(NameDoesNotFit))` with the state changed. The effects are legitimate time rules, so harm is small. But a shell that skips the write on refusal drops them, and the spec claim is false.
- **Fix:** decide name allocation before the sweep (allocation reads only bindings), or narrow the spec sentence.

### L2. `Begun::Quiet` does not mean "unchanged", and the API gives the shell no dirty flag.

- **Where:** `drain.rs:122-123` (doc) and the `Begun` type.
- **Evidence (CONFIRMED):** probe `probe_quiet_reply_with_a_changed_state`. A first hook returns `Quiet(NothingEligible)` after creating the binding. The cap reset at `StopBlockCap` and a takeover also return quiet with a changed state. V4 must either clone and compare the snapshot (on the 50 ms p95 hot path) or always write, which breaks "no write on the no-mail path". If it guesses "quiet means no write", registrations are lost.
- **Fix:** have `begin` return whether it changed the state, for example `Begun::Quiet { reason, changed }`. `register` and `note_stop` already know it.

### L3. The drain is not pure, although its doc says it is, and the same-head test compares a parsed record against an unparsed one.

- **Where:** `head.rs:27,32` and `drain.rs:21-24`.
- **Purity:** `judge_stored` calls `judge_here`, which reads `/proc`, the boot id and the host name, under mutex hold 1. That contradicts "the drain reads and writes no file". It runs only when the stored head differs, so the cost is off the hot path. Either fix the doc or pass the verdict in from the shell.
- **Round trip (CONFIRMED by probe `probe_round_trip_unstable_record_self_conflicts`):** a registering record whose JSON does not round-trip (`boot_id: Some("")` or `"unknown-boot"`) registers once, then conflicts with itself forever (`Registration(Conflict)`). The platform never produces such a record. A V4 head finder that reads a session file could.
- **Fix:** compare `Record::from_json(&registering.to_json())`, or compare `head_text` strings, as the takeover lookup already does.

### L4. The recorder's "no user hooks" guarantee is checked only after the run, for agy and Claude Code.

- **Where:** `scripts/record-mailbox-hook-fixtures.mjs:240`.
- **agy:** runs with `HOME=<account home>`, so hook files in that account home would load. The fixture source shows that `agy.log` was read afterwards ("loaded 1 named hooks … the workspace's own file"), but the script does not refuse a run when other hook files exist.
- **Claude Code:** `--setting-sources project` excludes user and plugin hooks but cannot exclude managed policy hooks. The transcript check after the run caught that case.
- **Fix (PLAUSIBLE):** before a run, assert that the account home has no `.agents/hooks.json` or `.gemini` hook file other than the workspace's. Have `check` fail when the log names more than one hooks file.

### L5. After a broken auth link, the recorder deletes the refreshed `auth.json`.

- **Where:** `record-mailbox-hook-fixtures.mjs:322`.
- **Scenario (PLAUSIBLE; depends on how Codex writes the file):** if Codex rewrites `auth.json` by temp-file-and-rename, the symlink becomes a plain file holding the only valid, just-rotated refresh token. Deleting it logs the account out for good. The phase-02 plan prescribed the delete, as a plan-owner (agent) decision, not the owner's.
- **Fix:** move the file aside, for example to `<runDir>/auth.json.rotated`, mode 0600, and tell the owner, instead of deleting it.

### L6. The `att-` runner head is still registered by `begin`.

Known and deferred to V5 by spec §14 (the V3 row). It is listed only so V5 does not lose it.

## Mutation results (20 mutants)

| Mutant | Result | Proof that killed it |
|---|---|---|
| M1 no first-Stop reset | killed | `stop_blocks_at_most_…` |
| M2 `>` instead of `>=` at the cap | killed | `stop_blocks_at_most_…` |
| M3 no reset at the cap | killed | `stop_blocks_at_most_…` |
| M4 no reset on NothingEligible | killed | `a_recorded_stop_blocks_…` |
| **M5 finish counts every claim as a Stop block** | **survived** | none (M3 above) |
| **M6 `is_tested` gate removed** | **survived** | none (M2 above) |
| M7 `is_tested` always true | killed | 11 payload tests |
| M8 `agent_type` not a marker | killed | adapters tests |
| M9 handle filter removed | killed | `the_codex_thread_handle_…` |
| M10 and M11 same-head judgement broken | killed | `head.rs` tests |
| M12 no HeadUnknown | killed | `inputs_that_cannot_be_a_head_event_…` |
| M13 agy not subordinate | killed | adapters vectors |
| M14 ticket `stop_block` false | killed | 2 tests |
| M15 and M16 FromKey takeover broken | killed | core `a_second_key_from_the_same_head_…` |
| M17 `note_stop` ignores the generation | killed | core `stop_blocks.rs` |
| M18 takeover keeps `stop_blocks` | killed | core `stop_blocks.rs` |
| M19 Codex empty-thread filter removed | killed | vectors |
| M20 Claude `first_stop` constant | killed | vectors |

## Verdict

**Yes, V3 meets its rung.** Every proof the spec's V3 row lists exists and fails when its branch breaks. The exceptions are the `Untested` gate and Stop-only counting (M2, M3), which are cheap test additions and not defects in behaviour today. The output shapes match the recordings, fail-quiet holds on hostile input, the subagent skip covers both events for Claude Code and Codex, agy is quiet on every event, the Stop loop is bounded, and the fixtures are clean.

**Nothing blocks V3 itself.** These must land before the rungs that build on it:
- before V4: M2, M3 and L2;
- before V5 wires the Codex key from the payload: H1;
- before calling every head "drainable": M1.

Status: DONE_WITH_CONCERNS
Summary: V3 meets its rung. There are no critical findings, and 18 of 20 mutants were killed. One High: the one-binding-per-head takeover trusts any second key from the same head process, which strands mail and renames the head, and Codex at V5 makes that key payload-controlled. Four Medium: `--agent` heads are muted, the `Untested` gate is unproven, Stop-only counting is unproven, and the redaction guard is a denylist.
Concerns/Blockers: H1 must be resolved before V5; M2, M3 and L2 before V4.
