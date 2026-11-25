# Phase 1: Diagnose confined mail

Prove why a confined head's mail fails before anything changes (discussion task `task-diagnose-confined-mail`,
HC-D1). Capability: `code:debug`.

## Inputs

- `plans/discussions/ds-h3fvnp6qbt-head-communication-and-requests/DISCUSSION.md` §3 rows 5, 7, 14 and the Seed.
- `plans/backlog/p-rchuoa2v3k-*.md` (read fails `lock-unavailable`), `plans/backlog/p-ia2v33b54u-*.md` (send fails
  `event-store-unavailable`, read-only file system, 2026-11-22).
- `packages/session-host/contracts/head-permissions.v1.json` (no `mailbox inbox` row: an unmatched argv is `ask`).
- `packages/session-host/rust/src/forwarder.rs` around line 509 (where a code-less refusal becomes `host-failed`).
- `apps/fgos/src/wiring/supervision.rs` `send_confined`, `packages/run-supervisor/rust/src/head_client.rs`,
  `head_request.rs`; `apps/fgos/src/wiring/mailbox_verbs.rs`, `mailbox_root.rs`, `mailbox_hook.rs`.
- `docs/platform/agent-mailbox/spec.md` §6.4 (local record), `docs/platform/agent-confinement/spec.md`.

## Footprint

`plans/261125-2313-head-communication-agent-to-agent/reports/diagnose-confined-mail.md` only. No code changes.

## Steps

1. From a confined head of each persona that has a `mailbox send` row (lead or planner, shaper, supervisor or
   secretary), run `fgos mailbox send --to <peer role> "probe"` and `fgos mailbox inbox`; capture argv, exit code,
   stdout JSON, stderr.
2. Trace each call: does it go through the request socket (forwarded row) or run in-process inside the cage? Which
   path does it open (record lock under the main checkout's `.fgos`, the Event Store floor probe)? Use the host's
   own output and `strace -f -e trace=openat,flock` on the confined process where allowed.
3. For the forwarded send, read the host verb's real stdout and stderr and show why `forwarder.rs` mapped it to
   `host-failed` (no code in the document, none bracketed, none matched by `provider_refusal`).
4. Name the cause of each failure with the file and line, and say whether the fix lies inside this plan's
   footprint (phase 4) or outside it.

## Verify

The report exists, reproduces both failures with captured output, and names one cause per failure with a source
line. Pass: a stranger can rerun step 1 and see the same refusal.

## Rollback

Delete the report.
