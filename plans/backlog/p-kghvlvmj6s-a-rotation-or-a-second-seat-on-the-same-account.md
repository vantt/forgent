---
id: p-kghvlvmj6s
title: A rotation or a second seat on the same account starts with a spent refresh token (execution, priority high; cause corrected by lead:S6A 2026-11-19)
status: proposed
priority: P1
area: execution
created: 2026-11-19
---

# Why

The secretary head's rotation at 09:00Z was refused `login-expires-before-seat-timeout` (account vantt, pool claude-miu). It ran in Node, and Node's refresh-ahead did run but failed (probe-failed): the still-running previous head (Miu gen 12) had renewed inside its private seat home at 15:39 local and spent the single-use refresh token; the new pair only returns to the account store at finalize-home, which the old head had not reached. The successor therefore copied a store with a spent token. (The first reading, that Rust skipped refresh_ahead, was wrong: no shipped binary links the engine path yet.)

# Done when

Under the account lock, refresh-ahead first takes the newest valid credential pair from any live seat home of the same account, then probes; the same in the Rust engine credentials module. Owning tests: rotation with the old head alive, and two concurrent seats sharing one account; no credential value is ever logged.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
