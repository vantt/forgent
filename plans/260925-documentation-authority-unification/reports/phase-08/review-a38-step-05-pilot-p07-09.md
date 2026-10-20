# Review a38: Step 5 pilot parts 07, 08, 09 (setup/doctor seam)

Pin: aa8d343746a292d2cb476ab76e6489411fd59a62. Read-only. I ran no checker, probe, packet, test or fgos command.

## Method

- I pulled the pinned bytes of the 8 assigned files with `git show`, and read the full source of every assigned file.
- I loaded the payload items for these files and compared them against the pinned bytes with a script. For every dynamic tuple (321 in all), `currentPassage.text` equals the pinned lines `startLine..endLine`, the tuple text occurs on or in that passage, and `currentLine` lies inside the passage. There were 0 mismatches. Every `source-context` window equals the pinned lines.
- The record-level `sourceSha256` values for all 8 files equal both the pinned blob hashes and the `currentInputs` hashes in `step-05-pilot-parity-receipts.json`.
- I read the three reference records in full, the `setup-doctor-roots-pilot` receipt, the decisions-index and architecture-manifest tests, and the pinned tree for the scan roots.
- Files in the payloads but outside my assignment (event-store-fixes, executor-*, git-checks, git-hooks) were not reviewed.

## Per-file verdicts

None of the 8 files has a Phase 9 diff. Every `diff`, `rollbackDiff` and `coCutPaths` is null or empty, and `expectedAfterSha256` equals `sourceSha256`. So the diff checks (whole-file application, generated outputs untouched, rollback) are vacuous and hold.

| File | Slice seen | Reviewed | Verdict |
|---|---|---|---|
| src/setup/bin-discovery.mjs | p07 only: tuples idx 5-21 (17). Reference class6-l-000340 and tuples idx 0-4 are in p06, not seen. | 17 tuples | ok |
| src/setup/blind-steps-proven-pools.mjs | p07, whole | 7 tuples, 0 references | ok |
| src/setup/checks.mjs | p07, whole | 1 reference (reference-003795 / class6-l-000341) | ok, with witness defect W1 |
| src/setup/config-merge.mjs | p07, whole | 2 tuples | ok |
| src/setup/event-store-checks.mjs | p07, whole | 15 tuples | ok |
| src/setup/holder-lock-checks.mjs | p07 (1 tuple), p08 (149), p09 (13) = all 163 | 163 tuples, 0 references | ok |
| src/setup/instruction-composition.mjs | p09, whole | 42 tuples | ok |
| src/setup/instruction-registry.mjs | p09 only: tuples dynamic-013930..014004 (75) and all 3 references. The remaining 31 tuples (including the 4 parked, dynamic-014032..014035) are in p10 and were not seen. | 75 tuples + 3 references | rework (3 items, below) |

Counts:
- Tuples: 321 reviewed. 31 are ADMIT/preserve, all in instruction-registry. The other 290 are REJECT.
- References: 4 reviewed. 1 is ADMIT (reference-003798, an emitted message) and 3 are REJECT (comments).

## Outcome defects

**D1. dynamic-013969, instruction-registry.mjs line 361. Wrong rejection reason, and it contradicts a sibling record.**
- The tuple is the template `Law supersessionDecision "${...}" is not recorded in docs/decisions/index.md`, thrown as an emitted `InstructionRegistryError`.
- It is REJECTED as `instruction-metadata` with the reason "is not a new doc root or filesystem target".
- The same literal passage is ADMITTED as an emitted-message by reference-003798 (class6-l-000344, preserve, parityObligation set, proofCommand missing).
- Binding rule: runtime-emitted strings are user-visible output. The template literally contains a doc path, so the reason is false.
- Correction, either of:
  - (a) ADMIT/preserve with the same receipt and parity obligation as reference-003798.
  - (b) REJECT with an explicit `priorRecordRefs` pointer to reference-003798 as custody, and a reason that says the path is carried there.
- The outcome (preserve, no output delta) is safe either way.

**D2. Over-admission, harmless but inconsistent.**
- dynamic-013988 (line 571): `findByScope(scope) { return this.filter((u) => u.scope === scope); }` is a scalar filter with no path or filesystem operation. It is ADMIT as `instruction-discovery`. The sibling INSTRUCTION_SCOPES tuple (013981, line 45) is correctly REJECT, so this should be REJECT.
- dynamic-014003 (line 617): `const idToPaths = new Map()` is a duplicate-id accumulator and constructs no path. It is ADMIT but should be REJECT.
- dynamic-013982 and dynamic-013989..013992 (lines 453, 590-593): these are JSDoc option descriptions. They are ADMIT/preserve as `instruction-discovery` with role `comment`. The three registry comment references are rejected as comments, so the rule is applied inconsistently. Reject them as comments, or state why comments inside an admitted discovery door count.
- Effect: only the proof and parity obligations are inflated. No wrong disposition and no hidden change.

