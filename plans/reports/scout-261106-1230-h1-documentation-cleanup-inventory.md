# Documentation authority unification (plan 260925): leftover inventory

Read-only scout, 2026-11-06 12:30 Asia/Saigon. Main checkout `main` at `b1ef08a8f`. Nothing was moved or deleted. Recommendations: KEEP / DELETE / ARCHIVE-ELSEWHERE / ASK-OWNER. "Refs" counts tracked files that cite the path (`git grep`, excluding the file itself).

Key facts that drive the recommendations:

- The files kept on main under `plans/260925-documentation-authority-unification/` were kept at Land because code readers (scripts and tests) read them; owner-answers rules L13-119, L13-123 and L13-125 on the plan branch say so. Phase 10 commit `159971615` retired all those readers (41 files, 13 856 lines deleted). No script, test, src or package file reads any of these plan files now.
- The archive tag `archive/doc-260925-lineage` (-> `84bbfa7b8`, 2026-11-03 16:58) holds about **1.1 GB of the 1.19 GB git pack**. It covers every `land/260925-*` and `plan/260925-w1-*` branch, `plan/260925-doc-authority-seam8`, `origin/plan/260925-…` and all five `documentation-authority-phase-*` tags.
- **The local `plan/260925-documentation-authority-unification` branch (`8f863be07`) has 56 commits that are in neither main nor the tag** (2026-11-01 to 11-04, the L13 rulings and the post-land close). They add only about 0.2 MB of new objects. The evidence tarball was written at 2026-11-03 22:05, so at least `f06b8fd7a` (22:13) and `8f863be07` (11-04 10:15) are not in it. Deleting that branch or its worktree without another tag loses this record.

## Tracked

### `plans/260925-documentation-authority-unification/` (28 files, 6.0 MB on disk)

| Path | Size | Refs (outside reports) | Rec | Reason |
|---|---|---|---|---|
| `plan.md` | 67 KB | 11 (sealed history README:16,30; reading-map:95,220; switchboard; docs/platform/README; intent ledger; proposal; migration-authoring-rules; retire-lease plan; board) | KEEP | Phase-10 decision 5. `docs/platform/history/documentation-authority-unification/README.md` line 30 links to it. 13 of its 21 relative links are dead on main because phase 1-9 files and reports live only on the plan branch and in the tarball |
| `current-authority-map-2026-09-25.md` | 14.5 KB | reading-map:94,109,213; switchboard:97,110 | KEEP | Linked as the historical authority snapshot |
| `minimum-constitution.json` | 45 KB | intent-preservation-ledger:81-91 (11 rows cite it as evidence); archived convention plan | KEEP | Live evidence pointer in the intent ledger |
| `phase-10-post-cutover-maintenance-mvp.md` | 3.4 KB | linked from plan.md; 1 report | KEEP | Small; it is the record of the maintenance decisions |
| `alias-table.json` | 4.6 MB | 0 | ASK-OWNER | The old-to-new path map from the cutover. No reader and no doc link remains. It is useful only for resolving old paths in pre-cutover reports, and it is recoverable from `97dd62aa7`. Delete it, or keep it and link it from switchboard.md |
| `transitional-switchboard.json` | 75 KB | 0 | DELETE | Its reader was retired; `documentation/switchboard.md` is the kept human form; it is in the tag and the tarball |
| `pilot/` (17 files) | 0.95 MB | only as argv/path strings in `sealed-claim-ledger.json` | DELETE | Kept for the retired `check-doc-constitution.test.mjs` (L13-125). The sealed ledger already cites `ledger/decisions` and `reports/phase-06`, which are not on main, so it already depends on the tag and tarball |
| `claim-ledger.schema.json`, `claim-and-disposition-vocabulary.json` | 40 KB | sealed-claim-ledger.json:65,69 | DELETE (or ASK-OWNER) | Same as pilot: retired readers; the sealed digest already points at off-main paths |
| `independent-frontier-review-2026-09-25.md`, `…-rereview-…`, `…-review-prompt.md` | 44 KB | 0 outside reports (cited by 2 retrospective research reports) | KEEP | Cited by the retrospective series the owner will post; small |

