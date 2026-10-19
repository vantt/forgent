# Step 3 wave 1 review: p01

Author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Reviewed worktree `8ab390227`, read-only. I did not run the checker, any probe, or the fgos CLI. All pinned source and target text came from `git show <pin>:<path>`. Wall-clock review time was about 35 minutes.

Each file's source was read whole. For each I read the whole record (every edge, `diff`, `checks`, `descriptionTruth` and anchor proofs). I also read the target passages at the pin: the candidate `docs/platform/**` portals and carriage headers, the five architecture targets, `contracts/assignment-run-runresult.md`, `vision.md`, and `runtime-recovery-design.md`, `run-handle.md` and `executor-health-and-fallback.md`.

Frozen record hashes from `step-03-wave1-sample.json`:

| File | Source digest | recordSha256 | diffSha256 |
|---|---|---|---|
| `docs/architect/README.md` | d5489213... | d0125bb1... | 557d269d... |
| `docs/architect/agent-coordination/README.md` | 25468d20... | 49ac10de... | 844cf649... |
| `docs/architect/agent-coordination/architecture/README.md` | 0925b3c0... | fd81c6b5... | fb82ff09... |

## Verdicts

| File | Set | Verdict | Edges reviewed |
|---|---|---|---|
| `docs/architect/README.md` | batch-003 | **ok** | 15 (4 patch, 11 parked) |
| `docs/architect/agent-coordination/README.md` | batch-004 | **rework** (6 edges), plus a needs-Lead-ruling question on about 30 edges | 46 (1 patch, 45 preserve) |
| `docs/architect/agent-coordination/architecture/README.md` | batch-004 | **rework** (2 edges, one of them conditional on a Lead ruling) | 18 (10 patch, 4 parked, 4 preserve) |

Per-set accounting:
- batch-003: 1 reviewed, 0 rework.
- batch-004: 2 reviewed, 2 rework. The file-3 rework hangs on a single description-truth call, and the file-2 rework is six disposition edges. The Lead should look at both before applying the A51 expansion.

## File 1: `docs/architect/README.md` (batch-003): ok

All 15 edges were reviewed.

Patches (00025, 00026, 00028, 00029), each checked against the target:
- **00025** goes to `docs/platform/agent-coordination/README.md`. The target exists and is the live Area Portal.
- **00026** goes to `docs/platform/component-boundary.md`. Its header says "Promoted anchor for docs/architect/component-boundary/**", so it is the live holder. There is no `docs/platform/component-boundary/` directory at the pin.
- **00028** goes to `docs/platform/host-invocation-routing/README.md`. The whole-file portal use is justified.
  - The source single file was split into `vision.md`, `architecture/{invocation-kernel,provider-routing,host-use-cases}.md` and others.
  - `component-boundary.md:1316` already maps the same file to `host-invocation-routing/spec.md`.
  - The Area Portals list carries no description, so portal navigation is correct.
- **00029** goes to `docs/platform/packaging-distribution/README.md`. The target exists and is the area portal.
- Relative forms in the diff are correct: `../platform/...` from `docs/architect/`.

Parks (11):
- Every park names a carriage holder that is a retained snapshot.
  - 00019, 00020, 00021, 00022, 00023, 00024: `docs/platform/system-architecture/architecture/*`, headers "Canonical for: Nothing until promotion".
  - 00027: `docs/platform/domainization/architecture/domainization.md`.
  - 00030, 00031, 00032, 00033: `docs/platform/proposals/*`, "Source snapshot retained; Canonical: No".
- The live hits for `workspace-topology.md` (packaging-distribution Related lists and `spec.md:432-457`), `architecture-intent.md` (history prompts) and `domainization/README.md` (switchboard row, Related header, alignment citation) are citations or partial holders, not claim holders.
- The witness categories are true (carriage, or partial-holder where noted) and the dispositions are consistent.

Required corrections: none.

Lead-judgment question (non-blocking):
- Source lines 10-11 name `agent-coordination/` and `component-boundary/` as backticked relative directory tokens ("subtrees, such as ..."). The legacy scan reports zero candidates and the record declares no exclusion.
- I read these as prose area names, which are out of scope under L12-32(6), so no edge is needed.
- If the Lead wants directory tokens in backticks counted, this would be two added edges. The tokens sit in a sentence about the retiring tree and would be preserved or parked.

## File 2: `docs/architect/agent-coordination/README.md` (batch-004): rework

All 46 edges were reviewed. The record has 1 patch and 45 preserve. The preserves cover the 45 inventory edges plus the added bare `vision.md` at L183, and the added edge has its span and disposition. All 45 preserve reasons use one rationale: "Whole-document historical framing: 'Các tài liệu trong thư mục này lưu giữ thiết kế lịch sử của Step 00–09.'"

**Patch 00034 (L15, decision 0062 in `docs/specs/runner.md`): ok.**
- The target `docs/platform/runner/decisions/h-36d872fbb0e5.md`, heading at line 1716, matches the "0062 Xoá cửa thô ..." claim. The Doer's anchor is the extractor's own anchor, and the record has enclosing-heading proof.
- The note names the removal of `dispatch execute`, `dispatch log` and `dispatch fanout-batch`, and the decision body says the same.
- The diff keeps the backticks.

