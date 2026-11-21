---
id: p-xh3zdvzyip
title: "Two installer P7 Node tests fail on native Windows CI (packaging-distribution, priority high; source: lead:S6A CI run 44640908347, 2026-11-20)"
status: done
priority: P1
area: packaging-distribution
created: 2026-11-20
---

# Why

In release-assets-check's `focused tests (windows-latest)` job, step "Node tests for installers and release packaging", two tests fail with AssertionError: "P7: Upgrade candidate local tail failure leaves workspace in diagnosable state with ready-degraded transaction" and "P7: Repair local tail failure leaves workspace in diagnosable state with ready-degraded transaction". They were hidden until 9ae25e82e because the job used to fail earlier compiling the fgos-identity tests (std::os::unix in tests/directory.rs), and main's recent runs cancelled that job. Keeps native Windows CI red. Done 2026-11-21 (plan 261121-1456, closed 27f530a3f): 16f014918 makes the fixture write an invalid machine-id that `fgos init` refuses on every platform; windows-latest green in CI 44886931215.

# Done when

Both P7 tests pass on windows-latest with the cause fixed in the installer code or the test fixture (no skip, no platform branch that hides the check); the job is green on main.

# Notes

Migrated from the legacy backlog table. Original status: done.
