# Step 4 source-owner authoring request — prepared, not executed

Input: `3732d245d75d7c40b7206ac53707821176c471ec`. Step 3 is CLOSED under L12-56: its 1,037 records and earlier review requests stay unchanged. Read the phase file shared rules, Steps 2–5 and review-volume map, owner A51 and L12-7/9/10/11/14/21–56. This request covers class-1/2 consumers outside the class-3 file set, plus maintained comment/help slots from accepted class-4/6 census identities. It does not authorize consumer edits, Phase 9, a reviewer launch or self-acceptance.

There are **309 edge-bearing files / 833 joined slots / 268 source-owner records**, including render-only joins and explicit preserve records. **0 apply-now**; 105 Phase 9, 724 preserve, 4 park. Step 4 therefore reduces to authoring Phase 9 patch-spec records, preserve/park records and source→render provenance. It does not imply all source records need a non-empty diff. Almost every live edge into the retiring trees remains Phase 9 timing, as in Step 3. Historical evidence/portable topology stays literal. `step-04-population.json` is the exhaustive identity/classification table; its per-owner counts and all original census joins are authoritative inputs, not semantic acceptance. `step-04-population-gaps.json` carries completeness/provenance limits.

## Source-owner batches and budget

Exact files and reused edge ids are frozen in `step-04-batches.json`; no made-up consumer edge ids. Cap each part at **60 joined edges AND 400,000 UTF-8 bytes**, including context and joins. The estimates below use 360,000 bytes to leave room for request framing. Read each entire source file before authoring; stream a large source into ≤400 KB sections while retaining ONE per-file record/diff/verdict and the same logical request identity. Do not split a semantic file judgment or silently re-seed a set. A source's generated outputs remain joined to that source, never hand-edit targets. If actual diff/context grows, partition more parts before dispatch. The JSON estimates full source context plus current census metadata; exact diff/target passages are still unknown, so Lead must freeze actual byte sizes and reviewer time before authoring.

