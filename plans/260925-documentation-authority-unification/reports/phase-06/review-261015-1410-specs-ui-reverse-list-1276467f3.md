# Review: specs and ui-spec complete reverse list (117 tuples)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792047735364-5c1a0eb5@2026-10-15
Review mode: ordinary
Request commit: 3c9b16c2c
Content commit: 1276467f37a99d19aff05808d42fafbf40341449

## Scope and method

One-entry separate non-source channel: the committed list `reports/phase-06/candidate-unverified-specs-ui.json` (A28 item 2). The verdict covers complete equality of the list with the native reverse-open population and eligibility of every tuple; it is not a source approval, truth approval or promotion. Sensitivity wording ignored (ordinary review, no sensitivity result). Worktree read only, content commit 1276467f3 (docs bytes equal at review HEAD 2107c4761); scratch outputs only in my scratch directory.

What I derived myself and compared (details in the two candidate-eligibility reports of this group):
- Native derivation from scratch: generateInventory at 1276467f3 with the committed working registry (sha256 0ce06b5c2086953ed1cd92ce9a05f91ccfcc9c89c7c79bb4b95e521fa7742847, equal to the request; 90772 claims), applyDecisions with 0 findings, unreferencedCandidateRows over the 27 Step 8 source scopes: 117 rows. Strict E (checkInventory strict, scope the 27 sources) run three times, against both prior registries together, against reports/identity-registry.json alone and against reports/phase-02-identity-registry.json alone: each gives open data claims-not-reviewed 566, identical-units-multiple-owners 1, registry-gaps-without-disposition 1, candidate-blocks-unreferenced 117, and an explicit reverse set of 117 rows. Full five-field tuple equality (claimId, path, anchor, unitDigest, fileStatus), sorted: native set, the three E sets, the committed list and the 117 request entries (70 + 47) are identical; the sorted five-field sha256 is 44c55f937dc11ae811eb637ce15075edf3b7d5a45fd59a259e434f58f86f0150, equal to the list's own nativeEquality.tupleSHA256. 0 missing, 0 extra.
- Registry-free cross-check: every unit of every file under the seven namespaces at the pin (693 units), minus all units named as a decision target (5867 names), leaves exactly the same 117 (claim IDs from the registry, digests recomputed from the pinned bytes).
- Namespace membership: every row path is under docs/platform/{agent-confinement 20, decision-citation-drift 9, distillery 9, claude-plugin 9, herdr-web-dashboard 11, observe 13, ui-spec 46}; the list scope equals the 27 sources of step8-liveness.json and the request scope. The existing dashboard carriers are covered: operator-runbook.md contributes only its metadata fence (unheaded-block-1, 1 tuple; every other runbook unit is named by a decision) and contracts/fgos-gateway-api-v1.yaml is fully named (not in the list); README.md and spec.md of the dashboard area account for the other 10.
- Actual status from pinned bytes: every one of the 34 owner Markdown files has Design status Candidate and Canonical No in its header at 1276467f3; kind and kindCanonical equal classifyPath on the header (0 mismatches over all 117 rows; history for the rollout and schema-sidecar files); authorityStatus candidate. All 117 are eligible under A28 item 2; none is in a canonical or Accepted file.
- Zero lost native tuples: known IDs (units, retired units, identity gaps) of the previous committed working registry (2d6d53884, 97757) are all present in the new one (98430), 0 lost; likewise 0 of the 91964 identity-registry IDs and 0 of the 85772 phase-02 IDs are lost. Of the 117, 1 (the runbook fence) was known before this sync.
- Prior approved lists unchanged: from the Step 8 start commit 111adc51f to HEAD no other candidate-unverified-*.json and no non-s8 decision shard changed (git diff --stat shows only the new list and the seven s8 shards).
- Mechanical on every row: shown text, ancestry and digests equal the committed bytes, anchors exist (117 of 117 by list-doc-anchors --check), the request evidence JSON sha256 13e41fae... equals the sha256 of the compact entry (Source digest below), the displayed content equals the committed file byte for byte as parsed JSON, and the list file's own sha256 at HEAD is d8b82cf1340a236b8c4be6b003764a8e9a7f0f837444cb457827ae51bc086f19. All 117 rows are status candidate-unverified, reviewStatus pending, one author session.
- Content read (deep): 117 shown texts scanned and 18 read in full (seed 20261015); all are labelled Added-in-candidate navigation, bookkeeping, metadata fences or sidecar provenance; no unlabelled substantive claim sits in the list. The checkable statements (provenance commit and blobs, sidecar blob ids and sha256, links, cited paths, observe link rebase, tool-root obligation and its owner-queue row) are true at the pin.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| reverse-list | ok | deep: the list file has count 117, 117 rows, all candidate-unverified and pending, and equals native strict E on full five-field tuples against both priors together and each alone (sorted tuple sha256 44c55f93...f0150), my independent derivation, the request entries and the committed bytes; namespace, existing dashboard carriers, pinned-header eligibility and zero lost native IDs checked; one owed addition noted below, not a tuple defect. | 13e41fae50d85cce34c8a63f7817ee4db23304ea97fe00fc6d26f15ce729fb53 | none |

## Notes

- Result: 1 ok, 0 rework, 0 hold. Reverse eligibility only; the list stays candidate-unverified and every full truth check remains owed at promotion (A28 item 3b).
- Owed addition (for the Lead): owner answer A40 item 2, decided after this list was authored, asks the five spec carriers (observe, herdr-web-dashboard, agent-confinement, claude-plugin, decision-citation-drift) and the ui-spec overview to carry the note "known stale carried sentences; full truth check owed at promotion" in the candidate-unverified list. The current list has no carrier-level field for it (candidate-unverified-root-authorities.json shows the A35 precedent as workStateSpecCarriers). Add it with the A40 corrections; it does not change any tuple.
- The native-sync gates log ends with an AssertionError (expected 3 undisposed registry gaps, found 1); the author's methodNotes explain it (two confinement gaps already have reviewed accounting) and my reruns also give 1, so the list is unaffected. The remaining open gap is the dashboard predecessor and stays a separate blocker.
- Nothing was written in the worktree or main checkout; git status --short in the worktree is empty.

Unresolved: none for the list tuples; the A40 carrier note above.
