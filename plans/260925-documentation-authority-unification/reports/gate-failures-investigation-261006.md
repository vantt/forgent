# Gate failures investigation, 2026-10-06 (pre-step 0b)

Investigation only. No gate script, test, baseline or exceptions file was edited. Scratch work (patched copy of the script, regenerated inventory, probes) lives outside the repo under the session scratchpad. Plan worktree HEAD at start: `50639672a` (the generator fix `6397a9970` landed during the investigation; it does not touch either gate). Environment: all test runs with `env -u CLAUDE_CODE_SESSION_ID`.

## 1. Failure 1: `scripts/verify-phase-02.mjs`

### 1.1 What the script does

- Requires `--base` and `--fixed-end` (or env `BASE`/`FIXED_END`); no defaults (`parseArgs`).
- Creates a temporary detached worktree at FIXED_END under `os.tmpdir()` (`fgos-verify-phase02-*`), runs `npm ci` there, then 9 checks. Regenerates the inventory from BASE into a temp dir (`/tmp/phase02-inventory-*`) and byte-compares with the committed artifacts in that worktree. It does not write to the branch. Cleanup: `git worktree remove --force` in `finally` (not with `--keep-worktree`).
- Artifact paths are constants: `PHASE02_JSON`, `PHASE02_PART_DIR`, `PHASE02_MD`, `PHASE02_IDENTITY_REGISTRY` = `${PHASE_DIR}/phase-02-*` (plan root). Shard paths are joined as `PHASE_DIR + part.path` (line `byteCompare(... path.join(tempWorktreeDir, PHASE_DIR, part.path) ...)`), so they also assume the plan root.

### 1.2 Runs (all `--skip-full-suite`, `/usr/bin/time -v`, RSS watched, limit 6 GB, never reached)

| Run | Command args | Exit | Wall | Max RSS | Result |
|---|---|---|---|---|---|
| c | `--fixed-end 0c3e8d8b5...` only (no `--base`) | 1 | 0.03 s | 51 MB | `Verification FAILED: Error: --base <sha> (or BASE environment variable) must be explicitly provided` |
| a | `--base f0c76c5e5... --fixed-end 0c3e8d8b5...` (approved Phase 3 range) | **0** | 37.4 s | 2.08 GB | All 9 checks pass (check 9 skipped by flag): focused tests, byte-identity, gate checker, ratchet, docs tests, 5 link blobs, 13 historical plans, diff scope |
| b | `--base f0c76c5e5... --fixed-end 50639672a` (branch head) | 1 | 3.6 s | 333 MB | `Error: Unable to read identity registry plans/260925-documentation-authority-unification/phase-02-identity-registry.json: ENOENT` (raised when check 2 runs the generator in the temp worktree) |

Excerpt of run b, the resume agent's exact symptom:

```text
Verification FAILED: node scripts/generate-doc-inventory.mjs --commit f0c76c5e5... --identity-registry plans/260925-documentation-authority-unification/phase-02-identity-registry.json ... failed (exit 1):
Error: Unable to read identity registry ...: ENOENT: no such file or directory, open '/tmp/fgos-verify-phase02-E1GiFv/plans/260925-documentation-authority-unification/phase-02-identity-registry.json'
```

### 1.3 Which claim is true

Both, for different invocations. PROVEN:

- The lead is right that without `--base` the script stops at argument parsing (run c) and that with the approved Phase 3 range it passes (run a). It could not reproduce because it used that range (or omitted `--base`).
- The resume agent is right for FIXED_END = branch head with BASE `f0c76c5e5`: run b reproduces the `ENOENT` exactly.

