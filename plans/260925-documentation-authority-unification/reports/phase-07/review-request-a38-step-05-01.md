# A38 independent review request: Step 5

Author session: `codex-session:fgos-run_unit-run-17922161b19023@2026-10-17`

One logical request, `a38-step-05-01`. Use a fresh-context independent reviewer
who authored none of these statements or candidate edits. This is a request only;
no reviewer has run, no sample has been selected, and Step 5 is not accepted.

## Pinned inputs and unique outputs

Read `review-input-step-05-01/index.json` first. It pins final author bytes and
names every part and its unique report path. Record the runner commit actually
reviewed, your reviewer identity (`reviewer:<model>-session:<id>@2026-10-17`),
author identity, input pin check, and `Review mode: ordinary` in every report.
Never overwrite an earlier review. Parts are within 60 entries and 400 KB each.

- Bounded entries: 109 statements, 28 distinct A34 representation bindings, six
  control proofs = **143**, in three parts (60/60/23).
- Remainder frame: **22,454** eligible production-extractor units, one compact file
  `step-05-remainder-frame.json` (sorted stable ids, file digests, exclusions,
  `sortedIdsSha256`). Verify it by recomputing membership from the extractor; there
  are no per-part remainder reports.
- Rollup/seed report: `review-a38-step-05-seed-and-rollup-01.md`.

Every received entry gets `ok` or `rework`, note `deep` or `mechanical`, and actual
path/anchor/code evidence. An alignment `deferred` is not a claimed pass of current
truth. The A34 binding entries prove representation, not new independent acceptance.
Return gaps and stops by exact row, risk and owner; park only that row and continue.

## Reviewer-held seed and full-read threshold

Mechanically inspect every bounded and remainder row: schema, unique id,
membership, current file/unit digest, anchor and equality with the pinned part.
Use the production extractor export, never a copied parser. The frame is the
complete current `docs/platform/**/*.md` population: 22,457 units minus exactly
three units (six-row table and two S3-01 labels). A file ownership binding does not
exclude its other statements. History/proposals remain eligible for kind checking;
review must not treat their preserved text as a current implementation guarantee.
Non-Markdown machine contracts/projections remain Step 6 evidence, not sampled prose.

Only you, the independent reviewer, choose a new seed AFTER checking the pinned
frame. Keep it and the draw out of Doer input until scoring is complete. Seed a
reproducible PRNG with your held seed and draw exactly **60** ids without replacement
from the sorted `ids` list (Lead decision L11-16: the remainder draw is a bounded
sensitivity sample, not a truth sweep; full current truth stays Phase 9 under A28
3(b)). Record algorithm/runtime version, seed, `sortedIdsSha256`, selected ids and
selection time in the rollup. No author-selected seed, sample, preferred file set or
hand-picked substitute is permitted. Mandatory rows do not reduce the 60.

Deep-read every drawn unit in both directions with its surrounding section and
diff; classify its remaining statements as vision, specification, architecture,
contract, decision history, proposal or generated projection. Record alignment
`aligned | doc-fix | implementation-gap | deferred`, current code/config/schema
references (or the explicit non-operative/deferred reason), light proof command,
risk and owner. Also deep-read EVERY high-risk/parked bounded row and EVERY source/
target or snapshot digest mismatch. Existing accepted Step 2/3/4 conclusions are
context, not permission to skip a required deep read here.

For each homogeneous population (bounded statements, A34 preservation bindings,
remainder units), publish deep-read denominator and substantive rework numerator.
For the bounded statements and A34 bindings, **more than 3% deep-read rework requires
a full deep read of that population before reporting acceptance.** For the 60-unit
remainder sample, more than 10% (7 or more) substantive candidate-content defects is a
stop: report it for owner escalation instead of expanding the read. List exact expansion scope and completion. Under L10-37,
rationale-only wording with no conservation loss is never rework and never enters
the numerator. Candidate-content defects, lost residuals or incorrect operative
claims remain substantive. Implementation gaps are reported, never repaired.

## Exact acceptance concerns

1. Inventory: ten L11-15 rows (three imported documents plus seven seams),
   authority kinds and Step 5/6/9 routing. All eight main-import identity paths ride
   the Step 9 carry; expected unsynced identity is not itself a stop.
2. Six table rows: only authority-separation edits them; implementation alignment
   then reads final bytes. Current graph, reviewed rounds, checker/panel context,
   sequencing/bind, scoped mutation and Workflow task dispatch cite real code.
   Old optional-round/visibility/Team Cognition text stays historical/proposal.
