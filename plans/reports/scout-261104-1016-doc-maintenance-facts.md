# Phase 10 doc maintenance MVP: facts, gaps and smallest plan

Date: 2026-11-04. Main `03e120616` (Phase 9 = `97dd62aa7`). Read-only scout; nothing run except read-only
scripts (`check-doc-candidate-status --links-only`, `convention check --all`, `convention classify`) and
ad-hoc fs scans (scratchpad scripts, not committed).

## 1. Facts: what already exists

### 1.1 Doors in place

| Door | Where | What it does today |
|---|---|---|
| `fgos convention name/path/check/classify` | `packages/convention/rust/src/lib.rs:5`, `operations.rs:148` (`check_paths`), `:169` (`check_all`), `:250` (`classify`), `:346` (`check_path`: forbidden placement first) | Path naming + placement. One source: `packages/convention/contracts/convention.rules.v1.json` (spec `docs/platform/convention/spec.md:66`) |
| Phase 9 placement rows | rules json `:105`.. (`doc-*`, 47 with `canonical:true`, 9 with `metadataExempt`), forbidden `:143-145` (`docs/specs/**`, `docs/architect/**`, `docs/decisions/**`), `:148` (`unplaced-platform` catch-all), `:165` (`docs/decisions/index.md` admitted, generated) | Wrong placement + retired roots, posture `block` |
| Reserved doc flags | `rules.rs:79-110` (`canonical`, `metadata_exempt`, `generated`, `required_metadata_fields`) | Parsed, **never read** by any operation (grep: only struct fields). `ClassifyOutcome` (`operations.rs:52`) returns only kind/cardinality/scope |
| Pre-commit convention guard | `.githooks/pre-commit:509-548` (`warnOnConventionViolations`) | Staged `docs/**` + reports/journals → `convention check`; `block` posture refuses; host errors fail open (warning) |
| Doctor `convention-conformance` | `src/setup/registrations.mjs:5253`, registered `:5325` | `check --all`, fails on post-cutoff violations |
| doc-health (links/anchors) | `scripts/check-doc-candidate-status.mjs:65` (`checkPlatformLinks`), `--links-only` `:176`; reader `scripts/lib/doc-links.mjs`, `scripts/list-doc-anchors.mjs` | Every local link/anchor in `docs/platform/**`. Enforced only by live test `test/scripts/check-doc-candidate-status.test.mjs:163` (spec `docs/platform/convention/spec.md:379`) |
| Metadata check (plan-era) | same script, `checkCandidateMetadata` `:133`; fields from `check-doc-constitution.mjs:221` (`governanceBaselineFields`, reads `docs/platform/governance.md:167`) | Status from `plans/260925-.../transitional-switchboard.json` (`:33`), report-only; switchboard is frozen pre-cutover (15 areas `legacy-current`, 5 `candidate`) so the mode is meaningless now. Non-links mode also triggers a native-addon cargo build via `trackedPlatformDocs` (`check-doc-constitution.mjs:639`) |
| Registry doc checks (doctor) | `src/setup/registrations.mjs:3403-3413`: `doc-registry-stale`, `doc-alias-broken`, `doc-active-duplicate`, `doc-current-path-missing`, `doc-source-unreachable`, `doc-near-duplicate`, `doc-source-conservation`, ... | Work-store knowledge registry only: 479 docs, all under `docs/knowledge|explanation|how-to|reference`; **zero `docs/platform` docs** |
| Generated-projection doctor checks | `decision-index-stale` `:2999` (+ `fgos decision-index --check`, `bin/fgos.mjs:2030`), `enduser-docs-index-stale` `:2904`, `instruction-projections-stale` `:3087`, `doc-registry-stale` `:3403` | One check per generated artifact; the only generated doc rows in rules are `docs/generated/**` and `docs/decisions/index.md` |
| `fgos doc` verb | `bin/fgos.mjs:1529` | Registry lifecycle only: reserve, register, mark-rendered, move-path, promote, demote, supersede, retire |
| `fgos docs-lease` + cutover lease | `src/runner/documentation-cutover-lease*.mjs` (421 lines), pre-commit `:33,:595,:686`, `.githooks/reference-transaction`, doctor `:2054`, `command-registry.mjs:399`, hooks into `run.mjs`, `merge.mjs`, `workflow/runner.mjs`, lock row `packages/holder-lock/contracts/lock-registry.v1.json:37`; tests 1249 lines | Freeze for the cutover. Still extended: board log 2026-11-04 10:55 asks HARDEN to add a docs-lease check to `fgos workflow gate` |

