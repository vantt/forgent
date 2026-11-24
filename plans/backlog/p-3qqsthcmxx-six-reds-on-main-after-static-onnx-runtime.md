---
id: p-3qqsthcmxx
title: "Six tests are red on main since the static ONNX Runtime work: the release-workflow tests forbid `gh release` in ort-static.yml and the run-tests entrypoint fixture lacks scripts/ort-static.mjs (DOCOS lane, priority P2; source: lead:SUPERVISOR, 2026-11-23)"
status: done
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

Closed 2026-11-24 by the DOCOS lead: 89168f109 (2026-11-23) made `ort-static.yml` publish nothing and copied `scripts/ort-static.mjs` into the run-tests entrypoint fixture. In the full `npm test` on main 49f0f47dc (2026-11-24, design-lap) `test/scripts/release-packaging.test.mjs`, `test/scripts/ort-static.test.mjs` and `test/scripts/run-tests.test.mjs` have no failing case.