| Batch | Source owner | Files | Edges | now / P9 / preserve / park | Source/context parts (estimate) | Author pairs / accounting parts | Conditional P9 pairs / parts |
|---|---|---:|---:|---|---:|---|---|
| step04-001 | domain skills/task specs | 29 | 57 | 0 / 3 / 54 / 0 | 1 | 5 / 1 | 8 / 1 |
| step04-002 | domain skills/task specs | 15 | 44 | 0 / 3 / 41 / 0 | 1 | 5 / 1 | 8 / 1 |
| step04-003 | historical evidence (preserve-only) | 44 | 58 | 0 / 0 / 58 / 0 | 1 | 5 / 1 | 5 / 1 |
| step04-004 | historical evidence (preserve-only) | 40 | 55 | 0 / 0 / 55 / 0 | 1 | 5 / 1 | 5 / 1 |
| step04-005 | historical evidence (preserve-only) | 9 | 59 | 0 / 0 / 59 / 0 | 1 | 5 / 1 | 5 / 1 |
| step04-006 | historical evidence (preserve-only) | 19 | 53 | 0 / 0 / 53 / 0 | 1 | 5 / 1 | 5 / 1 |
| step04-007 | historical evidence (preserve-only) | 2 | 2 | 0 / 0 / 2 / 0 | 1 | 5 / 1 | 5 / 1 |
| step04-008 | host/plugin provenance (render-only) | 15 | 31 | 0 / 0 / 31 / 0 | 1 | 5 / 1 | 5 / 1 |
| step04-009 | instructions/navigation | 4 | 51 | 0 / 43 / 8 / 0 | 1 | 5 / 1 | 7 / 1 |
| step04-010 | maintained CLI comments/help | 1 | 36 | 0 / 3 / 33 / 0 | 1 | 5 / 1 | 6 / 1 |
| step04-011 | maintained CLI comments/help | 1 | 15 | 0 / 2 / 13 / 0 | 1 | 5 / 1 | 6 / 1 |
| step04-012 | maintained comments/apps/fgos-gateway | 15 | 51 | 0 / 4 / 47 / 0 | 1 | 5 / 1 | 8 / 1 |
| step04-013 | maintained comments/config | 2 | 3 | 0 / 0 / 3 / 0 | 1 | 5 / 1 | 5 / 1 |
| step04-014 | maintained comments/install | 1 | 1 | 0 / 0 / 1 / 0 | 1 | 5 / 1 | 5 / 1 |
| step04-015 | maintained comments/intake | 4 | 22 | 0 / 0 / 22 / 0 | 1 | 5 / 1 | 5 / 1 |
| step04-016 | maintained comments/other | 2 | 4 | 0 / 0 / 4 / 0 | 1 | 5 / 1 | 5 / 1 |
| step04-017 | maintained comments/other | 1 | 1 | 0 / 0 / 1 / 0 | 2 | 5 / 1 | 5 / 1 |
| step04-018 | maintained comments/other | 9 | 15 | 0 / 0 / 15 / 0 | 1 | 5 / 1 | 5 / 1 |
| step04-019 | maintained comments/packages/distribution | 5 | 6 | 0 / 6 / 0 / 0 | 1 | 5 / 1 | 10 / 1 |
| step04-020 | maintained comments/packages/herdr-fgos-common | 2 | 4 | 0 / 0 / 4 / 0 | 1 | 5 / 1 | 5 / 1 |
| step04-021 | maintained comments/packages/host-runtime | 1 | 1 | 0 / 0 / 1 / 0 | 1 | 5 / 1 | 5 / 1 |
| step04-022 | maintained comments/runner | 7 | 10 | 0 / 1 / 9 / 0 | 1 | 5 / 1 | 6 / 1 |
| step04-023 | maintained comments/runner | 10 | 20 | 0 / 7 / 13 / 0 | 1 | 5 / 1 | 12 / 1 |
| step04-024 | maintained comments/runner | 8 | 23 | 0 / 3 / 20 / 0 | 1 | 5 / 1 | 8 / 1 |
| step04-025 | maintained comments/runner | 6 | 36 | 0 / 2 / 34 / 0 | 1 | 5 / 1 | 7 / 1 |
| step04-026 | maintained comments/state | 16 | 52 | 0 / 14 / 38 / 0 | 1 | 5 / 1 | 10 / 1 |
| step04-027 | maintained comments/state | 4 | 27 | 0 / 5 / 22 / 0 | 1 | 5 / 1 | 6 / 1 |
| step04-028 | maintained comments/util | 2 | 4 | 0 / 0 / 4 / 0 | 1 | 5 / 1 | 5 / 1 |
| step04-029 | maintained comments/verbs | 4 | 17 | 0 / 0 / 17 / 0 | 1 | 5 / 1 | 5 / 1 |
| step04-030 | shared skills/prompts | 16 | 55 | 0 / 3 / 49 / 3 | 1 | 5 / 1 | 8 / 1 |
| step04-031 | shared skills/prompts | 7 | 10 | 0 / 3 / 6 / 1 | 1 | 5 / 1 | 8 / 1 |

| step04-032 | new worker-contract source/render census gap | 3 | 3 | 0 / 3 / 0 / 0 | 1 | 5 / 1 | pending census |
| step04-033 | new main historical report/plan census gaps | 5 | 7 | 0 / 0 / 7 / 0 | 1 | 5 / 1 | preserve only |


Totals: 31 existing batches plus two supplementary gap groups, 34 estimated source/context review parts; 165 estimated author commit/path pairs and 33 additional accounting parts. **These are estimates, not real committed pairs or accepted review volume.** For this zero-apply preparation, each later author batch assumes five report writes (record file, frozen manifest, request, verification receipt, progress), zero source/render mutations. A future authorized source/render batch counts every changed source AND every generated output path plus its actual reports. Conditional Phase 9 path estimates in the last column use only presently identified Phase 9 sources/renders; they are not Phase 8 permission and do not cover unknown generated deltas. Render-only preserve joins incur no consumer commit/path pair. Never bill the entire render tree when it did not change.

For EVERY render batch, separate pair-accounting review requires **≥ceil(actual unique (commit,path) pairs / 60) parts**, and more for the 400 KB limit, covering each pair in BOTH Phase 6 exception literals. Hundreds of outputs are hundreds of pairs, not one source record. Source/render review does not replace this review. L12-11: runner makes the real author commit; Lead supplies that id to a separate accounting-only Unit, writes the exact pairs to both unchanged manifests, and records its real accounting commit. No guessed ids, checker/allowlist/frozen-B changes. Batch end is clean committed bytes AFTER accounting; both audits/checks and reproduction tests must pass there. Lead assigns time from measured throughput before authoring; the initial 4–6 reviewer days do not absorb these parts. One bounded re-review; unresolved findings return to Lead while unrelated batches continue.

