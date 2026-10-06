# Identity carry-forward onto branch head, 2026-10-06

Old registry `reports/phase-02-identity-registry.json` (commit `f0c76c5e5`) carried onto `3b409a373`. Impact analysis: inactive (0 providers); callers found by grep are only the generator CLI, the gates checker and `test/scripts/generate-doc-inventory.test.mjs`.

## What changed in code (uncommitted)

- `scripts/generate-doc-inventory.mjs`: `carryForwardIdentityRegistryRepoWide`. CLI `--carry-forward-identity-registry` without `--source-path` runs it; with `--source-path` the existing single-path function runs unchanged. Both share `matchPreviousUnit` (fingerprint, then digest, consumed once); `bootstrapIdentityRegistry` and the single-path carry now share `freshUnitRow` / `carriedUnitRow`.
- `scripts/check-doc-inventory-gates.mjs`: `validateDroppedClaims` (fatal), `validateRetiredDispositions` (open rows, not fatal), flag `--dropped-claims-register` (default `plans/260925-documentation-authority-unification/dropped-claims-register.json`; a missing file is a load error like the other inputs).
- Tests: 13 new in `test/scripts/generate-doc-inventory.test.mjs`. Red before the code: 82 tests, 69 pass, 13 fail. Green after: 82 pass, 0 fail. `node scripts/check-legacy-docs-ratchet.mjs` exit 0.

## Rules as implemented

Order per run: (1) same path, same fingerprint or digest, unique: kept. (2) different path, digest unique among unmatched units on both sides: moved (`movedFrom`). (3) same file, heading anchor stable, one old and one new: edited-kept, `reviewStatus: needs-review`, `lineage` (old/new unit digest and source-unit digest). (4) rest of the old side: gap row if ambiguous or positional/unstable-anchor edit (reason recorded), else retired row (`status: removed-pending-disposition`, `priorStatus`, `retiredAtCommit`). Rest of the new side: fresh random id, `origin: added-since-<old commit>`.

Anchor model check: heading anchors are the GitHub slug of the title (stable across body edits); unheaded and file-block anchors are positional (`unheaded-block-N`, `file-block`). This matches rule A2, so no stop. One addition: a heading anchor counts as stable only when no other heading in the file has a `-N` suffix relation to it (duplicate titles shift `-1`, `-2` on insertion). 4 headings fell out for that reason (`hệ-quả-9`, `hệ-quả-10`, `quyết-định-6`, `quyết-định-14`).

