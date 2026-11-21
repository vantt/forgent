---
id: p-75ixkb4zyk
title: Audit tests that take a lock or expect an inline seal right after a setup `add` for the same race (Event Store tests, priority medium; needs OPC review)
status: done
priority: P2
area: platform-foundations
created: 2026-11-15
---

# Why

The detached `events seal` and `events sync --opportunistic` children handed off by a setup `add` outlive it on a slow machine and hold `event-seal`; `background-seal.test.mjs` and `triggers.test.mjs` raced them on CI (the suite took 2437 s there against 667 s) and were fixed by waiting for the children. Other tests that start a lock holder, take the seal lock, or expect an inline seal receipt right after a setup `add` can carry the same race and were not audited. Done 2026-11-15 (97fe60364): background-seal-confined.test.mjs now waits for the add's seal child; the rest of the suite was audited and is safe (argued, not reproduced). If it flakes again, look first at the end-trigger test's `lastPush === null` assertion: it holds only while the child is slower than the trigger.

# Done when

Every such test waits for the setup children (one shared helper) or does not depend on the lock, with a run under 30 busy loops in an emulated CI env (`env -i`, fresh HOME, minimal PATH) passing; the helper is the one place that knows the child argv.

# Notes

Migrated from the legacy backlog table. Original status: done.
