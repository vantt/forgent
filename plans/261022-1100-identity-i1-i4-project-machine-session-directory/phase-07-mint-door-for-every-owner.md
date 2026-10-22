---
phase: 7
title: "Mint door for every owner"
status: pending
priority: P1
effort: "1d"
dependencies: [1]
---

# Phase 07: Mint door for every owner

## Goal
Every id that travels between machines comes from one door in Identity (spec section 4a), so two machines never mint the same work item, decision number, `D-ADR` or backlog id.

## Inventory (2026-10-22)

| Id | Minted today | Collides across machines | This phase |
|---|---|---|---|
| Work item `tsk-…` | `src/intake/classify.mjs:124` `generateId`: sha256 of the title, 3-8 base36 characters, checked only against local ids | yes: same title gives the same id; 3 characters are about 46k values | rule 1: `tsk-<10 base32>`; existing ids unchanged; `ID_PATTERN` (`src/state/work.mjs:27`) already accepts the new form |
| Decision file number `0021` | `src/runner/merge.mjs:537` `nextFreeDecisionId`, highest on the merged refs plus one, renumbered at merge | yes for files written outside the runner merge | rule 3: counter ref `refs/fgos/seq/decision-file`; the merge renumbering path is deleted (L10) |
| `D-ADR####` | by hand: an agent reads the highest number | yes | rule 3: counter ref `refs/fgos/seq/d-adr`; agents claim through `fgos identity mint d-adr` |
| Backlog row `p-xxxxxxxx` | by hand, 8 random hex | unlikely, unchecked | rule 1 through `fgos identity mint backlog` |
| Project id | phase 03 | — | rule 1 (already) |
| Unit run, workflow run, claim, reservation, operation ids | each module: milliseconds plus 32-128 random bits, machine-local records | no | not changed (RUL104) |

## Design
- Library: `fgos_identity::mint::{random(kind), claim_sequence(kind, repo)}`. `random` reads the prefix and length of the kind from Convention (identifier kinds `work-item-id`, `backlog-id`, `project-id`). `claim_sequence` implements the counter-ref claim of section 4a through the Git component (a new mutation in `packages/git/contracts/mutation-census.v1.json`), retrying a refused lease up to 5 times, and returns the number; `release_sequence(kind, repo, number)` pushes the ref back when the commit that used the number failed and nobody claimed after.
- Verb: `fgos identity mint <kind> [--json]` (operation `identity.write`), the door for agents and skills that write ids by hand (`D-ADR`, backlog rows).
- Node callers move in the same change: `generateId` calls the door through the addon after HARDEN T1 phase 6 exposes the identity addon module, or through the verb until then (decided at the start of this phase from the board); `nextFreeDecisionId` and `renumberDecisionText` are deleted and the land path claims the number before the commit.
- Safety net: doctor check `identity-ids-unique` scans the tracked id registries (`docs/backlog.md`, work-item records, `docs/decisions/`, `D-ADR` headings in `docs/specs/*.md` and `docs/platform-foundations.md`) and fails on a duplicate.
- Docs: the how-to for writing a decision and for adding a backlog row says to run `fgos identity mint`; `core/skills/_shared/` fragments that tell agents to "read the highest number and add one" change in the same commit and the skills are rebuilt (`npm run build:skills`).

## Questions for the owner at the start of this phase (decision-question template)
- The Work item id length change (`tsk-<10>` instead of 3-8 characters): ids become longer to type. The format rule is unchanged, so this is a frame check, not a contract change.
- Where agents learn to call `fgos identity mint`: `core/instructions/` (always loaded) or only the skills that write decisions and backlog rows.

## Files
- Create: `packages/identity/rust/src/mint.rs`, `tests/mint.rs`, `test/identity/mint-door.test.mjs` (wiring only).
- Modify: `packages/identity/rust/{src/lib.rs,src/provider.rs,Cargo.toml}`, `packages/git/contracts/mutation-census.v1.json`, `packages/convention/contracts/convention.{rules,golden}.v1.json`, `src/intake/classify.mjs`, `src/runner/merge.mjs`, their tests (`test/intake/*`, `test/runner/merge*.test.mjs`), `src/setup/identity-checks.mjs`, `src/setup/registrations.mjs`, `test/setup/checks.test.mjs`, `core/skills/_shared/*` (decision and backlog fragments), `docs/platform/identity/spec.md`, `CHANGELOG.md`.

## Verification
- `cargo test -p fgos-identity` (random ids have the declared length and alphabet; claim on a local bare remote: two concurrent claims get distinct numbers, a stale lease is refused, release pushes back only when nobody claimed after).
- On a real remote, two temp repos race `fgos identity mint d-adr` against a probe kind and get two consecutive numbers; the probe ref is deleted after (method of `plans/reports/research-261022-1217-identity-sequence-counter-ref-github-probe.md`).
- `npm run fgos:dev -- doctor </dev/null` passes `identity-ids-unique` on this repository.
- `rg -n 'nextFreeDecisionId|renumberDecisionText' src test` finds nothing.

## Risk and rollback
- A claim needs the network; offline writers wait and retry (owner rule: the format never changes to work around it). Rollback: revert; the counter refs stay on the remote as two tiny refs and are harmless.