Prior art: `git log -S` on `doc classify|doc new|doc check|doc inventory|retirement-check` in `src bin apps packages`: 0 commits; none of these surfaces ever existed. Board row DOCOS (`plans/261017-1313-fgos-platform-program-board/plan.md:80`) assigns `fgos doc new/classify` + profile registry to DOCOS, not DOC.

### 1.2 Phase 10 surface or check vs existing owner

| Surface / check | Existing owner | Coverage | Observed failure it covers |
|---|---|---|---|
| `fgos doc classify` | `fgos convention classify` (`operations.rs:250`) | covered (flags not exposed) | placement |
| `fgos doc new` | none; templates in `docs/platform/documentation/history/templates/`; DOCOS owns the write door (board `:80`) | missing, out of DOC scope | none observed |
| `fgos doc check` | convention check + doc-health script + doctor rows | covered by 3 existing doors | all |
| `fgos doc inventory` | `convention check --all` (1106 paths) + `docs/doc-registry.*`; migration inventory `scripts/generate-doc-inventory.mjs` is plan-only | covered for maintenance | none post-cutover |
| `fgos doc retirement-check` | `scripts/check-doc-retirement.mjs` (plan-only); post-cutover a retire = delete + inbound links, which doc-health's live test already fails on | covered | none post-cutover |
| 1 duplicate owner | path level: convention `singleton` cardinality (structural); registry: `doc-active-duplicate` | partly (claim level missing) | path-level yes; claim-level not decidable (see 2.4) |
| 2 wrong placement | convention + pre-commit + doctor | covered in source, **not live on design-lap** (G1) | yes |
| 3 missing required metadata | `checkCandidateMetadata` (stale switchboard, report-only) | **missing in effect** (G2) | yes |
| 4 broken links/anchors | doc-health `--links-only` + live test | covered: 628 docs, 2617 links, 0 findings today | yes |
| 5 refs to code/skills/commands that don't exist | none | **missing** (G3 for paths; skills/commands hypothetical) | yes (paths) |
| 6 stale generated projection | 4 doctor `*-stale` rows | covered | yes |
| 7 reintroduced legacy roots | convention forbidden rows `:143-145` | covered in source, **not live on design-lap** (G1) | yes |
| 8 unaccounted source/claim lineage | sealed `docs/platform/history/documentation-authority-unification/sealed-claim-ledger.json` (+ sha256); registry `doc-source-conservation` | covered (closed migration); ongoing = `Provenance` field, part of check 3 | migration only |

### 1.3 One-off plan tools (retire candidates)

None is wired in `package.json`; each is referenced only by its tests, sibling plan scripts, `packages/git/contracts/mutation-census.v1.json` (75 hits) and `scripts/lib/git-one-door-declarations.v1.json` (15 hits).

| Script | Reads plan dir | Tests |
|---|---|---|
| `check-doc-constitution.mjs` (791) | `:30` PLAN_DIR | `check-doc-constitution.test.mjs`; helpers used by doc-health (move 2 small fns) |
| `check-doc-inventory-gates.mjs` (1481) | `:1337-1342` | `doc-candidate-conservation`, `doc-corpus-decisions`, `doc-restoration-proofs`, `check-doc-conservation`, part of `doc-decision-*`, `doc-review-*`, `generate-doc-inventory` |
| `generate-doc-inventory.mjs` (1997), `doc-inventory-artifact.mjs` | `:49` PHASE_DIR | `generate-doc-inventory.test.mjs`, `check-doc-conservation.test.mjs` |
| `propose-doc-decisions.mjs` (734) | `:238`, `:698` | `doc-decision-conservation`, `-exact`, `-review`, `doc-review-authorship`, `-format` |
| `check-doc-retirement.mjs` (312) | via constitution | `check-doc-retirement.test.mjs`; cited `docs/platform/migration-authoring-rules.md:44` |
| `doc-alias-resolver.mjs` (290) | `:22` alias table | `doc-alias-resolver.test.mjs` (useful once more for the G3 sweep) |
| `check-evidence-relocation.mjs` (445) | `:18` (file not on main; already unrunnable live) | `check-evidence-relocation.test.mjs` |
| `doc-binding-repair.mjs`, `doc-rationale-facts.mjs`, `doc-link-pass.mjs`, `compare-doc-global-closure.mjs`, `lib/doc-git-reads.mjs` | author/diagnostic tools | `doc-binding-repair`, `doc-rationale*`, `doc-link-pass`, `doc-global-closure`, `doc-git-reads` |
| `generate-shipped-path-inventory.mjs` (860) | `:706` | `generate-shipped-path-inventory.test.mjs`; possible CONV2 input (unresolved Q) |
| doc-health metadata mode of `check-doc-candidate-status.mjs` | `:33` switchboard | 7 switchboard/status cases in its test file |

