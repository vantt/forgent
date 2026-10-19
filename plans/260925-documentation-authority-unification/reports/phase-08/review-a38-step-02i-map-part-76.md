# Review A38 — step-02i mapping, part 76 (overlay-precedence-controls, 17 entries)

- Reviewer: reviewer:sonnet-session:a1417050f56ba8655@2026-10-19
- Commits: author `904d0fb5c`, accounting `74e3ecf1e` (worktree `/home/vantt/projects/forgentX-s8-review`, HEAD verified `74e3ecf1e`)
- Part: 76, sourceTable `step-02i-review-data.json` (`overlayControls`, controls `overlay-001..017`), index `step-02i-mapping-review-index.json`
- Method: for each control I loaded the base row (table named by `baseKey`), the overlay row (`step-02c-slice1-corrections.json` or `step-02d-slice2-corrections.json`, by `rowId`) and the control's `effectiveRow`, diffed all fields, and re-ran the parser's merge rule independently (`replacesFields` first, then keys absent from the base, plus `supersedes`/`decision`/`replacesFields` metadata). I also checked the base-row hash against `supersedes.originalRowSha256`, the overlay hash against `overlaySha256`, and the effective hash against `effectiveSha256` (canonical JSON, sorted keys). Consumer file digests, line text and matched expressions were checked against the committed tree; target anchors with `node scripts/list-doc-anchors.mjs --check`; decisions against L12-19 and L12-20.

## Totals

ok 16 | rework 0 | needs-Lead-judgment 1 (17 total).

- needs-Lead-judgment: `overlay-002`

## Precedence result

Every one of the 17 controls has a single-element chain: no `baseKey` in this part is touched by a second overlay (checked across all 197 controls), so chronological precedence reduces to "the one overlay wins on its `replacesFields`". Chronology is correct: 02c corrections (commit `52941b015`, 11:48) cover overlay-001..005 and 02d corrections (also in `52941b015`, final bytes in `e064f8bd5`) cover overlay-006..017; the wrapped-citation rescan table contributes no control here. The independent merge reproduces the committed effective row byte for byte for all 17, and all three hashes (base, overlay, effective) match.

For the five partial overlays (001-005) the merge correctly leaves unlisted base fields alone, for example `preCutoverAction` stays the base value on 001, 002, 004, 005 and is replaced on 003 (where it is listed). `semanticReview` is listed in `replacesFields` on 003-005 but absent from the overlay row, so the base value "pending; bucket is lexical triage, never approval" stays; this is harmless and correct (no approval is implied).

## Per-entry verdicts