### Outcome defects (disposition needs correction)

**D2-1: 00054 (L60), 00055 (L65), 00056 (L66), 00059 (L72), 00060 (L73), 00061 (L74).** These are preserve and should be park (phase9-carry).
- Rule: the digest's carriage rule says carriage needs an explicit framing sentence that actually governs the passage. L12-30(3) says same-kind edges share one disposition.
- The quoted framing sentence is about "documents in this directory". The six destinations are outside the directory:
  - `../proposals/coordination-capability-envelope.md`
  - `../proposals/step-09-group-thinking-substrate.md`
  - `../proposals/architecture-advisory-panel.md`
  - `../proposals/step-10-coding-domain-adoption.md`
  - `../proposals/component-authority-boundary-map.md`
  - `../architecture-intent.md`
  The framing sentence does not govern them.
- The only candidate holders are carriage.
  - The platform proposals files carry "Source snapshot retained; Canonical: No".
  - `system-architecture/architecture/architecture-intent.md` carries "Canonical for: Nothing until promotion".
- Same-kind precedent in file 1: 00020 (architecture-intent.md) and 00030, 00031, 00032, 00033 (proposals) are parked phase9-carry with a searchWitness. File 2 preserves the same targets.
- Required correction: park phase9-carry with a searchWitness and a non-executable successor note, as in file 1. Alternatively, quote a framing sentence that really covers these passages. L60-63 states "recommendation remains Discussion" and L158-161 states the proposals are discussion drafts.

### Needs Lead ruling (framing validity for in-directory edges)

The 2026-10-02 note says the documents in the directory preserve historical Step 00-09 design. The Doer treats that sentence as whole-document carriage for every sibling link. I recommend the Lead rule against this. If instead the Lead accepts it, file 3's sibling patches are the inconsistent ones and need the same ruling.

My reasons against:
- The file self-declares "Document type: Portal / Design status: Accepted / Canonical for: navigation only".
- Lines 3-4 name the live replacement portal ("legacy/current source for docs/platform/agent-coordination/README.md").
- L96-133 ("Current Accepted Baseline") still asserts the retired engine as accepted. This is the opposite of a carriage-only body.
- The sentence sits inside a header note about engine retirement, not under a heading that scopes the lists.
- The same kind of edge is patched in file 3 (sibling README of the same tree) and in file 1 (portal list). The file's own L15 locator is patched under the supposed whole-document framing.

Edges with a live exact candidate holder (the legacy path in `docs/platform/agent-coordination/**`, not under `history/retired-engine`):

| Edges | Source | Live holder |
|---|---|---|
| 00035, 00038, 00062, 00078, L183 added (`author-wave1-...-L183C14`) | `vision.md` | `vision.md` |
| 00041, 00064 | `vocabulary/README.md` | `vocabulary/README.md` |
| 00044-00049, 00065 | `architecture/{protocol-model, runtime-model, work-integration, dispatch-control-plane, evidence-and-results, visibility-and-herdr, README}.md` | same paths |
| 00050, 00051 | `contracts/{workflow-stage-operation, assignment-run-runresult}.md` | same paths |
| 00052, 00067 | `decisions/README.md` | same |
| 00053 | `verification/team-dispatch-v1/index.md` | same |
| 00070 | `verification/README.md` | same |
| 00071 | `playbooks/README.md` | same |
| 00072 | `history/README.md` | same |
| 00057, 00058 | `proposals/team-communication-protocol-v1.md`, `proposals/dispatch-control-plane-redesign.md` | `agent-coordination/proposals/*` |
| 00068 | `proposals/README.md` | `agent-coordination/proposals/README.md` |

- The digest rule says a live exact holder permits a patch unless there is a concrete independent blocker.
- If the Lead rules these are not carriage, apply the six-dimension description check to the adjacent text. These must park as description-rewrite if the adjacent text is false:
  - L21-25 and L38-39: Vision "highest authority", then "read the Intent Preservation Ledger before narrowing". The target's Authority And Reading Rule (lines 35-36) says the ledger is "not a required current second read". This is the mandatory old intent-ledger second read.
  - L84-94: table row descriptions. Check for example `decisions/` ("Accepted decisions") against the target index, whose ADR-008 to ADR-010 now live only under `retired-engine/files`.
- The remaining preserves have no live holder (carriage only): ledger 00036/00039/00063, governance 00037/00040/00077, system-context 00042, baseline 00043/00076, `contracts/README.md` 00066, `roadmap/README.md` 00069, ADR-008 to ADR-010 at 00073-00075. If the framing is rejected they should be parked phase9-carry. If accepted, they are fine as preserve.

Record-text notes (no outcome effect):
- The preserve reasons for 00035 and 00062 name `docs/platform/agent-coordination/vision.md` as a successor. The 00039/00063 successor is the portal README, and 00042 points to the same README, which is not a file holder. Tidy these if dispositions are revisited.

## File 3: `docs/architect/agent-coordination/architecture/README.md` (batch-004): rework

All 18 edges were reviewed.

