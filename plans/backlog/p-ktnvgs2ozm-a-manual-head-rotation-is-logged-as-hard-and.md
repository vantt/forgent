---
id: p-ktnvgs2ozm
title: A manual head rotation is logged as `hard` and hands off nothing (session rotation, priority medium)
status: done
priority: P2
area: session-rotation
created: 2026-11-18
---

# Why

`fgos head rotate` sends reason `manual` (`bin/fgos.mjs:3462-3463`), `src/session-rotation/rotate.mjs:264` writes every non-`soft` reason as `rotation: hard`, and a manual rotation carries no last message, open question or portfolio (`src/session-host/head-request.mjs:44-48`, `rotate.mjs:262-266`); `core/config-standard/sessionRotation.yaml:16` has `personas: {}`, so even a hook rotation reloads no secretary portfolio. Seen 2026-11-18 on Miu gen 3 and 4 (two 380-byte empty handoffs; gen 3's pending-work summary lost). Evidence: `plans/reports/debugger-261118-2130-miu-early-hard-rotation.md`. **Done 2026-11-19:** a manual rotation is logged `manual` and hands off the last message and the persona portfolio; `sessionRotation.personas.secretary.reload` is set; plan `plans/261118-0947-session-verb-for-agent-sessions/plan.md` phase 8.

# Done when

The log names the real reason (manual/soft/hard); a manual rotation hands off the last message, open questions and the persona's portfolio list; the secretary persona has a reload list.

# Notes

Migrated from the legacy backlog table. Original status: done.
