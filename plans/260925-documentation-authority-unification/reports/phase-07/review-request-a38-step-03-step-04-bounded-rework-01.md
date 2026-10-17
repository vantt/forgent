# A38 bounded re-review request: Steps 3-4 rework

## Independence and output

Use one fresh-context reviewer who authored none of the rows or edits below.
Review only this bounded delta; do not reopen the 20 architecture rows and 13
vocabulary entries already accepted except where explicitly named.

Write the verdict to the unique report path:

`plans/260925-documentation-authority-unification/reports/phase-07/review-a38-step-03-step-04-bounded-rework-01.md`

Return `ok` or `rework` for each of the 15 entries below, then totals and any
remaining stop condition. Read-only/light commands only: `sed`, `rg`, `jq`,
`sha256sum`, `git diff --check`, and `git diff`/`git status`. Do not run fgOS,
native inventory/carry/comparator jobs, tests, or any write command.

## Pinned inputs

| Input | SHA-256 |
|---|---|
| `step-03-contract-boundary-matrix.json` | `c4792192c6ff4d2d10ff41b8c81b436f654fd2dbcd9ef587600ee2ccb276decb` |
| `step-03-checks.json` | `8b9b1049a936efdc3e9a0d8011cb69d585f0eb51486d1665350f67908580d5d9` |
| `cross-area-inventory.json` | `0d27163ea98638b87736d47bee75585f069a3f92ec6d7b623dbfdd06fa0a68db` |
| `step-04-vocabulary-rows.json` | `5be02b95e653a2cdc80ce8831f1e0fb7dc0a35941cd46fe9ea276fda217a544a` |
| `step-04-checks.json` | `00ade9792304648c88668cffdfc36c7b5a9970f51605788ae355c0f009505a1a` |
| `post-review-edits.md` | `74f37454f769e0c62ad453740debd1b49f8e6ec842c70b41daa89f1822f0b52d` |

Candidate edit pins:

| Candidate file | SHA-256 |
|---|---|
| `docs/platform/architecture-map.md` | `62a92dc3cf248e02ffc6be3d341858b3351f2cc3b3c2e90fbc1b6add9099a165` |
| `docs/platform/agent-confinement/history/rollout-and-settled-facts.md` | `7f706076d2ec787168a311fc77b84728c2e59ef7b6f95984b72ad5791bb0e95b` |
| `docs/platform/agent-coordination/contracts/workflow-stage-operation.md` | `3e63f3cc25d8f0a1aa9e7638d8187406ad882796b1f03e9b7ec63d94841b65a3` |
| `docs/platform/agent-coordination/contracts/assignment-run-runresult.md` | `2b262872edf78f55c0857cef5d71e8f3eb617e82ed25a6c51ad942375b4516b3` |
| `docs/platform/proposals/component-authority-boundary-map.md` | `f6b4e0d096d2fbe33f727f2d6736deb69f51e07486157f48b79b243ae36abd12` |

## Exact review entries

### Matrix and routing rows (9)

1. **S3-01:** historical/deferred intent, no id; evidence proves the engine is
   retired and `runPattern` has no cognition producer; visible label routes to
   Step 5 rather than being edited here.
2. **S3-02:** CTR012 is a registry identity for the live workflow-step-operation
   seam; the payload's absent version field is stated honestly and code citations
   cover definition normalization, projection, Assignment copy and refusal.
3. **S3-04:** CTR013 is a registry identity for Assignment; no payload
   contract/schema version is claimed; DispatchPlan stays in `assignment-run.v2`.
4. **S3-09:** covered by CTR001/CTR002 plus S3-08 run-result; no new id;
   `fanout-batch.mjs` RunResult attribution is removed; internal driver mapping is
   queued as `P7-DOC-GAP-01`.
5. **S3-13:** `{command,args[]}` shape citation points to
   `src/runner/dispatch/config.mjs:395`.
6. **S3-14:** confinement is CTR011; `confinement-authority.v1` is explicitly a
   documentation-only registry label, not a code stamp.
7. **S3-15:** Gateway remains CTR010 and now has the missing OpenAPI-backed
   registry row; shipped OpenAPI references are unchanged.
8. **X-DUP-01:** A45 removes the owner block and the row proceeds to Step 6.
9. **X-CTR010-01:** A45 option A resolves the collision and removes the owner
   block.

### Vocabulary row (1)

10. **V-05:** its direct citation is
    `docs/platform/agent-coordination/vocabulary/concept-relationships.md:95-110`;
    the meaning and A43 guard are unchanged.

### Candidate edits (5)

11. **Architecture registry:** CTR010-CTR013 are unique; Gateway points at its
    OpenAPI; confinement's label-only status and both absent payload versions are
    explicit; no separate DispatchPlan id is invented.
12. **Confinement history:** the candidate reference uses CTR011, records A45 and
    keeps the legacy-map edit routed to Phase 9.
13. **Workflow operation contract:** CTR012 is recorded without inventing a
    version field.
14. **Assignment contract:** CTR013, absent schema/version field and existing
    DispatchPlan carriage are all explicit.
15. **Ring proposal pointer:** the ring-to-entity section points to the A43 guard
    and does not change proposal meaning.

## Required aggregate verdict

Confirm or reject all of the following:

- 15/15 entries received a verdict;
- matrix has 22 unique rows, zero current incompatibilities, zero missing ids,
  zero parked rows, six inventory-only rows and one historical/deferred row;
- every Step 3 stop array is empty, so `accepted-pending-review` is truthful;
- A/B/C/G/H/I evidence is internally consistent, with G explicitly bounded and
  fresh native close deferred to Step 9 under L11-2;
- every candidate edit is present in `post-review-edits.md`;
- no code, shipped contract, checker, vocabulary source, extractor, comparator,
  baseline, root instruction or switchboard file changed.

Suggested light checks:

```sh
jq -e '.rows|length==22 and ([.[].id]|unique|length)==22' \
  plans/260925-documentation-authority-unification/reports/phase-07/step-03-contract-boundary-matrix.json
jq '.rows[] | select(.id=="S3-01" or .id=="S3-02" or .id=="S3-04" or .id=="S3-09" or .id=="S3-13" or .id=="S3-14" or .id=="S3-15")' \
  plans/260925-documentation-authority-unification/reports/phase-07/step-03-contract-boundary-matrix.json
jq '.rows[] | select(.rowId=="X-DUP-01" or .rowId=="X-CTR010-01")' \
  plans/260925-documentation-authority-unification/reports/phase-07/cross-area-inventory.json
jq '.rows[] | select(.id=="V-05")' \
  plans/260925-documentation-authority-unification/reports/phase-07/step-04-vocabulary-rows.json
rg -n 'CTR01[0-3]|confinement-authority.v1|fgos-gateway.v1|workflow-step-operation|Assignment' \
  docs/platform/architecture-map.md \
  docs/platform/agent-confinement/history/rollout-and-settled-facts.md \
  docs/platform/agent-coordination/contracts/workflow-stage-operation.md \
  docs/platform/agent-coordination/contracts/assignment-run-runresult.md
git diff --check
```
