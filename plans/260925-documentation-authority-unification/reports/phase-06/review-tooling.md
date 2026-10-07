# Independent tooling review

Reviewer: claude-lead-review:4df9e88c@2026-10-07
Date: 2026-10-07
Author reviewed: codex-session:1@2026-10-07 (distinct session; declared identity only, see Unproven)
Reviewed implementation pin: `1ec3ceca620d0a3fb40f506ae9646f6882410877`
Baseline: `dbe5c432852837ea01e6025b35868bcb7271495d`
Worktree HEAD at review: `5acc58770107992b1e3fe1d9f1b39112daee5790` (only report/evidence files differ from the pin; the six production paths and thirteen test paths are byte-identical to the pin)

## Verdict: accept-with-required-fixes

The tooling does what the request table asks in the fixture-backed paths and is not a rework: every red commit is genuinely red and green at its implementation, the suites and both real conservation runs reproduce, the extractor, vocabulary and constitution are untouched, and no gate invariant was loosened. Two High findings break the "one declared session cannot review itself / committed reports are required" contract at the gate and must be fixed before any real batch is authored. They are small and local. Medium findings need a fix or an explicit recorded decision.

Findings: Critical 0, High 2, Medium 5, Low 5.

Reviewed paths (all at the pin): `scripts/check-doc-inventory-gates.mjs`, `scripts/propose-doc-decisions.mjs`, `scripts/check-doc-retirement.mjs`, `scripts/check-doc-constitution.mjs`, `scripts/check-doc-candidate-status.mjs`, `plans/260925-documentation-authority-unification/pilot/claim-decisions.schema.json`, the thirteen listed `test/scripts/*.test.mjs`, and `reports/phase-06/structural-mutation-probe.mjs`.

## High

### H1. Authorship, report and reverse-conservation enforcement is opt-in by the author's own shard flag

Where: `scripts/check-doc-inventory-gates.mjs:790` (`if (shard.authorshipRequired === true) for (const row of shard.claims ...) validateManualReview`), `:1039` (`reverseEnabled = ... shard.authorshipRequired === true`). Nothing else in `scripts/` reads the flag (grep).

Failure scenario: a new hand-authored shard that simply omits `authorshipRequired` (or sets it false) skips `validateManualReview` entirely: self-review, missing committed report, `script:` identities on manual rows, missing `authoredBy`, and the reverse candidate-unit check are all silent. Rows approved through the legacy re-review path (pack with `--author`, then apply) get review pins that the gate then never verifies, for the same reason.

Evidence (probe `p2.mjs`, same fixture and `--strict --scope` argv as the structural probe, exit codes from the real gate CLI):
- `noflag-self-review` (flag removed, `authoredBy` equals the reviewer session): exit 0, zero findings.
- `noflag-no-report` (flag removed, `reviewReport`/`reviewReportCommit`/`authoredBy` removed from a `reviewed` row): exit 0, zero findings.
- With the flag present, the same mutations give `decision-self-review` and `decision-review-report-missing`.
- Module probe `p1.mjs`: non-flag shard with `script:` author and reviewer on a hand row, no report: `[]`.

Required fix: make the requirement non-optional for everything that is not the frozen legacy corpus. Options, pick one: (a) fail `decision-authorship-required` for any shard outside an explicit list of the legacy shard names under `pilot/decisions/` that carries `reviewed` rows, `exact`, `mirrors`, `corpusRules`, any `authoredBy`, or lives under the new shard directory; (b) a gate flag (default on for `--strict`/`--cutover`) that rejects any shard lacking `authorshipRequired: true` unless its file digest is in a frozen legacy allow-list. Add a red test: unflagged shard with a self-reviewed row must produce a fatal finding, and the 7 pilot shards must stay clean. Also tie reverse conservation to the same rule rather than to the flag.

### H2. Reviewer prefix normalization is bypassed by a doubled prefix

Where: `scripts/check-doc-inventory-gates.mjs:569` (`reviewSessionIdentity` strips one leading `reviewer:` and one trailing `@date`), `scripts/propose-doc-decisions.mjs:184` (`independentReviewer` regex `^reviewer:[^@\s]+-session:[^@\s]+@date$`, then compares normalized values).

Failure scenario: author session `fixture-session:author@2026-10-07` writes reviewer identity `reviewer:reviewer:fixture-session:author@2026-10-09`. The regex accepts it (`[^@\s]+` matches `reviewer:fixture`), normalization strips only one prefix, so the normalized value `reviewer:fixture-session:author` differs from `fixture-session:author`.