Total: ~9.5k script lines, 23 test files / ~6.5k test lines. Keep: doc-health links path, `lib/doc-links.mjs`, `list-doc-anchors.mjs`, `check-decision-citation-drift.mjs` (not a plan tool). Plan-dir data (27 tracked files incl. 4.6 MB `alias-table.json`) stays: it is the DOCOS import source (plan §6.2, §10).

## 2. Gaps on main today (proved)

**G1 Phase 9 guards are dormant on design-lap (real, operational).** Activated release `sha256:e02ee83d…` (staged 2026-11-02, before `97dd62aa7`) embeds the old rules (2 `docs/platform` mentions). Proof: `conventionCheck(["docs/specs/new-thing.md","docs/platform/system/x.md","docs/platform/foo.md","docs/architect/y.md"])` through the activated host returns `{"checked":4,"violations":[]}`; `convention classify docs/platform/git/spec.md` returns `unknown-kind`. The hook and doctor are cold clients of the activated host, so retired roots can be re-added today. Source + `cargo test` are correct; fix is a stage/activate, not code.

**G2 Required metadata is unenforced (real).** Rule: governance §5 Required baseline, 12 fields (`docs/platform/governance.md:167-182`); constitution says it applies to every maintained canonical doc at cutover. Scan of `docs/platform/**` outside `metadataExempt` placements: 22 violations.
- `docs/platform/git/spec.md`: header block is not directly under H1 (a `Status:` paragraph precedes it), so no header is found.
- 20 docs miss the same 6 fields (`Implementation, Provenance, Writer type, Canonical for, Use this when, Do not use this for`), e.g. `agent-mailbox/spec.md`, `event-store/spec.md`, `holder-lock/spec.md`, `workflow/spec.md`, `runner/contracts/conserved-dispatch-doctrine.md`; `identity/spec.md` misses `Implementation`.
- All 302 headerless docs are exactly the `verification/<collection>/**` evidence payloads (metadataExempt), so the exemption set from convention is the right boundary.

**G3 Dead code/doc path references in canonical docs (real, larger).** Backticked repo paths (`src|scripts|bin|apps|packages|core|test|docs|plans/...`) absent at HEAD, canonical scope (excluding history, verification, reports, proposals, roadmap): 346 dead, of which 180 sit on a line pinning a commit sha (legit provenance, e.g. `platform-foundations.md:19`) and **166 unpinned in 43 docs** (57 `src/`, 51 `docs/`, 32 `plans/`, 11 `test/`, ...). Examples:
- `docs/platform/component-boundary.md:1035` "Existing code under `src/state/events.mjs`" (deleted `53523a917`);
- `docs/platform/architecture-map.md:409` table row for `src/state/events.mjs`;
- `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:66` `src/runner/dispatch/liveness.mjs` (deleted `340cc7d85`).
Top files: `runner/decisions/h-36d872fbb0e5.md` 23, `intent-preservation-ledger.md` 11, `convention/spec.md` 10.
Code comments citing retired doc roots: 9 lines (`src/state/store.mjs:768,1048,1174,1343`, `src/state/replay.mjs:770`, `src/setup/registrations.mjs:3273,3298,3331,4420`); outside Phase 10 scope, see unresolved questions.

