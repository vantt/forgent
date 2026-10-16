# Step 10 final full-corpus promotion rehearsal

This human-readable projection is regenerated from the authoritative raw receipt [`step10-package-rehearsal.json`](step10-package-rehearsal.json), not from the earlier c3614f4d2 rehearsal.

- Content pin: `38672e7f157788cbe1b2bf59511bd61046dce660`
- Started: `2026-10-16T19:16:49.548Z`; finished: `2026-10-16T19:32:58.254Z`; elapsed: **968.706 s**
- Disposable clone: `/tmp/fgos-work/step10-rehearsal-enYvrG`; removed: **true**
- Native read-only regeneration: **4,486 files / 91,388 units**; no carry-forward or registry persistence
- Docs diff: empty
- Cutover evaluator: exit **1**, **7 pass / 12 blocked / 1 review**

Full strict-E open population at the rehearsal pin: 28 partial carries, 2 not-reviewed backlog rows, 362 identical-owner groups and 2,336 unreferenced candidate units. The two not-reviewed rows were subsequently accepted by the committed close review and applied in the close turn; this file preserves what the rehearsal actually measured.

| Gate | Status | Measurement |
|---|---|---|
| `owner-per-claim` | blocked | 22,629 owner violations of retained rows, ownerless retained rows and unknown-blocking rows |
| `no-new-legacy-growth` (promotion) | pass | no legacy-ratchet violations |
| `metadata-and-structure` | blocked | 89 unrouted platform documents; 0 missing metadata, placement or ambiguous-route findings |
| `links-resolve` | blocked | 158 unresolved relative links or Related paths |
| `claims-reviewed` | blocked | 2 rows not reviewed at rehearsal time |
| `intent-and-boundary` | review | human review owed under doc governance |
| `file-disposition` | pass | no unknown-blocking file-level disposition |
| `claims-closed` | blocked | 30 partial/unreviewed rows, with overlapping categories |
| `dropped-claims-resolved` | pass | all dropped-claim entries have reviewed dispositions |
| `aliases-cover-immutable-refs` | blocked | 994/994 legacy paths lack an adopted bare-path alias |
| `consumers-rewritten` | blocked | 5,213 external consumer edges; 7,467 dynamic authority-consumer patterns remain outside that count |
| `evidence-digests` | blocked | no relocation manifest/verifier |
| `no-new-legacy-growth` (retirement) | pass | no legacy-ratchet violations |
| `write-lease` | blocked | lease remains design-only |
| `row-set-conserved` | pass | no prior identity missing against two registries |
| `one-owner-per-semantic-claim` | pass | no semantic claim has multiple owners |
| `cutover-mode` | blocked | 68,091 ledger violations plus 4 vocabulary-usage drifts |
| `reviewed-rationale` | blocked | 22,616 rows lack their own required rationale |
| `canonical-metadata-complete` | pass | 160/160 canonical docs complete |
| `no-unresolved-conflicts` | blocked | 4 duplicate + 28 semantic groups |

This rehearsal is evidence of real blockers, not cutover permission. No promotion, retirement, alias adoption, sealing or checker relaxation occurred.
