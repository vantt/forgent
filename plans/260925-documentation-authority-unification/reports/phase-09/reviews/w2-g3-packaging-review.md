# w2-g3-packaging review: D1 f534aeaea (G3 dropped claims and packaging re-sync)

Review commit: cffe725b9 (read-only worktree /home/vantt/projects/forgentX-s8-review). Verdicts: 27 APPROVE, 5 REWORK. Machine verdicts are in `w2-g3-packaging-review.json`.

## Method

- Unit digests come from `scripts/generate-doc-inventory.mjs` `extractMarkdownConservationUnits` (`textDigest`) at cffe725b9.
- Binding hashes are recomputed with the declared recipe: sha256 of the 4 keys as sorted compact JSON plus LF.
- Each candidate unit is compared with the current legacy unit.
- Code truth comes from the registerCheck/registerFix ids extracted from `src/`.
- There were 32 items or fewer, so every item was checked. Mechanical bindings were checked in full, with no sampling.

## Approved

- **G3, dropped-001:** restored verbatim, with the status cell honestly requalified as "selected design, unimplemented". The code has no `activationKind`.
- **G3, 002-017:** the earlier reviewed restores and the 010 supersession are kept. The targets are unchanged and the rationales are sound. No genuine tie exists.
- **G0 rows:** 9d97a24e, c87924f5, 9881ddf7, 249083ed, 891db485 and 83a4a913 are resolved. Each target equals current legacy or code truth (Windows LockFileEx; no lock-fences or predecessorKillWaitMs).
- **Newer legacy content:** carried. All 27 `docs/specs/distribution.md` units are present verbatim, including the npm `git-addon-unavailable` refusal (it matches `src/native/door.mjs`), row 5h, the identity-* checks, rows 7c/7d, `executor-skills-installed`, `tier-fallback` and RUL107.
- **Mechanics:** all recompute.
  - s11: 1087/1087 bindings match.
  - The 9 touched shards: 122/122 match.
  - The register: 17/17 match.
  - unitCarries covers 466/466 units of the 7 changed packaging files.

## Rework

1. **release-manifest.md:316-453.** The new "Canonical Release Tree Rules" is a 135-line verbatim duplicate of the same file's retained §5 (180-315); 13 units have identical digests. Line 393 adds a broken link, `../host-invocation-routing/legacy-cli-transition.md`. Fix: move or relabel the retained section, do not copy it.
2. **spec.md:579-580, Data Dictionary rows 7/7b.** Row 7 says it names every registered check, but:
   - It still lists `model-policy-tier-coverage`, which was removed at 720891630 and is registered nowhere in `src`.
   - It omits 8 registered checks: `documentation-cutover-lease`, `git-land-recovery`, `git-mutation-one-door`, `identity-ids-unique`, `seat-binding-config`, `seat-binding-route`, `workflow-case-binding-sentinel` and `workflow-case-bindings`.
   - Row 7b omits 5 fixes: `git-driver-directories`, `git-land-recovery`, `git-publication-refspecs`, `git-wal-dir` and `workflow-case-bindings`.

   This contradicts `setup-doctor-registry.md`, which lists them. Legacy `distribution.md` has the same drift.
3. **activation-binding.md:482-570.** The init pipeline and walking-skeleton text duplicates 6 units of `architecture/runtime-identity-and-activation.md:267-342`. Keep one holder.
4. **spec.md:211-243.** "Legacy Setup Scenario" duplicates `setup-doctor-registry.md#unheaded-block-30`. No claim or pointer binds it, and it is unexplained.
5. **receipt.md, Binding Recipe (low).** It says the phase-08 register has no `bindingHashEncoding`. The register has 10 occurrences at the pin.

## Observations (not verdicts)

- **Topology links are mixed across the area.** Some point to `../../architect/workspace-topology.md`, others to the `system-architecture` copy. Settle this before docs/architect retires.
- **Stale gate-artifact digests.** `step-08-preflip-gates.json` has 114 and `review-batches.json` has 57. G9 must show that each one has a successor row.
- **"Two lock directories" text** omits `<stateRoot>/terminal` (inherited from legacy).
- **Out of scope:** a broken link was added at `work-state/decisions/retired-decision-history.md:30`.
- **g0-b1-review.json** is absent from `reviews/`; the b1 rows were taken from `w1-review-notes.md`.

Status: DONE_WITH_CONCERNS
