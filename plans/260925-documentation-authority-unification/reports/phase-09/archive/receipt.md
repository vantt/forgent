# Archive retained-set correction receipt

**Local task completed; G8 is not accepted or closed.** Authority: D5c brief, L12-129/L12-137. Source pin: `23f6eaccf5eb195a8f50e5788d38f386a901b6d2`. Only `archive/**` changed. No source Git write, lifecycle/fgOS CLI, real lease, publication, landing, source pair accounting, product/test edit or baseline change.

Read `design.md`, `manifest.json`, `verification.json`, `rehearsal.json`. The one-step final-pin rebuild command is in `design.md` and uses the existing builder/rehearsal/verifier, not another archive mechanism.

## Retained set and complete link enumeration

- Partition: **6,899 files / 2,897,413,094 B**; archive **6,016 / 2,265,926,393 B**; retain **883 / 631,486,701 B**. No threshold. Every kept row has an exact input contract, source/field/line read witness, or navigation link locator.
- Removed outside-plan basename fan-out. Run receipts, fixture outputs, comments, help and mismatching constructed filenames no longer masquerade as plan reads. Direct output/provenance-only names in retained plan programs are not input reads either.
- All **22 reviewed false reasons / 23,297,481 original B** are addressed. **20 files / 23,083,394 original B move**. Two stay under the brief's explicit navigation rule: `pilot/README.md` is really linked from the Phase 06 contract at line 25; `review-6-checkpoint.md` from phase-06 progress at line 1306. Their old prose/help reasons are removed. `audit/retained-set-corrections.json.gz` binds each old row to its new disposition and locator; this is an explicit, evidence-based qualification of the brief's shorthand “22 files”, not an unreported exception.
- Scanned **every tracked outside-plan non-symlink file** except `.fgos/`, not just code. `audit/external-references.json.gz` contains **164 raw full-path lines / 184 normalized path/link joins**, plus **619 plan-navigation link joins**. Directory mentions are containers, not blanket reads of descendants. Every existing exact target in these joins is retained. The historical review's 21-reference count is not used as a completeness boundary.

All **45 current outside-plan joins to previously archived files** are enumerated individually in the correction audit, grouped here for review (`P` is the plan root):

| Kept target under P | Outside-plan reader locator(s) | Joins |
|---|---|---:|
| `minimum-constitution.md` | `docs/platform/intent-preservation-ledger.md:81-91`; retired-engine inbound copy `:102-112` | 22 |
| `current-authority-map-2026-09-25.md` | `docs/platform/documentation/switchboard.md:117,130`; `docs/reading-map.md:99,118`; `docs/specs/reading-map.md:7`; `docs/transitional-switchboard.md:9,118` | 7 |
| `reports/phase-06/step-08-report.md` | platform READMEs: agent-confinement `:34`, claude-plugin `:32`, decision-citation-drift `:32`, distillery `:32`, herdr-web-dashboard `:34`, observe `:32`, ui-spec `:52` | 7 |
| `reports/phase-06/step-10-report.md`, `holds.md` | `docs/platform/history/documentation-authority-unification/README.md:29,32` respectively | 2 |
| `reports/phase-06/step-09-report.md` | `docs/platform/runner/README.md:49` | 1 |
| `reports/phase-07/phase-07-scorecard.md` | board log `:710` (matched line only, not whole-log reading) | 1 |
| `reports/harness-readiness-2026-09-29.md` | `plans/reports/advice-260930-1002-harness-flexibility-plan-agnostic-routing.md:52,201` | 2 |
| three `independent-frontier-*.md` prompt/review/rereview files | `plans/reports/research-261021-1054-rules-instruction-optimization-references.md:523-525` | 3 |

The phase-08 gate register is separately kept at the execution plan's exact register citation and navigation links. All six restored source witnesses, 2,918 historical scriptRef occurrences, 47 historical reader files / 135 joins and 279 reachable prior-prune recovery blobs are verified. The old review-checkpoint template and the liveness test's generated scratch output are explicitly rejected as committed-tip reads, with unchanged source locators.

**359 standalone retirement specs** state “behaviour retired with the plan”. The reviewed ten and all **43 current Phase 09 programs** remain retire-at-final-pin. Temporary closure: **3,283 files / 1,299,055,408 B**, retained until gate proofs and independent reviews freeze. Two historical programs linked by navigation remain source text; their execution context is the archive checkout, not a false claim that all old inputs stay at tip.

## Real-disk rehearsal

Filesystem: `stat -f` reports `ext2/ext3 ef53`, `findmnt` reports **NVMe ext4**. Source refs/index are untouched; all clone Git mutations lived in scoped `.scratch`, addressed through `/tmp/fgos-work/w4-d5c-final-inputs`, then cleaned.

| Candidate | Exact measured tip bytes | Detached worktree adds, seconds | Median |
|---|---:|---|---:|
| After final-pin acceptance, gates retired | **818,290,357** | **2.415 cold fallback**, 6.091, 6.012 | **6.012 s** |
| Before acceptance, gate programs/inputs retained | **2,117,345,765** | **49.515 cold fallback**, 27.737, 13.365 | **27.737 s** |

