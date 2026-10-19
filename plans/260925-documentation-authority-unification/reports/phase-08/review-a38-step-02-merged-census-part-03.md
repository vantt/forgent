# Review a38 step-02 merged census part 03

Reviewer: reviewer:sonnet-session:abd34ee8864a102c3@2026-10-19
Reviewed commit: 0689b862e (accounting); author commit ce84b84e7; request step-02-merged-census-587c2a791
Part: plans/260925-documentation-authority-unification/reports/phase-08/step-02-review-part-03.json
Part sha256: 108d6ec2095467089bb9fdd6fe204dd5aa29474db4411fd97872fd0f0dba836d (60 entries: cli-001..028, setup-001..032)

## Method
- Mechanical (own script, all 60): file digest equals fileDigest; callSite equals the line; matchedExpression equals the column span. 60/60 match. No parked/preserve row writes an alias; no active alias.
- Semantic: read the actual code for every code IO/default-root/dynamic/writer row (bin/fgos.mjs 1527-1760, 1815, 2090-2148, 2370-2384, 2548-2563, 3030-3050; src/setup/registrations.mjs 3890-3975; instruction-registry.mjs 448-468) and traced paths to open/write. Read the cutover patch targets for all 7 exact-patch rows. Checked L12-7 (7 docs/specs consumers all preserve-now + exact cutover patch, no early edit; docs/architect hits are comments/prefix false positives, preserve) and L12-10 (cli-009/024 external-convention paths preserved).
- Did not run tests, fgos, or read .fgos. Passing reproduction script not re-run (light read only).

