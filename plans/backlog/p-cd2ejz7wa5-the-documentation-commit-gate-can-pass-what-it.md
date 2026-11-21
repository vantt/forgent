---
id: p-cd2ejz7wa5
title: The documentation commit gate can pass what it claims to refuse
status: proposed
priority: P2
area: documentation
created: 2026-11-06
---

# Why

`scripts/doc-health.mjs` reads files on disk, not the staged content, so a commit passes on unstaged edits; the pre-commit document block selects files with `--diff-filter=ACR`, so modified and deleted documents are skipped; a host error or timeout in that block warns and lets the commit through; Convention classify runs per path; `doc-provisional-aged` subtracts an ISO string (`src/setup/registrations.mjs:3223`), gets `NaN` and never fires; `docRegistry.topicMaxDocs` is read (line 3235) but not declared in the schema. Found by the DOCOS architecture panel ([outcome](../plans/reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md)); owner 2026-11-06 opened it apart from the identity work ([doc-checks 6.5](platform/documentation/subcomponents/doc-checks/spec.md#65-the-commit-gate)).

# Done when

doc-health checks the staged blob of each path it is given; the hook selects `ACMRD`; a host error in an activated workspace refuses the commit; classify runs once for all staged paths; the aging check parses `updatedAt` and its cutoff is stated as policy; `topicMaxDocs` is in the schema; one proof each in the owning test file, one hook wiring proof

# Notes

Migrated from the legacy backlog table. Original status: proposed.
