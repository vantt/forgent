# Step 8 evidence: specs and ui-spec

Read-only evidence for the Doer and Lead. It decides nothing. Plan files were read pinned to `2d6d53884` (the worktree HEAD, which equals what was read); the map is `plans/260925-documentation-authority-unification/ledger/area-map-specs-ui.md` (source pin `fd6c9ab9e`, dated 2026-10-08). `main` (`3aeb8d1bb`) has the same blob as the worktree HEAD for every one of the 27 sources. Unit counts come from `extractMarkdownConservationUnits` / `extractMixedFileConservationUnit` in `scripts/generate-doc-inventory.mjs` run on HEAD blobs, cross-checked with `reports/phase-06/baseline-counts.md` (557 rows at pin).

## 1. Source table (27 files)

Kind and operation are the map's. "Units now" is the HEAD count. "Pin" is the baseline-counts figure where one exists. Blob drift compares the map's `Source blob` (identical to `reports/phase-06/source-blobs.txt` for all 27) with the HEAD blob.

| # | Source | Units now | Kind | Target (map) | Operation | Blob vs map pin |
|---|---|---:|---|---|---|---|
| 1 | docs/specs/confinement-authority.md (1400 lines, 92.9 KB) | 200 (pin 191) | spec | docs/platform/agent-confinement/spec.md | split | CHANGED (778a93f0 -> 63a2cb78) |
| 2 | docs/specs/decision-citation-drift.md | 20 | spec | docs/platform/decision-citation-drift/spec.md | split | same |
| 3 | docs/specs/distillery.md | 21 | spec | docs/platform/distillery/spec.md | split | same |
| 4 | docs/specs/fgos-plugin.md | 45 | spec | docs/platform/claude-plugin/spec.md | split | same |
| 5 | docs/specs/herdr-web-dashboard.md | 44 | spec | docs/platform/herdr-web-dashboard/spec.md | split | CHANGED (56055733 -> e7edb566) |
| 6 | docs/specs/observe.md | 25 | spec | docs/platform/observe/spec.md | split | same |
| 7 | docs/ui-spec/00-overview.md | 16 | spec | docs/platform/ui-spec/spec.md | place verbatim | same |
| 8 | docs/ui-spec/15-system-events.md | 9 | contract | ui-spec/contracts/15-system-events.md | place verbatim | same |
| 9 | docs/ui-spec/20-domain-rules.md | 5 | contract | ui-spec/contracts/20-domain-rules.md | place verbatim | same |
| 10 | docs/ui-spec/30-states-and-errors.md | 30 | contract | ui-spec/contracts/30-states-and-errors.md | place verbatim | same |
| 11 | docs/ui-spec/components/C01-item-card.md | 12 | architecture | ui-spec/architecture/components/ | place verbatim | same |
| 12 | docs/ui-spec/flows/F01-answer-a-parked-question.md | 10 | guide-runbook | ui-spec/operations/ | place verbatim | same |
| 13 | docs/ui-spec/flows/F02-approve-a-merge.md | 9 | guide-runbook | ui-spec/operations/ | place verbatim | same |
| 14 | docs/ui-spec/generated/action-registry.csv | 1 | history | ui-spec/history/generated/ | place verbatim | same |
| 15 | docs/ui-spec/generated/coverage-report.md | 5 | history | ui-spec/history/generated/ | place verbatim | same |
| 16 | docs/ui-spec/generated/navigation-graph.yaml | 1 | history | ui-spec/history/generated/ | place verbatim | same |
| 17 | docs/ui-spec/generated/surface-registry.yaml | 1 | history | ui-spec/history/generated/ | place verbatim | same |
| 18 | docs/ui-spec/generated/wireframe-v2.html (631 KB) | 1 | history | ui-spec/history/generated/ | place verbatim | same |
| 19 | docs/ui-spec/modals/M01-answer-question.md | 11 | architecture | ui-spec/architecture/modals/ | place verbatim | same |
| 20 | docs/ui-spec/modals/M02-approve-merge.md | 12 | architecture | ui-spec/architecture/modals/ | place verbatim | same |
| 21 | docs/ui-spec/modals/M03-add-edit-item.md | 13 | architecture | ui-spec/architecture/modals/ | place verbatim | same |
| 22 | docs/ui-spec/schema/surface-contract.schema.json | 1 | history | ui-spec/history/schema/ | place verbatim | same |
| 23 | docs/ui-spec/screens/S01-sign-in.md | 14 | architecture | ui-spec/architecture/screens/ | place verbatim | same |
| 24 | docs/ui-spec/screens/S02-taskboard.md | 20 | architecture | ui-spec/architecture/screens/ | place verbatim | same |
| 25 | docs/ui-spec/screens/S03-task-detail.md | 24 | architecture | ui-spec/architecture/screens/ | place verbatim | same |
| 26 | docs/ui-spec/screens/S04-questions-needing-answer.md | 15 | architecture | ui-spec/architecture/screens/ | place verbatim | same |
| 27 | docs/ui-spec/spec.config.yaml | 1 | architecture | ui-spec/architecture/spec.config.yaml | place verbatim | same |

