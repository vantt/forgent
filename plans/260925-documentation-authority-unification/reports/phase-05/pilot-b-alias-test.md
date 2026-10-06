# Pilot B Alias Test: Work State Area

Candidate alias table for the two pilot sources, resolver run against it, and a sample of historical references. Table: [alias-table.pilot-b.json](../../pilot/alias-table.pilot-b.json). The live [alias-table.json](../../alias-table.json) is untouched and stays empty.

## 1. Method

- Entries built from the frozen [pilot-b-target-map.md](pilot-b-target-map.md) section 4: one `split` entry per H2 of `docs/specs/work-state.md` (10), the old anchor taken from the inventory conservation-unit anchors (`scripts/generate-doc-inventory.mjs`, same extractor the resolver uses), the target taken from the heading the map assigns to that H2's own heading unit.
- Validation: `node scripts/doc-alias-resolver.mjs --table plans/260925-documentation-authority-unification/pilot/alias-table.pilot-b.json`. The resolver CLI always passes the repo root (cwd) and the default constitution, so owner existence, `toAnchor` existence and placement are checked.
- Resolution: `--resolve <ref> --json` for each of the 12 old refs and each of 20 sampled historical references.
- Reference source: the scratch inventory (`consumerEdges`, 780 edges to the two sources). Consumer edges carry only `path`, `line`, `targetPath`, `kind`, `resolvedTarget`, so the reference as written was read back from the consumer file at that line. Immutable consumers: paths under `plans/`, `archive/`, `docs/history/`, `docs/decisions/`, kind `literal`; `plans/260925-documentation-authority-unification/` itself is excluded as live work, leaving 185 candidate edges (140 bare path, 45 with a line number, 0 with an anchor).
- `immutableRefEdges` hold commit-id strings, not references to the old paths, so they cannot serve as the commit/decision-id stratum. Classification used instead: the consumer line also carries a decision or commit id (`D-ADR####`, `ADR ####`, `tsk-*`, `STR##`, hex sha). 16 of 185 qualify; 5 taken.
- Anchor stratum is empty: no immutable consumer writes `work-state.md#...` or `io-contract.md#...` (grep over plans, archive, docs/history, docs/decisions). Five bare-path references fill it, marked "filler". Several consumers cite a section by name beside the bare path (for example `§"sổ verb"`, `RUL10`), never as an anchor.

## 2. The 12 entries

| # | Old reference | Kind | Owner and anchor | Resolves |
|---|---|---|---|---|
| 1 | `docs/specs/work-state.md#entry-points-triggers` | split | `spec.md#2-entry-points-and-triggers` | resolved |
| 2 | `docs/specs/work-state.md#data-dictionary` | split | `spec.md#3-work-item-data-dictionary` | resolved |
| 3 | `docs/specs/work-state.md#behaviors-operations` | split | `spec.md#9-behaviors-and-operations` | resolved |
| 4 | `docs/specs/work-state.md#actors-access` | split | `spec.md#10-actors-and-access` | resolved |
| 5 | `docs/specs/work-state.md#business-rules` | split | `spec.md#11-business-rules` | resolved |
| 6 | `docs/specs/work-state.md#edge-cases-settled` | split | `spec.md#12-edge-cases-settled` | resolved |
| 7 | `docs/specs/work-state.md#open-gaps` | split | `spec.md#13-known-gaps-and-deferred-work` | resolved |
| 8 | `docs/specs/work-state.md#visuals` | split | `spec.md#14-presentation-surface` | resolved |
| 9 | `docs/specs/work-state.md#pointers-implementation` | split | `architecture/implementation-pointers.md#2-implementation-pointers` | resolved |
| 10 | `docs/specs/work-state.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4` | split | `decisions/retired-decision-history.md#1-provenance-of-retired-decisions` | resolved |
| 11 | `docs/specs/work-state.md` | redirected | `README.md` | resolved |
| 12 | `docs/io-contract.md` | moved | `contracts/cli-io-contract.md` | resolved |

Resolver exit code for validation: 0 ("alias table is valid (12 entries)"). Resolved 12 of 12.

`immutableRefs` in the table list the `consumer:line` of the resolved sampled references that rely on each alias.

## 3. The 20 sampled historical references

