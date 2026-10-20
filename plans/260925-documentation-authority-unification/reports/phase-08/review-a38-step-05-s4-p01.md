# Review a38 Step 5 seam 4 part p01 (src-p01)

Pin 95301cb9a2cfef0e6b16eade29eca0e3b0aeabbf. Payload s4-src-p01.json, 20 file entries, 134 items (10 literal references, 124 dynamic tuples). Read-only; no checker, probe or CLI run. Hash/apply/rollback exactness was not recomputed.

## Per-file verdicts

| File | Items | Verdict |
|---|---:|---|
| src/report/decision-index.mjs | 14 (4 ref, 10 dyn) | ok |
| src/report/knowledge-projection.mjs | 9 dyn | ok |
| src/report/authoritative-match.mjs | 2 dyn | ok |
| src/report/enduser-index-generate.mjs | 23 (2 ref, 21 dyn) | rework (D1) |
| src/report/enduser-index.mjs | 7 (3 ref, 4 dyn) | rework (D2) |
| src/report/frontmatter.mjs | 6 dyn | ok |
| src/report/item-trace.mjs | 2 dyn | ok |
| src/report/knowledge-resolver.mjs | 4 (1 ref, 3 dyn) | ok (see Q1) |
| core/instructions/platform-laws.md | 0 items, diff only | ok (see N5, Q3) |
| src/setup/instruction-projections.mjs | 57 dyn | ok with notes (see Q2, N3, N4) |
| core/agents/*.yaml (10 files: code-reviewer, council-assumptions, council-feedback-loops, council-ship-maintain, debugger, docs-manager, fgos-placeholder, fullstack-developer, planner, researcher) | 1 each, 10 total | ok |

## OUTCOME defects

**D1. dynamic-009770, src/report/enduser-index-generate.mjs L124, rule: admission is decided by the operation.**
- The tuple is `fs.existsSync(path.join(fgosDir, 'events.jsonl'))`, inside `computeEnduserDocsIndex`, assigned to `storeReachable`.
- It probes whether the event-store log file exists. It does not construct or read a document path.
- It is currently ADMIT and parked with the generic "caller/state/output population" blocker.
- Correction: REJECT with preserve, naming the actual non-document use ("event-store reachability probe under fgosDir, not a document location"). The owning proof stays with the empty-state/reachability behaviour of the enduser index receipt.
- Check that the rest of that function's parity text does not depend on this tuple being admitted.

**D2. reference-003700 (park) versus reference-003699 (preserve), src/report/enduser-index.mjs L30 and L28, rule: same-passage items share one outcome.**
- The two passages overlap: 003699 covers lines 25-31 and 003700 covers lines 27-33. Each passage contains the other's literal. Both are the same comment block about the `QUADRANT_DIR_ALIASES` design.
- 003699 preserves `docs/decisions/`. 003700 parks `docs/explanation/` with a generic "quadrant/example ... co-cut" blocker.
- That blocker does not name a real dependency for a comment literal. `docs/explanation/` exists at the pin and is not under a retiring `docs/specs/**` or `docs/architect/**` tree.
- Correction: give the two one outcome. My lean is to preserve both as design-origin comment provenance, with an existence witness for `docs/explanation/`. If the Lead wants a park because the `docs/<quadrant>/` roots retire (as L12-62 says for the skill files), 003699 must park too, and the blocker text must name that root.
- The code operand `QUADRANT_DIR_ALIASES` (dynamic-009791, L38) is correctly parked. It is an alias scan list used for lookup only, never a write destination.

## Lead-judgment questions

**Q1. Comment-provenance preserves whose target sits under retiring trees.**
- Items: reference-003697 (enduser-index-generate.mjs L21, `docs/specs/enduser-docs-index.md` R10), reference-003698 (same file L2), reference-003702 (knowledge-resolver.mjs L18, `docs/architect/knowledge-registry-redesign.md` §14.3).
- Their witness is "design source comment ... tree retires at Phase 9, comment provenance only". This is not a "retained" witness, so it passes the L12-71(2) rule and matches the registrations.mjs precedent.
- 003697 and 003702 cite a rule as design origin, so they are fine as preserves.
- 003698 is the module-header description "end-user doc index (docs/specs/enduser-docs-index.md)". It reads as a navigation pointer, not as provenance.
- I found no live holder for the end-user index spec under `docs/platform/**` or `docs/knowledge/**`. Only verification logs and decision files mention it.
- The transitional switchboard and the authority map still route this spec as the end-user corpus, so it may not retire.
- Please confirm whether 003698 stays a preserve or becomes a dead-link park with a successor note. The record text should also say what happens to the spec at Phase 9.

**Q2. Admission of non-document state and error-metadata paths in instruction-projections.mjs.**
- Ledger path (`.fgos/installation/projections/ledger.json`, a machine-state JSON file): dynamic-013884, 013886, 013887, 013896, 013901, 013902, 013914, 013915.
- `this.filePath = filePath` field assignment (dynamic-013904, L30). This stores error metadata. Its sibling `super(... (in ${filePath}))` (013895) is rejected as formatting.
- All are admitted and parked under `blockedSeams: generators`. Under L12-71(7) these are state paths coupled to the owning check, not document destinations.
- Please confirm they stay admitted. The record text should say "state ledger, coupled to the owning check" rather than treating them as document destinations.
- If you prefer strict "document path only" admission, these reject, as D1 does.

**Q3. platform-laws.md diff against the AGENTS.md routing rulings.**
- The entry has an inherited Step 4 diff (step04-009) but no items or windows in this payload. I could not match the slot ids here.
- The diff itself is semantically sound:
  - It repoints `docs/platform-foundations.md` to `docs/platform/platform-foundations.md`.
  - The H2 anchor and the L1-L10 H3 anchors exist at the pin.
  - The change is on a source file.
  - The forward and rollback hunks are mirror images.
  - It names the co-cut tests and says output regeneration is required.
- L12-60 ruled that AGENTS.md's own pointers to `docs/platform-foundations.md` must preserve, because it is the switchboard canonical route. L12-60 also marks platform-laws.md's `docs/platform/...` citations as "predates the plan, out of scope".
- Patching this source repoints the managed block copy in AGENTS.md. That copy follows the source by regeneration.
- Please confirm that the Step 4 patch stays as is and that the Step 7 composition carries the AGENTS.md and rendered-block consistency.

## Record-text notes

- N1. dynamic-009761 and dynamic-009768 (the `docs/decisions/index.md` and `docs/enduser-docs-index.json` path constants built from path segments) are parked with generic "caller/state/output population" text. The target set is a fixed constant. A real blocker would be "same-input output-set parity unexecuted". That is acceptable for the generators seam, but the wording is boilerplate.
- N2. reference-003701 (`docs/decisions/...`) carries a witness with `existsAtPin: false`, because the expression is a pattern. Say "pattern, not a path" instead of citing the retained-root rule.
- N3. The preserved emitted-message tuples in instruction-projections.mjs (013878, 013903, 013905-013909) interpolate values produced by parked tuples (013892-013894, 013896, 013925-013927). The preserve text does not state the co-cut dependency that L12-71(7) uses for doc-registry messages. Add it.
- N4. Rejected tuple dynamic-009805 (`${d.role}`) and admitted/parked tuple dynamic-009806 (`${d.currentPath}`) share L40 of knowledge-projection.mjs. The split is correct, since the role is a label, but say so in the record text.
- N5. The agent YAML tuples reject only the substring `scope:` inside `tool-scope:`. This is correct as agent config metadata. The record text is uniform and fine.
- Possible unslotted lexical occurrences. I did not find these in this part's items; the Lead should confirm they appear in the post-census receipt:
  - decision-index.mjs L5 (`docs/enduser-docs-index.json`)
  - enduser-index.mjs L6, L12, L35 (`docs/<quadrant>/`, `docs/<alias>/`)
  - enduser-index-generate.mjs L4, L85, L143 (`docs/<quadrant>/`, `docs/knowledge/`, the manifest path)
  - knowledge-resolver.mjs L38 (the alias lookup tuple, next to the admitted L32 and L45 tuples)

## Verified without defect

- decision-index.mjs: the four `docs/decisions/index.md` and `docs/decisions/` preserves fit L12-60(5) and L12-62(4). The generated index is retained, and aliases are lookup-only. The refusal-message tuple (009758) is correctly preserved as emitted output. The six formatting rejects are real non-document operations.
- knowledge-projection.mjs: the payload-field parks (purposeTitle, purposeSlug, lineage, currentPath, aliases) match the seam rule that state-derived values wait for a source export. The formatting rejects are correct.
- authoritative-match.mjs: both rejects are adapter-name error messages with no document path.
- item-trace.mjs: the two `docPath` copies are payload parks consistent with enduser-index 009790.
- frontmatter.mjs: all six are delimiter and serialization formatting rejects.
- knowledge-resolver.mjs: the three lookup parks are identity lookups by currentPath or alias, not write destinations.
- All admitted tuples have a parked or preserved outcome with an owning receipt. No diff other than the platform-laws.md one is present in this part.

## Counts

- 10 literal references, all ADMIT:
  - preserve: 9 (003693, 003694, 003695, 003696, 003697, 003698, 003699, 003701, 003702)
  - park: 1 (003700)
- 124 dynamic tuples: ADMIT 51 (parked 41, preserve 10), REJECT 73 (preserve 73).
- Outcome defects: 2 (D1, D2). Lead-judgment questions: 3. Record-text notes: 5, plus one list of possible unslotted occurrences.
- Unseen sibling slices: none from this part's entries. The platform-laws.md slot-id list (instructions-025 to instructions-050) was not visible here.

Status: DONE_WITH_CONCERNS
