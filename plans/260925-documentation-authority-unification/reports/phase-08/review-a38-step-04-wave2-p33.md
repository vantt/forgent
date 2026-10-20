# Review a38 — Step 4 wave 2, part 33 (set step04-023, stratum 4, first review)

Pin dc24ce645. All 4 files read through the pinned payload and the pinned blobs. All 10 joined slots reviewed (8 preserve, 2 parked, 1 patch counted below; total 10 slot rows: 7 preserve, 2 parked, 1 patch).

| File | Slots | Verdict |
| --- | --- | --- |
| src/runner/dispatch/config.mjs | 7 preserve | ok |
| src/runner/dispatch/confinement/authority.mjs | 1 parked | REWORK |
| src/runner/dispatch/confinement/policies.mjs | 1 patch | ok |
| src/runner/dispatch/operation-prompt-templates.mjs | 1 parked | ok |

## Outcome defects

### 1. authority.mjs class6-l-000263 (source line 2) — park should be a Phase 9 patch (L12-30/31/32)
Source: `// (Phase 02 R1-R7, docs/specs/confinement-authority.md §1, §5.2, §6.6, §6.9).`
Reason for the park: sections sit "across separate spec and contract holders", so a single narrow heading would omit part of the locator. That is true of the single-target form, but live (non-carriage) holders exist in docs/platform/** for every cited section:
- `docs/platform/agent-confinement/spec.md` has `## 1. Quyết định kiến trúc` and `### 5.2 Quy tắc dependency`.
- `docs/platform/agent-confinement/contracts/confinement-authority-v1.md` has `### 6.6 ConfinementAttestation` and `### 6.9 Kết quả của cửa Authority`.
These are the same live placements the sibling confinement records already patch to, all under the same candidate-status header:
- class6-l-000264 (backend-registry.mjs) targets the contract at `62-nơi-đặt-policy`.
- class6-l-000265 (policies.mjs) targets the contract at `6-canonical-contracts`.
- class6-l-000266 (request.mjs) targets the contract at `6-canonical-contracts`.
Parking the one record that needs two holders is inconsistent with its siblings. The park witness itself shows the legacy path is cited only as citation-only. The "Phase 02 R1-R7" label is a plan-phase rule label, not a spec section, so it needs no resolution.
Correction: make the slot a Phase 9 patch. Use two links in one replacement and keep the §-numbers:
`(Phase 02 R1-R7, docs/platform/agent-confinement/spec.md §1, §5.2; docs/platform/agent-confinement/contracts/confinement-authority-v1.md#6-canonical-contracts §6.6, §6.9).`
The primary target is the contract, with the spec as a second link. Alternatively split into two spans or slots if the record format allows only one target. Comment-only, no behavior change.

## Ok verdicts (evidence)
- config.mjs: 7 preserve slots, all checked against the pinned source.
  - l-000258 (lines 10-11) and l-000262 (lines 1664-1665) are wrapped `docs/history/<feature>/CONTEXT.md` pointers. These are external history conventions (L12-10), correctly literal. The wrapped spans are covered by two slots each.
  - l-000259 (line 630) is `docs/decisions/0026-...md`, an elided example. The successor note `docs/platform/runner/decisions/h-36d872fbb0e5.md#0026-native-first-dispatch-doctrine-launcherroottaskcapacity` exists, and heading `### 0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity` is at line 583. It is non-executable.
  - l-000260 (line 988) is a dated proof citation (2026-09-06-isolation), preserved as evidence. The path continues on line 989 and is covered by the same passage.
  - l-000261 (line 1163) says "previously documented-only in docs/specs/runner.md". It is past-tense history, so preserve is fine.
- policies.mjs l-000265: patch is comment-only. Target and anchor resolve. `confinement-authority-v1.md` exists at the pin and `## 6. Canonical contracts` slugs to `6-canonical-contracts`. §6.1 and §6.2 sit inside that section, and the §6.1-§6.2 labels are kept. The path is repo-root-relative, like the original. The diff context lines 1-5 match the pinned bytes. The diff changes one comment line only, with no code behavior change.
- operation-prompt-templates.mjs l-000273: parked, correct. The only holders of this flow-definition content are in docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md (carriage). A grep of the live agent-coordination contracts, architecture and vocabulary found no live holder of the prompt-template registry, deterministic resolver or provenance renderer. `contracts/workflow-stage-operation.md` is a live contract but does not hold this claim. So the park is justified under L12-30.

## Record-text notes (not rework)
- authority.mjs lines 184 and 1308 carry bare `spec §6.6` and `spec & contracts` mentions. They are not path edges and need no slot. They would still read correctly after the rewrite in the defect above.
- Dated plan paths in these sources (`plans/260916-account-rotator/design.md` at config.mjs line 574, `plans/260906-1831-dispatch-visibility-v0` at line 952, `plans/260919-coordination-skill-harness-simplification/plan.md` at operation-prompt-templates.mjs line 4) are archived history, unslotted and preserved under L12-29/60.
- stepFiveExcluded is empty in all 4 records. No runtime strings were found in these files' doc references.

## Lead-judgment questions
- If the format permits only one patch target per slot, is a single patch to the contract with a two-link replacement acceptable, or does the Lead want two slots for l-000263?

## Counts
Set step04-023, stratum 4: files reviewed 4, files with outcome rework 1 (authority.mjs; 25%, above the 3% threshold, so the set expands to every file under the rule).

Status: DONE
Summary: 3 of 4 files ok; authority.mjs l-000263 is a parked slot that has live non-carriage holders in docs/platform/agent-confinement, so it should be a Phase 9 patch. The operation-prompt-templates.mjs park is justified (no live holder).
