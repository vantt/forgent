---
title: Observe nested run coverage foundation
date: 2026-10-05
summary: Layout-v2 coverage verified; strict timestamp baseline and watchdog gate recorded
---

# Observe nested run coverage foundation

Layout-v2 coverage verified; strict timestamp baseline and watchdog gate recorded

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

## Change

Implemented the accepted Observe visibility foundation (phases 1–3): bounded nested-run layout, Node reader/recovery migration, Rust scanner and metrics coverage, independent doctor coverage and rebaseline. No history rewrite or new run index.

## Decision

Keep result-owned settlement timestamps. The owner does not need backward compatibility; assignment creation cannot stand in for settlement. forgentX coverage is 1195 candidates /221 observed /925 missing timestamp /49 unreadable; mdview is81/74/6/1. Installed releases remain unchanged.

## Evidence

Rust35 tests pass and host builds; nested fixture depth mutation fails then restored path passes. Node full suite6728 pass/1 watchdog fail/8 skip/65 todo. Watchdog task files unchanged and child diagnostics discarded; no speculative fix or confirmation rerun. Independent review10/10. New Rust formatting clean; baseline workspace drift remains. Full details: plans/reports/observe-rebaseline-261005.md.

## Remaining gate

Plan stays in-progress. Source-text guard excluded by test policy; full npm green not claimed. Phases4–6 remain deferred pending foundation landing and measurement go/no-go. No commit or release.


## Watchdog gate closed

The first early-child-failure inference was withdrawn after capturing real
nested output. A deterministic post-SIGKILL scheduling gap reproduced empty
timeout evidence and a later ENOENT append: the watchdog killed before publishing,
while the parent could already read/remove the journal. Publish-before-kill now
fixes the ordering. Both real-process regressions pass; full authoritative npm
rerun exits 0 (6,730 pass, zero fail, eight skipped, 65 todo). Independent review
approved the correction. Phases 4–6 remain deferred; no commit or release.
