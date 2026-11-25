---
id: p-cgf7ssy6ua
title: "The git-probe tests of `fgos-distribution` are red inside the confined sandbox and have no owning plan (tests, priority high; source: closing note of plan 261121-2110-component-authority-doors)"
status: proposed
priority: P1
area: tests
created: 2026-11-24
---

# Why

The doors plan's lead found the `fgos-distribution` git-probe tests red on an unchanged base when run from a confined seat, and left them open outside the plan. It is not proven whether they are red on a clean unconfined checkout; the triage report `plans/reports/triage-261124-0200-main-red-triage.md` does not list them.

# Done when

The cause is proven (sandbox only, or real) and either the tests are green wherever they must run, or the row records that they only need an unconfined run.

# Notes

