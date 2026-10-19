# Review a38 step-02b census part 06

- Reviewer: reviewer:sonnet-session:a114cc33a48167143@2026-10-19
- Request: step-02b-census-0689b862e; worktree /home/vantt/projects/forgentX-s8-review at c801778ac48e78dae45b67a58b7484e87bfcd4a5 (author 8606433d6, accounting c801778ac)
- Part: step-02b-review-part-06.json, sha256 7f58d88f22fe0c617a86921d27a3b2da585b87b6cea4f4e0579ba80c8b71a3ea, 60 entries, all reviewClass skills-prompts

## Mechanical results (all 60 entries)

- Consumer file digest, call-site line, column span, matchedExpression and every context line match current bytes: 60/60.
- switchboardDigest matches transitional-switchboard.json; alias activeTableEntries 0; no write destination is an active alias: 60/60.
- 49 generated copies (19 under .agents, 30 under .claude/skills/distill) are byte-identical to core/skills/distill/scripts/distill.mjs (cmp clean) and map to that file as sourcePath. The 9 core rows and the ui-spec html-shell row are sources. .claude/skills/ui-spec has no core counterpart, so classing it as hand-authored source is right.
- Every inventoryEdgeId resolves in step-02b-inventory-edges.json; none missing; paths agree.
- preCutoverAction and cutoverAction are preserve for all 60. None is a docs/specs or docs/architect consumer (L12-7 not engaged). No shipped writer convention changes; external-project docs/distillery topology is kept (L12-10). No render is proposed for hand edit.

## Deep reads

Read in core/skills/distill/scripts/distill.mjs: constants REFS_DIR/CLONES_DIR; findRoot (lines 68, 71: --root, else upward search for docs/distillery); sourcePath and loadSource (122, 128, 129); loadTaxonomy (141); cloneDir (148, meta.local override); listSourceNames (156); cmdInit (244-253 directory creation and atomic writes of taxonomy, intake, matrix, porting log; 258 managed ignore-file block); clone probes and delta/check/status (292, 377, 451 and 411, 432); porting-log readers/writers rank, map, status (464, 519, 546); cmdMove (587 state dir, 588 porting log, lazy import of forgent/state/porting-store). Also tools/wireframe/html-shell.mjs line 17 (readClient via import.meta.url; node bundle read under tools/node_modules).

That is every distinct source line behind the 60 rows (27 lines, plus html-shell), well above the 10 minimum and covering all writer and dynamic-path rows. Findings: expressions exist as claimed; accessRole path-construction is accurate; described destinations (docs/distillery sources, porting-log, state; clone dir upstreams or meta.local) match code; parked reasons (external population not read) are honest; dispositionReason boilerplate is correct for each distill row.

## Verdicts

| ids | location | class | verdict | note |
|---|---|---|---|---|
| skills-212..230 (19) | .agents/skills/distill/scripts/distill.mjs lines 68-71, 244-253, 258, 292, 377, 451, 464, 519, 546, 587, 588 | generated copy of core distill | ok | maps to core source |
| skills-231..261 (31) | .claude/skills/distill/scripts/distill.mjs lines 68-588 | generated copy of core distill | ok | maps to core source |
| skills-262 | .claude/skills/ui-spec/tools/wireframe/html-shell.mjs:17 | hand-authored source | ok | desiredOwner null is correct: asset read, not a documentation consumer; writeDestination null |
| skills-263..271 (9) | core/skills/distill/scripts/distill.mjs lines 122, 128, 129, 156, 411, 141, 148 (x2), 432 | canonical source | ok | |

Notes (not rework): skills-221 (line 258) write-destination text omits the managed ignore-file block that cmdInit writes at the root; wording only.

Per-entry verdict: skills-212 through skills-271 inclusive are each ok (60 entries).

## Totals

ok 60, rework 0, needs-Lead-judgment 0.