`drop_caches` is not writable/permitted. Per the brief, the first run in a fresh `--no-hardlinks --no-checkout` clone is the cold fallback for each variant. This is **not physical cache eviction** or final-F acceptance. Both medians are below 60 s; only the post-freeze median meets the 20 s target. Navigation retention increases tip size relative to D5b intentionally; the ~0.2 GB aspiration is not claimed.

LOCAL archive snapshot: `b9ce940e293d27fb03751063b5f5e2db304fdf83`, ref `refs/heads/archive/260925-records`. Accounted reduced candidate: `98a121070744e334bb2333bfcd2f10ec672e7ec4`; pre-freeze: `dd78c6b18fca66243a624dae1d8c165e1e9fe23c`. `audit/rehearsal.bundle` preserves and verifies these refs with the source pin as prerequisite. No ref was installed in the real repository. The augmented archive contains the source tree and all 11 descriptor-bound audit assets (**1,709,754 compressed B**). Main manifest: **7,253 B template**; measured main-side artifacts: **50,093 B**. Receipt/verification/rehearsal outputs follow measurement; `audit/final-artifact-delta.json.gz` reports their final delta, not an unmeasured final-tree timing claim.

## Full checks, A after accounting, and link parity

Both frozen **complete `checks.mjs` programs** ran before and after clone-only exact exception accounting; no A-only slice this time. Removal commit: `b4fd9a7d6b5b7c795b1a034f9a9f56134c10cc64`. Per recipe: **3,384 removal pairs + 48 preexisting pending pairs = 3,432 unaccounted before**; after accounting, **A green, 0 unaccounted / 0 working violations**. Pending source pairs are labelled fixture-only simulation, not source approval. B pins and I checks are green; recipe logic, allowlist and baselines are unchanged.

The complete recipe still exits **1**, honestly: H has the same **four preexisting missing-header findings** on both sides, **zero new findings** and **zero unresolved links/Related paths**. The four documents are gateway-readiness, vendored-yaml-parser decision, conserved-dispatch-doctrine and non-transitioning-records. The previous new switchboard → authority-map failure is gone. Full before/after outputs are in `audit/before-*.json.gz` / `after-*.json.gz`; exact rows in `audit/pair-accounting.json.gz`.

The actual candidate-status CLI reports identical full findings/counts at pin and candidate. The actual retirement CLI was attempted on both sides and cannot load the saved inventory because its uncommitted `doc-inventory.parts/part-0001.jsonl` is absent on both. This remains a **full-retirement-CLI gap**, not green. Its existing production `links-resolve` evaluator was also run with real tracked platform files, constitution, switchboard and metadata: **pass / zero links on both sides**. Unrelated evaluator inputs are explicitly fixture data; this proves the link result, not inventory/cutover acceptance. Its unchanged owning test passes **36/36**; candidate-status owning test **11/11**.

## Owning tests and exposed fixture corrections

Eleven unchanged test files per side: **314 cases / 312 pass / 2 fail / 0 skip / 0 cancelled**, identical failing titles. The two existing reproduction fresh-reviewer ownership cases fail at `current.noNewDoubleOwnership`; no archive-induced failure remains. All other ten files pass, including liveness, constitution and both link-check owners. The real activated host/addon was used: release `sha256:a970a7e6052bdef1bb4113212d16caf5f2a916f6a66d2a6130b744fe458328c8`. This does not establish working-tree Rust freshness.

`audit/attempt-1/` preserves the first rehearsal, command/test logs and bundle: the structural verifier caught two navigation-linked historical programs incorrectly classified for removal; they are now retained. Ten verifier cleanup cases initially failed equally because the physically scoped temp directory inherited this repository's ESM package type, unlike normal `/tmp`. A **scratch-only CommonJS package boundary** restores the unchanged extensionless npm fixture's ordinary execution environment; no test, assertion, flag or production check was changed/skipped. Final `verify-phase-02.test.mjs`: **16/16 per side**. An early builder assertion also exposed that the review-row selector included two genuinely read identity registries; the selector now names only the reviewed 22, preserving both registries. None of these failed attempts is counted as completion.

`python3 -B .../archive/verify-design.py`: **exit 0**, complete partition/digests, exact external/navigation locators, 22 review dispositions, four negative probes, bundle refs/digest, raw-log hashes, failure parity, A/B/H/I evidence and cold-fallback timings. `git diff --check`: exit 0. Final source diff scope is exclusively `archive/**`.

## Handoff

Rebuild and independently review at F; use the one-step command in `design.md`. Source accounting, F metadata/ownership gaps, retirement inventory materialization/full CLI, G10/G11, origin publish and main landing remain Lead/owner work. No new tool, config default or runtime dependency is introduced. Full npm suite and `scripts/run-tests.mjs` were prohibited; Cargo workspace suite and browser/service preview were not run for this constrained record correction. Impact-analysis: degraded/unqueried under the explicit no-fgOS-CLI rule. **needsWrites=[]**; no out-of-scope repair was needed or attempted for this assignment.
