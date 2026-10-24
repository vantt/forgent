---
title: "Review B fixes: WORK cutover readers, triggers, removals and registrations"
date: 2026-10-22 (Asia/Saigon)
branch: work/es-revb (from work/es-cutover b276f3dfe)
---

# Review B fixes

## Finding to change to test

| Finding | Change | Owning test |
|---|---|---|
| M1 | `.githooks/pre-commit`: `stagedEventLogShrinkRefusal` refuses a commit that stages an `.fgos/**/*.jsonl` file with fewer lines than HEAD, active only while the `.fgos/events` fence file is absent (`eventFenceExists`, shared with `addedEventPathRefusal`). Separate commit `4e566bc6d`. | `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`: shrink refused; grow and new log pass; config.json shrink passes; guard off once the fence exists |
| M2 | `readEventStoreConfig(root, global, { strict })` in `src/event-store/config.mjs`. Unparsable shared file: default callers (write path, triggers) get `sync.intervalSec` 0, so a trigger seals and never pushes. `strict: true` (`src/verbs/events/context.mjs`, `src/setup/event-store-checks.mjs`) throws `event-store-config`. | `test/event-store/verbs.test.mjs` (config reader), `test/event-store/triggers.test.mjs` (seals, no push), `test/setup/event-store-checks.test.mjs` (doctor sees the failure) |
| M3 | No production change. The URL is already redacted at the source: `GitDriver::remote_url` applies `redact` (`packages/git/rust/src/driver.rs:2512-2514`), and the provenance URL comes from the same path. The helper is a private Rust fn, so a JS copy would break one door. The review read `diagnostics.rs` without following `driver.remote_url`. | `test/event-store/verbs.test.mjs`: remote with userinfo and token query shows `https://[redacted]@example.test/repo.git?[redacted]`, no secret anywhere in the status output |
| M4 | Wiring proof only. | `test/event-store/triggers.test.mjs`: via a `GitRecovery.listRetainedLand` spy, `approve`, `sync-root`, `promote-to-component`, `merge next` sweep once at the end; a dispatched worker, `list` and `merge list` never. Refusals still end the command, so no landable item is built. |
| L1 | Docblock of `landRunnerItem` in `src/runner/merge.mjs` (comment only). | none needed |
| L2 | `session end` and `gateway stop` pass `resolveMainCheckoutRoot(root) ?? root` as `trustedMain`. | `test/runner/gateway-control.test.mjs`: stop from a linked worktree seals the main store. Session end uses the same one-line resolution; not separately provable without a linked-worktree session. |
| L3 | `eventStoreDoctor` remembers a failed setup context. | `test/setup/event-store-checks.test.mjs` |
| L4 | CHANGELOG: hook claim corrected, `checkpoint` retirement stated once, `fgos init` needs a Git repository; the stale comment at `bin/fgos.mjs` init corrected. | n/a |
| L5 | `setup-doctor-registry.md` shape fixed; how-to says its Event Store rows are selective and points to spec §21. | n/a |
| L6 | The two duplicate CLI tests are one. | `triggers.test.mjs` |
| L7 | `packages/work-state/rust/src/work_source.rs` reads only `.fgos/cache/state.json`. | `test_tracked_state_json_view_is_never_read`; two tests moved to the cache path |
| L8 | Stale comments removed in `bin/fgos.mjs`, `src/cli/{invocation,approve}-fault-log.mjs`, `src/runner/{session,recovery,worker-log}.mjs`. | n/a |

## Open questions
- Dispatched worker may run `fgos events sync` explicitly: spec §21 clarification, dated 2026-10-22. Code unchanged.
- Gateway seal timer: not built, by owner decision. The gateway has no seal loop; spec §16 reworded (dated 2026-10-22): the gateway seals on stop, its Work writes go through `fgos` invocations that each seal at their end, and the runner's watch loop is the only long-lived seal-on-poll loop.

## Runs (after go)
- Owning files: green (after fixing my Land test to run the Land verbs from the repository cwd, not `--dir <.fgos>`).
- `test/event-store test/setup`: 1035/1037 pass at first run. One failure, `test/setup/active-release-drift-check.test.mjs:328` "real builder selection and staged production dependency payload agree with doctor": needs `libfgos_node_addon.so` from a `cargo build --release --workspace` that this run's target dir does not hold. Environmental, not touched by this change; not rerun since a release build would load the machine.
- `test/cli`: 0 failures. Hook tests (`test/e2e/*hook*`, `test/githooks`, `test/scripts/*hook*`), `test/runner/session.test.mjs`, `gateway-control.test.mjs`: 0 failures.
- `cargo test --locked -p fgos-work-state`: ok.
- Census `--check`: only main's 5 unresolved-binary sites; no census change needed.

## For the review A lead / controller
- Stale comments naming retired readers remain in files owned by review A: `src/state/drift-status.mjs:15`, `store.mjs:1862`, `frontier.mjs:4`, `impact.mjs:4`, `awaiting-context.mjs:45`, `graph-harness.mjs:3`, `tool-registry.mjs:220`, `src/verbs/merge/approve.mjs:76`.
- `src/runner/merge.mjs` edit is comment-only; collides only if review A touches the same docblock lines.

Status: DONE_WITH_CONCERNS
