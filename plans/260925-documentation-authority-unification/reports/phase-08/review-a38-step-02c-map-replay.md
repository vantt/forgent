# A50 Step 02c mechanical replay review (review-a38)

Reviewer: reviewer:sonnet-session:a1da35333c5d5c93c@2026-10-19
Worktree: /home/vantt/projects/forgentX-s8-review, HEAD 2854c92ff (verified, detached, no tracked changes before or after). Author e064f8bd5; accounting 2854c92ff.
Script: plans/260925-documentation-authority-unification/reports/phase-08/step-02c-replay.py
Script sha256: ed70f3dd00b442f9b88f5909781f9b8db5c9d7a4be8f0888180c73037a75be4c (178 lines; identical before and after run)

## Script read-only check
Read in full first. Imports only collections, hashlib, json, math, pathlib, sys (standard library). The only I/O is read_bytes/read_text on repo files and print to stdout. No open(...,'w'), no write_text, no subprocess. It refuses any consumer path starting with `.fgos/`. ROOT = REPORTS.parents[3] resolves to the repo root. Confirmed read-only.

## Replay
`env -u CLAUDE_CODE_SESSION_ID python3 .../step-02c-replay.py` from repo root. Exit 0.
status PASS, failureCount 0, failures [].
counts: originalEdges 5427, correction 48, literal-new 18, wrapped-new 115, rebind 11, mappingJoins 5427, files 1036, mappings 1018, rescanFiles 1390, sampleEdges 815, reviewParts 97.

## Spot checks (independent of the script)
24 edges drawn with random.seed(777): 14 original maps, 4 wrapped-new, 2 literal-new, 2 rebindings, 2 slice2 corrections (maps-01879, 03653, 03651, 03020, 04715, 02211, 02754, 04405, 00328, 03652, 05098, 04484, 03192, 04928, wrapped-0037/0113/0016/0015, expansion-0003/0011, instructions-056, maps-01758, setup-019, instructions-020).
Method: `git show HEAD:<consumer> | sha256sum` vs fileDigest; `sed -n <line>p`; cut of columnStart..columnEndExclusive vs matchedExpression; wrapped rows compared by eye at the consumer line.
Result: 24/24 file digests match; all 18 literal spans equal matchedExpression (expansion-0011 appeared shifted only because `cut -c` counts bytes and the line has a multibyte dash; the character columns 58-88 are right, which is what the script uses); wrapped lines show the expected wrapped citation. Additionally 25 randomly chosen mappings (seed 5) were hand-joined: every member edge's (normalizedReference, desiredOwner, desiredAnchor), with the rebinding overlay applied, equals the mapping's (legacyReference, owner, anchor); 0 mismatches. Exception sets wrapped-new-edges, wrapped-rebindings, literal-new-edges, slice2-corrections equal the full source populations (115/11/18/48). Every consumer path of the 5,427 entries is in the 1,036-file list (606 paths carry edges; 430 files carry zero lexical edges; 5,427 edgeIds total).

## Negative probes (14 mutations on a copy in /tmp/fgos-work, repo untouched, sandbox deleted)
All 14 produced FAIL: wrong file digest; span column shift; line shift; changed context text; dropped mapping edge; dropped rebinding overlay; changed rebinding owner; dropped original edge; emptied file edgeIds plus bad file sha; shortened exception set; swapped sample entry; wrong supersedes fingerprint; changed cutoverAction; altered wrapped physical span text. Unmutated copy PASS.

## Soundness assessment
- Digests: sound and complete. All 1,036 original file digests plus per-edge fileDigest, 1,390 rescan files, anchor API pins, target digests, passage digests, review source pins.
- Lines/spans/contexts: sound. Literal columns, wrapped physical spans and their join, call site, bounded full-line sha, context lines checked for all 5,427 + 192 new/corrected/rebound rows.
- Mapping joins: sound for the 5,427 mapping population (every edge joins exactly once, counts, failure ids).
- Coverage: sound for original population, file/edge join, 815 seeded sample (recomputed from seed), part partition, byte/entry limits, unique reports.
- Correction overlay precedence: adequate but narrower than the request text suggests. Only the rebinding overlay feeds `effective`; just 1 of the 11 rebindings (maps-01758) targets a maps edge. The other 10 and the 48 corrections and 133 new edges are outside the 5,427 join; for them the script verifies span/digest, the supersedes row fingerprint, blocked-has-no-`new`, and exception/part membership, but not that downstream consumers use the corrected row instead of the superseded one. An overlay-precedence error in the other censuses would not be flagged here.

## Concerns (non-blocking)
1. Membership of writers (781), behavioral/runtime (1,072) and native-dynamic (9) sets is checked only for self-consistency with the parts, not re-derived (judgmental classification; correctly described as conservative in the request).
2. run() aborts on first KeyError-class exception, so some failures (e.g. dropped rebinding) surface as a KeyError plus source-pin failure rather than a clean join failure; still FAIL.
3. Completeness of the wrapped rescan (that no citation was missed) is digest-pinned, not re-derived.

## Verdict
Replay PASS (exit 0, 0 failures). Script is read-only, stdlib-only, and its checks are sound for digests, lines/spans/contexts, mapping joins and coverage; correction overlay precedence is sound only for the maps population (concern above). No failure rows.
