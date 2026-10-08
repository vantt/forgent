# Tooling execution record

Executor: codex-session:1@2026-10-07
Date: 2026-10-07
State: ready-for-review; independent full tooling review not performed.

## Repeatable decision input

CLI contract: `node scripts/check-doc-inventory-gates.mjs --decisions <file-or-directory> [--decisions <file-or-directory> ...]`. Every supplied path is loaded in argument order; directory shards remain sorted by file name. Each path must be readable; each directory must hold at least one JSON shard. A missing value or option-looking value is rejected with an error naming `--decisions`. Decisions from all paths go through the existing combined duplicate and disposition validation. No flag means the same default as before; one flag keeps its existing behavior.

Scope: `runCli` only; existing `loadDecisionShards` reused unchanged. Tests added to the existing conservation CLI fixtures; no schema extension needed for this input-only tool.

Prior art: the single-input CLI and shard loader already exist. The phase explicitly authorizes extending the input cardinality, not replacing the loader or decision semantics.

Impact: GitNexus bound to `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`, index `738a3fc` (stale). Disambiguated upstream impact of `runCli` in `scripts/check-doc-inventory-gates.mjs`: LOW, 1 direct caller (the same script's entry), 0 affected processes/modules. The first ambiguous call was not used as proof. `detect-changes --scope all --repo <worktree>` reported no changes despite the added tests; that result is UNPROVEN as a scope certificate and was reported to the tool issue device. No JavaScript LSP server is available (only Rust configured).

## Verification

- Red commit: `73416e048`, tests only. `env -u CLAUDE_CODE_SESSION_ID node --test --test-name-pattern="gates CLI (combines repeated|rejects each)" test/scripts/check-doc-conservation.test.mjs`: 2 tests, 0 pass, 2 fail. Actual failure: later `--decisions` silently ignored.
- After implementation: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/check-doc-conservation.test.mjs`: 34 pass, 0 fail.
- Full scripts suite: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/*.test.mjs` (42 filenames expanded by Node): 786 pass, 0 fail, exit 0. Output retained in `/tmp/phase06/tooling-suite.log`; counts from the node:test footer, not shell text counting.
- Working-tree CLI smoke against the real scratch inventory: `node scripts/check-doc-inventory-gates.mjs --inventory /tmp/phase06/doc-inventory.json --identity-registry /tmp/phase06/identity-registry.json --decisions plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json --decisions plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json --json`: exit 0, 0 fatal findings, 87,061 not-reviewed rows. Both separate files contribute to the reviewed count; fixture probes additionally show that duplicates across inputs and later missing/empty inputs are rejected.
- D on the frozen Step 0 scratch inventory with the whole pilot directory: exit 0; parsed JSON exactly equal to `/tmp/phase06/gate-baseline.json` (no normalization needed).

No target, extractor, authority status or legacy-root content changed. Tests/code remain subject to the separate committed tooling review. Remaining tools, sensitivity mutations and area maps are UNPROVEN and not complete. The allowed report is the documentation of this repository-only CLI change; CHANGELOG.md is outside the phase's allowed paths and was not changed.

## Evidence mirror entries

Contract: shard version 1 adds `mirrors: [{path, target, blobSha}]`. Both paths must be inventory documents with the same full 40-character pinned blob id; the source must be legacy evidence under `docs/architect/<area>/verification/<collection>/`, listed in shard sources, and the target must be evidence in the same platform area. Every source unit must match a target unit at the same anchor and digest. The existing commit-blob integrity check rechecks inventory blob ids and content on every gate run. Normal claim/file duplicate checks also apply to expanded entries.

Expansion: every source row becomes `delete-as-duplicate`, `reviewed`, with the verified platform copy as owner, the corresponding unit anchor/digest, its own proof rationale and searched paths. Identities are `script:propose-doc-decisions` and `script:check-doc-inventory-gates`. The source file gets the matching disposition. Target rows are not implicitly reviewed. This channel implements Q1 a and Q2b yes, not a permission to hand-write script-reviewed claims.

Existing target lookup functions reuse the frozen mixed-file extractor for non-Markdown payloads, including the `file-block` anchor and digest. Markdown behavior is unchanged. No extractor function was edited. Mirror owners are registered through the same candidate/promoted inventory-owner rule as manual claim owners.

Prior art: `git log -S 'mirrors' -- scripts/check-doc-inventory-gates.mjs` returned no earlier mirror channel; the existing loader, normal claim validation, duplicate validation and committed blob verification were reused. GitNexus upstream calls for applyDecisions, both target lookup functions, loadDecisionShards and decidedPlatformOwners returned UNKNOWN/not-found from the old index. Scoped callsite evidence identifies checkInventory/CLI and the conservation tests. No graph result is claimed as a complete blast-radius certificate.

Verification:

- Red commit `abc229123`: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-decision-mirrors.test.mjs`: 1 pass, 4 fail, proving missing mirror expansion/proof and missing mixed-file target anchor support.
- After implementation: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-decision-mirrors.test.mjs test/scripts/check-doc-conservation.test.mjs`: 39 pass, 0 fail.
- Real working-tree smoke: D with both the pilot directory and `/tmp/phase06/mirror-smoke.json`, against the byte-identical `docs/architect/agent-coordination/verification/architecture-advisory-panel/current-cell.md` / platform copy, and `--previous-registry reports/identity-registry.json`: exit 0, 0 fatal findings. An initial smoke caught missing expanded-owner registration; the in-scope fix was verified by the passing smoke. No mirror decision shard is committed during this tooling step.
- D without the throwaway mirror shard, once per A1 prior-registry path: both exit 0, and both parsed results exactly equal the Step 0 baseline JSON.
- Full scripts suite at default concurrency: 791 tests, 790 pass, 1 fail. The existing canary-overhead test measured median 509.73 ms against its 250 ms limit. The failed test does not import the changed gate; its threshold and implementation were not edited.
- Scheduling-isolation run: `env -u CLAUDE_CODE_SESSION_ID node --test --test-concurrency=1 test/scripts/*.test.mjs` (43 paths expanded by Node): 791 pass, 0 fail, 35.63 seconds. This exercises every test without changing the threshold or excluding any path. Concurrency contention is an inference from this comparison, not a proven cause. Logs: `/tmp/phase06/mirror-suite.log`, `/tmp/phase06/mirror-suite-serial.log`.

Full tooling independent review, all later tools and the final mutation run remain UNPROVEN.

## Exact-carry proposals

Shard version stays 1. `exact: [{source, target, rows:[{claimId, sourceUnitDigest, targetUnitDigest}]}]` is expanded only after committed-unit proof: one target digest match, equal ancestor heading titles, at least 40 source characters, at least half the source document's units digest-exact. The gate derives the current target anchor by digest. No-match rows are Judgment; all matched rows that miss a threshold are Weak-exact with their demotion reasons, never script-reviewed. Manual proposed rows carry the author identity and remain pending or blocking; author metadata is additive schema data, not a substitute for the independent committed review report.

CLI contract: `node scripts/propose-doc-decisions.mjs --summary --inventory <manifest> [--repo-root <directory>] [--out <json>]`; `--propose` additionally requires `--source <path> --target <path> --shard <name> --author <identity>`. `--help` documents thresholds, input ownership and JSON outputs. Reuses the frozen inventory loader and unit extractors; no loader or extractor change. Summary includes per-area/class counts, multi-legacy duplicate groups, groups not all-mirror, history-read legacy paths and the five reconciliation sources.

Verification:

- Red commit `1f147b961`: exact test module fails to import the missing proposal tool.
- `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-decision-exact.test.mjs test/scripts/doc-decision-mirrors.test.mjs test/scripts/check-doc-conservation.test.mjs`: 44 pass, 0 fail.
- `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/*.test.mjs` (44 paths expanded by Node): 796 pass, 0 fail, default concurrency, 5.72 seconds; no scheduling override or exclusions. Scratch log: `/tmp/phase06/exact-full-suite.log`.
- Actual `--summary`: 1,040 source files / 22,426 rows; Mirror 12,882, Unit-exact 2,787, Weak-exact 971, Judgment 5,786. Reconciliation rows: 22 + 32 + 25 + 5 + 198 = 282. History-read legacy paths: 1,039. Recomputed counts, not planning estimates, govern later maps.
- Actual `--propose` for `docs/architect/agent-coordination/architecture/coordination-continuation-recovery.md` and its platform counterpart: 40 exact, 9 pending, 2 blocking. The gate with pilot decisions plus `/tmp/phase06/exact-smoke.json` exits 0 with 0 fatal findings. The smoke shard is not committed.

Remaining tooling, maps and independent full tooling review are UNPROVEN.

## Independent review packs and verdict application

`--pack <shard> --inventory <manifest>` emits full source/target units for every pending/blocking hand row and a reverse list of unnamed candidate units; script-exact and mirror carriers are included in reverse coverage. `--seed-pack <pack> --seed <text> --reviewer <identity> --out <pack.json> --key <key.json>` is reviewer-only, rejects author identities, and separates the key. It draws 24 byte-equal controls plus six actually changed targets (added claim, swapped number, swapped enum, removed negation, dropped clause, deleted list item), shuffled reproducibly. Insufficient eligible rows is an error, never fabricated evidence. `--score-pack <key> --verdicts <report.md>` requires every row exactly once and passes only at least 5/6 caught and at most 2/24 false flags.

`--apply-review <shard> --inventory <manifest> --verdicts <report.md> --reviewer <identity>` requires a matching `Reviewer:` header and `claimId | verdict | note` table. It rejects self-review, stale/missing sources, unknown/duplicate/missing verdicts, missing targets and approval of unknown-blocking. `ok` binds the current target digest; `rework` and `hold` stay pending with their note. The tool names the report in additive metadata; approval is not valid evidence until the independent report is committed and the final gate checks it. The tool edits only the shard, never a target.

Verification: red commit `de2c92e81` fails on the missing review exports. Targeted review/exact tests: 9 pass, 0 fail. Actual `--pack` on the throwaway exact proposal: 11 pending/blocking rows, full unit text, 1 unnamed reverse unit, exit 0. Complete suite: 800 pass, 0 fail, 45 files, default concurrency; scratch log `/tmp/phase06/review-full-suite.log`. Seed/key and review-application behavior are tested only on deterministic fixtures, not authored batch rows. No real seeded pack or actual approval was produced by this author session.

Both A1 D invocations after exact support (`db5ef01d4`) pass, 0 fatal findings, JSON exactly equal baseline. Full tooling review and remaining tools/maps remain UNPROVEN.

## Coverage, rebinding and dry-run snapshots

`--coverage --inventory <manifest> --maps <file-or-directory> [--decisions <path> ...]` counts inventory source files named in the first source cell of frozen map tables or mirror entries. Exact source paths with heading ranges and directory/** prefixes are accepted; target mentions do not cover a source. `--summary --coverage` combines reports. Empty/missing map inputs are errors; unmatched files stay explicit.

`--rebind <shard> --inventory <manifest>` preserves a reviewed row only for one match of its stored target digest in the same owner, deriving the current anchor and full digest. Zero/multiple matches return it to pending and remove approval identity/date; no reviewed row is invented.

`--snapshot --inventory <manifest> --identity-registry <registry> --decisions <path> ... --out <json>` applies normal decision proof, projects merged rows from sources outside docs/platform/ into the frozen claim-ledger schema, sorts by claim id and records sha256 of the rows. `--verify <snapshot>` with the same inputs recomputes both rows and sha256. The registry bytes must match the inventory metadata; registry-gap decisions use the existing registry overlay. This is a dry run, not the future sealed format. No frozen ledger schema or registry loader was changed.

Verification: red commit `7e94480f0` fails on missing helper exports. Targeted helper/review/exact tests: 12 pass, 0 fail. Coverage CLI fixture: 4,318 sources / 937 covered / 3,381 explicitly uncovered, exit 0. Rebind CLI on a throwaway pilot-shard copy: 52 reviewed rows preserved, 0 rebound, 0 pending, exit 0. Initial snapshot smoke caught missing registry input for seven gap decisions; the in-scope fix requires the pinned registry, not a loader amendment. Corrected snapshot and verify both exit 0: 68,372 rows, sha256 `4173ca0041d62dfa762fafc3763be8189ac60594436fe9be3813e84773ef0f47`. Full suite: 803 pass, 0 fail, 46 files, default concurrency; `/tmp/phase06/conservation-helper-suite.log`. No fixture map, smoke shard or snapshot is committed.

Both A1 D invocations after review-pack support (`b828e4896`) pass and exactly equal baseline. Independent full tooling review and remaining tools/maps are UNPROVEN.

## Stop: conflicting hold review status

After `789870507`, both A1 D proofs remain baseline-identical and the complete suite remains green at 803/803. A separately exercised edge reveals a contract conflict not covered by that suite: the review procedure requires hold/rework pending, but unknown-blocking requires blocking under the existing frozen invariant. Actual fixture command `env -u CLAUDE_CODE_SESSION_ID node /tmp/phase06/hold-status-probe.mjs` exits 1 with exactly one decision-blocking-status-mismatch. No real shard changes or approvals were made.

Execution stops for an owner amendment; see hold-status-blocker.md and owner-queue.md. Recommendation: retain blocking for unknown-blocking hold/rework, preserve pending for other dispositions, and leave the gate/vocabulary semantics unchanged. Full tooling review is not ready; later tools/maps remain UNPROVEN.

## Authorized review-status correction

A2 (`3693ade08`) preserves the frozen invariant: hold/rework on unknown-blocking stays blocking; other dispositions stay pending. Both keep the review note and searched evidence, without reviewedBy/reviewedAt. Reviewer procedure owns routing actual held unknown-blocking claims into owner-queue.md and holds.md; there are no actual held claims in tooling execution, so fixture claims are not added to those lists.

Red regression commit `8eb346727`: 4 pass, 2 fail (hold and rework returned pending). After the implementation fix, `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-decision-review.test.mjs test/scripts/check-doc-conservation.test.mjs`: 40 pass, 0 fail, including both outputs through unchanged applyDecisions. `env -u CLAUDE_CODE_SESSION_ID node /tmp/phase06/hold-status-probe.mjs`: exit 0, blocking retained, zero findings. Full default-concurrency suite: 805/805, 46 files. The inventory gate has no diff for this fix. Independent review's fixture-path hygiene finding is also corrected: fixture/review-example.md contains no phase label.

A3 (`4c10f2d50`) accounts only the exact five external commit/path pairs from `1cc92d7db`; amended check A reports zero violations, no blanket directory allowance. Both A1 D proofs at resume pass and equal baseline. B/C/I unchanged; ratchet clean; placement and expected retirement/candidate baselines unchanged.

The owner supplied the independent early review at `/tmp/claude-1000/-home-vantt-projects-forgentX/4df9e88c-dcc7-4ca8-b24a-b69b112e7ced/scratchpad/early-review/tools-T0-T2x.md`, pinned to `789870507`. T0 accepted; T1/T2/T2r/T2x accepted with fixes. Session normalization, pre-reviewed-row evidence, seeded-pack secrecy/digests, score/text binding, exact source/multiplicity, ancestry-sensitive rebind and range-aware legacy-only coverage remain to be fixed with red/green proof before any real batch. No final tooling review or real approval is claimed.

## Early review: session identity, fail-closed rows and seed secrecy

Red commit `e14c88762`: 6 pass, 3 fail, exposing same-session/different-date review, silent pre-reviewed-row skipping and public seed leakage. Session comparison now removes reviewer: and @date; absent author identity is not independent. Pack/apply fail closed on pre-reviewed rows rather than skipping them until committed-report validation is integrated with the independence gate. Authorship-required shards require authorSession.

Sensitivity selection and order use a fresh cryptographic 32-byte nonce together with the recorded seed. Neither is in the public pack; both stay in the key for replay. All shown target text digests are recomputed from the shown text, including mutated rows; no mutated target retains its original digest. Deterministic fixture replay supplies the recorded nonce; the CLI generates its nonce internally. No real seeded pack is run by the author.

Targeted review tests: 9/9. Complete suite: 808/808, default concurrency; `/tmp/phase06/review-integrity-suite.log`. Actual unreviewed --pack smoke exits 0. Source/extractor/vocabulary invariants are unchanged. Passing sensitivity/text binding, final committed-report validation, exact source/multiplicity, rebind ancestry and legacy/range coverage still require their separate proofs. Full independent tooling review remains UNPROVEN.

## Early review: sensitivity and shown-text approval binding

Red `738bcec1b`: 9 pass, 3 fail, demonstrating approval without a passing sensitivity proof, approval attached to target drift, and missing per-row seen-context/report bindings. Red `16cfe540e`: 4 pass, 1 fail, demonstrating that heading rows hid the payload their frozen digest binds.

Review packs now carry sourceUnitDigest and targetUnitDigest per row. Sensitivity keys bind the full original pack digest and commit; apply replays the key with its private nonce and verifies the chosen thresholds. The manual report must echo Pack commit, Pack id and Seed score headers; CLI apply requires --review-pack, --seed-key and --seed-verdicts. Approval checks source/decision bindings and current target text, full heading payload and ancestry against what was shown, then stamps the shown digest, not a new application-time digest. Each approved row records its report, pack commit/id, score id and seen ancestry; later committed-report integration will preserve earlier-round proofs.

The committed-unit helper adds sectionText for review display only. Unit text, identity, anchors, frozen extraction and exact-class thresholds are unchanged. This exposes heading payloads without redefining a conservation unit. Seed display also uses full heading payloads, selects byte-equal digest-equal controls, removes original target binding metadata and recomputes shown-text digests. Seed/nonce remain private.

Verification: targeted review/exact/conservation helper suite 20/20. Full default-concurrency suite 811/811; /tmp/phase06/review-binding-suite.log. Actual full-text pack smoke exits 0, 11 rows, 10 displayed source heading sections. `env -u CLAUDE_CODE_SESSION_ID node /tmp/phase06/review-binding-smoke.mjs`: exit 0; synthetic-only sensitivity caught 6/6, 0 false flags, no public seed/nonce, hold and rework blocking, 34 fixture approvals and 0 decision-gate findings. No actual approval or real seeded pack was produced.

Exact-source/multiplicity and ancestry/range fixes, committed-report integration, remaining tools/maps and full independent tooling review remain UNPROVEN.

## Early review: legacy-only exact proof and occurrence conservation

Red `e3fa0f11f`: 5 pass, 2 fail. Gate and proposal now require a distinct legacy platform-authority source outside docs/platform/; canonical self-carries, candidate sources and consumer-project sources cannot earn script review. Shared isLegacySourceItem preserves the original summary's source definition. Repeated source digests with more occurrences than the target are Weak-exact and require manual review; a forced exact entry is rejected for each affected claim. Existing target uniqueness, ancestor titles, 40-character threshold and half-document exact-share thresholds remain unchanged.

Targeted exact/mirror/conservation tests: 46/46. Full suite: 813/813. Actual --summary remains 1,040 files / 22,426 rows, Mirror 12,882, Unit-exact 2,787, Weak-exact 971, Judgment 5,786. A regenerated throwaway --propose output passes the actual gate with pilot plus scratch decisions: exit 0, zero fatal findings. No proposal shard or inventory part is committed.

## Early review: ancestry-bound rebind and legacy range coverage

Red `455589e5a`: 3 pass, 2 fail. Rebind now preserves approval only for one digest match with the recorded targetAncestry unchanged; missing ancestry also fails closed to pending. A block moved under another heading cannot inherit review merely because its text digest is unchanged. Same-context anchor renumbering remains valid.

Coverage uses the same legacy-source predicate as summary/exact proof, excluding canonical candidates and non-authority corpora. Only Source tables count, not legend tables or target cells. Backticked source cells support whole paths, directory/**, path#anchor and inclusive path#start..end sections. Heading sections include descendants until the next same-or-higher heading. Partial ranges cover only their committed units; all source rows must be covered before the file counts as covered. Missing/reversed anchors fail rather than granting coverage. Mirror entries name whole legacy sources.

Verification: targeted conservation suite 5/5; full default-concurrency scripts suite 815/815 in 46 files. `env -u CLAUDE_CODE_SESSION_ID node /tmp/phase06/conservation-boundary-smoke.mjs` exercises real committed units: runner.md has 470 rows; #dispatch-runtime-inspection leaves the source uncovered, whole-file mapping covers it. A real candidate unit preserves review in the recorded context and becomes pending for different recorded ancestry. Actual coverage CLI reports 1,040 legacy files, 937 covered by the scratch coordination map, 103 uncovered. These are isolated smoke fixtures, not real approvals or frozen area maps.

T8 committed-report validation remains required; the interim pre-reviewed guard is intentionally fail closed. Remaining tooling/maps and full independent review remain UNPROVEN.

## Classified non-authority corpus decisions

Red f86f26c3b: 0/6; pending-policy boundary ed37e57cb: 1 pass/6 fail. Additive corpusRules entries name corpus, disposition, rationale, reviewStatus and authoredBy, with optional claimKind and independent review metadata. History-evidence retains evidence; user-knowledge and consumer-project reclassify out of platform scope. The whole currently classified corpus must be named in sources and every selected item must be non-authority. No platform-authority rule exists.

Pending rules approve nothing. Reviewed rules require human authoredBy, authorSession and a different normalized reviewer session. The report is read only from the pinned committed tree, under reports/phase-06/review-<step>-<shard>.md. It must name the exact Reviewer, Corpus, Rule digest and one corpus:<name> | ok | own note verdict. corpusRuleDigest hashes JSON with ordered corpus, disposition, rationale and optional claimKind fields; approval metadata is not part of the policy digest. Changed policy, uncommitted report, reviewer mismatch, self-session review or forged script authorship cannot approve rows.

The gate expands all selected rows and files, preserving human authorship, reviewer/date/report and adding each item's classification to its rationale. Existing row/file duplicate detection remains active. Loader and additive shard schema accept the same corpusRules shape; version stays 1. Snapshot passes repoRoot so it uses committed rule proofs too.

Verification: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-corpus-decisions.test.mjs`: 7/7. Full scripts suite 822/822 in 47 files. Actual CLI uses pilot decisions plus /tmp/phase06/corpus-pending-smoke.json: exit 0 and exact baseline JSON; corpus-uncommitted-smoke.json: exit 1 with decision-corpus-review-invalid. Both invoke check-doc-inventory-gates.mjs with scratch inventory/registry and --previous-registry reports/identity-registry.json. Positive committed-review expansion is exercised only in isolated test repositories; no real corpus rule, reviewer report or decision approval is authored. Remaining tooling/maps and final independent review remain UNPROVEN.

## Recorded conflict-group closure

Red 2f8d82a55: 29 pass/3 fail. Historical-record boundary 72bffade8 preserves evidence after a group disappears; it never closes a different current group. No recorded decision is silently discarded merely because later candidate transformation changes blob groups.

check-doc-retirement.mjs accepts optional --conflict-resolutions <file>, defaulting to ledger/conflict-resolutions.json beside the constitution. An absent default preserves the existing report; an explicit missing path is fatal. Shape: version 1, groups with kind duplicate or semantic, exact blobSha/key, nonempty resolution and rule, and a nonempty array of evidence strings. Malformed and duplicate kind/key records fail. Only exact current keys close groups; historical keys remain harmless receipts. The existing all-evidence-mirror exclusion is unchanged. This is optional migration input, not an fgOS config or infrastructure dependency.

no-unresolved-conflicts consumes this data; every unnamed current group still blocks. CLI catches invalid resolution input and returns 1 rather than granting closure. No frozen constitution check or law changes.

Verification: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/check-doc-retirement.test.mjs`: 33/33. Full scripts suite: 826/826 in 47 files. Actual `node scripts/check-doc-retirement.mjs --inventory /tmp/phase06/doc-inventory.json --identity-registry /tmp/phase06/identity-registry.json --previous-registry plans/260925-documentation-authority-unification/reports/identity-registry.json --cutover --json`: expected exit 1, 15 blocked/4 pass/1 review, 0 invariant failures, 4 duplicate and 151 semantic groups open. Adding --conflict-resolutions /tmp/phase06/conflict-resolution-smoke.json leaves 3 duplicate and 150 semantic groups open and all other statuses unchanged. Explicit missing input returns 1 and names its path. Smoke entries are labelled fixture-only; no real group decision or resolution ledger is committed.

## Named retiring documents

Red c1bdc4c74: 33 pass/3 fail. Retirement now accepts optional --retiring-roots <file>, default ledger/retiring-roots.json beside the constitution. Shape: {version:1, documents:[repository-relative exact docs file paths]}. No configurable directory-root field exists: docs/specs/ and docs/architect/ always remain legacy. Instructions outside docs/, candidate docs/platform/ paths, directory selectors, traversal and the owner-kept docs/decisions/index.md projection are rejected.

History coverage and authority-consumer counts share the exact named-file predicate. A retiring root file is itself a legacy reader; neighboring paths are not captured by prefix. Bare-path aliases still cover a file; an anchor-only alias does not. An absent default preserves existing behavior; an explicit missing file is fatal. Optional repository-only migration data adds no setup/doctor dependency. Actual root membership is authored and frozen with the area maps, not by these smoke inputs.

Verification: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/check-doc-retirement.test.mjs`: 36/36. Full scripts suite: 829/829 in 47 files. Actual retirement command from the prior section, with --retiring-roots /tmp/phase06/retiring-roots-smoke.json, includes io-contract.md and doc-governance.md: expected exit 1, unchanged 15 blocked/4 pass/1 review, 0 invariants. History paths become 996 from 994; authority-consumer upper bound becomes 4,001 from 3,917. These current counts are recomputed, not the planning estimates. No root ledger, legacy document or authority status is changed.

## Reverse candidate conservation and CLI decision inputs

Red db2173b7b: 75 pass/6 fail. Corrected targeted run: 81/81; full scripts suite: 836/836 in 48 files. Existing version-1 shards remain supported; authorshipRequired enables the additive reverse report for new material. Candidate self-references do not establish source ownership. Explicit source rows, exact carriers and mirror carriers name only their own anchors; a parent anchor never names all children. A scoped legacy source inspects its target area, including unnamed sibling documents, rather than only declared outputs. Promoted canonical sources cannot certify candidate units.

The gate exposes every missing candidate unit in explicitOpenFindings.unreferencedCandidateRows and summarizes candidate-blocks-unreferenced in conservationOpen. Default reporting leaves this debt open; strict mode blocks it. Actual scoped CLI with pilot and exact-smoke inputs lists 16,820 target-area gaps, zero fatal findings by default, and exits 1 in strict mode with the same reverse blocking type. This is a scratch proposal, not an approved batch.

Constitution accepts repeated --decisions, validates committed source blobs and unit coverage, and overlays the same decision expansion before ledger classification. With the actual refreshed scratch inventory, registry, pilot directory and exact-smoke input, it returns 0 with 87,153 ledger rows, 478 promote and 1 supersede, without fatal findings. Its no-decision baseline remains unchanged.

Candidate-status discovery includes tracked and untracked, nonignored Markdown under docs/platform/. Other callers of trackedPlatformDocs retain tracked-only behavior. The actual CLI in an isolated temporary repository returns 1 for an untracked candidate without required metadata, then 0 after the candidateCore fields are supplied. No candidate header semantics or frozen gate invariant was loosened. Smoke artifacts are temporary and no actual candidate material is written before independent tooling review.

## Committed independent row review

Red e9edcb03f: 0 pass/7 fail. Shared validateManualReview now checks manual rows in authorshipRequired shards and verifies all pre-reviewed rows before pack/apply. Script-generated mirror/exact expansions retain their re-proven provenance; reviewed corpus rules retain their separately committed rule proof. A manual script identity is fatal and cannot claim either exemption.

Session comparison shares reviewSessionIdentity: reviewer: and @date cannot distinguish a session from itself. Reviewed manual rows require authoredBy and authorSession. A valid report is a normalized repository-relative review-<step>-<shard>.md under reports/phase-06, committed at the recorded tree, with a matching Reviewer, Pack commit, Pack id, Seed score, and the claim's ok verdict and own note. Missing or mismatched evidence is fatal. The report pin must be an ancestor of the inventory commit, not another branch or a future tree. The committed reader caches paths and ancestry checks.

Each approval carries reviewReportCommit as well as its existing report/pack/score bindings. Apply reads committed HEAD evidence before returning an actual repository-backed approval; later rounds preserve previously approved rows and their individual pins. A working-tree report alone cannot flip a row. Legacy pilot shards leave authorshipRequired off, preserving the frozen baseline; pack/apply still fail closed on unverifiable old reviewed rows rather than silently passing them through.

Verification: targeted authorship and corpus tests 15/15; full scripts suite 844/844 in 49 files. Escaped-note boundary red 9a062d31b has 7 pass/1 fail; the shared verifier now uses the existing verdict parser's escaped-pipe convention. Actual CLI rehearsal in a temporary Git fixture exercised pack, seed-pack, score-pack, apply-review and a subsequent pack: 61 distinct units, passing sensitivity score, uncommitted application exit 1, committed application exit 0, repeat pack exit 0 with no pending rows, 0 decision invariant findings. Fixture review identities are synthetic and this produces no real batch approval. No frozen conservation invariant is loosened.

## First-use vocabulary timing

The usage-only amendment is recorded after each reserved disposition's actual first use. Tool/test fixtures and scratch proposals do not substitute for a real authored decision. No unused disposition is prematurely marked in-use. The review brief must carry this first-use dependency into authoring; definitions and rule text remain unchanged.

## Restored claims and committed deferral stubs

Red 9fa7ac044: 1 pass/4 fail. A restored register decision must name a docs/platform owner, existing conservation-unit anchor and complete 64-character unitDigest, recomputed from the inventory's committed tree. Working-tree content cannot supply the proof. A defer-with-owner decision, in either a shard or the register, needs stubOwner and stubAnchor pointing to an existing committed platform unit. Pending deferrals are not allowed to hide a nonexistent stub. Shard expansion preserves both stub fields, and review application binds them to the shown decision.

Verification: restoration and existing mirror probes 10/10; full scripts suite 849/849 in 50 files. The short-unit probe commits two distinct legacy files sharing Brief.; multiple target owners remain explicitly blocking. The existing synthetic four-copy probe (two legacy, two platform) still passes only with one owner.

Actual gate CLI with fixture-only scratch registers: matching committed target digest exit 0 with 0 fatal findings; missing anchor and stale digest exit 1 with dropped-claim-restore-invalid; nonexistent deferred stub exit 1 with dropped-claim-stub-invalid. This proves mechanical target binding only, not that any real dropped content was restored or independently approved. No production register entry is edited and no real restoration/deferral verdict is authored.

## Source digest prefix compatibility

Red abba648f6: the review test suite has 12 pass/1 fail; an actual CLI pack rejects a schema-valid 16-character source digest as stale. Pack/apply now use the gate's minimum-16-character prefix comparison. Pack source bindings and the reviewed target digest remain complete hashes; shorter and mismatching prefixes are rejected.

Verification: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-decision-review.test.mjs` has 13/13 passing tests; all 50 scripts test files have 850/850. The actual scratch proposal pack accepts all 11 pending rows with 16-character source prefixes and full 64-character source bindings (exit 0). No gate invariant, previous-registry loader or legacy decision record changes.

## Human-readable diff artifacts

Red 25529054c: 0 pass/2 fail. The initial JSON-only pack interface above is superseded. Normal and seeded pack modes now write Markdown: full source/target text, proposed-decision table and a Git unified diff per row; the normal pack also shows unmatched reverse units. Nested code fences are enclosed safely. The bound JSON representation stays unchanged and is written to `<out>.json` beside a named Markdown output. Seed scoring and review application read that machine sidecar; reviewers read the Markdown.

```sh
node scripts/propose-doc-decisions.mjs --pack <shard.json> --inventory <inventory.json> --out <pack.md>
node scripts/propose-doc-decisions.mjs --seed-pack <pack.md.json> --reviewer <reviewer> --seed <private-seed> --out <seeded.md> --key <private-key.json>
node scripts/propose-doc-decisions.mjs --apply-review <shard.json> --inventory <inventory.json> --reviewer <reviewer> --verdicts <committed-report.md> --review-pack <pack.md.json> --seed-key <private-key.json> --seed-verdicts <seed-verdicts.md>
```

Verification: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-review-format.test.mjs` exercises the real CLI in isolated committed fixtures: readable numeric difference, nested source code fences, public seeded Markdown, private-key/sidecar collision rejection before any output write, and 6/6 caught with 0 false flags. All 51 scripts test files: 852/852. Actual working-tree-source scratch pack: exit 0, 11 pending rows and a reverse section; observed Markdown and full-hash machine sidecar. No real reviewer or approval is claimed. JSON output of other modes and both source/target unit hash definitions remain unchanged.

## Same-batch sensitivity controls

Red b9f3f6c67: the actual fixture --propose -> --pack -> --seed-pack flow fails after valid exact carries are excluded from pending review rows (2 pass/1 fail). The sensitivity pack now draws from pending rows plus separately recorded same-batch controls: current exact/mirror carries re-proven by the unchanged gate overlay, and independently reviewed rows whose current target digest and ancestry remain unchanged. Controls do not reopen accepted decisions. Source/target text and full heading context must still be byte-equal; six distinct mutations and 24 controls, thresholds and private nonce remain unchanged.

The proposal pack fails closed on a poisoned exact proof. Applying a verdict rebuilds the control set against committed batch inputs and rejects invented controls even when their sensitivity score passes. No source, target or script identity is accepted merely from an unverified control declaration.

Verification: 854/854 across 51 scripts test files. Actual isolated modern CLI: 61 units; uncommitted approval rejected (exit 1), committed fixture report accepted (exit 0), subsequent pack accepted, unchanged decision invariants 0. A one-row rationale rework then uses 60 unchanged reviewed controls, seeds/scores successfully, commits a separate fixture-only report, reapplies only that row and preserves the other rows' original report pins; unchanged overlay again has 0 findings. These are synthetic mechanical proofs, not genuine batch approvals. Legacy-row compatibility and full independent tooling review remain UNPROVEN.

## Legacy re-review without fabricated row authorship

Red a10b3dba4: the real isolated CLI regression has 3 pass/1 fail because a declared legacy pack author was ignored. Legacy shards now require an explicit current review author in `--pack --author codex-session:<id>@<date>` and an identical `Author session:` header in the committed review report. This is current re-review provenance, not a claim about the historical row author. The old shard keeps its original shape: no invented `authoredBy`, no added `authorSession`, no enabled `authorshipRequired`. New shards still require their original author identities. Same-session comparison, committed-report binding and sensitivity thresholds remain mandatory.

The reviewer must specifically check this compatibility interpretation against the frozen legacy-shape exception and the new-shard authorship requirements. A missing, malformed, self-reviewing or mismatched report author is not an approval. Existing legacy rows marked reviewed without valid committed review proof remain rejected by pack/apply.

Verification: targeted review/format/authorship tests 26/26; all 51 scripts test files 855/855. The real legacy fixture rejects an uncommitted report, accepts the matching committed independent report, preserves absent legacy author fields, repacks verified rows, and rejects a forged same-session report author. A scratch clone of the actual old I/O shard rebinds and renders 41 rows with explicit current author and unchanged legacy shape; no genuine seed or approval was produced for repository rows.

## Complete suite and structural gate proof

The complete existing test discovery selected 389 files. Command: `env -u CLAUDE_CODE_SESSION_ID node --test <all 389 discovered test files>`. Environment uses the existing runner's `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` and checkout-local `CARGO_TARGET_DIR`/`FGOS_HOST_BIN`; no new skip branch or test filter. Result on committed tooling `1ec3ceca6`: exit 0; 7,318 tests, 7,245 pass, 0 fail, 8 skipped, 65 todo. Skipped/todo cases are not claimed as proven. Scratch log: `/tmp/phase06/full-suite-committed.log`.

Both invocation-only conservation proofs pass and their complete JSON remains identical to the saved baseline: run the gate once with `reports/identity-registry.json`, once with `reports/phase-02-identity-registry.json`. The previous-registry loader and default gate invariants are unchanged.

Portable structural probe: `node plans/260925-documentation-authority-unification/reports/phase-06/structural-mutation-probe.mjs`. It creates an isolated committed fixture, invokes the actual scoped strict CLI with that fixture's previous registry, accepts the clean copy with zero findings, and rejects all 11 mutations: removed row, missing anchor, duplicate row, unknown id, missing reviewer, stale source, stale target, self-review, unequal mirror, changed exact digest, restore without anchor. Fixture reports are synthetic proofs, never real batch reviews. This is not a real-batch E closure; real-batch E must later run separately against each of the two owner-specified prior registries.

Independent full tooling review remains UNPROVEN. No real batch authoring, first-use vocabulary promotion, area-map freeze, route change, approval or authority cutover has occurred.

## Mandatory authorship correction under A5

Owner amendment `a7ec5054a` freezes tooling at `1ec3ceca6` plus H1 only and supersedes A4. Every non-legacy human-decision shard requires its author session; reviewed judgment rows require row authorship and a matching committed independent report regardless of the optional legacy flag. Compatibility is limited to the seven fingerprinted original legacy cohorts, not arbitrary authorless shards.

H1 red commit `7667c4754`: 15 tests, 8 pass, 7 fail. Corrected scripts suite: 51 discovered files, 861/861 pass, no failures/skips/todo. Existing reviewed fixtures now carry committed report evidence; no production gate is bypassed. Frozen structural CLI probe: clean zero findings, all eleven defects rejected.

Non-H1 regression changes were reverted in `ab69e3d6b`. H2, M1–M5 and Low changes are withdrawn; released-key replay, extra normalization and other withdrawn safeguards are not claimed. Their fixture-only earlier evidence is not evidence for this cutover. No further tooling re-review is requested.

A5 requires ordinary content reviews to read every judgment row, sample 100 random script-proven exact rows, run gates and commit a report. Seeded packs and reviewer red-team are reserved for the checkpoints after Steps 3 and 6 and in Step 10. The actual unseeded rehearsal demonstrates an incompatible frozen approval guard; see unseeded-review-blocker.md. No real approval has been produced.

Committed H1 green `658b4e602`: full suite 7,324 tests, 7,251 pass, zero fail, 8 skip, 65 todo; both prior-registry D proofs baseline-identical with zero fatal findings. Skipped/todo paths and actual batch E remain UNPROVEN. The review brief is written to A5; ordinary approval awaits the owner decision recorded in owner-queue.md, not a tooling re-review.

## Ordinary approvals authorized by A6

Committed A6 (`8bc686954`) resolves the unseeded-review blocker with one narrow channel change. Ordinary reports declare `Review mode: ordinary` and carry Claim/Verdict/Note/Source digest/Target digest columns, with full hashes and `none` for no target. Apply verifies current text against the committed independent verdict, keeps H1 and session independence, pins the report and stamps its shown target digest. Neither a seed nor a pack id is required.

Checkpoint reports use `review-3-checkpoint.md`, `review-6-checkpoint.md` or `review-10-checkpoint.md`, optionally with a shard suffix; an ordinary declaration cannot bypass checkpoint proof. Their original key replay, threshold, pack, author, decision, target-text/ancestry and control bindings remain unchanged. Earlier seeded approvals retain their old proof path.

Tests-first red: `452206652`. Corrected scripts suite: 872/872. Actual isolated CLI rehearsal: ordinary 40 approved fixture rows, no seed used, zero gate findings; checkpoint 40 approved fixture rows, 6/6 mutations caught, zero false flags, zero gate findings. These fixtures prove mechanics, not human judgment or real-session independence. No non-H1 review finding is reopened.

