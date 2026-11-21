---
id: p-s2x6ejt575
title: "Land the two unlanded mailbox commits of `mail/live-confined-zombie` (mailbox, priority medium; source: owner via Miu, 2026-11-21, branch verdict table group C)"
status: proposed
priority: P2
area: mailbox
created: 2026-11-21
---

# Why

Commits 27b40f563 and 063ec3059 were reviewed MERGE on 2026-11-14 (board log, now corrected) but never reached main: `processesOfRun` in scripts/lib/mailbox-live-confined.mjs still has no zombie skip, and `git cherry` shows both as unique. They make the live-confined harness skip Z/X processes through the existing stateOf, matching identity_of's rule that a zombie is not live.

# Done when

The two patches are rebased onto main, adapted where main moved, and landed through `fgos land` with their own owning proof (the harness test that a zombie child is not counted as a leftover). The board log carries the real land commit. After the release hold, one lane, one thing at a time.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