Evidence (probe `p1.mjs`): the gate returns `[]` for `self-review-double-prefix` while the single-prefix, different-date control returns `decision-self-review`. `independentReviewer('reviewer:reviewer:fixture-session:author@2026-10-09', author)` returns `true`. Zero-width suffix (`author​`) also passes (same root cause, no normalization of invisible characters or case in the id part). This is exactly the "normalize date and reviewer prefix" check the request lists.

Required fix: normalize with `replace(/^(?:reviewer:)+/, '')`, trim, case-fold, Unicode NFKC and strip zero-width characters; additionally reject a reviewer whose model segment starts with `reviewer:`. Add red tests for double prefix, case and zero-width variants in `doc-review-authorship.test.mjs` and `doc-decision-review.test.mjs`.

## Medium

### M1. Pack id and sensitivity score are not verifiable at the gate

Where: `scripts/check-doc-inventory-gates.mjs:617-619` (`Pack id` and `Seed score` only need 64 hex characters equal to the report header); `scripts/propose-doc-decisions.mjs:303` (key withheld, never committed).

Scenario: a committed report with `Pack id: aaaa...` and `Seed score: bbbb...` is accepted. The structural probe itself uses `'a'.repeat(64)` and `'b'.repeat(64)` and passes. A forged or never-run sensitivity check, or a forged control set, is indistinguishable from a real one at the gate. Module probe `p3.mjs` also shows `applyReviewVerdicts` accepts an author-chosen seed/nonce and an author-written seed verdict table (the key replays by construction); only the withheld-key discipline stops it, which is unenforced.

Required: either record plainly in `tooling.md` and in the review brief that the score and pack bindings are declaration-only at the gate, or (recommended) commit the released key and seed verdict table next to the report once the verdict commit exists and have the gate recompute `scoreId` and the 5/6, 2/24 thresholds from them. This still cannot prove physical separation; it removes the "any hex string" path.

### M2. The sensitivity check is satisfiable by a mechanical diff (early-review M8 not addressed)

Where: `scripts/propose-doc-decisions.mjs:285-296` (mutations and controls are drawn only from rows whose source and target text are already byte-equal).

Evidence (`p3.mjs`): a "reviewer" that only compares source text to target text in the seeded pack scores 6/6 caught, 0/24 false flags, which passes. The same probe shows all six mutated rows can be located by comparing against the same claim in the normal pack. The test therefore measures whether the reviewer runs a diff, not whether they read the weak/judgment rows where errors live. Thresholds are owner-set and unchanged; the fix concerns the pool, not the thresholds.

Required: draw mutations from rows where source and target legitimately differ in form (Weak-exact and Judgment candidates), or make the byte-equal controls indistinguishable by also showing a reformatted-equivalent control; or, if the Lead/owner accepts the limitation, record it as an accepted risk. Do not claim the score as evidence of attentive review of difficult rows.

### M3. A batch with fewer than 30 eligible byte-equal rows can never be approved

Where: `scripts/propose-doc-decisions.mjs:289-295` (`insufficient eligible rows`, `seed pack requires 24 additional byte-equal controls`), pool limited to the same batch.

Evidence (`p8.mjs`, 20-row batch): `seedReviewPack` throws, so `--apply-review` can never succeed for that shard. Phase 6 shards are capped at about 500 rows but have no floor; small areas and areas whose rows mostly differ will deadlock. Required: allow controls from script-proven carries of other shards or the inventory (still current and re-proven), or state a minimum batch rule in the review brief. Needs a Lead/owner decision on the pool; thresholds stay.

### M4. Conflict receipts bind a key only, with no membership or reviewer evidence

Where: `scripts/check-doc-retirement.mjs:101-121` (`closed.has(\`semantic:${group.key}\`)`, `duplicate:${group.blobSha}`; `evidence` is any non-empty strings).

Evidence (`p4.mjs`): after a receipt closes `semantic:area:title`, a group with the same key whose `paths` gained a new conflicting document still counts as closed (`semantic: 0`), and arbitrary evidence text closes a group. Malformed, duplicate and unknown-kind receipts are correctly rejected, and a receipt for a vanished key is a harmless record. Remaining risk: a stale receipt silently closes a grown or changed group, and the migration-acceptance gate `no-unresolved-conflicts` can be satisfied by self-asserted JSON without any independent review. Required: bind each receipt to the exact group `paths` (and blob digests for semantic groups) so any membership change reopens it, and require the receipt to cite a committed review report in the same way corpus rules do (or record that receipts are owner-authored and owner-reviewed outside the tooling).

