# Review A38 - Step 4 wave 2, part 20 (set step04-011)

Pin dc24ce645. Source read whole from `git show dc24ce64527fbffd23e1643f35a7ddf808fd7b45:src/cli/command-registry.mjs` (2345 lines): all 28 comment lines read, and every `docs/` token in the file was enumerated and compared with the record.

## src/cli/command-registry.mjs - set step04-011, stratum mandatory re-review - verdict ok

Slots reviewed: 1 (class6-l-000205 joined with cli-007), plus all 36 stepFiveExcluded entries.

- class6-l-000205 / cli-007, line 7 col 46-77 `docs/architecture-manifest.json`: disposition preserve, target/anchor null, timing none. This is correct. The line is the comment "this module sits at the `kernel` layer in docs/architecture-manifest.json:". The file `docs/architecture-manifest.json` exists at the pin, and it is a retained root authority (owner-answers L12-21..: retained legacy path preserved). cli-007's `docs/architect` match is a false prefix match, and the reason says so. The wave 1 rework is resolved.
- stepFiveExcluded (the wave 1 requirement that example-string edges be listed): all 24 census edges (cli-008..011, class6-l-000206..225) are listed, each with a pinned-commit twin. Each is a runtime string, not a comment. I checked each at its source line:
  - `description:` and `examples:` strings at lines 445, 491, 638, 676, 846, 861, 886, 987, 1019, 1034, 1035, 1746, 1760, 1767, 1768, 1864, 2075.
  - Line 846 appears three times (`docs/specs/<area>.md`, `docs/specs/`, `docs/decisions/index.md`). Line 2075 appears twice.
  - Line 1035 (`--plan docs/history/tsk-19j/plan.md`) is a `fgos gate-check` example string.
  - The reason text L12-60(1) fits all of them. Step 5 owns the output/path parity.
- Extra non-census example strings are also excluded: 845 (`docs/**+src/**+plugins/**`), 1416 (`docs/ast.md`), 1725/1756 (`docs/<quadrant>/...`), 1828, 1849, 2245. They are all runtime help strings. Excluding them is harmless and correct.
- No maintained prose comment is left without a slot. The comments at lines 1-61, 428-434, 872-877, 1186-1189, 1360-1362 and 1850-1854 reference only code paths, tsk ids or `.bee/bin/lib/command-registry.mjs`, which is outside the repo. None cites a retiring docs/specs or docs/architect path.

OUTCOME defects: none.

Record-text notes (not rework):
- The `docs/` tokens at lines 520 (`docs/feature/task` is only a kind vocabulary), 861 col 214 and 1725 col 171 (`docs/enduser-docs-index.json`), and 999 (`docs/platform/session-identity/spec.md`) have no census edge and no exclusion entry. All are runtime description strings. None points at a retiring root (`docs/specs/**`, `docs/architect/**`). `docs/enduser-docs-index.json` is a retained path. This is no outcome defect; adding them to stepFiveExcluded would only be tidier.
- Line 2075's description text carries `docs/specs/distribution.md` as a present-tense runtime help string. It stays with Step 5 and is correctly excluded.

Lead-judgment questions: none.

Counts: set step04-011 / mandatory stratum: reviewed 1, rework 0.

Status: DONE
Summary: The one slot (class6-l-000205) now preserves with a correct reason and an existing target. All 24 example-string census edges are in stepFiveExcluded with a valid reason. I found no outcome defects.
