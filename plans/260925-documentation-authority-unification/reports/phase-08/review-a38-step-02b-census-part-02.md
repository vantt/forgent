# Review a38 Step 02b census part 02

- Reviewer: reviewer:sonnet-session:a81d632929562c17f@2026-10-19
- Worktree: /home/vantt/projects/forgentX-s8-review, HEAD c801778ac48e78dae45b67a58b7484e87bfcd4a5 (verified; author 8606433d6, accounting c801778ac)
- Part: step-02b-review-part-02.json, sha256 b0cd4f325c21ab9f872d3078dc35949dab1238ce1ae2e9f19c9d621741b4c43b, 60 entries (29 instructions, 31 skills-prompts)
- Totals: ok 59, rework 0, needs-Lead-judgment 1 (skills-031)

## Method and findings

Mechanical, all 60: file digest, call-site line, matched-expression column slice, context lines and switchboard digest match for every entry (scripted, zero mismatches). All 31 skills rows are .agents/skills renders whose bytes equal their named source (core/skills/... or domains/coding/skills/...) after removing the generated header; none was edited. Source paths in every row are the right source.

Instructions rows 059-087 (src/setup/instruction-registry.mjs, instruction-composition.mjs, instruction-projections.mjs): code read directly. Manifest read is docs/architecture-manifest.json (not docs/architect); discovery roots are core/instructions, components/*/instructions, domains/*/instructions with realpath containment, no docs/specs fallback; composition builds .fgos/instructions/effective/<key>.json purely; writers (067-070) are the destination default AGENTS.md, effective-set, managed-block splice and ledger writeIfChanged, all behind safeRelativePath plus assertNoSymlinkPath; inspection rows (071-074) are read-only. Writer/reader roles and destinations are correct, none is an alias. L12-7: no docs/specs or docs/architect consumer here, all preserve is right. L12-10: shipped writer conventions untouched. Minor wording only: 082 matches path.resolve(containmentRoot) described as joining entry names (realpath fallback); 067 is a default constant labelled file-write.

