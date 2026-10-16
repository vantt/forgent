# Review step 10 round 3 documents part 1 (content deltas and exact line edits)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792114313040-56132651@2026-10-16
Review mode: ordinary
Request commit: bca590a4e
Content commit: 287a22d33a0eaf2d9e47549a1142daf62361bb8c

## Scope and method

Request reviewed: review-request-step10-documents-01-287a22d33.md and its json sidecar (10 entries: 4 whole-file content deltas and 6 exact authorized line edits, all deep; md blocks equal the sidecar; each entry diff equals git diff 5035fed52 287a22d33 for its file). Read-only review worktree at bca590a4e (docs bytes equal the content commit 287a22d33; git diff 345f15d95 bca590a4e over docs shows only the four documents in the documents request, 6 lines). Ordinary review; the request carries no sensitivity pack and none was made (ignored in one line: no sensitivity result is claimed). I never ran the fgos CLI, never read secrets.local.env, and all scripts wrote only to my scratch dir. Checker and tool tests were rerun by me (see below).

Checks: for every entry I compared the committed lines at HEAD with the entry before and after fragments and line numbers (all six line numbers are right: vision 63, 65, 66; packaging 439; h-51f5 456; h-f34e 23), word-diffed h-f34e0d170d89/spec.md against 5035fed52 (one line, only the pointer text), resolved every changed link destination to an existing file, resolved the changed code pointers against bin/fgos.mjs (4414 is default:, 4415 the unknown verb throw, 4417 the closing brace, 4503 refuseHelp of the unknown verb), grepped docs/platform/runner and docs/platform/host-invocation-routing for remaining bin/fgos.mjs:4xxx pointers (only 4414-4417, 4415 and 4415,4503 remain, which answers the previous round note), and confirmed that git diff 345f15d95 bca590a4e over docs is only these 4 files and 6 lines. The 4 file target digests are the sha256 of the committed files, equal to the blobs bound in working-identity-registry.json.

Seed and sample: all 10 entries read in full; no Weak-exact or Judgment claim rows exist here, so A36 sampling does not apply. Rework share 0 of 10. Entries 005 to 010 repeat the line edits already inside entries 001 to 004, each checked separately.

## Verdict table

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| documents-001 | ok | deep: vision.md lines 63, 65 and 66: the three Preserved from links move from the platform candidate destinations (spec.md, architecture/external-provider-protocol.md, architecture/node-to-rust-migration.md) to ../../architect/host-invocation-routing/ host-invocation-provider-routing.md, external-provider-protocol.md and node-to-rust-component-migration.md; labels unchanged, link index and table cell unchanged, all three destination files exist, line 64 legacy-cli-transition sibling already had the same form; matches L10-23; the file differs from 5035fed52 in exactly these 3 lines. | none | 37e2e505dfd4481341e40be7ce505422529846fd8754e0fed1e6ea84163973bd |
| documents-002 | ok | deep: packaging-distribution/spec.md line 439: destination ../system-architecture/architecture/workspace-topology.md becomes ../../architect/workspace-topology.md with the visible label docs/architect/workspace-topology.md verbatim (L10-26); the new target exists and now agrees with the label and the Superseded by list above it; one line changed in the file. | none | c80717db81d1489aaa371982cc3d0ba016a6e70dc03f548627035b67aa53d59a |
| documents-003 | ok | deep: h-51f5cd7279fd.md line 456: bin/fgos.mjs:4415,4461 becomes 4415,4503; at the worktree bin/fgos.mjs line 4415 is the unknown verb throw in the default case of runVerb and line 4503 is refuseHelp(unknown verb) in printVerbHelp, which is the evolve --help refusal the sentence cites, so the previous round rework (4461 as a stale comment line) is answered; one line changed in the file. | none | 177ce0c3218f2e9df96b0a29e782f6f387c10228420e6d32276ad011063e73a4 |
| documents-004 | ok | deep: h-f34e0d170d89/spec.md line 23 scaffolding note: the pointer pair bin/fgos.mjs:4640-4643; bin/fgos.mjs:4415-4380 (inverted range, first pointer stale) becomes bin/fgos.mjs:4414-4417, the default block of runVerb in the worktree; word diff of the whole file confirms that this is the only change; answers the previous round rework. | none | 40eb99dc193dcf7c81a39452ec9ca8255a4b0911df4cb7f969176a3606df7283 |
| documents-005 | ok | deep: exact-authorized-line-edit label L10-24/citation-scaffold, file h-f34e0d170d89/spec.md line 23: the before and after fragments in the entry equal the committed line before and after, and the afterLine equals line 23 at HEAD; no other text on the line moved. | none | 40eb99dc193dcf7c81a39452ec9ca8255a4b0911df4cb7f969176a3606df7283 |
| documents-006 | ok | deep: exact-authorized-line-edit L10-24/citation-refuseHelp, h-51f5cd7279fd.md line 456: before 4415,4461 and after 4415,4503 equal the committed edit; afterLine equals line 456 at HEAD (the Gate A Added in candidate sentence); the same pointer pair is the only remaining bin/fgos.mjs reference of that sentence. | none | 177ce0c3218f2e9df96b0a29e782f6f387c10228420e6d32276ad011063e73a4 |
| documents-007 | ok | deep: exact-authorized-line-edit L10-23, vision.md line 63: the link destination spec.md becomes ../../architect/host-invocation-routing/host-invocation-provider-routing.md with the label kept; afterLine equals the committed line and the destination file exists. | none | 37e2e505dfd4481341e40be7ce505422529846fd8754e0fed1e6ea84163973bd |
| documents-008 | ok | deep: exact-authorized-line-edit L10-23, vision.md line 65: architecture/external-provider-protocol.md becomes ../../architect/host-invocation-routing/external-provider-protocol.md, label kept; afterLine equals the committed line and the destination exists. | none | 37e2e505dfd4481341e40be7ce505422529846fd8754e0fed1e6ea84163973bd |
| documents-009 | ok | deep: exact-authorized-line-edit L10-23, vision.md line 66: architecture/node-to-rust-migration.md becomes ../../architect/host-invocation-routing/node-to-rust-component-migration.md, label kept; afterLine equals the committed line and the destination exists. | none | 37e2e505dfd4481341e40be7ce505422529846fd8754e0fed1e6ea84163973bd |
| documents-010 | ok | deep: exact-authorized-line-edit L10-26, packaging-distribution/spec.md line 439: destination only, visible label docs/architect/workspace-topology.md kept verbatim; afterLine equals the committed line and the destination exists. | none | c80717db81d1489aaa371982cc3d0ba016a6e70dc03f548627035b67aa53d59a |

## Notes

1. Both reworks of the previous documents report (the 4461 pointer and the descending range) are fixed exactly as I asked: 4415,4503 and 4414-4417.
2. The pointer 4373 in other runner notes was refreshed to 4415 in the previous round and is unchanged here.
3. Nothing outside the listed lines changed in the four files (git diff 345f15d95 bca590a4e over docs).

Unresolved: none.