**Hypothetical / not decidable:**
- Commands: 12 `fgos <verb>` names not in the Node registry; they are native verbs (`internal`, `coordination`, `secrets`, `terminal`) or historical wording ("thay `fgos unlock`", `runner/spec.md:205`). No proven dead verb.
- Skills: `fgos-*` names collide with crate names and error codes (`fgos-process`, `fgos-write-rejected`), so a regex check is ambiguous. Only `fgos-code-panel`/`fgos-panel` look stale. Noise is too high for a gate.
- Claim-level duplicate owner: `Canonical for:` is migration boilerplate, with only 18 distinct values; one string is shared by 60 docs. It cannot key an owner check. This is a DOCOS claims-engine input, not a Phase 10 check.

## 3. Plan: smallest Phase 10

Principle: no new `fgos doc` verbs and no parallel checker. Two doors own the work: Convention owns path and kind, and doc-health owns the body (`convention/spec.md:60,379`). Wire the reserved flags Phase 9 left in place and delete the plan-era tools.

| Step | Work | Files | Owning proof (one per behaviour) | Effort |
|---|---|---|---|---|
| 10.0 | Stage + activate a release built from main ≥ `97dd62aa7` on design-lap (LAND lane, owner hands, Q1) | none | existing: `fgos doctor` `active-release-matches-checkout` + `convention-conformance`; spot check `conventionCheck(['docs/specs/x.md'])` returns `forbidden-placement` | 0.5h |
| 10.1 | Classify exposes the reserved flags `canonical`, `metadataExempt`, `generated` (additive JSON fields; no contract break) | `packages/convention/rust/src/operations.rs` (`ClassifyOutcome`, `classify_with_rules`), classify golden case under `packages/convention/contracts/` read by `rust/tests/golden.rs`, `docs/platform/convention/spec.md` (classify output) | extend the existing classify golden case (one evidence-payload row, one canonical row) | 1h |
| 10.2 | Re-home doc-health: move the `--links-only` path to `scripts/doc-health.mjs`; delete the switchboard metadata mode; add the metadata rule "every `docs/platform/**/*.md` whose classify is not `metadataExempt` has a fenced `txt` header directly under H1 with every governance §5 baseline field" (fields read from governance.md as today). Classify only docs without a full header (~324 calls × ~5 ms measured ≈ 1.6 s) | new `scripts/doc-health.mjs` (moved code), delete `scripts/check-doc-candidate-status.mjs`; `scripts/lib/doc-links.mjs`; census JSONs; `docs/platform/convention/spec.md:379`; `docs/platform/governance.md` §5 names the check | move test → `test/scripts/doc-health.test.mjs`: keep links synthetic + live case; add 1 synthetic metadata case (exempt vs missing field vs misplaced header); the live case becomes the single wiring proof for both rules; retire the 7 switchboard/status cases (behaviour removed) | 3h |
| 10.3 | Content fix for G2: 22 docs (git/spec.md header placement + 6 or 1 fields per doc, real values, not boilerplate) | the 22 docs listed in G2 | 10.2 live case goes green | 2h (docs writer) |
| 10.4 | (Q2 = A) Dead-reference rule in doc-health: in docs whose classify says `canonical`, a backticked repo-root path must exist at HEAD unless the same line pins a commit sha (matches the existing provenance style). Sweep 166 refs; `docs/` refs resolved through `doc-alias-resolver.mjs` before 10.5 deletes it | `scripts/doc-health.mjs`; 43 docs; `docs/platform/governance.md` §11 Linking Discipline (one sentence) | 1 synthetic case (dead / pinned / existing) in `doc-health.test.mjs`; live case covers wiring | 1.5h code + 4-6h sweep |
| 10.5 | Retire plan-era tools listed in 1.3 (except the CONV2-pending one) + their tests; drop entries in `packages/git/contracts/mutation-census.v1.json`, `scripts/lib/git-one-door-declarations.v1.json`; fix `docs/platform/migration-authoring-rules.md:44`. Plan-dir data stays | ~14 scripts, ~22 test files, 2 census JSONs, 1 doc | removal only; name the new owner in the commit: links + metadata = `doc-health.test.mjs`, placement = convention golden; behaviour "migration inventory/conservation" removed with the migration | 2h + full `npm test` |
| 10.6 | Handoff: intent ledger row for DOCOS (write door, claim-level owner, skill/command refs) with this report's measurements | `docs/platform/intent-preservation-ledger.md` | none (doc) | 0.5h |