3. S3-01: visible historical/deferred labels at both named component-boundary
   sections; no current Team Cognition producer or invented contract id.
4. A34: all 28 verbatim residuals, hashes, owners and activation obligations survive.
   Thirteen retiring-legacy successors must be re-homed at Phase 9. The old count
   “12” is inherited rationale-only accounting; do not reopen that wording.
5. Authority: no candidate promotion, proposal activation, new current writer or
   implementation repair. Thirteen aligned rows are bounded seam/citation checks;
   89 deferred rows do not claim whole-file implementation truth.
6. Mechanical boundaries: A/B/C/H/I pass at the declared scope; G reran unchanged
   category validators over persisted identity with zero loss/self-review. Fresh
   native close remains Step 9. PARK-PROTECTED-01 stays visibly false because the
   imported reading-map retains branch material and differs from main-parent;
   assess provenance without fixing a protected file or waiving the raw check.
7. Exactly two candidate files changed in this author turn; both are digest-bound
   in `post-review-edits.md`. No code, shipped contract, gate, checker, extractor,
   vocabulary, comparator, baseline, instruction or switchboard authored change.

## Portable light verification

No fgOS CLI, native sync/full inventory/global comparator, full tests, service
startup or writes outside your distinct report paths. Read-only `git`, `rg`, `sed`,
Python/Node and SHA-256 are enough. Run one command at a time on this host.

```sh
# Inventory / row totals and pins: no native registry or global inventory needed.
python3 - <<'PYVERIFY'
import json, pathlib, hashlib
r=pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-07')
i=json.loads((r/'review-input-step-05-01/index.json').read_text())
for p in i['pins']+i['parts']:
    b=pathlib.Path(p['path']).read_bytes()
    assert hashlib.sha256(b).hexdigest()==p['sha256'], p['path']
    assert len(b)==p['bytes'], p['path']
for p in i['parts']:
    j=json.loads(pathlib.Path(p['path']).read_text())
    assert len(j['entries'])<=60 and p['bytes']<=400000
f=json.loads(pathlib.Path(i['remainderFrameIndex']).read_text())
ids=f['ids']
assert ids==sorted(ids) and len(ids)==len(set(ids))==f['count']==22454
assert hashlib.sha256('\n'.join(ids).encode()).hexdigest()==f['sortedIdsSha256']
print('pins/part limits/stable-id uniqueness OK; seed/draw still reviewer-owned')
PYVERIFY

git diff --check
# Before the runner commit: git diff HEAD -- <the two candidates>.
# After it: git diff 21555f026 HEAD -- <the two candidates>.
sed -n '405,440p' docs/platform/system-architecture/architecture/architecture-intent.md
sed -n '175,205p;775,810p' docs/platform/component-boundary.md
sed -n '137,178p;280,315p' src/runner/execution/patterns/reviewed.mjs
sed -n '34,46p' src/runner/execution/patterns/index.mjs
sed -n '206,240p' packages/process/rust/src/facts.rs
sed -n '40,100p' packages/process/rust/src/lib.rs
sed -n '2223,2258p' src/setup/registrations.mjs
# Provenance: the raw blob inequality must remain visible.
git rev-parse 21555f026:docs/specs/reading-map.md 21555f026^2:docs/specs/reading-map.md
git diff 21555f026^2 21555f026 -- docs/specs/reading-map.md
```

For mechanical frame-unit verification, import
`extractMarkdownConservationUnits` from `scripts/generate-doc-inventory.mjs`.
Cache each file once (611 small Markdown reads), map its anchors to returned
`textDigest/startLine/endLine/unitKind`, recompute stable id as
`REM-UNIT-` + first 24 hex SHA-256 of `path + '#' + anchor`, and compare every frame
row. Compare complete extractor membership minus `exclusions.json`, not only
submitted ids. No native inventory/identity job or external scratch is required.
Read every selected unit with its enclosing heading/context; table/proposal/current
statement mixtures must receive distinct kind/alignment notes. Use the original
source or `git show` for the reverse/diff read.

Finish the rollup with all-part completion, ordinary verdict totals, seeded draw,
mandatory deep-read ids, per-set rework calculation/expansion, remaining stops,
implementation gaps, and whether Step 5 can be accepted. Partial reviewer work is
`reviewing`; do not declare completion just because the author delivered a frame.

## Lead edit (2026-10-17, L11-16)

The Lead replaced the 375-part remainder frame (about 18 MB) with the compact
`step-05-remainder-frame.json` and set the remainder draw to 60 with a 10% owner-
escalation stop. Bounded entries, their parts and all other pins are unchanged.
