# Independent Step 0 accounting review request

Request identity: `step-00-author-accounting-review`. Pending; Lead starts ONE fresh-context independent reviewer under A38, with no authorship overlap. No verdict is proposed. Input HEAD: `f7686163843ca8ce6b58b1fffe0472e57ce774e7`. Pin the real AUTHOR runner commit and subsequent accounting commit before starting; neither exists at author handback. This packet is not acceptance and consumers remain blocked.

Read Phase 8 Step 0/shared rules and owner answers A49/L12-1..15 first, then `step-00-author-rebindings.json`, `step-00-unaccounted-pairs.json` and the parts below. Historical comparison is merge `49ad04648` first parent, not current main. All 85 joins, six exceptions, seven manual conflicts, three clean auto-merges and 37 input commit/path pairs are mandatory deep reads/mechanical joins. Full before/after decision rows, native historical identities, passage text, anchors, digests and reasons are embedded per binding. Similarity scores in changed-passage records are candidate discovery only; independently decide correspondence from passages and ancestry. Rehashing alone never approves content. No target document changed, no native identity assigned; every changed binding is pending.

| Part | Input | Entries | Bytes | Unique reviewer output name |
| --- | --- | ---: | ---: | --- |
| 1 | `step-00-author-review-part-01.json` | 35 | 380,063 | `review-a38-step-00-author-accounting-part-01.md` |
| 2 | `step-00-author-review-part-02.json` | 38 | 366,044 | `review-a38-step-00-author-accounting-part-02.md` |
| 3 | `step-00-author-review-part-03.json` | 9 | 224,464 | `review-a38-step-00-author-accounting-part-03.md` |
| 4 | `step-00-author-review-part-04.json` | 56 | 374,685 | `review-a38-step-00-author-accounting-part-04.md` |

138 entries / 1,345,256 bytes total, four parts; each ≤60 entries and ≤400,000 bytes. Mechanically inspect every entry and deep-read every binding/conflict/accounting join, including inherited exceptions and auto-merges. More than 3% rework expands affected-set review; stop for Lead sizing rather than cycling. One bounded re-review after fixes. Lead assigns reviewer time from measured throughput before dispatch; no time approval or reviewer dispatch is claimed here. Output paths must be supplied by the Lead through its authorized convention door; the unique report names above reserve distinct identities, not an unauthorized output location.

Separate accounting Unit: at the real AUTHOR commit rerun the unchanged reporter, read each checks.A.unaccountedPairs and require exact equality. Append every actual `{commit,path,authority}` pair into BOTH Phase 6 exceptions literals under L12-3/L12-11, with declared writes limited to those two manifests. Preserve all other script bytes, recipes, pins and allowlists. The 37 input pairs are exact but incomplete for the future AUTHOR HEAD; its new pairs cannot be known yet. The accounting runner commit must write only those two manifests. Extend this same logical review request with actual author/accounting receipts, literal joins in both manifests, and Phase 9 additions, partitioning additional entries to the same limits and assigning new unique report names. Never treat current parts as covering future unknown pairs.

Light portable commands (repository root; one part at a time):

```sh
git rev-parse HEAD
git status --short
git show --format=fuller --stat <actual-author-commit>
git diff <actual-author-commit> <actual-accounting-commit> -- plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-reproduction.json plans/260925-documentation-authority-unification/reports/phase-06/step10-sync4d-reproduction.json
```

```sh
python3 - <<'PYREAD'
import json, pathlib
r=pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-08')
j=json.loads((r/'step-00-author-rebindings.json').read_text())
for part in j['journalParts']:
    p=pathlib.Path(part['path']); rows=json.loads(p.read_text())['entries']
    assert len(rows)==part['entries']<=60 and p.stat().st_size==part['bytes']<=400000
    for row in rows:
        if row['kind']!='binding': continue
        current=json.loads(pathlib.Path(row['file']).read_text())[row['collection']][row['rowIndex']]
        assert current==row['after'] and current['reviewStatus']=='pending'
        assert current['claimId']==row['before']['claimId']
    print(p.name, len(rows), p.stat().st_size)
PYREAD
```

For each pair use `git diff-tree --no-commit-id --name-only -r <commit> -- <path>` and independently join both exception literals, including authority. For historical passage context use `git show 49ad04648^1:<targetOwner>` and read current `<targetOwner>`; use the unchanged production extractor and each recipe's unitsOf to verify anchors/digests. For six exceptions and conflict/auto-merge entries compare actual blob/digest and the L12-1 preservation constraints in `merge-accounting.json`; inherited receipts are evidence to check, not fresh approval.

Batch-end commands are deliberately reserved for Lead AFTER accounting on clean committed bytes: both unchanged recipes' ownership/audit/checks and the three-file reproduction/ratchet/citation tests. Author diagnostics are pre-accounting only. Require both audits and raw checks green with frozen B pins unchanged, no new collision/duplicate; any unresolved row, unknown pair, manifest script drift or unexplained failure blocks consumers. P7-DOC-GAP-05 remains a Phase 9 pre-landing obligation; it does not waive a reproduction failure. No classifier repair, native/global sync, content rewrite or checker change is requested.

Phase 9 additions: retain the thirteen newly main-touched candidate paths in `merge-accounting.json` and L12-1/A47's changed-candidate union, reconcile incoming PF-I022/PF-I023 reference, reading-map divergence and Holder-lock header, and preserve P7-DOC-GAP-05/06 carries. This AUTHOR binding repair does not discharge per-unit final conservation/current-truth work. Decision F remains L12-9; L12-14 withdraws the B waiver/classifier lane.