## Rows
| Edge | Site | Verdict | Note |
|---|---|---|---|
| cli-001 | bin/fgos.mjs:1733 | ok | Historical/comment citation: expression and span verified at digest; cited text is comment or description string only, no IO; preserve and owner binding consistent. |
| cli-002 | bin/fgos.mjs:1754 | ok | Traced bin/fgos.mjs 1750-1760 doc-registry verb: path.join(root,'docs/doc-registry.md') is written with mkdirSync+writeFileSync; generated non-authority projection, preserve; writeDestination correct, alias inactive. |
| cli-003 | bin/fgos.mjs:1799 | ok | Historical/comment citation: expression and span verified at digest; cited text is comment or description string only, no IO; preserve and owner binding consistent. |
| cli-004 | bin/fgos.mjs:1953 | ok | Comment at 1953 inside decision --scope; scope is an area slug, not a path read. Prose-only substitution, L12-7 respected. |
| cli-005 | bin/fgos.mjs:3515 | rework | Mechanical ok. The quoted clause (a session worktree is structurally the wrong place for merge-into-main; return deliberately unchanged) is at h-51f5cd7279fd.md L659 under heading 'Phiên checkout đa-phiên — session start / end / list / gc' (L649), not in the session-nesting guard section (L723) the cutoverPatch.new anchors to. The guard section supports only the approve-refusal half. Re-anchor to the multi-session section (or cite both) before the patch is specified; pre-cutover preserve and L12-7 handling are correct. |
| cli-006 | bin/fgos.mjs:4150 | ok | Source comment at bin/fgos.mjs:4150 cites RUL9 doctor-diagnostic-by-default. Target section 3 Doctor Contract says doctor does not write files by default, so the anchor is reasonable (RUL9 label itself absent in target; acceptable navigation). Exact cutover patch only, L12-7 respected. |
| cli-007 | src/cli/command-registry.mjs:7 | ok | Prefix false positive: line 7 reads docs/architecture-manifest.json; owner binding to the manifest correct. |
| cli-008 | src/cli/command-registry.mjs:831 | ok | Help string for decision scope param at command-registry:831; same as cli-004; user-visible text, prose-only substitution. |
| cli-009 | src/cli/command-registry.mjs:1020 | ok | Line 1020 is a user-visible help example (--plan docs/history/tsk-19j/plan.md), not a historical citation; edgeKind/reason wording is imprecise. Preserve is still correct (external-project convention, L12-10; no file read from the literal). Wording only. |
| cli-010 | src/cli/command-registry.mjs:1845 | ok | Historical/comment citation: expression and span verified at digest; cited text is comment or description string only, no IO; preserve and owner binding consistent. |
| cli-011 | src/cli/command-registry.mjs:2056 | ok | User-visible doctor help string; same target as cli-006, same reasoning. Patch changes emitted help text at cutover (test planned); no early edit. |
| cli-012 | bin/fgos.mjs:1755 | ok | Paired json path in the same writer; write destination correct. |
| cli-013 | bin/fgos.mjs:1757 | ok | writeFileSync(mdPath) traced; correct. |
| cli-014 | bin/fgos.mjs:1758 | ok | writeFileSync(jsonPath) traced; correct. |
| cli-015 | bin/fgos.mjs:1530 | ok | doc reserve takes caller currentPath into reserveDocStore (event write); dynamic set, parked correctly. |
| cli-016 | bin/fgos.mjs:1604 | ok | Traced promote: alias refusal when docPath is an alias of currentPath; reader-only; parked correctly. |
| cli-017 | bin/fgos.mjs:1624 | ok | Traced git cat-file -e HEAD:<currentPath> probe at 1624; dynamic reader, parked. |
| cli-018 | bin/fgos.mjs:1576 | ok | resolveDocPath lookup-only alias resolution at 1576; parked. |
| cli-019 | bin/fgos.mjs:1723 | ok | attest alias refusal at 1723; parked. |
| cli-020 | bin/fgos.mjs:1819 | ok | deprecated compound alias refusal at 1819; parked. |
| cli-021 | bin/fgos.mjs:2099 | ok | CONTEXT read via path.join(repoRoot, contextRelPath) after existsSync; dynamic, parked. |
| cli-022 | bin/fgos.mjs:2146 | ok | Write to contextPath only when changed and the file exists (replaces existing locked-decisions section); writeDestination true; parked. |
| cli-023 | bin/fgos.mjs:2376 | ok | gate-check contextApprove reads --artifact; dynamic, parked. |
| cli-024 | bin/fgos.mjs:2381 | ok | gate-check validateApprove reads --plan; dynamic, parked, L12-10 note appropriate. |
| cli-025 | bin/fgos.mjs:2553 | ok | plan-lint directory branch reads dir/plan.md; dynamic, parked. |
| cli-026 | bin/fgos.mjs:3048 | ok | authoritative-match scan reads *.md in the --quadrant dir; dynamic, parked. |
| cli-027 | bin/fgos.mjs:1542 | ok | doc register equivalent of cli-015; parked correctly. |
| cli-028 | bin/fgos.mjs:2560 | ok | plan-lint explicit file branch reads targetPath; dynamic, parked. |
| setup-001 | src/setup/git-hooks.mjs:85 | rework | Mechanical ok. The comment's claim (no-ops silently when installed as a dependency, no git dir retained, per distribution.md) is not stated in setup-doctor-registry.md section 4 'Legacy Setup Compatibility' (L97-108); nothing there covers hooks or dependency installs. The only hook-setup text in the target is the retained 'Contributor hooks setup' block (L153-165), which still does not state the dependency/no-git no-op. Anchor correspondence unproven; pick the right anchor or park with a missing-target note. Preserve-now/L12-7 handling is correct. |
| setup-002 | src/setup/instruction-registry.mjs:450 | ok | Prefix false positive in a comment (docs/architecture-manifest.json). |
| setup-003 | src/setup/instruction-registry.mjs:583 | ok | Prefix false positive in a comment (docs/architecture-manifest.json). |
| setup-004 | src/setup/registrations.mjs:480 | ok | Historical/comment citation: expression and span verified at digest; cited text is comment or description string only, no IO; preserve and owner binding consistent. |
| setup-005 | src/setup/registrations.mjs:2434 | ok | Historical/comment citation: expression and span verified at digest; cited text is comment or description string only, no IO; preserve and owner binding consistent. |
| setup-006 | src/setup/registrations.mjs:2440 | ok | Historical/comment citation: expression and span verified at digest; cited text is comment or description string only, no IO; preserve and owner binding consistent. |
| setup-007 | src/setup/registrations.mjs:2446 | ok | Historical/comment citation: expression and span verified at digest; cited text is comment or description string only, no IO; preserve and owner binding consistent. |
| setup-008 | src/setup/registrations.mjs:2451 | ok | Historical/comment citation: expression and span verified at digest; cited text is comment or description string only, no IO; preserve and owner binding consistent. |
| setup-009 | src/setup/registrations.mjs:2457 | ok | Historical/comment citation: expression and span verified at digest; cited text is comment or description string only, no IO; preserve and owner binding consistent. |
| setup-010 | src/setup/registrations.mjs:2544 | ok | Historical/comment citation: expression and span verified at digest; cited text is comment or description string only, no IO; preserve and owner binding consistent. |
| setup-011 | src/setup/registrations.mjs:2860 | ok | Historical/comment citation: expression and span verified at digest; cited text is comment or description string only, no IO; preserve and owner binding consistent. |
| setup-012 | src/setup/registrations.mjs:3190 | ok | Historical/comment citation: expression and span verified at digest; cited text is comment or description string only, no IO; preserve and owner binding consistent. |
| setup-013 | src/setup/registrations.mjs:3896 | ok | docRegistryAdopted existence probe on both projection files; correct. |
| setup-014 | src/setup/registrations.mjs:3911 | ok | mdPath in stale check (read destination); correct. |
| setup-015 | src/setup/registrations.mjs:3919 | ok | Stale-message string naming the projection; preserved with writer. |
| setup-016 | src/setup/registrations.mjs:3942 | ok | fixDocRegistryStale write destination at 3942; generated projection, not an alias; correct. |
| setup-017 | src/setup/registrations.mjs:3948 | ok | Fix result message string; preserved with writer. |
| setup-018 | src/setup/registrations.mjs:4081 | ok | Historical/comment citation: expression and span verified at digest; cited text is comment or description string only, no IO; preserve and owner binding consistent. |
| setup-019 | src/setup/registrations.mjs:4105 | ok | Historical/comment citation: expression and span verified at digest; cited text is comment or description string only, no IO; preserve and owner binding consistent. |
| setup-020 | src/setup/registrations.mjs:4139 | ok | Historical/comment citation: expression and span verified at digest; cited text is comment or description string only, no IO; preserve and owner binding consistent. |
| setup-021 | src/setup/registrations.mjs:4212 | ok | registerCheck/registerFix description string naming the projection; preserved. |
| setup-022 | src/setup/registrations.mjs:4282 | ok | Historical/comment citation: expression and span verified at digest; cited text is comment or description string only, no IO; preserve and owner binding consistent. |
| setup-023 | src/setup/registrations.mjs:5270 | ok | Section header comment. Target spec has an identically numbered section 11 'Proof va Definition of Done' (with 11.5 Doctor/setup); R7 label is not in the target, so correspondence is approximate but acceptable for comment navigation. Cutover patch only. |
| setup-024 | src/setup/instruction-registry.mjs:458 | ok | default-root reader traced at instruction-registry 458: path.join(projectRoot,'docs','architecture-manifest.json'); real runtime read of a non-retiring manifest; preserve correct. |
| setup-025 | src/setup/instruction-registry.mjs:463 | ok | readFileSync(manifestPath) traced (JSON.parse of components); correct. |
| setup-026 | src/setup/registrations.mjs:3912 | ok | jsonPath in stale check, read-only; w=false correct. |
| setup-027 | src/setup/registrations.mjs:3913 | ok | readFileSync(mdPath) exact-byte compare; correct. |
| setup-028 | src/setup/registrations.mjs:3914 | ok | readFileSync(jsonPath) exact-byte compare; correct. |
| setup-029 | src/setup/registrations.mjs:3943 | ok | jsonPath in fix writer; correct. |
| setup-030 | src/setup/registrations.mjs:3946 | ok | writeFileSync(mdPath) traced; correct. |
| setup-031 | src/setup/registrations.mjs:3947 | ok | writeFileSync(jsonPath) traced; correct. |
| setup-032 | src/setup/registrations.mjs:3969 | ok | Alias-collision check iterates doc.aliases; lookup-only, no activation; parked pending export. |
## Totals
ok 58 / rework 2 / needs-Lead-judgment 0 (60 total). Rework rate 2/60 (3.3%): above the 3% threshold, so the Lead may widen review of the other cutover-patch anchors outside this part.

## Smallest next action
Re-anchor cli-005 to the multi-session worktree section (h-51f5cd7279fd.md L649-660) and resolve setup-001's anchor (no target passage states the dependency/no-git hook no-op; either choose a verified anchor or park with a missing-target note). Both are patch-spec metadata only; no code or disposition change. Elapsed time not tracked.