| Control | Base row | Consumer:line | Decision checked | Effective row result | Verdict |
|---|---|---|---|---|---|
| overlay-001 | cli-005 | bin/fgos.mjs:3515 | L12-19 rework: re-anchor to the multi-session checkout section (~line 649-659) | Patch target now `docs/platform/runner/operations/h-51f5cd7279fd.md#phiên-checkout-đa-phiên-session-start-end-list-gc`; anchor check ok; passage lines 649-662 state that `approve` from a session worktree is refused as structurally wrong while `return` keeps its own `aheadCount` + `verify`, which is the quoted clause. Previous session-nesting anchor correctly superseded. Digest of target and consumer match. No behavior claim. | ok |
| overlay-002 | setup-001 | src/setup/git-hooks.mjs:85 | L12-19: find a verified target stating the dependency-install no-op, else park with a missing-target note | Parked: `cutoverPatch`, `desiredOwner`, `desiredAnchor` null, `parkedReason` set. My own search of `docs/specs/distribution.md` and `docs/platform/packaging-distribution/**` found no passage stating the no-`.git` dependency no-op (no `hooksPath` or `githooks` hit at all), so parking is right and the rejected generic section 4 target is correctly recorded. One consistency issue: `cutoverAction` stays `exact-cutover-patch` although there is no patch, and the row has no `status: blocked` marker, unlike every other parked row in this part (instructions/skills rows keep `cutover-patch-only` but carry a `candidateSuggestion` plus `status: blocked`). A Phase 9 consumer filtering on action alone would pick up a patch row with a null patch. Decision is right; the action vocabulary needs a Lead call (rename to a parked action, add `status: blocked`, or accept as written). | needs-Lead-judgment |
| overlay-003 | evidence-195 | scripts/check-legacy-docs-ratchet.baseline.json | L12-19 rework: frozen gate data, preserve bytes, rows retire with the ratchet at Phase 9 (L12-9), never mirror navigation | `cutoverAction` and `preCutoverAction` replaced with exactly that text, `lexicalBucket` and `edgeKind` set to frozen-gate-data, base occurrences and seed lines kept. Digest of the baseline file matches HEAD. | ok |
| overlay-004 | evidence-181 | docs/platform/agent-coordination/playbooks/coordination-operating-harness.md | L12-19 Lead judgment: behavioral consumer, Step 5, lockstep patch of write destination and `test -s` checks, historical-preserve only if Step 5 proves retired-only | `lexicalBucket` behavioral-consumer-Step-5, `step5Mandatory` true, `writeDestination` the verification tree, `parkedReason` records the retired-only fallback with evidence required. Source evidence verified at HEAD: "Create:" layout at lines 120-128, proof path convention at 418-422, `test -s` lines 474-475; file digest matches. | ok |
| overlay-005 | evidence-182 | docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md | same | Same treatment; source evidence "PERSISTENT STATE / Use:" at lines 155-165 verified, digest matches. Note: the file has no `test -s` check, so the shared action text "and test -s checks" over-describes this row (wording only). | ok |
| overlay-006 | instructions-007 | AGENTS.md:14 | L12-20: live reference to retiring path; parked rows carry candidate suggestion only, status blocked | Action `cutover-patch-only`, `status: blocked`, patch reduced to `candidateSuggestion` (reading-map, follow the area owner), generic `docs/specs/<area>.md` not path-substituted. Line text, matched expression and AGENTS.md digest verified. | ok |
| overlay-007 | instructions-008 | AGENTS.md:17 | L12-20: D-ADR0030 owner is `docs/platform/runner/decisions/h-36d872fbb0e5.md` | `desiredOwner` corrected from `docs/platform/runner/spec.md` to that file (exists at HEAD, section `### 0030` at line 921); parked with Step 3 approving the exact fragment. | ok |
| overlay-008 | instructions-009 | AGENTS.md:27 | same | Same correction at the line-27 edge ("Lịch sử quyết định § D-ADR0030"). | ok |
| overlay-009 | instructions-010 | AGENTS.md:29 | L12-20: decision-history owners need Step 3/A47 | D-ADR0035 reference parked, no correspondence claimed; no D-ADR0035 narrative exists in `docs/platform/platform-foundations.md` at HEAD. | ok |
| overlay-010 | instructions-011 | AGENTS.md:35 | same | Same as 009 (mission-boundary line). | ok |
| overlay-011 | instructions-013 | AGENTS.md:40 | L12-20 (generic `docs/specs/` scope, needs whole-sentence patch) | Parked, blocked, candidate only. Added edge for a bare tree mention is parked rather than path-substituted, consistent with L12-24. | ok |
| overlay-012 | instructions-018 | AGENTS.md:71 | L12-20 (L12-20 names line 70; the file line is 71, text verified) | Parked, blocked, candidate only. | ok |
| overlay-013 | instructions-023 | AGENTS.md:139 | L12-20 (D-ADR0054) | Parked; no D-ADR0054 text anywhere under `docs/platform` or `docs/specs`, so Step 3 parking is right. | ok |
| overlay-014 | instructions-024 | AGENTS.md:151 | L12-20 (D-ADR0062) | Parked; same absence of D-ADR0062. | ok |
| overlay-015 | skills-001 | .agents/skills/_shared/citation-format.md:7 | L12-20: no executable `new` on parked rows; shipped external-project citation conventions unchanged (L12-10) | Patch downgraded to `candidateSuggestion`, `status: blocked`, patch path is the source `core/skills/_shared/citation-format.md` (exists), render is regenerated by `npm run build:skills`, never hand-edited. | ok |
| overlay-016 | skills-009 | .agents/skills/_shared/citation-format.md:97 | same | Same. Wording note: the candidate `docs/platform/**/spec.md` is a universal glob while `parkedReason` says no universal substitution is approved; it is non-executable and blocked, so wording only. | ok |
| overlay-017 | skills-015 | .agents/skills/fgos-clarifying/SKILL.md:91 | L12-20: parked on Step 3 semantic check | Candidate `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#unheaded-block-6` (anchor check ok, file digest matches, RUL45 starts at line 78 of that block); patch path is `core/skills/fgos-clarifying/SKILL.md` (exists); blocked, RUL45 wording explicitly not silently corrected. | ok |

## Rework defect classes

None.

## Judgment items

1. `overlay-002`: effective row keeps `exact-cutover-patch` with a null patch and no `status: blocked`; confirm the parked-row action vocabulary before Phase 9 filters rows by action. The underlying park decision is verified correct.
