---
id: p-ibbgkehpsx
title: "Shared build cache for the release check checkout: a cold check checkout builds everything and nears the step timeout (release, priority P2; source: lead of plan 261127-1224, 2026-11-27)"
status: proposed
priority: P2
area: release
created: 2026-11-27
---

# Why

Since plan 261127-1224, release checks run in a fresh `release-check-<id>` checkout of the released tip. On 2026-11-27, `npm test` alone in such a cold checkout (it also builds and runs the 5054 Rust tests) took 1435 s, about 80% of the 30-minute `RELEASE_STEP_TIMEOUT`, above the plan's 20-minute threshold. Cargo time was not measured because npm failed first. Source: `plans/261127-1224-release-checks-clean-tip/reports/integration.md`, section "Follow-up filed".

# Done when

The release check checkout reuses a `CARGO_TARGET_DIR` and npm cache across release runs, so a cold build no longer pushes a recipe step toward its timeout, with the measured step time recorded.
