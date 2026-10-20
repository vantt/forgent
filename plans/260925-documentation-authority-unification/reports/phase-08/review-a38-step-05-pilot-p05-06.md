# Review a38 — Step 5 pilot, parts 05 and 06

Pin used: aa8d343746a292d2cb476ab76e6489411fd59a62. Read-only. I ran no checker, probe, test or cargo. I applied each diff to a scratch copy of the pinned file with `patch`, and checked source sha256, expectedAfter sha256, rollback round trip, registry alias to currentPath, and target existence at the pin.

Slices seen:
- p05 holds only the tail of command-registry (references 24-25 and dynamic tuples 0-13).
- p05 also holds full plan.mjs, verify-pattern-check.mjs, claim-port.mjs, merge.mjs and worktree.mjs.
- p06 holds the worktree.mjs priorRecordRefs, events-jsonl-truncation-guard.mjs, and five setup files: agent-cli-trust, agent-hooks, agy-permissions, ansi and bin-discovery.
- Setup files after bin-discovery are in part 07, which I did not see. Verdicts below are for the slices seen. command-registry's first 24 references are in other parts.

## Mechanical checks passed

- For plan.mjs, verify-pattern-check.mjs, merge.mjs, worktree.mjs, events-jsonl-truncation-guard.mjs and command-registry, the diff applies cleanly to the full pinned file.
- The resulting hash equals expectedAfterSha256, and the rollbackDiff restores the exact original bytes.
- Each diff has one hunk, and that hunk is only the admitted passage.
- For the five patch references (plan, verify-pattern-check, merge, worktree, events guard):
  - The registry alias is listed in the entry whose currentPath is the target.
  - The target blob exists at the pin and its sha matches targetSha256.
  - The registry sha matches.
  - The old path does not exist at the pin, so each current message already points at a dead path.
- No diff touches a generated output, and no alias is a writer destination.

## Per file

### src/cli/command-registry.mjs (slice p05: references 24 and 25, dynamic tuples 0-13) — seam cli-help-messages — rework

- Reference-003665 (class: none, line 845, `docs/**+src/**+plugins/**`): preserve is OK.
  - The text is a glob naming the write-time citation sweep scope.
  - `docs/**` stays a live root.
  - The real sweep list is `WIDE_SWEEP_ROOTS` in `scripts/check-decision-citation-drift.mjs:321`.
  - This is a note, not a defect: if the citation seam changes those roots, the message must co-cut. Say so in the record.
- **OUTCOME DEFECT, reference-003666 (cli-008, line 846, `docs/specs/`).**
  - It is marked `preserve`, timing none, with the reason "retained actual path ... L12-10/26 keep these roots". Its resolverWitness says `exists:false` and `currentPath:null`.
  - The same physical span, column 91 and onward, is reference-003643 (class6-l-000210, `docs/specs/<area>.md`). That one is correctly `parked`, cutover-patch-only, with `docs/specs/<area>.md` not existing and the area spec being a retiring root under L12-7.
  - Two dispositions for one text span is inconsistent. `docs/specs/` is a retiring root, not a retained one, and the reason text is a copied generic.
  - Correction: make reference-003666 `parked` and join it to 003643, with the same co-cut dependency on the decision-index scope construction. Fix the reason from its own passage, and keep timing phase9.
- Reference-003646 (`docs/decisions/index.md`, line 846): preserve is OK. It is the generated index and the path exists. Source: L12-60(5) and L12-62(4).
- Dynamic tuples 0-13 (dynamic-009294 to 009307): all REJECT/preserve, and all correct.
  - I verified each at its current line in the source.
  - Tuples 0, 1-4, 7, 9, 10, 11 and 13 are schema property keys (`path:`, `paths:`, `direct:`, `dir:`) or help descriptions.
  - Tuple 5 (`fgos/agents, domains/*/agents, core/agents`) names agent directories, not docs.
  - Tuple 12 (`scope: {type:'string'`) is a schema key. The docs pointers in that passage are separately admitted references.
  - Current-line offsets of 4 or 8 lines are consistent with the file.