Order and blocking: 10.0 is independent (LAND). 10.1 → 10.2 → 10.3. 10.4 needs 10.2 and runs before 10.5 (it uses the alias resolver). File ownership is disjoint except `scripts/doc-health.mjs` (10.2, then 10.4, run serially). Shared-file collisions: the census JSONs (Git lane) and `docs/platform/convention/spec.md`. Check the board's "File chung dễ va" before landing.

Total: about 1.5 days with 10.4, about 1 day without it.

Rollback: every step is a revert of its own commit. 10.1 adds fields only, so reverting it breaks nothing upstream. 10.2 is the only step that removes a live check path; revert it together with 10.3/10.4. 10.5 deletes code only, and the plan-dir data stays.

Risks:
- **Medium:** classify host calls in npm test depend on `FGOS_HOST_BIN` / `target/debug/fgos`, the same harness as `test/convention/convention-client.test.mjs:13`. Reuse that.
- **Low:** the 10.4 sha-pin exemption could hide a stale claim that happens to sit next to a sha. Accepted, because the pinned lines are provenance by construction.
- **Low:** retiring the census entries races the Git lane. Check the board before landing.

Install/setup/doctor gate: no new config key, env var or doctor id. Not user-visible, so no CHANGELOG line. The exception is Q4 option A, which removes the `docs-lease` verb and a doctor row and therefore needs a CHANGELOG line. No component-boundary change.

### Cut (not worth it)

| Item | Reason |
|---|---|
| `fgos doc classify` | `fgos convention classify` is the door (L10, design principle 1) |
| `fgos doc new` | Board row DOCOS (`plan.md:80`) owns the write door. No failure observed |
| `fgos doc check` as a shipped verb | The rules check fgOS's own `docs/platform` layout (mission #3). A verb would ship repo-only rules to consumer projects. The doc-health script plus convention plus doctor already run |
| `fgos doc inventory` | The migration inventory is finished. `convention check --all` and the doc registry cover maintenance |
| `fgos doc retirement-check` | A retirement is now a delete. The doc-health live links case already fails on any dangling inbound link |
| Claim-level duplicate owner | `Canonical for` is boilerplate (one string shared by 60 docs), so there is nothing to key on. Goes to DOCOS |
| Skill/command reference checks | Ambiguous namespace, no proven dead verb. Goes to DOCOS |
| Lineage check | The ledger is sealed with a digest. Ongoing lineage is the `Provenance` field, which 10.2 enforces |
| Batch classify | Measured about 1.6 s per-path. A batch op would grow the contract for no real gain |
| Pre-commit doc-health | Phase 9 deliberately left it out (`convention/spec.md:379`). The test suite is the door |

## 4. Owner decisions (batched)

**Q1. Activate a post-cutover release on design-lap**
1. Chuyện gì đang xảy ra: the Phase 9 retired-root and placement guards do not run on design-lap.
2. Nguyên nhân: the activated release `e02ee83d…` was staged on 2026-11-02, before `97dd62aa7`. Through it, `conventionCheck` accepts `docs/specs/new-thing.md` and `classify` returns `unknown-kind` for `docs/platform/git/spec.md` (verified 2026-11-04).
3. Các lựa chọn:
   - A: LAND stages and activates from current main now. Cost: about 0.5h of IO on the QLC SSD in a quiet window. Gain: the guards go live.
   - B: wait for the next routine landing. Cost: nothing. Harm: retired roots can be re-added until then.
4. Khuyến nghị: A, because 10.2 and 10.4 also need the new classify output on the activated host.
5. Phạm vi: authorizes one stage, activate and verify by LAND. It does not authorize any code change.

