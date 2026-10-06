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

## Owner decisions applied (2026-10-06)

Final run: carry-forward from the committed Phase 3 registry in one carry, then dispositions, then inventory and gates, all bound to a temporary unreferenced commit `79530b22149de0decb4dfd389d2f018e8ed9d8e3` (HEAD `6d099c8c8` plus the uncommitted working-tree changes; built with a throwaway index, no branch, index or worktree change). Reason: the switchboard is read from the commit, so a committed switchboard change cannot be seen from HEAD.

1. **Pairing.** Same file, same digest, equal old and new anchor sets: paired by anchor (row marker `pairedByAnchor`, dropped by the next carry like the other markers). Result 289 paired, 17 still ambiguous gap rows, as expected. The inventory's claim-id lookup is anchor-aware (Lead decision, see below), so the ledger agrees with the registry.
2. **The 8 removals with no carrier** (commit history read, `git log -S` over `f0c76c5e5..HEAD`): none is unexplained.
   - Replaced, `delete-as-obsolete`: `AGENTS.md` block 18 (reworded when decide moved onto `bind()`, `cfd670c43`), block 34 (generated GitNexus count line, `120af6b3d`, refreshed by `5df843bdb`), `docs/how-to/use-fgos-group-thinking.md` operator-path heading (`42e822e4d`, `0c23a176d`) and block 5 (pack gate retired, `0c23a176d`).
   - Edited in place, `supersede` to the unit holding the edited text: `docs/specs/runner.md` blocks 65 (`b048e852d`), 77 (RUL69 kept and marked partly replaced by RUL72, `d480a05b5`, `4b7a20000`), 79 (skill renamed, `0c23a176d`), 112 (terminology sweep, `0c23a176d`). Line-level matching had missed these because the paragraphs were reflowed.
   - `dropped-claims-register.json` and plan §7.3: no change; no truly ambiguous case to list.
3. **Switchboard.** Area "Observe (metrics and friction)" added after Distillery in `docs/transitional-switchboard.md` and `transitional-switchboard.json` (JSON round-trips byte-identical otherwise). `docs/specs/observe.md` is no longer a routing gap (0 of 1,054 routing-gap paths) and is owner-blocking like its siblings.
4. **Dispositions in the registry** (reviewer `lead 2026-10-06`, fields `disposition`, `targetOwner`, `targetAnchor`, `dispositionRationale`, `dispositionEvidence`, `dispositionSource`, `dispositionConfidence`): 43 retired rows: 39 `supersede`, 4 `delete-as-obsolete`. 127 of 128 positional-edit gap rows: 123 `supersede`, 3 `regenerate-from-source`, 1 `delete-as-duplicate`. `retiredWithoutDispositionCount` is 0. Still open: 17 ambiguous gap rows (no disposition by design) and 1 positional gap, `docs/architecture-manifest.json` `file-block` (no vocabulary disposition is allowed for its file class).
5. **Artifacts and defaults.** Written: `reports/identity-registry.json` (45.4 MB), `reports/doc-inventory.json` (manifest), `reports/doc-inventory.md`. Shards moved out of the tree to scratch (`final/doc-inventory.parts/`); do not commit them. Generator skip list now covers `reports/{doc-inventory.json,doc-inventory.md,doc-inventory.parts/,identity-registry.json}` and keeps the `phase-02-*` names (one list, both generations). Gates defaults point at the new files and the generator constants; with the shards missing the gates exit 1 and print the regenerate command (verified). The generator has no default registry path. Tests touched: only `test/scripts/generate-doc-inventory.test.mjs` (no test ran gates on committed artifacts); it now has 91 tests, all green; ratchet exit 0.

Numbers (scripts, `/usr/bin/time -v`): carry-forward 2.5 s / 0.82 GB; inventory 36.6 s / 1.92 GB; gates 18.7 s / 1.31 GB; all exit 0.