| # | Stratum | Consumer | Reference as written | Result | Owner landed on | Cause when unresolved |
|---|---|---|---|---|---|---|
| 1 | bare | `archive/plans/260920-2217-dispatch-engine-hardening/phase-08-operability-cli-doctor.md:41` | `docs/io-contract.md` | resolved | `contracts/cli-io-contract.md` |  |
| 2 | bare | `plans/261006-1415-fgos-convention-component/phase-00-spec.md:30` | `docs/io-contract.md` | resolved | `contracts/cli-io-contract.md` |  |
| 3 | bare | `plans/261006-1415-fgos-convention-component/phase-00-spec.md:9` | `../../docs/io-contract.md` | unresolved | none | relative link: the resolver takes only repo-relative paths, so `../../docs/io-contract.md` as written misses; normalized against the consumer to `docs/io-contract.md` it would resolve (contract section 3) |
| 4 | bare | `docs/history/align-work-state-runner-specs-runtime-claim-overlay/plan.md:25` | `docs/specs/work-state.md` | resolved | `README.md` |  |
| 5 | bare | `docs/history/cli-data-work-field-shape-ambiguity/CONTEXT.md:63` | `docs/specs/work-state.md` | resolved | `README.md` |  |
| 6 | line | `docs/history/fgos-list-triage-open-only-default/CONTEXT.md:30` | `docs/io-contract.md:101-115` | unresolved | none | line-number form unsupported: the reference `path:line` is not `path` or `path#anchor`, exact match finds no alias (a line number also has no stable target in the new documents) |
| 7 | line | `docs/history/align-work-state-runner-specs-runtime-claim-overlay/RESEARCH.md:12` | `docs/specs/work-state.md:527` | unresolved | none | line-number form unsupported: the reference `path:line` is not `path` or `path#anchor`, exact match finds no alias (a line number also has no stable target in the new documents) |
| 8 | line | `docs/history/discover-verb-context-blind-clarify-judge/CONTEXT.md:121` | `docs/specs/work-state.md:1054` | unresolved | none | line-number form unsupported: the reference `path:line` is not `path` or `path#anchor`, exact match finds no alias (a line number also has no stable target in the new documents) |
| 9 | line | `docs/history/session-claim-liveness/DISCUSSION.md:34` | `docs/specs/work-state.md:459-467` | unresolved | none | line-number form unsupported: the reference `path:line` is not `path` or `path#anchor`, exact match finds no alias (a line number also has no stable target in the new documents) |
| 10 | line | `plans/reports/from-scan-team-to-planning-260729-1614-verify-scope-compound-cadence-merge-tiering-report.md:234` | `docs/specs/work-state.md:44` | unresolved | none | line-number form unsupported: the reference `path:line` is not `path` or `path#anchor`, exact match finds no alias (a line number also has no stable target in the new documents) |
| 11 | commit/decision-id context | `docs/decisions/index.md:42` | `docs/specs/work-state.md` | resolved | `README.md` |  |
| 12 | commit/decision-id context | `docs/decisions/index.md:50` | `docs/specs/work-state.md` | resolved | `README.md` |  |
| 13 | commit/decision-id context | `docs/decisions/index.md:53` | `docs/specs/work-state.md` | resolved | `README.md` |  |
| 14 | commit/decision-id context | `docs/history/herdr-web-dashboard/plan.md:903` | `docs/io-contract.md` | resolved | `contracts/cli-io-contract.md` |  |
| 15 | commit/decision-id context | `plans/reports/audit-round2-260812-1713-tsk-5sr-post-merge-verification-report.md:433` | `docs/specs/work-state.md` | resolved | `README.md` |  |
| 16 | bare (filler) | `docs/history/tsk-1lv-4/iron-law-evidence.md:116` | `docs/io-contract.md` | resolved | `contracts/cli-io-contract.md` |  |
| 17 | bare (filler) | `docs/history/discover-stage-graph-and-skill-layering/FINDINGS.md:535` | `docs/specs/work-state.md` | resolved | `README.md` |  |
| 18 | bare (filler) | `docs/history/project-instability-scan/plan.md:105` | `docs/specs/work-state.md` | resolved | `README.md` |  |
| 19 | bare (filler) | `docs/history/tsk-483-list-side-log-pagination-scoping/CONTEXT.md:18` | `docs/specs/work-state.md` | resolved | `README.md` |  |
| 20 | bare (filler) | `docs/history/fgos-participant-contract/CONTEXT.md:121` | `docs/io-contract.md` | resolved | `contracts/cli-io-contract.md` |  |

