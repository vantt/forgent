# Review: Step 3 wave 2 expansion, Part 03

Pin ae141550c2e022310de7a0efea757580c0b2479f; worktree feeeeee92 (read-only). Set batch-037, stratum full-set-expansion. No checker or probe was run. Records were read with a Python per-field extractor (edge fields only, search-witness category/counts, diff printed separately). Each source file was read whole with `git show <pin>:<path>`. Every patch target, anchor and successor note was checked with `git cat-file` / `git show` at the pin. Record/diff hashes were not independently recomputed (hash equality is a binding, not part of this semantic review).

## Per-file verdicts

### 1. why-fgos-bin-and-skill-distribution-needed-a-3-tier-self-healing-resolution.md (3 edges): ok
Path: docs/knowledge/why-fgos-install-setup-resolves-the-fgos-binary-through-a-3/...

- maps-j-04786 (L12, docs/history/install-setup-external-project-reliability/CONTEXT.md): preserve. The path exists at the pin and is retained, so the preserve is correct.
- maps-j-04787 (L43): patch to docs/knowledge/why-fgos-install-moved-from-always-pulling-main-head-to-a-ta/why-fgos-install-is-pinned-to-a-semver-tag-instead-of-main-head.md. The old docs/explanation path is missing at the pin and the target exists. The target's role, tsk-jtb and "pinned to semver instead of main HEAD", matches the adjacent description. No anchor is needed because the citation is to the whole document. The diff replaces only the wrapped path and the hunk is correct.
- maps-j-04788 (L48): patch to docs/knowledge/why-a-repo-that-only-installs-fgos-as-a-claude-code-plugin-g/why-plugin-only-installs-could-not-reach-fgoss-coding-domain-dev-skills.md. The target exists. The anchor `#root-cause-two-separate-skill-families-only-one-shipped-in-the-plugin` is the real H2 ("Root cause: two separate skill families, only one shipped in the plugin"). It encloses the tsk-65q-style claim that the two SKILL.md files assumed vendored fgOS source. The diff places `#anchor` before the closing `)` and keeps the label form.
- Missed references: none. The remaining paths in the file (src/, scripts/, .agents/skills, .claude/skills) are not legacy doc paths.

### 2. why-a-doctor-check-verifies-every-workflow-stage-has-a-skillmap-owner.md (1 edge): ok
Path: docs/knowledge/why-fgos-registers-a-doctor-check-confirming-every-stage-nam/...

- maps-j-04818 (L11, docs/explanation/why-capability-executor-and-capacity-are-three-separate-concepts.md): parked, description-rewrite. The doc-registry alias leads to docs/knowledge/why-runner-config-splits-capability-.../why-capability-executor-and-capacity-are-three-separate-concepts.md. That target covers capability vocabulary, config registry and dispatch (its H2s are the unification, tool-registry retirement, executors vs registry, kind split, three gates, marketing patterns, open question). It has nothing on domain to N workflows or skillMap/roleGraph. The real holder of that hierarchy at the pin is docs/knowledge/coding-domain-s-role-holder-axis-.../why-coding-domain-has-a-role-holder-axis-and-task-spec-ontology.md, section "Workflow hierarchy: domain → N workflows" (L207). A rename-only patch would keep an adjacent description the target does not support, so the park is a real mismatch and correct. The search-witness category is citation-only and the alias is the registry's.
- No diff (parked), and none is expected.

### 3. why-fgos-skills-split-into-skillmd-plus-references-under-300-lines.md (7 edges): ok
Path: docs/knowledge/why-fgos-s-coding-domain-skills-were-rewritten-to-a-300-line/...