Patches (10): checked for target existence, anchor and description.
- **00079 (vision), 00083 (runtime-model#execution-chain), 00084 (work-integration#core-invariant), 00085 (dispatch-control-plane#responsibility), 00086 (evidence-and-results#confidence-boundaries), 00087 (visibility-and-herdr#purpose), 00088 (run-handle), 00090 (executor-health-and-fallback), 00092 (assignment-run-runresult#run-phases-and-admission).**
  - The targets and anchors exist.
  - The adjacent descriptions hold against the pinned targets. I verified the key phrases in `run-handle.md` ("not a required worker-written checkpoint"), `executor-health-and-fallback.md` ("fallbackExecutors ... reserved-not-executed") and the others.
  - The relative form `../../../platform/...` is correct.
- 00085: `separation-of-concerns` (line 327) is an alternative holder. `responsibility` (lines 45-53) covers the claim "converts Assignment into governed execution; does not choose lifecycle or invent a semantic operation". I accept it.
- 00084: the claim spans lines 41-48 under `core-invariant`. I accept it.

### Outcome defects

**D3-1: 00091 (L47-51, `runtime-recovery-design.md`), patch should be park (description-rewrite).**
- The adjacent description says "the proposed detailed-design entry point for documents 9-11: ... long-horizon scope, rollout and the shared bug/proof matrix. It is not a fourth runtime component. Read it first when implementing or reviewing these proposals."
- The pinned target has no entry-point role and no "documents 9-11" statement. `grep` for "horizon", "entry point", "fourth" and "documents 9" finds nothing; only §1 "Scope And Reading Order" matches.
- The target's status table marks S0-S4 "Implemented" and §7 "Implemented standalone dispatch recovery". It says session continuation is retired.
- The record's `wholeFileJustification` asserts "long-horizon scope", which the target does not contain. The `descriptionTruth` "matches" verdicts for counts, lists and shipped status cite target lines that do not carry these claims.
- Rule: L12-32(3) says a mismatch parks as description-rewrite or rewrites the description from target facts; "a checked quote/digest and author 'matches' verdict are evidence bindings, never semantic acceptance".
- Required correction: park description-rewrite, or rewrite the adjacent description from target facts.
- Lead caveat: the live candidate README (`docs/platform/agent-coordination/architecture/README.md`, lines 12 and following) carries this item 12 text verbatim. If the Lead rules that the candidate's own description is the accepted statement, this reduces to a record-text issue (false justification text) with the disposition unchanged.

**D3-2: 00096 (L92, preserve) is inconsistent with 00081 (L20, park phase9-carry).**
- Both point to `coordination-foundation-baseline.md`, which only has carriage candidates.
- Both play the same role: the baseline as the summary of the accepted Step 00-08 shape.
- L12-30(3) requires one disposition for same-kind edges. Align them. Recommended: park phase9-carry for 00096, since the file carries no history framing for it (see the ruling question below).

### Needs Lead ruling (not counted as an outcome defect)

**00093, 00094 (ADR-008, ADR-009, L88-89), 00095 (`contracts/README.md`, L90), and 00096 above.**
- The preserve reason calls the passage "explicit dated acceptance lineage" and quotes "CoordinationSession's identity/persistence boundary and the shared FlowDefinition ... IR are accepted per ADR-008 and ADR-009". The quote is present-tense and undated.
- ADR-008, ADR-009 and `contracts/README.md` exist only as `retired-engine/files` snapshots. The target README rewrites this sentence as "remain historical decisions ... not accepted current session/IR contracts".
- Question: is a present-tense "are accepted per ADR-00x" a provenance citation (preserve) or an obsolete live claim (park description-rewrite)?
- Mechanically, preserve is defensible as a citation of a decision record that exists only as a retired-tree path. The record's "dated" wording is inaccurate and should be fixed either way.

Record-text note (no outcome effect):
- 00093-00095 say "dated"; remove it or quote a real framing sentence.

## Cross-file points for the Lead

1. **batch-004 consistency.** The three files treat the same kind of edge differently:
   - Sibling-directory navigation is patched in file 3 and in file 1 (portal list).
   - File 2 preserves the same kind.
   - The framing ruling above settles it. Because a rework in file 2 or file 3 expands A51 review for batch-004, I recommend deciding the ruling before applying it.
2. **Verbatim history copies.** The candidate tree also keeps verbatim copies of all three sources:
   - `docs/platform/agent-coordination/history/retired-engine/README.md` for file 2, and `.../files/architecture/README.md` for file 3.
   - `docs/platform/system-architecture/history/architect-readme.md` for file 1.
   Patches to these retiring sources therefore only matter if the source file is itself shown at cutover. That is the Lead's Phase 9 call and is not decided here.
3. No new rule gap found beyond the framing question above.

Status: DONE_WITH_CONCERNS
Summary: File 1 is ok (15 edges). Files 2 and 3 are rework: file 2 has 6 edges that should be parked (00054-00056, 00059-00061), plus a ruling needed on the framing sentence that preserves about 30 in-directory edges. File 3 has 00091 (false adjacent description) and the 00096-versus-00081 inconsistency, plus a smaller ruling on 00093-00095.
