# Pinned reproduction tooling repair receipt

Authority: W2 D3b brief, L13-2 and L13-3. Input HEAD: `cffe725b9`.

## Result

**Check B passes in both reproduction manifests, with no rebaseline.** The complete reproduction and G4 are **not** green. [Machine receipt](receipt.json), [B output and baseline comparison](audit-b.json), [source/payload byte checks](source-byte-check.json).

Restored from `git show f59e0b639:<path>`, byte-for-byte:

- `scripts/generate-doc-inventory.mjs`: `a52981ff2862cc2c553dbb3181e4e822a26b146b`.
- `scripts/generate-shipped-path-inventory.mjs`: `0f1cd7e1cee308772c0b56c37f3190333039cfb3`.
- Their two owning `test/scripts/generate-*-inventory.test.mjs` files.

The other three pinned tooling files and both reproduction manifests are untouched. Each manifest's five expected blob IDs equals its audit output and a separate `git hash-object` of the actual source worktree files.

## Reuse and proof ownership

Extracted D3's typed immutable readers into **one non-pinned adapter**, `scripts/lib/doc-git-reads.mjs`, reusing `scripts/lib/git-ports.mjs` and `src/util/git-paths.mjs`. No Git port, config default, environment contract or setup dependency was added. Gates pass the generator's existing scope data to the extracted diff reader; their bounded blob batches remain typed. The existing explicitly raised large-object capacity path remains an unapproved L13-2 candidate, never a retry after a typed failure.

Repointed all five D3-changed importing scripts: inventory gates, evidence relocation, proposal tooling and both immutable verifiers. Constants, parsing and extraction imports from the pinned generators remain; no importer depends on a D3-added export. D3's other port migrations, sandbox diff and guarded checkout cleanup are retained.

The two D3 reader tests are **transferred**, not silently dropped: `test/scripts/doc-git-reads.test.mjs` now owns immutable byte-path reads, exact blob identity, unresolved/non-commit rejection, binary batches, size filtering, count/byte splitting and the raised-capacity contract. Its scope-binding case owns the extracted diff adapter; the original generator's registry-binding proof remains unchanged. Restoring generator tests preserves their complete pre-D3 bytes.

Tests first: the new owning file failed with module-not-found before the adapter existed ([log](logs/tests-first.log)); implementation then passed all three cases.

## Census and proposals

Regenerated with the unchanged scanner, targeting the **actual source worktree**:

```text
node scripts/git-one-door-scan.mjs --root /home/vantt/projects/forgentX-p9-w1-d3 --write-census --json
exit 1; 1,098 product files; 254 classified rows; 26 undeclared sites
payloadDigest: 397b0969d8608f88bf91230dc05fe944b66df4fc9af76c7d9aa3fe1147b334a8
```

[Exemption proposal](../exemption-proposal.md): ten byte-pinned call sites, ten capability candidates, five configured-command provenance gaps and S1. All remain counted. D3 had 19 sites; restoration adds seven net, leaving 26 versus the original 58. Retirement for the ten pinned sites is retirement of the plan's reproduction manifests. No exemption is approved, hidden or manually classified here.

## Execution environment and limits

Individual Node files ran from `/tmp/fgos-work/w2-d3b-brief/payload`, with `CLAUDE_CODE_SESSION_ID` unset, `FGOS_HOST_BIN` from the explicitly named activation, `TMPDIR` under the brief scratch root and the **existing** `FGOS_STATE_ROOT` set to a scratch directory with required mode `0700`.

The scratch payload contains copied source code and the activated release's combined addon through the production-supported `native-addon.json` descriptor; no loader is patched. A disposable fixture Git repository shares read-only source objects and binds HEAD/index to the source HEAD. Plan script files are physical byte copies; other plan inputs are read-only file symlinks. Every changed `.mjs` source equals the tested payload bytes. This proves the changed Node behavior against the installed native implementation, **not a freshly built release**.