- maps-j-04831 (docs/history/), 04832 (docs/decisions/), 04833 (docs/backlog.md): preserve, retained. All three exist at the pin.
- maps-j-04834 (L34 docs/specs/): preserve as retiring-tree history, with a non-executable successor note to docs/platform/packaging-distribution/spec.md (exists at the pin). The reason says "tree retires at Phase 9" rather than "retained", which is correct. See the Lead question below.
- maps-j-04835 (L71): patch from docs/how-to/write-verify-for-a-skill-prose-change.md (missing at the pin) to docs/knowledge/vi-t-verify-cho-m-t-item-thay-i-skill-prose/write-verify-for-a-skill-prose-change.md#verify-trông-thế-nào. The target exists. The H2 "Verify trông thế nào" matches the D5 "verify theo đúng khuôn (POSITIVE + NEGATIVE ...)" claim. The diff edits only that blockquote line and keeps the trailing "(POSITIVE + NEGATIVE,".
- maps-j-04836 (L102 docs/specs/*) and 04837 (L102 docs/backlog.md): the past-action wording "description was edited down to ..." is preserved. The pattern is illustrative, and the backlog path is retained. Both are correct.
- Missed references: none.

### 4. plugin-skill-cli-path-resolution-fallback.md (2 author-added edges): ok
Path: docs/knowledge/why-plugin-skills-need-a-cli-path-fallback/...

- author-wave2-...-L42C4 (docs/how-to) and ...-L42C19 (docs/explanation): both preserve, same unit item-L41. Both directories exist at the pin (171 files across the two) and are listed in package.json "files". The sentence is a past-tense description of the package.json files field, so literal preservation is right. The list also names README.md, LICENSE and docs/enduser-docs-index.json, which are retained. The author-added scan fields are present.
- Missed references: none.

### 5. why-stage-skills-forbid-ad-hoc-task-delegation-for-their-own-reasoning.md (1 edge): ok
Path: docs/knowledge/why-stage-skills-forbid-ad-hoc-task-agent-delegation-for-the/...

- maps-j-04940 (L46-47, wrapped docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-\ncli-spawn.md): parked, description-rewrite. The wrapped span is captured as one expression (L46 col 5 to L47 col 13). The paragraph claims the executor-dispatch fallback is "governed by" 0026's Native-First Doctrine and decides native-vs-cli-spawn "per Step B.5's Native-First doctrine", citing the now-nonexistent `.claude/skills/_shared/...` path. At the pin, decision 0033 narrowed 0026 rule 2 (h-36d872fbb0e5.md L673, "Thu hẹp bởi 0033"). bind()/config now own routing, and the shared fragment lives at core/skills/_shared. The doc-registry and alias table have no holder for the old file name, but the 0026 narrative is at docs/platform/runner/decisions/h-36d872fbb0e5.md. The park is defensible. See the Lead question below.

### 6. why-the-verify-fail-post-merge-playbook-retries-through-awaiting-approval-not-proposed.md (0 edges): ok
Path: docs/knowledge/why-the-verify-fail-post-merge-playbook-s-retry-step-moves-a/...

The source was read whole. It has no legacy doc path or basename (only plugins/…/SKILL.md, status-fsm.mjs, frontier.mjs and bin/fgos.mjs, none of which is a doc path). Empty edges, an empty diff and an empty legacyScan are correct.

## Outcome defects (rework)
None. Edges reviewed 14 of 14 (3+1+7+2+1+0); files reviewed 6 of 6.

## Record-text notes (not rework)
- 04818: the park could name the actual hierarchy holder (why-coding-domain-has-a-role-holder-axis-and-task-spec-ontology.md "Workflow hierarchy: domain → N workflows") so the Phase 9 description rewrite does not have to rediscover it.
- 04940: the reason also bundles the stale `.claude/skills/_shared` path, which is not a docs legacy edge. The park is still right, but the reason could separate that path from the decision-citation question.
- 04788 vs 04787: the same list item has one whole-document patch and one anchored patch. That is consistent with the "most specific enclosing heading" rule, but the author's justifications differ ("no section assertion" vs "extractor heading").

## Lead-judgment questions
1. 04940 (park) vs L12-37(3) (undated live decision citations are navigation and patch to the exact decision heading, as 06509 and 0062 did). The citation is "itself governed by 0026's Native-First Dispatch Doctrine". A heading patch to `h-36d872fbb0e5.md#0026-native-first-dispatch-doctrine-launcher-roottask-capacity` is available. The park rests on the paragraph attributing current routing to a doctrine that 0033 narrowed. If the Lead treats this as navigation only, the outcome would flip to patch. I judge the park correct because the adjacent sentence ("decides native-vs-cli-spawn per Step B.5's Native-First doctrine") is a current-behavior claim that is no longer true.
2. 04834 and 04836 (docs/specs/ in a "Process/build-time artifacts (docs/history/, docs/decisions/, docs/backlog.md, ..., docs/specs/) keep tsk-37i's citation rule unchanged" paragraph): the record treats it as the historical D1 design, with a successor note. The wording is present tense ("keep"). If the Lead reads it as a live statement naming a retiring tree (L12-37(6)), this edge would park as description-rewrite instead. I accept preserve because the whole document is a retrospective "why" capture of tsk-56w D1-D6.

## Counts
- batch-037, full-set-expansion: reviewed 6 files / 14 edges, rework 0/6.
- No other set or stratum in this part.
- Overlap: none (all six files belong to batch-037 expansion only).

Status: DONE
