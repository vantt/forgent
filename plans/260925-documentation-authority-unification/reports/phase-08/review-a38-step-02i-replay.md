# Review: step-02i committed-byte replay

- Reviewer: reviewer:sonnet-session:ab7dee6689abeaace@2026-10-19
- Worktree: /home/vantt/projects/forgentX-s8-review, detached at 74e3ecf1eb9a2bc1429f50a25bb7017e240ef798 (accounting commit 74e3ecf1e; author commit 904d0fb5c). No tracked-file changes (git status shows only pre-existing untracked files).

## Commands
1. `python3 plans/260925-documentation-authority-unification/reports/phase-08/step-02i-replay.py --input-commit HEAD` (cwd = worktree root): exit 0, status PASS, stderr empty.
2. `cd /tmp && python3 <abs path>/step-02i-replay.py --input-commit 74e3ecf1e`: exit 0, stderr empty.
3. `cmp a.json b.json`: IDENTICAL (byte-for-byte). Outputs are under scratchpad/replay-02i/.
The script resolves its own directory and ROOT from `__file__`, so cwd does not matter.

## Counts (from replay output)
- status PASS, failureCount 0, failures [].
- edges 5436, files 1036, codeExclusions 56.
- actions: preserve 3119, cutover-patch-only 1507, preserve-pending-target 469, preserve-pending-behavioral-proof 194, phase9-row-flip 147.
- parser syntax cases 9 (claimed 9): OK.
- differential regression probes 192 (all old-rejected and new-passed, oldFailuresProved 192), plus 8 invariant guards (claimed 192): OK.
- negative mutation probes 8, all rejected (claimed 8): OK.
- overlayControls in the census: 197 (claimed 197). The replay checks each against corrected source bytes and its final effective-row fingerprint: OK.

## Hashes
The replay recompiles the mapping, exception, sample and part tables from the census and requires byte equality with the committed tables. It also checks file and call-site digests and each overlay control's effectiveSha256. failureCount 0 means all final hashes match the committed tables. I did not separately print the individual hashes.

## Git-tree existence
step-02i-parser.py builds `exists()` and `is_dir()` from `git ls-tree -r -t -z <input commit>` and `read()` from `git cat-file --batch`. Commit tokens are checked with `merge-base --is-ancestor` and `rev-list --objects`. I found no filesystem `exists`, `is_file` or `os.path.exists` calls. Identical output from /tmp supports this: existence and reads come from the Git tree.

## Spot-checks (5 random edges, seed 7, source bytes via `git show HEAD:<path>`)
All 5 matched on both the exact column span against matchedExpression and the call-site line sha256.

| edge | file:line | result |
|---|---|---|
| maps-i-02653 | docs/platform/agent-coordination/history/documentation-migration/source-inventory.md:197 | span OK, hash OK, target in tree |
| maps-i-01236 | docs/backlog.md:39 | span OK, hash OK. Target docs/history/gate-dialogue-continuity/CONTEXT.md is absent from the tree. The row is a generated row (Step 5 generator owns it) parked as preserve-pending-behavioral-proof, consistent. |
| maps-i-03235 | docs/platform/agent-coordination/history/retired-engine/files/playbooks/prompts/master-coordinator.md:597 | span OK, hash OK, target in tree |
| maps-i-05333 | docs/templates/verification.md:35 | span OK, hash OK, relative link |
| maps-i-00396 | docs/architect/agent-coordination/documentation-standardization-plan.md:825 | span OK, hash OK, target in tree |

## Verdict
PASS. The replay at the runner commit is reproducible and cwd-independent. All author-claimed counts match. No mismatches. Scope is mechanical only, as the replay's own `limits` field states; semantic review is not covered.
