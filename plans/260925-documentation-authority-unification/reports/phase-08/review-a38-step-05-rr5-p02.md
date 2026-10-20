# Review a38 Step 5 seams 1-4 bounded re-review, part p02

Payload: s4-src-p02.json (10 files, 54 changed items: 38 literal references, 16 dynamic tuples). Judged against L12-72 and L12-74 (R10-R16), windows and pinned bytes.

## Per file

| File | Verdict | Items |
|---|---|---|
| scripts/generate-doc-inventory.mjs | ok | 6 |
| scripts/generate-shipped-path-inventory.mjs | ok | 9 |
| scripts/knowledge-bootstrap.mjs | ok (empty payload) | 0 |
| scripts/knowledge-classifier.mjs | ok | 12 tuples |
| scripts/knowledge-migration.mjs | ok | 6 tuples |
| scripts/propose-doc-decisions.mjs | ok | 3 |
| scripts/verify-phase-01.mjs | ok | 3 |
| src/report/capability-plan-lint.mjs | ok | 1 |
| src/setup/git-hooks.mjs | ok | 1 (diff reviewed) |
| src/setup/registrations.mjs | ok | 13 (4 literal + 5 literal patch-class, 9 tuples; diff reviewed) |

## OUTCOME defects

None.

## What was verified

- generate-doc-inventory L328-340 (DIRECTORY_HEURISTICS table), propose-doc-decisions L107/L158, and verify-phase-01 L413/L416: path operations of this plan's own gate scripts. Preserve under R13 with a frozen-gate witness is correct. The docs/specs and docs/architect rows are covered by R13/p16/p24/p29.
- generate-shipped-path-inventory: L256 (docs/specs/) and L258 (docs/architect/) are real classifier prefixes in one `startsWith` chain. Both park with the specific same-cut obligation (frozen-B lifts at Phase 9), as R13 requires, and they agree. L190-193, L393/394 and L814 are retained prefixes or rendered prose, so preserve is right. L814 is emitted report text.
- knowledge-classifier L120-190: fixed retained roots (`targetDirs`, `docs`, the docs/history output dir) are read and written. All 12 tuples are ADMIT/preserve, which matches p19. The tuples carry real path operands.
- knowledge-migration:
  - L164 (scalar select of `currentPath : oldPath`) and L200 (boolean traceability guard) reject. That matches R10/R16.
  - L189 `existsSync(path.join(repoRoot, targetPath))` probes the retained docs/knowledge target, so admit/preserve is right.
  - The six oldPath-driven parks stay parked and are outside the changed set.
- git-hooks 003796:
  - The anchor `pointers-implementation` matches the pinned heading `#### Pointers (implementation)` at spec L784.
  - The patch is a comment-only change in a source file and names its output delta and inverse.
  - The target holds the same contributor-hooks passage as the old spec, which is the R8 module-pointer rule.
- registrations diff:
  - It edits only L874, L2045, L2094, L3063-64 and L3518, which are exactly the five admitted patch items (003811, 003845, 003806, 003850, 003804).
  - All four docs/knowledge targets exist at pin aa8d3437 and carry the original file basename.
  - The wrapped comment `docs/explanation/gate-bypass-` / `// design.md` is rewritten so the wrap is preserved.
  - 003845/003850 flipped from REJECT to ADMIT/patch correctly (R8: operative comment with a live holder).
- registrations L3915 `docRegistryAdopted` probes: pure existence probes of fixed retained paths with no state comparison, so admit/preserve is right. The L3930/3931/3961/3962 stale-check and repair parks sit on other lines and keep their state-parity blockers (R15). No R7 conflict.
- registrations guards (`isOwnPath`) reject. The core/instructions probe is admit/preserve per R4.

## Record-text notes (not outcome defects)

1. generate-shipped-path-inventory 003588 blockedReason ends "independently of missing-file examples". That is vague. State the actual classifier consequence for retired architecture carriers.
2. knowledge-classifier tuple pathOperand `['how-to'` and the reason fragment `"targetDirs = ['how-to'"` are truncated operand labels. Use the full `targetDirs` list expression.
3. Gate-script preserve reasons are identical across items within each file. That is allowed by R13 (one witness per file), but the per-item `resolverWitness` repeats it. This is cosmetic.

## Lead-judgment questions

1. registrations patches emitted pointers from docs/how-to/* and docs/explanation/* to docs/knowledge/*. The generators (classifier L190-193/L393-394, DIRECTORY_HEURISTICS, capability-plan-lint L17) preserve docs/how-to and docs/explanation as retained roots. This is consistent only if the shipped docs/how-to tree still exists after Phase 9 alongside docs/knowledge. It exists at pin (34 files), so it is acceptable now. If Phase 9 deletes or relocates docs/how-to, those preserves need revisiting.
2. git-hooks: the cited anchor covers the contributor-hooks setup and manual trigger (spec L803-812, RUL6 at L632-636). It does not literally state "no `.git` retained when installed as a dependency". It is a navigation pointer, not a factual citation, so I accept it.

## Counts

Items reviewed: 54. OUTCOME defects: 0. Record-text notes: 3. Lead questions: 2.
