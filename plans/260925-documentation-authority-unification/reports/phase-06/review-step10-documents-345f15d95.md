# Review step 10 re-review documents part 1 (immutable content deltas)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792093168554-f28af963@2026-10-16
Review mode: ordinary
Request commit: c939e9a51560a124e3723ba69ce39a202a1b7efc
Content commit: 345f15d95663260976200be66d1b9a6c648bcd6d

## Scope and method

Request reviewed: review-request-step10-documents-01-345f15d95.md (9 immutable-content-delta entries; md blocks equal the json sidecar; the currentSHA256 of all 9 files equals the committed file). Read-only worktree at c939e9a51; no sensitivity pack requested or made. Each entry is an item row with the entry id as first cell and the file sha256 as target digest.

Checks: for every file I produced a word-level diff 4a18f35ff to 345f15d95 and confirmed the diff equals the one in the request and consists only of the changes described; every changed pointer to bin/fgos.mjs was resolved against the real file (5145 lines; default-case throw at 4415, refuseHelp at 4503, runVerb default block 4414-4417); the links entries were compared against first-authored versions as in the links report; I also grepped all of docs/platform for remaining bin/fgos.mjs:line pointers to see whether any partially refreshed pointer is left behind, which found the two defects below.

Seed and sample: all 9 entries read in full; no Weak-exact or Judgment claim rows exist here. Rework share is 2 of 9 and above 3 percent, and the whole pack was read in full (it is 9 entries).

Result: 7 ok, 2 rework, 0 hold.

## Item table

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| documents-001 | ok | deep: legacy-payload.md Related Files row 'legacy transition' restored to the platform candidate link (first-authored bytes); the 'source transition' row keeps the architect link; the diff is the one line shown, same as links cell-5-0. | none | 30d88a025bf714263860005e1f0f37c96be1c338166febe7b3668ee1c10bd6d6 |
| documents-002 | ok | deep: source-preservation-audit.md: the six-link delta of lines 41-43 only (same as links cells 1-0 to 3-1); remaining rows of the matrix unchanged and equal to first-authored; file sha256 equals the request. | none | 40b8f3d8ed14f9b9e7f3cb1fcb663dcceefb9fee23f0ddeb5bca82512170da89 |
| documents-003 | rework | deep: h-51f5cd7279fd.md line 456 refreshes bin/fgos.mjs:4373 to 4415 correctly (4415 is the 'unknown verb' throw in the default case) and the Gate A scope pointer 4373-4380 plus 4640-4643 to 4414-4417 (default block, correct), but the same sentence keeps the other pointer 4461: at HEAD bin/fgos.mjs line 4461 is a labelFor comment, the 'evolve --help' refusal the sentence cites is refuseHelp(unknown verb) at line 4503 (4461 plus the same 42-line shift); change `bin/fgos.mjs:4415,4461` to `bin/fgos.mjs:4415,4503`. | none | f0aad86c4366f671d7cf7e1fbaa4f998120f6974423f371edecf05cf2dc313f8 |
| documents-004 | ok | deep: h-02842f76ffd2/spec.md two pointers inside Added in candidate notes (row 9 and the RUL36 clause) moved from bin/fgos.mjs:4373 to 4415, verified against HEAD bin (default-case throw); no source text outside those notes changed; sha256 equals the request. | none | 9e962ffb591b13247736df9a62938cbced70ba9c5c8cc5314d9a6bdd21632171 |
| documents-005 | ok | deep: h-37aced3896a8/spec.md the two copies of the historical e2e note change only 4373 to 4415; verified; the rest of the Vietnamese source bullets is unchanged in the diff. | none | 908ab50e89188b13254d00ef9e131cd40c675ac92a61d529e68b7f1d6d82abd9 |
| documents-006 | ok | deep: h-6df5686d0d54/spec.md table row about former evolve role: pointer 4373 to 4415 inside the Added in candidate parenthesis only; verified. | none | 619385c230714647ef060afb7f8140d4747ac4b0ee67c289b0bf8bc9e1150491 |
| documents-007 | ok | deep: h-ce5b9771a26a/spec.md scaffolding note: removed unavailable entry pointers 4373-4380 and 4640-4643 replaced with 4414-4417 (the default block of runVerb, lines 4414-4417 at HEAD, checked); consistent with documents-003 and truthful for a pointer to the rejecting default case. | none | 6bec68a01a54dc4f38b332e709ca9d75d00495697d914239407fd6dddc227a87 |
| documents-008 | rework | deep: h-f34e0d170d89/spec.md scaffolding note now reads `(bin/fgos.mjs:4640-4643; bin/fgos.mjs:4415-4380)`: the first pointer was not refreshed (4640-4643 is now doctor output text, the old evolve registry comment is at 4682-4685) and the second is a descending range made by replacing only the start of 4373-4380; use the same truthful pointer as h-ce5b9771a26a, `(bin/fgos.mjs:4414-4417)`. The second edit in this file (bullet 4373 to 4415) is correct. | none | b3ac5e157266dac80e0e245640f9334b306e2cf874525eb401637a5fbba2800c |
| documents-009 | ok | deep: work-state/README.md line 61 sentence restored to the first-authored link order (same as links cell-4-0 and cell-4-1); sha256 equals the request. | none | e8a20f75d1f5b625bb78842bf80dc804af65d1458468e46d579a28c50de2afb7 |

## Notes

- Both reworks are the same class: a line-number refresh applied to only one of several pointers in a sentence. After the fix, `grep -rn "bin/fgos.mjs:4" docs/platform/runner` should show only 4414-4417, 4415 and 4503 for the evolve notes.
- The carried pointer docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md bin/fgos.mjs:960-980 and the unrelated pointers in docs/platform/agent-coordination verification files were not part of this delta and were not checked.

Unresolved: whether the author wants 4682-4685 kept as an additional pointer in h-f34e0d170d89; I recommend not, because h-ce5b9771a26a uses 4414-4417 alone for the same note.
