# W1 D3 — Git one-door migration receipt

## Outcome

**Scoped migration implemented; G4 is not green.** The input census has 58 undeclared sites (57 assignment sites plus the reserved cold-hook S1). Regeneration now reports **19**: 13 tooling capability candidates, 5 configured-command provenance gaps, and S1. Net reduction: **39 sites**. No candidate was approved, hidden, or manually reclassified. See [the exemption packet](exemption-proposal.md) for every retained site, missing capability and retirement condition, including S1's exact proposed row.

Observed checkout HEAD: `f59e0b63914259527827fadb555aa2de5ffeed8c`. Input census payload digest: `b1cd14d3f020354d4a39d9ed77e02fce4f28f8dfe71407dd9e1833497d8bd913`. Final payload digest: `3f728bbb2069e9c6d3a215d43ffcf1e103aaa28c98dd3f560b338a6a4483ea60`; 1,097 scanned files, 254 classified rows, 13 remaining `spawn` and 6 `unresolved-binary` sites. The older stopped receipt in this directory is superseded by this implementation receipt.

## Reuse and changes

- Reused existing `scripts/lib/git-ports.mjs`, Inspect ports and byte-path/pagination adapters for commit resolution, tree/path reads, diffs, ancestry, status and tracked paths. Shared strict commit resolution preserves rejection of missing/unborn commits.
- Consolidated the existing 20 MiB immutable binary/text blob readers in `generate-shipped-path-inventory.mjs`. Small committed-object identity checks use exact typed tree entries, not worktree hashes or pathspec guesses.
- Routed default inventory blob batches through existing Inspect `readObjects`: at most 4,096 objects and 31 MiB of body bytes per request, leaving framing room below the native 32 MiB bound. Existing production callers retain their 20 MiB per-file filter; aggregate size no longer forces one enormous batch. No current production caller raises `maxSize`, but that existing optional high-limit contract is preserved: entries above 31 MiB retain the original raw batch-capacity path, explicitly counted as an exemption candidate, before any typed call. A 33 MiB owning fixture proves it. There is no fallback after typed failure. Large historical alias/registry readers were likewise left as explicit exemption candidates.
- Shipped-path and tracked-platform-doc enumeration now preserves tab/non-ASCII paths instead of treating Git display quoting as filename bytes.
- Scratch `diff --no-index` uses the existing `sandboxGit` adapter, not the real repository.
- Retained both immutable verifiers, with evidence: Phase 02 imports Phase 01's link checker and historical hashes, and the Phase 02 owning proof remains. Commit/diff/status/link reads and detached creation now use existing ports. Cleanup reuses existing guarded `removeWorktree`, logs retention on refusal, and no longer falls through to forced removal/rm-rf.
- Worktree setup commands carry the existing configured-consumer marker. The scanner still cannot prove their parsed-config provenance, so that row remains red. `bin/fgos.mjs`, `src/runner/merge.mjs`, `doc-alias-resolver.mjs`, `.githooks/pre-commit`, the scanner and Git implementation are unchanged.
- Added one user-visible CHANGELOG entry. No new port, configuration default, environment-variable contract, infrastructure dependency or setup/doctor registry entry was added.

## Owning proofs extended

No test was deleted, skipped or weakened.

| Owning file | Added/extended behavior |
|---|---|
| `test/scripts/generate-shipped-path-inventory.test.mjs` | Immutable content despite worktree edits; byte-safe unusual filenames; exact blob identity and absent-path/invalid-ref rejection. |
| `test/scripts/generate-doc-inventory.test.mjs` | Binary preservation; object-count and aggregate-byte splitting; existing size filtering and missing-object rejection. |
| `test/scripts/check-doc-constitution.test.mjs` | Isolated tracked/untracked platform Markdown enumeration, byte paths and ignored-file exclusion, absent from the existing live-repository placement proofs. |
| `test/scripts/check-evidence-relocation.test.mjs` | Extended existing deterministic-generation proof for strict default HEAD binding and unborn rejection; existing index mode/blob/stage proofs remain. |
| `test/scripts/verify-phase-02.test.mjs` | Immutable shared Markdown checker reads the end commit, ignores deleted documents and rejects broken links. |
| `test/git/one-door.test.mjs` | Existing configured-consumer marker probe. |

## Commands and results

All Node test invocations were **one file at a time**, with `CLAUDE_CODE_SESSION_ID` unset and the activated release's `FGOS_HOST_BIN`. See [receipt.json](receipt.json) for exact environment, command template, file-level counts and IDs. Logs remain in `/tmp/fgos-work/w1-d3-brief/`.

