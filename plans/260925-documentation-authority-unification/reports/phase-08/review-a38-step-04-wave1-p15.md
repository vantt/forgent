# Review a38 — Step 4 wave 1, part 15 (set step04-012)

Pin: ef62747dd. Payload: step-04-wave1-p15.json. All four source files were read at the pin: cf_access.rs and the web files whole; gateway.rs (2521 lines) through every legacy-reference line plus the context of each edge region.

## Per file

| Path | Stratum | Slots | Verdict |
| --- | --- | ---: | --- |
| apps/fgos-gateway/src/cf_access.rs | unpatched sample | 1 | ok |
| apps/fgos-gateway/src/gateway.rs | unpatched sample | 19 edges / 20 slots (class6-l-000039 has two slots, lines 1261 and 1262) | ok |
| apps/fgos-gateway/web/src/api/errors.ts | patched sample | 1 | ok |
| apps/fgos-gateway/web/src/api/poll.ts | mandatory (one slot) | 1 | ok |

Total slots reviewed: 22 of 22. Dispositions: 1 patch, 2 parked, 19 preserve.

### cf_access.rs
- class6-l-000020, line 2, preserve. `docs/history/herdr-web-dashboard/CONTEXT.md` exists at the pin and is a named historical D8 citation. L12-10 applies.

### gateway.rs
- Preserve under L12-10, named historical or external convention. These edges are 021 (line 1, `docs/history/fgos-interface-daemon/`; the directory exists), 025 (line 44), 030 (line 689), 031 (line 826), 032 (line 837), 033 (line 840), 039 (lines 1261-62, a wrapped reference that is joined correctly), 042 (line 2271) and 048 (line 2352).
  - The `docs/history/` mentions at lines 826, 837, 840 and 2352 describe the runtime path convention the gateway reads. That behavior stays with Step 5.
- Preserve under L12-26(3), surviving native path, with the reader behavior left to Step 5. These edges are 022 (line 2), 024 (line 40), 027 (line 188), 028 (line 254), 029 (line 555), 036 (line 1178) and 038 (line 1248, joined with the next line).
  - `docs/contracts/fgos-gateway-api-v1.yaml` exists at the pin and stays valid.
  - The reader at line 1187 is not patched. This matches the instruction that the contract-file reader stays with Step 5.
- Parked, edges 023 (line 13) and 026 (line 131). Both cite `docs/specs/distribution.md` row 5b and make the claim "not created by anything except `fgos setup`".
  - The row at the pin says exactly that (distribution.md line 65).
  - The candidate `packaging-distribution/spec.md` holds it only inside source-detail carriage (line 527). Patches never point into carriage under L12-26(5).
  - The live code contradicts the gloss. `src/setup/registrations.mjs:3140-3167` has a `gateway-token-configured` doctor check whose fix writes `gateway.token`. A park is therefore correct.
  - The record gives a searchWitness and no patch.
- Census edges 034, 035, 037, 040, 041 and 043-047 are not in this record. They are code-level reader, writer or default-root edges: lines 878, 895, 1187, 1740-41 and 2314-2357. They belong to Step 5 and are out of scope here. This is consistent with L12-58 and the part brief.
- Bare `CONTEXT.md`, `plan.md` and `RESEARCH.md` mentions (lines 2, 518, 605, 825, 1126, 1219, 1759, 2270) name no legacy path. No edge is needed.
- No diff, as expected for a record with no patch.

### errors.ts, class6-l-000063, the only patch
- Source line 3: `// Area spec Edge Cases Settled (docs/specs/herdr-web-dashboard.md:259-260):`.
- Old spec lines 259-260 are the "The gateway is unreachable ... never presents stale data as current" bullet. The cited text matches.
- Target `docs/platform/herdr-web-dashboard/spec.md` exists at the pin and is the current owner. It has `## Edge Cases Settled` at line 267, with the same bullet at line 280.
- The anchor `edge-cases-settled` is the correct slug.
- Replacement: `// Area spec Edge Cases Settled (docs/platform/herdr-web-dashboard/spec.md#edge-cases-settled):`. It is repo-root form, which is right for a TypeScript comment, and the path#anchor form is kept.
- The hunk `@@ -1,6 +1,6 @@` has context lines that match the source byte for byte (import, blank line, three comment lines). Only the comment text changes, so there is no behavior change.
- Timing is Phase 9, and the target's Candidate status is covered by the cutover-patch-only label.

### poll.ts, class6-l-000064, preserve
- Line 3 cites `docs/history/herdr-web-dashboard-plan-realignment/CONTEXT.md` (D9). The path exists at the pin and is a named historical citation under L12-10, so preserve is correct.

## Defects
- None. Outcome rework: 0 files.
- No behavior change in any slot. The sole patch is one comment line. The gateway contract-file reader, the docs/history path guards and the tests are untouched.

## Record-text notes (not rework)
- None of substance. The preserve reasons for the repeated `docs/contracts` and `docs/history` edges are generic templates plus an exact passage, which is acceptable.

## Lead-judgment questions
- None.

## Counts
- step04-012, patched stratum: 1 reviewed, 0 rework.
- step04-012, unpatched sample: 2 reviewed, 0 rework.
- step04-012, mandatory: 1 reviewed (poll.ts), 0 rework.
- Total: 4 files, 22 slots, 0 rework (0%), within the 3% bound.

Status: DONE
Summary: All 4 files and 22 slots in step04-012 are ok. The one patch (errors.ts) has a valid target, anchor and verbatim hunk and changes comment text only. The two parks (gateway.rs token-row 5b citations) and the 19 preserves are correct, and the Step 5 reader edges are properly left out.
