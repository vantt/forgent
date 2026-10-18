# Phase 7 sensitivity pack (30 records)

Review each record independently against the repository at commit `681a86005` (HEAD of the read-only checkout at /home/vantt/projects/forgentX-s8-review) or `e6b7efeec` as the commands state. Each record shows the claim as written and the commands a reviewer would run. Report, per record, VERIFIED or DEFECT with the exact evidence. Do not assume any record is correct or defective.

## Record 01  (rebind: current-1128)

Claim:
```json
{
 "entry": "current-1128",
 "claimId": "claim_7bc50fc1889ea762eafd8351ee0d0877",
 "sourcePath": "docs/platform/system-architecture/architecture/architecture-intent.md",
 "unitKind": "heading",
 "sourceAnchor": "12-architecture-change-size",
 "lines": [
  430,
  430
 ],
 "sourceUnitDigest": "210c880d777d8711312d4a364a697c1925d1ef719f824dfeacc48bb8ee66d82d",
 "contentCommit": "e6b7efeec",
 "disposition": "native claim carried; rebind to current unit, reviewStatus pending"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:plans/260925-documentation-authority-unification/reports/phase-07/review-input-step-09-package-02/part-020.json | jq -c --arg e current-1128 '.entries[]|select(.entry==$e)|[.path,.tuple[2],.tuple[3],.tuple[5],.native.sourceAnchor,.native.sourceUnitDigest]'   # index row: digest/anchor of this entry (heading unit digests come from the production extractor and are not shell-reproducible)
git show e6b7efeec:docs/platform/system-architecture/architecture/architecture-intent.md | sed -n '430p'   # heading text; its GitHub-style slug must equal sourceAnchor
```

## Record 02  (contract: S3-07)

Claim:
```json
{
 "id": "S3-07",
 "producer": "worker",
 "consumers": [
  "Run Result Evaluator"
 ],
 "contractId": "agent-result-claim",
 "version": "2",
 "payloadTransport": "atomic JSON result claim and evidence refs",
 "compatibilityFailure": "invalid claim is evidence of failure, never success",
 "implementationEvidence": [
  "src/runner/dispatch/agent-result-claim-contract.mjs:45",
  "src/runner/dispatch/run-result.mjs:486-531"
 ],
 "owner": "Run Result Evaluator",
 "authorities": {
  "stateWrite": "worker writes claim; evaluator writes RunResult",
  "decision": "worker claim is untrusted",
  "runtime": "none"
 },
 "candidateSource": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
 "status": "compatible"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:src/runner/dispatch/agent-result-claim-contract.mjs | sed -n '5,5p'
git show 681a86005:src/runner/dispatch/run-result.mjs | sed -n '486,531p'
git show 681a86005:docs/platform/architecture-map.md | sed -n 444,452p   # contract registry rows: id, boundary, state, defining doc
git show 681a86005:docs/platform/agent-coordination/contracts/assignment-run-runresult.md | grep -n -i "Registry identity\|CTR0"
```

## Record 03  (rebind: current-0281)

Claim:
```json
{
 "entry": "current-0281",
 "claimId": "claim_884042a8418894855fefaf00d1a3a75f",
 "sourcePath": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
 "unitKind": "unheaded-block",
 "sourceAnchor": "unheaded-block-47",
 "lines": [
  340,
  341
 ],
 "sourceUnitDigest": "7ecbfde0b13952ce60d4c6064436ec1734b1d491c54814c38d6a16ff3f10ddcf",
 "contentCommit": "e6b7efeec",
 "disposition": "native claim carried; rebind to current unit, reviewStatus pending"
}
```

Verify with (run from the repo root):
```sh
git show e6b7efeec:docs/platform/agent-coordination/contracts/assignment-run-runresult.md | sed -n '340,341p' | perl -pe 'chomp if eof' | sha256sum   # must equal sourceUnitDigest
git show e6b7efeec:docs/platform/agent-coordination/contracts/assignment-run-runresult.md | sed -n '340,341p'   # block must carry no heading line; anchor is the nth unheaded block of the file
```

## Record 04  (alignment: X-MAIN-02)

Claim:
```json
{
 "id": "X-MAIN-02",
 "authorityKind": "specification",
 "statement": "Process owns tuple facts and identity-safe control; unsupported domain kinds stay Unknown/Refused.",
 "statementPath": "docs/platform/process/spec.md",
 "statementFileSha256": "dbca061feff054beb0141739936b2e91a127805b80afdf040ba8ec2bd983c28e",
 "alignment": "aligned",
 "alignmentMeaning": "L11-15 main-import ownership/contract seam verified against present code/config/schema; Step 6 checks source/projection and Step 9 carries native identities. Whole-document full truth is not claimed.",
 "evidence": [
  {
   "ref": "packages/process/rust/src/facts.rs:206-240",
   "fileSha256": "895c2b9dc793b12a1a9be3e4578df08bb6027341f5293122cd5559c5efda74fa",
   "kind": "code/config/schema",
   "role": "current implementation evidence"
  },
  {
   "ref": "packages/process/rust/src/lib.rs:40-100",
   "fileSha256": "91647b86766beb8f380437c45ae043dc2c0b4b98ab457c854dd4bf06033a169f",
   "kind": "code/config/schema",
   "role": "current implementation evidence"
  },
  {
   "ref": "src/runner/dispatch/process-identity.mjs:122-160",
   "fileSha256": "1ad61ab28aaebe81701c27792f849207b610ccb72f900c9e4e37babf9347e08a",
   "kind": "code/config/schema",
   "role": "current implementation evidence"
  }
 ],
 "owner": "docs/platform/process/spec.md",
 "route": "Step 5; Step 6; Step 9",
 "risk": "high"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:docs/platform/process/spec.md | sha256sum   # must equal statementFileSha256
git show 681a86005:packages/process/rust/src/facts.rs | sha256sum   # must equal evidence fileSha256 895c2b9dc793...
git show 681a86005:packages/process/rust/src/facts.rs | sed -n '206,240p'   # cited span
git show 681a86005:packages/process/rust/src/lib.rs | sha256sum   # must equal evidence fileSha256 91647b86766b...
git show 681a86005:packages/process/rust/src/lib.rs | sed -n '40,100p'   # cited span
git show 681a86005:src/runner/dispatch/process-identity.mjs | sha256sum   # must equal evidence fileSha256 1ad61ab28aae...
git show 681a86005:src/runner/dispatch/process-identity.mjs | sed -n '122,160p'   # cited span
```

## Record 05  (alignment: X-STALE-03)

