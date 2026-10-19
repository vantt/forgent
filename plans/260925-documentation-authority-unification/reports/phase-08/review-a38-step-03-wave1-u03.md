# Review u03 — Step 3 wave 1, Lead-seeded files without patches

Author pin ae141550c2e022310de7a0efea757580c0b2479f. Read-only review of the records in step-03-records/batch-NNN.jsonl. Each source was read whole from Git at the pin. Targets and successors were checked with git ls-tree, git grep and git log at the pin. I did not run the checker or any probe, and nothing was written to the worktree. Elapsed time was about 25 minutes. All six files have an empty diff, so only dispositions and record text could be wrong.

Totals: 30 edges reviewed across 6 files. Every file is **ok**. No outcome defects. Rework is 0 of 6. Notes below are record-text only.

## Per file

### 1. docs/platform/agent-coordination/history/retired-engine/files/roadmap/team-dispatch-v1/README.md — batch-015 — ok
Edges: 6 (maps-j-06155..06160), 0 author-added. All are preserve.
- 06155, 06156 (lines 17 and 19) are the Related and Superseded-by headers of a Document type History file. They preserve as lineage, and the runner successor note is right.
- 06157 (line 23) is the "see docs/specs/runner.md **CoordinationSession (Lịch sử ...)**" sentence. It preserves as history. The successor note runner/decisions/h-aabefc85f0c9.md exists. It is the candidate decision record titled for exactly that heading.
- 06158 (line 36) is a Provenance line inside the snapshot. The path exists at the pin. The successor note is the file itself.
- 06159, 06160 (lines 73 and 74) are verbatim relative links inside the literal snapshot. They preserve correctly. They happen to resolve to files/contracts/*.md, which exist.
- The step-0N-*.md exclusions on lines 58-64 are true. The sibling history copies exist under files/roadmap/team-dispatch-v1/.
- I grepped specs and architect across the file and found no missed reference.

### 2. docs/user/README.md — batch-032 — ok
Edges: 6 (maps-j-08491..08496), 0 author-added.
- 08491 and 08492 (lines 16 and 17) are Related-header preserves. docs/doc-governance.md and docs/README.md exist and are retained roots. The alias table has no entries, and progress.md:359 records "retain in place".
- 08493..08496 (lines 24-27) are cells in the "Current active path during migration" column of one Diataxis migration row set. The row-flip disposition is correct. A migration-state cell takes precedence. Retained roots (how-to, reference, explanation) stay explicit. No directory is rewritten.
- Facts at the pin:
  - docs/tutorials/ exists with only a .gitkeep.
  - docs/user/tutorials/ does not exist.
  - docs/how-to has 16 entries, docs/reference 7, docs/explanation 137.
- There are no missed references.

### 3. docs/platform/agent-coordination/history/implementation-records/orchestration-vocabulary-map-2026-08-27.md — batch-015 — ok
Edges: 5 (maps-j-05689, 05690 plus 3 author-added), all preserve.
- 05689 (line 9) is a Provenance line.
- 05690 (line 248) is an illustrative contextRefs value in a JSON example inside a History file. The rename claim is true. `git show --name-status -M ba7b62ace` shows R099 from docs/architect/agent-coordination/dispatch-control-plane-redesign.md to .../proposals/dispatch-control-plane-redesign.md.
- The added edge at line 274 (team-communication-protocol-v1.md) preserves. It exists at docs/architect/agent-coordination/proposals/ and has a platform successor note.
- The added edges at lines 1043 and 1044 (doing-coordination-redesign.md, knowledge-registry-redesign.md) preserve. They exist at docs/architect/ and have no platform successor. This is correct and reasonable.
- Every edge is framed by "Document type: History / Design status: Superseded". Preserving is the right role.

### 4. docs/platform/agent-coordination/history/retired-engine/files/README.md — batch-015 — ok
Edges: 5 (maps-j-05766..05770), 0 author-added. All are preserve.
- 05766 and 05767 are headers. 05769 (line 43) is the Related list inside the snapshot.
- 05768 (line 23) is the same CoordinationSession sentence as in file 1, with the same h-aabefc85f0c9 successor.
- 05770 (line 57) is the verbatim relative link `../../specs/runner.md` inside the literal snapshot. It preserves. Here the target "never existed" in the history/ tree, which is true and is not live navigation.

### 5. docs/architect/workspace-topology-roadmap.md — batch-010 — ok
Edges: 4 (maps-j-01231..01233 plus 1 author-added at L108C13), all parked as phase9-carry.
- The parks are justified. The candidate system-architecture/architecture/workspace-topology*.md files are explicit source snapshots ("Canonical for: Nothing until promotion"). The packaging-distribution candidate says the same. A snapshot is not a patch target.
- Alias lookups are empty in both tables.
- Source scan: only lines 3, 8, 9 and 108 name a topology file, and all four are covered.
- Hit counts and carriage/live splits are plausible. 01233 has 3 hits, 0 live.

### 6. docs/generated/README.md — batch-011 — ok
Edges: 4 (maps-j-03978..03981), 0 author-added. All are preserve.
- docs/doc-governance.md, docs/doc-registry.md and docs/decisions/index.md exist at the pin and are retained roots.
- docs/ui-spec/generated/** is a pattern. The root exists and is retained.
- There are no missed legacy references.

## Record-text notes (no change to any disposition, target or diff)
1. **batch-010 workspace-topology-roadmap.md, edges 01231, 01232 and L108C13.** The searchWitness hitGroups category is "partial-holder", with liveCount 2 (the same counts and hash are reused on all three edges). The two live hits are packaging-distribution/README.md:270 and spec.md:441/457. Both are consumers citing the legacy path, not holders of the roadmap claim. "citation-only" is the more truthful enum. The park remains correct either way.
2. **batch-015 orchestration-vocabulary-map line 1040.** The `dispatch-control-plane-redesign.md` basename is excluded as a "local/generated layout basename". It sits in the same bullet list as lines 1043 and 1044, whose basenames are author-added edges. The basename resolves to two legacy files at the pin (docs/architect/dispatch-control-plane-redesign.md and docs/architect/agent-coordination/proposals/...). The result would be preserve either way. For consistency, make it an added edge (preserve), or state why the 1040 line differs. It has no outcome effect.
3. **batch-032 docs/user/README.md edges 08493..08496.** The reason text repeats "The tutorials row is a planned slot, not an existing directory" on all four rows. docs/tutorials/ does exist, with a .gitkeep. Only docs/user/tutorials/ is absent. The text is imprecise and misplaced on the how-to, reference and explanation rows. These edges also carry no targetFacts for the existing retained roots.
4. **batch-011 docs/generated/README.md edge 03978.** The reason says "original spelling identifies the imported source". doc-governance is a retained root, not an imported source. The correct and sufficient ground is "retained root, exists at the pin".

## Lead-judgment questions
- None required. I considered whether the relative sibling links in workspace-topology-roadmap.md (01231, 01232) should preserve as intra-tree self-reference instead of a phase9-carry park. The tree retires at Phase 9, so the carry park, which names the same successor, is safe and consistent with the candidate copy. This is optional for Lead to rule on.

## Per-set counts
| Set | Files reviewed | Rework |
|---|---|---|
| batch-015 | 3 (team-dispatch-v1/README, vocabulary-map, retired-engine files/README) | 0 |
| batch-032 | 1 | 0 |
| batch-010 | 1 | 0 |
| batch-011 | 1 | 0 |

These seeded files lie outside the A51 sample. Their zero rework does not change any set's denominator or numerator.
