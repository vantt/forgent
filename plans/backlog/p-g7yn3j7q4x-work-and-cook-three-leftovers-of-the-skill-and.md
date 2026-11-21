---
id: p-g7yn3j7q4x
title: "WORK and COOK: three leftovers of the skill and domain audit sit in their files"
status: proposed
priority: P2
area: domainization
created: 2026-11-21
---

# Why

(1) `workerContract` / `workerContractFor` (`src/state/domain-registry.mjs`, field in `domains/coding/registry.yaml`) has only a test caller (`test/state/handoff.test.mjs`): test-only, not dead. (2) `src/runner/work-compat.mjs:159-160` can build `skillPath` as `.claude/skills/null/SKILL.md`. (3) done: the worker contract is now `core/skills/_shared/cook-worker-contract.md` with a kit-neutral text (owner decision 79 forbids a vendor kit name in a core file the provisioning reads); the cook skill id in the shipped runner config follows in a separate change. HARDEN changed none of (1) and (2).

# Done when

Each owner decides: keep (1) as a test seam or drop it; guard (2) against a null skill name; rename (3) with its callers, or record why the executor id requires it.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