DELETE subtotal: about 1.07 MB of working tree (the git pack does not shrink because the tag holds the blobs). If alias-table is deleted too: +4.6 MB.

### `plans/261104-1325-retire-documentation-cutover-lease/` (plan.md, 4 KB)

| Path | Refs | Rec | Reason |
|---|---|---|---|
| `plan.md` | board plan.md and log.md | KEEP | Closed (`ad72e3a46`); tiny; the board links it. ARCHIVE-ELSEWHERE to `archive/plans/` only if a closed-plan sweep moves its siblings too |

### `plans/reports/**` produced by this work (main)

The per-turn Doer reports and review files (11 657 files under the plan's `reports/`) were never landed on main; they live only on the plan branch, in the tag and in the tarball. On main there are 38 files, 494 KB:

| Group | Files | Size | Refs | Rec | Reason |
|---|---|---|---|---|---|
| Retrospective series: `retrospective-261105-1416-doc-260925-*` (evidence pack, post-1..6, facebook-post-1..6), `research-261105-1411-retrospective-*` (4), `research-261105-1412-…-built-and-gained`, `research-261105-1700-retrospective-method-reflection`, `research-261105-1738-retrospective-story-candidates-ranked`, `review-261105-1423-…`, `review-261105-1800-…` (3), `review-261105-1738-retrospective-series-outsider-read` | 25 | 352 KB | cross-linked among themselves (evidence pack: 9) | KEEP | The owner will post them |
| Handoffs and prompts: `advice-260929-2345-doc-authority-harness-executor-routing`, `prompt-261006-1533-resume-…`, `prompt-261006-1652-orient-…`, `resume-261006-1635-doc-authority-unification` | 4 | 44 KB | resume: 5 (incl. plan.md, retrospective post-3); advice: 4 (incl. retrospective trigger) | KEEP | The retrospective series and plan.md cite them |
| Maintenance and lease: `scout-261104-1016-doc-maintenance-facts`, `review-261104-1050-doc-maintenance-branch`, `scout-261104-1320-documentation-cutover-lease-retirement-facts`, `review-261104-1355-retire-cutover-lease-branch` | 4 | 65 KB | scout-1016: intent ledger, phase-10 file; lease ones: retire plan, board | KEEP | Live doc pointers |
| `research-261021-1707-doc-plan-dedup-components` | 1 | 34 KB | `docs/platform/proposals/documentation-system-unification.md` | KEEP | Cited by the proposal |

Not this plan, even though they mention it: `review-261026-*-doc-g4-*` (the DOC lane's Git one-door scanner, a live tool), `code-review-260925-*-unit-i11-*`, and the momentry `research-261105-*momentry*` reports. **Nothing in `plans/reports/` is recommended for deletion.**

### `docs/` items from the migration

| Path | Size | Refs | Rec | Reason |
|---|---|---|---|---|
| `docs/platform/history/documentation-authority-unification/README.md`, `sealed-claim-ledger.json`, `.sha256` | 4.5 KB | README is the sealed evidence index | KEEP | Sealed history |
| `…/evidence-relocation-manifest.after.json` | 504 KB | after-derivation.json cites it by sha256 | KEEP | Sealed |
| `…/evidence-relocation-manifest.after-derivation.json` | 6 KB | 0 | KEEP | Sealed |
| `…/evidence-relocation-manifest.json` (pre-edit form; differs from `.after` from line 850) | 504 KB | 0 | ASK-OWNER | Nothing cites it; it is recoverable from `97dd62aa7`. It is still part of the sealed set |
| `docs/platform/documentation/switchboard.md` | 12.5 KB | reading-map, governance, platform README, convention rule `doc-switchboard-doc-1`, `golden.rs:287` | KEEP | Live links plus a convention singleton and its golden test |
| `docs/platform/migration-authoring-rules.md` | 5.9 KB | governance:497,513,536; platform README; convention spec; rule `migration-authoring-rules` | KEEP (ASK-OWNER on its future) | Its own header says "Do not use for normal post-cutover workflow", but governance.md:497 still says "Authors must follow" it ("ratchet enforcement on legacy roots", and the ratchet is retired). Wording drift, not debris |
| `docs/platform/proposals/documentation-system-unification.md`, `intent-preservation-ledger.md` | 62 KB, 19 KB | many | KEEP | Live design and ledger |
| Snapshots the cutover added under `docs/platform/*/history/**`: agent-coordination/history/retired-engine (README, spec, 3 documentation-migration files), system-architecture/history (2), agent-confinement/history/rollout-and-settled-facts, work-state/history, ui-spec/history, documentation/history/templates (4) | about 150 KB | carried content; the templates are cited by intent ledger PF-I014 | KEEP | Conserved legacy content. The retired-engine `files/` and `inbound/` copies were already removed after Land |
| `docs/history/**` | none | — | — | The migration added nothing there |

Large JSON under `docs/`: only the two 504 KB manifests above belong to this plan. `docs/history/compound-learn-artifact-registry/reports/inventory-data.json` (302 KB) is not from this plan.

### `scripts/`, `test/`, convention rules

- Retirement verified: `159971615` removed the migration scripts and their 25+ tests. What remains (`scripts/doc-health.mjs`, `scripts/lib/doc-links.mjs`, `scripts/list-doc-anchors.mjs` and their tests) is Phase 10 maintenance tooling: KEEP. No script, test, src or package file references the plan dir, alias-table, switchboard JSON, constitution or the relocation manifests. `test/{run-supervisor,state}/*cutover*.test.mjs` belong to other cutovers.
- `scripts/check-decision-citation-drift.baseline.json:360` quotes a D8 line about the `documentation-cutover` lease. It is a baseline quote, not a reader: KEEP.
- `packages/convention/contracts/convention.rules.v1.json`: `doc-switchboard-doc-1` and `migration-authoring-rules` (placement-exception) exist only because those two docs exist, so they go if and only if the docs go. `retired-specs`, `retired-architect` and `retired-decisions` are guards: KEEP.

## Local worktrees, branches, tags

### Worktree

| Path | Size | Git | State | Last commit | Rec |
|---|---|---|---|---|---|
| `/home/vantt/projects/forgentX-phase00-documentation-authority-unification` | **21 GB** | registered worktree on `plan/260925-documentation-authority-unification` | clean (0 tracked changes) | `8f863be07` 2026-11-04 10:15 | DELETE after the branch's 56 unique commits are tagged (see below) |

Its breakdown: `target/` 11 GB (cargo build output); `plans/260925-…/` 7.0 GB, of which `reports/` is 6.8 GB tracked (in the tag and tarball) and the ignored `reports/doc-inventory.parts/` is **2.5 GB, 125 parts, not in git, not in the tarball**; `.fgos/runtime/tmp/step5-turn22` 1.6 GB plus `git-addon` 362 MB; `.gitnexus` 1.0 GB. The inventory parts were output of the retired `generate-doc-inventory` tool, and the tarball holds only the separate `phase-02-doc-inventory.parts` (10 parts). Their loss is acceptable if the owner agrees; this goes to the questions at the end.

No other worktree belongs to this plan. The 14 `.claude/worktrees/agent-*` worktrees are SEAT-era (10-20/21) and all are merged into main. `hl-target-p00` and the `tsk-*` worktrees are today's work by other sessions. `/home/vantt/projects/forgentX-worktrees/` and `/home/vantt/projects/worktrees/` are empty. The `forgentX-p9-w1-d*` worktrees that the launch scripts name no longer exist.

### Branches

| Ref | Contained in | Rec |
|---|---|---|
| `plan/260925-documentation-authority-unification` (`8f863be07`) | **56 commits only here** | ASK-OWNER. Recommend tagging, e.g. `archive/doc-260925-plan-record` at `8f863be07`, then deleting the branch |
| `origin/plan/260925-documentation-authority-unification` (`168a27c6c`, 10-13; the only 260925 branch on origin) | tag | ASK-OWNER (remote delete) |
| `land/260925-*`: 11 branches (dated-link-door, evidence-slim, g9-drift-tool, g9-refresh, legacy-mentions, links-fix, main-merge, overlay-successors, premise-pin, premise-successor-tool, scanner-residuals-r10) | tag | DELETE |
| `land/260925-product` (`97dd62aa7`) | main | DELETE |
| `land/260925-boundary-names` (`4e79539b2`), `land/260925-suite-fixes` (`36c61dc58`) | 1 commit each in neither main nor tag (`git cherry` shows +) | ASK-OWNER. Probably superseded by the `land/260925-product` squash; tag them or confirm first |
| `plan/260925-w1-d1..d6`, `w1-d4g`, `w1-revg`, `plan/260925-doc-authority-seam8` (9) | tag | DELETE |
| `doc/260925-maintenance` (`97cc4b432`), `doc/retire-cutover-lease` (`ad72e3a46`) | main | DELETE |
| `origin/review/doc-git-one-door` | tag | Not H1 (DOC lane Git work); leave to that lane |

Deleting branches frees about 0 bytes, because the tag keeps the objects.

### Tags

| Tag | Rec |
|---|---|
| `archive/doc-260925-lineage` (-> `84bbfa7b8`) | KEEP (owner). It is the 1.1 GB that keeps most of the pack |
| `documentation-authority-phase-00-20260925` … `phase-04-20261007` (5) | DELETE optional: all are ancestors of the archive tag, so the cost is 0 bytes. Or KEEP as named milestones |

## Local files outside git

| Path | Size | Date | Rec | Reason |
|---|---|---|---|---|
| `/home/vantt/projects/.doc-work/plan-260925-evidence-84bbfa7b8.tar.zst` + `.sha256` | 576 MB (603 330 240 B) | 11-03 22:05 | KEEP | Evidence backup, owner deciding. 11 911 entries, all under the plan dir (`reports/` 11 657, `ledger/` 198, `pilot/` 24) |
| `.doc-work/doc-heavy.lock` | 0 B | 11-01 | KEEP | The IO lock in use. No process holds it open right now |
| `.doc-work/land-suite.done` | 0 B | 11-01 | DELETE | Land suite marker; Land is done |
| `.doc-work/sweep-7cec.log` | 5.6 MB | 11-01 | DELETE | Pre-Land sweep log |
| `.doc-work/w189,w198,w199,w200,w206-audit.md`, `w212/` | 53 KB | 11-01 | DELETE (or ARCHIVE-ELSEWHERE into the tarball) | Doer-turn audits from the Land week. Not cited by tracked files |
| `/tmp/fgos-work/` (whole dir, 140+ entries) | **4.9 GB** | 10-25 … 11-04 | DELETE | All plan-260925 scratch: `w###` Doer-turn dirs, g8/g9/g10 gate runs, `composition-*`, `land-suite-c22263779-*`, `slim-*`, `succ`, `defer`, `doc-deadpaths`, `final-gates*`, `p9-*`, `ownership-controls-*` (Phase 9). Its own `doc-heavy.lock` (11-01) is a stale copy. The biggest entries are `w57b19a-f6bN` 3.2 GB and `land-id-1` 688 MB (a cargo target dir). No tracked file cites `/tmp/fgos-work` |
| `forgentX/.fgos/runtime/tmp/doer-turn-*` (1 686 files, turns 01-902) | 65 MB | 10-13 … 11-01 | DELETE | Doer turn briefs and `fgos run` output/err logs |
| `forgentX/.fgos/runtime/tmp/launch-w1.sh`, `launch-g.sh`, `launch-g4.sh`, `lead-handoff-261013.md` | 8 KB | 10-13 | DELETE | Plan 260925 Doer launchers and the Lead handoff |

The rest of `forgentX/.fgos/runtime/tmp` (1.4 GB in total) belongs to other lanes and is not H1: `gm1-*`/`gm2-*`/`g2-*` (two-doors-one-rununit), `landing-*`, `integ-identity-target` 723 MB, `*-target`, `cook-p4-*`, `config.json.bak-*`.

## Processes

401 processes are visible. None has its cwd or an open file in the phase00 worktree, `/tmp/fgos-work`, `.doc-work` or `forgentX-p9-w1-*`. The listeners are `herdr-go` :8787, `mdview` :7700 (cwd forgentX main) and the momentry eval `review.mjs` :4826 (cwd ~/projects/momentry). None of them is H1. Nothing needs stopping before the deletes.

## Not-H1 items (identify only)

| Path | Size | What |
|---|---|---|
| `docs/storytelling-material/` | 1.5 MB | momentry story box (KEEP, not ours) |
| `engineer/` | 21 MB, 10-20 | AgentKit/Codex install output (`.agentkit`, `.codex`, `.codex-plugin`, `skills`, `codex-ownership.json`); not H1 |
| `.fgos/porting/` | 12 KB, 10-17 | holds `events.lock` only; not H1 |
| `.momentry.json` | `{}`, 11-05 | momentry project marker; not H1 |
| `.fgos/backups/` | 1.7 MB, 10-02 | coordination-sessions backup and `test-leak-261001`; not H1 |
| `.fgos/dispatch/` | 12 KB | `reconcile.lock`; not H1 |
| `/home/vantt/projects/fgdoc.txt` | 2.3 MB, 10-15 | a test log from `forgentX-doctor-layout-copies`; not H1 |
| git stash (73 entries) | — | none named for this plan |

## Totals (reclaimable disk)

| Rec | Items | Space |
|---|---|---|
| DELETE | phase00 worktree (after the tag is decided) 21 GB; `/tmp/fgos-work` 4.9 GB; doer-turn and launch files 65 MB; `.doc-work` small files 5.7 MB; tracked plan files (switchboard JSON, pilot, schema, vocabulary) 1.07 MB; 24 branch refs (about 0 B) | **about 26 GB** |
| ASK-OWNER | `alias-table.json` 4.6 MB; `evidence-relocation-manifest.json` 0.5 MB; plan branch + `origin` branch + 2 `land/*` branches with unique commits (0.2 MB of objects, but loss of record); the 2.5 GB `doc-inventory.parts` is part of the 21 GB worktree figure | 5.1 MB tracked; record risk |
| KEEP | archive tag (1.1 GB pack); tarball 576 MB; `doc-heavy.lock`; plan.md, current-authority-map, minimum-constitution, phase-10 file, frontier reviews; all 38 reports; sealed history files; switchboard.md, migration-authoring-rules.md and their convention rules | — |
| ARCHIVE-ELSEWHERE | optional: the retire-lease plan to `archive/plans/`; the `.doc-work` audits into the tarball | about 0 |

Tracked deletes do not shrink `.git`, because the tag holds every blob. Real disk is freed only by the worktree and the scratch dirs.

## Unresolved questions

1. Should the 56 plan-branch commits (`8f863be07`, which postdates both the tag and the tarball) be tagged before the branch and worktree are deleted? Recommendation: add a second tag (cost about 0.2 MB) rather than move the existing one.
2. `land/260925-boundary-names` and `land/260925-suite-fixes` each carry one commit that is in neither main nor the tag: tag them, or confirm the product squash superseded them?
3. Should the 2.5 GB ignored `reports/doc-inventory.parts/` in the worktree, which is not in git and not in the tarball, be lost with the worktree, or added to the tarball first?
4. `alias-table.json` (4.6 MB, unlinked): delete it, or keep it and link it from switchboard.md as the old-path lookup?
5. Should `origin/plan/260925-documentation-authority-unification` be deleted on the remote?
6. Wording drift outside the deletion scope, for a follow-up item: `docs/reading-map.md:210-211` calls a missing `transitional-switchboard.md` "the operative switchboard"; `docs/platform/governance.md:497-498` still says authors "must follow" migration-authoring-rules with "ratchet enforcement on legacy roots", and that ratchet is retired.