## Per-file record and provenance schema

Reuse Step 3's one-file/one-diff record. Preserve `inventoryInputCommit`, `authorInputCommit`, `inventoryFileDigest`, `digest`, `inventoryEdgeIds`, `diff`, `edges`, `checks`, `reviewSet`, `authoringRules`. Multiple Step 2 inputs are represented explicitly in `inventoryInputs` and `inventoryRefs`, never forced into the class-3 `maps-j` pin. One complete source diff or empty diff per actual canonical source; render file records are provenance joins with no hand-authored diff. Headerless host/plugin sources remain non-executable pending owner resolution. Every physical source file is read whole; every original edge id/disposition is mechanically accounted, including several ids naming the same complete unit.

```json
{"file":"canonical source path","inventoryInputCommit":"primary census full SHA","inventoryInputs":[{"path":"Step2 census","commit":"full SHA","sha256":"artifact hash"}],"authorInputCommit":"full SHA","inventoryFileDigest":"primary census source hash","digest":"current full-file SHA256","inventoryEdgeIds":["existing Step2 id"],"diff":"one unified diff, empty if no source patch","edges":[{"edgeId":"existing id","inventoryRefs":[],"sourceSpans":[{"line":1,"columnStart":1,"columnEndExclusive":2,"text":"x"}],"matchedExpression":"complete source reference","disposition":"patch | parked | phase9-row-flip | preserve","diffHunk":null,"reason":"exact passage and ruling","target":null,"anchor":null,"timing":"Phase 9 | none | now","blockedReason":null,"dependency":null,"blockedCategory":null,"dependencyCategory":null}],"checks":{"coverage":{},"anchors":{},"relativeResolution":{},"labelForm":{}},"reviewSet":"frozen batch","authoringRules":["L12-21..L12-56"],"sourceRenderProvenance":{"sourcePath":"actual canonical source","sourceDigest":"SHA256","sourceHeaderWitness":{"file":"render path","line":9,"text":"exact generated header"},"generatorDoor":"npm run build:skills or existing registry instruction projection door","renderFiles":[{"path":"exact render","digest":"SHA256","sourceEdgeIds":[],"renderEdgeIds":[],"spanCorrespondences":[],"renderOnly":true}],"registrySourcePaths":[],"generatedBlockRanges":[],"installedPackageLimit":"repo-only docs omitted from installed package; no installed-link proof claimed","determinismReceipt":null}}
```

Evidence census ids are FILE-row ids: retain `(inventory,id,originalLine,matchedExpression)` per occurrence; never pretend `evidence-099` uniquely identifies its multiple slots. Shorter contained census spans join the complete reference. Wrapped spans form one logical reference; use all original ids as aliases, do not lose continuation text. Rebind every source/span/digest against the frozen author pin with actual surrounding passage; new uncensused occurrences are population gaps for Lead, not invented ids. Reuse the Step 3 checker rules and its existing repository anchor/link APIs; **do not change that checker in this preparation** and do not claim its class-3-only coverage automatically validates these new census schemas. The later author/Lead must declare the adapted mechanical replay/proof explicitly before dispatch.

Every edge gets a source-bound disposition. `patch` has an exact live target/anchor, whole-unit replacement, matching label/description and timing; `phase9-row-flip` contains whole-row migration semantics. `parked` names the smallest real dependency, with alias/registry lookup and locator `searchWitness` before any missing-target park. No universal `docs/specs/<area>` substitution. Preserve locators, path prefixes, relative forms, directory slashes, backticks, image markers and link labels. Source-carriage/history/captured-evidence rules and title-matched successor notes apply. No executable self-link, duplicate Related navigation or guessed write alias. Four indexing writer slots remain parked on end-user-pointer conservation/Step 5 parity; alias lookup cannot establish write destination. All 22 L12-10 files and their CONTEXT/RESEARCH/DISCUSSION companions remain unchanged and joined as preserve/history controls.

