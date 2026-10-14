# Red team: git path parsing and the clean-tree gate (feat/rununit-gitparse)

Target: `git diff main...HEAD` at 5609e31e3. The new `src/util/git-paths.mjs` and its callers: `merge.mjs` `isWorkingTreeClean` / `isIgnorableStatusPath` / `changedFiles`, `bin/fgos.mjs` `changedFilesSince`, settlement, commit-unit-work, `worktree.checkoutDirtyPaths`, claim-liveness and postland-drift.
Environment: git 2.34.1, Node 24.18, Linux. Every result comes from a real git fixture under `os.tmpdir()` that calls the branch's own exported functions. The repro scripts are in the session scratchpad (`.../scratchpad/redteam/a1..a9.mjs` plus the harness `h.mjs`).

Regression means this branch made the behaviour worse than main. Pre-existing means main has the same behaviour, but the attack floor asked for it and the code touched by this change still has it.

## Summary of verdicts

| # | Attack | Verdict | Direction | New? |
|---|--------|---------|-----------|------|
| 1 | Huge untracked tree with `--untracked-files=all` | **HIT** | The gate throws ENOBUFS; settlement fails open to `[]` | Regression for the gate |
| 2 | `diff.relative=true` with a subdirectory cwd | **HIT** | **The gate reports clean while an own file is dirty** | Pre-existing |
| 3 | Non-UTF-8 bytes in names | **HIT** | Different names collapse into one string. The gate falsely reports dirty, and commit-unit-work fails with a pathspec mismatch | Gate collision is a regression; commit-unit-work is pre-existing |
| 4 | A stray write into an untracked dir that was already dirty (`checkoutDirtyPaths` without `-uall`) | **HIT** | The stray write is not detected | Pre-existing; touched function was not aligned |
| 5 | `status.showUntrackedFiles=no` with `checkoutDirtyPaths` and claim-liveness | **HIT** | Untracked files are invisible to both | Pre-existing |
| 6 | Subdir repoRoot whose name has a leading space (prefix `.trim()`) | **HIT (low)** | `.fgos/` is not exempt; the gate falsely reports dirty when ownFileSet is null | Pre-existing |
| 7 | An own path inside an untracked nested repo | **HIT (low)** | The gate reports clean | Pre-existing; contrived |
| 8 | Renames (staged, unstaged, intent-to-add), into or out of the own set | MISS | Both halves are seen and the gate blocks | — |
| 9 | Copies with `status.renames=copies` | MISS | The copy source is listed only when it was itself modified | — |
| 10 | `" -> "` in a name, `core.quotePath=false`, `"`, `\`, tab, newline, edge spaces | MISS | Read byte for byte (main falsely reported dirty on `a -> own.js`, so this is fixed) | — |
| 11 | Names that start with `.fgos` but are not the dir (`.fgos-x`, `.fgosfile`), and `.fgos` as a symlink | MISS | Only `.fgos` itself and `.fgos/…` are exempt | — |
| 12 | Merge conflicts (UU, AA, UD) | MISS (parse) | See note N1 | — |
| 13 | Submodule with dirty content | MISS (parse) | `sm` is reported; `submodule.<n>.ignore=all` or `diff.ignoreSubmodules=all` hide it (user intent) | — |
| 14 | `status.branch`, `status.showStash`, `status.relativePaths`, `color.status/ui=always`, `diff.noprefix`, `diff.external` | MISS | Porcelain v1 `-z` ignores all of these, and `--name-only`, `ls-tree` and `show` are never coloured | — |
| 15 | `nameStatusPaths` with `diff.renames=true/copies/false` and a file named `R100\tweird` or `M` | MISS | Fields stay in sync | — |
| 16 | Edge spaces in ownFileSet against trimmed status paths | MISS | `normalizePath` runs on both sides, so it can only fail closed (documented) | — |

## HIT 1: `--untracked-files=all` overflows the 1 MiB maxBuffer (regression)

`isWorkingTreeClean` now runs `status --porcelain=v1 -z --untracked-files=all` through `merge.mjs`'s `git()`, which uses Node's default 1 MiB maxBuffer. An untracked directory that is not ignored is now listed file by file. Before this change it was one collapsed `dir/` line.

Repro (`a1.mjs`): a repo with 22,000 untracked files under `vendor_cache/`.

- Raw status is 1,342,000 bytes. Main's collapsed form is 25 bytes.
- `isWorkingTreeClean(d, own)` and `isWorkingTreeClean(d)` both throw `spawnSync git ENOBUFS`.
  - Expected: they return a boolean.
  - Impact: `fgos return`, approve's `landCasMergeUnderLock` and `main-checkout-reset` all crash with a raw ENOBUFS and no actionable message. This fails closed, but it is a new outage on any checkout that has a large untracked tree that is not ignored.
- With the own file `base` modified too, `safeGitStatusFiles(d)` returns `[]`.
  - Expected: `['base', ...]`.
  - Settlement's `catch` fails open, so the run looks as if it wrote nothing. Settlement already used `-uall` on main, so this half is pre-existing. commit-unit-work is safe because it passes `maxBuffer: 64 MiB`.

Fix: pass a large `maxBuffer` (for example `DIFF_MAX_BUFFER`) for this status call and for settlement's status call. Optionally report ENOBUFS by name instead of failing open in `safeGitStatusFiles`.

Failing test:

```js
test('clean-tree gate answers on a large untracked tree instead of throwing ENOBUFS', () => {
  const d = makeRepo(); // init + one commit of `base`
  fs.mkdirSync(path.join(d, 'vendor_cache'));
  for (let i = 0; i < 22000; i++) fs.writeFileSync(path.join(d, 'vendor_cache', `some-long-generated-artifact-name-${String(i).padStart(6, '0')}.bin`), '');
  assert.equal(isWorkingTreeClean(d, buildOwnFileSet(['base'], [])), true);
  fs.writeFileSync(path.join(d, 'base'), 'changed');
  assert.equal(isWorkingTreeClean(d, buildOwnFileSet(['base'], [])), false);
  assert.ok(safeGitStatusFiles(d).includes('base'));
});
```

## HIT 2: `diff.relative=true` makes the own set cwd-relative while status stays root-relative, so the gate reports clean when it should block

`changedFilesSince` (bin) and `changedFiles` (merge) run `git diff --name-only` in `cwd` or `repoRoot`. When that directory is a subdirectory (the subtree scope that `return` uses, or the STR60 dogfood layout) and the user has `diff.relative=true`, the diff prints `x.js` instead of `sub/x.js`. Porcelain status always prints `sub/x.js`, so no own path ever matches. Every dirty path then counts as not own, which makes it ignorable.

Repro (`a2.mjs`):

```
diff.relative=false ownDiff=["sub/x.js"] gate(subtree)=false gate(whole)=false
diff.relative=true  ownDiff=["x.js"]     gate(subtree)=true  gate(whole)=true   <- own sub/x.js is dirty
```

Expected: `false`, because the own file has uncommitted edits. Actual: `true`, so `return` lets the item advance with uncommitted own work.

This affects every `diff --name-only` reader that runs from a subdir. postland-drift and branchContentMismatch run from repoRoot, so they are affected only when repoRoot is a subdir.

Fix: add `--no-relative` (git 2.28 or later) to every `diff`/`show` call that feeds a path set, or pass `-c diff.relative=false`. Doing this in one place, a `gitPathList()` helper next to `nulPaths`, would prevent the same drift elsewhere.

Failing test:

```js
test('own-file set ignores diff.relative so a dirty own file in a subdir blocks return', () => {
  const d = makeRepo(); const sub = path.join(d, 'sub'); fs.mkdirSync(sub);
  fs.writeFileSync(path.join(sub, 'x.js'), '1'); git(d, 'add', '.'); git(d, 'commit', '-qm', 'take');
  const from = git(d, 'rev-parse', 'HEAD').trim();
  fs.writeFileSync(path.join(sub, 'x.js'), '2'); git(d, 'commit', '-qam', 'work');
  const to = git(d, 'rev-parse', 'HEAD').trim();
  git(d, 'config', 'diff.relative', 'true');
  fs.writeFileSync(path.join(sub, 'x.js'), '3');
  // same args bin/fgos.mjs changedFilesSince uses
  const ownDiff = nulPaths(git(sub, 'diff', '--name-only', '--no-renames', '-z', from, to));
  assert.equal(isWorkingTreeClean(sub, buildOwnFileSet(ownDiff, []), { scope: 'subtree' }), false);
});
```

## HIT 3: non-UTF-8 names lose bytes in `encoding: 'utf8'` decoding

Every reader decodes git's raw bytes as UTF-8, so `\xff` and `\xfe` both become U+FFFD. The module's claim "byte for byte" does not hold for these names.

Repro (`a3.mjs`):

- **Gate (regression):** own file `own\xff.js` is committed, and an unrelated untracked `own\xfe.js` appears. `isWorkingTreeClean(d, own, {scope:'subtree'})` returns `false`; expected `true`.
  - Main kept the names apart because its non-`-z` output was C-quoted (`"own\377.js"` against `"own\376.js"`, confirmed).
  - This fails closed: a foreign file blocks the item. A false clean is not reachable, because the same bytes always decode to the same string.
- **commit-unit-work (pre-existing):** with a modified `own\xff.js`, `commitUnitWork(...)` returns `failed git-error fatal: pathspec 'own�.js' did not match any files`. The decoded string is re-encoded as UTF-8 `EF BF BD` and fed to `--pathspec-from-file`, so the run's commit door cannot commit the file at all.

Fix: read git output with `encoding: 'latin1'` (or as a Buffer) in the path readers and write paths back with latin1. The string then round-trips the bytes exactly. Decode to UTF-8 only for display.

Failing test:

```js
test('non-UTF-8 names stay distinct and committable', () => {
  const d = makeRepo();
  fs.writeFileSync(Buffer.concat([Buffer.from(d + '/'), Buffer.from('own\xff.js', 'latin1')]), '1');
  git(d, 'add', '-A'); git(d, 'commit', '-qm', 'own');
  const ownDiff = nulPaths(git(d, 'diff', '--name-only', '--no-renames', '-z', 'HEAD~1', 'HEAD'));
  fs.writeFileSync(Buffer.concat([Buffer.from(d + '/'), Buffer.from('own\xfe.js', 'latin1')]), 'foreign');
  assert.equal(isWorkingTreeClean(d, buildOwnFileSet(ownDiff, []), { scope: 'subtree' }), true);
  fs.rmSync(Buffer.concat([Buffer.from(d + '/'), Buffer.from('own\xfe.js', 'latin1')]));
  fs.writeFileSync(Buffer.concat([Buffer.from(d + '/'), Buffer.from('own\xff.js', 'latin1')]), '2');
  assert.equal(commitUnitWork({ worktree: d, repoRoot: d, unitId: 'u', summary: 's', scope: ['**'] }).status, 'committed');
});
```

## HIT 4: `checkoutDirtyPaths` does not see a stray write into an untracked dir that was already dirty

`checkoutDirtyPaths` (worktree.mjs) and claim-liveness still run `status --porcelain -z` without `--untracked-files=all`. Collapsed `dir/` entries go through `statusPaths`, which strips the trailing slash. `dispatch/cli.mjs` uses the before/after set difference of this list in `watchWritesOutsideWorkspace().strayPaths()` and in `dirtyBefore`/`dirtyAfter`.

Repro (`a8.mjs`): `scratch/old.txt` is untracked before the dispatch, and the agent then writes `scratch/stray-write.txt`.

```
before ["scratch"] after ["scratch"] new=[]   (expected ["scratch/stray-write.txt"])
```

The change aligned the gate, settlement and commit-unit-work on `-uall`, but left this reader out. The reader therefore disagrees with settlement on the same tree: settlement reports `scratch/old.txt` where this reader reports `scratch`.

Fix: add `--untracked-files=all` and a large maxBuffer to `checkoutDirtyPaths`, claim-liveness and `isCheckoutDirty`.

Failing test:

```js
test('checkoutDirtyPaths names a new file inside an already-untracked directory', () => {
  const d = makeRepo(); fs.mkdirSync(path.join(d, 'scratch'));
  fs.writeFileSync(path.join(d, 'scratch', 'old.txt'), 'o');
  const before = checkoutDirtyPaths(d, d);
  fs.writeFileSync(path.join(d, 'scratch', 'stray-write.txt'), 's');
  assert.deepEqual(checkoutDirtyPaths(d, d).filter((p) => !before.includes(p)), ['scratch/stray-write.txt']);
});
```

## HIT 5: `status.showUntrackedFiles=no` hides untracked files from `checkoutDirtyPaths` and claim-liveness

Repro (`a7.mjs`): with `status.showUntrackedFiles=no` and an untracked `sub/new.js`, `checkoutDirtyPaths(d,d)` returns `[]`; expected `["sub/new.js"]`.

The gate is not affected, because its explicit `--untracked-files=all` overrides the config (`gate(null)=false` as expected). Settlement is also correct. The same fix as HIT 4 (an explicit `--untracked-files=all`) closes this.

```js
test('checkoutDirtyPaths ignores status.showUntrackedFiles=no', () => {
  const d = makeRepo(); git(d, 'config', 'status.showUntrackedFiles', 'no');
  fs.writeFileSync(path.join(d, 'new.js'), 'n');
  assert.deepEqual(checkoutDirtyPaths(d, d), ['new.js']);
});
```

## HIT 6 (low): `rev-parse --show-prefix` followed by `.trim()` cuts a leading space from the subdir

Repro (`a4.mjs`): repoRoot is the subdir `" sub"` with a dirty ` sub/.fgos/events.jsonl`. `isWorkingTreeClean(sub, null, {scope:'subtree'})` returns `false`; expected `true`.

The prefix becomes `sub/`, so `.fgos/` is not recognised. This only matters for callers that pass ownFileSet as null, and it fails closed. Subdirs named `sub `, `sü\tb` and `a"b\c` all pass, because `--show-prefix` prints raw bytes without quoting.

