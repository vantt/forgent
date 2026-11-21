---
id: p-slkn4zybwm
title: "Redact friction `detail` before append, or keep it in an untracked side file (observe, priority medium; credential exposure class); source: HARDEN plan review `plans/reports/review-261118-1850-harden-plan-review.md` Q2 (owner 2026-11-18: move the Additions to backlog); origin: root plan section \"Additions waiting for the owner\", found 2026-10-24"
status: proposed
priority: P2
area: observe
created: 2026-11-18
---

# Why

Raw git and runner error text goes verbatim into git-tracked `.fgos/observe/friction/*.jsonl` (`approve.mjs:574`, `loop.mjs:1186`); Observe has no redaction; nothing leaked today (red-team RT-16).

# Done when

A credential in a remote URL or error text can never reach a tracked file; proven by a test that appends a secret-looking error text; no secret value is printed in the proof.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
