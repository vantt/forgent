# Host Invocation boundary review: merge resolution and source decisions

Reviewer: reviewer:claude-session:a4954387@2026-10-13
Author session: codex-session:5@2026-10-13
Review mode: ordinary
Merge commit: 0653419c1

Scope and method: owner A31 slice only, namely the merge conflict resolution and the three current source decisions the merge created, plus the request's batch-report notes and verdict-binding format. The 18 gaps and the 43 re-pins were not reviewed. The repo was read-only. I diffed the merge against both parents and the merge base (c719f0527), recomputed unit digests with `extractMarkdownConservationUnits` (unit digest is the unit `textDigest`, as the inventory gate uses it), compared the shown texts to the files at HEAD, and ran `node scripts/list-doc-anchors.mjs --check` on both anchors. Main-side content was checked as successor evidence, not code truth.

## Merge resolution

Verdict: ok.

- The only genuinely conflicted content file is `docs/platform/agent-coordination/architecture/dispatch-control-plane.md`. `git diff 63af2a5f9 0653419c1` on it is 3 lines, all inside the Routing Identities capability block. It matches the request's first diff exactly.
- Main's own change to this file from the merge base (c719f0527..5ebbffc94) is one line: `runner.executors.<id>.for[]` becomes `... for[] (kind "tool" executors only)`. The resolved block carries main's three-line wording verbatim. The plan side's earlier rewrite of that block ("bound only by ...prefer; executor for[] declarations do not bind") is replaced by main's wording, which is the intended import of main's meaning.
- Everything outside that block is byte-identical to the pre-merge plan side. Nothing from main is lost, because main touched only this block here.
- Main-only successor diff: the diff over `docs/` from c719f0527 to 5ebbffc94 has SHA256 1bf5cbf1c0ad1aebf10a5a98cc7e86f6614df0aac465803954376e691f65d5ee, equal to the value in the request. The shown text equals the real diff, with one trailing blank line from my extraction range. All 8 changed docs files are present, and the successor binding to `docs/platform/.../dispatch-control-plane.md#routing-identities` is right.
- Two other files differ from both parents, and neither is a content conflict. `CHANGELOG.md`: the merge equals the plan side plus main's 24 added lines, with nothing removed and the plan's entries kept. `scripts/check-legacy-docs-ratchet.exceptions.json`: only four existing entries changed, each rationale/approvedBy/expectedDigest. All 26 `expectedDigest` values in the file match the sha256 of the files at HEAD, which supports the claim that the entries account imported main bytes only.

## Source decisions

Source and target digests were recomputed. The source for rows 1 and 2 is the architect-tree file at HEAD, and for row 3 it is the same file's code-fence unit. The target is the platform file at HEAD, heading `routing-identities`. Shown text equals the file sections (sha256 of the trimmed shown text equals the "Shown ... SHA256" values 5e9c332b..., 63ad8aec..., 1d6df403...). For claim_ab182560 the shown source SHA256 is the unit digest 212ffb52..., and the trimmed shown text hashes to the same value.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_ebe7d2366429303cb74938b60f5cf2fb | ok | Rebound heading row. The source heading digest changed because main edited the fence inside the section; the recomputed digest equals ba8ccc03... and the full shown source and target sections equal the files at HEAD. Target now carries main's tool-executor wording from the merge. The rationale is true for the merge; the carried reviewNote ("prefer-only binding; for[] defect fixed") describes the pre-merge target and is superseded by this verdict. Anchor resolves. | ba8ccc03e5d12eaaf004b55882c332fe6ba0c2d0987ed1103738672a5bf52e39 | 7829c9c2262ec408f1212c5408dbd496856b97f8a64fa7ab1953f18ac8f60a6b |
| claim_ab182560a5142f22e010e35a97b115dc | ok | Rebound purpose-paragraph row (architect unheaded-block-9). The unit is unchanged by main and the shown text equals lines 66-78. It is carried into the same Routing Identities target, whose shown text equals the file. The rationale's A31 sentence is accurate. The carried reviewNote still holds, since it concerns the purpose paragraph and not the fence. | 212ffb52fe719fef01a51f585286aedd6792e48d063ada3a2663933e7c2593ec | 7829c9c2262ec408f1212c5408dbd496856b97f8a64fa7ab1953f18ac8f60a6b |
| claim_a5297db7dd5392e3acf511564f7cb642 | ok | Native new source unit: the architect code fence (unheaded-block-8, lines 58-64) with main's "(kind "tool" executors only)" line. The shown text equals the file, and its digest equals the identical fence in the target (platform unheaded-block-10), so the target carries the whole changed fence. The old fence identity is not duplicated in this table, and the successor binding matches main's diff. The carried reviewNote ("target ... names for[] as non-binding") is false against the current fence and must not be copied; use this note. | 1d6df4038cd801c79a791a0ccca5621ce632a7f8b33a07983cc7d4220e79b05c | 7829c9c2262ec408f1212c5408dbd496856b97f8a64fa7ab1953f18ac8f60a6b |

Batch-report notes and verdict binding format: counts are consistent (408 + 12 + 11 = 431; 431 + 33 + 6 = 470; six documented sessions; five-column format; the old code-fence ID is kept out of the source table). Links in the shown target (`../../../history/dispatch-core-contract-normalization/plan.md`, `../contracts/assignment-run-runresult.md`) resolve.

## Rework

None. Advisory, non-blocking: the `reviewNote` fields in `s2-agent-coordination-truth-judgment.json` for claim_ebe7d236 and claim_a5297db7 still assert prefer-only binding, which the merged target no longer states. When approval fields are copied, copy the notes from this report and not those stale ones.
