# Review a38 step-05 seam 4, part src-p06

Pin 95301cb9a for all four files. No file has a diff or rollbackDiff, so no patch was checked. Items reviewed: 137 (16 + 17 + 91 + 13).

## Per file

### scripts/backfill-unit-summaries.mjs, verdict ok, 16 items
All REJECT/preserve. They touch only `.fgos/assignments`, `.fgos/workflow-runs`, argv, repoRoot and report fields. These are state/runtime paths, not documents. The `evidence.file` string (L38) is a `.fgos/workflow-runs/.../events.jsonl` path, also not a document. No defects.

### scripts/build-domain-registry.mjs, verdict ok, 17 items
All REJECT/preserve. They touch `domains/<d>/registry.yaml`, `workflows/*.yaml` and `compiled.json`, which are domain config. No `domains/*/AGENTS.md` or other doc is read or emitted. The error and log strings name config paths only. No defects.

### scripts/build-rust-distribution.mjs, verdict rework, 91 items
OUTCOME defects:

1. **dynamic-006393 and dynamic-006395** (admitted, parked, role unresolved-relocation, currentLine null, passage L290-296)
   - Rule: park needs a real blocker; same-passage items share one outcome; a rejected or admitted tuple must name its actual use.
   - Problem: the passage is the outDir containment check against the checkout (`dist/` and `resolvedRepo`). The tuple inputs are `path.resolve(resolvedRepo, CARGO_TARGET_DIR||'target','release')` and `outputDir`, which is cargo build output. Neither constructs or reads a document path.
   - Problem: the "no unique content relocation" blocker is not a real blocker for a non-document tuple.
   - Problem: sibling dynamic-006390/6391/6392 (same passage) and dynamic-006394 (`releaseOutputDir`, same input) are REJECT/preserve.
   - Correction: REJECT/preserve, `non-document-infrastructure`, naming the actual use ("release staging output and cargo target dir containment"). Remove the parked state and the `generators` blockedSeam.

2. **dynamic-006428** (admitted, parked, role document-path-operation, L491 `manifestPath = path.join(resolvedOut,'manifest.json')`)
   - Rule: same-passage literal and dynamic tuple share one outcome.
   - Problem: dynamic-006427 is the same statement and is REJECT/preserve.
   - Problem: `manifest.json` is the staged release manifest (JSON, read by the Rust host through `components.legacyNode`), not a document. The blocker "reader/writer proof required" is invented.
   - Correction: REJECT/preserve, `non-document-infrastructure`, naming the release manifest as the actual use. Unpark.

3. **Payload-copy tuples** dynamic-006358, 006359, 006365, 006411, 006412, 006420, 006421, and the pass-through error formatters 006357, 006362, 006363, 006364, 006413, 006416, 006417, 006419 (possible outcome defect, needs the Lead's call)
   - Rule: a rejected tuple must really not construct or read a document path.
   - Evidence: `package.json` `files` at the pin declares `README.md`, `LICENSE`, `docs/how-to`, `docs/explanation` and `docs/enduser-docs-index.json`. `collectSourceFiles` (L120-165) walks those entries. L343-360 copies each one into `libexec/legacy-node`. L420-430 hashes each and writes it to the manifest `path`. `classifyReleasePath` (L98-101) maps `docs/*`, `README.md` and `LICENSE` to class `immutable-doc`.
   - Problem: at runtime these tuples do construct and read document paths. The rejection reason "non-document-infrastructure" is not true for the docs entries.
   - Correction: either admit them as a pass-through over the `package.json files` target set with outcome preserve (the set is owned by the package.json seam), or give the rejection an explicit witness that the tuple is target-agnostic and that the target set is recorded where it is declared.

4. **Admission inconsistency, low severity, outcome unchanged (preserve)**: dynamic-006448 and dynamic-006449 in build-skill-wrappers (see below) are the same construct as dynamic-006378/6379 here and dynamic-006340/6341 in build-domain-registry. Those are REJECT as repo-root derivation.

### scripts/build-skill-wrappers.mjs, verdict ok with one note, 13 items
- dynamic-006450 to 006455 (`.agents/skills`, `.claude/skills`, `plugins/fgOS/skills` roots) are rightly ADMIT/preserve. The targets are not under docs/specs or docs/architect. They are generated render surfaces that follow their sources (core/skills, domains/*/skills), so a hand patch would be wrong.
- dynamic-006448 and dynamic-006449 are `repoRoot = path.resolve(dirname(fileURLToPath(import.meta.url)),'..')`. They should be REJECT, like the identical dynamic-006378/6379 and dynamic-006340/6341 (defect 4 above). The outcome is the same either way.
- dynamic-006456 to 006460 (stdout `assembled/wrote/mirrored <relpath>` lines, REJECT/preserve) emit paths under the admitted roots. They agree with the admitted roots (preserve) and need no change.

## Record-text notes
- dynamic-006393 and dynamic-006395 carry `operationChain.operation` text that does not match their own passage: the input is `outputDir`/CARGO_TARGET_DIR while the passage is L290-296. This is a symptom of the frozen-tuple relocation failure. After the fix to REJECT, the witness should be re-bound to the real lines (L56 and L299 for outputDir, L290-296 for the containment check).
- `proofCommand: missing` and the "no runtime pass" scope are consistent across items. This is acceptable for preserve and reject records.

## Lead-judgment questions
1. Defect 3: admit the payload-copy tuples as pass-through over package.json `files`, or keep REJECT with a stronger witness?
2. No item in this part covers the `classifyReleasePath` literals at L98 (`docs/`, `README.md`, `LICENSE` to `immutable-doc`) or the docs entries of the package.json `files` list. Are these tracked as literal references in another part or seam? If not, they are a missed admitted reference.

## Counts
- Items: 137.
- Outcome defects: 3 definite (006393, 006395, 006428), 1 group needing a Lead decision (defect 3), 1 low-severity admission inconsistency (006448 and 006449).
- Diffs checked: 0 (none present).
