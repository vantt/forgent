# review-a38-step-02g-map-replay

- Reviewer: `reviewer:sonnet-session:ae9f3e18031d0b827@2026-10-19`
- Worktree: `/home/vantt/projects/forgentX-s8-review`, detached at `a17de68c167b9c1a657a1c312e4f0d96499fb58a` (accounting); author `271823d69`; census input commit `bcbef05c15c0cedd6612cc178808b5b2efedc06f`
- Script sha256 (phase-08/): replay `7936741a...b65b`; parser `a219ae23...2ab82b`; packet `8e222249...d7bb6`; probes `48d790d1...e268`
- Nothing written inside the repo or the review worktree (git status unchanged: only pre-existing untracked files). All scratch under `/tmp/fgos-work/`. No npm test, no fgos CLI, no `.fgos/` access.

## 1. Read-only and committed-tree confirmation
- parser: `git ls-tree -r -t -z <input>` builds TREE; `exists/is_file/is_dir` are TREE lookups; blobs via `git cat-file --batch` with `cwd=ROOT`; ROOT = script path `parents[3]`, never caller cwd; `.fgos`/`.bee` reads asserted out. Filesystem reads are limited to the plan's own immutable JSON/MD artifacts via `R=Path(__file__).parent`. No writes, no git mutation (replay/probes/packet/parser contain no write/unlink/mkdir).

## 2. Replay
| Run | cwd | Result |
|---|---|---|
| A | review worktree root | PASS, rc 0, failureCount 0 (57 s) |
| B | `/tmp/fgos-work` | PASS, identical bytes to A (`cmp`) |
| C | `/home/vantt/projects/forgentX` (main checkout, different filesystem content) | PASS, identical bytes to A |

Counts: 5,436 edges / 1,036 files; actions preserve 3135, cutover-patch-only 1596, preserve-pending-target 463, preserve-pending-behavioral-proof 163, phase9-row-flip 79; 44 code exclusions. Replay-internal: 9 parser syntax probes, 5 defect-regression probes, 8 negative (mutation) probes all rejected.

## 3. Differential probes (`step-02g-probes.py`)
rc 0, status pass; 69 regression probes, **69/69 `oldRejected:true` and `newPassed:true`** (each fails the immutable 02c/02e/02f behavior, passes successor), plus invariant guards.

## 4. Independent census scan (own script, committed tree at input commit)
Per-class counts, 0 = no violation found:
- prefix/suffix/partial patches (old == full matched unit): 0 of 1,596 patches
- corrupted keys (`[`, `{`, `(`, space in normalized ref): 0
- split label/destination, prefix-inside-token (`docs/architect` in `architecture-*`): 0
- code tokens: 44 excluded with reasons; 0 leaked
- lost `/` (patch old/new trailing slash symmetry, links and bare): 0; lost `#anchor`: 0; backtick count changed: 0
- new link destination resolves (relative to consumer) to desiredOwner for every patched link: 0 mismatches
- partial template patches: 0 (41 template-placeholder + 8 template preserved)
- target not in committed tree: 0; self-target patches: 0
- writers patched: 0 (17 writer/check rows, all preserve-pending-behavioral-proof; block context writers incl. EVIDENCE_DIR example kept as reader beside it per documented probe)
- migration-state: 79, all phase9-row-flip, no path substitution; docs/history refs 767, all preserve; moved-target 23, all preserve-pending-target with successor note, 0 executable
- image `!`: 1 (maps-g-00412) kept in patch; path-text label backticks kept: 0 losses (255 path-text-label rows)
- carriage: 687 rows, all preserve, no patch; parked rows with executable `new`: 0
- operative-read: 29 rows, 0 without whole-word read/đọc/Đọc trigger; 0 patched-to-README misses
- last table row: maps-g-04539-class preserved correctly; directory mirror: 138 patched dir-mirror rows; 0 verification/vocabulary/playbooks rows pointing to README
- retained root files (`docs/backlog.md`, `docs/reading-map.md`, `docs/doc-registry.md`): 0 patched (136 preserve, 5 row-flip, 3 pending-behavioral)
- migration-plan source columns, moved-file successor notes: preserved, 0 patched
- review-data defect diffs (L12-21 vs 02e/02f, L12-22, L12-23): all afterCount 0 (13 L12-23 classes, 36 L12-22, 22 + 22 L12-21)

## 5. Mutation probes (copy under `/tmp/fgos-work/mutbase`, full replay each)
1. census: corrupt a patch target -> FAIL (census differs from reparse)
2. census: drop `!` from image patch maps-g-00412 -> FAIL
3. census: executable `new` on a parked row -> FAIL (crash AttributeError; rejected, not clean message)
4. parser: `is_file` always true (existence off committed tree) -> FAIL (KeyError)
5. parser: drop `\b` from `read` regex -> **PASS (survivor)**. Equivalent on this corpus: `read-only`/`read-map` cannot satisfy the following `\s*:?\s+obj`, and no census line differs; no probe distinguishes it. Low severity.
6. parser: carriage detection disabled -> FAIL (probe assertion, maps-04174)
7. census: lose trailing `/` on a directory patch -> FAIL
8. census: migration-state row downgraded to preserve -> FAIL
7 of 8 rejected; survivor 5 noted.

## 6. Findings (judgment, not mechanical failures)
- J1 (needs deep-reader decision): 28 navigation rows reference an existing same-path `docs/platform/...` file (committed tree) but map to `docs/platform/agent-coordination/README.md` through the "Unique draft mapping; lookup only" alias: `vocabulary/README.md` (10 rows, e.g. maps-g-00034/00057/00501/00563/00624), `playbooks/README.md` (maps-g-00064), `decisions/README.md`, `architecture/README.md`, `proposals/README.md` (e.g. maps-g-00045/00058/00060/00061). Mirror files exist (`docs/platform/agent-coordination/{vocabulary,playbooks,verification}/README.md` confirmed; others by ls-tree test). L12-22's mirror rule is stated for directory references, so these are arguably out of its letter, but the same-path target is exact. Not in the L12-21/22/23 defect lists; flag for the part reviewers.
- J2: mutation 5 survivor above.

## Verdict
Replay PASS from three cwds, byte-identical; 69/69 differential probes fail old and pass new; every L12-21/22/23 defect class independently measured at 0; 7/8 mutations rejected. Existence checks are demonstrably committed-tree based. DONE_WITH_CONCERNS only for J1/J2 (non-blocking, judgment).
