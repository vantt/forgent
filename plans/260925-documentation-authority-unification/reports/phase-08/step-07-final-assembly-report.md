# Rebuilt final consumer handoff

Source pin: `5e03159334df726e43ffe9505ad4ed43f72ba94d`. Authority: L12-124. Records only; no cutover or independent acceptance.

## Final populations

- Rows: 55658; consumer rows: 19153; rejected rows: 36505.
- Classes: applied-safe: 0; prepared-for-cutover: 787; preserved-history/fixture: 15091; individually parked: 3275; rejected-not-consumer: 36505.
- Final inputs: 130 Step 3 batches / 1,037 records; 33 Step 4 batches / 275 records; 33 Step 5 batches / 1,481 memberships. No pilot directory is read; the loader rejects one.
- Every final Step 3/4 edge is represented independently; these are NOT deduplicated into the Step 5 population. Retiring-tree zero-edge records remain retirement receipts, never patches.
- L12-118..121 original 2,311 members, 2,131 flips, 180 family parks and 34 additional parks remain historical decisions. A later composition park is additive and never cancels their ruling.

## Composition

- One spec per file: 524; composed: 423; named composition parks: 101.
- Every executable spec has one forward diff, rollback diff, before/after SHA-256 and actual patch --fuzz=0 roundtrip in /tmp/fgos-work. All final Step 3/4/5 diff refs and supplemental hunks are co-composed; ambiguous/overlapping/missing hunks park the complete file, not silently omit an edit.
- Render-only/row/generator actions without exact final composition remain owned parks; no hand editing of generated skills or projections is proposed.
- Source drift and its disposition are enumerated in patch-order.sourceRecompositionChecks and step-08-source-recomposition.json. Historical source digests are not overwritten.

## Parks and gates

- All 3275 effective parks are individually owned in step-07-readiness.json#parkOwners, with original record locators and blockers.
- step-08-preflip-gates.json enumerates current-digest changed-binding reviews, L12-96 composition duties, non-behavioral census joins, all 17 dropped claims, Git one-door sites, retention, L12-129 archive/reader/checkout, current-source recomposition, final-code holder Land and staged docs-lease release gates. Every gate is explicitly PRE-FLIP, not met. Disposition-only counts are not readiness. Verify beforeSha256 equality before every patch application; fuzz-zero alone is insufficient. Lead suite and independent closure remain required before close.
- Step 1 current-disposition table: step-08-current-judgments.json (47/47).
- Post-census admission/disposition and parity obligations: step-08-post-census-records.jsonl; no live state, secrets, product code or runtime was read/executed.
- SC2 checks effective classes. The former 7/17/27 versus 8/16/27 split was original versus effective overlay classification, not differing writer populations. New writer expressions include false-positive stderr/validation and non-document destinations, explicitly traced rather than guessed aliases.
- L12-121 post-move premise proof covers 9,650 Step 5 inputs, not the Step 3 preserve population. Step 3/4 preserve premises have a separate pre-flip review gate; no expanded post-move proof is fabricated.

## Reproduce

`python3 -B plans/260925-documentation-authority-unification/reports/phase-08/step-07-assemble.py --final --pin 5e03159334df726e43ffe9505ad4ed43f72ba94d`

Two actual byte-identical runs and all output sizes/hashes are in step-07-final-determinism.json. Total handoff outputs must remain below 8,000,000 bytes. Pair accounting is last and cannot pre-account the future runner commit.
