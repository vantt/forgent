---
id: p-t55xjys4u5
title: "The runner's commit is refused by the mutation-census pre-commit hook whenever a seat touches a census-listed file (runner, priority high; source: `plans/261117-1430-portfolio-driving-draft/reports/trial-261117-1705-solo-driving-trial.md`)"
status: done
priority: P1
area: runner
created: 2026-11-17
---

# Why

In the solo-driving trial on 2026-11-17, six solo seats that edited census-listed files passed their round and then settled `execution-failure` with `commit-failed:git-error` (`unit-run-1794904273212-013118c5`, `unit-run-1794904275796-ff112d54`, `unit-run-1794904280295-5f4120e7`, `unit-run-1794907081687-b9e9fdf2`, `unit-run-1794907081715-c069ba2c`, `unit-run-1794907460066-db777a91`); HARDEN regenerated `packages/git/contracts/mutation-census.v1.json` and committed by hand each time (6 of 14 trial interventions). The census is a generated file, so the runner can regenerate it on the round's tree before committing. The run record names the git error but not the census cause. Requested by the reviewer.

# Done when

Before committing a passing round the runner regenerates the census when a staged path is census-listed and stages it with the declared writes; a seat that edits a census-listed file lands its commit with no hand step; a census that cannot be regenerated settles with a reason naming the census, not `git-error`.

# Notes

Migrated from the legacy backlog table. Original status: done (main bdc9e4251: the pre-commit census refusal applies only to commits in the main checkout or with the trunk checked out, and `fgos land` regenerates and gates the census; proven by `test/githooks/census-drift.test.mjs`).
