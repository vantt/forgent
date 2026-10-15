# Review of runner source pack 12 (s9d)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15
Review mode: ordinary
Request commit: 98603fffe
Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

## Scope and method

Request review-request-261015-1706-runner-source-12-81d0ed074.md (shard s9-runner-01.json, SHA256 de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b; target docs/platform/runner/subcomponents/h-2e032393add1/spec.md, part 1/1); 4 Weak-exact rows, 0 Judgment, 0 unequal-digest pairs, 0 map amendments, 0 rebound anchors in this pack. No sensitivity pack was requested or run.

Mechanical checks on every row: source unit extracted from docs/specs/runner.md at 81d0ed074 (blob ddfa78cc, equal to HEAD of the review worktree) with extractMarkdownConservationUnits, full digest equal to the pack and the shard claim; target unit extracted from the committed target file, digest equal to the shard targetUnitDigest; list-doc-anchors --check passes for the target owner and anchor; pack decision equals the shard claim field by field (23 of 23 across the three packs); rationale cites the right source lines, target path and anchor and its class reason matches the sidecar; the pack full-source text matches the committed source.

A36 sample: seed 261015, Python random.seed(261015) then random.sample over the sorted claim IDs of pack 10 (10 of 15); packs 11 and 12 are read in full (4 of 4 each, minimum is all when fewer than 10). This pack deep-read 4 of 4 rows (min required 4). Deep rows were read with diff of the whole contiguous source range against the whole target range (empty diff) and their raw-unit sha256 recomputed by hand in Python (independent of the repo tool); heading digests were recomputed with the tool formula. Both directions: every non-scaffolding target unit of the file has a claim (no duplicates), and the only uncovered target units are the H1, metadata fence and blockquote, all labelled Added in candidate. 0 of the deep rows needed rework, so no full-pack escalation.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_faf7be822c2140f22e6d5a5882f84595 | ok | deep: heading unit Open Gaps level 2 carried verbatim, same level and title, source runner.md 1175-1175 vs target 25-25; target adds only the labelled Added in candidate H1, metadata fence and blockquote; rationale named target and lines are true. | b0767ddee6872a0d1e26fae94c0bcca47ba8db1743e511050e4d859694c4fc02 | b0767ddee6872a0d1e26fae94c0bcca47ba8db1743e511050e4d859694c4fc02 |
| claim_5c6238369ac0200472ee37488cd0e09a | ok | deep: source and target text diff-identical (source runner.md 1177-1192 vs target 27-42); RUL ids present and verbatim: RUL10, RUL21, RUL29, RUL37; hand sha256 of both raw units matches the pack; anchor ok, rationale lines and target match. | d18835d06937f979c98f008115c46b322ad995e2a465a6cdad4099bae761ebee | d18835d06937f979c98f008115c46b322ad995e2a465a6cdad4099bae761ebee |
| claim_199e9de005d19f4b2d061005d959b3ed | ok | deep: source and target text diff-identical (source runner.md 1194-1202 vs target 44-52); no RUL id in this block; hand sha256 of both raw units matches the pack; anchor ok, rationale lines and target match. | 197a395073121e8ebc1dc71f8efdabbb4a02ddff6c28689ba1711e008b226e34 | 197a395073121e8ebc1dc71f8efdabbb4a02ddff6c28689ba1711e008b226e34 |
| claim_2bb6c6025afdbad3c1a26762f903bcd2 | ok | deep: source and target text diff-identical (source runner.md 1204-1205 vs target 54-55); RUL ids present and verbatim: RUL30, RUL34, RUL93; hand sha256 of both raw units matches the pack; anchor ok, rationale lines and target match. | 33397038e11c79d2866f7ccc09b04d90f18eb593080a2bc3a9f2a2a39ec95136 | 33397038e11c79d2866f7ccc09b04d90f18eb593080a2bc3a9f2a2a39ec95136 |

## Notes

- Carriage only; truth of the carried sentences is not judged (A19), and the carried text keeps its known stale statements per the author note.
- Minor observation, not rework: every rationale says the P2 frozen map carries an explicit Lead additive amendment, yet these rows record no map amendment and the map rows for business-rules, edge-cases-settled and open-gaps are unchanged at the older blob 473a0096; the sentence is shared boilerplate, harmless because the placement matches the map rows exactly.
- Target scaffolding (H1, metadata fence with Provenance pointing at blob ddfa78cc, blockquote) is labelled Added in candidate and is not a source claim.

Unresolved: none.
