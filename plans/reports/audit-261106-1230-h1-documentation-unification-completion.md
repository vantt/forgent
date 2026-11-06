# Audit: is H1 "Platform authority unification" complete?

Date: 2026-11-06 (Asia/Saigon). Main checkout at `b1ef08a8f`. Read-only audit: nothing was edited except this report.

**Verdict.** H1's physical cutover is done and proven. The two legacy trees are gone, the guards are on main and inside the active release, the lease is removed, and doc-health is green. H1 is still not finished against proposal §5.4 and §10.11 ("no legacy authority or dependency remains"). A handful of live documents and tools still present the retired paths as current or as the authority route: the reading map, the governance doc, one area spec, a live preflight script, and two core skills. Bookkeeping also lags: the intent-ledger row, the board row, and the L13-159 ruling, which is cited on main but recorded only on a local branch. All the fixes are small text or default changes. None needs new tooling.

## Done (with evidence)

| Item | Evidence |
|---|---|
| §5.4 no maintained files under `docs/specs/**`, `docs/architect/**` | `git ls-files` returns 0 for `docs/specs`, `docs/architect`, `docs/architecture`, `docs/guides`, `docs/proposals`. Old root authorities (`docs/platform-foundations.md`, `docs/io-contract.md`, `docs/transitional-switchboard.md`) are gone. The retained roots are `docs/backlog.md`, `docs/reading-map.md`, `docs/architecture-manifest.json`, generated `docs/decisions/index.md` and the registries. |
| H1 steps 1-7 (constitution, inventory, pilot, transform, review, atomic promote) | plan.md §7: Phases 1-9 closed. Phase 9 landed as main `97dd62aa7` (2026-11-03, one product commit, L13-156). The evidence is on local tag `archive/doc-260925-lineage` (`84bbfa7b8`). |
| H1 step 8 (maintenance MVP) | Phase 10 landed as `97cc4b432` (2026-11-04). 10.1 classify flags: `46310f968`. 10.2-10.4 doc-health with link, metadata and dead-reference rules: `8b38f576c`, `0aef4b710`, `b7873f150`. 10.5 retired 15 migration scripts and 24 tests: `159971615`. 10.6 ledger row PF-I024 hands three checks to DOCOS: `2d9850892`. |
| Guard: no legacy roots | Convention rules `retired-specs`, `retired-architect` and `retired-decisions` have `posture: block` (`packages/convention/contracts/convention.rules.v1.json:143-145`) and are proven by the golden case (`convention.golden.v1.json:5-13`). Enforced in pre-commit (`.githooks/pre-commit:508-546`, `warnOnConventionViolations`, through the host) and in doctor (`convention-conformance`, `src/setup/registrations.mjs:5274`). Live check: the active release binary refuses `docs/specs/new.md` and `docs/architect/x.md` with `forbidden-placement`. |
| Guard: placement | The same Convention door. Since `2adf060b6` (2026-11-06, today) a catch-all `unplaced-docs` rule refuses any unnamed `docs/**` path. `fgos convention check --all` with the active release: 4,394 checked, 0 docs violations (the 91 warnings are all `plans/reports` naming). |
| Guard: platform links | `scripts/doc-health.mjs`, enforced by the npm-test live case `test/scripts/doc-health.test.mjs:123`. Run today under flock: `617 platform documents, 2594 local links, 302 metadata-exempt, 0 finding(s)`, exit 0. |
| `docRegistry.enforce` (§5.4) | `.fgos/config.yaml:250-253` `enforce: true`. |
| Lease retired | `ad72e3a46` (2026-11-04, plan `plans/261104-1325-retire-documentation-cutover-lease/plan.md`, status closed). Its acceptance `rg` over `src bin scripts packages apps .githooks test core domains .agents plugins` finds only one baseline text line (`scripts/check-decision-citation-drift.baseline.json:360`) and one fixture string (`test/scripts/git-one-door-declarations.test.mjs:121`). `.githooks/reference-transaction` is gone. |
| Release carries the work | Active release `47e1016d` (`.fgos/installation/activation.json`, activated 2026-11-04T09:08Z) is built from `b04719424`, which contains `97dd62aa7`, `97cc4b432` and `ad72e3a46` (`git merge-base --is-ancestor`). Board log 11-04 16:15 (LAND): `docs-lease` verb and doctor check are gone, and doctor shows only the six known reds. The post-6 open point "guard not effective through the installed fgOS" is now resolved: re-checked live above. |
| Live code free of legacy routes | `AGENTS.md`, `CLAUDE.md`, `README.md`, `core/`, `domains/`, `src/`, `bin/`, `.githooks/`, `.agents/skills`, `plugins/fgOS/skills`, `apps/`, `.claude/`: 0 references to `docs/specs`, `docs/architect`, `docs/guides`, `docs/proposals` or the old root authorities. The exception is the retired ADR files listed under "Open" below. |
| Post-Land list (board log 2026-11-03 23:50) | (1) L13-152.2 records (151 overlay reviews + 10 preservation rows), (2) fresh claim snapshot L13-154.6, (4) refresh batch r8: all **closed as recorded** by L13-159 (`8f863be07`, 2026-11-04; the 10 preservation rows were already 0 via L13-149). (3) `fgos workflow gate` docs-lease check: withdrawn 11-04 11:10 and made moot by `ad72e3a46`. (5) Off-machine copy of the lineage commits (L13-158): superseded by L13-159.2, so no copy is made. (6) Five main-red test groups: handed to MAIL, HARDEN and TEST (`03e120616`). These belong to other lanes, not H1. |
| Plan status | `plan.md` frontmatter `status: completed`. Status block: "Closed (Phases 1-10 closed …)". `phase-10-…md` `status: completed`. |