Cause of the ENOENT: commit `4d80eaf29` (2026-09-29, AgentKit format conversion) moved the five artifacts `phase-02-doc-inventory.{json,md}`, `phase-02-doc-inventory.parts/*`, `phase-02-identity-registry.json` to `reports/` with `R100` (byte-identical rename; `git diff -M --name-status 0c3e8d8b5 HEAD`). The same commit changed `scripts/generate-doc-inventory.mjs` and `check-doc-inventory-gates.mjs` to the new paths, but not `verify-phase-02.mjs`. At `0c3e8d8b5` (before the move) the artifacts are at the plan root, which is why run a passes. So it is a path-constants-vs-moved-artifacts failure, not a wrong range, but only for FIXED_END after `4d80eaf29`.

### 1.4 Is the gate meaningful beyond Phase 3? No

I patched only the four path constants in a scratch copy (worktree at `50639672a` in scratch, removed afterwards; the script runs from its own cwd) and reran run b. The path failure went away, then it failed at the next step:

```text
Verification FAILED: Regenerated Phase 02 JSON manifest is not byte-identical to committed artifact .../reports/phase-02-doc-inventory.json   (exit 1, 25 s, 2.1 GB)
```

Cause (PROVEN by regenerating at BASE with the branch-head generator and comparing): the move was `R100`, so the committed bytes still carry the old path text, but the generator at head now emits the new one. Differences: one line in shard `part-0001.jsonl` (`"path": ".../phase-02-identity-registry.json"` vs `.../reports/phase-02-identity-registry.json`; the other 9 shards identical), one line in the Markdown report (`- ...phase-02-doc-inventory.json` list entry), and hence the manifest hash. Only these two textual lines differ.

Even with both fixed, two later checks cannot pass for a head FIXED_END (PROVEN by static evaluation against `50639672a`, no run needed):

- Check 8 (`verifyForbiddenPhase02Diff`): `BASE..50639672a` changes 2,317 paths, 2,296 outside the Phase 02 allowed set, because the range now includes the whole main sync and later phases. It asserts "this commit range touches only Phase 02 files".
- Check 7 (historical plans): all 13 hashes under `plans/260825-1841-knowledge-registry/` fail at head. The files are gone from that path (main `22e54f834`, 2026-09-30, "archive 38 completed plans"); at `archive/plans/260825-1841-knowledge-registry/` the content is not byte-identical either (`R099`, the move edited the files; example `phase-02-resolver-alias.md` blob `d0e14f0d9...` vs `0ed7f24c2...`). So even the amended requirement ("reachable through a pointer note at the historical path") cannot be satisfied by this byte-hash check.

Conclusion: the script is a verification of one immutable range (Phase 1 base to Phase 2 end, effectively `f0c76c5e5..0c3e8d8b5`) and still does its job there. Applied to a later FIXED_END it fails for four independent reasons, and only the first (path constants) is what the resume agent reported.

### 1.5 Fix options (decision for the owner)

1. **Freeze, do not repair (recommended).** Declare `verify-phase-02.mjs` closed to the range `f0c76c5e5..0c3e8d8b5`. Record run a (exit 0, 2026-10-06) as its receipt and remove it from "must run on branch head" lists. Phase 4 gets its own conservation/gate checkers (already in Phase 4 deliverables) with BASE/FIXED_END semantics that fit a moving head. Cost: zero gate edits; trade-off: no byte-identity gate on the resynced inventory until Phase 4 builds one.
2. **Parameterize the script (artifact dir + allowed-diff set + historical-plan locations).** Add an artifact-dir option, pass an exceptions list for the diff scope, accept both historical locations. Trade-off: 4 changes to a gate whose job is immutability; weakens the "immutable" claim; still needs the byte-identity story to handle the `4d80eaf29` generator drift (needs regenerating committed artifacts or a path-normalizing compare, which changes what the byte check proves).
3. **Minimal path-constants fix only.** Four constants plus the shard join. Trade-off: reaches the next failure (generator drift) in 25 s; does not make it pass. Not useful alone.

Recommendation: option 1. It matches the original purpose (script header: "Authoritative immutable Phase 02 verification runner") and costs nothing.