Claim:
```json
{
 "id": "X-STALE-03",
 "authorityKind": "architecture",
 "statement": "Checkers see producer results, are read-only and declare independence from producer; panel synthesis waits for every seat. No blanket sibling-isolation claim.",
 "statementPath": "docs/platform/system-architecture/architecture/architecture-intent.md",
 "statementFileSha256": "82b51061421d4995781ac999111d8a1bb4479f0b1b6180afabcdbf2928d928c2",
 "alignment": "doc-fix",
 "alignmentMeaning": "Authority-separation subpass corrected this exact row; alignment subpass verifies the final bytes without rewriting. Remaining V1 intent is historical/proposal.",
 "evidence": [
  {
   "ref": "src/runner/execution/patterns/reviewed.mjs:280-315",
   "fileSha256": "263a1263ccd9462d6b8b1cc32cc268b02d051ac05e8370dc1e70f879caca8ec0",
   "kind": "code/config/schema",
   "role": "current implementation evidence"
  },
  {
   "ref": "src/runner/execution/patterns/panel.mjs:57-120",
   "fileSha256": "98ada7515c42528809070a1b752927dd05595b33ce4cef064a0433644a1dc85a",
   "kind": "code/config/schema",
   "role": "current implementation evidence"
  },
  {
   "ref": "src/runner/execution/run.mjs:516-538",
   "fileSha256": "26a4da1545011b427859dcaf05a8203b90fd3749de1fda35f2384ccbecbcd779",
   "kind": "code/config/schema",
   "role": "current implementation evidence"
  }
 ],
 "owner": "docs/platform/system-architecture/architecture/architecture-intent.md",
 "route": "Step 5",
 "risk": "high"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:docs/platform/system-architecture/architecture/architecture-intent.md | sha256sum   # must equal statementFileSha256
git show 681a86005:src/runner/execution/patterns/reviewed.mjs | sha256sum   # must equal evidence fileSha256 263a1263ccd9...
git show 681a86005:src/runner/execution/patterns/reviewed.mjs | sed -n '280,315p'   # cited span
git show 681a86005:src/runner/execution/patterns/panel.mjs | sha256sum   # must equal evidence fileSha256 98ada7515c42...
git show 681a86005:src/runner/execution/patterns/panel.mjs | sed -n '57,120p'   # cited span
git show 681a86005:src/runner/execution/run.mjs | sha256sum   # must equal evidence fileSha256 26a4da154501...
git show 681a86005:src/runner/execution/run.mjs | sed -n '516,538p'   # cited span
```

## Record 06  (rebind: current-0322)

Claim:
```json
{
 "entry": "current-0322",
 "claimId": "claim_568f01ef849f421829301c6915bb229a",
 "sourcePath": "docs/platform/component-boundary.md",
 "unitKind": "heading",
 "sourceAnchor": "added-in-candidate-component-boundary-advisory-source-carriage",
 "lines": [
  106,
  106
 ],
 "sourceUnitDigest": "f1c3eb7baa65505f9f680c1a52a1ee64950b98f9b8af505785789ed587b2e985",
 "contentCommit": "e6b7efeec",
 "disposition": "native claim carried; rebind to current unit, reviewStatus pending"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:plans/260925-documentation-authority-unification/reports/phase-07/review-input-step-09-package-02/part-019.json | jq -c --arg e current-0322 '.entries[]|select(.entry==$e)|[.path,.tuple[2],.tuple[3],.tuple[5],.native.sourceAnchor,.native.sourceUnitDigest]'   # index row: digest/anchor of this entry (heading unit digests come from the production extractor and are not shell-reproducible)
git show e6b7efeec:docs/platform/component-boundary.md | sed -n '106p'   # heading text; its GitHub-style slug must equal sourceAnchor
```

## Record 07  (contract: S3-04)

Claim:
```json
{
 "id": "S3-04",
 "producer": "Assignment builder",
 "consumers": [
  "Dispatch Control Plane"
 ],
 "contractId": "CTR013",
 "version": null,
 "payloadTransport": "immutable persisted Assignment; current payload has no contract/schema version field",
 "compatibilityFailure": "Assignment validation/admission fails closed; policy/normalizer stamps do not claim a payload version",
 "implementationEvidence": [
  "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
  "src/runner/dispatch/assignment.mjs:443-444,626-628",
  "src/runner/dispatch/plan.mjs:56",
  "src/runner/dispatch/assignment-runner.mjs:1570-1583"
 ],
 "owner": "Assignment builder -> Dispatch Control Plane",
 "authorities": {
  "stateWrite": "Assignment repository",
  "decision": "Dispatch alone resolves concrete binding; DispatchPlan remains inside assignment-run.v2",
  "runtime": "none"
 },
 "candidateSource": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
 "status": "compatible"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:docs/platform/agent-coordination/contracts/assignment-run-runresult.md | head -40
git show 681a86005:src/runner/dispatch/assignment.mjs | sed -n '443,444p'
git show 681a86005:src/runner/dispatch/assignment.mjs | sed -n '626,628p'
git show 681a86005:src/runner/dispatch/plan.mjs | sed -n '56,56p'
git show 681a86005:src/runner/dispatch/assignment-runner.mjs | sed -n '1570,1583p'
git show 681a86005:docs/platform/architecture-map.md | sed -n 444,452p   # contract registry rows: id, boundary, state, defining doc
git show 681a86005:docs/platform/agent-coordination/contracts/assignment-run-runresult.md | grep -n -i "Registry identity\|CTR0"
```

## Record 08  (routing: QF-12)

Claim:
```json
{
 "entry": "QF-12",
 "rowId": "QF-12",
 "source": {
  "path": "plans/260925-documentation-authority-unification/phase-07-cross-area-integrity-and-fresh-reader-review.md",
  "selector": {
   "line": 207
  },
  "digest": "0218679c14adf2c68cc2e5b4186e270ea61bc0a7aa974eb7715cd761536601ef",
  "encoding": "exact UTF-8 line without line terminator",
  "content": "| 12 — stale citations/projections | GRP-LIVE-01/GRP-HEAD-02/GRP-SPECS-03 and F10-11/12/13 to Step 6; candidate TRUTH/C1 defects to Steps 4-6; remaining promotion truth to Phase 9. |"
 },
 "target": {
  "path": "plans/260925-documentation-authority-unification/phase-07-cross-area-integrity-and-fresh-reader-review.md",
  "selector": {
   "line": 207
  },
  "digest": "0218679c14adf2c68cc2e5b4186e270ea61bc0a7aa974eb7715cd761536601ef",
  "encoding": "exact UTF-8 line without line terminator",
  "content": "| 12 — stale citations/projections | GRP-LIVE-01/GRP-HEAD-02/GRP-SPECS-03 and F10-11/12/13 to Step 6; candidate TRUTH/C1 defects to Steps 4-6; remaining promotion truth to Phase 9. |"
 },
 "route": "Steps 4-6 named; Phase 9 remaining truth"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:plans/260925-documentation-authority-unification/phase-07-cross-area-integrity-and-fresh-reader-review.md | sed -n '207p' | perl -pe 'chomp if eof' | sha256sum   # must equal source.digest, and the line must equal source.content
git show e6b7efeec:plans/260925-documentation-authority-unification/phase-07-cross-area-integrity-and-fresh-reader-review.md | sed -n '207p'   # target location
```

