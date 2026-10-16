# Review of bounded re-review part 01 at ade5812a9

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792130182385-eef9a749@2026-10-16
Review mode: ordinary
Request commit: b53dd05df
Content commit: ade5812a9f444f895185594aedc1f73cf8b2288a

## Scope and method

Request: `reports/phase-06/review-request-step10-changed-01-ade5812a9.md` (12 entries: five changed rationales, seven tool/test/reproduction entries). No `.json` sidecar exists for it. The request asks for no sensitivity pack; ordinary review, none produced. Read-only worktree `/home/vantt/projects/forgentX-s8-review` at b53dd05df (docs bytes equal ade5812a9); `git status --short` empty at the end.

A36: every entry is deep-required, so all 5 claim rows were read in full, both directions (sampling seed `20261016` was recorded, but the sample is the whole population: 5 of 5). Every note therefore begins `deep:`.

Checks I ran myself (scratch only):
- Source/target direct sections of each of the five claims re-derived from the committed files; my removed/added normalized line arrays equal the arrays printed in the rationale for all five (11/4, 10/1, 9/2, 23/1, 14/1).
- Full 64-hex source and target unit digests recomputed with `extractMarkdownConservationUnits` for all five claims (5 of 5, so more than the 10 percent minimum); each equals the pack digest.
- `list-doc-anchors.mjs --check` on all five target anchors: ok.
- Reverse carrier check done independently of the author tools, on exact raw lines: every raw removed source line is present verbatim in the union of the listed witnesses (0 missing in all five), and for every witness in the old and the new list, kept if and only if it contains at least one non-trivial removed raw line (0 mismatches; all 56 dropped witnesses contain none, all kept ones contain at least one). The previous round's five reworks asked exactly this.
- Rationale before/after diff: only the carrier-witness sentence changed (plus authoredBy); the rest of each rationale is byte-identical to the earlier text.
- Round 6 claim: `sectionAccountLabels` is word-bounded (a row containing `SHA256` and no label returns no labels; `A92` and `xA9` do not match `A9`); the fallback label is gone from `classifySectionAccounting`.
- Reproduction (scratch outputs under `/tmp/fgos-work/REVIEWER-z1-*`, nothing inside the worktree): `step10-round5-reproduce.py` all six steps exit 0; `step10-sync4d-reproduce.py` all five steps exit 0 (independent audit 12,895 rows, 92 shards, 0 findings; checks A/B/H/I ok; ownership 254 groups, drift 0; link replay), `step10-registry-accounting.mjs --previous-request fe98a6455` 16 changes, `step10-round6-carriers.mjs` without `--apply` 17 checked, 0 changes, doc tool tests 507 pass / 0 fail. The optional native D (4 GiB) was not run.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_d5dd5fbdb3483914743a14791a5f02a8 | ok | deep: all 11 removed lines (rust enum fence, Built-In, External Process, External WebAssembly, Native Rust paragraphs) are verbatim at release-boundaries.md blocks 18-22 under restored-class-definitions; the 10 dropped witnesses held only fences or a brace; remaining heading witness restored-class-definitions qualifies by its section payload; remainder claim ids named | 19bd3465163fc281e12f6ac88d531d651ce0e8329d0485fa4536c107516305fe | e7a9211054b328f165f59f75bfc1633b8b3a60a383afeff778f1eb2312f6d8a0 |
| claim_9a5781f0086209a17330035ff0e58638 | ok | deep: all 10 removed registry-linker lines are verbatim at compatibility-harness.md blocks 10, 11, 12 under restored-registry-linker-procedure; the 8 dropped witnesses carried no substantive removed line; the single added line links the restoration | f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c | cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32 |
| claim_76dfcba31d147e73488ea3abeade7ef1 | ok | deep: the 9 removed lines (state chain fence plus idempotency sentence) are in component-protocol.md blocks 15 and 11; the 20 dropped witnesses (upper spec.md, rejected options, harness) had no substantive removed line; its two added links point at the restoration sections that hold them | 7a639345a5670ebb3cd24fd27a72fb08467d57f4667517fbd47f51d35b9bb224 | a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6 |
| claim_080c5cdacf820ed661ab372086ca7e41 | ok | deep: all 23 layout-tree lines are verbatim in release-boundaries.md block 10 under restored-physical-placement-layout-tree (21 substantive); the 16 dropped witnesses held only a fence line; the primary spec.md section keeps surrounding text and one link | 26dedcce46fdb8fba749ce8ecb56418bbc45624ad00c28a2a355647221c73a35 | e95f14771b2c72fc9eb48e5c9813b74f897175763fa9b44441fb2cb6a896c1cd |
| claim_c072318ec582affe5e0e6936961fadc4 | ok | deep: the 14 removed procedure lines, including the Component Boundary Advisory link line, are verbatim in component-protocol.md blocks 50 and 51; the two node-to-rust-migration.md witnesses matched only through the link placeholder and are rightly dropped; link-only lines can no longer witness | d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f | ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e |

## Tool, test and reproduction entries (no claim id; ordinary verdicts)

Blob and SHA-256 of each file at ade5812a9 equal the pack (and HEAD) for entries 006 to 012.

- entry-006 `scripts/doc-binding-repair.mjs` ok: deep: `removedCarrierWitnesses` derives raw removals after exact corrections, keeps repeated-line multiplicity, drops fence, brace, separator, heading and link-only lines, rejects self carriers, and requires the exact raw line; `registryChangeAccounting` covers metadata plus all five collections including removals. My independent raw-line replay agrees with it on all five claims.
- entry-007 `scripts/doc-rationale-facts.mjs` ok: deep: the reverse rule re-derives raw removals inside the checker (no generator import) and flags missing, self or unsupported anchors; the checker ran 0 findings over 12,895 rows. Minor non-defect: the heading-line normalization uses a non-global regex, so only the first heading-like line of a multi-line text is masked; irrelevant to these rows.
- entry-008 `test/scripts/doc-rationale-facts.test.mjs` ok: deep: new cases cover fence, brace, separator, exact link-only, substring and missing witnesses, plus raw link spelling in prose; they pass.
- entry-009 `test/scripts/doc-rationale-reproduction.test.mjs` ok: deep: fresh-directory tests materialize both manifests and run ownership, ownership audit and checks; they pass here.
- entry-010 `test/scripts/doc-rationale.test.mjs` ok: deep: tests for the witness rule, corrections and multiplicity, and registry accounting; pass.
- entry-011 `step10-round4-rationale-rebuild.mjs` ok: deep: it only filters the witness list through `removedCarrierWitnesses`; historical provenance script, not a replay command.
- entry-012 `step10-round6-carriers.mjs` ok: deep: read-only without `--apply`, output confined to `/tmp/fgos-work`; run here: 17 sentences checked, 0 changes (stable).

## Notes

- Heading witnesses (for example `restored-class-definitions`) are listed next to the block witnesses that actually hold the lines. They qualify under the stated rule because a heading carrier is its whole section payload, so this is accurate, only redundant; not a defect and not worth a rework (rationale wording).
- The target sections' other "Added in candidate" links (for example the three to the dropped-006 restoration in claim_d5dd) belong to the nested sub-headings of the source section, not to the 11 removed lines; they are unchanged since the last reviewed target digest.
- This ok verdicts accounting and conservation only; no current truth, promotion or cutover is approved.

Unresolved: none.