### M5. Corpus rule reviews read their report at the inventory commit, with no per-rule commit pin

Where: `scripts/check-doc-inventory-gates.mjs:719` (`reviewReportOf(rule.reviewReport)` uses the default commit), `:633-646`, schema `corpusRules` has `reviewReport` but no pin.

Scenario: the report file name is `review-<step>-<shard>.md`. A later review round on the same step and shard rewrites that file; the earlier corpus verdict (Corpus, Rule digest, `corpus:<name>` row) disappears from the tree at the next inventory commit and the reviewed rule fails with `decision-corpus-review-invalid`. This fails closed (no unsafe approval), but it contradicts the "row-specific report commit pins survive later report rounds" property that manual rows have. Required: add `reviewReportCommit` to corpus rules with the same ancestor and committed-blob checks, in the schema and the loader.

## Low

- L1. `registryGaps` with `defer-with-owner` need no stub (`scripts/check-doc-inventory-gates.mjs:837` loop has no `committedStubExists`; the gap schema has no stub fields). Probe `p5.mjs`: `[]` findings and the gap row becomes `defer-with-owner`. Add the stub fields and check, or forbid the disposition for gaps.
- L2. The gate accepts a report that contains an `ok` row for the claim even if the same report also has a contradicting `rework`/`hold` row for it (`:620-623` uses `.some`). `parseReviewVerdicts` rejects duplicates, the gate does not. Reject any report with more than one row for the claim id.
- L3. The report path regex hard-codes `reports/phase-06/` (`:577`), tying production code to one phase directory against the repository rule about phase labels in code. Take the report directory from data or a constant derived from the plan directory.
- L4. Early-review lows still open: mirror target need not share the source's relative path (early L2); `--decisions` is loaded and then ignored by `--propose`, `--pack`, `--apply-review`, `--rebind` (`propose-doc-decisions.mjs:582`, early L4); `reviewedAt` is the system date, not checked against the date in the reviewer identity (early L5); `--rebind` and `--apply-review` overwrite the input file in place without temp-file-plus-rename or backup (`:594`, `:616`, early L6). A gitignored candidate document escapes the untracked-candidate scan (`--exclude-standard`); acceptable but worth one line in the docs.
- L5. Several red commits are coarse: `1f147b961`, `de2c92e81`, `7e94480f0` fail as a whole file (pass 0 / fail 1, missing exports) and `e9edcb03f`, `9a062d31b`, `f86f26c3b`, `ed37e57cb` show pass 0 (import-level). They are real reds that turn green at the implementation, but they do not prove each assertion individually red.

## Early-review findings (prior read-only review at `789870507`)

| Item | Status at the pin | Evidence |
|---|---|---|
| H1 same session, other date | Fixed for single prefix and date; NOT fixed for doubled prefix | `p1.mjs`; see H2 above |
| H2 pre-reviewed rows skipped | Fixed in pack and apply (fail closed) and in flagged shards at the gate; NOT fixed for unflagged shards | `requireVerifiedShard`; `p2.mjs`; see H1 above |
| H3 seed leaks its own key | Fixed | key keeps seed and nonce; public pack and sidecar carry neither, mutated text digests are recomputed (`p3.mjs`, `doc-decision-review.test.mjs`) |
| H4 apply not bound to score or seen text | Fixed in the tool | apply refuses a failing score (`p3.mjs`), pack carries source and target digests, `targetUnitDigest` stamped from the shown unit; gate only checks header equality (M1) |
| M1 fabricated header | Inherent; partly closed by committed-report requirement; open for unflagged shards | H1 |
| M2 missing `authorSession` | Fixed | `authorshipRequired needs authorSession` at gate and `requireVerifiedShard` |
| M3 single shard-level report | Fixed | per-row `reviewReport`, `reviewReportCommit` |
| M4 rebind across headings | Fixed | `p3.mjs`: moved ancestry becomes pending, same ancestry renumbers and stays reviewed |
| M5 coverage over-counts, ranges ignored | Fixed | legacy-only predicate, Source-table scan, inclusive ranges, tests |
| M6 exact self or non-legacy source | Fixed | `p2.mjs`: both rejected with `decision-exact-invalid` |
| M7 source multiplicity | Fixed | `classifyExactCarry` source-occurrence reason |
| M8 weak mutation pool | NOT fixed | see M2 |
| L1 blob SHA from inventory | Unchanged but covered by `validateCommitBlobIntegrity` in the gate and constitution paths | |
| L2 to L6 | Unchanged | see L4 |
| L7 phase label in test fixture | Test string fixed; production regex now carries a phase directory | L3 |
| L8 heading payload hidden | Fixed | `sectionText` shown and bound |