Root instructions: AGENTS unmanaged prose is a source; managed fgOS blocks derive from `core/instructions/*` and the instruction registry. CLAUDE's `@AGENTS.md` import is preserved. Record exact unmanaged/managed ranges, source ids and registry source→projection joins; no hand-patched root projection or hand edit in `.agents`/plugins. CLI help requiring a real implementation gets an authorized Unreleased entry in that later write scope. Generator/default-root help, setup/doctor and gateway runtime reads remain Step 5, including byte/header/status/error and schema parity; no root flip now. Generated decision-index/registry/purposeTitle edges stay with their generator owner. L12-14 classifier/shipped inventory repair remains outside Phase 8.

## Mechanical proof and A51 review

Mechanically check EVERY record/diff: complete edge-id multiplicity, digest/spans, whole-unit patch applicability, target existence at a declared tree, anchor via existing API, relative resolution, labels/descriptions, provenance joins, before/after operative routes, alias lookup-only semantics, protected hashes and exact write allowlist. No missing/duplicated/invented edge or orphan hunk. Census labels are advisory, never accepted semantic patches. No consumer write until its dependent gates and Lead's exact scope/proof/budget are supplied.

A51 sample seed = `A51-step04-file-v1` + NUL + full author-input commit + NUL + frozen batch id; rank `sha256(seed + NUL + canonical source path)` ascending, tie by path. Sample **ceil(0.15 × files with non-empty authored diff)**, including Phase 9 diffs. Union EVERY source ≥65,536 bytes OR ≥40 joined source/render slots; this is at least as strict as Step 3's 40 inventory-edge threshold. Mandatory source paths/witnesses are listed per batch in JSON; current distinct mandatory count is 13. Review chosen files in whole-file context and every source→render provenance mismatch/high-risk or changed binding. All root-instruction source/projection boundaries, all L12-10 joins, all 17 unresolved host/plugin provenance witnesses and all L12-44 and L12-57 changed bindings are mandatory joins regardless of sampling. No source diff exists yet, so no sampled membership or green rework denominator can be fabricated now.

Per frozen set, publish patched-file population, seed/ranks, mandatory threshold witnesses, distinct reviewed files, rework numerator/denominator, bytes/parts and elapsed/remaining budget separately. A file needing any semantic correction counts once. **≤3% rework per set passes; >3% expands to EVERY file of that set**, including preserve/park/row-flip records. Never pool sets or replace failed sample files. Corrected bindings return to pending independent review. Independent fresh-context reviewer is Lead-started under A38; author never certifies itself.

## Step 4 proof commands and batch end

Common light proof (run after authorized authoring, exact allowlist checked):

```sh
git diff --check
git diff --name-only HEAD
node scripts/check-legacy-docs-ratchet.mjs
env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-link-pass.test.mjs test/scripts/check-doc-candidate-status.test.mjs test/scripts/check-doc-constitution.test.mjs
```

Step 4-specific proof from the phase file:

```sh
env -u CLAUDE_CODE_SESSION_ID npm run build:skills
env -u CLAUDE_CODE_SESSION_ID npm run build:skills
env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/generate-shipped-path-inventory.test.mjs test/setup/instruction-registry.test.mjs test/setup/instruction-composition.test.mjs test/setup/instruction-projections.test.mjs
```

For **any batch with apply-now source edits**, capture the exact source/render file list, modes and SHA256 after build 1, run build 2, and require byte equality and identical path/mode set. Unexpected generated delta parks the affected batch; no direct render repair. Instruction projections use their existing generation door, also with pinned source→output receipt. This preparation has no apply-now source edits, so **build:skills is intentionally NOT executed**. No source/render parity or installed-package link acceptance is claimed. Validate maintained links/anchors from the reviewed matrix; keep installed-package limitations explicit.

At the separate L12-11 committed-byte batch end, run `env -u CLAUDE_CODE_SESSION_ID python3 plans/260925-documentation-authority-unification/reports/phase-08/audit-report.py` and `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-rationale-reproduction.test.mjs test/scripts/check-legacy-docs-ratchet.test.mjs test/scripts/check-decision-citation-drift.test.mjs`; both embedded audits/checks must pass with frozen B unchanged. No reproduction-green claim from author working tree. Pin protected paths/switchboard before and after; include N1 content-bound rebinds in every decision-target batch. Check identity drift against main plus exact authored source/render paths (not whole trees); Lead owns integration, no git write by worker. Tests unset CLAUDE_CODE_SESSION_ID; one heavy job at a time. Unexpected topology/install assumptions, new config/dependency, missing target/parity or ratchet violations park their own batch. No Phase 8 docs/specs or docs/architect edits, authority cutover, payload deletion, main landing or push.

