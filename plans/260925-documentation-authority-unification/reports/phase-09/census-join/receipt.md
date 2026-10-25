# Census judgment settlement receipt

Settlement pin: `98d9201f1905e433a40b94d8d8b0fb9fefda1452` (HEAD at start). Authority: W19 cleanup brief and L13-17. **Records slice complete; G2 remains partial**, pending independent review of this turn and turn 707. The four former citation parks are joined by current holder/section, not by executing tests. No product tests ran.

## Current settlement

Every original owned id has its own disposition, locator and digest-bound evidence in `settlement.json`; `settlement-decisions.json` is the pinned input layer. Historical grades are unchanged.

| Original population | Owning-test join | Re-graded REJECT | Citation join | Owned park | Total |
|---|---:|---:|---:|---:|---:|
| Fixture judgments | 132 | 27 | 0 | 0 | 159 |
| Drifted grades | 0 | 21 | 0 | 0 | 21 |
| Other judgments | 2 | 1 | 4 | 0 | 7 |
| Total | 134 | 49 | 4 | 0 | 187 |

Four **additional** grade drifts at this HEAD (`pc-d-0948`, `pc-d-0960`, `pc-d-0961`, `pc-d-1086`) are separately re-graded REJECT, not folded into the 187. Current original-census totals: **780 owning-test joins + 289 unchanged grade confirmations + 53 settlement REJECTs + 4 citation joins = 1,126**. All ids and all 140 file identities are retained.

Grouped causes (each row still has its own evidence):

- **55 lexical/template-test joins:** retain the source template title and test-call line, without evaluating it or pretending an expanded title is known. Includes the two native-load occurrences previously hinted as help text.
- **11 Rust helper joins:** explicit same-file helper callers lead to non-ignored test attributes/function lines.
- **68 shared-fixture joins:** module constants, setup hooks and imported helpers have explicit owning tests and loader/caller evidence. `trackedLegacy` joins the default `porting=true` inventory test; failover's `llmAccounts` branch joins a test that actually supplies pool accounts, rather than a caller that leaves the branch off.
- **27 retired fixture REJECTs:** exact historical slots plus deletion `5a33989fa39e0eb3d3253ddb4189cb502f93bd21`; frozen conversion config/test data is no longer live. This is a recorded retirement/non-document grade, not an invented successor test.
- **25 drifted-grade REJECTs (21 original + 4 additional):** every row links its original grade-record member/line and historical span to current evidence. Lease `console.log` → returned messages remains scalar rendering; removed conversion/pre-seat-run diagnostics stay retired, not rebound to unrelated current line numbers; centralized Git path validation, renamed error mapping and the extracted Land warning remain non-document uses. One conversion reader source was deleted by the same explicit retirement commit.

- **One lexical-comment-fragment REJECT:** `pc-d-0758` is the exact fragment `path: in a` inside the line-3 comment “no addon-less Git read path: in a”, not a config path or a document citation. The nearby real distribution citation is separately joined by citation as `pc-l-0056`.

## Four former before-F parks — joined by citation, review pending

Owner for each: **Documentation integration Lead (L13-17.1)**. `citation-bindings.json` records full holder paths, section anchors, current unit/file digests, original ledger mappings and their effective successors. These are navigation joins, never non-document REJECTs or invented owning-test proofs.

| Id | Current locator | Holder and section | Current unit SHA-256 prefix |
|---|---|---|---|
| `pc-l-0042` | `test/runner/execution/bind-tier-composition.test.mjs:1` | `docs/platform/seat-binding/spec.md`, sections 5.4 / 6.3 | `ed05039981d3` / `9090a7924936` |
| `pc-l-0056` | `test/setup/doctor-fresh-run.test.mjs:6` | `docs/platform/packaging-distribution/spec.md#entry-points-triggers` | `e633ae89d8b3` |
| `pc-l-0077` | `src/setup/registrations.mjs:6354` | `docs/platform/workflow/spec.md#6-business-rules`, RUL-WF-27 (`unheaded-block-64`) | `76a293a6ec23` |
| `pc-l-0078` | `src/setup/workflow-case-checks.mjs:2` | same complete RUL-WF-27 unit | `76a293a6ec23` |