## Request checklist

| Area | Result |
|---|---|
| Repeated inputs | Pass. Probe: missing path, empty directory, trailing flag and option-looking value each fail with a `--decisions` message; same path twice and two directories with the same claims give `decision-claim-duplicate`; single input is unchanged. |
| Exact and mirror proof | Pass for exact: self-source, non-legacy source, foreign rows, mirror outside `sources`, mirror non-evidence path, committed blobs re-proven from the pinned tree each run. Hand-written script identity on a manual row is rejected in flagged shards only (H1). |
| Session independence | Fail on doubled prefix (H2); all other date and prefix variants pass. Physical isolation unproven. |
| Committed reviews | Pass in flagged shards: missing report, non-ancestor report pin, pack-commit pin, changed note, changed pack id all `decision-review-report-missing`. Fail for unflagged shards (H1). Corpus rules lack a pin (M5). |
| Sensitivity secrecy and binding | Pass at tool level (H3/H4). Gate-level verification is declaration-only (M1). Normal packs expose `sectionText`; seeded packs recompute digests. |
| Sensitivity controls | Re-proof of same-batch controls and forged-control rejection pass (existing tests plus `p3.mjs`); thresholds remain 5/6 and 2/24; design weaknesses M2, M3. |
| Hold and rework | Pass. `p6.mjs`: `hold` on `unknown-blocking` stays `blocking` with `searched` kept and no `reviewedBy`; `rework`/`hold` on `promote` becomes `pending`; `ok` on `unknown-blocking` throws. |
| Legacy compatibility | Pass for shape: legacy pack needs a typed `--author`, rows gain no `authoredBy`, shard gains no `authorSession` or flag. The interpretation (current author from the committed `Author session:` header) is consistent with the frozen legacy exception. Gate never verifies those re-review pins (H1). |
| Rebind and coverage | Pass (`p3.mjs`, existing range tests). |
| Corpus, conflict, root data | Corpus classification and committed review pass; conflict receipts see M4; retiring roots reject directory selectors, `docs/platform/`, `docs/decisions/index.md`, non-`docs/` paths and traversal, and the union can only add retiring documents (fail-safe). |
| Reverse and status checks | Pass. `p7.mjs`: unnamed sibling and nested sibling included, other area excluded, pointer-back from a promoted document and candidate self-reference do not name units. Disabled when no shard is flagged (H1). Constitution consumes decisions; candidate-status scans untracked documents. |
| Restoration | Pass mechanically: unit and full digest must exist in the committed tree, deferral stub must exist (register and shards, except L1). The register's `reviewedDisposition.reviewer` is free text. |
| Vocabulary first use | Pass. Vocabulary and constitution diff is empty; `delete-as-duplicate` remains `reserved`. |

## Reproduced evidence