## Record 09  (rebind: current-0973)

Claim:
```json
{
 "entry": "current-0973",
 "claimId": "claim_6992c949b0d3611533d1871844b99653",
 "sourcePath": "docs/platform/platform-foundations.md",
 "unitKind": "unheaded-block",
 "sourceAnchor": "unheaded-block-48",
 "lines": [
  271,
  277
 ],
 "sourceUnitDigest": "59ad8d3e401e36258a8527c29f47108347fe8192b254faa08ab12c8fc960f212",
 "contentCommit": "e6b7efeec",
 "disposition": "native claim carried; rebind to current unit, reviewStatus pending"
}
```

Verify with (run from the repo root):
```sh
git show e6b7efeec:docs/platform/platform-foundations.md | sed -n '271,277p' | perl -pe 'chomp if eof' | sha256sum   # must equal sourceUnitDigest
git show e6b7efeec:docs/platform/platform-foundations.md | sed -n '271,277p'   # block must carry no heading line; anchor is the nth unheaded block of the file
```

## Record 10  (rebind: current-0303)

Claim:
```json
{
 "entry": "current-0303",
 "claimId": "claim_cad03b7898e916cdd85d96ec97396a40",
 "sourcePath": "docs/platform/architecture-map.md",
 "unitKind": "heading",
 "sourceAnchor": "x-slice-live-tính-năng-xuyên-tầng-trỏ-về-component",
 "lines": [
  414,
  414
 ],
 "sourceUnitDigest": "9d3926836cdbfe37dc0901b2c6237fedc0bf06beecec3160f2f683868f3a92cf",
 "contentCommit": "e6b7efeec",
 "disposition": "native claim carried; rebind to current unit, reviewStatus pending"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:plans/260925-documentation-authority-unification/reports/phase-07/review-input-step-09-package-02/part-019.json | jq -c --arg e current-0303 '.entries[]|select(.entry==$e)|[.path,.tuple[2],.tuple[3],.tuple[5],.native.sourceAnchor,.native.sourceUnitDigest]'   # index row: digest/anchor of this entry (heading unit digests come from the production extractor and are not shell-reproducible)
git show e6b7efeec:docs/platform/architecture-map.md | sed -n '414p'   # heading text; its GitHub-style slug must equal sourceAnchor
```

## Record 11  (alignment: X-STALE-02)

Claim:
```json
{
 "id": "X-STALE-02",
 "authorityKind": "architecture",
 "statement": "reviewed has real maxRounds, parameters/config/default 2, preserving round results.",
 "statementPath": "docs/platform/system-architecture/architecture/architecture-intent.md",
 "statementFileSha256": "82b51061421d4995781ac999111d8a1bb4479f0b1b6180afabcdbf2928d928c2",
 "alignment": "doc-fix",
 "alignmentMeaning": "Authority-separation subpass corrected this exact row; alignment subpass verifies the final bytes without rewriting. Remaining V1 intent is historical/proposal.",
 "evidence": [
  {
   "ref": "src/runner/execution/patterns/reviewed.mjs:137-178,222-227,365-397",
   "fileSha256": "263a1263ccd9462d6b8b1cc32cc268b02d051ac05e8370dc1e70f879caca8ec0",
   "kind": "code/config/schema",
   "role": "current implementation evidence"
  }
 ],
 "owner": "docs/platform/system-architecture/architecture/architecture-intent.md",
 "route": "Step 5",
 "risk": "high"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:docs/platform/system-architecture/architecture/architecture-intent.md | sha256sum   # must equal statementFileSha256
git show 681a86005:src/runner/execution/patterns/reviewed.mjs | sha256sum   # must equal evidence fileSha256 263a1263ccd9...
git show 681a86005:src/runner/execution/patterns/reviewed.mjs | sed -n '137,178p'   # cited span
git show 681a86005:src/runner/execution/patterns/reviewed.mjs | sed -n '222,227p'   # cited span
git show 681a86005:src/runner/execution/patterns/reviewed.mjs | sed -n '365,397p'   # cited span
```

## Record 12  (rebind: current-0379)

Claim:
```json
{
 "entry": "current-0379",
 "claimId": "claim_f14f5fe8d3120693dd5fb66cdf293884",
 "sourcePath": "docs/platform/component-boundary.md",
 "unitKind": "unheaded-block",
 "sourceAnchor": "unheaded-block-81",
 "lines": [
  664,
  665
 ],
 "sourceUnitDigest": "8487a251571cbbde59755701bf076c29d2c4b863752917a9e1b6e1ce985c64ba",
 "contentCommit": "e6b7efeec",
 "disposition": "native claim carried; rebind to current unit, reviewStatus pending"
}
```

Verify with (run from the repo root):
```sh
git show e6b7efeec:docs/platform/component-boundary.md | sed -n '664,665p' | perl -pe 'chomp if eof' | sha256sum   # must equal sourceUnitDigest
git show e6b7efeec:docs/platform/component-boundary.md | sed -n '664,665p'   # block must carry no heading line; anchor is the nth unheaded block of the file
```

## Record 13  (contract: S3-11)

Claim:
```json
{
 "id": "S3-11",
 "producer": "all mutation callers",
 "consumers": [
  "state store"
 ],
 "contractId": "CTR004",
 "version": "event schema v2 / current work schema",
 "payloadTransport": "in-process store facade and JSONL events",
 "compatibilityFailure": "unknown versions/cycles fail closed; one writer per mutation door",
 "implementationEvidence": [
  "docs/platform/architecture-map.md:447",
  "src/state/store.mjs",
  "src/state/dep-graph.mjs"
 ],
 "owner": "Work state store",
 "authorities": {
  "stateWrite": "store only",
  "decision": "FSM/domain rules",
  "runtime": "none"
 },
 "candidateSource": "docs/platform/architecture-map.md",
 "status": "compatible"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:docs/platform/architecture-map.md | sed -n '447,447p'
git show 681a86005:src/state/store.mjs | head -40
git show 681a86005:src/state/dep-graph.mjs | head -40
git show 681a86005:docs/platform/architecture-map.md | sed -n 444,452p   # contract registry rows: id, boundary, state, defining doc
git show 681a86005:docs/platform/architecture-map.md | grep -n -i "Registry identity\|CTR0"
```

