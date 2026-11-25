# Phase 8: Delete the dead source; close the manifest rows; regenerate the census

Capability: `code:implement`.

## Inputs

- `plans/261122-2108-delete-dead-node-execution-closure/reports/closure.md`: the dead table and the live-kept table.
- Phases 2 to 7 are merged. Their reports show that no test imports a dead file.
- `packages/component-authority/model/` rows that name `p-24xw2cwdvo` (about 20 places), and `test/architecture.test.mjs`
  (5 places).
- `packages/holder-lock/contracts/lock-registry.v1.json` (its `note` fields name `src/runner/dispatch/*` and
  `src/run-supervisor/trust-store.mjs`) and `packages/run-supervisor/contracts/recover-actions.v1.json` (its
  description names `recovery-planner.mjs`).

## Footprint

`src/runner/dispatch/**`, `src/runner/execution/**`, `src/run-supervisor/**`, `packages/component-authority/model/`,
`test/architecture.test.mjs`, `packages/git/contracts/mutation-census.v1.json`,
`packages/holder-lock/contracts/lock-registry.v1.json`, `packages/run-supervisor/contracts/recover-actions.v1.json`,
`scripts/check-decision-citation-drift.baseline.json` (only if it names a deleted file). Also the 38 platform docs the doc-health self-check flags once the files are gone (the list is the phase 8 row of `plan.md`), for link-syntax edits only.

## Steps

1. Rebase onto current `main`. Rerun phase 1's graph method and confirm the dead set has not changed. If it grew
   or shrank, record the difference in the report and delete only what is dead now.
2. `git rm` every file in the dead table.
3. Architecture manifest: remove each entry that names a deleted path. In each row whose `retiredBy` names
   `p-24xw2cwdvo`, delete that clause. A row with no entries left is removed, together with its seeded cases in
   `test/architecture.test.mjs`. A row that keeps live entries names their owner (S6b, S7, or "the mailbox lane
   re-measures its frozen experiment sets" for the files the mailbox harness reaches, per `plan.md` Decisions).
4. Contract notes: rewrite the `note` and `description` fields that point a reader at a deleted file. Name the
   Rust owner, or say "v1 source (retired Node module <name>)" where the note records history. Do not change any key
   or value that a test reads.
5. Regenerate the census with `node scripts/git-one-door-scan.mjs --write-census`. If the decision-citation baseline
   names a deleted file, regenerate it with the script that owns it (`rg -n baseline scripts/check-decision-citation-drift.mjs`).
6. Confirm nothing dangles: `git grep -nE '<deleted paths>' -- src bin scripts domains test packages apps core`
   returns no import, and only the history surfaces listed in `plan.md` Non-goals and phase 9's still-pending docs
   name them.

7. Docs that name a deleted file (owner answer to q-5roz2uy3sa, 2026-11-25, option "link-only fix inside phase 8").
   `node scripts/doc-health.mjs --json --repo-root .` must report no finding. Change link syntax only, never prose:
   a Markdown link to a deleted file becomes the backticked path; every line that still backticks a deleted path
   gets the provenance pin `` (retired; last at `85760c6f2`) `` (the main commit just before the deletion; doc-health
   exempts a line that pins a real commit); a `Related:` header entry that names a deleted file is dropped, or
   pointed at its Rust owner. No prose rewrite of history docs, and no doc-health rule change. Phase 9 keeps the
   prose rewrites of its own docs.

## Verify

`node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs` passes. Then `npm test` passes,
run alone. Pass condition: both green, and step 6's grep finds no import.

## Rollback

`git revert` the phase commit. It restores the files, the manifest rows and the census together.
