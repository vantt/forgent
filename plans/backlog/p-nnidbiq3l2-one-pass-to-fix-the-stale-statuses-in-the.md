---
id: p-nnidbiq3l2
title: "One pass to fix the stale statuses in the closed `harden-*` plans (plan hygiene, priority medium; source: HARDEN plan review Q1, owner 2026-11-18 chose a)"
status: done
priority: P2
area: plans
created: 2026-11-18
---

# Why

About 85 phase files of the closed sub-plans still read `pending`, the root plan lacks the T9 and Packaging rows in its Phases table, ledger rows R2 and R6 carry old state, the closing report has a pasted subagent status block and a self-contradicting section 7.3, and sub-plans mix `landed`, `completed` and `done`.

# Done when

A supervisor runs one pass: each phase is checked against its commit, only the status and a closing line change (landed phase rows use `done`); the plan table no longer misreports; no guard is added.

# Notes

Migrated from the legacy backlog table. Original status: done (`05b55a165`, status pass over the closed `harden-*` plans).