## Record 14  (rebind: current-0914)

Claim:
```json
{
 "entry": "current-0914",
 "claimId": "claim_dc31e1f1fc889f3a55d928fb989135bf",
 "sourcePath": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
 "unitKind": "heading",
 "sourceAnchor": "doctor",
 "lines": [
  202,
  202
 ],
 "sourceUnitDigest": "46e577d2b998c461b59b0c7cf64e9dc454a144674578ad5cbfeb9d3337e2d2a2",
 "contentCommit": "e6b7efeec",
 "disposition": "native claim carried; rebind to current unit, reviewStatus pending"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:plans/260925-documentation-authority-unification/reports/phase-07/review-input-step-09-package-02/part-019.json | jq -c --arg e current-0914 '.entries[]|select(.entry==$e)|[.path,.tuple[2],.tuple[3],.tuple[5],.native.sourceAnchor,.native.sourceUnitDigest]'   # index row: digest/anchor of this entry (heading unit digests come from the production extractor and are not shell-reproducible)
git show e6b7efeec:docs/platform/packaging-distribution/contracts/setup-doctor-registry.md | sed -n '202p'   # heading text; its GitHub-style slug must equal sourceAnchor
```

## Record 15  (accounting: accounting-ratchet-0004)

Claim:
```json
{
 "entry": "accounting-ratchet-0004",
 "path": "docs/specs/reading-map.md",
 "after": {
  "path": "docs/specs/reading-map.md",
  "kind": "allowed-edit",
  "rationale": "Phase 01 verified stale standing route correction: update transitional rule banner to cite docs/transitional-switchboard.md, record Phase 00 and Phase 01 completion, and replace defunct fgos-coding-compounding skill references with fgos-coding-knowledge. Re-reviewed 2026-09-29 after main sync: feat(coding): convert fgos-plan-loop/fgos-code-panel to deprecated stubs (Unit I29) Re-accounted 2026-10-06: Main-side docs edit carried in by sync of main at 2fd5cb6a3 (2026-10-06, 8 commit(s) since 81f7db801): docs(observe): record the second acceptance round and correct the evidence wording | feat(observe): see nested runs, add unit summaries, a stance sensor and an eval store | docs(gateway): name the fgos gateway as its own component and guard the retired names (+5 more) A31 upstream boundary merge from 554401219ddbc4676c3b57381a468904442855e9: import main source bytes, preserve candidate relocation shape; independent merge/conservation review pending. A31 SYNC 59b9b7087: main Session Identity change imported unchanged; changed spans carried verbatim into the mapped candidate and changed units re-decided pending independent review. No authority flip. L11-21 close-pin accounting 2026-10-18: main imports through eab4d617b; carried main commits: fccd2218a5f64f04a69996a5ddbe355dbd6039c1 merge: bring main with the holder-lock Rust callers into the main door integration branch | dc6600a1ec8dec22a6294805062e377ac85620e7 merge: bring the main door integration branch into the doctor and docs phase | f9ea9c2197a5b4daa7c6d1ba7a47bfcdbd5109aa docs(agents): deliver L1-L10, the design principles and the reuse rule where agents read them | 9a5cc2df7b09e7f63de828a694c81b1784da5498 docs(holder-lock): describe the cut-over kernel locks, the doctor checks and fixes, and the changelog of the cutover | b9a00c589d02f0afeebcce671cf3912dc37ffe50 docs(holder-lock): specify main checkout single door, hot state mutex, worktree-admin and lock fence | 0e377d7b6dd3094021e1bb2be2c4a359a465a77c docs(holder-lock): add holder-lock and process specs, boundary rows, doctor/setup/activation rules. No authority or content approval; independent changed-row review owed. PARK-PROTECTED-01: branch preserves current fgos-coding-knowledge; main says fgos-coding-compounding. Inherited B0/merge-parent provenance is recorded; literal equality is false.",
  "approvedBy": "Phase 01 unification authorization (asgn_pi_lead_phase01_op_001); human approval 2026-09-29 (user, forgentX session); resume sync authorized by user 2026-10-06 (resume prompt prompt-261006-1533-resume-documentation-authority-unification); recorded as accounted main-side edit, per-file content review pending (see plans/reports resume report); Lead L11-21 (2026-10-18), accounting only",
  "owner": "documentation-authority-unification-lead",
  "expectedDigest": "ff12350c5548d1ec2832998c15bc38bf7866b055a7294d451b846fc44089d91f",
  "reviewedAt": "2026-10-06",
  "revisitTrigger": "Phase 08 cutover (retirement of legacy reading-map in favor of docs/reading-map.md)"
 },
 "mainCommits": [
  "fccd2218a5f64f04a69996a5ddbe355dbd6039c1 merge: bring main with the holder-lock Rust callers into the main door integration branch",
  "dc6600a1ec8dec22a6294805062e377ac85620e7 merge: bring the main door integration branch into the doctor and docs phase",
  "f9ea9c2197a5b4daa7c6d1ba7a47bfcdbd5109aa docs(agents): deliver L1-L10, the design principles and the reuse rule where agents read them",
  "9a5cc2df7b09e7f63de828a694c81b1784da5498 docs(holder-lock): describe the cut-over kernel locks, the doctor checks and fixes, and the changelog of the cutover",
  "b9a00c589d02f0afeebcce671cf3912dc37ffe50 docs(holder-lock): specify main checkout single door, hot state mutex, worktree-admin and lock fence",
  "0e377d7b6dd3094021e1bb2be2c4a359a465a77c docs(holder-lock): add holder-lock and process specs, boundary rows, doctor/setup/activation rules"
 ]
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:docs/specs/reading-map.md | sha256sum   # must equal after.expectedDigest
git show -s --format="%H %s" fccd2218a5f64f04a69996a5ddbe355dbd6039c1   # cited main commit must exist with this subject
git show -s --format="%H %s" dc6600a1ec8dec22a6294805062e377ac85620e7   # cited main commit must exist with this subject
git show -s --format="%H %s" f9ea9c2197a5b4daa7c6d1ba7a47bfcdbd5109aa   # cited main commit must exist with this subject
git show -s --format="%H %s" 9a5cc2df7b09e7f63de828a694c81b1784da5498   # cited main commit must exist with this subject
git show -s --format="%H %s" b9a00c589d02f0afeebcce671cf3912dc37ffe50   # cited main commit must exist with this subject
git show -s --format="%H %s" 0e377d7b6dd3094021e1bb2be2c4a359a465a77c   # cited main commit must exist with this subject
```