| Old units 85,772 | |
|---|---:|
| kept | 85,173 |
| paired by anchor | 289 |
| moved | 0 |
| edited-kept (`needs-review`) | 122 |
| identity gaps | 145 |
| retired | 43 |
| added (fresh ids) | 501 |

85,173 + 289 + 0 + 122 + 145 + 43 = 85,772; every old id appears exactly once; new units 86,085; claim rows 86,085. The one extra edited-kept and one extra gap against the earlier run come from the new switchboard table row in `docs/transitional-switchboard.md`.

Gates (default paths, no flags; numbers after the anchor-aware lookup below): exit 0, clean, 0 fatal. 1,071 gaps = 1,054 file/routing + 17 claim-identity; 1,400 unknown-blocking rows; 145 registry gap rows; 0 retired rows without disposition; dropped-001 conserved (live unit and ledger). Routing gaps: 1,054, `docs/specs/observe.md` not among them.

### Rebinding after you commit

The registry and inventory are bound to the temporary commit, which will not exist in history. After committing the sources (switchboard md and json, scripts, test, plan, this report), bind the artifacts to the real commit `<C>`:

```
git diff --quiet 79530b22149de0decb4dfd389d2f018e8ed9d8e3 <C> -- docs AGENTS.md CLAUDE.md plans/260925-documentation-authority-unification/transitional-switchboard.json && echo in-scope tree identical
node -e "const fs=require('fs');const f='plans/260925-documentation-authority-unification/reports/identity-registry.json';const r=JSON.parse(fs.readFileSync(f));const from=r.commit;const to=process.argv[1];r.commit=to;r.carryForward.toCommit=to;for(const x of [...r.retiredUnits,...r.retiredDocuments])if(x.retiredAtCommit===from)x.retiredAtCommit=to;fs.writeFileSync(f,JSON.stringify(r)+'\n')" <C>
node scripts/generate-doc-inventory.mjs --commit <C> --identity-registry plans/260925-documentation-authority-unification/reports/identity-registry.json --json-out plans/260925-documentation-authority-unification/reports/doc-inventory.json --md-out plans/260925-documentation-authority-unification/reports/doc-inventory.md
node scripts/check-doc-inventory-gates.mjs
```

The rebind keeps ids, `needs-review` markers and dispositions (a second carry would strip the markers). Then move `reports/doc-inventory.parts/` out of the tree before committing the three artifacts as a second commit. Scratch inputs for a full redo: `final/classification.json`, `apply-dispositions.mjs` (not committed).

### Anchor-aware ledger lookup (Lead decision 2026-10-06)

`resolveRegisteredClaimId` now resolves a duplicate-digest unit by anchor, but only when the registry holds exactly one row for (source path, digest, anchor) and that row is not one minted from an unresolved ambiguity (`identityNote`). Tests first: a paired duplicate resolves to its carried id, an unpaired duplicate group stays `ambiguous-registry-gap` (red, then green; 93 tests green; ratchet exit 0). Effect on the final run (new temporary commit `79530b221`, same pipeline): ledger identity status 86,068 carried-forward and 17 ambiguous-registry-gap; claim-identity gaps 306 to 17; total gaps 1,360 to 1,071 (1,054 file/routing + 17); unknown-blocking rows 1,400; fatal 0; registry arithmetic unchanged (85,173 + 289 + 0 + 122 + 145 + 43 = 85,772; 86,085 claim rows); inventory 19.3 s / 1.91 GB, gates 12.8 s / 1.48 GB. Side effect: any registry whose same-file duplicates carry distinct anchors (for example a plain bootstrap) now resolves those by anchor too. Because `identityNote` is dropped by the next carry, the 17 ambiguous groups would pair by anchor in a later carry if their content stays identical.

Open item for Phase 6: `docs/architecture-manifest.json` `file-block` (positional edit gap row, file class `unclassified`) has no disposition on purpose.
