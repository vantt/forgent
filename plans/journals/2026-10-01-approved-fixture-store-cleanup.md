---
title: Approved fixture-store cleanup
date: 2026-10-01
summary: Merged the Observe doctor-check expectation and deleted the approved fixture-store candidates.
---

# Approved fixture-store cleanup

## What happened

The owner approved both the stale Observe doctor-check expectation correction and destructive fixture cleanup. The exact manifest was revalidated immediately before deletion.

## Changes and verification

Added the three registered Observe doctor checks to test/setup/checks.test.mjs. Its focused test passed 122/122 and the change was merged to main.

The full npm test run completed but failed. The full-run output contained no `run-tests: ERROR` leak report, but its unrelatedness has not been baselined against a clean base; these failures remain unresolved. The fixture-specific focused suites remain green.

## Cleanup result

Deleted 295 revalidated fixture session directories and 124 revalidated fixture dispatch runs. No candidates were skipped. fgos doctor passed coordination-abandoned-claims but still reports 223 old active sessions and other unresolved repository health failures.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