- Whole-file diff (seen as the record's `diff`): one hunk at line 1746, changing the `fgos doc-sources` example to the knowledge path.
  - Applies cleanly with matching hashes.
  - References 0 and 14 (the two census origins of the same span) both claim it.
  - The old how-to file still exists at the pin, and `test/report/enduser-index.test.mjs` reads it as a real file. This is outside my slice. It is noted for the owner of that slice.

### src/intake/plan.mjs — cli-help-messages — ok

- Reviewed 1 reference (reference-003682, line 923), 0 dynamic tuples, and the full 968-line context.
- Patch to the knowledge path is correct.
  - The old `docs/explanation/...` path is dead at the pin.
  - No test asserts the old text. I grepped test, src, bin and core.
- The emitted string is a persisted engine rationale. The delta is the single path substitution.
- class6-l-000245 is correctly the Step 4 `stepFiveExcluded` item.
- Co-cut CHANGELOG.md is listed.

### src/intake/verify-pattern-check.mjs — cli-help-messages — ok, one cross-record note

- Reviewed 1 reference (reference-003687, line 28).
- The patch changes `KNOWN_BAD_VERIFY_PATTERN_DOC`, which is interpolated into the `reason` text at line 55.
- `test/intake/judge-verify-second-pass-stability.test.mjs:71` matches only the basename `avoid-vacuous-pass-...\.md`, which is kept, so the test still passes.
- Record-text note, not an outcome defect:
  - Step 4 slot class6-l-000247 patches line 21 of this same file, with anchor `#the-trap`.
  - Step 5 patches line 28.
  - The two diffs are separate hunks over the same pinned bytes (lines 18-24 and 25-31), so they combine without a conflict.
  - Neither record names the other, and there is no combined expectedAfter hash.
  - Put this on the Step 7 overlap/rebind list.

### src/runner/claim-port.mjs — cli-help-messages — ok

- Reviewed 1 reference (reference-003708, line 224).
- Preserve is correct. It is a persisted `rationale` citing `docs/history/session-claim-liveness/CONTEXT.md` D2/D4/D5.
  - The path exists.
  - The wording is provenance, which falls under L12-10 and L12-26.
  - No diff is required, and expectedAfter equals source.

### src/runner/merge.mjs — cli-help-messages — rework (missing co-cut)

- Reviewed 2 references and 0 dynamic tuples.
- Reference-003771 (line 562, `docs/decisions/NNNN-slug.md`): preserve is OK.
  - It is the text of a thrown error inside `renumberDecisionFile`.
  - That function matches the retired decision-corpus layout through `DECISION_FILE_RE`, so the message has to stay consistent with its own code.
  - Note: the `resolverWitness` says `exists:false`, which is true for a pattern, but "retained root" is not the real reason. The real reason is that the construction is code for the retired corpus.
- **OUTCOME DEFECT, reference-003749 (line 996) — the patch is right but the co-cut set is incomplete.**
  - `formatFgosWriteRejectedDetail` is asserted byte-exactly in `test/runner/merge.test.mjs:1260-1265`: `assert.equal(detail, '...See docs/how-to/fix-fgos-write-rejected-merge-block.md for the recovery steps.')`, then `assert.ok(detail.includes('docs/how-to/...'))`.
  - Applying the Phase 9 diff makes both assertions fail.
  - coCutPaths is only `CHANGELOG.md`.
  - testTargets, in `step-05-pilot-cutover-specs.json`, says only "missing: exact emitted/refusal-message migration parity".
  - The authoring request requires owning fixture paths to be updated in the same patch.
  - Correction: add `test/runner/merge.test.mjs` as a co-cut path, with its exact old and new text. The e2e test `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs:396` matches only the basename and is unaffected.

### src/runner/worktree.mjs (p05 full, p06 priorRecordRefs only) — cli-help-messages — rework (missing co-cut)

- Reviewed 1 reference (reference-003784, line 1088; original census line 949, relocated).
- Diff, target and hashes are correct.
- **OUTCOME DEFECT: the same class as merge.mjs.**
  - `test/runner/worktree.test.mjs:766-769` asserts `/docs\/how-to\/tell-a-stale-worktree-index-apart-from-real-uncommitted-work\.md/` against the thrown message.
  - The patch breaks this test.
  - The test is not in coCutPaths or testTargets.
  - Correction: add `test/runner/worktree.test.mjs` as a co-cut path, with the new regex.
- The p06 part repeats the Step 4 slots (class6-l-000327 to 000330), consistent with p05.

### src/state/events-jsonl-truncation-guard.mjs (p06) — cli-help-messages — ok

- Reviewed 1 reference (reference-003868, line 140); 3 source-context windows.
- The patch is correct.
- Tests: `test/setup/checks.test.mjs:342,381` match only the basename `resolve-an-events-jsonl-truncation`, which is kept, so they pass.
- Note: line 342 of that test holds the old path in a title string, but that is not an assertion.

### src/setup/agent-cli-trust.mjs (p06) — setup-doctor-roots — ok

- Reviewed 21 dynamic tuples (dynamic-013451 to 013471) against the whole 126-line file.
- All REJECT, and all correct. They are codex and agy trust-store paths (`config.toml`, agy settings), message templates, `.git` probes and `join` serializations. None reaches a documentation location.
- Record-text notes:
  - Several reasons say "It formats values at export function checkAgentCliProjectTrusted(...)", which is the passage's first line rather than the actual line. This is noise.
  - The labels "thread wait" and "scalar/thread" are boilerplate for array-join strings.
  - The tuple-role hints (reader, writer, default-root) do not always match the real operation.

### src/setup/agent-hooks.mjs (p06) — setup-doctor-roots — ok

- Reviewed 48 dynamic tuples (dynamic-013472 to 013519), all REJECT.
- Every path is a per-agent hooks or settings file (`.claude/settings.json`, `.codex/hooks.json`, `.agents/hooks.json`, `.omp`/`.pi` extensions, `.fgos/installation/bin/fgos`).
- The rest are message templates.
- The file has no docs references, which I confirmed by grep.

### src/setup/agy-permissions.mjs (p06) — setup-doctor-roots — ok, with record-text issues

- Reviewed 1 reference and 33 dynamic tuples (dynamic-013520 to 013552); all reject.
- Reference-003793 (line 3, `docs/history/agy-permission-capability-allowlist/`): REJECT and preserve is correct. It is a comment citing history design evidence.
  - **Record-text defect:** the `resolverWitness` says `exists:false`, but the directory has `RESEARCH.md` and `plan.md` at the pin, so it exists.
  - **Custody note:** the rejection names rule L12-26(5) and a rejection rule, not a Step 3/4 slot or a non-document operation. There is no Step 4 record for this file, so L12-26(5) is the only custody. Say this explicitly in the record.
- The tuples are agy `settings.json` paths, sub-HOME resolution and messages.
- Line 121 mentions "RESEARCH.md Round 4" as a bare filename inside an emitted doctor message. A bare filename is not an edge under L12-49, so no defect.

### src/setup/ansi.mjs (p06) — setup-doctor-roots — ok

- 6 tuples, color and label template strings, all REJECT and correct.

### src/setup/bin-discovery.mjs (p06, partial) — setup-doctor-roots — ok on what I saw

- Reviewed 1 reference (reference-003794, lines 2-3, `docs/history/install-setup-external-project-reliability/\n// CONTEXT.md`) and 5 dynamic tuples (013559 to 013563).
- Reject-and-preserve is correct for the reference. It is a comment citing history evidence, and the path exists.
- The tuples are fgos-bin resolution, not document paths.
- The same custody note as agy-permissions applies.

## Counts

- References seen: 2 (command-registry) + 1 + 1 + 1 + 2 + 1 (p05) + 1 + 1 + 1 (p06) = 11. Of these, 5 are patch, 4 preserve, 2 reject.
- Dynamic tuples seen: 14 (command-registry) + 21 + 48 + 33 + 6 + 5 = 127, all REJECT/preserve.
- Outcome defects: 3 (reference-003666; merge.test.mjs co-cut; worktree.test.mjs co-cut).
- Record-text notes: 5.

## Lead-judgment questions

1. Should the co-cut test files be named in the cli-help-messages cutover specs and in the receipt? Today every spec's testTargets entry reads "missing: exact emitted/refusal-message migration parity", while two existing tests assert exact old paths. I suggest yes: same-patch test updates are required by the authoring request.
2. Should the overlap between Step 4 slot class6-l-000247 (line 21) and Step 5 reference-003687 (line 28), both in verify-pattern-check.mjs, be recorded now or left to Step 7?
3. Boilerplate on every cutover spec: the `intent` text says "This includes persisted engine rationale when emitted by resolvePlan", even for command-registry help, hooks, setup and verify-pattern-check specs. It is wrong for those files. The command-registry spec for reference-003641 also uses `oldPointer: "docs/how-to"` rather than the full path. Both are record-text only.

Status: DONE_WITH_CONCERNS
Summary: Parts 05-06 reviewed (11 references, 127 dynamic tuples). Three outcome defects: reference-003666 conflicts with parked reference-003643, and the merge.mjs and worktree.mjs patches omit the exact-string tests that would fail. All diffs apply and hash correctly, and every reject is justified.