**D3. Receipt scan-root claim, `setup-doctor-roots-pilot.comparison`. Receipt field wrong or incomplete.**
- `currentOutputSet` and `candidateOutputSet` list the static root `domains/marketing/instructions`.
- At the pin, `domains/marketing` has no `instructions` directory. The only instruction directories with files are `core/instructions` (3 groups), `components/packaging-distribution/instructions` and `domains/coding/instructions`. `scanMarkdownFiles` and `discoverInstructionSources` skip a missing directory.
- `comparedFields` says "scan roots/file sets", but the sets hold only roots and owners, with no instruction file list or hashes.
- `manifestOwners` is correct: the manifest has components [packaging-distribution] and domains [coding, marketing], plus the implicit `core` and `platform`.
- Correction: list only roots that exist and mark `marketing` as absent, or state that absent roots are listed on purpose. Add the file set (6 .md files) so the comparison field has content.

## Record-text notes

- **W1 (checks.mjs, reference-003795).** `resolverWitness.exists: false` for `docs/history/setup-doctor-config-registry/` is wrong. The directory exists at the pin (CONTEXT.md, plan.md) and in the review worktree. The rejection still stands (history citation in a comment, L12-26(5)), but the witness field should read true. The sibling bin-discovery witness is correct.
- The architecture-manifest comments (class6-l-000345, class6-l-000346) carry the rejection rule `history-design-contract-evidence`. They are live-contract navigation to a retained path (docs/architecture-manifest.json, which the module reads), not history. Preserve is right, but the rule label is imprecise.
- The reference-003798 `proofCommand: missing` is defensible. The registry tests assert `code === 'UNKNOWN_DECISION'` (test/setup/instruction-registry.test.mjs, lines 348, 369, 397, 434), not the exact message bytes.
- The placeholder `instructions-058` carry and the 4 parked tuples are in p10 and were not seen.

## Rejections verified correct

- **holder-lock-checks (163):** all paths are `.fgos`, lock roots, `packages/holder-lock/contracts/lock-registry.v1.json`, probe files, `/proc`, or diagnostic templates. No emitted message names a doc. A grep of the file for doc and plan tokens finds only the line-2 comment.
- **instruction-composition (42):** all are diagnostic templates, IR (intermediate representation) joins and scope tables. `EFFECTIVE_INSTRUCTIONS_DIR = '.fgos/instructions/effective'` is state, not a doc root. No admitted-class passage exists.
- **bin-discovery (17), config-merge (2), event-store-checks (15), blind-steps-proven-pools (7):** all are fgos binary resolution, config key paths, git refspec overlap, or doctor message templates. None carries a doc operand.
- **Registry messages and manifest handling:** the rejected registry message templates (lines 130-355, 431) carry no doc operand. `manifestPath` handling (013983..013985, 013987) is ADMIT/preserve, which is consistent with the receipt and candidate construction (`options.manifestPath ?? docs/architecture-manifest.json`, no root delta).
- **Comment references:** the 3 comment references are correct to reject. Reference-003798 is correctly admitted as preserve, since `docs/decisions/index.md` is the generated decision-index projection at its generator path (AGENTS.md).

## Lead-judgment questions

1. **dynamic-013986 (line 480, "Failed to parse architecture manifest at ${manifestPath}").**
   - Rejected as having no doc-location operand, but the default operand value is an absolute path ending in `docs/architecture-manifest.json`.
   - Should the rejection reason name that the value derives from the admitted 013983..013985 constructions, so message parity rides on that receipt? Preserve is safe because the manifest is retained.
2. **Comment citations outside census scope.** Comment citations to `docs/platform/...` exist in these files and have no census edge:
   - holder-lock-checks line 2: `docs/platform/holder-lock/spec.md`
   - instruction-registry line 2 and instruction-composition line 2: `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md`
   - blind-steps-proven-pools lines 21-24: `plans/reports/*.md`
   - The census covers only legacy roots (docs/history, docs/specs, and similar), so this is not a record defect. Confirm these paths are intentionally outside Phase 8 scope.
3. **Receipt-level proof 1 is `not-run`.** I did not verify this proof or any other.

## Counts

- Tuples reviewed: 321.
- References reviewed: 4.
- Outcome defects: D1 (1 tuple), D2 (7 tuples: 013988, 014003, 013982, 013989..013992), D3 (receipt field). No hidden behavior change and no missed census reference found.
- Record-text notes: W1 plus 3 other notes above.
- Slices not seen: bin-discovery p06 (1 reference + 5 tuples), instruction-registry p10 (31 tuples including 4 parked and the carry binding).

Status: DONE_WITH_CONCERNS
Summary: 7 of the 8 files are ok on the slices I saw. instruction-registry needs rework (D1 wrong rejection reason, D2 over-admits), and the receipt's scan-root field is wrong (D3, the nonexistent marketing root). All 321 passages and tuples match the pinned bytes, and none of the 8 files has a diff to patch.