**Q2. Dead-reference rule (G3)**
1. Chuyện gì đang xảy ra: 166 backticked paths in 43 canonical docs point to files that no longer exist, e.g. `component-boundary.md:1035`.
2. Nguyên nhân: Phase 9 checked clickable links only, and code spans stay literal (`convention/spec.md:379`).
3. Các lựa chọn:
   - A: a blocking rule in doc-health with a same-line commit-sha exemption, plus a one-time sweep. Cost: about 60 lines of code, 1 test case, 4-6h of doc edits.
   - B: cut to DOCOS and record the measurement only. Cost: 0. Harm: stale "existing code" claims stay and keep growing.
   - C: sweep once with no checker. Cost: 4-6h. Harm: it rots again.
4. Khuyến nghị: A. This failure is on the plan's observed list, and the sha-pin exemption matches how the docs already write provenance (180 lines).
5. Phạm vi: authorizes 10.4 and one sentence in governance §11. It does not authorize a skill or command check.

**Q3. Replace the five `fgos doc` surfaces with the existing doors**
1. Chuyện gì đang xảy ra: the Phase 10 text lists five new `fgos doc` surfaces. Every check they would run already has a door, or belongs to DOCOS.
2. Nguyên nhân: see the table in section 1.2 and the board row DOCOS `:80`. Prior art: none of these surfaces ever existed. The existing `fgos doc` verb is the registry lifecycle.
3. Các lựa chọn:
   - A: ship no new verbs and run the plan above (10.1-10.6).
   - B: add `fgos doc check` as a thin wrapper over convention check plus doc-health. Cost: about 80 lines, a registry entry, a manifest change and one wiring test. Harm: ships rules that only fit fgOS's own repo to consumer projects.
   - C: build all five. Cost: several days. Harm: this is a second checker beside the existing doors (L10).
4. Khuyến nghị: A.
5. Phạm vi: changes the Phase 10 surface list in the phase file. DOCOS scope is unchanged.

**Q4. Documentation-cutover lease after the cutover**
1. Chuyện gì đang xảy ra: the cutover freeze (`fgos docs-lease`, the pre-commit and reference-transaction guards, a doctor row, hooks in run/merge/workflow, a holder-lock registry row, 1249 test lines) stays live after the cutover. DOC has also just asked HARDEN to extend it into `fgos workflow gate` (board log, 2026-11-04 10:55).
2. Nguyên nhân: it was owner-accepted for the cutover (L12-13), and the plan has no retirement step for it.
3. Các lựa chọn:
   - A: retire it as its own item after Phase 10. Cost: about 0.5 day; touches shared files `lock-registry.v1.json` and `.githooks/*` (HARDEN/Git lanes) and needs a CHANGELOG line. Gain: every commit and every main ref update stops loading the lease code.
   - B: keep it dormant for a future DOCOS migration freeze.
   - C: keep it and extend it (the HARDEN request).
4. Khuyến nghị: A as a separate item. Withdraw the HARDEN `workflow gate` request until this is decided, so that work isn't wasted.
5. Phạm vi: authorizes opening the retirement item and withdrawing the request. It does not authorize editing holder-lock files inside Phase 10.

## Status

Status: DONE_WITH_CONCERNS
Summary: Of the eight Phase 10 checks, five already have an owner on main. The real gaps are dormant guards on the activated release (G1), unenforced required metadata in 22 docs (G2), and 166 dead backticked paths (G3). The plan closes them through Convention's reserved flags and a re-homed doc-health, adds no new `fgos doc` verbs, and retires about 9.5k lines of plan-era scripts.
Concerns: G1 means the Phase 9 guards are not protecting the design-lap checkout today. The 10:55 HARDEN request extends a mechanism that Q4 may retire. The report file name was given by the caller and may draw a warn-only `pattern-mismatch` from convention.

## Unresolved questions

1. Does CONV2 want `scripts/generate-shipped-path-inventory.mjs` (shipped-surface path inventory) as its Phase 00 input? If not, it retires with 10.5.
2. Do `decisions/` records (`h-*.md`, kind `decision`, `canonical:true`) fall under the 10.4 dead-reference rule, or are they historical like `history/`? `runner/decisions/h-36d872fbb0e5.md` alone holds 23 of the 166.
3. The 9 code comments citing retired doc roots (`src/state/store.mjs:768`, ...): fold them into the 10.4 sweep or file them as their own item (RUL11: outside the docs scope)?
4. Should the sealed history README's link to `plans/260925-.../plan.md` remain the permanent pointer? It pins the plan dir in place.
