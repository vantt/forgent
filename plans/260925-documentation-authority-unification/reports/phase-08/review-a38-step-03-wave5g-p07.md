# Review a38 step-03 wave5g, part p07

Pin `ae141550c2e022310de7a0efea757580c0b2479f`; worktree HEAD `9117e9cb6`. No checker, probe or resolver script was run. Nothing was written to the worktree.

## File

- Path: `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`
- Set: batch-115. Stratum: mandatory-threshold.
- Verdict: **ok**
- Edges reviewed: 17 of 17 (4 patch, 2 parked, 11 preserve, 0 row-flip). One of the 17 is the author-added edge `author-wave5g-docs-platform-runner-subcomponents-h-6979005beaf7-spec-L23C302`.
- Digest: record `digest` equals `inventoryFileDigest`, `38b4c82e7ec19c98dddb438de7d76c989b96b2df17193676bec3c093b50c9202`. That binds bytes only.
- `retiresWithTree` is not set. The file is not under `docs/specs/**` or `docs/architect/**`, so that check does not apply.

### Reading coverage

- The source is 201 lines and 180,961 bytes, over the 60 KB threshold, so I read an outline plus every edge region and did not read it whole.
- I read lines 1-30 in full (wrapper metadata, candidate note, start of Business Rules).
- I read every edge line around its span: lines 10, 18, 23, 46, 59, 67, 68, 72, 94, 99, 110 and 166.
- I scanned all 201 lines for path-like tokens, `docs/` and `.md` strings, and decision ids. I read the context of every token that is not an edge: lines 59 and 94 `plan.md`, 87, 133, 135, 177, 184, 188 and 196.
- I read the diff in full with a char-level comparison. There are 4 changes in 3 hunks. Each changes only the path token (plus the added anchor) and leaves the rest of the line untouched.
- I read the targets at HEAD:
  - the ADR-011 header
  - the Iron Law evidence-contract knowledge doc, lines 1-80
  - the tool-registry knowledge doc, headings and lines 48-80
  - the gate-bypass knowledge doc, lines 70-100
  - the agent-confinement `spec.md` and its `contracts/confinement-authority-v1.md`, lines 140-152

### Per-edge result

| Edge | Source line | Disposition | Result |
|---|---|---|---|
| 07718 | 10, `Provenance:` | preserve | ok. Provenance lineage stays literal (L12-47). Successor note is present. |
| 07719 | 18, `Related:` | patch to `docs/platform/runner/spec.md` | ok. See the note below on the 07786 boundary. |
| 07720 | 46, `docs/history/str63-frozen-judge-fgos/CONTEXT.md` | preserve | ok. The path never existed in the pin tree or HEAD, and no name-drifted successor exists. The text is a "per STR63, xem forgent workshop ..." evidence citation naming a different repo, so ruling (c) preserves it. |
| 07721 | 59, `docs/history/return-close-pre-done-work/CONTEXT.md` | preserve | ok. The path exists and the retained root survives. The bare `plan.md` beside it also exists in HEAD. |
| 07722 | 67, `docs/history/iron-law-gate-human-ux/CONTEXT.md` | preserve | ok. Retained path, `per 0032` provenance. |
| 07723 | 67, `docs/history/<id>/iron-law-evidence.md` | preserve | ok. It is an illustrative placeholder under the retained `docs/history` root. The target doc line 68 uses the same convention. |
| 07724 | 67, `docs/explanation/iron-law-evidence-contract-stays-human-gated.md` | patch with anchor | ok. See the verification below. |
| 07725 | 68, `docs/explanation/gate-bypass-design.md` | parked, description-rewrite | defensible. See the Lead question below. |
| 07726 | 68, `docs/history/iron-law-gate-human-ux/CONTEXT.md` | preserve | ok. |
| 07727 | 72, `docs/operator-runbook-herdr-cockpit.md` | preserve | ok. It exists at the pin and HEAD, the switchboard lists it as legacy-current maintained-authority, and no alias retires it (L12-26(3)). |
| 07728 | 72, ADR-011 (`docs/architect/agent-coordination/...`) | patch to `docs/platform/agent-coordination/decisions/ADR-011-...md` | ok. See the verification below. |
| 07729 | 72, `docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md` | preserve | ok. The sentence is "Lý do re-scope + evidence" for the dated 2026-09-06 change, so ruling (c) preserves it. The successor note is present and the successor exists at HEAD. |
| 07730 | 94, `docs/history/capacity-cross-provider-governance/CONTEXT.md` | preserve | ok. The retained path exists, and `plan.md` exists. |
| 07731 | 99, `docs/specs/confinement-authority.md` §13.1 | parked, step5-parity | ok. See the verification below. |
| 07732 | 110, `docs/reference/forgentx-tool-registry-configuration.md` | patch with anchor | ok. This is one of the three advisory locator flags. See the verification below. |
| 07733 | 166, `docs/specs/confinement-authority.md` | preserve | ok, with a Lead question below. |
| L23C302 | 23, `runner.md` | preserve | ok. It sits inside the "Added in candidate" note about verbatim `runner.md:<line>` carriage, so it is a conservation note and not navigation. |

