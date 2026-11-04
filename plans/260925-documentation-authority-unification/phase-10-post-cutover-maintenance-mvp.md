---
phase: 10
title: "Post-cutover maintenance MVP"
status: in-progress
priority: P1
effort: "1.5d"
dependencies: [9]
---

# Phase 10: Post-cutover maintenance MVP

## Overview

**Status:** `in-progress`. The owner authorized the phase on 2026-11-04. Phase 9 landed on main at `97dd62aa7`.

**Purpose:** stop documentation drifting again, using the smallest maintenance surface that does the job.

**Facts and plan:** [scout-261104-1016-doc-maintenance-facts.md](../reports/scout-261104-1016-doc-maintenance-facts.md). That report lists the existing owner of each check, the gaps G1–G3 with their evidence, and the full step table.

## Decisions (Lead, 2026-11-04, under the owner's "làm … 2B")

1. **No new `fgos doc` verbs (Q3).** Two existing doors own the work: `fgos convention` owns path and kind, and doc-health owns the body. The reasons for each cut verb are in the report, section "Cut". This narrows the surface list in the original phase text: L10 forbids adding a door beside an existing one, and RUL104 asks for "better, not bigger".
2. **The dead-reference rule is in scope (Q2).** Every backticked repo-root path in a canonical doc must exist at HEAD, unless the same line pins a commit sha. Two kinds of file are exempt:
   - decision records and history files, because they record past state;
   - files that convention classifies as `history`, `decision` or `verification` (dated evidence), or as `metadataExempt`.

   The sweep also fixes the 9 code comments that still cite retired doc roots.
3. **The documentation-cutover lease is retired as its own item after Phase 10 (Q4).** Its only job was protecting the cutover. The request to HARDEN to extend it into `fgos workflow gate` is withdrawn.
4. **Activating a release that has the Phase 9 guards (Q1, G1)** belongs to the landing lane, and the owner gives the go. It is not a Phase 10 step.
5. **Plan files stay put.** `plan.md` stays where it is, because the sealed history README links to it. `scripts/generate-shipped-path-inventory.mjs` is retired with the other migration tools: on main its only use was the census JSON listing it as a Git writer, no test or script outside the migration tools called it, and no CONV2 plan cites it. This amends the earlier decision to keep it "because the census suite uses it".

## Steps

| Step | Work | Owning proof |
|---|---|---|
| 10.1 | `convention classify` returns the reserved flags `canonical`, `metadataExempt` and `generated` as additive fields | the classify golden case |
| 10.2 | Move the doc-health link check to `scripts/doc-health.mjs`; delete the switchboard mode; add the metadata rule, which requires the governance §5 header unless the doc is `metadataExempt` | `test/scripts/doc-health.test.mjs` |
| 10.3 | Fix the 22 docs that lack the required header, using real values | the 10.2 live case |
| 10.4 | Add the dead-reference rule and sweep the 166 references plus the 9 code comments | one synthetic case in `doc-health.test.mjs` |
| 10.5 | Retire the plan-era scripts and their tests, and remove their census entries | removal; the commit names the new owner of each behaviour |
| 10.6 | Add an intent-ledger row that hands off to DOCOS | doc |

**Done means:** `npm test` and `cargo test --workspace` are green apart from tests that fail the same way on main, and the doc-health live case passes on `docs/platform/**`.