Fix: `.replace(/\n$/, '')` instead of `.trim()`.

```js
test('subtree gate exempts .fgos under a subdir whose name starts with a space', () => {
  const d = makeRepo(); const sub = path.join(d, ' sub');
  fs.mkdirSync(path.join(sub, '.fgos'), { recursive: true }); fs.writeFileSync(path.join(sub, 'keep'), 'k');
  git(d, 'add', '-A'); git(d, 'commit', '-qm', 's');
  fs.writeFileSync(path.join(sub, '.fgos', 'events.jsonl'), 'e');
  assert.equal(isWorkingTreeClean(sub, null, { scope: 'subtree' }), true);
});
```

## HIT 7 (low, contrived): an own path inside an untracked nested repo

Git never descends into an untracked nested repository, even with `-uall`. It prints `?? nested/`, which `statusPaths` turns into `nested`. With ownFileSet `{nested/own.js}` and that file dirty, the gate returns `true` (`a6.mjs`).

This is reachable only if the own set names a path under a directory that later became its own repository. Fix, if wanted: treat a collapsed entry as own when any own path starts with `entry + '/'`.

```js
test('collapsed nested repo counts as own when an own path lies inside it', () => {
  const d = makeRepo(); const n = path.join(d, 'nested'); fs.mkdirSync(n);
  git(n, 'init', '-q'); fs.writeFileSync(path.join(n, 'own.js'), 'x');
  assert.equal(isWorkingTreeClean(d, buildOwnFileSet(['nested/own.js'], [])), false);
});
```

