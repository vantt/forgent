---
id: p-3qqsthcmxx
title: "Six tests are red on main since the static ONNX Runtime work: the release-workflow tests forbid `gh release` in ort-static.yml and the run-tests entrypoint fixture lacks scripts/ort-static.mjs (DOCOS lane, priority P2; source: lead:SUPERVISOR, 2026-11-23)"
status: proposed
priority: P2
area: docos
created: 2026-11-23
---

# Why

Evidence: `plans/261123-0726-contract-check-in-confined-heads/reports/npm-test-full.md` (013266e6a). Three release-workflow tests fail because `ort-static.yml` runs `gh release` (4e2a7f032). Three run-tests entrypoint tests fail `ERR_MODULE_NOT_FOUND` because `run-tests.mjs` now imports `scripts/ort-static.mjs`, which the entrypoint fixture does not copy (7c1ae9c09). The DOCOS lane is on design-lap, so the owner relays it.

# Done when

`npm test` is green on main for those six tests, fixed in the workflow and the fixture rather than by weakening the tests.

# Notes

Filed by the secretary after the owner approved on 2026-11-23.
