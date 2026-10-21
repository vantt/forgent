---
title: "Convention second wave: more artifact families under one source"
description: "Extend the existing fgOS convention component so the repo-root allowlist, scratch location, skill render targets and layout, contracts naming, domain AGENTS.md, decision records, plan phases and knowledge entries are governed by convention.rules.v1.json with the existing rule shapes only."
status: draft
priority: P3
created: 2026-10-21
blockedBy: [260925-documentation-authority-unification (Phase 9 cutover)]
---

# Convention second wave

> **Draft — investigate again (prior art, current main pins, board collisions) before authorizing any phase.**

## Goal

One door for naming and placement: every artifact family below is described by a rule in
[packages/convention/contracts/convention.rules.v1.json](../../packages/convention/contracts/convention.rules.v1.json)
and enforced only through `convention check` (pre-commit, doctor, `--all`).
Spec: [docs/platform/convention/spec.md](../../docs/platform/convention/spec.md).
Prior plan: [archive/plans/261006-1415-fgos-convention-component/plan.md](../../archive/plans/261006-1415-fgos-convention-component/plan.md).

## Constraints (RUL104 better-not-bigger, design principle 1 one-door)

- Existing rule shapes only: `name-template`, `placement-glob` (with cardinality), flags
  `canonical` / `generated` / `metadataExempt` / `requiredMetadataFields`, posture `warn|block`
  with per-rule `cutoff`. No new mechanism, no second checker.
- Body/content checks (frontmatter, links, anchors) belong to doc-health, not convention.
- Id allocation stays deferred.
- Out of scope: docs/platform/** placement and blocking retired roots docs/specs/**, docs/architect/**
  (doc plan 260925 Phase 9 cutover, owner decision L12-89). This plan builds on it.

## Ordering

1. Runs AFTER doc plan 260925 Phase 9 cutover (some families touch files the cutover rewrites).
2. AGENTS.md / CLAUDE.md wording coordinated with board row RULE
   ([program board](../261017-1313-fgos-platform-program-board/plan.md)).
3. Rollout per family: `warn` with cutoff first; flip to `block` only after
   `convention check --all` is clean for that family (Phase 06).
4. Every new rule gets golden contract tests in the convention crate's owning test file.
5. Doctor and pre-commit registration only through existing owners
   (`src/setup/checks.mjs`, `.githooks/pre-commit` → `convention-client.mjs`).
6. CHANGELOG `## [Unreleased]` line when a family's behaviour becomes user-visible.

## Evidence (measured 2026-10-21 on main ea5ebb043, re-verify in Phase 00)

| # | Family | Evidence | Priority |
|---|---|---|---|
| 1 | Repo-root allowlist + scratch | `ROOT_FILE_ALLOWLIST` hardcoded in `.githooks/pre-commit` (line ~39), separate from convention; scratch `.fgos/runtime/tmp/` only in prose + hook message | high |
| 2 | Skill render targets | `.agents/skills/**`, `plugins/fgOS/skills/**` hand-edited then overwritten by `npm run build:skills` | high |
| 3 | Skill layout | `core/skills/<name>/SKILL.md` singleton, `references/`, `scripts/`, `_shared/` | medium |
| 4 | Contracts naming | 175 tracked files under `contracts/` dirs; mixed `*.v1.json`, `*.v1.schema.json`, unversioned `command-routes.json`, `domain-entry-steps.json`, `.md` contracts, one `.yaml` | medium |
| 5 | Decision records | Lead reports `h-<hash>.md` + `ADR-0NN-*.md`; on main only 11 `ADR-*` + 2 README tracked under docs/platform/*/decisions — `h-*` likely arrives with the 260925 cutover. **Owner decision** | medium |
| 6 | Domain doctrine | `domains/{coding,marketing}/AGENTS.md` singleton | low |
| 7 | Plans | extend `plan` kind to `phase-NN-<slug>.md` and `reports/` | low |
| 8 | Knowledge | `docs/knowledge/<slug>/<file>.md` | low |

Current rules on main: `report`, `plan`, `journal` (name-template, warn, cutoff 3faf81996),
`fixture-singleton`, `fixture-collection` (placement-glob, warn).

## Phases

| Phase | Title | Depends on | Status |
|---|---|---|---|
| [00](phase-00-reinvestigate-and-pin.md) | Re-investigate and pin | 260925 Phase 9 | draft |
| [01](phase-01-root-allowlist-and-scratch.md) | Root allowlist + scratch into convention | 00 | draft |
| [02](phase-02-render-targets-and-skill-layout.md) | Generated render targets + skill layout | 00 | draft |
| [03](phase-03-contracts-naming.md) | Contracts naming | 00 | draft |
| [04](phase-04-domains-and-decisions.md) | Domains + decision scheme | 00, owner OQ-1 | draft |
| [05](phase-05-plan-and-knowledge-families.md) | Optional plan/knowledge families | 00 | draft |
| [06](phase-06-flip-to-block.md) | Flip postures to block where clean | 01-05 | draft |

Phases 01-05 touch the same rules file; run them sequentially (or serialize commits to
`convention.rules.v1.json` and its golden tests).

## Acceptance criteria

- Every family above has a rule in `convention.rules.v1.json` and golden tests; none outside it.
- `.githooks/pre-commit` holds no naming/placement list of its own; it only calls `convention check`.
- `convention check --all` clean for each family before its posture flips to `block`.
- `npm test` and `cargo test --workspace` green; doctor reports through its existing check.

## Open questions

- **OQ-1 (owner): one decision-record scheme.** Options: (a) `ADR-0NN-<slug>.md` — readable,
  needs id allocation (deferred) or manual numbering; (b) `h-<hash>.md` — collision-free, no
  allocator, unreadable names; (c) both accepted for history, new files one scheme with cutoff.
  Recommendation to verify in Phase 00: (c) with (b) for new files if the doc-health/decision-index
  tooling keys on hash ids — otherwise (a).
- **OQ-2:** does root-allowlist "land separately on main first" still need a git-history check
  once the list lives in the rules file (rules-file change + root addition in one commit)?
- **OQ-3:** are non-JSON contracts (`.md`, `.yaml`) in scope of the versioned naming rule, or
  placement-only?
