---
id: p-4bz6upn27k
title: "`fgos release check` and `fgos release run` leave their 14-50 GB check checkout behind after the run, so a few gates fill the disk (release, priority P1; source: lead:SUPERVISOR on fg-server2, 2026-11-28)"
status: proposed
priority: P1
area: release
created: 2026-11-28
---

# Why

Each release check builds the whole workspace in a fresh `forgent-worktrees/release-check-*` checkout (14 GB for `release run`, 35-50 GB for the `chk-c-*` checkouts of `release check`). When the run ends red, times out, or its own cleanup fails (`fgos worktree remove` exit 1), the checkout stays. On 2026-11-27/28 fg-server2's root disk reached 0 GB free five times; each time the space was held by finished check checkouts with no process in them, and running gates of other leads failed with ENOSPC or EDQUOT as a result.

# Done when

A check checkout is removed when its run ends, whatever the outcome, unless a named debug flag keeps it; a later run or `fgos git recover` removes any left from a crashed run; and two concurrent gates on one machine no longer fill the disk.

# Notes

Related: plan `261127-1224-release-checks-clean-tip` (introduced the clean check checkout) and backlog row `p-ibbgkehpsx` (shared build cache for the release check checkout).