Registry output keeps `units` as the live set; `identityGaps`, `retiredUnits`, `retiredDocuments` are separate arrays (so `validateIdentityRegistry` and the generator's id index never see them). Prior retired/gap rows in an input registry are carried forward unchanged.

## Run numbers

Method: `/usr/bin/time -v`; counts from `scratch/prove-arithmetic.mjs` (distinct claim ids), not from grep.

| Step | Exit | Wall | Max RSS |
|---|---|---|---|
| carry-forward | 0 | 2.7 s | 0.80 GB |
| inventory on HEAD | 0 | 19.1 s | 1.92 GB |
| gates | 0 | 12.3 s | 1.18 GB |

| Old units 85,772 | Count |
|---|---|
| kept (same path) | 85,175 |
| moved | 0 |
| edited-kept | 121 |
| preserved (sum) | 85,296 |
| identity gaps | 433 |
| retired (removed pending disposition) | 43 |
| added (fresh ids) | 789 |

Arithmetic, proven by script: 85,296 + 433 + 43 = 85,772 = old total; partition ids distinct, every old id appears exactly once, no foreign ids; the 789 new ids are distinct, none collides with an old id, all carry `origin`. New units 86,085 = 85,296 + 789. Documents 4,311 (6 added, 0 retired, 0 inherited by rename).

Gaps 433 = 306 ambiguous duplicates (292 unheaded, 14 heading; same digest repeated in one file, left unmatched on purpose) + 127 edited positional units (1 file-block). 127 + 121 edited-kept = 248 edited, 43 retired = 43 removed: both equal the resync's `claimDiff`. The resync's 85,481 "unchanged" = 85,175 + 306 (it multiset-matched duplicates).

Inventory on HEAD: 4,311 files, 86,085 claim rows (unchanged from the 86,085 at the 2026-10-06 sync; the 8 main commits added no claim units). Identity status in the ledger: 85,779 carried-forward, 306 ambiguous-registry-gap. Consumer edges 106,558 (105,923 at the previous run; plan files grew).

Gates on the new inventory (`--json`): exit 0, clean, 0 fatal; 1,361 gaps (1,055 file/routing + 306 claim-identity), 1,689 unknown-blocking rows, 818 duplicate-content groups, 151 semantic-conflict groups, 433 registry identity-gap rows, 43 retired rows without disposition (reportable). Dropped claims: `dropped-001` / `claim_efd5afeb35b4352c0229ea2f7be2356b` is in the ledger and in the registry live units; entry has status, restorationOwner, gate.

## Conservation checks added

- Fatal `dropped-claim-absent-from-ledger`: `phase3Ledger.claimId` missing from the entry, or in neither the claim ledger nor registry units/retired/gap rows. Fatal `dropped-claim-incomplete-entry`: empty `status`, `restorationOwner` or `gate`. A retired or gap row satisfies conservation (the id still exists) but the entry's own gate keeps it blocking at cutover.
- Retired rows without a vocabulary `disposition` are reported in `explicitOpenFindings.retiredWithoutDispositionCount` / `...Rows`, plus `registryIdentityGapCount`. They do not change `clean` or `gapCount`. The default registry path still points at the old registry, which has no retired rows.

## Classification of removed and edited units (proposals only, nothing written to a ledger)

Method: old unit text from `f0c76c5e5` blobs, new from `3b409a373`, lines whitespace- and numbering-normalised. Sanity: all 291 old units located, all old digests match. Renumbered-only: every old line still present in the new file. Heading-renamed: old title gone and (body >= 80 % present, or a new heading with title token overlap >= 0.6). Real removal: < 50 % of lines present and no successor. Real edit: the rest. Full per-unit records: `scratch/classification.json`.

| Group | renumbered-only | heading-renamed | real removal | real edit | Total |
|---|---:|---:|---:|---:|---:|
| removed (43) | 4 | 5 | 8 | 26 | 43 |
| edited, id kept (121) | 19 | 0 | 0 | 102 | 121 |
| edited, positional gap (127) | 18 | 0 | 0 | 109 | 127 |

Proposed dispositions (vocabulary ids):
- Removed, content has a successor unit in the same file (35): `supersede`, target owner = the file, anchor = successor (high confidence for renumbered/renamed, owner review for real edit).
- Removed, no carrier anywhere under `docs` (8): `delete-as-obsolete`, flagged `possibleUnintendedDrop`. Owner confirms each; the dropped-claims precedent says do not assume intent. They are: `AGENTS.md` unheaded-block-18 and -34; `docs/how-to/use-fgos-group-thinking.md` operator-path heading and unheaded-block-5; `docs/specs/runner.md` unheaded-block-65, -77, -79, -112 (112 is 44 % present). The AGENTS.md herdr-gateway heading was matched as a rename to the fgos-gateway heading, not a removal. Touching commits per file are in the JSON (`5df843bdb`, `0c23a176d`, `e9deda6fb`, `2636ba229`).
- Edited, id kept (121): keep the disposition the ledger already carries (88 `unknown-blocking` from file-level routing gaps, 23 `reclassify-out-of-platform-scope`, 5 `merge`, 2 `regenerate-from-source`, 2 `promote`, 1 `retain-as-evidence`); action is edit review only.
- Edited, positional gap (127): old id gets `supersede` by the new unit at the same anchor (122); where `supersede` is not allowed for the file class: `regenerate-from-source` (3, generated files), `delete-as-duplicate` (1, history evidence), `unknown-blocking` (1, `docs/architecture-manifest.json`, no allowed disposition for its file class).

New routing gap `docs/specs/observe.md` (25 claims, area "Legacy spec (unmapped)", `gap: true`). Not in the switchboard (0 matches). Proposal: add an area "Observe (metrics and friction)", `legacy-current`, `maintained-authority`, `canonicalRoute docs/specs/observe.md`, `retainedSources ["packages/observe/rust/**"]`, shaped like `docs/specs/distillery.md` and `decision-citation-drift.md`, which then sit as owner-blocking, not routing gaps. The switchboard edit is outside this task's allowed writes.

## Decisions for the Lead

1. Duplicates: 306 unchanged duplicate units became gap rows on purpose (rule 5). 289 of them could be paired 1:1 deterministically because old and new anchor sets for the same digest in the same file are identical; 17 could not. The generator marks all 306 as `ambiguous-registry-gap` in the ledger either way. Pair the 289 or keep them as gaps?
2. The 8 `possibleUnintendedDrop` removals: who confirms intent, and do they go into `dropped-claims-register.json`?
3. Add the Observe area to the switchboard (above)?
4. Gates default `--identity-registry` still points at the old registry. Switch it to the new one once the new registry is committed (not done: generated registry is 43.5 MB and the task wrote it to scratch only).
5. Positional edits are all gaps by rule 2 (127). Many are `renumbered-only` (18) or tiny edits; accept the gap + `supersede` route, or allow a looser match for those?

## Files in scratch

Directory `/tmp/claude-1000/-home-vantt-projects-forgentX/4df9e88c-dcc7-4ca8-b24a-b69b112e7ced/scratchpad/carry/`: `new-identity-registry.json` (43.5 MB), `inventory/doc-inventory.json` (+ `.parts/`) and `.md`, `gates.json`, `arithmetic.json`, `inventory-facts.json`, `classification.json`, `red.txt` / `green1.txt` (test output), scripts `prove-arithmetic.mjs`, `gap-breakdown.mjs`, `inv-facts.mjs`, `classify.mjs`.

## Reproduce

From the plan worktree, `S=<scratch dir>`:

```
node scripts/generate-doc-inventory.mjs --carry-forward-identity-registry --commit HEAD \
  --identity-registry plans/260925-documentation-authority-unification/reports/phase-02-identity-registry.json \
  --json-out $S/new-identity-registry.json
node scripts/generate-doc-inventory.mjs --commit HEAD --identity-registry $S/new-identity-registry.json \
  --json-out $S/inventory/doc-inventory.json --md-out $S/inventory/doc-inventory.md
node scripts/check-doc-inventory-gates.mjs --inventory $S/inventory/doc-inventory.json \
  --identity-registry $S/new-identity-registry.json --json > $S/gates.json
node $S/prove-arithmetic.mjs plans/260925-documentation-authority-unification/reports/phase-02-identity-registry.json $S/new-identity-registry.json
node $S/inv-facts.mjs $S/inventory/doc-inventory.json $S/new-identity-registry.json
node $S/classify.mjs $S/new-identity-registry.json $S/inventory/doc-inventory.json \
  plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json $S/classification.json
env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/generate-doc-inventory.test.mjs
node scripts/check-legacy-docs-ratchet.mjs
```

Random ids make the registry differ between runs; counts and ordering are stable.

## Review fixes

All with tests first (5 red, then 88 of 88 green); ratchet exit 0. Rerun on `3b409a373` with the same commands: carry 2.5 s / 0.80 GB, inventory 15.5 s / 1.91 GB, gates 9.2 s / 1.48 GB, all exit 0. Arithmetic unchanged: 85,175 kept + 0 moved + 121 edited-kept + 433 gaps + 43 retired = 85,772; 789 added; 86,085 claim rows; gates clean, 0 fatal, 1,361 gaps, 433 registry gap rows, 43 retired rows without disposition. `classification.json` regenerated against the new registry (same tallies; ids are random per run).

1. Stale markers: the repo-wide path strips `reviewStatus`, `lineage`, `movedFrom`, `identityNote`, `origin` from the previous unit and document row before applying this carry's own fields. `needs-review` does not persist; a later carry sets it only if it edited the unit. Test runs two carries (edit and add in the first, unrelated change in the second).
2. Dropped-claims CLI: without the flag, a missing default file skips the check with a one-line notice on stderr (exit unaffected); with the flag, a missing file is an input error, exit 1. `loadDroppedClaimsRegister` is exported and tested for both.
3. A register whose `entries` is missing or not an array is a fatal `dropped-claims-register-malformed`.
4. `matchPreviousUnit` now collects the ambiguity notes and candidate rows of both lookup steps (fingerprint and digest) and returns them together. The reported case (fingerprint ambiguous, digest finds nothing) already produced an ambiguous gap reason before the change; the test pins it, and the change fixes the one real loss: rows from the first ambiguous step were overwritten by the second.
5. Duplicate ids: the carry-forward throws if one claim id appears twice across `units`, `retiredUnits`, `identityGaps`; the gates report a fatal `identity-registry-duplicate-claim-id` for the same condition.

Known, left as is: (6) matching is order dependent when several candidates remain after earlier units consumed some, shared with the single-path function and pre-existing; (7) fresh ids are random, so two runs differ in added ids and a sort tie on equal path and anchor is broken by id (theoretical, anchors are unique per file). The "Decisions for the Lead" above are untouched.