### Verifications

- **07719.**
  - The file is a "Added in candidate: Runner Business Rules" candidate with a metadata block. It has no "Source Carriage" H1 and no explicit source-body start marker, so Lead ruling (b) and the 07786 boundary do not apply.
  - L12-26 names this file as a valid exact target.
  - Under L12-26(8) the `Related` list is live navigation and is patched. The patched target is the parent area spec, not the consumer, and it is not already an entry in the list.
  - The patch is consistent with the other batch-115 runner subcomponents (07708, 07710, 07717, 07735, 07737, 07739, 07741).
- **07724.**
  - The anchor `why-evidence-only-not-gather-evidence-and-if-it-looks-good-merge` is the slug of the target heading at line 33, "Why evidence-only, not "gather evidence and if it looks good, merge"".
  - Target lines 45-48 state that the safety claim needs a second, independent party actually looking at it. That is exactly the cited condition, "Bên thứ hai độc lập thật sự nhìn vào bằng chứng vẫn là điều kiện".
  - The record correctly excludes the target's older "human must type" sentence, which RUL37 supersedes locally.
- **07728.**
  - Only `architect` becomes `platform`. The trailing `.` is untouched.
  - The target ADR-011 exists and states the claims the paragraph attributes to it: the result file wins over transport status, herdr is transport and failure detector, `unknown` never becomes absent, and pane close is not cancel.
- **07731.**
  - The target `docs/platform/agent-confinement/spec.md` contains no §13.1 section and no `confined-pane-accounts`. The only §13.1 mention at line 602 is itself a dangling pointer.
  - The provisioning content moved to `history/`. Parking for the full carry is correct, and a citation-only redirect to a historical appendix is not acceptable.
- **07732.**
  - The anchor `the-curated-runnercapabilities-catalog-d4d14-tsk-in1-3` is the slug of the target heading at line 48, "The curated `runner.capabilities` catalog (D4/D14, tsk-in1-3)".
  - The section defines catalog entries with `{description?, aliases?}`, enforces `capability` and `for` against the catalog, and rejects undeclared names. That is the claim cited.
  - The target path is the real renamed holder.
- **Counts and defaults.** I found no named counts, defaults, ports or verb lists that the patched text changes. Every change is a path token or anchor.

### Outcome defects

None.

### Record-text notes (not rework)

- 07725 `reason`/`blockedReason` says RUL64 "attributes an explicit never-touch-Iron-Law config boundary" to gate-bypass-design.md. The source sentence actually attributes only "the floor of `gateBypass` is written down as never touching the Iron Law" to that doc, and RUL64 draws its own conclusion from it. The park still stands, because the target's D4 floor section says the floor reuses `HEAVY_KEYWORDS` and does not state the ironLaw/gateBypass prohibition. The wording of the reason slightly overstates the source claim.
- 07733 `reason` says the "first clause is expressly ĐÃ BỊ THAY by RUL90/0062". The supersession bracket covers the "each door carries one posture lane" part. The parenthetical being cited ("a direct executor call must carry a capability anchor and never infer the minimum from `executor.for`") belongs to the clause the bracket says still stands. The preserve rests better on "already said", a dated past-tense statement (L12-35(3), L12-51(3)). The successor note names `docs/platform/agent-confinement/spec.md`, but the text is held in `contracts/confinement-authority-v1.md` lines 148-149.

### Lead-judgment questions

1. **07733, preserve or patch.** The parenthetical says `docs/specs/confinement-authority.md` "already said" X.
   - Preserve (author): past-tense, dated rationale inside RUL77 (L12-35(3)).
   - Patch: the claim is held verbatim at `docs/platform/agent-confinement/contracts/confinement-authority-v1.md` lines 148-149, and L12-26(1) itself names that file and line as the example holder of this very claim.
   - If the Lead treats it as present-tense navigation, 07733 is rework. I found it defensible as preserve, so I did not count it as a defect.
2. **07725, park or patch.** An alternative is a patch to the gate-bypass knowledge doc at `#why-the-floor-d4-never-bends`, if the Lead reads "floor never touches Iron Law" as supported by D4's "leave the existing hard-gate floor untouched". The park is the conservative outcome and was kept.
3. **Pathless "spec Work-State ..." locators.** The source has about a dozen of them, at lines 40, 41, 43, 44, 45, 50, 57, 64, 74, 87, 92 and 157, with section titles and Data Dictionary numbers but no path. They are not inventory edges and were not dispositioned. Under L12-38 coverage applies only to link targets and explicit legacy-root paths, so I did not count them as defects. The Lead may want them listed for Step 5.

Bare decision numbers (ADR0013, ADR0020, ADR-007, 0032, 0062) are not edges (L12-49). `plans/260916-account-rotator/design.md` (line 133, never existed) is a dated evidence citation, and `plans/**`, `core/**` and `AGENTS.md` all survive.

## Counts

| Set | Stratum | Files reviewed | Edges reviewed | Rework (files) |
|---|---|---|---|---|
| batch-115 | mandatory-threshold | 1 | 17 | 0 |

Part p07 total: 1 file, 17 edges, 0 rework.
