# A38 review request — fresh groups and Step 1 inventory

Author-session:
`codex-session:fgos-run_unit-run-17922054c556f0@2026-10-17`.
Review identity must be a distinct
`reviewer:<model>-session:<id>@<YYYY-MM-DD>` that did not author these rows.

## Pins and inputs

- B0: `6f0f39ca14138c20d2ccb62063ccdf337cf6873a`.
- Fresh file inventory: `review-input-a38-fresh-inventory-01/index.json` — 4,486
  entries in 75 parts, at most 60 entries and 56,044 bytes per part.
- Cross-area inventory: `review-input-cross-area-01/index.json` — 98 entries in two
  parts, at most 60 entries and 58,469 bytes per part.
- Phase 6 queue, used only after derivation for exact drift comparison:
  `../phase-06/step10-other-group-queue.json`.
- Retirement/mirror count context:
  `../phase-06/step10-retirement-group-counts.json`.

Every index pins part byte counts and SHA-256 digests. Refuse any missing, oversized or
digest-mismatched part.

## Independent work

1. From the 4,486 fresh file rows, independently derive duplicate-content groups from
   `blobSha` and semantic groups from normalized `area` plus `firstHeading` (fall back
   to the filename without extension). Apply the native retirement/mirror exclusions
   from the pinned evidence; do not start from the 32-group queue and do not trust the
   producer's diagnostic group arrays.
2. Only after the fresh derivation is frozen, compare it exactly with the Phase 6 queue.
   Report added, missing and member-drift groups. Expected scoped population is four
   duplicate and 28 semantic groups; equality must be demonstrated, not assumed.
3. Review all 98 cross-area rows mechanically for unique `rowId`, non-empty source
   digest and target step, then deep-read every high-risk/parked row and at least 15%
   (minimum ten) of each homogeneous set. Verify all 13 family routes and the explicit
   coverage of CTR010, four navigation gaps, six stale coordination rows, candidate
   wording/citation defects and A34 residuals.
4. Return `ok | rework | hold` with evidence per reviewed row/group. More than 3%
   rework expands that set to full review. Do not edit candidate content, gates,
   checkers, vocabulary, extractor, comparator or baselines.

## Portable commands and resource note

Run from the repository root with the session variable removed:

```bash
env -u CLAUDE_CODE_SESSION_ID node -e 'const fs=require("fs"),c=require("crypto"); const check=i=>{const x=JSON.parse(fs.readFileSync(i)); for(const p of x.parts){const b=fs.readFileSync(require("path").join(require("path").dirname(i),p.path.split("/").at(-1))); if(b.length!==p.bytes||c.createHash("sha256").update(b).digest("hex")!==p.sha256) throw Error(p.path)}}; check(process.argv[1])' \
  plans/260925-documentation-authority-unification/reports/phase-07/review-input-a38-fresh-inventory-01/index.json

env -u CLAUDE_CODE_SESSION_ID node -e 'const fs=require("fs"),c=require("crypto"); const check=i=>{const x=JSON.parse(fs.readFileSync(i)); for(const p of x.parts){const b=fs.readFileSync(require("path").join(require("path").dirname(i),p.path.split("/").at(-1))); if(b.length!==p.bytes||c.createHash("sha256").update(b).digest("hex")!==p.sha256) throw Error(p.path)}}; check(process.argv[1])' \
  plans/260925-documentation-authority-unification/reports/phase-07/review-input-cross-area-01/index.json
```

The producer's full generator attempts exceeded the available memory/string limits on
the 15 GiB host; the committed file-level projection uses production extractor
primitives and is sufficient for this group derivation. Do not run a full inventory,
global D/E, comparator or `npm test` alongside any other heavy job. If independently
rebuilding the file inventory, run it alone and keep all scratch under
`/tmp/fgos-work/`.

## Unique output paths

- Group derivation: `review-a38-fresh-groups-01.md`.
- Cross-area inventory: `review-a38-cross-area-inventory-01.md`.

No other reviewer writes either path. This request does not authorize review of the
producer's own conclusion by the producer and does not authorize any repository state
transition.
