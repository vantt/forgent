# Independent census review - step 02b part 10

- Reviewer: reviewer:sonnet-session:a7f9bf67c4e662374@2026-10-19
- Author commit 8606433d6, accounting commit c801778ac (worktree detached HEAD verified c801778ac48e78dae45b67a58b7484e87bfcd4a5)
- Part: plans/260925-documentation-authority-unification/reports/phase-08/step-02b-review-part-10.json, sha256 550391821c0697ab9a03f5e56ebb2c04754b1f2be9f7fa030fcdba8ad7699389, 60 entries
- Method: scripted mechanical check of every entry (file digest, equality with the author table row, edgeIds equal to table edges for the path, bare-sibling line/text, source digest, generated header source, body equals source after header removal, byte-identical copies, wrapper bytes via generateWrapperContent, no generated header on sources) plus a legacy-token coverage scan of every file against edge/prior-history/bare-sibling lines. Mechanical result: 0 digest, mapping, line or edgeId mismatches.
- Totals: ok 60, rework 0, needs-Lead-judgment 0

## Deep-read list
- .claude/skills/ui-spec/tools/{config,build,extract,validate,interpret,interpret-wireframe,rename}.mjs and wireframe/{html-shell,verify-runtime}.mjs (every fs/path call compared with edge lines; roots and writers via OUT/SPEC_ROOT; fixed frontend path at verify-runtime.mjs:14 five levels up from tools/wireframe)
- .claude/skills/ui-spec SKILL.md/CONVENTION references: docs/ui-spec examples vs edges skills-062..068
- .claude/skills/ui-spec/templates/README.md (components/C01-data-table.md is a skill-local template path)
- core/skills/_shared/citation-format.md (9 edges + bare siblings), core/skills/_shared/capability-catalog.md (history-001-class provenance, line 5)
- core/skills/_shared/catchup-self-recovery.md (consumer-project docs/how-to placeholder per shipped-path inventory)
- no ui-spec canonical source outside .claude/skills (core/skills has none), so self-source is correct

## Entries

| Entry | Kind | Verdict | Note |
|---|---|---|---|
| `.claude/skills/ui-spec/references/METHODOLOGY.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/templates/README.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/templates/schema/surface-contract.schema.json` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/templates/spec.config.yaml` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/templates/surfaces/component.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/templates/surfaces/domain-rules.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/templates/surfaces/flow.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/templates/surfaces/modal.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/templates/surfaces/overlay.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/templates/surfaces/overview.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/templates/surfaces/panel.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/templates/surfaces/screen.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/templates/surfaces/system-events.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/.gitignore` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/build.mjs` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 1 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/config.mjs` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 4 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/extract.mjs` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 3 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/interpret-wireframe.mjs` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 2 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/interpret.mjs` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 2 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/package-lock.json` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/package.json` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/rename.mjs` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 2 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/validate.mjs` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 4 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/wireframe/ascii-normalize.mjs` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/wireframe/client/app-chrome.js` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/wireframe/client/app.js` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/wireframe/client/flow-play.js` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/wireframe/client/graph-controls.js` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/wireframe/client/graph-layout.js` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/wireframe/client/region-model.js` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/wireframe/client/render-graph.js` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/wireframe/client/render-regionbox.js` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/wireframe/client/render-storyboard.js` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/wireframe/extract-prose.mjs` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/wireframe/html-shell.mjs` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 1 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/wireframe/styles-phase2.mjs` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/wireframe/styles-phase3.mjs` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/wireframe/styles.mjs` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `.claude/skills/ui-spec/tools/wireframe/verify-runtime.mjs` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 2 equal table, bare-sibling lines/text match |
| `core/prompt-templates/architecture-advisory-panel-v1-alternative-proposal.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/prompt-templates/architecture-advisory-panel-v1-close-dialogue.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/prompt-templates/architecture-advisory-panel-v1-constraint-findings.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/prompt-templates/architecture-advisory-panel-v1-constraint-proposal.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/prompt-templates/architecture-advisory-panel-v1-critique.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/prompt-templates/architecture-advisory-panel-v1-explanation.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/prompt-templates/architecture-advisory-panel-v1-interpretation.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/prompt-templates/architecture-advisory-panel-v1-redteam.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/prompt-templates/architecture-advisory-panel-v1-scout-report.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/prompt-templates/architecture-advisory-panel-v1-specialist-answer.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/prompt-templates/architecture-advisory-panel-v1-synthesis.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/prompt-templates/architecture-advisory-panel-v1-system-proposal.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/prompt-templates/master-loop-review-candidate.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/prompt-templates/rfc-review-lite-convene.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/prompt-templates/rfc-review-lite-object.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/prompt-templates/rfc-review-lite-propose.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/prompt-templates/rfc-review-lite-respond.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/skills/_shared/capability-catalog.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/skills/_shared/capability-matching.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/skills/_shared/catchup-self-recovery.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 0 equal table, bare-sibling lines/text match |
| `core/skills/_shared/citation-format.md` | file | ok | ok: hand-authored/canonical source, no generated header, self-mapped; fileDigest ok, edgeIds 9 equal table, bare-sibling lines/text match |
