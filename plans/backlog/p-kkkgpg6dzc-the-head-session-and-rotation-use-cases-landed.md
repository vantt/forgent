---
id: p-kkkgpg6dzc
title: "The head-session and rotation use cases landed in Node and should move to Rust (session-host, priority medium; source: owner 2026-11-18, new code goes to Rust when it can)"
status: proposed
priority: P2
area: session-host
created: 2026-11-18
---

# Why

`src/session-host/head-start.mjs`, `head-request.mjs`, `head-request-client.mjs`, `head-grants.mjs`, `src/session-rotation/rotate.mjs`, `handoff-store.mjs` and `src/runner/dispatch/session-attempt.mjs` are Node because they call the Node seat door (`prepareAttemptSeat` in `assignment-runner.mjs`) and the bind door.

# Done when

Once the seat door is reachable from Rust, these use cases live in the Session Host crate behind the same contracts (`head-request.v1.json`, the session envelope, the handoff record), the Node files and their tests are retired in the same change, and `fgos head start|rotate` route natively.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