## Record 16  (rebind: current-1136)

Claim:
```json
{
 "entry": "current-1136",
 "claimId": "claim_f8a9d4e67202c6e0baeab16e124dcd57",
 "sourcePath": "docs/platform/work-state/README.md",
 "unitKind": "heading",
 "sourceAnchor": "3-document-map",
 "lines": [
  48,
  48
 ],
 "sourceUnitDigest": "4e6d7bbc90fe594a85b59680da7e9631bdbae1f41127a43db7b03993b2563949",
 "contentCommit": "e6b7efeec",
 "disposition": "native claim carried; rebind to current unit, reviewStatus pending"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:plans/260925-documentation-authority-unification/reports/phase-07/review-input-step-09-package-02/part-020.json | jq -c --arg e current-1136 '.entries[]|select(.entry==$e)|[.path,.tuple[2],.tuple[3],.tuple[5],.native.sourceAnchor,.native.sourceUnitDigest]'   # index row: digest/anchor of this entry (heading unit digests come from the production extractor and are not shell-reproducible)
git show e6b7efeec:docs/platform/work-state/README.md | sed -n '48p'   # heading text; its GitHub-style slug must equal sourceAnchor
```

## Record 17  (a34: X-A34-25)

Claim:
```json
{
 "rowId": "X-A34-25",
 "claimId": "claim_072766aafbaf01714df1aa65347a1d24",
 "sourcePath": "docs/specs/runner.md",
 "sourceUnitDigestAtReviewedDecision": "f503ccc86158d7a9b67881c8983a4acb08172087f1d5f736628e21ef3832a0b2",
 "targetOwner": "docs/specs/runner.md",
 "targetAnchor": "unheaded-block-90",
 "residualFile": "plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json",
 "residualFileSha256": "4be07f52fd5557aff9e7f8635365904db945bffc5400c481f191fdfe85652c9f",
 "residualPayloadSha256": "6516be6ac5cb103b5616f5df325fc593a00c484c50c6f44a6c490fd0ecc2c3fa",
 "verbatimPayload": "  2. Mọi thứ Work-aware chuyển ra tầng Work: `src/runner/operation-choice.mjs` (chọn operation cho bước hiện tại, trước ở `dispatch/`), `src/runner/work-dispatch.mjs` (`spawnWorker`, `resolveAgentTypeForWork`, `resolveWorkForDispatch`, `workDispatchContext`), `src/runner/work-compat.mjs` (`executorIdForWork`, `buildPrompt`, `workCapabilityHints`). Dispatch nhận vào đầu đã phân giải: `workExecutorId` (plan), `capabilityHints`/`agentType` (`executeExecutorCli`/`executeAssignment`), và hook `resolveWork` cho `decide --work` — `dispatch/cli.mjs` không còn bộ đọc event Work riêng, không còn bản chép đồ thị stage.",
 "owner": "docs/specs/runner.md",
 "status": "preserved; Step 9 rebind if affected; Phase 9 activation remains blocked"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json | sha256sum   # must equal residualFileSha256
git show 681a86005:plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json | jq -j --arg c claim_072766aafbaf01714df1aa65347a1d24 '.. | objects | select(.claimId==$c and has("residualText")) | .residualText' | sha256sum   # must equal residualPayloadSha256
git show 681a86005:plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json | jq -r --arg c claim_072766aafbaf01714df1aa65347a1d24 '.. | objects | select(.claimId==$c and has("residualText")) | .residualText'   # verbatimPayload must equal this text exactly
```

## Record 18  (rebind: current-0520)

Claim:
```json
{
 "entry": "current-0520",
 "claimId": "claim_513c614980b23dae371ec6ab9a768764",
 "sourcePath": "docs/platform/component-boundary.md",
 "unitKind": "unheaded-block",
 "sourceAnchor": "unheaded-block-221",
 "lines": [
  1499,
  1500
 ],
 "sourceUnitDigest": "670c6c9b5d62550e0bb6719db175e6a6d7d6a9fe97d39545e77856ecc9ea5d8d",
 "contentCommit": "e6b7efeec",
 "disposition": "native claim carried; rebind to current unit, reviewStatus pending"
}
```

Verify with (run from the repo root):
```sh
git show e6b7efeec:docs/platform/component-boundary.md | sed -n '1499,1500p' | perl -pe 'chomp if eof' | sha256sum   # must equal sourceUnitDigest
git show e6b7efeec:docs/platform/component-boundary.md | sed -n '1499,1500p'   # block must carry no heading line; anchor is the nth unheaded block of the file
```

## Record 19  (rebind: current-0359)

Claim:
```json
{
 "entry": "current-0359",
 "claimId": "claim_e9d5a5a13683f7e56f8ac36594bb02f3",
 "sourcePath": "docs/platform/component-boundary.md",
 "unitKind": "unheaded-block",
 "sourceAnchor": "unheaded-block-61",
 "lines": [
  432,
  438
 ],
 "sourceUnitDigest": "039a6bbc05030558465bd244a7c9cb8d2f6f3db067b716209b51023fddb35127",
 "contentCommit": "e6b7efeec",
 "disposition": "native claim carried; rebind to current unit, reviewStatus pending"
}
```

Verify with (run from the repo root):
```sh
git show e6b7efeec:docs/platform/component-boundary.md | sed -n '432,438p' | perl -pe 'chomp if eof' | sha256sum   # must equal sourceUnitDigest
git show e6b7efeec:docs/platform/component-boundary.md | sed -n '432,438p'   # block must carry no heading line; anchor is the nth unheaded block of the file
```

## Record 20  (rebind: current-0949)

Claim:
```json
{
 "entry": "current-0949",
 "claimId": "claim_134051e8f00a27dffed1611189868d55",
 "sourcePath": "docs/platform/platform-foundations.md",
 "unitKind": "unheaded-block",
 "sourceAnchor": "unheaded-block-6",
 "lines": [
  46,
  58
 ],
 "sourceUnitDigest": "758edec98ad2443372aa77ca4b55e41445d3c32bda2392d7eae950e53a4b44da",
 "contentCommit": "e6b7efeec",
 "disposition": "native claim carried; rebind to current unit, reviewStatus pending"
}
```

