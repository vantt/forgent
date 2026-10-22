---
title: OPC containment council and Phase A plan
date: 2026-10-22
summary: "Measured containment cost was half the design's figure; owner chose five fixes inside today's shape and deferred the anchor"
---

# OPC containment council and Phase A plan

## What happened
The preliminary design put Land's containment cost at 0.5 s, from 65 contained children. Re-measured on main (d6afdc7e6), Land has 54 contained children, every one an Inspect read, which together cost about 0.20 s. Per contained child, bwrap adds 2.3 ms over a plain spawn and the 2 ms try_wait poll in the Git driver adds another 1.4 ms. A throwaway pid-1 anchor costs 0.13 ms per child and 2-3 ms to open. It hung once on an inherited socket peer, the descriptor-lifetime hazard the red-team seat had predicted.

Red-team argued that reads need no pid namespace, since preflight refuses repository filters. Correctness verified that a superproject `status` still runs a submodule's clean filter. Reads therefore keep kernel containment.

## Decision
The owner chose Phase A: five fixes inside today's shape, with no new mechanism.
- Remove the poll.
- Bound the wait after a refused kill_all, which can hang today.
- Name `containment-mount-refused`.
- Add the escapee watch on linux-pgroup.
- Merge the driver tests into one conformance suite.

The anchor (Phase B) is deferred until a measured trigger. HARDEN T2 reviews the Git diffs.

## Next steps
The owner approves plans/261022-1335-opc-phase-a-containment-fixes/plan.md. Phase 00 then measures suite wall time and the contained-git census as the baseline.

## Lesson
Re-measure before designing on a gate number. Two older figures disagreed by 5x, and the design adopted the larger one.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
