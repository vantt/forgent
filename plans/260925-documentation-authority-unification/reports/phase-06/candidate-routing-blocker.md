# Candidate routing exposes inherited link failures

State: stopped under stop condition 10. This is not a content ready-for-review request.

## What is complete

- A6 is implemented and exercised: an ordinary committed-report rehearsal approves 40 fixture rows without seeds. The checkpoint rehearsal still catches 6/6 seeded errors with no false flags. No real content row is approved by either rehearsal.
- Frozen maps/counts: `fcfe78cb89585bc9ab23f11bab67d41458834fc4`; all 1,040 legacy source files covered; zero existing area-status changes.
- First header-only completion: `7693331b087e24da2a6bf719f59fc531aac9046c`; 67 Markdown headers completed, one SVG unchanged, 68/68 bodies byte-identical after stripping the immediate fenced metadata header.
- Both prior-registry D proofs after that header commit have zero fatal findings. The scripts suite after the data correction passes 872/872. Ratchet: 995 legacy files, 24 accounted edits and one accounted new file; exit 0. Placement: 446 files, 445 matched, one standing exception, zero leftovers or ambiguities.

## The failed prerequisite and one correction

Check H compares the findings from `node scripts/check-doc-candidate-status.mjs --json` with `candidate-status-baseline.json`; the CLI itself is report-only, so its exit 0 is not a passing H comparison.

The broad agent-coordination route incorrectly put 302 evidence payload Markdown files into the candidate-header check. New `Related` field values also used Markdown-link syntax where the existing checker expects repository paths. Both are executor data errors, not a reason to alter a gate. The correction replaces that broad route with 77 explicit non-payload document routes and reformats 66 new headers' `Related` fields into existing path-list syntax. Body preservation still passes for all 68 files. No gate code, source file, area status, instruction file or main checkout is changed.

After that one correction H remains red:

| Population | Findings |
|---|---:|
| Frozen baseline | 5 |
| Remaining original findings | 4 |
| Newly exposed inherited findings | 41 |
| Current total | 45 |
| Inherited findings in agent-coordination | 15 |
| Inherited findings in host-invocation-routing | 26 |

The 41 inherited findings comprise 36 unresolved links and five unresolved Related paths. For each, the literal reference exists at the frozen map pin and its destination is absent in that same Git tree. Exact type/path/message, resolved destinations, original text hashes and the failed comparison command are committed in `candidate-routing-blocker.json`. The H comparison exits 1 before and after the one data correction; continuing with another fix attempt would violate stop condition 10.

## Why proceeding requires a committed owner decision

Step 1 requires candidate routing before authoring, while H allows only the old five findings. Routing exposes older defects in material H previously did not inspect. Twenty-six findings belong to the next host batch, so completing the current batch cannot satisfy the unchanged global comparison without touching a later batch. The phase permits neither silent re-baselining nor proceeding despite H.

Recommended invocation-only amendment: accept exactly these already-present findings for the expanded routing scope, with no new type/path/message admitted; require the agent findings to close in its batch, host findings in its batch, and all findings to reach zero at closing. No checker code change. Alternative: authorize an early link-only pass for all 41 references before resuming the sequential content batches. Alternative: defer host candidate routing until that batch, explicitly amending the Step 1 routing order.

## Next action and proof boundary

The owner commits an amendment in `owner-answers.md` resolving the H comparison/routing-order conflict. Then resume its exact authorized action, rerun the prerequisite, and finish first-batch candidate/decision authoring to `review-request-2.md`. No content-review request exists yet; no mirror, exact, manual or corpus-rule shard has been written for the first batch.

Archive/delete lists: not authored. Real conflicts and holds: not adjudicated. Promoted edit: agent-coordination portal metadata only, logged in `promoted-edits.md`. Source-to-target manual decisions, independent approval, scoped E and reduced promotion rehearsal remain UNPROVEN. No further tooling re-review is requested.