Plan text to correct:
- `plan.md` §7.4 item 2 ("still points at the plan root ... fails with ENOENT") is true only for a head FIXED_END and is incomplete (three more independent failures, section 1.4). It also omits that the approved range passes and that `--base` is required.
- Phase 4 "Resume inputs" bullet 2 ("`scripts/verify-phase-02.mjs` artifact paths must follow the `reports/` move") understates the work: following the move is not enough; the gate cannot be used on the head.
- `plan.md` §7.5b says "it needs `--base <sha>`" as the explanation of the failure: that explains only run c, not the resume agent's `ENOENT`.

Cleanup confirmed: `git worktree list` shows no `fgos-verify-phase02-*` or scratch worktree left; the temp inventory dirs were removed by the script.

## 2. Failure 2: two tests in `test/scripts/generate-shipped-path-inventory.test.mjs`

### 2.1 Failing tests (command: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/generate-shipped-path-inventory.test.mjs`; 8 pass, 2 fail, 4.1 s)

1. `deterministic generation: generating inventory twice produces identical results` (line 285), first failing assertion at line 297:

   ```text
   AssertionError: Inventory must extract core/ conventions
   actual: false  expected: true     (assert.ok(corePaths.length >= 10))
   ```

   Measured at branch head: `core/` paths in the inventory = 8 (threshold 10). The same test also asserts `unclassifiedCount === 0`; measured `unclassifiedCount` = 6 at head (not reached yet because the earlier assertion throws).
2. `repository inventory: detects nonexistent examples and never labels them safe rewrite targets` (line 426), assertion at line 439:

   ```text
   AssertionError: Inventory must track "src/auth.mjs"      (actual: undefined)
   ```

   Also `src/runner/retry.mjs` is missing from the inventory.

Both tests call `generateInventory(REPO_ROOT, SHIPPED_SURFACE_DIRS, { commit: 'HEAD' })` and assert counts and example paths that depend on what the shipped skills and docs (`core`, `domains`, `plugins/fgOS`, `.agents/skills`, `.fgos/instructions/effective`) currently say.

### 2.2 Cause (PROVEN by probing the same generator over each commit that touched those directories)

- Test 2, missing `src/auth.mjs` and `src/runner/retry.mjs`: these two example paths came from the example text in `fgos-code-panel/SKILL.md` (lines 108, 150 and 149 at `4006782dd`, in `.agents/skills`, `domains/coding/skills`, `plugins/fgOS/skills`). Commit `8eff54d0f` (main, 2026-09-28, "convert fgos-plan-loop/fgos-code-panel to deprecated stubs (Unit I29)", 36 files, 3,680 deletions) removed that text. Probe: all of the 5 target paths present at `f0c76c5e5`..`4006782dd`, the two missing from `8eff54d0f` on.
- Test 1, `core/` count: 18 at `f0c76c5e5` and `551687021`, 24 at `13f7f01fd`, then 8 at `2180b4e72` (main, 2026-10-02, "Phase 6 complete - L4 coordination engine retired", deletes coordination workflow yamls, `core/protocol-packs/group-thinking.json`, `fgos-code-change`, rewrites panel skills). So the `>= 10` assertion started failing with the 2026-10-02 retirement.
- `unclassifiedCount` rose from 0 (`f0c76c5e5`, `925f361ae`) to 1 (`4006782dd`, `8eff54d0f`) to 6 (`2180b4e72`, head). Which paths are unclassified: UNPROVEN (my filter on `contractScope` did not select them; not needed for the decision).

### 2.3 Was it "already failing on `551687021`"?

Partly. Checked by running the test file in a scratch worktree at `551687021` (removed afterwards): both tests fail there, but test 1 for a different reason (`Zero unclassified paths should remain`, unclassifiedCount 1; the core assertion passed with 18). Test 2 fails identically (`src/auth.mjs`). So: "already failing before the 2026-10-06 sync" is true for both tests; "the same two assertions" is not: the core-count assertion only began failing with `2180b4e72` (2026-10-02, main), which the 2026-10-06 sync brought in. Before `8eff54d0f` (2026-09-28) both tests passed.

