# Independent ordinary review request — Step 6 projections

Author session: `codex-session:fgos-run_unit-run-17922205e4d698@2026-10-17`.
Request id: `A38-Step-6-projections-01`. Status: ready; no review verdict claimed.

Lead dispatches ONE fresh-context reviewer who did not author any listed row, under A38/L11-1. Read only this request, its pinned input, the named acceptance rules and source/candidate evidence. Do not inherit author narration as proof. Return a unique report at `plans/260925-documentation-authority-unification/reports/phase-07/review-a38-step-06-projections-01.md`; author and reviewer identities must differ. The reviewer writes only its own report; do not repair candidate, Step 5 or control files.

The one part is `review-input-step-06-01.json`: **58 entries**, 18769 bytes, SHA-256 `1f314f6b3e3b86d23e69b16e7bbb36e49ebb877889ea88f66403245913e87df6`. It pins the four evidence artifacts; `step-06-projections.json#/inputPins` pins the on-disk sources and contextual owners. Review the runner-committed bytes; write the actual content commit and reviewer identity in the report. Digest mismatches are review findings, not permission to quietly repin.

## Acceptance and boundary

Read the Phase 7 file's Step 6 and shared rules, owner answers A45/L11-2/L11-15..17, and Phase 6 owner queue's six named notes. This is candidate review/correction, not authority cutover. Current source and future candidate owner must be distinguished. No Git write, fgOS CLI, `.fgos` access, generator/renderer/checker/baseline edit or working-tree generation. Heavy jobs are unnecessary and must not be requested from reviewers. Step 5 is under a separate review and stays unchanged.

Give a verdict for all 58 ids, with evidence, rather than one group-level blanket approval:

- Four COPY entries: full-read both sides (byte-equal evidence permits one shared text plus exact byte comparison); validate each canonical input, ids/digests, target, manual rule, freshness and meaning. Inspect all Gateway operations, components/security and CTR010/A45 mapping. Ensure schema/config are authored inputs. For manifest prove exactly nine infra additions and no old value changed; root source remains current canonical, candidate noncanonical.
- Two semantic routes: X-SEM-29 → X-DUP-04 and X-SEM-31 → X-DUP-02. There is no second conflicting owner and no premature legacy retirement.
- Six dispositions: distinguish present candidate defect from conditional future re-key and rationale-only notes. Confirm the three reworded work-state target headings, unchanged no-row-spec condition, F10-11 source attribution and existing Step 4 correction. F10-12 numbers are historical; F10-13 equality is not independent proof.
- Forty-three CTX entries: inspect the bound unit plus local context and compare current extractor digest to the reviewed target digest. Preserve legitimate contextual repetitions; source-heading digest need not equal reworded target-heading digest. All are short repeated blocks/headings; full inspection is required, with no sampling substitute.
- Three CONTROL entries: scratch tools were copied/pinned without mutation; UI validation passed but four output digests differ; findings explicitly route output refresh/root certification. Verify candidate-only edit, pre-edit log, pending Step 9 native rebind, unchanged protected/Step 5 bytes and honest check limitations, including red ratchet. A38 independent approval remains pending until you write it.

No author-provided sample or seed exists. The required population is fully reviewed. If you additionally sample any other population, keep your seed until scoring, state the frame and draw, and never replace the 58 required verdicts with that sample. Rationale-only wording is never Phase 7 rework (L10-37). A stop parks only its affected group/subproof; report unrelated verdicts.

## Portable light reproduction

Run from repository root. These commands read existing files only and do not need scratch state, a compiler installation or any heavy job.

```sh
python3 - <<'PYCODE'
from pathlib import Path
import hashlib,json
r=Path('plans/260925-documentation-authority-unification/reports/phase-07')
p=r/'review-input-step-06-01.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='1f314f6b3e3b86d23e69b16e7bbb36e49ebb877889ea88f66403245913e87df6'
x=json.loads(p.read_text())
assert len(x['entries'])==58 and p.stat().st_size<=400000
for a in x['artifacts']:
    assert hashlib.sha256(Path(a['path']).read_bytes()).hexdigest()==a['sha256'], a['path']
y=json.loads((r/'step-06-projections.json').read_text())
for a in y['inputPins']:
    assert hashlib.sha256(Path(a['path']).read_bytes()).hexdigest()==a['sha256'], a['path']
for g in y['groups']:
    assert Path(g['source']).read_bytes()==Path(g['target']).read_bytes(), g['rowId']
print('58 entries; artifact/input pins and all four byte pairs verified')
PYCODE

env -u CLAUDE_CODE_SESSION_ID node plans/260925-documentation-authority-unification/reports/phase-07/step-06-verification.mjs
env -u CLAUDE_CODE_SESSION_ID node scripts/check-doc-candidate-status.mjs --strict --json
env -u CLAUDE_CODE_SESSION_ID node scripts/check-doc-constitution.mjs --no-ledger --check-placement --strict-rows --json
git diff --check
```

The verifier emits all 43 freshly extracted bindings; it does not generate documentation. Review its code before trusting its conclusions. Architecture tests were 27/27; reviewers need not rerun them. Native sync/full inventory/global D/E/comparator/npm test are Step 9 obligations and must not run for this review.

The compact scratch receipt includes hashes, tool manifests and bounded diff excerpts, not the generated HTML. Independently confirm both source actions `A-S02-012/013` exist and the old CSV/navigation output lacks them, and inspect the coverage 42→44 difference. The generator tool chain came from the main checkout, not a versioned compiler in this branch; report that provenance limit. Reproduction of the full 640 KB HTML or compiler rerun is not required to judge the reported drift. Candidate-root certification is explicitly parked rather than passed.

## Reviewer report contract

Use `Reviewer: reviewer:<model>-session:<id>@<YYYY-MM-DD>`, `Review mode: ordinary`, actual content commit and input SHA-256. Include a 58-row `id | ok/rework/parked | evidence and reason` table; source/target digests for the four copy rows and manifest edit. Name any conservation/authority risk separately from wording polish. State required fixes and row-local parks, with counts and no hidden red exits. Inherited ratchet/import and UI-root/output routes can be accepted as honest scoped findings; they cannot be reported as green proofs or silently closed. Do not mark Step 6 accepted yourself; the Lead adjudicates the completed independent report.
