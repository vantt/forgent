# Closing: Mailbox V3, hook payload contract (branch `mailbox/v1-v3`)

Plan: [`plans/261022-0007-mailbox-v3-hook-payload-contract/plan.md`](../261022-0007-mailbox-v3-hook-payload-contract/plan.md). Each phase file holds its own deviations. Spec on the branch: `docs/platform/agent-mailbox/spec.md` §5.1, §5.5, §6.1, §6.4, §7.3, §12, §14 (V3 and V4 rows) and §17.

## Commits (branch only; nothing merged to main)

| Phase | Commit | What |
|---|---|---|
| reconcile | `e79d9eaf5` | deviations of phases 1, 3 and 6 against the closed V1 API |
| 1 | `de3f5d5e6` | crate `fgos-mailbox`, `HookLimits`, `mailbox.stopBlock.max`, a `reader` on every limits key, shared test support |
| 2 | `d1f857d2b` | recorder script, Claude Code and agy fixtures, redaction guard, `adapters.v1.json` |
| 3 | `7a4e6cad1` | `Binding.stop_blocks` and `note_stop`; same-head and refused registrations write nothing; body-missing frame through the one `render` door |
| owner decisions | `e39a62253` | M4, agy and Codex decisions in the phase files and spec §17 |
| 4 | `6dc28693c` | `head::{is_complete, head_text, judge_stored}` over process facts |
| 5 | `f76ea1099` | adapters (parse, proven shapes, `is_tested` from the contract); one binding per head in the core |
| 6 | `39c4fc8c0` | drain `begin` / `render_reply` / `finish`, payload suite |
| 7 | `61ff8a16e` | branch docs (spec, reading map, component boundary) |
| Codex | `9cb7f74ec` | Codex recorded with `tetnu` and drained; recorder login guard corrected |
| 7 | `7fb7c4f4b` | contract and fixture paths named once in the hook crate's tests |

## Tests per file

- `fgos-mailbox-core`: 93. These are the V1 suite plus `limits_contract` (+1 reader test), `stop_blocks` (3), `registry` (+1 conflict-or-deferred, +1 one binding per head, 1 rewritten, 1 retargeted) and `frame` (+1 body missing).
- `fgos-mailbox`: 24. They are `limits_contract` 1, `fixtures_contract` 3, `head` 2, `adapters` 5 and `hook_payloads` 13.

## Gates on the final merge (main `c17c9688e`)

| Gate | Result |
|---|---|
| `cargo test --locked -p fgos-mailbox -p fgos-mailbox-core` | 117 passed, 0 failed |
| `cargo fmt -p fgos-mailbox -p fgos-mailbox-core -- --check` | clean |
| `cargo fmt --all -- --check` | fails outside `packages/mailbox` only (workspace drift, item `tsk-hls`) |
| `cargo clippy --locked --workspace --all-targets -- -D warnings` | clean (run on main `efba97e1f`; the later main commits are docs only) |
| `cargo test --locked --workspace` | 1375 passed, 0 failed, 11 ignored (main `efba97e1f`) |
| `npm test` | 8850 tests, 8735 passed, 19 failed. The failures are in `test/rust-host/fgctl-upgrade.test.mjs` (15), `fgctl-init-download-sources.test.mjs` (2) and `test/runner/dispatch.test.mjs` (2). Every failing title also fails on a clean `origin/main` worktree running the same files, so none of them comes from this branch. The assignment-tree listing guard that the recorder first tripped now passes. |
| `cargo tree -p fgos-mailbox -e normal --depth 1` | `fgos-mailbox-core`, `fgos-process`, `serde`, `serde_json` |
| `fgos convention check --dir . -- <44 added files>` | 0 violations |

## Recorded CLIs (`adapters.v1.json`)

| CLI | Version | Injected shapes | Subagent marker | Status |
|---|---|---|---|---|
| Claude Code | 2.1.307 | context `hookSpecificOutput.additionalContext`; Stop `{"decision":"block","reason"}` | `agent_id`/`agent_type`; no Stop of its own | tested, drained |
| Codex | 0.161.0 (account `tetnu`) | same two shapes | `agent_id`/`agent_type`; no Stop of its own | tested, drained |
| agy | 1.4.4 | Stop block only; both context shapes refused | none; a subagent fires its own Stop | deferred (question Q1 resolved as option C); parse tests only |

## Open items for the next rungs

- **V2:**
  - The snapshot schema stays version 1 and V2 freezes it.
  - Reuse `head::judge_stored`, `head_text` and `is_complete`.
  - An unparseable stored head stays `Deferred` until a breaker or `status` surfaces it.
- **V4:**
  - The shell around the drain: write stdout, then `finish`.
  - The Claude Code head finder.
  - The exit-status proof.
  - The caller check.
  - The delivery-report sentence of `send`.
  - The output-size measurement at `queue.cap × maxBodyBytes`.
- **V5:**
  - The `att-` case.
  - The entry's CLI option (decision 4).
  - The Codex writer key must come from the payload's `session_id`, because Codex's hook process sees no session-identity variable.
  - The config-merge registration of `mailbox.stopBlock.max`.
- **agy:** it is unblocked by a payload field naming the parent conversation, or a hook scope for the head conversation only.
- **Unresolved from V1's review:**
  - M2: an age bound on the derived parent.
  - A head sending to itself.