Verify with (run from the repo root):
```sh
git show e6b7efeec:docs/platform/platform-foundations.md | sed -n '46,58p' | perl -pe 'chomp if eof' | sha256sum   # must equal sourceUnitDigest
git show e6b7efeec:docs/platform/platform-foundations.md | sed -n '46,58p'   # block must carry no heading line; anchor is the nth unheaded block of the file
```

## Record 21  (rebind: current-0249)

Claim:
```json
{
 "entry": "current-0249",
 "claimId": "claim_84c70a654880511da1a098d813d555c5",
 "sourcePath": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
 "unitKind": "unheaded-block",
 "sourceAnchor": "unheaded-block-15",
 "lines": [
  95,
  98
 ],
 "sourceUnitDigest": "0bd94d3dc57743365dfff5e23cb4f4d44b3be102b0032d452c5e1f45d365a6e1",
 "contentCommit": "e6b7efeec",
 "disposition": "native claim carried; rebind to current unit, reviewStatus pending"
}
```

Verify with (run from the repo root):
```sh
git show e6b7efeec:docs/platform/agent-coordination/contracts/assignment-run-runresult.md | sed -n '95,98p' | perl -pe 'chomp if eof' | sha256sum   # must equal sourceUnitDigest
git show e6b7efeec:docs/platform/agent-coordination/contracts/assignment-run-runresult.md | sed -n '95,98p'   # block must carry no heading line; anchor is the nth unheaded block of the file
```

## Record 22  (a34: X-A34-19)

Claim:
```json
{
 "rowId": "X-A34-19",
 "claimId": "claim_f4058f068a378962aaf237ae038db5af",
 "sourcePath": "docs/specs/runner.md",
 "sourceUnitDigestAtReviewedDecision": "d2f7e04754c3720cace2cf46bb12fb5e3701574c76182e79aacbd1b6f6de95e8",
 "targetOwner": "docs/specs/runner.md",
 "targetAnchor": "unheaded-block-134",
 "residualFile": "plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json",
 "residualFileSha256": "4be07f52fd5557aff9e7f8635365904db945bffc5400c481f191fdfe85652c9f",
 "residualPayloadSha256": "d2f7e04754c3720cace2cf46bb12fb5e3701574c76182e79aacbd1b6f6de95e8",
 "verbatimPayload": "**Vai mù thật sự (`blind`) — chặn đọc run state của peer.** Mặc định tắt (không đổi hành vi). Một cờ ở Unit (và ở `template` của Workflow): `blind: true` làm *mọi vai* của Unit chạy với `hostRead: blind` (`docs/specs/confinement-authority.md` §9.2): worker không đọc được `.fgos/assignments`, `.fgos/workflow-runs`, `.fgos/dispatch-runs` của project, thư mục socket herdr, private home của dispatch khác, hay `/proc/<pid>` của tiến trình anh em; chỉ đọc được thư mục của chính nó (brief, ref đã được trao — chỉ-đọc) và ghi outbox. Phần còn lại của host (repo, `node`, DNS) và file tracked trong `.fgos` không đổi. Unit `blind` không bao giờ chạy không-blind: nếu không thực thi được — `bind()` không chọn in-process/inline, không có bwrap, mode không `required`, probe hỏng/chưa tươi, `cwd` hay ref nằm trong vùng bị che — dispatch bị từ chối trước khi spawn với lý do có tên (`blind-in-process`, `blind-requires-confinement`, `blind-hides-workspace`, `blind-ref-hidden`, `confinement-probe-failed`, ...). Với Unit `blind`, input `unit-run:`/`gate-answer:` (và ref bất kỳ nằm trong vùng bị che) không được giao bằng đường dẫn gốc: lúc dispatch, `resolveUnitInputs` + `copyHandoffsInto` chép nguyên byte (kiểm sha256) vào `inputs/` của round dir của chính vai đó, mỗi vai một bản, tên trung tính khi có `anonymizeInputs`; `unit.json` giữ `inputMap`, resume dùng lại bản chép. `blind-ref-hidden` chỉ còn cho ref không chép được. Workflow bật `blind`: hai bước panel của `delphi` (`propose-round-1`, `propose-round-2`), `generate-ideas` của `nominal-group`, `sense-making-panel` của `group-cognition`; `architecture-advisory` và `business-discussion` chưa bật vì pool của chúng gồm agy, họ chưa qua canary blind.",
 "owner": "docs/specs/runner.md",
 "status": "preserved; Step 9 rebind if affected; Phase 9 activation remains blocked"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json | sha256sum   # must equal residualFileSha256
git show 681a86005:plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json | jq -j --arg c claim_f4058f068a378962aaf237ae038db5af '.. | objects | select(.claimId==$c and has("residualText")) | .residualText' | sha256sum   # must equal residualPayloadSha256
git show 681a86005:plans/260925-documentation-authority-unification/reports/phase-06/step9-a42-predecessor-residuals.json | jq -r --arg c claim_f4058f068a378962aaf237ae038db5af '.. | objects | select(.claimId==$c and has("residualText")) | .residualText'   # verbatimPayload must equal this text exactly
```

## Record 23  (routing: QF-07)

Claim:
```json
{
 "entry": "QF-07",
 "rowId": "QF-07",
 "source": {
  "path": "plans/260925-documentation-authority-unification/phase-07-cross-area-integrity-and-fresh-reader-review.md",
  "selector": {
   "line": 202
  },
  "digest": "d7b9b02e7eae6728bcc08649f938ca1bd26d4b0aebcc97385b245f49d6fbdaa3",
  "encoding": "exact UTF-8 line without line terminator",
  "content": "| 7 — non-doc consumers | Phase 8/9; no executable or render-source edit in Phase 7. |"
 },
 "target": {
  "path": "plans/260925-documentation-authority-unification/phase-07-cross-area-integrity-and-fresh-reader-review.md",
  "selector": {
   "line": 202
  },
  "digest": "d7b9b02e7eae6728bcc08649f938ca1bd26d4b0aebcc97385b245f49d6fbdaa3",
  "encoding": "exact UTF-8 line without line terminator",
  "content": "| 7 — non-doc consumers | Phase 8/9; no executable or render-source edit in Phase 7. |"
 },
 "route": "Phase 8/9"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:plans/260925-documentation-authority-unification/phase-07-cross-area-integrity-and-fresh-reader-review.md | sed -n '202p' | perl -pe 'chomp if eof' | sha256sum   # must equal source.digest, and the line must equal source.content
git show e6b7efeec:plans/260925-documentation-authority-unification/phase-07-cross-area-integrity-and-fresh-reader-review.md | sed -n '202p'   # target location
```