Setup incidents are disclosed in `receipt.json`: one direct source test timed out after 120 seconds without output and is not evidence; its script port can attempt addon bootstrap automatically, so further native runs were confined to scratch. Initial scratch runs refused a read-only default state root, then an insecure `0775` scratch root; correcting the scratch fixture to the existing `0700` requirement fixed those failures without changing production checks. No explicit build or fgOS CLI command was run.

## Individual test results

Latest results: **465/468 cases across 20 separately invoked files**. All three touched test files pass; the separately required reproduction test remains red. Exact commands/environment and file-level results are in `receipt.json`; scratch logs are under `/tmp/fgos-work/w2-d3b-brief/`.

| File in `test/` | Pass / total | Exit |
|---|---:|---:|
| `scripts/doc-git-reads.test.mjs` | 3/3 | 0 |
| `scripts/generate-doc-inventory.test.mjs` | 96/96 | 0 |
| `scripts/generate-shipped-path-inventory.test.mjs` | 10/10 | 0 |
| `scripts/verify-phase-02.test.mjs` | 6/6 | 0 |
| `scripts/check-evidence-relocation.test.mjs` | 41/41 | 0 |
| `scripts/check-doc-retirement.test.mjs` | 36/36 | 0 |
| `scripts/doc-review-format.test.mjs` | 25/25 | 0 |
| `scripts/doc-review-authorship.test.mjs` | 15/15 | 0 |
| `scripts/doc-candidate-conservation.test.mjs` | 60/60 | 0 |
| `scripts/doc-restoration-proofs.test.mjs` | 5/5 | 0 |
| `scripts/check-doc-conservation.test.mjs` | 35/35 | 0 |
| `scripts/doc-corpus-decisions.test.mjs` | 8/8 | 0 |
| `scripts/doc-alias-resolver.test.mjs` | 18/18 | 0 |
| `scripts/doc-decision-exact.test.mjs` | 7/7 | 0 |
| `scripts/doc-decision-mirrors.test.mjs` | 5/5 | 0 |
| `scripts/doc-decision-review.test.mjs` | 14/14 | 0 |
| `scripts/doc-decision-conservation.test.mjs` | 5/5 | 0 |
| `scripts/check-doc-constitution.test.mjs` | 65/65 | 0 |
| `git/one-door.test.mjs` | 6/6 | 0 |
| `scripts/doc-rationale-reproduction.test.mjs` | 5/8 | 1 |

The first format-suite run failed one seeded selection with `insufficient eligible rows for deleted-list-item`; the unchanged HEAD baseline and current rerun each passed 25/25. Both logs are retained, with no code/test workaround or claim of deterministic green.

The reproduction test has the **same three failures on unchanged HEAD** ([baseline](logs/baseline-doc-rationale.log), [current](logs/doc-rationale-reproduction.test.mjs.log)):

1. The symlink-output case imports `scripts/generate-doc-inventory.mjs` from its deliberately empty fixture cwd before producing the expected safety diagnostic.
2. Each documented ownership recipe rejects `noNewDoubleOwnership`.

## Audit B versus full audit

Ran the unmodified command in the byte-matched scratch payload:

```text
python3 -B plans/260925-documentation-authority-unification/reports/phase-08/audit-report.py
exit 1 (complete audit); B.ok = true in both manifests
```

Baseline versus current: **B false → true**, ownership output identical, all **74 target-digest-drift rows identical** in each manifest. No ownership/baseline data was rewritten. Full-audit A additionally sees omitted scratch files and this worker's unaccounted code changes; pair accounting belongs to the Lead, not this slice. No all-audit-green claim is made. The direct source audit was not run through automatic addon staging because that could write outside the allowed scope.

MDView preview was attempted once; its database is read-only in this confined turn, so no preview URL is available.

`git diff --check` passes. GitNexus posture is **degraded under the no-CLI rule**; source/import/history cross-checks were used, not a graph-confirmed blast radius. No full suite, lifecycle, real-repo Git mutation, staging or commit was invoked. No new feature proposal is needed. `needsWrites: []`; pre-existing reproduction failures and owner exemption disposition remain handoff items, not permission to edit outside scope.
