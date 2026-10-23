# Verifier cleanup and bounded reader receipt

Authority: W2 D3c brief, L12-137, L13-2, L13-3. Input HEAD: `e158e672682f4b305230e099f72a1b10adda25e7`.

## Result

Both requested review findings are fixed. **19/19 tests pass across the two touched owning files. Check B passes in both reproduction manifests.** The regenerated census has **25 undeclared sites**, down from 26; G4 remains red pending owner disposition. No exemption was approved or hidden.

- Both verifiers record `node_modules` only when absent before their npm invocation, including failed/partial installs, and reclaim it before the existing guarded `removeWorktree`. Committed dependency bytes are not claimed as setup outputs.
- Phase 01 also reclaims the shared-target symlink it creates, without following it into the host cache. Phase 02 accounts for a new local `target` before its existing Cargo build. `--keep-worktree` retains setup outputs too.
- Only owned setup subpaths are removed directly. Registration and checkout removal still belong to the typed Git port; unrelated dirty/ignored bytes still refuse removal and produce the existing warning. There is no forced checkout deletion or rm-rf fallback.
- Removed the non-pinned reader's raw `cat-file --batch` branch and its import. Production callers use the default 20 MiB filter, not the optional raised-capacity path that only the test exercised. The reader now rejects explicitly over-bound objects through its existing Inspect bound; the pinned generator's separate historical reader is unchanged.
- Updated CHANGELOG and the current exemption packet: nine capability candidates, ten pinned-tool candidates, five provenance gaps and S1 = 25. The reader row is removed; remaining verifier locators match the new census.

## Prior art, reuse and impact

Read the brief, execution plan, owner answers, W1 review notes, G4 review and both predecessor D3 receipts. Read `docs/specs/reading-map.md` and the Git specification's boundary/Worktree contracts. Source/import searches and history show that `898989f21` replaced forced verifier cleanup with guarded removal without accounting for npm's ignored bytes; `7d9a33a2d` extracted the reader from byte-pinned tooling. The existing provisioning implementation (`56e3172ed`, `src/runner/worktree.mjs`) establishes that installed dependencies are regenerable but unrelated bytes remain protected.

Reused `createGitWorktree`, `removeWorktree`, Inspect batching and the existing activation-fence fixture helper. Kept verifier-specific npm choices and setup intact rather than invoking project-configured provisioning commands. No new Git port, abstraction, config default, environment contract, infrastructure requirement or setup/doctor entry.

**GitNexus: degraded under the brief's no-fgOS-CLI rule.** No capability query, graph impact or detect-changes result is claimed. Static consumers are the two verifier entry points, Phase 02's import of Phase 01's link checker, and inventory gates using `readCommitBlobMap`; the pinned generators remain independent. No platform component was extended.

## Owning proof and execution

`test/scripts/verify-phase-02.test.mjs` now owns both verifier cleanup paths, which its previous argument/scope/link tests never entered. Each verifier runs against a real temporary Git fixture, with a local npm executable producing installed bytes. The fixture intentionally lacks focused test inputs, reaching the actual `finally` after setup; the partial-install case exits from npm instead. Native creation, custody and guarded removal are real, not mocked. Cases prove:

1. After a later check failure or partial install, checkout and registration are both gone.
2. `--keep-worktree` preserves checkout and setup bytes.
3. Foreign ignored bytes survive and cause a named ignored-bytes refusal, while owned dependencies are reclaimed.
4. Pre-existing committed dependency bytes survive; the verifier does not claim them.
5. The host's shared target-cache bytes survive every case.

`test/scripts/doc-git-reads.test.mjs` replaces only the removed large-object success contract with explicit rejection. Existing immutable text/byte-path, binary, size-filter, missing-object and count/aggregate-byte splitting cases remain. No test is skipped or weakened for a surviving behavior.

Tests were edited before implementation. A replay of unchanged HEAD with the final tests and complete fixture payload fails as expected (verifier file 9/16, reader file 2/3); current code passes 16/16 and 3/3. Logs are in [logs/](logs/). Initial harness runs exposed an overly narrow sandbox root and then missing copied package contracts; those fixture problems were corrected, not bypassed. All eight leftover fixture roots from the initial teardown failures were later unregistered and removed within the brief's scratch root; no temporary verifier checkout remains there. Baseline replay after those corrections confirms the regressions independently.

All Node tests ran **one file per command**, with `CLAUDE_CODE_SESSION_ID` unset and the explicitly named activated release's `FGOS_HOST_BIN`. Because source scripts can automatically stage an addon outside scope, execution used `/tmp/fgos-work/w2-d3c-brief/payload`: physical source copies plus the activated release's verified addon/helper through the supported `native-addon.json` descriptor, and a mode-0700 scratch `FGOS_STATE_ROOT`. Every touched `.mjs` file is byte-equal to its tested payload copy; see [source-byte-check.json](source-byte-check.json). This is Node behavior against the installed native implementation, **not a freshly built release**.

## Census and reproduction

The unchanged scanner targeted the actual source worktree, not the scratch payload:

```text
node scripts/git-one-door-scan.mjs --root /home/vantt/projects/forgentX-p9-w1-d3 --write-census --json
exit 1; 1,098 scanned files; 254 classified rows; 25 undeclared sites
payloadDigest: ef12230b4a0da586fdf2106e52f3b16b47c99cfe068d292d9185edbb95aab64c
```

A second read-only `census(scan())` replay matches the checked-in census bytes exactly; see [census-replay.json](census-replay.json). The only removed site is `scripts/lib/doc-git-reads.mjs:76`; other site changes are verifier line/caller shifts and source digests.

Ran the unmodified required audit command in the byte-matched scratch payload:

```text
python3 -B plans/260925-documentation-authority-unification/reports/phase-08/audit-report.py
exit 1 for the whole audit; B.ok = true in BOTH manifests
```

Both manifests' five pinned tooling blobs match exactly, independently confirmed against actual source bytes. [audit-b.json](audit-b.json) includes the B rows, baseline comparison and full-audit limits. Both unchanged-HEAD baseline and current audit retain the same ownership result (`noNewDoubleOwnership: false`) and the same 76 target-digest-drift rows per manifest. Full audit A also sees omitted scratch files and unaccounted work; pair accounting is Lead-owned and was not changed. The complete audit is **not** claimed green.

## Limits and handoff

No real-repository Git mutation, fgOS CLI command against the source repository, lifecycle verb, staging, commit, full-suite launcher, `npm test` or Cargo build/test was run. Fixture Git writes and activation fences exist only under `/tmp`; source `.fgos`, secrets, manifests, accounting and board files were not edited. End-to-end verifier success, its full-suite/Cargo branch and a freshly staged release were not executed; the requested cleanup path is proven in disposable fixtures. No outside-scope writes are needed (`needsWrites: []`). Lead/owner still owns the 25 remaining census dispositions and broader audit failures. No additional feature proposal is needed. MDView preview was attempted once but refused by its read-only database; no preview URL is available.