## Record 24  (routing: X-DEFECT-03)

Claim:
```json
{
 "entry": "X-DEFECT-03",
 "rowId": "X-DEFECT-03",
 "source": {
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/owner-queue.md",
  "selector": {
   "line": 23
  },
  "digest": "9ac3de9cb5ae0decf4dcb996edb1a04d2acdbc0dd7af801d383e84d256bba873",
  "encoding": "exact UTF-8 line without line terminator",
  "content": "- `C1-R01`: the recovery gate line citation is approximate; refresh it if this rationale is promoted as current truth."
 },
 "target": {
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/owner-queue.md",
  "selector": {
   "line": 23
  },
  "digest": "9ac3de9cb5ae0decf4dcb996edb1a04d2acdbc0dd7af801d383e84d256bba873",
  "encoding": "exact UTF-8 line without line terminator",
  "content": "- `C1-R01`: the recovery gate line citation is approximate; refresh it if this rationale is promoted as current truth."
 },
 "route": "inspect-and-fix-if-candidate-text; rationale-only-to-Phase-9"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:plans/260925-documentation-authority-unification/reports/phase-06/owner-queue.md | sed -n '23p' | perl -pe 'chomp if eof' | sha256sum   # must equal source.digest, and the line must equal source.content
git show e6b7efeec:plans/260925-documentation-authority-unification/reports/phase-06/owner-queue.md | sed -n '23p'   # target location
```

## Record 25  (alignment: X-STALE-06)

Claim:
```json
{
 "id": "X-STALE-06",
 "authorityKind": "architecture",
 "statement": "Workflow steps project tasks and execute Units; requestRound/authorizeDeclaredOperation remain retired design proposals.",
 "statementPath": "docs/platform/system-architecture/architecture/architecture-intent.md",
 "statementFileSha256": "82b51061421d4995781ac999111d8a1bb4479f0b1b6180afabcdbf2928d928c2",
 "alignment": "doc-fix",
 "alignmentMeaning": "Authority-separation subpass corrected this exact row; alignment subpass verifies the final bytes without rewriting. Remaining V1 intent is historical/proposal.",
 "evidence": [
  {
   "ref": "src/workflow/steps.mjs:43-85",
   "fileSha256": "8e55ec99437c9a17cbbbad01cd78605f39bc06f45251eacf39340bfce06f36ba",
   "kind": "code/config/schema",
   "role": "current implementation evidence"
  },
  {
   "ref": "src/workflow/runner.mjs:411-428,614-630",
   "fileSha256": "89ee9d6fcda52096f87c0397a0e1de34447a6f40a3a71e662b57a092aba3ba65",
   "kind": "code/config/schema",
   "role": "current implementation evidence"
  },
  {
   "ref": "src/runner/execution/patterns/index.mjs:34-46",
   "fileSha256": "d327c87fb17efbfcf10fbe0a8af8500495214081d39eef03737fc97014f69414",
   "kind": "code/config/schema",
   "role": "current implementation evidence"
  }
 ],
 "owner": "docs/platform/system-architecture/architecture/architecture-intent.md",
 "route": "Step 5",
 "risk": "high"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:docs/platform/system-architecture/architecture/architecture-intent.md | sha256sum   # must equal statementFileSha256
git show 681a86005:src/workflow/steps.mjs | sha256sum   # must equal evidence fileSha256 8e55ec99437c...
git show 681a86005:src/workflow/steps.mjs | sed -n '43,85p'   # cited span
git show 681a86005:src/workflow/runner.mjs | sha256sum   # must equal evidence fileSha256 89ee9d6fcda5...
git show 681a86005:src/workflow/runner.mjs | sed -n '411,428p'   # cited span
git show 681a86005:src/workflow/runner.mjs | sed -n '614,630p'   # cited span
git show 681a86005:src/runner/execution/patterns/index.mjs | sha256sum   # must equal evidence fileSha256 d327c87fb17e...
git show 681a86005:src/runner/execution/patterns/index.mjs | sed -n '34,46p'   # cited span
```

## Record 26  (contract: S3-02)

Claim:
```json
{
 "id": "S3-02",
 "producer": "Workflow/CollaborationPattern policy",
 "consumers": [
  "Assignment builder"
 ],
 "contractId": "CTR012",
 "version": null,
 "payloadTransport": "operation identity, TaskSpec, Skill, Role, policy hints; payload carries a `version` field validated when the step definition is loaded",
 "compatibilityFailure": "invalid/duplicate operation or unresolved TaskSpec is refused; no payload version field exists today",
 "implementationEvidence": [
  "docs/platform/agent-coordination/contracts/workflow-stage-operation.md",
  "src/workflow/definition.mjs:241-253",
  "src/workflow/steps.mjs:57-85",
  "src/runner/execution/run.mjs:555-580",
  "src/runner/dispatch/assignment.mjs:270-280"
 ],
 "owner": "Workflow runner plus Assignment builder boundary",
 "authorities": {
  "stateWrite": "Assignment builder only",
  "decision": "Workflow selects legal declared operation",
  "runtime": "Execution Core"
 },
 "candidateSource": "docs/platform/agent-coordination/contracts/workflow-stage-operation.md",
 "status": "compatible"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:docs/platform/agent-coordination/contracts/workflow-stage-operation.md | head -40
git show 681a86005:src/workflow/definition.mjs | sed -n '241,253p'
git show 681a86005:src/workflow/steps.mjs | sed -n '57,85p'
git show 681a86005:src/runner/execution/run.mjs | sed -n '555,580p'
git show 681a86005:src/runner/dispatch/assignment.mjs | sed -n '270,280p'
git show 681a86005:docs/platform/architecture-map.md | sed -n 444,452p   # contract registry rows: id, boundary, state, defining doc
git show 681a86005:docs/platform/agent-coordination/contracts/workflow-stage-operation.md | grep -n -i "Registry identity\|CTR0"
```

## Record 27  (rebind: current-0843)

Claim:
```json
{
 "entry": "current-0843",
 "claimId": "claim_149cb8cb96593b937443942dcc61a00f",
 "sourcePath": "docs/platform/observe/decisions/observe-component-architecture.md",
 "unitKind": "heading",
 "sourceAnchor": "d-adr0037-observe-component-architecture",
 "lines": [
  32,
  32
 ],
 "sourceUnitDigest": "0041148c6d694b756eba9bb8783d2168ae4a3e8081194988a65d55612843366b",
 "contentCommit": "e6b7efeec",
 "disposition": "native claim carried; rebind to current unit, reviewStatus pending"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:plans/260925-documentation-authority-unification/reports/phase-07/review-input-step-09-package-02/part-019.json | jq -c --arg e current-0843 '.entries[]|select(.entry==$e)|[.path,.tuple[2],.tuple[3],.tuple[5],.native.sourceAnchor,.native.sourceUnitDigest]'   # index row: digest/anchor of this entry (heading unit digests come from the production extractor and are not shell-reproducible)
git show e6b7efeec:docs/platform/observe/decisions/observe-component-architecture.md | sed -n '32p'   # heading text; its GitHub-style slug must equal sourceAnchor
```