## MISS details (raw evidence)

From `a5.mjs`, with ownFileSet `{own.js}`. A gate result of `false` means it blocks, which is correct in every row.

```
staged rename own->x          "R  x.js\0own.js\0"            -> ["x.js","own.js"]   gate=false
unstaged rename own->x        " D own.js\0?? x.js\0"          -> both               gate=false
ITA rename own->x             " R x.js\0own.js\0"             -> both               gate=false
staged rename foreign->own    "R  own.js\0foreign.js\0"       -> both               gate=false
copy, source edited (copies)  "M  own.js\0C  y.js\0own.js\0"  -> ["own.js","y.js"]  gate=false
copy, source unchanged        "A  y.js\0"                     (git lists no source) gate=true
quotePath=false "a -> own.js" "?? a -> own.js\0"              -> one path           gate=true (main: false)
"own.js\n", " own.js"         read byte for byte                                    gate=false (fails closed via normalizePath trim, documented)
```

Other evidence:

- **Conflicts (`a6.mjs`).** Raw `"UD del.js\0UU f.js\0AA new.js\0UU own.js\0"` is parsed into four paths. The gate blocks when own is `{own.js}`.
- **Config probes.** With `status.branch=true` or `status.showStash=true`, a `-z` porcelain run printed no header (empty output on a clean tree). `color.ui=always` left `diff --name-only -z`, `--name-status -z`, `ls-tree -z` and `show --name-only -z` uncoloured.
- **`nameStatusPaths` (`a9.mjs`).** Run against `R100`, `C098`, `A` and `D` entries plus a file literally named `R100\tweird` and one named `M`, it stays in sync for all three `diff.renames` values.

