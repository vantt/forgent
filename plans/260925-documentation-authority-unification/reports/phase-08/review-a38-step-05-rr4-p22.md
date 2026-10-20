# Review a38 step-05 seam 4, re-review round 4, part p22

Reviewer: independent read-only semantic review. Payload `s4-src-p22.json`, 7 source files, 135 items (132 dynamic tuples, 3 literal references plus 1 admitted dynamic), no diffs, no parks.

## Per file

| File | Verdict | Items | Notes |
|---|---|---|---|
| scripts/migrate-actor-to-role.mjs | ok | 18 | All REJECT/preserve. Operands are the caller-supplied event-log path and backup path (resolve/dirname, guard, error text, report fields, argv scalars). None constructs or reads a document path. Same-line pair at L94 (008379/008380) rejects on both items. |
| scripts/migrate-status-proposed-to-awaiting-approval.mjs | ok | 19 | Same shape as above, all reject. Literal reference-003619 (docs/history/status-proposed-rename/plan.md, header comment) is ADMIT/preserve. The file exists at the pin and docs/history is a retained convention, not specs/architect, so preserve is sound. |
| scripts/migration-proof-2a.mjs | ok | 10 | `.fgos/coordination/sessions/*/events.jsonl` is state-event-store, so reject is true. The remaining items are console formatting of counts and ids. |
| scripts/next-doc-id.mjs | ok (one question) | 2 | Literal reference-003620 preserve (see Q1). Dynamic-008410 ADMIT/preserve (see Q2). |
| scripts/package-release-assets.mjs | ok | 29 | The packaged set is binaries, `install.sh`, `scripts/install.ps1`, tars and SHA256SUMS. No docs enter the payload, so every reject is true. |
| scripts/prepare-release.mjs | rework | 37 | Three outcome defects (D1, D2) below. The Rust manifest/lockfile, package.json and package-lock.json operands are not documents, so those rejects are correct. |
| scripts/probe-storytelling-material.mjs | ok | 19 | Reference-003621 (docs/history/storytelling-material-probe/CONTEXT.md) is preserved and the file exists at the pin. The log path default is state-event-store. `reportPath` and `logPath` are caller data. All other items are report-line formatting or joins. |

## OUTCOME defects

D1. `scripts/prepare-release.mjs` L169 (dynamic-008452 and 008453, `const changelogPath = path.join(root, 'CHANGELOG.md')`).
- Current outcome: REJECT, scalar-pass-through.
- Why it is wrong: the operand is a fixed document literal under the root. It is then read at L174 (`readText(changelogPath)`) and written at L190-191, a read and write of a document path. That is R6 (read/write on a document path).
- Precedent: the pilot admitted the CHANGELOG.md and README.md reader tuples 014299-014302 (L12-60 and the p10-17 pilot review).
- Correction: ADMIT/preserve with `pathOperand` `path.join(root, 'CHANGELOG.md')`. The paired `package.json` (008448/008449) and `package-lock.json` (008450/008451) lines stay reject because they are not documents. Lines 167 to 169 are separate operations, so R7 does not force them together.

D2. `scripts/prepare-release.mjs` L123 (dynamic-008441, `throw new Error(\`CHANGELOG.md already contains a release heading for ${tag}\`)`).
- Current outcome: REJECT, caller-data-formatting.
- Why it is wrong: the message prints a fixed document literal, `CHANGELOG.md`. The `${tag}` is only a label. R6 says a user-visible message whose printed path comes from a fixed document literal is admitted.
- Same line as reject: 008440 (L122, `## [${tag}]` text search) and 008442 are a heading search and a content template, not path emission. They may stay reject.
- Correction: ADMIT/preserve for 008441 with its message expression named. Also check the neighbouring emitted messages at L111 and L119. They print the same fixed literal but have no tuple in this payload, which may be a census gap (see Q3).

## Record-text notes (not outcome defects)

- N1. reference-003620 (`next-doc-id.mjs` L3): the matched expression carries an invented `repo/` prefix, `repo/docs/id-systems-audit.md`. The real path at the pin is `docs/id-systems-audit.md`. The resolverWitness has no `existsAtPin`, although the file exists. The record should say it exists, and that `docs/platform/documentation/history/id-systems-audit.md` is a non-canonical candidate history copy and not a holder.
- N2. reference-003619 (`migrate-status-...` L20-21): the witness says "pattern, not one path". It is really one path split across a comment line break, and the file exists at the pin. Add `existsAtPin: true`.
- N3. dynamic-008379 is labelled `caller-data-formatting` for `outLines.map(l => \`${l}\n\`).join("")`. It is a serialization of event-log lines. Use `text-label-join` like 008380 for consistency.

## Lead-judgment questions

- Q1. next-doc-id L3 preserves a pointer to `docs/id-systems-audit.md` on a "retained non-authority" witness. The target is under docs/ root and not under specs/architect, so the rule against retained witnesses does not apply. R8 prefers a patch when a navigation pointer has a live holder. The only holder is a candidate copy marked `Canonical: No`, so I accept preserve. Lead should confirm the root file is not itself slated to retire in Phase 9.
- Q2. next-doc-id dynamic-008410 admits `path.resolve(cwd, file)` where `file` comes from `--file`. There is no fixed document root, so by R5/R6 it looks like a scalar pass-through. The migrate-* log-path reads and the probe `--log` read reject on exactly that basis, so this is inconsistent. Preserve is the result either way. Choose admit or reject once for generic caller-path readers; I lean reject with `scalar-pass-through`, unless the Lead counts doc-id scanning as the document use.
- Q3. prepare-release L202-205 (`git add ${...relative paths}`) and L263 (`- ${file}`) print the changed-file list, which always includes the fixed `CHANGELOG.md`. Under R6 the printed path partly comes from a fixed document literal. The rejects (008457, 008465) may be correct if the list is treated as caller data. Lead should rule on whether a list containing a fixed document literal counts as emission. If yes, those two flip to admit with D1.

## Counts

- Items reviewed: 134 (18 + 19 + 10 + 2 + 29 + 37 + 19).
- Items correct as authored: 131.
- Outcome defects: 3 items (008441, 008452, 008453).
- Items in open questions: 008410, 008457, 008465 plus reference-003620.
- Diffs and parks: none in this part, so no diff, rollback, blockedReason or successorNote checks apply. No retired-decision citation is carried by any item.

Status: DONE_WITH_CONCERNS
Summary: 6 of 7 files are ok. `scripts/prepare-release.mjs` needs rework because the CHANGELOG.md path read/write (L169) and the fixed-literal message (L123) are wrongly rejected, against R6 and the pilot CHANGELOG precedent.