## Open — must do to finish H1

Each item is a remnant that §5.4 names ("instructions … that treat legacy paths as authority", "generators", "skills or prompts", "archive/history pages that remain in normal reading routes"). Sizes: XS is under 10 lines and S is under 50.

| # | Where | Problem | Proposed fix (size) |
|---|---|---|---|
| O1 | `docs/reading-map.md:30`, `:90`, `:106` (AGENTS.md's first read) | Routes "Resolve documentation authority" and "follow the … authority switchboard" to `platform/documentation/switchboard.md`. That file itself says it is "evidence, not a second operative authority router", and `docs/platform/README.md:81` says the same. The entry point contradicts the document it routes to. | Point "resolve authority" at the area portal / `docs/platform/README.md` and governance. List the switchboard only as transition evidence. (XS) |
| O2 | `docs/platform/governance.md:497-498` | "Authors must follow migration-authoring-rules.md (… ratchet enforcement on legacy roots)". The ratchet was retired and that file's own header says "Do not use this for: Normal post-cutover documentation workflow". This is a live instruction that leads to a migration-time doc. | State the one-owner rule inline (or cite governance §5 and §8) and drop the "must follow" link and the ratchet clause. Keep the doc as evidence. (XS) |
| O3 | `docs/platform/documentation/switchboard.md` header `Canonical: Yes`, and convention rule `doc-switchboard-doc-1` `canonical:true` (`convention.rules.v1.json:141`) | A retired router is still classified canonical, so doc-health treats it as a live canonical doc. | Classify it as history/evidence (move under `docs/platform/documentation/history/` or set the rule to non-canonical) and update inbound links (README, governance, reading map). Decide together with O1/O2. (S) |
| O4 | `docs/platform/decision-citation-drift/spec.md:39,49,59,85,92` | The current spec says the scan scope is "exactly `docs/backlog.md` plus `docs/specs/*.md`" and that the default `--specs-dir` is `docs/specs`. Code now reads `docs/platform/**` specs and decisions. | Rewrite R1/R3, row 5 and the CLI default text to the real scope. (S) |
| O5 | `scripts/check-decision-citation-drift.mjs:300-301`, `:436`, `:442` (live: `fgos preflight` at `bin/fgos.mjs:4335`, `src/state/retrospective-doors.mjs:23`) | Defaults are `--specs-dir docs/specs` and `--decisions-dir docs/decisions`, and the code compares against the retired path as a sentinel to decide whether to read `docs/platform`. That is a generator still keyed on a legacy path. | Make the default the platform root, delete the sentinel comparison, and adjust `test/scripts/check-decision-citation-drift.test.mjs:113,282,297,788` fixtures. Same item as O4. (S) |
| O6 | `docs/platform/system-architecture/architecture/roadmap.md:274-279` ("§9 Spec Update Rule") | Live instruction: "new architecture writing stays under `docs/architect/` (deleted…)" and "`docs/specs/*` is treated as generated/curated state". | Replace with the governance route, or mark the section historical. (XS) |
| O7 | `docs/platform/packaging-distribution/README.md:259-261`, `:271`; `spec.md:444` | "The older generated specs under `docs/specs/*` … Read as current generated state". The `Superseded by:` pointer names the deleted `docs/architect/workspace-topology.md`. | Drop the docs/specs row and pin or replace the successor pointer. (XS) |
| O8 | `docs/platform/documentation/architecture/documentation-system-design.md:655-657` | "`docs/specs/**` in the current repo should be treated as …". This is present tense about a deleted tree. | Past tense, or remove. (XS) |
| O9 | `core/skills/_shared/executor-dispatch-fallback.md:239`, `core/skills/fgos-clarifying/SKILL.md:100` (rendered into `.agents/skills`) | Live skill text cites `docs/decisions/0026-…md`, a file in the retired ADR corpus, which Convention now refuses (`retired-decisions`). This is the §5.4 "skills or prompts" remnant. | Cite the D-ADR0026 holder from `docs/decisions/index.md`, then `npm run build:skills`. (XS) |
| O10 | Tests named or scoped on the retired tree: `test/runner/dead-vocabulary-guard.test.mjs:404,418` (`searchDirs` includes the non-existent `docs/specs`), `test/docs/rul11-anchor-phrase.test.mjs:30` (title), `test/docs/decisions-corpus-retired.test.mjs:5,16,67` (comments and title) | The assertions already read `docs/platform`, but titles and dead search dirs still name the legacy path (DP8: the test title names the behaviour). | Rename titles and drop `'docs/specs'` from `searchDirs`. No assertion change. (XS) |
| O11 | Code comments citing deleted docs: `scripts/knowledge-migration.mjs:14,154,317` (`docs/architect/knowledge-registry-redesign.md`), `test/state/status-category.test.mjs:76`, `test/state/decision-relation.test.mjs:8`, `docs/platform/runner/contracts/conserved-dispatch-doctrine.md:42` | Phase 10 Decision 2 swept 9 comments, but these remain. | Pin the commit or point to the platform successor. (XS) |
| O12 | `docs/decisions/index.md` (generated; AGENTS.md routes here). 36 rows say "narrative di dời sang docs/specs/<area>.md" | A generated projection still surfaces legacy authority (§5.4). The text comes from immutable `state.decisions` events, so it cannot be edited at the source. | Have `fgos decision-index` resolve the holder through the governance scope→holder table (which already exists) instead of printing the event's path. Regenerate. (S, code) |
| O13 | `docs/platform/intent-preservation-ledger.md:75` (PF-I005) | Still `accepted-not-implemented` with current state "Several … areas coexist with legacy/current and root authority". That is false since `97dd62aa7`. PF-I020 (`:90`) still says "14 files … `unknown-blocking`", although its revisit trigger (the cross-area review) has passed and Convention now places `docs/user/README.md` and the registries. | Set PF-I005 to implemented with evidence `97dd62aa7` and `97cc4b432`. Close or re-state PF-I020. (XS) |
| O14 | `plans/260925-documentation-authority-unification/plan.md:280` cites L13-159, but the ruling exists only in `reports/phase-09/owner-answers.md` on local branch `plan/260925-…` (`8f863be07`), which is not on main or origin | A stranger agent cannot resolve why the post-Land records were closed and no off-machine copy was made (L5 question 6). The retrospective evidence pack (`plans/reports/retrospective-261105-1416-doc-260925-evidence-pack.md:150,215`) flags the same gap. | Copy the L13-159 ruling (about 12 lines) into plan.md §7.5b or the status block. (XS) |
| O15 | `plan.md:20-21` | "Execution authority: … no authority for Phases 9-10" and "Resume state (2026-10-06)" are stale beside "Closed". plan.md also has 13 dead relative links: `phase-01…09-*.md`, `dropped-claims-register.json`, `evidence-payload-relocation-policy.md`, `reports/phase-08/owner-answers.md`, `reports/resync-261006/`. They exist only at the tag. | Update the two lines. Add one note: "phase files 1-9 and reports live at tag `archive/doc-260925-lineage`" (as already done for Phase 11). (XS) |
| O16 | Board `plans/261017-1313-fgos-platform-program-board/plan.md:79` (DOC row) | The status cell opens with "Phase 8 ĐÓNG … chưa land main". Column 5 still says "nhánh `plan/260925-…`, lead `forgentx-5f`". There is no single closed state. Roster line 51 still lists `lead:DOC` as active. | Lead the cell with "**closed** 11-04 (Phase 10 `97cc4b432`, lease `ad72e3a46`, release `47e1016d`)". Clear the branch/lead cell, and retire or re-scope the DOC role on line 51. (XS) |

Also noted, lower priority (counted, not listed one by one):

- Pinned provenance shas. 19 distinct commit shas pinned in `docs/platform` and the reading map are not ancestors of `origin/main`. Examples: `77830ba77…` (34 citations), `83d757f4d…`, `fcfe78cb8…`, `3e2d05af8…`, `2a028cdc9…` (the sealed-ledger digest pin). They exist locally at the tag and, by chance, on `origin/review/doc-git-one-door` and `origin/review/opc-scan-lows`. If those two review branches are deleted, a fresh clone cannot resolve the citations. L13-159.2 accepted this risk, but only on the local branch (see O14). Decision for the owner: Q1 below.
- Pre-commit fails open. If the host errors, the Convention check only warns (`.githooks/pre-commit:543-545`). doc-health runs only inside `npm test`, not in pre-commit or doctor. The post-6 retrospective notes this as a deliberate choice. Report only; no change proposed.

Reference counts (legacy path regex `docs/(specs|architect|guides|proposals)/|docs/(io-contract|transitional-switchboard).md`):

| Area | Refs / files | Classification |
|---|---|---|
| `docs/platform` history/decisions/verification/reports | 3,343 / 294 | fine (history) |
| `docs/history/**` | 838 / 258 | fine |
| `docs/platform` live docs | 249 / 118 | ~219 are pinned "Retained source / Source carriage / Carriage note / Source type: Promoted / (deleted in 97dd62aa7)" provenance lines or `proposals/`; the semantic remnants are O4, O6-O8 |
| `docs/knowledge` 49/9, `docs/explanation` 12/10, `docs/how-to` 1/1, `docs/distillery` 53/8, `docs/ui-spec` 10/1 | user and research docs, past-tense narrative | H2 profile (see below) |
| `docs/decisions/index.md` | 36 / 1 | O12 |
| `docs/reading-map.md` | 3 (2 Provenance lines + `:150` "khác `docs/specs/` là BA-reference") | `:150` folds into O1 |
| `scripts/` | 41 (35 baseline JSON keys, 3 in `check-decision-citation-drift.mjs`, 3 in `knowledge-migration.mjs`) | O5, O11; baseline keys are recorded findings, fine |
| `test/` | 54 fixtures (recorded run payloads, synthetic `docs/specs/widget.md` refs), 29 elsewhere | fixtures fine; O10/O11 for names and comments |
| `packages/` | convention rules and golden (the guard itself), one yaml-doc fixture string | fine |
| `AGENTS.md`, `CLAUDE.md`, `README.md`, `core/`, `domains/`, `src/`, `bin/`, `.githooks/`, skills, `apps/` | 0 (except O9) | done |

Re-check after the fixes: re-run the regex above over the live areas, `node scripts/doc-health.mjs`, and `fgos convention check --all`.

## Open — belongs to another lane

| Item | Lane |
|---|---|
| A new release activation to carry `2adf060b6` (the `unplaced-docs` catch-all, 2026-11-06). The active release `47e1016d` still admits e.g. `docs/guides/x.md` and `docs/proposals/x.md` (checked live: 0 violations). | LAND |
| The five main-red test groups from the post-Land list (fgctl fixture modes, dev-host timeout, mailbox v7n/live-confined, herdr `.config`, cargo `mailbox_routes`) | MAIL / HARDEN / TEST (handed off in `03e120616`) |
| CHANGELOG `[Unreleased]` has no line for the `unplaced-docs` refusal (user-visible) | whoever owns `2adf060b6` (Convention lane / today's session) |
| `docs/backlog.md:75` names the deleted `route-table-pending.md` | COOK (board log 11-06 12:35) |

## Not H1 (H2/H3)

- Root user quadrant dirs still exist: `docs/explanation` (136 files), `docs/how-to` (33), `docs/reference` (7), `docs/tutorials` (`.gitkeep`), `docs/knowledge` (332). §5.4's "no legacy root-level user quadrant directories" is the whole-program gate. Retiring them is H2 step 3 (§9.2), recorded as PF-I010.
- PF-I024 / DOCOS (board row 80, `not-planned`): one write door (`fgos doc new/classify`), a claim-level owner check, and a skill/command existence check.
- §10 items 1, 9 and 10 (mandatory authoring door, bounded effective brief, trace to detail) and the H3 Agent Context Engine (PF-I007).
- The registry/index triplication and `doc-provisional-aged` defects (§4.7.1 note) are H2 step 1 prerequisites.
- Past-tense `docs/specs` mentions in `docs/knowledge` and `docs/explanation` (about 60 lines). These are user-profile narrative and get resolved with the H2 profile/alias work, not H1.

## Unresolved questions

1. Lineage shas (O14 and the first bullet under "Open"): should the owner's L13-159.2 acceptance of a local-only lineage stand, given that 19 cited commits are reachable on origin only through two `review/*` branches? Alternatives: (a) push the tag `archive/doc-260925-lineage` to origin (packed about 1.4 GB); (b) protect or keep those two review branches; (c) accept that the citations break on a fresh clone.
2. O3: should the switchboard move under `documentation/history/` (path change, link updates) or stay in place with a non-canonical classification? Either works. Moving it is cleaner for §5.4 "archive pages in normal reading routes".
3. O12: is a projection-side holder resolution in `fgos decision-index` in scope for DOC, or should it go to the decision-index owner as a separate item?
4. Is the DOC lane (board line 51) to be closed, or kept to do O1-O16? DOCOS is still `not-planned`.