The distribution binding follows its original ledger claim and `carries/source-heading-parity.json`, **not** the separate top-level “2. Entry Points” table. Seat/workflow bindings follow `s12-late-areas.json` through `s14-resync-b.json`. `pointer-patches.json` uses the existing composition-packet format: four exact current-pin comment-only forward/rollback deltas, all `applied: false`, pending independent review and full-chain composition. `citations.py` reuses the dual native-unit extractors and ledger supersession traversal, and replays actual `patch --fuzz=0 --batch -p1` forward and rollback on scratch copies (eight successful replays). No code bytes are changed.

## Proofs and reproduction

Let `P=plans/260925-documentation-authority-unification/reports/phase-09`. `replay.json` records exact argv, stdout and SHA-256 values.

| Command | Exit | Evidence |
|---|---:|---|
| `python3 -B P/census-join/join.py --pin 98d9201f1905e433a40b94d8d8b0fb9fefda1452` — run 1 | 0 | `replay.json` |
| Same command — run 2 | 0 | stdout and all three outputs (`join.json`, `residue.json`, `settlement.json`) byte-identical |
| Prior settlement’s historical replay: `python3 -B P/census-join/join.py --pin 3d0169f390e21c67bc3fc69081fd1bc07186599f --rescan --out <tempfile directory>` | 0 | retained under `replay.json /previousSettlementReplay`; not rerun this turn |
| `python3 -B P/gate-reconcile/reconcile.py` — twice | 0 / 0 | `gate-reconcile/reproduction.json`; generated register/receipts byte-identical |
| `python3 -B P/census-join/citations.py --pin 98d9201f1905e433a40b94d8d8b0fb9fefda1452 --check` | 0 | packets reproduce byte-identically; eight actual zero-fuzz patch replays |
| `node P/carries/verify-carries.mjs` / `node P/carries/controls.mjs` | 0 / 0 | 346 units, 91 headings, 321 direct blocks, 1,208 successors; five rejecting controls including stale duty |
| `python3 -B P/gate-reconcile/verify.py` | 0 | `gate-reconcile/verification.json` |
| `python3 -B P/gate-reconcile/controls.py` | 0 | `gate-reconcile/controls.json`; 9 rejecting controls |
| `python3 -B P/misc-fix/verify.py` (output-only scratch adapter) | 0 | `gate-reconcile/misc-replay.json`; committed `checks.json` unchanged |
| `git diff --check` | 0 | final scoped verification |

During the prior settlement, the first historical comparison caught a pre-existing replay defect: `registerSha256` read today's whole register, although its census-id set was unchanged. It now reads the register blob at `--pin`; the complete old output, not only its counts, reproduces exactly. The historical rescan is a compatibility check, **not** a new-pin/final-pin rescan: post-pin literal/dynamic artifacts below remain explicitly at their old pin, with the eight literal judgments still open.

## Register follow-up

`gate-reconcile/reconcile.py` remains the one generator. It retains the original `53de2207e` snapshot/fingerprints and W18/L13-17 layer, and fingerprints W19 at this turn’s start pin separately. W19 independently approves all 25 current rebinds, the live-parity correction and 25e8842d3 receipt counts: G0/G1/G6 are `met-local`, not final-met. G2 remains `partial` pending review of this turn and turn 707; all F/external duties remain open. Earlier W15 sampling, W9 rule-based review and owned-park composition qualifications are retained.

Reuse/prior art: `bade6b6b3` introduced the join; `b25dadae2` added pin/delta custody. Reused the Node-bundled Acorn locator, Rust helper grammar, original register/grades and gate reconciliation generator; only the pinned layer opts into template titles. No product mechanism added. Impact-analysis: **degraded/unqueried** under the no-CLI/no-MCP constraint. No Git writes, fgOS CLI/lifecycle, pair accounting, suites, native addon loading, docs/tests/ledger edits or preview service. Scratch uses tempfile directories under `/tmp/fgos-work/` and is removed at completion. Independent review of this turn and turn 707, co-composition of the four unapplied retargets, eight post-pin literal judgments and final F work remain Lead custody. Every Node process inherited `--no-addons` and a scratch `process.dlopen` block. `needsWrites: []`.

