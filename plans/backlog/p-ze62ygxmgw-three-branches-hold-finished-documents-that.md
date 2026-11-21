---
id: p-ze62ygxmgw
title: "Three branches hold finished documents that never reached main, and 88 branches count as unmerged although most are not (git, priority medium; source: owner via Miu, 2026-11-21)"
status: proposed
priority: P2
area: git
created: 2026-11-21
---

# Why

Documents missing on main: `research/rust-verb-migration` (assessment of moving the legacy-cli verbs to the Rust host), `research/three-layer-vision-gap` (how far the code reaches the Execution, Workflow and Domain layers), `mail/frame-reword-remeasure-plan` (three mailbox plan files). Bring each onto main through the land door, as docs. Of the 88 branches `git branch --no-merged` lists, 46 carry no patch that main lacks and 25 more carry commits whose subjects are on main; the rest need a verdict per branch: `execution-read-door/parity-runner` (43 files, 9 absent on main), `harden/t2-p08-census-slices`, `cook/zombie-land`, `mail/live-confined-zombie`, `work/es-ab-head`, `opc/scan-lows`, `backup/main-checkout-20261118`, `shape/work-data-model`; live lanes (`doors/p03`, `s6/p19c-*`) are left alone. The owner decided 2026-11-21: keep every branch, delete nothing until each group is reviewed; the branches cost almost no disk, so there is no hurry.

# Done when

The three documents are on main; a table lists every unmerged branch with one verdict (already on main, superseded with the commit that replaced it, real work to land, keep) and its evidence; the owner approves deletion by group, and only the approved group is deleted.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