- Scripts suite: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/*.test.mjs` (51 files): tests 855, pass 855, fail 0, skipped 0, todo 0.
- Structural probe: exit 0, clean fixture zero findings, all 11 mutations rejected with their expected finding.
- Conservation D into scratch inventory (never in the repo): refreshed inventory at HEAD, then the gate with both A1 prior registries and the pilot decision directory: both exit 0, `fatalFindings` empty, parsed JSON of the two runs identical to each other, and identical to the same invocation run with the baseline `dbe5c4328` scripts (full JSON string equality). Open data: 1,387 files-unknown-blocking, 39,658 claims-unknown-blocking, 86,789 claims-not-reviewed.
- Red/green history (scratch worktree at each commit, test files changed by the test commit only): all 23 test commits fail before and pass at their implementation commit. Examples: `73416e048`/`8dcf162c4` 32 pass 2 fail then 34/0; `abc229123`/`b40b5af29` 1/4 then 5/0; `e14c88762`/`67e82caf7` 6/3 then 9/0; `738bcec1b`/`12704fb31` 9/3 then 12/0; `db2173b7b`/`69bb26162` 75/6 then 81/0; `a10b3dba4`/`1ec3ceca6` 3/1 then 4/0. Scratch worktree removed.
- Forbidden changes: extractor and its four frozen imports are blob-identical to `extractor-blobs.txt` at HEAD and have an empty diff since the baseline; vocabulary JSON and minimum constitution JSON have an empty diff; every changed path since the baseline is inside `allowed-paths.json` or one of the five A3 commit/path pairs; no `docs/`, instruction, legacy-root or main-checkout path changed; the diff's removed lines are replacements only, no invariant removed or relaxed; commit messages carry no AI or phase labels; each commit uses explicit paths (progress and tooling record files ride with their implementation commits).

## Probes (command, expected, actual)

All probe scripts and the fixture builder are under `/tmp/claude-1000/-home-vantt-projects-forgentX/4df9e88c-dcc7-4ca8-b24a-b69b112e7ced/scratchpad/review-tooling/probes/` (not committed). Fixture: the structural probe's own repository, rebuilt in scratch.

| Probe | Expected | Actual |
|---|---|---|
| p1 control, independent session | no findings | none |
| p1 same session, other date | `decision-self-review` | `decision-self-review` |
| p1 `reviewer:reviewer:` doubled prefix | `decision-self-review` | `[]` (bypass, H2) |
| p1 zero-width suffix | `decision-self-review` | `[]` (bypass, H2) |
| p1 unflagged shard: self-review, no report | fatal | `[]` (H1) |
| p1 unflagged shard: `script:` identities on a manual row | fatal | `[]` (H1) |
| p2 clean | exit 0 | exit 0 |
| p2 exact self-source / exact non-legacy source | `decision-exact-invalid` | `decision-exact-invalid` |
| p2 mirror outside `sources` / non-evidence mirror | `decision-mirror-invalid` | `decision-mirror-invalid` |
| p2 manual script identity | `decision-script-identity` | `decision-script-identity` |
| p2 missing report / changed note / changed pack id | `decision-review-report-missing` | `decision-review-report-missing` |
| p2 report pin on a side branch / pin before the report | `decision-review-report-missing` | `decision-review-report-missing` |
| p2 unflagged self-review and unflagged no-report under `--strict` | fatal | exit 0, no findings (H1) |
| p3 mechanical-diff reviewer on seeded pack | should not pass | 6/6 caught, 0/24 false, passes (M2) |
| p3 seed or nonce or mutation kind in public pack | absent | absent |
| p3 apply with failing sensitivity score | refuse | refused |
| p3 apply with author-generated key and verdicts | refuse ideally | accepted (inherent, M1) |
| p3 rebind under another heading / same ancestry renumber | pending / stays reviewed | pending / reviewed |
| p4 stale receipt after group grew; arbitrary evidence | still open | closed (M4) |
| p4 malformed, duplicate, unknown-kind receipt | reject | reject |
| p5 registry-gap `defer-with-owner` without stub | `decision-stub-invalid` | `[]` (L1) |
| p6 legacy pack without or with a malformed `--author` | reject | reject |
| p6 legacy apply shape; hold/rework/ok semantics | shape kept; A2 rules | as expected |
| p7 reverse candidates: sibling, nested sibling, pointer-back, self-reference | per request | as expected |
| p8 20-row batch seed pack | works | throws, cannot be reviewed (M3) |
| CLI `--decisions`: missing path, empty directory, trailing flag, option-looking value, duplicates | explicit failure | explicit failure |

## Unproven

- Physical session isolation. Every independence check compares declared strings. An author can write the pack, key, verdict table, report, and commit them; nothing in the repository distinguishes that from a real second session. H1, H2 and M1 narrow the paths, none can close this.
- Real-batch conservation check E against both owner-specified prior registries is not due and was not run.
- The 8 skipped and 65 todo tests of the full suite; I did not re-run the 389-file complete suite (7,318 tests recorded by the author).
- Restoration verdicts: the register's `reviewedDisposition.reviewer` has no independence or report binding, and the mechanical proof only shows that a committed unit with the stated digest exists.
- GitNexus is stale and was not used as a scope certificate; no JavaScript language server was available.

## Required fixes before any real batch

1. H1: make authorship, report and reverse-conservation checks mandatory for every non-legacy shard (red test first, pilot shards stay clean).
2. H2: normalize repeated `reviewer:` prefixes, case and invisible characters; reject a reviewer whose model segment starts with `reviewer:` (red tests first).
3. M1: record the gate-level pack and score bindings as declaration-only, or commit the key and seed verdicts and recompute at the gate.
4. M2, M3: decide and record the sensitivity pool (mutations from non-byte-equal rows; controls from other proven rows) or the accepted limitation; Lead/owner decision on the small-batch rule.
5. M4, M5: bind conflict receipts to group membership and a review reference; pin the report commit on corpus rules.
6. Low items L1 to L3 are cheap and should ride with the fix round; L4, L5 may be recorded.

The tooling is acceptable for continuing to the review brief, maps and baseline counts only after fixes 1 and 2 land and fix 3 is recorded; real batches must not be authored first.

Status: DONE