Skills rows: citation-format (001-009) matches source; 002/006 and 017/019-023/025-030 are external-project docs/history conventions, correctly kept unchanged (L12-10) with writer, gate-reader and metadata roles separated; 003-005, 007, 008, 010-014, 018, 024 are historical or stable references, all desired-owner targets exist (docs/platform/documentation/history/id-systems-audit.md, docs/history/* files, docs/backlog.md). Cutover patches 001, 009, 015, 016: `old` strings exist in source and render; rendered files are regenerated, not hand-edited, per row timing.

## Per-entry verdicts

| Entry | Consumer | Line | Role | Verdict | Depth | Note |
|---|---|---|---|---|---|---|
| instructions-059 | src/setup/instruction-registry.mjs | 458 | file-read | ok | deep |  |
| instructions-060 | src/setup/instruction-registry.mjs | 598 | path-construction | ok | deep |  |
| instructions-061 | src/setup/instruction-registry.mjs | 599 | path-construction | ok | mech |  |
| instructions-062 | src/setup/instruction-registry.mjs | 600 | path-construction | ok | mech |  |
| instructions-063 | src/setup/instruction-registry.mjs | 624 | file-read | ok | deep |  |
| instructions-064 | src/setup/instruction-registry.mjs | 660 | file-read | ok | mech |  |
| instructions-065 | src/setup/instruction-registry.mjs | 698 | file-read | ok | mech |  |
| instructions-066 | src/setup/instruction-composition.mjs | 125 | path-construction | ok | deep |  |
| instructions-067 | src/setup/instruction-projections.mjs | 247 | file-write | ok | deep |  |
| instructions-068 | src/setup/instruction-projections.mjs | 347 | file-write | ok | deep |  |
| instructions-069 | src/setup/instruction-projections.mjs | 351 | file-write | ok | deep |  |
| instructions-070 | src/setup/instruction-projections.mjs | 355 | file-write | ok | deep |  |
| instructions-071 | src/setup/instruction-projections.mjs | 294 | file-read | ok | deep |  |
| instructions-072 | src/setup/instruction-projections.mjs | 302 | file-read | ok | deep |  |
| instructions-073 | src/setup/instruction-projections.mjs | 311 | file-read | ok | deep |  |
| instructions-074 | src/setup/instruction-projections.mjs | 353 | file-read | ok | mech |  |
| instructions-075 | src/setup/instruction-projections.mjs | 280 | path-construction | ok | deep |  |
| instructions-076 | src/setup/instruction-projections.mjs | 331 | path-construction | ok | mech |  |
| instructions-077 | src/setup/instruction-projections.mjs | 281 | path-construction | ok | mech |  |
| instructions-078 | src/setup/instruction-projections.mjs | 332 | path-construction | ok | mech |  |
| instructions-079 | src/setup/instruction-projections.mjs | 282 | path-construction | ok | mech |  |
| instructions-080 | src/setup/instruction-projections.mjs | 333 | path-construction | ok | mech |  |
| instructions-081 | src/setup/instruction-projections.mjs | 60 | path-construction | ok | deep |  |
| instructions-082 | src/setup/instruction-registry.mjs | 412 | path-construction | ok | deep |  |
| instructions-083 | src/setup/instruction-registry.mjs | 418 | path-construction | ok | deep |  |
| instructions-084 | src/setup/instruction-registry.mjs | 649 | path-construction | ok | mech |  |
| instructions-085 | src/setup/instruction-registry.mjs | 655 | path-construction | ok | mech |  |
| instructions-086 | src/setup/instruction-registry.mjs | 687 | path-construction | ok | mech |  |
| instructions-087 | src/setup/instruction-registry.mjs | 693 | path-construction | ok | deep |  |
| skills-001 | .agents/skills/_shared/citation-format.md | 7 | instruction-or-citation | ok | deep | Source line contains old text; render identical to source minus header. Patch is explicitly Phase 9 gated on Step 3 plus checker/default-root parity and portable-convention preservation. Note: concrete `new` text coexists with the park reason "no universal substitution approved"; the gating is explicit, so wording only. |
| skills-002 | .agents/skills/_shared/citation-format.md | 8 | citation-scope-definition | ok | deep |  |
| skills-003 | .agents/skills/_shared/citation-format.md | 11 | instruction-or-citation | ok | deep |  |
| skills-004 | .agents/skills/_shared/citation-format.md | 35 | instruction-or-citation | ok | deep |  |
| skills-005 | .agents/skills/_shared/citation-format.md | 52 | instruction-or-citation | ok | mech |  |
| skills-006 | .agents/skills/_shared/citation-format.md | 54 | citation-scope-definition | ok | mech |  |
| skills-007 | .agents/skills/_shared/citation-format.md | 93 | instruction-or-citation | ok | mech |  |
| skills-008 | .agents/skills/_shared/citation-format.md | 97 | instruction-or-citation | ok | deep |  |
| skills-009 | .agents/skills/_shared/citation-format.md | 97 | instruction-or-citation | ok | deep | Patch old text exists in source and render. check-decision-citation-drift.mjs still defaults to docs/specs (line 428), so the `new` text must not land before checker parity; row timing states this. Wording only. |
| skills-010 | .agents/skills/_shared/coding-worker-contract.md | 4 | instruction-or-citation | ok | deep |  |
| skills-011 | .agents/skills/_shared/coding-worker-contract.md | 160 | instruction-or-citation | ok | mech |  |
| skills-012 | .agents/skills/_shared/coding-worker-contract.md | 173 | instruction-or-citation | ok | mech |  |
| skills-013 | .agents/skills/_shared/coding-worker-contract.md | 185 | instruction-or-citation | ok | mech |  |
| skills-014 | .agents/skills/_shared/coding-worker-contract.md | 189 | instruction-or-citation | ok | mech |  |
| skills-015 | .agents/skills/fgos-clarifying/SKILL.md | 91 | instruction-or-citation | ok | deep | Source line holds old text `docs/specs/runner.md`; target anchor unheaded-block-6 exists and spans lines 71-78 which contain RUL45; semantic correspondence parked for Step 3. |
| skills-016 | .agents/skills/fgos-coding-discovering/SKILL.md | 81 | instruction-or-citation | ok | deep | Same as skills-015 (domains/coding source, Vietnamese gloss of RUL45 untrusted input). |
| skills-017 | .agents/skills/fgos-coding-discovering/SKILL.md | 105 | feature-artifact-reader | ok | mech |  |
| skills-018 | .agents/skills/fgos-coding-discovering/SKILL.md | 127 | instruction-or-citation | ok | mech |  |
| skills-019 | .agents/skills/fgos-coding-discovering/SKILL.md | 134 | feature-file-writer-contract | ok | deep |  |
| skills-020 | .agents/skills/fgos-coding-exploring/SKILL.md | 16 | feature-file-writer-contract | ok | deep |  |
| skills-021 | .agents/skills/fgos-coding-exploring/SKILL.md | 106 | feature-file-writer-contract | ok | mech |  |
| skills-022 | .agents/skills/fgos-coding-exploring/SKILL.md | 132 | gate-artifact-reader | ok | deep |  |
| skills-023 | .agents/skills/fgos-coding-exploring/references/gate-mechanics.md | 13 | gate-artifact-reader | ok | mech |  |
| skills-024 | .agents/skills/fgos-coding-exploring/references/gate-mechanics.md | 57 | instruction-or-citation | ok | deep | Citation sits inside a runtime-emitted `fgos decision --rationale` string; history path stays literal per L12-10; no writer destination. |
| skills-025 | .agents/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md | 111 | feature-file-writer-contract | ok | mech |  |
| skills-026 | .agents/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md | 173 | metadata-reference (docsRef/refs), | ok | deep | `--docs-ref` flag value is metadata, not a content write; correctly distinguished from writer rows. |
| skills-027 | .agents/skills/fgos-coding-implement/SKILL.md | 72 | feature-file-writer-contract | ok | mech |  |
| skills-028 | .agents/skills/fgos-coding-implement/SKILL.md | 144 | feature-file-writer-contract | ok | deep |  |
| skills-029 | .agents/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md | 66 | feature-file-writer-contract | ok | deep |  |
| skills-030 | .agents/skills/fgos-coding-implement/references/worker-contract-and-orient.md | 7 | feature-artifact-reader | ok | mech |  |
| skills-031 | .agents/skills/fgos-coding-knowledge/SKILL.md | 45 | instruction-or-citation | needs-Lead-judgment | deep | Cites docs/architect/knowledge-registry-redesign.md (a retiring legacy root) as preserve/preserve with no cutover patch. L12-7 says exact rewrites of legacy-root references go to the cutover packet; row follows the prior slice (setup-018..020, cli-001/003 also preserve) but the target path exists only as a non-canonical conservation carrier (docs/platform/proposals/..., Canonical: No). Lead must decide: historical-citation preserve vs. cutover patch to the carrier; apply the same to skills-105/164 and prior-slice rows. |

## Deep-read list (33 entries, covering every writer, gate-reader, metadata, projection-writer, cutover-patch and source-vs-render mapping row)
instructions-059, instructions-060, instructions-063, instructions-066, instructions-067, instructions-068, instructions-069, instructions-070, instructions-071, instructions-072, instructions-073, instructions-075, instructions-081, instructions-082, instructions-083, instructions-087, skills-001, skills-002, skills-003, skills-004, skills-008, skills-009, skills-010, skills-015, skills-016, skills-019, skills-020, skills-022, skills-024, skills-026, skills-028, skills-029, skills-031

Also deep-read: scripts/list-doc-anchors.mjs listAnchors (unheaded-block-6 = lines 71-78 of h-6979005beaf7/spec.md, contains RUL45), owner-answers.md L12-7/L12-10.

## Totals
ok {ok}; rework 0; needs-Lead-judgment {nl}: skills-031.
