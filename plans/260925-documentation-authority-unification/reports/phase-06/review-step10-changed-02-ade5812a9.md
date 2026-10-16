# Review of bounded re-review part 02 at ade5812a9

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792130182385-eef9a749@2026-10-16
Review mode: ordinary
Request commit: b53dd05df
Content commit: ade5812a9f444f895185594aedc1f73cf8b2288a

## Scope and method

Request: `reports/phase-06/review-request-step10-changed-02-ade5812a9.md` (12 entries: six tool/reproduction entries 013 to 018, four outstanding registry marker drops 019 to 022, two registry-change-since-request entries 023 and 024). No `.json` sidecar exists for it. No sensitivity pack requested or produced. Read-only worktree `/home/vantt/projects/forgentX-s8-review` at b53dd05df; `git status --short` empty at the end. Entries 023 and 024 name the package author session `codex-session:unit-run-1792130920095-4c562e4f@2026-10-16` (native sync overlay); the header above uses the session the request header lists first for the changed rows.

A36: every entry is deep-required. Seed `20261016` was recorded; since the four claim rows are the whole population, all four were read in full and every note starts `deep:`.

Checks I ran myself (scratch only):
- Blob and SHA-256 of each tool/manifest file at ade5812a9 equal the pack (013 to 018).
- For the four marker claims: the registry before row (f1f414b02) and after row (fe98a6455) read from git equal the pack before/after objects exactly; the only changed fields are the ones listed (`lineage` and `reviewStatus` for 019 and 021, `origin` for 020 and 022); the row at ade5812a9 equals the fe98a6455 row. For each claim, the extractor digest of the live unit at ade5812a9 equals the row `sourceUnitDigest` (fd599aeb..., f0330242..., e2452463..., 7486a9e9...) and the identity fingerprint prefix; all four anchors pass `list-doc-anchors.mjs --check`.
- Why the unit text changed since the earlier digest: commit eb793bc63 only prefixed `Added in candidate —` (and for one row a short correction clause) to the first line of two blocks; the earlier text is otherwise unchanged (diffed). The two heading rows change digest because the following block is part of their payload. The clause "the former driver-specific rules remain in the historical snapshot linked above" is true: the link at line 23 of the same file resolves (`#literal-snapshot` anchor ok).
- Marker drops are the designed behavior of the next carry (`withoutCarryMarkers` removes per-carry markers); nothing else in these rows moved.
- Registry accounting independent of the author tool: from fe98a6455 to b53dd05df the registry has exactly 16 changes (12 unit `origin` drops, 4 metadata keys: `_binding`, `carriedFromCommit`, `carryForward`, `commit`), zero in documents, gaps, retired rows. `step10-registry-accounting.mjs --previous-request fe98a6455` printed 16 as well. From f1f414b02 to fe98a6455: 12 added units, 4 changed units (the four markers), 1 document, 4 metadata keys, as `tooling.md` states.
- Check A: wrapper output has 9 accounted pairs (5 A3, 2 A21, 2 L10-35a), 0 unaccounted, 0 working violations; the exceptions list equals the owner-answer wording (plan.md of A21 is already in `allowed-paths.json`; L10-35b entry present); B and H pass; I equals HEAD with the frozen baseline unchanged (the `equal: false` against the frozen baseline is the same as in the author evidence and is diagnostic only).
- Reproduction wrappers, doc tool tests (507 pass, 0 fail) as listed in part 01.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_133a4900a601db7cbf1182a96540ef56 | ok | deep: registry row before and after equal git; unit evidence-and-conduct-boundaries digest matches the live heading plus following block; only change is the Added in candidate correction prefix on the first line of the payload, original text kept; dropped lineage and reviewStatus markers are by design; accounting only | fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485 | none |
| claim_4a2dfdbfa271d8f20b4e581757288988 | ok | deep: unheaded-block-44 digest matches the live block (lines 436-437); change is the Added in candidate prefix plus lower-cased first word; only the origin marker dropped, no other field moved | f03302423020c8beeac177192fbe0952433473b78efd7c17f5eb96b39d67dbca | none |
| claim_c90c0415c20234da816351e16f9903b8 | ok | deep: heading 7-constraint-findings digest matches the live heading plus its following block; the change is the same prefix on the first following line; lineage and reviewStatus drop only; anchor is the heading, not a position guess | e24524633ae56daa1d8e9a8c4b2956f92d4e08aac51d98f3fe5775b2f9ae3064 | none |
| claim_cfdd80946e57e4ea360ed04c1413f4dd | ok | deep: unheaded-block-117 digest matches the live block (lines 1470-1471); text equals the old block plus the Added in candidate current-Workflow correction clause whose snapshot link resolves; only origin dropped | 7486a9e911dc83dd8182817e3d51bccd7b2e95a87b245307e19b3dd1de9fbb34 | none |

## Tool, manifest and registry entries (no claim id; ordinary verdicts)

- entry-013 `step10-registry-accounting.mjs` ok: deep: requires an explicit `--previous-request` and an external `/tmp/fgos-work` output, no ID filter, output equals my independent change count (16).
- entry-014 `step10-round5-reproduction.json` ok: deep: ownership imports its library from the caller `--output-dir`; checks.mjs gates check A on exact commit/path accounting (the nine pairs above) rather than on the frozen list equality; the only remaining `/tmp/fgos-work/` text is the required output root; the wrapper ran green end to end here.
- entry-015 `step10-sync4d-reproduce.py` ok: deep: rejects outputs outside `/tmp/fgos-work`, inside the repo, symlinks and hard links; materializes only `readOnlyScripts`; ran green here. The optional native mode was not run (4 GiB).
- entry-016 `step10-sync4d-reproduction.json` ok: deep: same lib-from-output-dir fix and check A change; the old author scratch paths (`package4d`, `review4d`) are gone from the read-only scripts; the wrapper command and the optional native commands are consistent with the header.
- entry-017 `step10-round6-reproduction.json` ok: deep: lists the documented commands and the four-marker obligation; historical author scripts are archival. Note: its first command names `step10-round5-reproduce.py` and works as written.
- entry-018 `tooling.md` ok: deep: its claims check out against my runs (507 of 507 tests, 17 carrier sentences, nine accounted pairs, registry accounting counts); no stale statement found.
- entry-023 `_binding` change ok: deep: before (562c2583..., 62180479 bytes) is the byte count and hash of the registry as read at f1f414b02 and after (3ead3b52..., 62185799) is that of fe98a6455, which is what `_binding` records (the input registry), so the change is genuine. The registry file at the request commit b53dd05df hashes to 1f5325ff1b1c2012c06aaf17b805c3f4fc2527923742271dff3d77e10707989e (62185030 bytes); the Lead must bind that exact hash to the package commit, as the entry itself says.
- entry-024 `carriedFromCommit` change ok: deep: 62751458b to 4d363436, matches git at fe98a6455 and b53dd05df.

## Notes

- The four marker rows are native identity records for unit text that gained an `Added in candidate` label in eb793bc63; they were checked as accounting and identity carry only, not as current truth.
- The two other registry metadata keys that changed (`commit`, `carryForward`) and the twelve `origin` drops are in other parts of the set; I verified the totals (16) independently, not the rows of those other parts.

Unresolved: none.
