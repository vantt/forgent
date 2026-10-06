---
title: Fix observe harness protocol counts
date: 2026-10-01
summary: Correct protocols_defined across 3 tiers and protocols_used definitionRef extraction in Observe metrics harness
---

# Fix observe harness protocol counts

Correct protocols_defined across 3 tiers and protocols_used definitionRef extraction in Observe metrics harness

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

## Changes
- Implemented 3-tier protocol loading logic in `packages/observe/rust/src/metrics_cli/harness.rs` (`protocols_defined`), scanning `.fgos/coordination-protocols`, `domains/*/coordination-protocols`, and `core/coordination-protocols` for `.yaml`, `.yml`, `.json` files, deduplicating IDs with project > domain > core priority.
- Corrected session protocol usage extraction in `count_protocols_used` to read `definitionRef.id` from `.fgos/coordination/sessions/*/session.json`, ignoring `null`, missing, or malformed entries without filtering test IDs.
- Added comprehensive integration test in `packages/observe/rust/tests/harness_protocols_test.rs` covering all 3 tiers with duplicate IDs and session variations.
- Added `serde_yaml = "0.9"` dependency to `fgos-observe`.