## Record 28  (a34: X-A34-27)

Claim:
```json
{
 "rowId": "X-A34-27",
 "claimId": "claim_41571c8f42f542be1f44c9371fad823a",
 "sourcePath": "docs/specs/runner.md",
 "sourceUnitDigestAtReviewedDecision": "1b272bfab383f72def5df026184449f797cb7723c812253713808d6aed302988",
 "targetOwner": "docs/specs/runner.md",
 "targetAnchor": "unheaded-block-52",
 "residualFile": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync2300-predecessor-residuals.json",
 "residualFileSha256": "69c36aaa9da6dba4accb7795c09b45b60456e1d01a25953d18d2483dff848173",
 "residualPayloadSha256": "6bc73a238975f903fb15b4a025ed8df0aa64a628bd8b536e99f6b23e2d3cf64b",
 "verbatimPayload": "- **Blocked when:** một khóa hoạt động ghi rằng một danh tính KHÁC đã chạm cây chính\n  này trong cửa sổ gần đây (mặc định 15 phút) — commit bị từ chối thẳng, không chạy;\n  hoặc khóa không đọc được (hỏng/không phân tích được) — commit CŨNG bị từ chối (thà\n  chặn nhầm còn hơn để lọt một race thật).\n- **Side effects:** ghi lại khóa hoạt động (danh tính + thời điểm) ngay tại chính cây\n  chính, dùng đúng cơ chế tạo-nguyên-tử + đòi-lại-pid-chết đã có ba lần trong hệ (xem\n  \"Phiên checkout đa-phiên\" trên) — không đụng sổ đăng ký phiên, không đụng khóa\n  `sessions.lock`/`runner.lock`/`events.lock` nào đã có.",
 "owner": "docs/specs/runner.md",
 "status": "preserved; Step 9 rebind if affected; Phase 9 activation remains blocked"
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:plans/260925-documentation-authority-unification/reports/phase-06/step10-sync2300-predecessor-residuals.json | sha256sum   # must equal residualFileSha256
git show 681a86005:plans/260925-documentation-authority-unification/reports/phase-06/step10-sync2300-predecessor-residuals.json | jq -j --arg c claim_41571c8f42f542be1f44c9371fad823a '.. | objects | select(.claimId==$c and has("residualText")) | .residualText' | sha256sum   # must equal residualPayloadSha256
git show 681a86005:plans/260925-documentation-authority-unification/reports/phase-06/step10-sync2300-predecessor-residuals.json | jq -r --arg c claim_41571c8f42f542be1f44c9371fad823a '.. | objects | select(.claimId==$c and has("residualText")) | .residualText'   # verbatimPayload must equal this text exactly
```

## Record 29  (rebind: current-0499)

Claim:
```json
{
 "entry": "current-0499",
 "claimId": "claim_ff2f4cda8f156fa2cdaec880290d9430",
 "sourcePath": "docs/platform/component-boundary.md",
 "unitKind": "unheaded-block",
 "sourceAnchor": "unheaded-block-200",
 "lines": [
  1378,
  1390
 ],
 "sourceUnitDigest": "9c2b09723d424834b43348d027b8a5ddf18d635bc3ce3ba67fe1cbad8dc8e1cb",
 "contentCommit": "e6b7efeec",
 "disposition": "native claim carried; rebind to current unit, reviewStatus pending"
}
```

Verify with (run from the repo root):
```sh
git show e6b7efeec:docs/platform/component-boundary.md | sed -n '1378,1390p' | perl -pe 'chomp if eof' | sha256sum   # must equal sourceUnitDigest
git show e6b7efeec:docs/platform/component-boundary.md | sed -n '1378,1390p'   # block must carry no heading line; anchor is the nth unheaded block of the file
```

## Record 30  (accounting: accounting-ratchet-0003)

Claim:
```json
{
 "entry": "accounting-ratchet-0003",
 "path": "docs/specs/observe.md",
 "after": {
  "path": "docs/specs/observe.md",
  "kind": "allowed-new-file",
  "rationale": "Main-side docs edit carried in by sync of main at 2fd5cb6a3 (2026-10-06, 8 commit(s) since 81f7db801): docs(observe): record the second acceptance round and correct the evidence wording | fix(observe): enforce rubric completeness and atomic eval identity | fix(observe): reconcile eligible history and refuse ambiguous runs (+5 more) Re-accounted 2026-10-06: carried in by sync of main at 36dc5f083 (Phase 4 sync): docs(observe): record the third acceptance round and close the plan | fix(observe): a panel needs more than half of its voters before agreement is measured A31 SYNC 59b9b7087: main Session Identity change imported unchanged; changed spans carried verbatim into the mapped candidate and changed units re-decided pending independent review. No authority flip. L11-21 close-pin accounting 2026-10-18: main imports through eab4d617b; carried main commits: 55534d99147bddd6510381514609c49c09412dd2 docs(holder-lock): state activation, install and observe locks as kernel locks. No authority or content approval; independent changed-row review owed.",
  "approvedBy": "resume sync authorized by user 2026-10-06 (resume prompt prompt-261006-1533-resume-documentation-authority-unification); recorded as accounted main-side edit, per-file content review pending (see plans/reports resume report); Phase 4 sync under the standing sync policy (plan.md §7.5b), per-file content review pending; Lead L11-21 (2026-10-18), accounting only",
  "owner": "documentation-authority-unification-lead",
  "expectedDigest": "bf89de13303aeb0ae9c30141e96b1833646b89b54431a46e87552586a893d348",
  "reviewedAt": "2026-10-06",
  "revisitTrigger": "atomic platform-authority cutover (plan phase 9)"
 },
 "mainCommits": [
  "55534d99147bddd6510381514609c49c09412dd2 docs(holder-lock): state activation, install and observe locks as kernel locks"
 ]
}
```

Verify with (run from the repo root):
```sh
git show 681a86005:docs/specs/observe.md | sha256sum   # must equal after.expectedDigest
git show -s --format="%H %s" 55534d99147bddd6510381514609c49c09412dd2   # cited main commit must exist with this subject
```