## Notes (outside parsing; not filed as hits)

- **N1.** On approve's whole-repo gate with an ownFileSet, a main checkout that is mid-merge with conflicts only on foreign files is reported clean (`gate(own={zzz})=true` on UU/AA/UD). `landCasMergeUnderLock` would then `update-ref` while `MERGE_HEAD` and unmerged index entries exist. Ignoring foreign files is by design, but an unmerged index is arguably never "clean". Consider failing when `git rev-parse -q --verify MERGE_HEAD` succeeds, or when any entry is `U`, `AA` or `DD`.
- **N2.** `merge.mjs` `git()` inherits `process.env`. If fgos runs inside a git hook, a leaked `GIT_DIR`, `GIT_INDEX_FILE` or `GIT_WORK_TREE` points status at another index. commit-unit-work already uses `cleanEnv`; the gate does not.
- **N3.** `submodule.<name>.ignore=all`, `diff.ignoreSubmodules=all`, a global `core.excludesFile` or a stale `core.fsmonitor` cache can each hide real changes from status. These are user intent or environment, not parsing.
- **N4.** `ls-tree` in `nextFreeDecisionId` prints paths relative to cwd. If repoRoot is ever a subdir, `docs/decisions/` resolves under it. This is pre-existing and does not affect top-level callers.

Status: DONE_WITH_CONCERNS
Summary: 16 attack classes tried against real git fixtures; 7 hits. Parsing of renames, copies, quoting and conflicts is sound. The one way to make the gate report clean when an own file is dirty is `diff.relative=true` with a subdirectory cwd (pre-existing). The new `--untracked-files=all` turns a large untracked tree into an ENOBUFS crash (regression). `utf8` decoding breaks the "byte for byte" claim for non-UTF-8 names.
Concerns:
- HIT 2 is a real false clean on the `return` gate under one user config.
- HIT 1 is a regression from this branch.
- HIT 3's gate collision is a regression (fails closed); commit-unit-work's non-UTF-8 failure is pre-existing.
- HITs 4 and 5 mean the stray-write and lost-work detectors that use `checkoutDirtyPaths` were not moved to the same `-uall` read as the gate and settlement.
