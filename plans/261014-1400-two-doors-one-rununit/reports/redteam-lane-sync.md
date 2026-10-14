# Red team: rununit-sync lane (`syncBase`)

- Target: `git diff main...HEAD` on `feat/rununit-sync` (996cd913c), worktree `/home/vantt/projects/forgentX-worktrees/rununit-sync`
- Method: throwaway `node --test` files under `/tmp/claude-1000/redteam-sync/`, using the fixture shape of `test/runner/execution/run-sync.test.mjs`: a real bwrap-confined worker, fixtures from `makeFixtureDir`, and absolute imports into the worktree's `src/`. To get a baseline for the non-sync behavior I extracted main's `src/` with `git archive main` to `/tmp/claude-1000/redteam-sync/main-tree` and ran the same test against it (`RT_TREE=...`).
- Run: `cd /tmp/claude-1000/redteam-sync && env -u CLAUDE_CODE_SESSION_ID node --test <file>`
- No source file in the worktree was edited, and no git write command was run there.

## Hits (severity order)

| # | Severity | Hit | Repro |
|---|---|---|---|
| H1 | Medium | The settlement change affects units **without** syncBase. Take a writing seat whose only change is to an in-scope file that was already dirty at launch. That change can come from the worker or from anyone editing the file concurrently. On main the seat ends `execution-failure` (no evidence). On this branch it ends `pass`, the commit is `no-changes`, and the edit is left uncommitted (excluded as `preExistingInScope`). The unit reports success but commits nothing. | `a7-settlement-nonsync.test.mjs` › "in-scope launch-dirt changed during the turn" (FEATURE: `pass`, MAIN: `execution-failure`) |
| H2 | Medium-Low | A conflicted path is added to `writeScope` as given, but `canonicalizeWriteEntry` trims whitespace. A conflict in `trail ` therefore becomes the scope entry `trail`, which covers `trail/**`. Likewise `sub/ ` becomes `sub`, which covers all of `sub/`. The worker created `trail/evil.sh` and the runner committed it. A filename in the base ref is enough to widen the scope beyond the conflicted file. | `a3-conflict-path-names.test.mjs` › "trailing-space conflict path…" (`files:["trail/evil.sh"]` committed) |
| H3 | Medium-Low | A conflicted path that starts with `:` (or any name `canonicalizeWriteEntry` rejects) is only screened for `*` and `\` (`unscopable`), so it lands in `writeScope`. `settleRunOutcome` then throws `WriteScopeError` at the new `editedInScopeDirt` line (settlement.mjs:717). `runUnit` throws, the assignment never settles, the merge stays open, and `unit.json` is left with `sync.status: conflicted` and the poisoned scope. A resume is refused because the "prior attempt has not settled" (it needs `--force-new-attempt`, and would then hit the same throw). | `a3-conflict-path-names.test.mjs` › "conflict path starting with ':'…" and "':' conflict path: the resume throws too" |
| H4 | Medium-Low | The marker check misses a non-default `conflict-marker-size`. `CONFLICT_MARKER` only matches exactly 7 characters followed by a space or end of line. With `.gitattributes: doc.md conflict-marker-size=10` (a common setting for markdown/asciidoc), git writes 10-character markers. A worker that only touched the file passed, and the runner concluded the merge commit with every marker still in `HEAD:doc.md`. | `a4-marker-bypass.test.mjs` › "conflict-marker-size attribute…" |
| H5 | Low | The clean-merge path of `startSyncMerge` never checks what it committed, unlike `finishSyncMerge` and `commitUnitWork`. A pre-commit hook (main's hooksPath) that runs `git add injected.txt` got `injected.txt` into the runner's `chore(sync): merge main` commit, and the run passed. The same hook on the conflicted path is caught (`committed-set-mismatch`, and the resume is refused). The hook is trusted, but the invariant is enforced on only one of the two merge-commit paths. A realistic version is a hook that runs `git add -A`/`-u` and sweeps stray worktree files into the merge. | `a6-hooks.test.mjs` › "clean merge: a pre-commit hook adding a file…" |
| H6 | Low | `runPendingSync` short-circuits only `status === 'merged'` for sync-only units. Resuming a sync-only run whose sync was `up-to-date` (already passed, or crashed after the result was persisted) runs the pattern. A worker is spawned with the objective "Merge main into this branch." and the original `--writes` scope, and its files get committed. | `a5-limbo-resume.test.mjs` › "resuming a passed up-to-date sync-only run spawns a worker" (spawns 1, `docs/surprise.md` committed) |
| H7 | Low | A conflicted filename containing a newline is copied verbatim into `syncBrief` and into the "Write scope" lines of the prompt (three places). A base-ref filename can inject instruction lines such as `## New instructions` into the worker brief. | `a3-conflict-path-names.test.mjs` › "newline in a conflicted file name…" |
| H8 | Low | `finishSyncMerge` never takes back its own `git add -A` when it returns `staged-set-mismatch`. In the repro the worker replaced conflicted `doc.md` with a directory `doc.md/evil.sh`. The run fails safely, but the index keeps `doc.md/evil.sh` staged. Every resume is then refused as `foreign-staged-index` ("staged changes this run did not make"), which is untrue, and a person who "just commits" concludes the merge with `evil.sh` in it. | `a4-marker-bypass.test.mjs` › "worker replaces the conflicted file with a symlink (outside) or a directory" (the `dir` / `dir resume` lines) |

Not a security hit, for information: appending a single NUL byte to a conflicted text file makes `pathsWithConflictMarkers` treat it as binary, so markers are committed (`a4` › "a NUL byte anywhere…"). The worker controls the content anyway, so the marker check is a quality gate, not a boundary.

