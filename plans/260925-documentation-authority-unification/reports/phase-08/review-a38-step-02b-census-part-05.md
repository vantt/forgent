# Independent review: Step 2b census, part 05

- Reviewer: reviewer:sonnet-session:a0842253f5164e116@2026-10-19
- Worktree: /home/vantt/projects/forgentX-s8-review, detached HEAD c801778ac48e78dae45b67a58b7484e87bfcd4a5 (verified)
- Author commit 8606433d6, accounting commit c801778ac
- Part: plans/260925-documentation-authority-unification/reports/phase-08/step-02b-review-part-05.json, sha256 691c5fd57eb21ef5f6e4378b9d9939001624e8e32b0f43dd0fb3164a1032b6ca, 60 entries (all skills-prompts edges skills-152..skills-211)

## Mechanical pass (all 60)
- fileDigest equals sha256 of consumer file; callSite equals line; matchedExpression equals columns; switchboardDigest equals current transitional-switchboard.json: 60/60 pass.
- Every sourcePath exists. All 27 "generated assembly" renders (plugins/fgOS/skills/*, rows 152-178) equal source after removing the header, and the header names the row's sourcePath. 
- Hand-authored claims (rows 179-197): merge-loop, merge-next, plan, retro-loop, retro-next, terminal, terminal-close (SKILL.md, close.sh, rename.sh) have no generated header and no core/domains/.agents counterpart: genuinely source. Rows 198/199 are src/runner/prompt-templates sources.
- Rows 200-211: .agents/.claude/core copies of distill.mjs are byte-identical (cmp); source core/skills/distill/scripts/distill.mjs; every line/expression traced to REFS_DIR=docs/distillery (line 26), CLONES_DIR=upstreams (line 27), meta.local override (148, 432); all read paths here (listSourceNames/loadSource/taxonomy/deep-dives/matrix), no authority alias.
- L12-10: all docs/history/<feature>/... rows keep convention unchanged, no plans/ mapping, activeAlias false. L12-7: the 3 docs/specs consumers in this part (171, 176, 178) are cutover-patch-only; the only docs/architect consumer (164) is flagged.
- anchorExists(unheaded-block-6) true for docs/platform/runner/subcomponents/h-6979005beaf7/spec.md.

## Verdicts
| Edge | Verdict | Note |
|---|---|---|
| skills-152 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-153 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-154 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-155 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-156 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-157 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-158 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-159 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-160 | rework | Role/destination wrong: implement SKILL.md:71 only cites locked decisions in CONTEXT.md ("cite the decision id; never reopen"); it never writes that file. Row says feature-file-writer-contract with writeDestination docs/history/<feature>/CONTEXT.md. Should be feature-artifact-reader/instruction-or-citation, no write destination (the real writer is exploring, rows 153/154/158). Preserve action unaffected. |
| skills-161 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-162 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-163 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-164 | needs-Lead-judgment | docs/architect/knowledge-registry-redesign.md consumer has cutoverAction=preserve, cutoverPatch=null, while L12-7 says every docs/architect/** consumer gets cutover patch specs only. Row (and its siblings in other parts) justify as historical design citation; alias draft step10-whole-system-1085 says the target is "moved" to docs/platform/proposals/. Lead must decide whether a historical-citation carve-out from L12-7 exists or a patch spec is needed. |
| skills-165 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-166 | ok | Planning picks docs/history/<feature>/ path to later write plan.md; classified reader with no destination. Minor: arguably writer-path. Behavior preserved; ok with note. |
| skills-167 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-168 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-169 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-170 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-171 | ok | Blocked correctly: candidateSuggestion only, no executable new; sibling of 038/112. |
| skills-172 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-173 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-174 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-175 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-176 | ok | Writer contract verified against core/skills/fgos-indexing/SKILL.md:60-70; docs/reading-map.md:157 carries the pointer; docs/specs/reading-map.md:37 is current pointer; L12-7 cutover-only satisfied; writeDestination not an alias. |
| skills-177 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-178 | ok | Executable new anchor unheaded-block-6 exists (anchorExists true; line 78 is RUL45). Correspondence parked with Phase 9 timing gate; consistent with sibling rows 015/016/045/084/087/090/148/149. Accepted as ok, semantic check stays with Step 3. |
| skills-179 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-180 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-181 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-182 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-183 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-184 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-185 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-186 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-187 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-188 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-189 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-190 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-191 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-192 | needs-Lead-judgment | Cites docs/operator-runbook-herdr-cockpit.md (legacy-current maintained authority, moved draft alias root-authorities-draft-0039) as a live "per STR40" pointer, cutoverAction=preserve with no patch; dispositionReason is boilerplate about a "citation-format negative comparison" that does not describe this passage. Lead to decide: patch spec at cutover vs. keep stale path. |
| skills-193 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-194 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-195 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-196 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-197 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-198 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-199 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-200 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-201 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-202 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-203 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-204 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-205 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-206 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-207 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-208 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-209 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-210 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |
| skills-211 | ok | span/digest/source mapping verified; role and preserve action consistent with passage |

## Deep-read list (36 + mandatory)
Writers: 152,153,154,158,160,161,162,168,172,173,177,198,199,176. Readers/metadata/prohibited: 155,159,163,165,166,167,170,174,175,179. Source-vs-render and behavioral: 171,178,164,192,180,181,191,196,200,201,205,206,208,211. Each read against current source/target passage, not the synopsis.

## Totals
- ok: 57
- rework: 1 (skills-160)
- needs-Lead-judgment: 2 (skills-164, skills-192)
- rework rate 1/60 = 1.7% (below the 3% expansion threshold).