Counts: 12 of 12 old refs resolved; 14 of 20 historical references resolved, 6 unresolved (5 line-number form, 1 relative link).

By stratum: bare 4/5 (the miss is the relative link), filler bare 5/5, line-number 0/5, decision/commit-id context 5/5.

## 4. Retirement-check movement

Command: `node scripts/check-doc-retirement.mjs --inventory <scratch inventory> [--alias-table <pilot table>] --json`, default (read-only) mode, baseline run without `--alias-table` for comparison. The committed inventory shards are absent from this worktree, so the scratch inventory was passed; it is older than the working tree, so the run also lists inventory-gate invariant failures (registry commit and count mismatches), which are identical in both runs and exit 1 in both.

Only one check changes between the runs:

| Check | Baseline | With pilot table |
|---|---|---|
| `aliases-cover-immutable-refs` | blocked: 972 of 972 legacy paths that history reads by path have no bare-path alias (0 entries) | blocked: 971 of 972 (12 entries) |

All other checks are identical: 4 pass, 15 blocked, 1 review in both runs. Nothing flips to pass. `links-resolve` and `consumers-rewritten` (3900 consumer edges) stay blocked, unaffected by aliases.

Why only one path moved, not two: the check counts legacy paths under `docs/specs/` and `docs/architect/` only (`LEGACY_ROOTS`), so `docs/specs/work-state.md` is covered by its bare alias and `docs/io-contract.md` is not counted at all. The 10 split entries do not count either (anchored aliases cover only their anchor).

## 5. Findings

1. Line-number references cannot resolve. 45 of 185 immutable references (24 percent) use `path:line`, `path:a-b`; `resolveAlias` matches exact `path` or `path#anchor`, so every one misses. The contract has no form for them. Options: strip a trailing `:N[-M]` and resolve the bare path (lands on the portal), or declare them unresolvable and accept the gap. No line-to-anchor mapping is possible from the table.
2. A bare reference to a split document lands on the portal, so a decision row such as `docs/decisions/index.md:42` (D-ADR0002 -> `docs/specs/work-state.md`) resolves to `README.md`, not to `decisions/retired-decision-history.md#2-adr-0002-flat-work-model`. The alias is correct per contract section 3 but loses the owner precision of the claim. Resolution result counts as "resolved" while pointing at navigation only.
3. An anchored reference with an unknown anchor silently falls back to the bare alias: `docs/specs/work-state.md#nonexistent-anchor` resolves to the portal with exit 0. A typo or retired anchor is indistinguishable from a deliberate bare redirect. This follows contract section 3 but means `--resolve` exit 0 does not prove the anchor was understood.
4. `fromPath` anchors are never validated against the old document (the resolver validates `toAnchor` only), so a mistyped old anchor passes validation.
5. Relative links are not normalized by the CLI (`../../docs/io-contract.md` misses). The contract states the caller must normalize; the CLI offers no `--from <referrer>` option to do it.
6. `check-doc-retirement.mjs` scope: `LEGACY_ROOTS` omits `docs/io-contract.md`, a pilot source, so its alias is invisible to `aliases-cover-immutable-refs`; `docs/decisions/` is also not in the non-authority consumer prefixes, so decision-index rows count as authority consumers in `consumers-rewritten`. The check also has no per-anchor coverage, so 10 split entries add nothing to its measure.
7. The inventory extractor's `githubAnchor` for `## Entry Points & Triggers` is `entry-points-triggers`, while GitHub renders `entry-points--triggers`. No historical reference uses an anchor today, so no impact now; a future anchored reference written in GitHub style for headings containing `&` would not match the split entries.
8. No resolver rule blocked any legitimate entry; the table validates with no data bending.

## 6. Reproduce

```bash
node scripts/doc-alias-resolver.mjs --table plans/260925-documentation-authority-unification/pilot/alias-table.pilot-b.json
node scripts/doc-alias-resolver.mjs --table plans/260925-documentation-authority-unification/pilot/alias-table.pilot-b.json --resolve docs/specs/work-state.md#business-rules
```
