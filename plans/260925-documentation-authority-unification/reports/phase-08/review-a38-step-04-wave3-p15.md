# Review a38 Step 4 wave 3, part 15 (set step04-019)

Pin dc24ce645. Payload step-04-wave3-p15.json. All five sources read whole via git show; every slot, the one diff and all targets checked at the pin.

## Per file

| File | Category | Slots | Verdict |
|---|---|---|---|
| packages/distribution/rust/src/canonical.rs | A | 1 (class6-l-000192, parked) | ok |
| packages/distribution/rust/src/init.rs | A | 1 (class6-l-000193, parked) | ok |
| packages/distribution/rust/src/manifest.rs | A | 1 (class6-l-000194, patch) | ok |
| packages/distribution/rust/src/verify.rs | A+B | 1 (class6-l-000195, parked) | ok |
| packages/distribution/rust/src/workspace.rs | A+B | 2 (class6-l-000196, -000197, parked) | ok |

## Slot findings

- manifest.rs -000194 (patch, line 4).
  - Target docs/platform/packaging-distribution/contracts/release-manifest.md exists. Heading `## 2. Frozen Schema V1 Shape` slugs to `2-frozen-schema-v1-shape`, so the anchor resolves.
  - Diff touches only the two `//!` module-doc lines 3-4. Hunk @@ -1,7 +1,7 @@ counts match (2 context, 2 changed, 3 context).
  - It drops the §5 citation and re-states the live release-manifest.md path with the anchor, so the duplicate citation is removed. Backtick and label form are kept, and the path is repo-root-relative like the original.
  - Comment-only, with no code or string-literal change. A repo grep found no test or script reading these comment strings. No behavior change.
  - Replacing the "same-number Digest Rule" with §2 is right. The live §5 Digest Rule is a digest recomputation rule, while manifest.rs defines the schema types. The invariants it lists are §2-§4 content (legacyNode in §4).
- canonical.rs -000192 (park).
  - The source line 3 cites §5 for NFC, ordering and case-collision rules.
  - At the pin, live release-manifest.md §5/§6 does not carry NFC normalization, byte-order sorting or case-collision rules. They appear only in the carriage heading "Release Tree Canonicalization" (line 256).
  - Parking matches L12-62 ruling 8. The passage search witness terms (NFC, Release Tree Canonicalization, case collision) are consistent with this.
  - Line 76 and line 35 mention `runtime-identity-and-activation.md` or §5 as a bare filename or bare section, so they are not edges. No missed reference.
- init.rs -000193 (park).
  - The source cites §3, §6 and §14 together. No single live passage covers the whole claim: §14 Walking Skeleton exists only in the architecture carriage, line 309.
  - Parking is correct. Bare names `phase-12-fgctl-...md` (line 4) and `contracts/*.md` (lines 40, 68, 93) are not edges. No missed reference.
- verify.rs -000195 (park).
  - Live §5 Digest Rule is only a narrow statement. The exact formula, sha256(canonical-json(manifest without artifactDigest)), appears only in the carriage detail. verify.rs also does canonicalization checks.
  - Parking is consistent with canonical.rs and ruling 8. Line 326 "(§5 rules)" is a bare section pointer, not an edge.
- workspace.rs -000196 and -000197 (park).
  - At the pin, docs/specs/distribution.md line 297 is RUL12/doctor-fix text, not root discovery. The git-common-dir rule is at line 429 there. The numeric locator is therefore stale.
  - The live holder is packaging-distribution/spec.md line 797, which sits under "Retained Distribution Source Detail" (heading at line 459). That is a Pointers entry about the shell-integration helper, not a contract passage.
  - Parking with a successor note is correct under the name-drift and uncertain-successor ruling. Both slots carry the same reason, which is consistent. Line 67 bare filename is not an edge.

## OUTCOME defects
None.

## Record-text notes (not rework)
- The `reason` fields repeat the prefix "A51, L12-30/31/32/58/60: L12-62: A51, ..." for the parked slots. This is cosmetic.
- The workspace.rs parks say the rule is in "retained Distribution Source Detail (around line 797)". Precisely, it is a Pointers entry about the shell-integration script within that section. The claim holds.

## Lead-judgment questions
None.

## Counts
Set step04-019, this part: 5 files, 6 slots reviewed, 0 rework (A: 5, B: 2).

Status: DONE
