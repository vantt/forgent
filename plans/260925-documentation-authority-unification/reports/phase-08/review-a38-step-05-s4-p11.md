# review-a38-step-05 s4-p11 (read-only semantic review)

Pin for both files: 95301cb9a. Neither file has a diff or rollbackDiff, and neither has coCutPaths.

## scripts/doc-alias-resolver.mjs — verdict: rework
Items reviewed: 58 (38 REJECT/preserve, 20 ADMIT/parked).

OUTCOME defects:
1. dynamic-007297 (L147, readOldDocument). Rule: a rejected tuple must really not construct or read a document path, and same-passage tuples share one outcome.
   - It is rejected as non-document-formatting, but the operand is the git object spec `${revision}:${refPath}` in `execFileSync('git', ['show', ...])`. That reads the old document at a revision.
   - It sits in the same passage as 007296 (L144 `.md` guard) and 007298 (L149 `path.resolve(repoRoot, refPath)`), both ADMIT/parked.
   - Correction: ADMIT, path-operation, park with the same blocker and receipt as 007296/007298.

The remaining items check out:
- Admitted and parked: 007289, 291, 292, 296, 298, 299, 302-305, 307, 311-314, 316, 318, 319, 326, 327. These are real path reads or constructions (existsSync/readFileSync of toOwner, readOldDocument, posix.join against consumerPath, the DEFAULT_ALIAS_TABLE_PATH and OWNER_ROOT constants, CLI --table/--from/--constitution paths, the splitRef path component).
- Rejected as messages, comments, scalar guards or alias-table lookup keys: the other 38, including 007300/301 (doc comment), 007306 (`fromPath === from` comparison), 007343 (Map), 007344 and 007308-310 (the `path#anchor` strings are only keys into the alias table, which is lookup-only and never read or written as a path).

## scripts/doc-binding-repair.mjs — verdict: rework
Items reviewed: 38 (34 REJECT/preserve, 4 ADMIT/parked).

OUTCOME defects:
1. dynamic-007358 (L230, `aa.join('\n')`). Rule: an admitted tuple must really construct or read a document path.
   - `aa` is a normalized array of text lines from a section payload, compared for order equality. No path is built.
   - Correction: REJECT, preserve, scalar-guard/accumulator/serialization. This matches 007357 (`join(c.after)`) and 007345 (`join('\n')`), which are rejected.
2. dynamic-007359 (L230, `bb.join('\n')`). Same as 007358; correction: REJECT/preserve.
3. dynamic-007362 (L259, `labels.join(', ')`). `labels` are owner-answer label ids joined into a description string. No path is built.
   - Correction: REJECT/preserve, non-document-formatting.

Correct as recorded:
- 007349 is a real doc-link destination construction: `posix.join(path.posix.dirname(unit.path), file)`. ADMIT/parked is fine.
- All 34 rejects are fine. These are rationale-text formatting, error messages, comparisons of unit.path, and a regex built from unit.path that only matches text.

## Record-text notes
- The 24 parks (20 in doc-alias-resolver, 4 in doc-binding-repair) all carry the same generic blockedReason ("Pinned migration inventory/identity/alias or caller-supplied file set; no bounded artifact/export supplied..."). The reason is not tailored to each passage. For 007307, the alias-table.json under plans/ is a bounded, live artifact. Consider naming it in the reason.
- Parity rows for rejected items repeat the comparison string "Same fixture/export bytes; compare output... without path normalization". That is harmless.

## Lead-judgment questions
- Q1. Parameter-default and pass-through admissions (alias-resolver 007302 `repoRoot = null`, 007303 `consumerPath = null`, 007314, 007318, 007319 `repoRoot: cwd`).
  - These are scalar inputs passed through, not constructions or reads.
  - L12-69(5) treated real containment-path inputs (013971) as admitted and scalar metadata as rejected. These look like the former because they flow into readOldDocument and path.resolve.
  - I would keep them admitted but flag the consistency.
- Q2. Runtime-emitted messages that interpolate document paths from data are rejected as formatting: alias-resolver 007290, 007293, 007294, 007324, and binding-repair 007367 (persisted rationale cite).
  - L12-60(1) says runtime-emitted strings are user-visible output.
  - None contains a literal pointer to a retiring path; the paths are runtime data. I judge reject/preserve consistent, but the Lead should confirm.

## Counts
- Items: 96 total. 72 REJECT/preserve, 24 ADMIT/parked.
- Outcome defects: 4 (1 in doc-alias-resolver, 3 in doc-binding-repair).
- Net after correction: doc-alias-resolver 37 reject / 21 admit; doc-binding-repair 37 reject / 1 admit.

Status: DONE