Totals: 27 files; 566 units now (557 at pin; the 9-unit growth is all in confinement-authority.md). Specs 6 files / 355 units now (346 at pin); ui-spec 21 files / 211 units. `git ls-files docs/ui-spec` is exactly these 21 files (none unmapped). No source appears in another area map. No row is identical across two Step 8 files except one heading-only pair (decision-citation-drift and fgos-plugin `#behaviors-operations`).

Per-section unit counts that matter for split boundaries:
- confinement-authority.md: preamble 3; s1 8; s2 5; s3 8; s4 7; s5 11; **s6 Canonical contracts 81 (lines 211-969, TypeScript interfaces)**; s7 3; s8 22; s9 14; s10 rollout/status 3; s11 13; s12 proposal decisions 2; s13 settled facts and open deferred items 18; s14 pointers 2.
- observe.md: preamble 2; s6 "Lich su quyet dinh" (D-ADR0037) 3 units at lines 76-92. The rest is current spec.
- The other four specs use the Pilot-B-style section set (Purpose, Entry Points, Data Dictionary, Behaviors, Actors, Business Rules, Edge Cases Settled, Open Gaps, Visuals, Pointers) with YAML front matter.

## 2. Step 8 rules and what applies

Phase text, "Step 8": "One area per spec (spec, contracts, decisions as content requires; Pilot B shape); `docs/ui-spec/**` as one area. Decide `observe.md` and `confinement-authority.md` last, comparing their blob ids with `source-blobs.txt` before each commit. Done: check E."

Applicable rules found in the phase text and owner answers:
- Q3 a (place by kind, text verbatim; `archive-with-reason` delegated to the executor). Q5 and N1 do not touch these files.
- A19: liveness scan first (script, section level, committed), then a carriage-only pass, then a separate truth pass limited to sections classified current. Carriage review does not judge truth.
- A28 items 3 and 4: truth is a per-batch 30-unit sample (more than 10% false stops for the owner) and in full at promotion; candidate-native units go on the candidate-unverified list; closure compares strict E against holds, identical-unit exceptions and that list.
- A34: partial carries need an independent ok review, a verbatim residual file bound by SHA256, and join the closure lists.
- A36: sampled deep review (15% of Weak-exact and Judgment, minimum 10, all digest-differing pairs); more than 3% rework among deep rows means a full read.
- A38: Lead-spawned fresh-context reviewers and readers count as independent.
- A31: main merges only at batch boundaries; code-evidence receipts re-pinned by machine when cited bytes are unchanged.
- A9 and N1: a generated file keeps `regenerate-from-source`; a corpus rule must not overwrite it. Constitution section 4: Generated class means `regenerate-from-source`.
- Shared rules: P1 syncs main and records source blob ids; P2 freezes the map (new subdivisions labelled `Added in candidate`); P3 authors with full header (Document type, Audience, Purpose, Design status Candidate, Implementation, Provenance, Writer type, Canonical for, Use this when, Do not use this for, Last reviewed, Related, Supersedes, Superseded by), portal last; P4 shards `s8-<area>-<part>.json`, <= about 500 rows each; stop conditions 6 (drift above 10%), 9 (hot targets), 11 (effort), 13; fresh readers (key committed first, 3 scenarios, >= 5 of 6, 0 missing anchors, <= 8 files) per area; red-team pass is listed for Steps 2, 5, 7, 9, 10 only (Step 8 has none).
- Plan B rule (Step 6 text) names only `docs/specs/distribution.md`, `docs/specs/system-overview.md` and `docs/platform/component-boundary.md`. None is a Step 8 source, so the blob-compare/re-pin rule does not bind Step 8. The `.claude/rules/documentation-management.md` component-boundary check does: Step 8 creates seven candidate areas (agent-confinement, decision-citation-drift, distillery, claude-plugin, observe, ui-spec, plus the spec for herdr-web-dashboard), so the report needs an explicit "No component-boundary change" or a change note, as Step 6 did. Plan B itself (`plans/261006-1415-fgos-convention-component`) now sits in `archive/plans/` in the working tree status.
- Stop condition 9 lists only packaging-distribution, distribution.md and runner.md; no Step 8 source is on it.

