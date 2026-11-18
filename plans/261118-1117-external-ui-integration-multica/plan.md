---
contract: plan-v1
title: "Integrate fgOS with external agent-operation UIs (multica first): projection, runtime and placement through six ports"
status: draft
priority: P3
blockedBy:
  - 261118-1045-project-supervisor
created: 2026-11-18
tags: [integration, multica, projection, ports, supervisor]
---

# Integrate fgOS with external agent-operation UIs (DRAFT, idea only)

**Status: draft.** This is an idea the owner chose to keep as its own plan (2026-11-18). Current work focuses first
on fgOS coordinating its own plans well (plan `261118-1045-project-supervisor`). No phase is written yet.

## Owner direction (2026-11-18)

- "cần phải hiểu multica là projection. mỗi plan có thể là 1 task lớn, mối phase là task nhỏ. chúng ta thậm chí là
  một loại runtime của nó hoặc chúng ta chạy bên trong runtime của multica"
- "lưu ý tưởng tích hợp multica với fgos thành 1 plan riêng và cơ chế 6 port trong plan đó."
- D-ADR0079: the portfolio is the project's truth. Work, or a replacement such as multica, is a surface that reads and
  writes it through doors.

## Three directions to support without rework

1. **Projection**: plan → parent task, phase → sub-task, lead/worker → assignee, five-part question → comment +
   blocked status. Data flows one way from the portfolio truth. The UI acts back only through the command port.
2. **fgOS as a runtime of the UI**: the UI assigns a task, and its daemon calls one fgOS entry that runs a plan (a lead)
   or one phase (a worker under the lane door). The admission authority becomes a port: `internal` (the fgOS
   supervisor picks plans) or `external` (the UI's assignment admits them, and the supervisor still arbitrates lanes,
   reclaims leads and closes plans).
3. **fgOS inside the UI's runtime**: the UI's daemon hosts fgOS sessions. This is a Session Host placement adapter, and
   confinement must still hold.

The contract shared by all three is stable plan and phase ids plus the plan status vocabulary. Each adapter owns its
own mapping table, because the UI owns its own data.

## Six ports (hexagonal; the in-house adapter first, then each external UI as an adapter)

1. **Portfolio read port**: one JSON read of plans, status, priority, lanes in use, leads and open questions (CLI
   `--json` and the gateway REST).
2. **Command port**: the verbs Miu and the supervisor already use (set priority, hold/resume a plan, answer a
   question). A UI never edits internals.
3. **Wake door**: `fgos supervisor wake --trigger <kind> --ref <id>`, the same door the watcher calls.
4. **Notifier port**: the watcher's `notify` action goes through notifier adapters (mailbox first, then an outbound
   signed webhook).
5. **Session placement port**: Session Host (`direct`, `terminal`), with a UI-hosted runtime as a later adapter.
6. **Question port**: five-part questions go out through `fgos questions --open`, and an adapter maps them to the UI's
   comments and blocked status.

## Evidence and inputs

- Multica research: [../reports/research-261118-1045-multica-integration-surface.md](../reports/research-261118-1045-multica-integration-surface.md).
  Its stable doors are the CLI (`--output json`, PAT), plugin signed event hooks and autopilot inbound webhooks. Its app
  REST API has no public contract. It runs agents unsandboxed and asks humans through free-text comments. Its license
  restricts embedding or hosting it commercially, but calling its API is fine.
- Shaping record: [../reports/shaping-261118-1045-supervisor-owner-questions.md](../reports/shaping-261118-1045-supervisor-owner-questions.md)
  (rounds 4 and 5).

## Open before this draft can become a plan

- Which direction comes first (projection is the cheapest, using the CLI and webhooks).
- What the supervisor plan already ships that these ports reuse: the wake door, the phase-run entry, the event queue
  in the Event Store, and the Observe events.
- The multica API's stability (no public REST contract) and its license limits.
