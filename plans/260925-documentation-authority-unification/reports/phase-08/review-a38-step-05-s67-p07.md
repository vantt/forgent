# Review: seam 6/7 part p07 (s4-src-p07 + s4-gen)

Reviewer: independent read-only. Pin 97c9694a4 (records), worktree 5c0f11eee.

## Source entries (17 files)

Entries with no items (14 files: ascii-normalize.mjs, client/*.js x8, extract-prose.mjs, styles-phase2.mjs, styles.mjs, and the other empty wireframe client files): nothing to judge. Spot-check with grep on the pinned files for docs/, .md, readFileSync/writeFileSync found no document operation.

### .claude/skills/ui-spec/tools/validate.mjs - ok (4 dynamic + 1 added ref reviewed)
- dynamic-000447 (L17, ADMIT preserve, operand schemaPath): the message interpolates the schema path (user-visible output) and L20 readFileSync(schemaPath) is the added ref author-s67-io-b0a41bda... (ADMIT preserve). Same passage, same outcome. ok.
- dynamic-000449 (L188 join(SPEC_ROOT, catalogName)), dynamic-000450 (L196 join(SPEC_ROOT, f.file)), dynamic-000452 (L216 join(SPEC_ROOT, ovName)): each operand really yields a document path under the selected root (docs/ui-spec retained, --root honored by config.mjs). Preserve with the retained-root witness is right; no patch is needed because no legacy path is named.
- OUTCOME defects: none.
- Record-text note: readdirSync(SPEC_ROOT) at L186 and L214 has no item of its own. Both sit in passages whose admitted tuples (000449, 000452) have the same outcome, so this is not an outcome defect.

### .claude/skills/ui-spec/tools/wireframe/html-shell.mjs - ok (1 added ref)
- author-s67-current-surface-serialization (L58 JSON.stringify(surfaces,...), ADMIT preserve, generator-source): this is the generator step that feeds the generated wireframe-v2.html. Preserve is right, and the generated file joins it.

### .claude/skills/ui-spec/tools/wireframe/verify-runtime.mjs - ok (1 ref + 4 dynamic reviewed)
- reference-000109 (L14 path text, compiler-path, ADMIT preserve) and dynamic-000522 and dynamic-000523 (L14, ADMIT preserve, operand resolve(__dir, ".../frontend/docs/ui-spec/generated/wireframe-v2.html")): these agree on one outcome. The operand does yield a document path, and L38 reads it.
- dynamic-000516 (L12 __dir derivation): REJECT, nonDocumentUse root-only. True, it is a module-directory derivation only.
- dynamic-000519 (L13 comment): REJECT, nonDocumentUse comment-or-type. True.
- OUTCOME defects: none.
- Lead-judgment question (not a defect): at the pin `frontend/docs/ui-spec/**` does not exist in the tree (git ls-tree empty). The reader therefore points at a path that is not there; the real retained output is docs/ui-spec/generated/wireframe-v2.html. The record already says the mismatch is known and that no repair is authorized, and the mismatch does not depend on the cutover because docs/ui-spec is retained. Preserve is acceptable. Lead may still want the broken pre-existing path filed as its own item (RUL11), since Step 5 writes records only.
- Record-text note: reference-000109 matchedExpression starts "/../../../../frontend/..." (4 levels) while the source has 5 levels. The span text is a substring of the L14 string, so this is cosmetic.

### docs/platform/ui-spec/architecture/spec.config.yaml - ok (1 ref)
### docs/ui-spec/spec.config.yaml - ok (1 ref)
- reference-002243 and reference-002273, L3 comment-provenance "docs/specs/herdr-web-dashboard.md", ADMIT patch, target docs/platform/herdr-web-dashboard/spec.md. The target exists at the pin. The diff changes only L3, is on the real source file (both files are byte-identical at the pin, so each gets its own patch), and the rollback diff is the exact inverse. The co-cut sets are {file, target}. Reusing Step 3 claim maps-j-08490 (present in step-03-records/batch-125.jsonl) is sound. The root stays docs/ui-spec, nothing is promoted, and this is a comment-only change, so there is no behavior delta to the parser.
- OUTCOME defects: none.
- Record-text note: the two copies should carry the same wording. They do.

## Generated-file summary (3 records)

### core -> .agents/skills/_shared/citation-format.md and plugins/fgOS/skills/_shared/citation-format.md - ok
- Both renders have the same source sha256 (b12b2a79...), the source core/skills/_shared/citation-format.md exists with a record, and the generator is scripts/build-skill-wrappers.mjs. The render is one header line plus the core text, so every render line is the core line + 1. I checked the line mapping: 7->6-2, 52->51-3, 54->53-2, 8->7-2, 97->96-25, 93->92-2, 35->34-30, 11->10-2, 97->96-44, 5->4-51. All 10 refs join the matching core slot.
- Joined outcomes match the source: render-join where the core is preserve (the docs/id-systems-audit.md, docs/backlog.md and docs/history targets are all live retained files; id-systems-audit is confirmed retained by owner-answers L12 Q1). Parked where the core is parked (three blockers, each specific: split-holder RUL ownership, flat specs scan coverage plus CLI defaults, retired numbered decision files). The blocker texts are the core's, with the render's own file prefix.
- No diff and no hand patch on either render (diff null, expectedAfterSha equals source sha). Parked items carry dependency citation-convention-and-scan-packet.
- OUTCOME defects: none.
- Record-text note: the core record lists these as authorAddedReferences rather than references, which is fine for the join.

### docs/ui-spec/generated/wireframe-v2.html - ok
- The generator is interpret-wireframe.mjs plus html-shell.mjs over docs/ui-spec, and the source inputs are listed with hashes. There is no diff and no hand patch.
- All 10 distinct "docs/specs/herdr-web-dashboard.md" occurrences in the pinned HTML (lines 516, 657, 807, 898, 968, 1030, 1099, 1145 x2, 1347, 1363) are covered as ADMIT render-join. Each maps to its source slot (S01, S02, S03, S04, M01, M02, M03, C01, 20-domain-rules) through an existing Step 3 edge in step-03-records/batch-125.jsonl. The embedded-prose claims for those sources are inherited.
- reference-002255 (L1363, timing none, target null): verified true. 15-system-events.md at the pin has no docs/specs citation, so the HTML payload is stale and regeneration drops it. Render-join without a target is right.
- The 19 other refs and 178 dynamic tuples are REJECT/preserve with a true nonDocumentUse (minified client JS, CSS, DOM calls).
- OUTCOME defects: none.
- Record-text note: reference-002244 and reference-002259 (both L1145) share the single C01 edge maps-j-08467, but C01 contains two citations. Cosmetic only.

## Counts
- Source files: 17 (3 with items or added refs in validate/html-shell/verify-runtime, 2 yaml patches, 12 empty).
- Items reviewed: 4 dynamic + 2 added refs (validate, html-shell) + 5 (verify-runtime: 1 ref + 4 dynamic) + 2 patches = 13. Generated records: 3 (renders 2 x 10 refs, html 29 refs + 178 dynamic checked in aggregate).
- OUTCOME defects: 0. Record-text notes: 4 (readdirSync items missing, 000109 expression, C01 shared edge, authorAddedReferences placement). Lead-judgment questions: 1 (broken frontend/docs path in verify-runtime, file as separate item).

Status: DONE
