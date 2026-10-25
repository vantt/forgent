Verdicts: 31 APPROVE / 3 REWORK

# W23 review: G9 Phase 9 dependency decisions (d77633af3)

## Scope

This review covers commit d77633af3, which adds three files under `g9/`: `phase9-decisions.json`, `phase9-decisions.md` and `check_phase9_decisions.py`. It was checked against the brief `w22-g9-phase9-decisions-brief.md`, ruling L13-20.2 and the w22 finding G9. All evidence was read at the source pin c94545de5. Per-item verdicts are in `w23-g9-phase9-decisions-review.json`: 33 entries plus 1 for the checker.

## Population (re-derived)

- The 15 G9 carriedBlocker records (listed in `g9/receipt.md`) have 170 parked entries. Exactly 33 of them name Phase 9, and they sit in the 7 records the brief names. This is the same set of record, pointer and id as the packet. Every `dependency` string and every physical-line SHA-256 matches. The 7 records contain 75 other entries, which matches the packet.
- No carriedBlocker record carries a Phase 9 dependency that the packet missed. A wider search (for "cutover", "move" and "retire") finds only WORK, registry or scan-set exports, and those stay external.
- Every entry agrees with the family map in L12-96: decision index = family 6, end-user index = 7, architecture manifest = 22, gateway = 21, and the carries = 15, 16 and 18. Phase 8's `step-07-park-resolution-applied.json` already flips the 26 retained entries to `preserve` and the 3 gateway entries to `patch`. It keeps the 4 carries parked. The packet agrees with that overlay but never cites it (see Low below).

## REWORK (medium): the three gateway `moved` entries

The decision itself is right. L12-96 and move set `/paths/993` give the destination `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml`, and both blobs are byte-identical at the pin. The five code readers each have a patch in `recomposed.json` (`/specs/54,55,56,59,61`). Each patch's `beforeSha256` equals the pin bytes. Each patch retargets every full-path occurrence: Cargo.toml 1, gateway.rs 8 (including the in-file test fixture), mcp.rs 5, client.ts 1 and types.ts 1.

The problem is that the reader list is not complete. It is copied from the code-only R26 unit. At the pin, these candidate documents also cite the old path, and none of them is listed or patched:

- `docs/platform/config/spec.md:83`. No G6 row was found for it.
- `docs/platform/herdr-web-dashboard/spec.md:299`. This is G6 rows f06830, f06831 and f06837.
- `docs/platform/ui-spec/architecture/screens/S03-task-detail.md:121`. This is G6 f07976, judged `repoint` in shard 3.
- `docs/platform/ui-spec/contracts/15-system-events.md:38`. This is G6 f07985, judged `repoint` in shard 3.

Two package files also hold the full old path: `packages/yaml-doc/contracts/fixtures/parse.v1.json:1979` and `packages/yaml-doc/upgrade-record.md:107`. The md calls these "history", but the JSON gives no exclusion or reason.

The basename-only references in `client.test.ts`, `errors.ts` and `network.ts` are correctly left out.

**Fix:** list each document reader. For each one, name its G6 row or add it to an F composition list, and add a row for `config/spec.md`. Record the two yaml-doc exclusions in the JSON with a reason.

## APPROVE

- **26 retained-in-place entries** (15 decision index, 10 end-user index, 1 architecture manifest). The S1 and S2 quotes are present at the pin and do decide retention. `phase-09-atomic-platform-authority-cutover.md:36` also explicitly allows the generated `docs/decisions/index.md`.
- **reference-000232, -000235, -000236 (retired, low note).** The legacy pointers in `docs/specs/runner.md` and `docs/architect/knowledge-registry-redesign.md` are deleted by line 138 of the phase-09 design. The claim carries and s11 bindings point at headings that exist at the pin. The low note: patch S28 (`carries/pointer-patches.json` `/patches/13`) is based on bin bytes 4ad9ed0c, but `bin/fgos.mjs` at the pin is 1c50f564. Its `reviewStatus` is `pending`. The three old lines (1756, 1820, 3569) are still present, so a mechanical rebase at F works. The JSON should say that the patch is stale, not just "existing".
- **author-s4-08912b8301b10321 (retired as superseded).** The backlog row p-8d04c7f1 is now `done` and no longer points at `docs/specs/distribution.md`. `vendored-yaml-parser.md` marks the old procedure historical. The separate STR70a owner question in g9 row 46 is correctly kept open.
- **leadDecisionProposed: 0.** I accept this. Every outcome has a ruling (L12-96) or a carry binding behind it, so no entry needed a proposal.

## Checker (APPROVE, low)

The checker exits 0 at the pin. I reproduced all 14 claimed negative controls in a tempfile scratch directory, and each one exits 1. My probes found these gaps:

- A retained entry that cites the other file's quote still passes, because the source quote is not bound to the file.
- A retained entry flipped to `retired` with no successor passes once the counts are adjusted.
- Retired `patchRefs` are never checked against the pin bytes, which is why the stale S28 patch was not caught.
- The reader set is the R26 unit, so missing document readers cannot be detected.
- `RECORDS` is hardcoded, but my re-derivation confirms it is complete.

## Low / informational

- **Prior art not cited.** The packet does not cite `phase-08/step-07-park-resolution-applied.json`, which already resolved 29 of the 33 entries the same way. Citing it would keep one decision chain instead of two parallel records.
- **Outside this packet, but the same class of work.** Phase 8 left 158 dependencies naming Phase 9, across 29 step-05 records. The other 125 are in 22 records that are not G9 carriedBlockers. At Step 7, 53 of those are still parked:
  - 17 `retention-or-move decision for docs/doc-governance.md`;
  - 1 for `docs/architecture-map.md`;
  - 18 for the ratchet retirement;
  - 13 carries;
  - 3 split-area;
  - 2 scan-set.

  Any phase-09 record citing their ids (for example reference-002482, reference-004035 or reference-003545) was not found. The 33 matches what the brief scoped. But L13-20.2's reasoning (Phase 9's own decisions, settled before F) applies equally to the doc-governance and architecture-map rows. The Lead should confirm who owns them.

## Unresolved questions

1. Who owns the 17 doc-governance.md rows and the 1 architecture-map.md row? These are "Phase 9 retention-or-move" decisions in non-carriedBlocker records, and L12-96 requires a content check before moving them.
2. Should the gateway document retargets be owned here or by G6 shard patches? They need exactly one owner, and `config/spec.md:83` has none.
