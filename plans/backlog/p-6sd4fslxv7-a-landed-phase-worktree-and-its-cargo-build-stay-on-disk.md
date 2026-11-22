---
id: p-6sd4fslxv7
title: "A landed phase's worktree and its cargo build stay on disk until someone removes them by hand (git/supervision, priority high; source: owner, 2026-11-22 14:55)"
status: proposed
priority: P1
area: supervision
created: 2026-11-22
---

# Why

On 2026-11-22 the root disk filled to 95% three times. Each lead opens a fresh worktree for every phase attempt (heads-stable reached p06f), and each one carries a 6-12 GB cargo build in its own `target/`. Nothing removes a worktree once its branch has landed. lead:SUPERVISOR removed about 40 of them by hand during the day, and one land failed with ENOSPC. The owner decided at 14:55 that this cleanup should be automatic ("nên dọn dẹp").

# Done when

After a successful branch land, the land door removes that branch's worktree through the existing worktree door (`fgos worktree remove --delivered-to <target> --discard-ignored`) when it is clean and no process stands in it, and it reports what it kept and why. The lead skill reuses one worktree per phase and hands any kept worktree to the supervisor. A fixture shows a landed clean worktree removed and a dirty one kept and named.

# Notes

Related: p-ces4w7vbsi (target directories outside any worktree have no reaping verb). Folded into plan 261122-0118-heads-stable-and-able as an owner-approved addition, 2026-11-22 14:55.
