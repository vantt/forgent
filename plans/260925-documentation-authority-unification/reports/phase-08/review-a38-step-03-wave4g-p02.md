# Step 3 wave 4g, Part 02 review

Pin ae141550c2e022310de7a0efea757580c0b2479f. Read-only; no checker/probes run. Each file read whole at the pin, each edge's fields and diff read, targets verified with `git cat-file` at the pin.

## Per-file verdicts

### 1. batch-078 `docs/knowledge/why-fgos-merge-loop-tsk-1sm-recurses-into-loop-not-ck-loop/why-merge-loop-recurses-into-loop-not-ck-loop.md` (unpatched-seeded)
- recordSha256 26fd797011bab2ecfe8dc3220936ea8c7e204430f486aa855992f48349ec75d4; sourceDigest df972d74...1c92; diffSha256 e3b0c442... (empty diff, as expected).
- Verdict: **ok**. Edges reviewed: 1/1.
- maps-j-04797 (line 16, `docs/history/merge-loop-skill/CONTEXT.md`), preserve. The path exists at the pin (docs/history is a retained tree). It is the lead-in to a blockquote of the item's own text ("From the item's own text"), so literal preservation is correct. A full-file grep finds no other docs/ reference, basename or decision id; `ck-loop`/`~/.claude/skills/...` are not repo-doc edges. No missed reference.

### 2. batch-078 `docs/knowledge/why-fgos-retro-loop-restores-the-compound-verb-instead-of-in/fgos-retro-loop-and-the-restored-compound-verb.md` (unpatched-seeded)
- recordSha256 4932ac834f7a6af66912361a2ea325b83e6077dbddfa93f3a5eb9967e7847542; sourceDigest 5c337e4f...17e2; diffSha256 e3b0c442... (empty).
- Verdict: **ok**. Edges reviewed: 2/2.
- maps-j-04823 (line 72, `docs/specs/work-state.md` (RUL51-53)), preserve. The sentence is past-tense narration of why the verb name was kept ("already documented... kept every one of those references correct"), so it is a historical claim and an alias patch would falsify it. The record cites the source framing and a non-executable successor note, `docs/platform/work-state/spec.md` (exists at the pin). Correct under L12-26/L12-46.
- maps-j-04824 (line 106, `docs/explanation/fgos-retro-loop-and-the-restored-compound-verb.md`), preserve. It is the performed `fgos compound tsk-3o3 --doc-type explanation --doc-path ...` command in the "Proof it actually works" section: completed past action, a captured docPath identity. Its renamed successor is this consumer itself (rename a6fc1f5fe), so a patch would create a self pointer. L12-40 says never patch a self-alias, so preserve is correct. The record text states the self-successor fact accurately.
- No other docs/ path, basename or decision id in the file. No missed reference.

### 3. batch-077 `docs/knowledge/why-fgos-coding-planning-and-fgos-coding-validating-merged-t/why-planning-and-validating-collapsed-into-one-co-adjustment-gate.md` (open-lead-ruling supplement)
- recordSha256 49bc81412b856a1a7fb9baabcdf822552ead0cb54c8dd919caa5fd31cfa42a60; sourceDigest b8dbc870...93a8; diffSha256 b859f3955e7b6ee3f0aeec6000f9f8f53c40d03dcd807cfbb3fb590c74d02873 (matches the index).
- Verdict: **ok** (the ruled edges are treated as ruled). Edges reviewed: 8/8.
- maps-j-04737 (line 12, `docs/history/coding-planning-validating-gate-redesign/`), preserve. The directory exists at the pin and the line says "Full design:", so it stays literal. Correct.
- maps-j-04738 (line 14, `docs/reference/backlog-status-schema.md`), patch to `docs/knowledge/the-schema-shape-of-the-backlog-work-item-status-statuses-tr/backlog-status-schema.md`. This is live "see" navigation in a present-tense citation. The target exists at the pin and the registry lists the old path as an alias. The target is the backlog work-item status schema, and the source says "tsk-5wr, the backlog-status feature". `docs/history/work-item-backlog-status/CONTEXT.md` confirms tsk-5wr is that feature. Target, anchor (none) and diff hunk @@ -11,7 +11,7 @@ are correct. It adds no schema-row claim. Alias patch is truthful.
- maps-j-04739 (line 112, `docs/history/gate-bypass/CONTEXT.md`), preserve. The file exists at the pin and the line describes rows appended there, so it stays literal. Correct.
- maps-j-04740 (line 114, `docs/explanation/gate-bypass-design.md`), patch to `docs/knowledge/why-gate-bypass-is-shaped-the-way-it-is/gate-bypass-design.md`. The target exists at the pin. It carries the D6 `validateApprove`/`canAutoApproveValidate` material plus a "Superseded" note (target line 185) pointing at D9-D11. The consumer says "see this for the base mechanism these rows modify", and the target is that base mechanism. The record's claim that it does not call the removed gate active is true. Hunk @@ -111,7 +111,7 @@ is correct. The patched line gets longer, but there is no semantic problem.
- maps-j-04741..04744 (lines 193, 203, 204, 205), parked as lead-ruling. Treated as ruled: L12-46 resolves them to preserve with successor notes in a later commit. My independent read agrees with the record's classification. The passages are inside "## Post-merge prose sync (`tsk-2tk`)", a heading naming a completed task, and the narration is past-tense ("still described", "were updated to past tense"). They are history-region quotes of file identities as they were at the time of the cleanup. Rewriting them to current paths would falsify what that cleanup touched, so preserve with a successor note is right. All four successor paths exist at the pin and match the renamed `targetFacts`: gate-bypass-config.md, gate-bypass-design.md, why-cooks-never-auto-approve..., why-heavy-keywords...; each original spelling is conserved. No dissent. One observation: 04741 is a numbered list item and 04742-44 are a sentence list. All four fall under the single heading, so one disposition for all four is consistent.
- Missed-reference scan of the full source: line 182 `plugins/fgOS/skills/cook/SKILL.md` and line 187 `src/cli/command-registry.mjs` are generated-surface or code paths in the same completed 2tk narration, not retiring-doc edges. Lines 76 and 170 `AGENTS.md` are not legacy. No missed edges.

## Defects
- OUTCOME defects: none.
- Record-text notes (not rework): the 04737/04739 reasons say "current retained path stays literal"; that is accurate (docs/history is retained). Edge 04740's reason wording "contains the original base mechanism and its later supersession note" is accurate (target lines ~131-190).
- Lead-judgment questions: none beyond the already ruled 04741-04744. Confirm the later commit adds successor notes for all four; until then batch-077 has 4 open lead-ruling edges.

## Accounting (this part)
| Set | Stratum | Files reviewed | Edges | Rework |
|---|---|---|---:|---:|
| batch-078 | unpatched-seeded | 2 (merge-loop, retro-loop) | 3 | 0 |
| batch-077 | open-lead-ruling supplement (separate; not a stratum denominator) | 1 | 8 | 0 |
| batch-077 | patched / unpatched strata | 0 in this part | 0 | n/a |
| batch-078 | patched stratum | 0 in this part | 0 | n/a |

Part totals: 3 files, 11 edges, 0 rework.