---

## Historical custody receipt (superseded for original-judgment counts only)

The text below records the prior pin; its 187-open count is historical, not the current settlement state.

Pin: `3d0169f390e21c67bc3fc69081fd1bc07186599f` (HEAD at execution). This supersedes the W1 receipt at `bade6b6b3`, not its historical evidence. **Records task complete; G2 remains unmet**, without independent approval or final-pin F coverage.

## Changes and result

- `join.py --pin <commit> --rescan` resolves an explicit commit and reads its tracked blobs; omitting `--pin` still selects HEAD.
- All **1,126 original ids / 140 files** remain set-equal to the frozen register: **646 owning-test joins, 293 exact grade-record REJECT confirmations, 187 owned judgments**. The latter still comprise 159 fixture, 21 drifted-grade and seven other rows. No old grade, register or source was rewritten.
- The **27 fixture rows whose sources were deleted** now name deleting commit **`5a33989fa39e0eb3d3253ddb4189cb502f93bd21`** (seat-binding conversion removal). One additional reader row has the same deletion: 28 absent-source judgments total, not shared-helper failures.
- `pc-d-0185` and `pc-d-0186` now name **`packages/git/rust/tests/recovery_matrix.rs:recovery_matrix_all_payload_kinds`**, not its ignored subprocess. Rust locators name the actual test attribute and separately the function line. The YAML golden locator and loader line are derived from source, not constants.
- All **116 empty-proof helper rows** explicitly say that no same-file caller is proved; none claims joined custody.

## Post-pin coverage

`post-pin-dynamics.json` reuses the unchanged Step 02l grammar and Step 07 subtraction, preserving the review's occurrence identities across exact diff-line rebinding. All **132 reviewed sites bind** at this pin: **77 owning-test joins + 55 source-judged non-document REJECTs**. Each of the **13 reader hints has a distinct individual reason**, distinguishing lease stdout, config-source reads, a reported config filename, a lock resource name, YAML scalar typing and config warnings/comments. A nearby docs cue is not evidence of a document read.

Rescan also finds **11 later dynamic sites**: ten fixture joins and one separately judged repository-root default in `scripts/lib/doc-git-reads.mjs`. Total delta: **143 = 87 proof joins + 56 source judgments**, zero unlisted reviewed sites. Source judgments are bound to the full source digest at this execution pin; later source drift must be rejudged, not inherited. These are proposed grades, **not independent approval**.

`post-pin-literals.json` retains **16 delta occurrences**: three YAML parser-fixture joins, five Config authoring-fixture joins, and **eight owned judgments** (two generated workflow instructions, five live standard-runner descriptions, one presenter contract citation). All 13 originally judgment-required literals have their own reason, including the five now joined through `authoring_equivalence.rs`. Fixtures stay frozen; generated/live surfaces need their own co-cut review.

## Evidence and replay

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/census-join/join.py --pin 3d0169f390e21c67bc3fc69081fd1bc07186599f --rescan
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/verify.py --pin 3d0169f390e21c67bc3fc69081fd1bc07186599f
```

Both exit 0. `../preserve-premise/verification.json` records two isolated runs, identical stdout and **eight byte-identical G2/G6 artifacts**, equal to delivered files; exact identities, deleted-source custody, reader reasons and Rust/YAML locators are checked. Proof names are custody locators, not claims that product tests ran.

Reuse: W1 join, Node bundled Acorn, unchanged census grammar, grade records and Git diff rebinding; extended the existing Rust test/helper custody rather than adding a scanner. Prior-art history: `bade6b6b3` introduced this records proof; `5e512a829` introduced the recovery parent/subprocess relationship. No removed product mechanism was restored.

No Git mutation, fgOS CLI, lifecycle, `.fgos`/secret read, product-source edit, full suite, product owning test, pair accounting or preview service. Product tests were unnecessary for records-only custody; temporary Git fixtures are allowed by the brief, not a reason to filter tests. Impact-analysis: **degraded/unqueried under no-CLI**. Independent review, eight literal judgments, 187 original judgments, final F refresh and accounting remain Lead custody. Markdown preview deferred to Lead to avoid out-of-scope service state. `needsWrites: []`.
