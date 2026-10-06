---
title: "P6 herdr transport, posture and quota fallback wired and merged"
date: 2026-10-02
summary: "Herdr transport, one posture path and quota fallback now drive fgos run; merged to main after a review-driven fix round."
---

# P6 herdr transport, posture and quota fallback wired and merged

## What happened
P6 wired bind().transport, resolvePosture and nextCandidate into the real run path (merge af019e638, fix merge 7e11c2460). Real pane runs on the owner's machine: cases 1, 2, 3 (architecture-advisory on four provider families), 4 (fake limit screen) and 6 (headless) accepted; case 5 (old-engine comparison) NOT RUN.

## Findings
- Confined herdr for codex/pi/agy had been solved before. Refactors (5bbd066cd, e7bd9b418, a9fc61324, cfd670c43) dismantled it and the replacement was only uncalled functions. Plan facts phase asked only about current code. Added "Prior art before design" to AGENTS.md and the local primary-workflow Inspect step, plus a memory note.
- Code review: H1 posture check approved one invocation while a different one ran (headless default broken, case 6 passed only via --override); H2 setup slots without prefer made bind refuse shipped Workflows while doctor stayed green. Both fixed with tests.
- Two fanout tests fail only in the main checkout: a stale installation activation shim (staged 2026-09-29) makes the "real bin/fgos.mjs" tests run an old release.

## Decision
Fixes H1 and H2 immediately; M1-M4 (credential copies surviving failed rounds, brief typed into blocking dialog, trunk hardcoded as main, trust-store downgrading 0600) left open.

## Next steps
- Decide on re-staging the installation shim or adding a binary override seam in src/runner/fanout-batch.mjs.
- M1-M4 and low findings as backlog items.
- Case 5 and real provider-limit screen fallback still unmeasured.
- ~/.fgos/config.json runner.providers entries must be set up per machine.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
