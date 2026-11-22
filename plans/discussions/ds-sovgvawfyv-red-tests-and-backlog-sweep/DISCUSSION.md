---
id: ds-sovgvawfyv
title: "Red tests on main and the docs/backlog.md to plans/backlog.md sweep"
status: settled
source:
  - p-vnsigyw6h7
created: 2026-11-22
---

discussion: settled

## Hand-off to the planner

Seeded by head:supervisor-forgent from backlog row `p-vnsigyw6h7` on the secretary's order (coordination event `f1dfb666f976e854`, 2026-11-22). The topic needs no shaping round: the row's "Why", "Done when" and triage notes are the whole content, and the secretary set the rules below.

- **Outcome:** `npm test` and `cargo test --workspace` on main carry no red caused by landed code, so a lead's gate shows only its own reds. Every red the row traces to a landed commit asserts the behaviour that landed; the `docs/backlog.md` and `docs/discussions` references left on main by the portfolio move point at `plans/backlog.md` and `plans/discussions`.
- **Constraints (secretary, 2026-11-22):** one lane; priority P1, ordered below plan `261122-0118-heads-stable-and-able`; footprint disjoint from that plan's footprint. No assertion is weakened (design principle 8); a test whose behaviour moved names its new owner. Redo the backlog-path sweep on the current tip; do not copy the patch in the abandoned worktree `261120-0625-work-data-model-p05k`. `policy.v1.json` is golden-guarded: regenerate it with its recorder, never by hand.
- **Non-goals:** the execution door seam reds (`test/runner/dispatch-reconciliation-import-graph.test.mjs:251,279`), which plan S6a owns; the reds the row marks "likely environmental, unproven" beyond proving or disproving them, unless a proof shows a code cause.
- **Acceptance criteria:** each red listed in `plans/backlog/p-vnsigyw6h7-two-tests-are-red-on-main-head-start-probe.md` (head-start probe, guide-schema count with bugfix playbook, subcommand-flag drift `migrate`, confinement `docs/discussions`, convention-conformance `plans/backlog/*`, tab-label separator in two tests, config scrub needle, `secretary.schema.yaml` in `SCHEMAS`) is green with the landed behaviour asserted; `rg 'docs/backlog\.md|docs/discussions'` on main finds only historical records (plans, reports, decision history); the environmental four are each proven environmental or fixed; `npm test` and `cargo test --workspace` green except S6a's seam reds.
- **Open points:** none blocking.
- **Source ids:** `p-vnsigyw6h7`.
