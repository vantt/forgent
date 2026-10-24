# Declared Git exemptions — implementation receipt

Authority: W3 G4 brief; owner L13-6 (1). Input HEAD: `dac65ad8ba135e8acf33438c8790efc222133e37`.

## Result

**25 declarations, 0 undeclared sites; actual-tree doctor passes.** The scanner generated the census twice with identical bytes. [Audit](audit.json): 1,108 scanned files, 287 classified rows, payload digest `063f8b56413eb43bf953b695081933b590f6e4a23d1a7219eefb7db34a6ab026`. The exact set of 25 input sites joins to 25 output declarations; no census row was manually moved. Git-owner review remains pending; this receipt does not close overall G4.

- `scripts/lib/git-one-door-declarations.v1.json` is the single input. Existing `hook-read-context` owns S1; existing `configured-binary` owns the five project commands. New `declared-tooling-exemption` owns ten pinned reproduction calls and nine capability gaps: no existing class honestly describes these fixed Git evidence readers. Each entry carries `reason` and `retireWhen`.
- Exact path + enclosing named function + SHA-256 of callee/comment-blanked call text replaces line-number identity. Preceding line shifts survive; edits inside the call intentionally need re-review. Deleted, edited, renamed, duplicate or ambiguous declarations fail closed; unrelated calls in the same file are not exempt. Declarations match raw sites only, so future automatic provenance proof requires retiring the declaration too.
- Reused scanner classes, lexer, function spans, call boundaries, file digest and census verifier. Only `show-ref` and `diff-tree` join the hook read set. Hook and all 25 consumer sites are unchanged.
- The input lives under already-shipped `scripts/`, not an unshipped new contracts path. [Production payload selection](payload-selection.json) confirms inclusion through `listLegacyNodeSourceFiles` (879 files selected). Its digest is included in the census and checked by the existing doctor row; no config default, environment contract, dependency or new registry row is added. `src/setup/git-checks.mjs` needs no change.
- Both pinned generators retain their exact approved blobs (`a52981ff2862cc2c553dbb3181e4e822a26b146b`, `0f1cd7e1cee308772c0b56c37f3190333039cfb3`). No reproduction manifest/baseline changed. All previously scanned source digests are unchanged; the scanner itself is excluded from its file list by the pre-existing rule, so its separate SHA-256 is recorded in the audit.
- Updated CHANGELOG and [the declared packet](../exemption-proposal.md); added [Git-owner audit instructions](../git-owner-review-request.md).

## Prior art and proof ownership

Read the execution plan, owner answers, W1 review notes, all three predecessor Git receipts, reading map and Git spec boundary/classification history. `git log -S 'hook-read-context'` leads to `10416a6b0`; `876ea737f` established value-flow classes, not path suppressions. No existing `retireWhen` mechanism was found in scanner/contracts history. This change extends that classification door with the explicitly requested owner input; it does not replace value-flow analysis or extend any Git port.

Tests first: the new declaration proof passed **0/6** before implementation (six expected failures) ([log](logs/tests-first.log)). `test/git/one-door.test.mjs` remains the owner of existing automatic analysis; its path is outside this brief's writable list, so new declaration behavior is owned in the permitted `test/scripts/` tree. No existing test was deleted, modified, skipped or weakened. One doctor wiring proof adds no duplicate case matrix.

| Individual file | Exit | Pass / total | Evidence |
|---|---:|---:|---|
| `test/scripts/git-one-door-declarations.test.mjs` | 0 | 6/6 | [log](logs/declarations.log) |
| `test/setup/git-mutation-census.test.mjs` | 0 | 1/1 | [log](logs/doctor.log) |
| `test/git/one-door.test.mjs` (unchanged) | 1 | 4/6 | [log](logs/one-door.log) |

Each ran separately as `env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work/w3-g4-declare-brief/tmp FGOS_HOST_BIN=<releasePath>/bin/fgos node --test <file>`. `releasePath` was read from the explicitly authorized activation file; exact value is in [receipt.json](receipt.json).

The two existing one-door failures are `git-addon-not-shipped` / `git-addon-unavailable`: fixture trees inside this repository need Inspect to enumerate their files, but the worktree has no payload-local addon. They are **not green** and were not worked around. `test/setup/checks.test.mjs` was not launched: its top-level `ensureScriptAddon()` can stage/build outside the writable list. The Lead must run these existing proofs in a properly staged checkout. Full suite, `npm test`, test launcher and Cargo were prohibited/not run.

## Actual-tree scan and doctor evidence

`node /tmp/fgos-work/w3-g4-declare-brief/scan-source.mjs --write` ran twice, with the activated host environment, explicit released-addon descriptor and mode-0700 scratch state root. It uses production `createGitInspect` + `scan({root, openInspect})` + `writeMutationCensus`, the same explicit-descriptor shape as distribution's `readCheckoutWithAddon`; only the census is written in the workspace. It targets the actual source worktree, not a copied payload. [First generation](logs/declared-source-scan.log) and [replay](logs/replay.log) both show 0 sites and a passing `verifyCensus`; the direct doctor wiring test independently calls `checkMutationOneDoor` on this tree. This proves the Node scanner/doctor with the installed addon, not a newly built release. The plain scanner CLI was not used because it can automatically stage an addon outside scope.

`git diff --check` passes. GitNexus posture: **degraded under no-CLI**; source/import/history searches identify scanner consumers as release build, doctor and tests, but no graph-confirmed blast radius is claimed. Before reading the disk brief, the generic orientation capability query was attempted once and refused at startup (exit 127, no installation in this worktree); no successful fgOS CLI or lifecycle operation followed.

No Git write targeted this repository; no stage/commit, accounting/board/status edit, secret edit or source `.fgos` write occurred. Temporary test files, native probe state and scan helper are confined to `/tmp/fgos-work/w3-g4-declare-brief/`. No MDView preview was started because its external registry/database is outside this turn's write grant. `needsWrites: []`.
