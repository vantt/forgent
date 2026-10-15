# Review: specs and ui-spec last rationale

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15
Review mode: ordinary
Request commit: 81d0ed074
Content commit: 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4

## Scope and method

One pending row from the bounded re-review request, shard `s5-root-authorities-sc1-gaps.json`. The prior rework asked that the rationale name both deltas between the source block and the successor unit. No sensitivity pack was requested. Sampling seed not applicable: the single row is the row the request lists as differing, so it was read in full (deep).

Checks run in the read-only worktree detached at 81d0ed074: the shard row equals the request's After decision field for field (disposition supersede, reviewStatus pending, no approval or reviewer fields, targetAnchor unheaded-block-34); `list-doc-anchors.mjs --check` on `cli-io-contract.md#unheaded-block-34` printed ok; the cli-io-contract.md bytes are identical between 7854cff84 and 81d0ed074; both digests recomputed with extractMarkdownConservationUnits (source from `9881f8622:docs/platform/work-state/contracts/cli-io-contract.md` unit unheaded-block-32, target from HEAD unit unheaded-block-34), and a line diff of the two unit texts was read.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_e597b776163803dcf6e4194962ea4f6e | ok | deep: the diff of source block 32 against target block 34 has exactly two deltas, the example parenthetical (review, approve, run) added after the coordination clause and the three-line subcommands bullet appended; the rationale now names both and says the subcommands bullet was never in the source, which is true; every other source line is byte-identical apart from the wrapped qualifier line, so the stated reflow is accurate; binding unheaded-block-34 with e013c5b0 and source 5bed5c61 both recompute; status stays pending with no approval or graft carried | 5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3 | e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68 |

## Notes

- The rationale also honestly retires the earlier unheaded-block-33 binding as inconsistent; block 33 is the paragraph before the bullets, so that statement is true.
- Supersede is legal here: the whole source unit is carried and the target adds one clearly labelled bullet.
- Worktree `git status --short` is empty. Scratch scripts are in work-s8-last/.

Unresolved: none.