## L12-44 handoff

`step-04-l12-44-rebind-report.json` relocates all six canonical records across batches 040/041/059/068, including retirement inventory coverage. Its exact old/current spans, changed source blocks, target hashes/anchors, hunk preimages and proposed Lead-authorized record edits are report-only. No Step 3 record, old review request or reproduction manifest was changed. Same dispositions/targets/timing remain appropriate; rebase the reading-map and workflow hunks over their new landed prose, refresh the generated-index Step 5 binding, and independently review changed bindings before any future application. Retiring distribution/runner keep empty diffs. Workflow carry and A47 final candidate conservation remain open Phase 9 dependencies.


## L12-57 local-main merge refresh

The preparation committed at `b2162b0b4` had 301 files / 823 slots / 262 source owners, 0 apply-now (102 Phase 9 / 717 preserve / 4 park). Local main `4729cfc18` merged at `3732d245d`, base `44daae2a0`, 96 main commits. No origin pull. Input is now the full merge SHA above. Existing 31 batch identities remain; `step-04-batches.json` adds two explicit supplemental gap groups pending census admission, before Lead freezes bytes/time and assigns authors. Do not dispatch an old frozen request over refreshed bytes.

Eleven existing population files changed in main: `.githooks/pre-commit`, `.gitignore`, `AGENTS.md`, `CHANGELOG.md`, `docs/architect/agent-coordination/decisions/README.md`, `src/cli/command-registry.mjs`, `src/report/capability-plan-lint.mjs`, `src/runner/dispatch/config.mjs`, `src/runner/dispatch/resolve.mjs`, `src/setup/registrations.mjs`, `src/setup/skill-wrappers.mjs`. Their 141 existing slots retain census ids and exact line correspondence, refreshed current hashes and pending independent context review. Behavioral/class-3 buckets retain their own custody; six files / 68 of these slots are Step 4. Exact per-file/bucket counts, old/current digests and path commits are in `step-00-l12-57-tier2-population-drift.json`.

Eight new files / ten new slots are explicit population gaps: canonical `core/skills/_shared/ak-cook-worker-contract.md` and its `.agents/skills/_shared/` and `plugins/fgOS/skills/_shared/` renders (three Phase 9 slots); one new plan plus four new reports (seven preserve slots). Exact supplemental `(inputCommit,file,line,column,text)` keys are in the population; `edgeId: null` and empty census refs deliberately prevent invented Step 2 identities. Resolve admission before authoring these groups. Generated headers and both render bodies equal the canonical fragment with a one-line offset; no generation/installed parity claim. Two new maintained candidate specs (`docs/platform/agent-mailbox/spec.md`, `docs/platform/secrets/spec.md`) add eight root-reference occurrences outside this Step 4 surface: explicit class-3 census gaps for Lead, not silent Step 3 acceptance or Step 4 slots.

Nineteen direct decision rebindings (11 content / eight position) are proposed in `step-00-l12-57-merge-rebindings.json`; 16 contextual group records also have 128 stale member ordinals already present before this merge. They resolve by full footer text and complete decision ancestry, and remain group bindings. All proposed corrected rows remove approval fields and return to pending; **none is applied**, because all eight decision shards are outside the effective write scope. Lead must provide a separate expanded-scope Unit before binding acceptance. Seventeen main-changed Step 3 records remain pinned as recorded and deferred in `step-00-l12-57-step3-deferred-rebinds.json`; earlier L12-44 six-record obligations also remain. Relocate actual spans/hunks only on application, not by old line numbers; retiring-tree records require coverage/retirement review rather than applying a patch.

Workflow candidate carry (L12-27), final A47 conservation including all ten changed candidate paths, independent binding/context review, new-gap admission and separate L12-11 committed-pair accounting remain owed. No consumer edit, Step 3 reopen, authority flip or reproduction-green claim follows from this refresh.