## 3. Live references (outside plans/ and archive/)

| Source | Live references found |
|---|---|
| confinement-authority.md | Code comments citing section numbers: src/runner/dispatch/confinement/authority.mjs:2, backend-registry.mjs:2, policies.mjs:2, request.mjs:2 (section 1, 5.2, 6.1-6.10); src/setup/registrations.mjs:5175; tests test/runner/dispatch-confinement-p04.test.mjs:3 and p05.test.mjs:3. Docs: docs/routing-handoff-contract.md:88 (section 9.2), docs/architecture-map.md:372 (CTR010), docs/specs/reading-map.md:39, docs/how-to/configure-and-operate-agent-confinement.md, docs/reference/dispatch-module-boundaries.md, docs/specs/runner.md. Section-number citations (`§6.2`, `§9.2`) will break if the split changes numbering. |
| decision-citation-drift.md | scripts/check-decision-citation-drift.mjs and its test (by name, not path); docs/specs/reading-map.md:25; core/skills/_shared/citation-format.md; docs/how-to/fix-bare-citation-findings.md. |
| distillery.md | docs/specs/system-overview.md:62 (and an unmapped "distill-skill spec-pending" row); no code reference. |
| fgos-plugin.md | docs/specs/reading-map.md:35; docs/architect/component-boundary/component-boundary-advisory.md; docs/architect/packaging-distribution/history/distribution-baseline.md. |
| herdr-web-dashboard.md | apps/fgos-gateway/web/src/api/errors.ts:3 (cites lines 259-260 of the spec, so a line-number citation); docs/specs/reading-map.md:36; docs/specs/distribution.md; docs/architect/component-boundary/component-boundary-advisory.md; docs/how-to/install-fgos-in-a-project-and-use-doctor.md; docs/contracts/fgos-gateway-api-v1.yaml; every ui-spec file (see below). |
| observe.md | docs/specs/reading-map.md:59 only (plus ratchet exceptions). |
| docs/ui-spec/** | .claude/skills/ui-spec/SKILL.md:20,31,36,246 and CONVENTION.md:173 (default output `docs/ui-spec`, `cd docs/ui-spec/tools`); .claude/skills/ui-spec/tools/config.mjs:39 (`--root ./docs/ui-spec`), wireframe/verify-runtime.mjs:14 (path to `frontend/docs/ui-spec/generated/wireframe-v2.html`); apps/fgos-gateway/web/src/App.tsx:24, App.test.tsx:6, screens/Taskboard.tsx:9,439, TaskDetail.tsx:9,487, NeedsAnswer.tsx:7 (code comments naming `docs/ui-spec/screens/...` and `modals/M03-...`); docs/generated/README.md:31 (declares `docs/ui-spec/generated/**` as UI-spec build output); scripts/generate-doc-inventory.mjs:324 (switchboard-style area prefix). The ui-spec files cite `docs/specs/herdr-web-dashboard.md` sections by name in 12 places and wireframe-v2.html embeds the screen/modal/rule prose as JSON strings. |
| Nothing found in | AGENTS.md, CLAUDE.md, core/ (the `core/skills/distill` skill is unrelated to the distillery spec path), domains/, bin/. |

The ui-spec compiler tools do not live in `docs/ui-spec` (there is no `docs/ui-spec/tools`); they live in `.claude/skills/ui-spec/tools` and are run with `--root <repo>/docs/ui-spec`. They expect `spec.config.yaml`, `schema/`, `screens/`, `modals/`, `components/`, `flows/` directly under the root. The map's layout (architecture/screens, contracts/, operations/, history/schema, history/generated) is not that layout.

## 4. Truth risks sampled (current-behaviour sentences against code)

All of these are carried text. Under A19 they belong to the later truth pass, not to carriage; they are listed so the liveness classification and the A28 sample can target them.

1. docs/specs/fgos-plugin.md:33, 112-118, 146, 157-158, 167 say the plugin wraps exactly 12 verbs including `/fgOS:check`, and "Open Gaps: none ... evidenced against the shipped skill files". `plugins/fgOS/skills/check` does not exist, and `plugins/fgOS/skills/` now holds about 48 skill directories (approve, list, show, triage, merge-*, cook, discover, plan, retro-*, goal, metrics, terminal and others). The `fgos check` verb itself exists (bin/fgos.mjs:4658, 3875). Header says `coverage: full`.
2. docs/specs/confinement-authority.md:13-14 and :1253 say the real `.fgos/config.json` has no `confinement` key, still uses a hand-rolled `command: "bwrap"` argv, and that the live migration is deferred. The tracked `.fgos/config.json` has `"confinement": {"backend": "bwrap"}` on invocations (lines 751, 803, 892) and capability `confinement` blocks with `mode: required` (lines 40, 59, 100), and no `command: "bwrap"`. Commit 5a42bc376 (2026-09-11) is the migration. Other cited items check out: `executeThroughConfinement` (authority.mjs, called by spawnWorker and executeExecutorCli), `runAllConfinementProbes` (probes/harness.mjs:551), `runner.confinement.strict` default false (.fgos/config.json:1515, config.mjs:1678), doctor check `confined-pane-accounts` (registrations.mjs:4622).
3. docs/specs/decision-citation-drift.md:23-26 and :71 describe scope as backlog plus specs with `--decisions-dir docs/decisions` default and `docs/decisions/NNNN-*.md` records. The decisions corpus is retired (docs/decisions now holds only the generated `index.md`), and the script header (scripts/check-decision-citation-drift.mjs:2-34) describes two defect families, a `--skills-dir` option and a baseline file. Open Gaps line 91 cites `.bee/config.json`, which does not exist in the repo.
4. docs/specs/observe.md:45 lists friction subcommands `ping, record, resolve, list, show, rank`; code (packages/observe/rust/src/friction_cli.rs:8) also has `migrate`. Metrics subcommand list (line 44) matches `AVAILABLE_SUBCOMMANDS` in metrics_cli/mod.rs:20-31. observe.md:10 cites `plans/260929-1501-metrics-friction-rust-native`, which now exists only under `archive/plans/`.
5. docs/specs/herdr-web-dashboard.md:39, 304, 331 and docs/ui-spec/00-overview.md:16-17 cite `docs/reference/herdr-web-dashboard-layout.md`, which is gone (content now under `docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/`). herdr-web-dashboard.md:324 cites `docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md`, which is gone with the retired corpus.
6. docs/ui-spec/00-overview.md:85 says `generated/` "is build output and is gitignored". The five generated files are tracked and `git check-ignore` does not match them. generated/coverage-report.md self-labels "GENERATED by ui-spec-tools/build.mjs - DO NOT EDIT BY HAND" and reports "Surfaces: 12".
7. docs/specs/distillery.md "Pointers" names `.agents/skills/distill/scripts/distill.mjs` and the backfill script under `.agents/skills/`. Those paths exist, but `.agents/skills` is a render target; the source is `core/skills/distill/`. The spec also says it was moved verbatim from the forgent-workshop project and was never re-harvested (Open Gaps).
8. Spot checks that passed: observe.md `scan_runs` in packages/run-result/rust/src/lib.rs:396; the four doctor check ids `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage` (registrations.mjs:6487-6505); `packages/observe/contracts/*.json` all five named files present; every other backtick path in the six specs resolves except those in items 3 to 5 above.

## 5. Drift since the map pin

- Two sources changed on main/HEAD after the map pin; both changes were merged into this branch (docs/specs/confinement-authority.md and docs/specs/herdr-web-dashboard.md; `check-legacy-docs-ratchet.mjs` reports clean with 26 accounted edits).
- confinement-authority.md: 191 -> 200 units; 3 pin units removed, 12 added (unit text-digest comparison). New text includes the herdr-session reaper paragraph (~line 1102), reworded credential items 2 and 3 in section 13.1, new sections 13.2 (login renewal, write-back) and 13.3 (Codex `--no-daemon`, dated 2026-10-13). Commits since pin include 04c6859af, 8098d7be2, c3272bc6f, db4a7e28f, ed4bb8665, a48548ca2.
- herdr-web-dashboard.md: 44 -> 44 units; 2 removed, 2 added, all in R2 (`answer` and `move` forward `--approve`).
- The other 25 sources are blob-identical to the pin. No change in the last commits of main touched them.
- Stop condition 6 measure: "rows in batch source files whose blob id differs from the batch pin, divided by the batch rows, above 10%". Read literally with whole-file rows it is (191 + 44) / 557 = 42%. Read as rows whose digest changed it is 5 / 557 = 0.9%. The Step 8 text ("comparing blob ids ... before each commit") and `decision-digest-stale` listing point at the second reading; no earlier step report states which reading it used (not found in step-03 to step-07 reports).

## 6. Owner-decision candidates (flagged, not decided)

1. Generated ui-spec files placed as `history`. Map rows 14-18 put the five `docs/ui-spec/generated/*` files under `ui-spec/history/generated/` as `history`/verbatim. Constitution section 4 gives Generated sources `regenerate-from-source`, A9/N1 keep that disposition for generated files, and docs/generated/README.md:31 declares them build output. The map's operation is "place verbatim" of a snapshot. Options: keep as history snapshots with a recorded reason; `regenerate-from-source` pointing at the ui-spec build; or retire as generated. Also the overview's claim that they are gitignored is false, and wireframe-v2.html is 631 KB (one unit) embedding prose that duplicates the md files.
2. ui-spec layout versus its consumers. The ui-spec compiler (`.claude/skills/ui-spec/tools`, `--root`) needs the legacy directory layout. The map moves `schema/` to history, `spec.config.yaml` to architecture, screens/modals to architecture, flows to operations. After cutover the validate/build/interpret flow described in 00-overview.md:70-82 cannot run on the platform copy. Decide whether the legacy root stays a retained tool root, the tools get re-pointed, or the layout is a design mismatch the map accepted. The machine files (`spec.config.yaml`, schema JSON) are also non-prose carriers whose placement kind (architecture vs history) is judgment.
3. Kind of screens and modals. Screens S01-S04, modals M01-M03 and C01 are mapped to `architecture`; they are machine-readable surface contracts (YAML contract blocks, `rules:` and `regions:` front matter validated by the tool), and flows F01/F02 go to `guide-runbook` (`operations/`) although they are interaction flows rather than operator runbooks. Placement is frozen in the map, but the kind is arguable; owner may want contracts for surfaces.
4. Split boundaries for the two mixed specs. The map gives one target (`spec.md`) with operation `split`; Step 8 text allows "contracts, decisions as content requires". confinement-authority.md is both spec and history: s6 (81 units of TypeScript contracts), s10 (rollout status table), s12 (proposal decisions), s13 (settled facts, dated incident evidence, open deferred items), s2 (historical problem). observe.md s6 is decision history (D-ADR0037). Sub-targets (contracts/, decisions/, history/) would be `Added in candidate`; the map does not name them, and section-number citations from code (`§6.2`, `§9.2`) and herdr's line citation (errors.ts:3) depend on the split. Doer likely decides within the frozen-map rule; Lead should confirm whether this needs the owner.
5. Truth-state of carried text. Items 1 to 3 in section 4 are false or stale current-state claims in files the map classifies as `spec` (canonical-intended). Under A19 and A28 they go to the truth pass or the candidate-unverified list; decision needed only if the batch truth sample exceeds 10% (A28 item 3a) or the Lead wants fgos-plugin.md's "12 verbs, coverage full" claim handled as stale carried text like A35.
6. Stop condition 6 interpretation (section 5 above): ask the Lead/owner which reading applies, because the literal reading would stop the batch before it starts.
7. Plugin spec identity. docs/specs/fgos-plugin.md describes a surface that has grown from 12 verbs to about 48 skills (and is not the Claude plugin's whole contract); the map target `docs/platform/claude-plugin/spec.md` is a different area name from the source (`fgos-plugin`). Needs no new owner, but the Doer will have to say whether the candidate states the 12-verb snapshot or only carries it.

## 7. Notes for the Doer (facts only)

- New area directories needed (none exist): docs/platform/agent-confinement, decision-citation-drift, distillery, claude-plugin, observe, ui-spec. `docs/platform/herdr-web-dashboard/` exists from Step 5 (operations/operator-runbook.md and contracts/fgos-gateway-api-v1.yaml, both Candidate) but has no README or spec.md. None of the seven areas has an area-portal README yet. Switchboard candidate routes (`docs/platform/<area>/**`, status candidate) already exist for all seven (transitional-switchboard.json lines 631, 675, 732, 846, 890, 934, 1056).
- ui-spec markdown files begin with YAML front matter (`id`, `type`, `name`, `status`, ...) before the H1. The shared rules require the full header block after the H1 and "preserve all source text". The four non-markdown carriers (csv, yaml, html, json) cannot hold a header block; how the header obligation applies to them is not stated in the map or phase text.
- Observe and confinement are to be decided last per the Step 8 text; confinement is the one with real drift (section 5), so its rows will need `decision-digest-stale` handling after the P1 sync.
- Check E scope is "one `--scope` per source path of the batch": 27 paths (a scope matching nothing is an error).
- Source language: confinement-authority.md and observe.md are Vietnamese; the other specs and the ui-spec files are English.