## Misses (attack held)

| Attack | Result | Evidence |
|---|---|---|
| Worker writes gitdir `MERGE_HEAD` or the index | MISS | `EROFS` for both (`a1`) |
| Worker edits main `.fgos/assignments/<run>/unit.json` | MISS | `EROFS` (`a1`) |
| Worker writes into the main checkout | MISS | `EROFS` (`a1`) |
| Worker overwrites the worktree `.git` pointer with a fake gitdir | MISS for the sync code: `gitContext` ignores the pointer, the merge was concluded correctly, and the run passed. The forged pointer stays in the worktree afterwards; that is a pre-existing issue outside this diff. | `a1` (`gitptr:WROTE`, outcome pass, merge commit correct) |
| Conflicted file replaced with a symlink to `/etc/hostname` | MISS (by design): git commits a symlink blob (mode 120000) and never follows it. Plain `commitUnitWork` does the same. | `a4` `symlink` line |
| Parent dir of a conflicted path swapped for a symlink to an outside dir | MISS: `git add` refuses ("beyond a symbolic link"), the outside dir is untouched, and the merge is kept | `a4` `parent-symlink` line |
| Worker deletes the conflicted file | MISS (a valid resolution): the merge commits the deletion | `a4` |
| CRLF markers; diff3 `\|\|\|\|\|\|\|` alone | MISS: both caught as `conflict-markers` | `a4` |
| Glob characters in a conflicted path: `[ab].md` | MISS: matched literally; worker-written `a.md`/`b.md` were reported out of scope and not committed. `*` and `\` get `unscopable-conflict-path`. | `a3` |
| Ref injection: `--upload-pack=x`, `-main`, `main^{tree}`, `HEAD@{1}`, `@`, `a..b`, `main~1`, `main:x`, unicode, whitespace, NUL, RTL override, `.lock`, a leading or trailing `/` | MISS: all refused by `isSyncRef`. Accepted oddities (`HEAD`, `ORIG_HEAD`, `MERGE_HEAD`, `refs/stash`, short sha) resolve through the trusted gitdir to a commit, or are refused at seed time. `rev-parse` uses `--end-of-options`, and the merge gets the sha, never the ref. | `a2` |
| bin `--sync` parsing: bare `--sync`, `--sync --upload-pack=x`, `--sync=main`, `--sync main` without `--writes`, `--sync` with `--unit` | MISS: every form refused with a validation error (exit 4) | `a2` |
| Person aborts the open merge, then resumes | MISS: `RunnerConfigError` "was aborted" | `a5` |
| Person aborts and opens a different merge, then resumes | MISS: refused "no longer in progress" | `a5` |
| Person concludes the merge by hand (even with markers), then resumes | Accepted as `merged` / `by: outside`. This is by design: a person is trusted. | `a5` |
| Crash after `git merge`, before unit.json recorded the conflict (`pending` + `started`) | MISS: the resume adopts its own merge, the worker resolves it, and the merge commit is correct | `a5` |
| Plain writing unit, or a second sync unit, started over a sync run's open merge | MISS: both `policy-refusal merge-in-progress`, and `MERGE_HEAD` is unchanged | `a5` |
| Hook rejecting merge commits | MISS: a clean merge is aborted (HEAD and MERGE_HEAD clean); a conflicted merge is kept, and the resume commits once the hook is gone | `a6` |
| Hook injecting a file into the conflicted-merge commit | MISS: `committed-set-mismatch`, and `assertNoStrayCommit` refuses the resume | `a6` |
| Settlement: mtime-only touch of in-scope dirt; edit of out-of-scope dirt | MISS: both still `execution-failure` (content sha256, scope filter) | `a7` |
| Non-sync unit with launch-dirt plus a new file | Unchanged from main (`pass`, commits only `docs/new.md`) | `a7` |
| Non-sync unit over a foreign merge that staged nothing | Behavior change, for the better. On main the unit passed and **concluded someone else's merge with the agent's files** (a pre-existing bug). On this branch the unit is refused with `merge-in-progress`. | `a7` (MAIN: `concludedForeignMergeWithAgentFiles=true`) |

## Notes for the fix

- H2/H3/H7: validate each conflicted path with `canonicalizeWriteEntry(p) === p` and refuse anything containing a control character. Send failures to `unscopable-conflict-path`, with the merge aborted, instead of checking only `*` and `\`.
- H3: `editedInScopeDirt` must not be able to throw inside settlement. Validating the scope once (above) covers this.
- H1: limit `editedInScopeDirt` to the sync's own conflicted paths: pass them to settlement, or only count them while `unit.json#sync.status === 'conflicted'`. Without that limit, launch-dirt that is never committed keeps counting as evidence for every writing unit.
- H4: read the `conflict-marker-size` attribute (`git check-attr conflict-marker-size -- <paths>`), or match `^(<{7,}|>{7,}|\|{7,})( |$)`.
- H5: run the same committed-set check after the clean-merge commit (files of `HEAD^1..HEAD` equal the staged set).
- H6: short-circuit `up-to-date` the same way as `merged` for `syncOnly`.
- H8: unstage the conflicted paths (`reset -q --pathspec-from-file`) before returning `staged-set-mismatch`.
- Design note, not a hit: the widened `writeScope` persists after the merge concludes, so later rounds and resumes can still write the conflicted files. A sync-only unit's worker may also write anywhere in its `--writes`, not only the conflicts.

## Unresolved questions

- Is H1 intended ("evidence" for a seat whose task is to edit pre-existing dirt)? If so, the commit step should not then exclude that dirt and report `no-changes` while the round is a pass.
