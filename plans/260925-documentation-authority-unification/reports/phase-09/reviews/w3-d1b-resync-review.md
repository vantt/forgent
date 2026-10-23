# w3-d1b-resync review (D1b 7be0cbc52, checked at 6d275ad81)

Read-only review in /home/vantt/projects/forgentX-s8-review. Scratch is /tmp/fgos-work/w3-d1b-resync/. Verdicts: [w3-d1b-resync-review.json](w3-d1b-resync-review.json). Result: **61 APPROVE / 6 REWORK** across 67 items.

## REWORK

1. **release-manifest.md:258: the dead link is still there.** The duplicate §5 was removed, but the copy that was kept links `../../host-invocation-routing/legacy-cli-transition.md`. That path does not exist; the real file is `docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md`. The deleted copy had the working link. It is the only new broken link in docs/platform after the commit.
2. **spec.md:549, Data Dictionary row 7.** The row claims to name every registered check but misses 8 Git checks. These are registered in a loop at `src/setup/registrations.mjs:6354-6366` (`git-worktree-recovery`, `git-component-compatible`, `git-transport-config`, `git-trust-topology`, `git-operation-journal`, `git-native-locks`, `git-publication-refspecs`, `git-durability-capability`). Code has 143 checks; the Doer counted only the 135 with a literal id. Row 7b is exact (32/32). The receipt and verification.json "equal code" claims are wrong for the same reason, and so is adjudication 44.
3. **activation-binding.md:488: the implementation fact is still false.** `scripts/fgos-shell-integration.sh` does not run `git rev-parse --git-common-dir`; it reads the gitdir/commondir layout from disk with no git child (lines 27-29 and 57-90). Only the test uses rev-parse, as an oracle. The workspace.rs half of the sentence is now correct.
4. **runner/spec.md:56,63-64: the fenced "Historical source section 552ef3d6" was edited.** Its preamble says it is the complete retained legacy section. Rows 1/1b now hold current corrections instead: neither the legacy bytes nor equal to the live h-02842f76ffd2 table. That leaves two divergent Data Dictionary holders, and the current legacy row 1/1b exists verbatim nowhere. The same file's pointers carrier (line 175) was correctly updated to the legacy bytes. Adjudication 17 depends on this carrier.

## APPROVE highlights

- The other G1/G3 fixes hold:
  - The 6 inbound links to retired-decision-history and its line 30 link now resolve, and the Related Files section is back.
  - The activation-binding and Legacy Setup Scenario duplicates are removed.
  - Both citations are fixed.
  - The receipt's bindingHashEncoding correction is true (10/10/10 occurrences, then 6).
- No new duplicated unit appears in the three areas, and 23 units that were duplicated before now have one holder.
- The drift scan, rerun in scratch at 6d275ad81, matches the committed legacy-drift.json except for its head field. All four files show 0 missing.
- All 1057 s13 rows were checked: source and target digests, ancestry, 876 exact and 92 normalized-equal carries, the 2 envelopes, and no source unit carried twice.
- Since the inventory pin, 709 of 726 added legacy lines appear verbatim in their successors; each of the other 17 is covered by a heading or adjudication row.
- Every bindingSha256 in all shards matches an independent Python recompute of the 4-key recipe plus LF.
- The adjudications are backed by code. I spot-checked about 30: evolve removed in 120af6b3d, coordination in 2180b4e72, `--tier` retired, the doing->todo clamp, detectTrunk, the removed live tee, and others.
- Protected texts are untouched: D-ADR0035/0054/0062, RUL11/RUL104, the 0032 ADR headings and Identity §7a. Nothing outside the writable scope changed.

## Observations (non-blocking)

- Some duplicates predate D1b and are still there:
  - the work-state outcome record, in both non-transitioning-records.md and spec.md;
  - retired-decision-history vs multi-role-harness-distill-record;
  - repository-runtime-layout #9 vs #28.
- 69 s11 unitCarries to the protected knowledge-registry.md are stale. This predates D1b.
- The runner's RUL104 (resume) has the same number as the platform law RUL104. This comes from the legacy runner.md.
- The legacy distribution.md row 7/7b and its git-common-dir sentence are still stale. G9 must not re-import them.