This also means `verify-phase-01.mjs` Check 1 (focused tests, line ~257) cannot pass on any tree after 2026-09-28.

### 2.4 Check 5 of `verify-phase-01.mjs` (historical plan byte-identity)

Broken by main's move, as expected (PROVEN, same evidence as 1.4): `HISTORICAL_PLAN_HASHES` (13 files) read `plans/260825-1841-knowledge-registry/*` which no longer exist at head; at `archive/plans/...` all 13 hashes also mismatch (`R099`, content edited by the move). A pointer note at the old path (the amended requirement) would not satisfy this check either: the check hashes the file, so it needs either the archive copy's new hashes or a changed rule. Note the file list `HISTORICAL_PLAN_HASHES` is also imported by `verify-phase-02.mjs` (Check 7), so one change would serve both gates.

### 2.5 Fix options (decision for the owner)

1. **Freeze `verify-phase-01.mjs` like phase-02 (recommended with the phase-02 option 1).** It verified one immutable range; record its last passing receipt at the Phase 1 end commit and stop requiring it on the head. The two tests stay as history. Trade-off: the "historical plan intact" claim moves to a new Phase 4 check (compare the archived files with the archive-time hashes plus the pointer note), which is where the amended requirement belongs anyway.
2. **Decouple the two tests from live content.** Run them against a small committed fixture tree (like the existing `environmental contamination` test already does with a temporary git repo) and assert the counting logic on fixtures; keep one cheap live check that only asserts invariants (determinism, no glued tokens). Trade-off: edits a gate test (needs owner approval); loses "the real repo has >= 10 core references" which was a content snapshot, not a contract.
3. **Update the thresholds to today's content** (core >= 8, replace example paths, unclassified <= 6). Trade-off: fixes nothing durable; the next content change breaks them again. Not recommended.

Recommendation: option 1 now, option 2 if the owner wants the generator's tests to stay in the default suite (they currently fail in `npm test` regardless of the gate).

Open point for the suite: because these two tests fail on the branch head, `npm test` on the head is red for them independent of verify scripts; whether main's own suite has the same two failures is UNPROVEN (not checked in the main checkout, per the work limits).

## 3. Commands and evidence index

- Gate runs: `node scripts/verify-phase-02.mjs --base f0c76c5e590339d9c815038539ff1f4a072c64e4 --fixed-end {0c3e8d8b57c40214fdcdb29a69c9b3c11de552fb | 50639672a} --skip-full-suite`; no-base run as in table 1.2. Outputs and `time -v` files are in the session scratchpad `.../scratchpad/0b/` (`a-phase3.*`, `b-head.*`, `c-nobase.*`, `d-patched1.*`, `regen.time`).
- Move evidence: `git log --follow --name-status -- plans/260925-documentation-authority-unification/reports/phase-02-identity-registry.json`; `git show 4d80eaf29 -- scripts/generate-doc-inventory.mjs`.
- Test bisect: probe script calling `generateInventory(root, SHIPPED_SURFACE_DIRS, {commit})` for every commit in `f0c76c5e5..HEAD` touching the shipped-surface directories.

## 4. Unresolved questions

1. Does the owner want gates 01 and 02 frozen (option 1 for both) or repaired? Phase 4 needs the answer to decide what its own byte-identity/historical-plan check must cover.
2. For the knowledge-registry plan: should the Phase 4 check hash the archive copies (new hashes, `R099` edits) or only assert a pointer note at the historical path? The currently amended requirement says pointer note; no such note exists at `plans/260825-1841-knowledge-registry/` on the head (UNPROVEN whether Phase 1 ever added one; the directory does not exist at head).
3. Which six paths are `unclassified` at head, and is the classifier or the content at fault (not needed for the freeze decision)?
4. Do the same two tests fail in the main checkout's own `npm test`? (Not checked.)
