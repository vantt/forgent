# A38 request — independent key review and seal

Author session: `codex-session:fgos-run_unit-run-17922255a98df5@2026-10-17`.

Status: ready for a distinct fresh-context reviewer; not a seal or reader launch.

## Independence and input pins

Lead starts a fresh A38 reviewer who authored none of these changes and sees only
this request, the pinned files below, the Phase 7 Step 7/8 contract, L11-1/5/6/10/18
and Phase 6 reader evidence needed to independently check omissions. The key author
must not review/seal it, read as a fresh reader or score the subsequent readers.
The author cannot dispatch under this assignment’s explicit fgOS CLI prohibition;
the Lead owns the next review dispatch after the runner commits. No permission
question or self-review substitutes for that handoff.

Authoring base: `bfca3d5165fb8de8444e2ae0af0c92831bc8a33b` (second main merge `bfca3d516`).
Review the later runner commit containing the exact hashes below. Resolve that
commit from repository history and record it in the verdict; stop on any mismatch.
No reader gets the request, key, proof, gap map, or old reports.

| Input | SHA-256 |
|---|---|
| `plans/260925-documentation-authority-unification/reports/phase-07/step-07-reader-brief.md` | `55abc55f0bd8190420c817b0a93c4c2cdfd1bfd0f8a15e1b8903161f735f9607` |
| `plans/260925-documentation-authority-unification/reports/phase-07/step-07-reader-key.md` | `b7abe144cd2deaf1b8ba166838ebb6bd568cd50f8640b9a7df83ca4b981e6287` |
| `plans/260925-documentation-authority-unification/reports/phase-07/step-07-reader-gap-map.md` | `bb89f34e808c6f64162c9cbda8767bf7dba9df8c55675ab29fc1883c23f656c4` |
| `plans/260925-documentation-authority-unification/reports/phase-07/step-07-proof.json` | `998448812d150c566d8bb28afce102cbb921cfe1f09cf33321cc34fafdd15697` |

Candidate snapshot (full-file hashes; five portal edits logged before mutation in
`post-review-edits.md`; no candidate change after a successful seal):

| Candidate | SHA-256 |
|---|---|
| `docs/platform/README.md` | `e684084bd7f480ceaec329e2bbcee9da6f55db9755436305f7e8619d3b6b63ee` |
| `docs/platform/architecture-map.md` | `62a92dc3cf248e02ffc6be3d341858b3351f2cc3b3c2e90fbc1b6add9099a165` |
| `docs/platform/component-boundary.md` | `65c27c782a9323f723307f2a449ebf0b41efa18a7a341a7e308735296b272871` |
| `docs/platform/event-store/spec.md` | `4348ba168489493017e0c95bfbee0c44fe511f7522d4aeed1d54310aff9ce472` |
| `docs/platform/governance.md` | `0e7d820925c594df12b2895a18158fdb91a2e2c5cf257f5d61463b3e9f7af536` |
| `docs/platform/holder-lock/spec.md` | `e600666ed6bec9809ec377f0254c7c3e2ef5dd1b07e6b5933a7a1fba8bd0b1b7` |
| `docs/platform/platform-foundations.md` | `1cfda337e23e4b5f8a5f1a6cf65346f553a1668c49888ab7b44df02595412223` |
| `docs/platform/process/spec.md` | `dbca061feff054beb0141739936b2e91a127805b80afdf040ba8ec2bd983c28e` |

## Review contract — one bounded request

One logical request, two explicit parts (106 total entries): part 1 has all 51
numbered gap dispositions plus one supplemental-caution check (52); part 2 has 41
anchors, eight candidate snapshots, three scenario checks and two boundary/isolation
checks (54). Each part is below 60 entries and 400 KB. Return a verdict for every
entry; supporting Phase 6 raw evidence must be read to detect omitted gaps.

1. Independently derive gaps from all six Phase 6 reader report batches and their
   keys/raw answers. Compare every gap with the map, including explicit deferred
   reasons. Reject any omitted gap or a deferred content gap disguised as repaired.
2. Extract every key citation yourself. Run the unchanged anchor checker on all 41
   refs and inspect that the cited text supports each intended answer. Existing
   anchors alone are insufficient. Check all new navigation destinations, including
   system-architecture four-file host and imported holder-lock/Process/Event Store.
3. Check each scenario asks six L5 questions plus an authoring probe; recompute the
   required file union and path order witness. A=6, B=5, C=6 with shared support;
   union=8 total, including README. Every intended answer must fit without opening
   legacy, source or separate contract payload files. Verify all required evidence
   is in scope; references to unopened external tests/contracts are pointers only.
4. Validate post-cutover framing in BOTH brief and key, legacy-as-provenance only,
   unknown facts stay unknown and Event Store unsigned draft stays draft. No scenario
   premise is an implementation instruction or an accepted law supersession.
5. Recheck strict scoring: >=5/6 per scenario per reader, partial=0, all three probes
   correct, no fabricated anchors, forbidden reads or legacy owners; global eight
   files, not eight per scenario or before owner. Fresh readers receive brief only
   plus entrypoint and record an ordered complete read log; independent scorer.
6. Recompute light A/B/C/H/I in proof’s stated posture and candidate hashes. Preserve
   imported-route/frozen-I limitation and H’s unrouted-draft limitation; never claim
   native identity or full truth close. No heavy global carry/test needed here.

## Output and seal

Write a new reviewer-only `review-a38-step-07-key-01.md` in this directory (same
assignment CLI/naming override); register it in progress. Identify reviewer session
and authoredBy consistently, reviewed runner commit, all entry verdicts, exact
rework/stop conditions and evidence commands. Do not change candidates or author key.

On rework: report it; **no seal, no reader**. Stops are legacy required as owner,
missing required route/anchor, uncovered gap or ninth needed file; preserve parked
units and return to Step 7. Reworked bytes require a new request/hash and review.

Only on full acceptance: record `sealedAt` (ISO 8601), `keySha256` (full SHA-256
of the exact key file), key path, runner commit, reviewer identity and eight
candidate hashes. Record the seal in your reviewer report, not by changing the key.
This request’s author-supplied hashes are input pins, never a reviewer seal.

Then update Step 7 to accepted and Step 8 to ready, with the seal reference.
No candidate edits are allowed after sealing. Any needed candidate edit invalidates
the seal and returns to Step 7; if Step 9’s carried imports change any answer/route/
anchor, repeat key review and fresh-reader gate. Start timestamps for both new
readers must be later than the reviewer seal, with unchanged key/candidate hashes.

## Review-part pins

| Part | Entries | Bytes | SHA-256 |
|---|---:|---:|---|
| `plans/260925-documentation-authority-unification/reports/phase-07/review-input-step-07-key-01/part-01-gaps.json` | 52 | 12585 | `189eff83f75dbcd87def09ef2985666919567f5e1d451fe7ad85c2383212f226` |
| `plans/260925-documentation-authority-unification/reports/phase-07/review-input-step-07-key-01/part-02-key.json` | 54 | 11155 | `1830cb41c229bad536069cb826c0a0bc88f1b76fed851a7693e3668de1f19458` |