The checkout has no source-local native addon. Initial direct source invocations failed loading that addon. Rather than building outside scope, tests ran from `/tmp/fgos-work/w1-d3-brief/payload`: a copied source payload with the activated release's addon referenced through the production-supported `native-addon.json` descriptor. No loader was patched and no check was disabled. Every changed `.mjs` file was byte-compared with that payload and matched. This proves those fixture behaviors against the existing activated native implementation, **not a newly built release**.

| Individual file | Exit | Passed / total |
|---|---:|---:|
| `test/git/one-door.test.mjs` | 0 | 6 / 6 |
| `test/scripts/generate-doc-inventory.test.mjs` | 0 | 97 / 97 |
| `test/scripts/verify-phase-02.test.mjs` | 0 | 6 / 6 |
| `test/scripts/check-evidence-relocation.test.mjs` | 0 | 41 / 41 |
| `test/scripts/check-doc-retirement.test.mjs` | 0 | 36 / 36 |
| `test/scripts/doc-review-format.test.mjs` | 0 | 25 / 25 |
| `test/scripts/doc-review-authorship.test.mjs` | 0 | 15 / 15 |
| `test/scripts/doc-candidate-conservation.test.mjs` | 0 | 60 / 60 |
| `test/scripts/doc-restoration-proofs.test.mjs` | 0 | 5 / 5 |
| `test/scripts/check-doc-conservation.test.mjs` | 0 | 35 / 35 |
| `test/scripts/doc-corpus-decisions.test.mjs` | 0 | 8 / 8 |
| `test/scripts/doc-alias-resolver.test.mjs` | 0 | 18 / 18 |
| `test/scripts/doc-decision-exact.test.mjs` | 0 | 7 / 7 |
| `test/scripts/doc-decision-mirrors.test.mjs` | 0 | 5 / 5 |
| `test/scripts/doc-decision-review.test.mjs` | 0 | 14 / 14 |
| `test/scripts/doc-decision-conservation.test.mjs` | 0 | 5 / 5 |
| `test/setup/checks.test.mjs` | 0 | 51 / 51 |
| `test/runner/worktree.test.mjs` | 0 | 69 / 69 |
| `test/scripts/generate-shipped-path-inventory.test.mjs` | 1 | 9 / 11 |
| `test/scripts/check-doc-constitution.test.mjs` | 1 | 62 / 65 |

Latest aggregate: **574 / 579 cases passed across 20 separately invoked files; 5 failed**. Both new byte-path/immutable fixture proofs pass. The five failures are not represented as green:

- Shipped inventory's CLI and `classifyPathAttributes` live-repository tests require the payload's own HEAD; the scratch payload is intentionally not a Git checkout (`commit not found`).
- Constitution's live platform-placement and promotion-report tests likewise need tracked files in that payload (`page.entries` absent on non-repository). Its usage-amendment repository-corpus test also needs `pilot/first-round`, not included in the scratch payload.
- Earlier setup attempts lacked copied package contracts; after copying those existing data files into scratch, its complete individual file passed 51/51. No production workaround was added.

`node scripts/git-one-door-scan.mjs --root /home/vantt/projects/forgentX-p9-w1-d3 --write-census --json` ran from that identical scanner payload and wrote the scoped census: **exit 1, 19 sites**, deliberately red. `git diff --check`: **exit 0**. Read-only `git diff`, `git show`, `rg` and history searches supported scope/prior-art checks.

## Impact posture, constraints and handoff

**GitNexus: degraded under no-CLI.** The initial read-only capability query was refused (exit 127, no installation for this worktree); no successful fgOS CLI, graph impact or detect-changes run is claimed. Direct source/history searches were used instead. The affected boundaries are the documentation generators/gates and the immutable verifiers; guarded cleanup is owned by the existing runner worktree suite (69/69). Static blast radius is not graph-confirmed.

No lifecycle verb, full-suite launcher, `npm test`, Cargo build/test, staging or commit was run. No Git write targeted the real repository; individual tests create/discard their own disposable fixture repositories. No Git component outside the expressly writable census was changed. No runtime/secrets/installation data was edited. Scratch is under the permitted `/tmp/fgos-work/w1-d3-brief` root. `needsWrites: []`: L13-2 missing capabilities were recorded as proposals rather than used to demand out-of-scope changes.

Lead/owner must disposition the 19 proposals and run the five repository-dependent cases in a properly staged source payload before claiming G4/DoD. This worker does **not** approve exemptions, clear G4, or claim a fully green suite.
