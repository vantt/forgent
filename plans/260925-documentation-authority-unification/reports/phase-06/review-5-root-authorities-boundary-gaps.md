# Review 5 - root authorities boundary, gap rows

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:15@2026-10-14
Review mode: ordinary
Request commit: 7576ead9d
Content commit: c1961bdb2

## Scope and method

Scope: the seven registry-gap rows of `review-request-261014-1900-root-authorities-boundary.md`: three renewed historical gaps (0f4d968b, de531cd9, 40aafcee) and four new native gaps (970b6ae8, 04703f01, f2f1dadd, f033905b), for the A31 batch-boundary merge 48e3a992b (main 88315d5de). Decision/registry commit 796b247c6; request commit 7576ead9d; worktree HEAD 7576ead9d. Per A31 item 3, files changed only by main are checked as successor or supersede target, not code truth.

Checks run:
- Recomputed unit digests with `extractMarkdownConservationUnits`: historical sources at 67a276b0d (distribution#unheaded-block-5 cdf23ebc...), 1f911229f (confinement#unheaded-block-144 f99e0d4d...), 31f676749 (runner#unheaded-block-92 95e75f7d...); pre-merge units at 7d83c6b63 (0ce5ce17..., 12018d6d..., c331d408..., and packaging#85 0ce5ce17...); current targets at HEAD (648a2fee..., f0b5e6c1..., 4fc5044d...). All equal the shard and request values. `list-doc-anchors.mjs --check` ok for all five target anchors.
- Main's diff (`7d83c6b63..48e3a992b`) per file: confinement 144 replaces the word `account,` with `kho login (mỗi account ... mỗi stores/<cli> ...),`; runner 92 only inserts text (login-store scope phrase, stranded-copy and `torn/`/`pending/.tmp` rules); distribution Data Dictionary rows 7 and 7b only add text. Nothing normative is dropped without a stated replacement, so a same-file supersede is truthful.
- Historical-to-current word diffs (distribution, confinement, runner) show only wording replaced by the upstream rewrite (for example the old "home stays held when pending is full" sentence replaced by the redundant-only drop rule, a cross-reference to `runner.md` replacing "below"); the current unit carries the superseding rule in each case.
- Registry check: against the working registry at 7d83c6b63 there are exactly four new native IDs (packaging#85, confinement#144, distribution#5 = a26a90f9, runner#92) and 94,338 old IDs all kept; old IDs 970b6ae8, 04703f01, f2f1dadd, f033905b moved from units to identityGaps with unchanged digests (no graft).
- Four disclosed native stable-heading tuple changes verified: packaging `data-dictionary` (claim_5c7a41cb), confinement 13.2 (claim_bed90dbb), distribution `data-dictionary` (claim_4eeb2f40), runner `business-rules` (claim_32d36648). Recomputed before and after: same claimId, sourcePath, anchor, unitKind and claimKind; only textDigest and identityFingerprint moved because the section payload or following block changed; unitDigest = sha256("heading\n" + textDigest) holds for all eight values. The pre-existing binding for bed90dbb and 32d36648 (`review-4-packaging-headings-merge.md`) used the same same-ID digest-change pattern and was accepted ok. No identity graft.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_0f4d968b593902731bd334f9ed2af711 | ok | Historical distribution#5 (cdf23ebc, 67a276b0d) superseded by the same-file current table 648a2fee; the diff is wording rewrite plus main's added doctor text, and the cross-reference now points to runner.md; supersede is truthful | cdf23ebc6949803aa19ec83913121c79ebc370e9ef29134c0fb3bf49af44a99c | 648a2fee27dd55616a3ca003e9bb21fc11827ca1947dbf7463dbec2538f113b6 |
| claim_de531cd96f9f92540f16d2ec822dbaf3 | ok | Historical confinement#144 (f99e0d4d, 1f911229f) superseded by f0b5e6c1; the old cap and held-when-full sentences are replaced by the redundant-only drop rule in the same unit, including main's latest per-store wording; same file, no graft | f99e0d4d9f055f630281cd3e3aead0de52d35fd8fa152c8d429bf0af333ca246 | f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3 |
| claim_40aafcee52b22eda087c5f85eacb9392 | ok | Historical runner#92 (95e75f7d, 31f676749) superseded by 4fc5044d, which keeps the redundancy rule and syncing sentence and adds the stranded-copy, torn and tmp-staging rules; replaced wording is stated; supersede truthful | 95e75f7d43d50bbae0d6a7979aa0db2f01326f00fc290507fdf8bf046403a547 | 4fc5044db3e9bb5826d7ea2dd979fdc39e1190356326c84170e2b3df69d8204e |
| claim_970b6ae8bfa6cb7f00a0e4c2d98e4d4d | ok | Old candidate unit packaging#85 (0ce5ce17, 7d83c6b63) superseded by the candidate import 648a2fee, which equals main's table verbatim (import diff is rows 7 and 7b only); rationale accurate | 0ce5ce17cd290a31a55e9a63872f96732a0cd0d096c4aa29693105768629ba90 | 648a2fee27dd55616a3ca003e9bb21fc11827ca1947dbf7463dbec2538f113b6 |
| claim_04703f011b22383992b94545055b9e56 | ok | Pre-merge confinement#144 (12018d6d) superseded by f0b5e6c1; main's diff replaces only the word account with the per-store phrase, so nothing is lost; the word candidate in the rationale is boilerplate since no candidate carrier exists here, harmless | 12018d6ddfb98564eca2e0dbd9267ffa859e1e5e69c11db3f506886fa0ab717c | f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3 |
| claim_f2f1dadddff0c5440195d8c00b74d56e | ok | Pre-merge distribution#5 (0ce5ce17) superseded by main's 648a2fee in the same file; main diff is only additions to rows 7 and 7b; the earlier reviewed move row for this ID is replaced by this gap plus the new a26a90f9 move; no graft | 0ce5ce17cd290a31a55e9a63872f96732a0cd0d096c4aa29693105768629ba90 | 648a2fee27dd55616a3ca003e9bb21fc11827ca1947dbf7463dbec2538f113b6 |
| claim_f033905b059f073c62ec27f0ee6da620 | ok | Pre-merge runner#92 (c331d408) superseded by 4fc5044d; main's diff is pure insertion with no deletion, so the old unit is wholly contained in the successor; candidate wording in rationale is boilerplate, harmless | c331d40816f84d25425abfdfdb8c6bff2a1e92b781bfe82d6f910fc0b1777917 | 4fc5044db3e9bb5826d7ea2dd979fdc39e1190356326c84170e2b3df69d8204e |

## Ratchet accounting (three legacy spec exceptions)

The three exception entries (distribution, runner, confinement-authority) now pin expectedDigest 2ab0c766..., b08341e9..., 435f3ccc..., which I recomputed from `git show HEAD:path`; the mainBlob values in `root-authorities-boundary-ratchet.json` equal the blobs at main 88315d5de, merge 48e3a992b and HEAD. `check-legacy-docs-ratchet.mjs` is clean. The rationales state exact upstream bytes imported, not a plan move, with independent conservation review owed, which this report supplies for conservation only; it is not a content or truth approval.

Status: DONE (7 ok / 0 rework / 0 hold)
