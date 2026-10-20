# Review a38 - Step 4 wave 1 part 07 (set step04-007)

Pin: author input ef62747dd. Reviewer read-only; no checker, probe, resolver or author script run. Strata: `plan.md` is the large file (256,055 bytes / 3660 lines; presumably the size-mandatory one); the I27 report is the unpatched sample. No patch, no render path, no sourceRenderProvenance.

Reading method for `plan.md`: not read line by line. I took the heading outline (93 headings) and a full-file scan for every legacy-root form (`docs/specs`, `docs/architect`, bare `specs/`/`architect/`, `agent-coordination/verification`, `reading-map`, `docs/decisions`, and wrapped paths ending a line with `coordination/` or `architect/`). I read the edge region (L2318-2335) and the regions of the other hits (L3005-3040, L2279-2284, L3199-3204). The I27 report (261 lines) was read whole.

## Per file

1. `archive/plans/260919-coordination-skill-harness-simplification/plan.md` - verdict **ok**. 1 slot.
   - evidence-114 L2328: `use \`docs/platform/agent-coordination/verification/architecture-advisory-panel/P05.2.md\`'s two real herdr-gateway cases`, inside a unit decision "CHANGED 2026-09-28 per review MEDIUM-4". Preserve is correct. The matched expression (cols 42-74) is only the substring `agent-coordination/verification/` of a path that already uses `docs/platform/`, and the target exists at the pin. It is a lexical false positive on a non-legacy path in a dated decision of an archived plan; no patch could improve it.
   - Other `verification` hits (L3007, L3037, L3061: `**/verification/**` exemption globs) are not path references to the retiring tree; no edge needed.
2. `archive/plans/260919-coordination-skill-harness-simplification/reports/unit-I27-panel-depth-experiment-real-comparison-report.md` - verdict **ok**. 1 slot.
   - evidence-115 L43: `- **Core cases** (P05.2 clear + unclear, \`docs/platform/agent-coordination/verification/architecture-advisory-panel/P05.2.md\`):`. Preserve is correct, same reason: already the `docs/platform` path (exists at pin), dated complete report, lexical false positive on the substring. No other legacy-root form in the file.

## Defects

OUTCOME defects: **none**.

## Record-text notes (not rework)

- Both reasons say "tree retires at Phase 9 where the cited path is under specs/architect". Here the cited path is under `docs/platform` and does not retire, so that boilerplate sentence is inaccurate. Disposition and target are right; the reason should say "substring of a docs/platform path (target exists at the pin); not a legacy-root reference; preserved as dated history".
- `plan.md` contains many legacy-root paths with no slot: `docs/architect/agent-coordination/contracts/flow-definition.md` (L1008, L1837, L1884), `docs/specs/runner.md` (L1332, L2211, L3012), `docs/specs/reading-map.md` (L3012), `docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md` (L2210-2211, L3026), `docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md` (L2281-2282, wrapped), L2395 and L2432 (`docs/architect/...` "legacy copy"), L3005, L3186 and `docs/decisions/` (L3420). They are archived-plan history (dated unit text; L2395 itself calls the path "a legacy" copy), outside the verification-pattern evidence inventory, and covered by the archive/plans exclusion (L12-29). All would preserve; none is a missed patch.

## Lead-judgment questions

- Same as p06: confirm the archive/plans exclusion (L12-29) covers these unslotted legacy-root paths in archived plans (plan.md has about 20), so no authorAddedEdge is expected for Step 4.

## Counts

Set step04-007: 2 files reviewed (1 large/mandatory, 1 unpatched sample), 0 rework; 2 slots reviewed (2 preserve, 0 patch, 0 park). Mandatory stratum 1 reviewed / 0 rework; unpatched stratum 1 reviewed / 0 rework.

Status: DONE
Summary: Both slots are correct preserves; the two hits are substring matches inside docs/platform paths that already exist at the pin. Plan.md was reviewed by outline, a full legacy-form scan and the edge regions, not line by line.
