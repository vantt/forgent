# Review A38 Step 6: evidence digest manifest and relocation verifier

Pinned at `00eaad96d` in the read-only worktree `/home/vantt/projects/forgentX-s8-review`. The manifest was generated at `sourceCommit 916116b04`, and `git diff 916116b04 00eaad96d -- docs/architect docs/platform` is empty, so the manifest still describes the tree at HEAD.

## Verdict: rework

The manifest data is correct: all 867 entries checked out and nothing is missing. Live `--before` passes and the 9 tests pass.

The verifier itself needs rework before it can gate the cutover:

- `--after` misses some maintained legacy mentions, so it can pass when it should fail. It also flags text that policy says must never be rewritten, so it fails when it should pass.
- `--before` lacks the consumer-table regeneration that policy §4.6 requires.
- `--before` accepts an unlisted legacy payload.
- `classifyPath` is claimed as reused in the receipt, the progress notes and owner-answers L12-93, but the code never calls it.
- The receipt shows no blockers even though the Step 6 stop condition "missing standing verification integration" still holds.

## 1. Manifest: checked one entry at a time (pass)

I recomputed every entry with my own script (`scratchpad/s6-review/recompute.mjs`). It does not use the verifier's helpers. It uses `git ls-files -s -z`, its own payload rule (at least two path segments after a `verification` segment), its own sha256, and `sha1("blob <n>\0"+bytes)` for the git blob id.

- 867 entries, matching 867 legacy and 867 platform payloads. No unlisted file in either tree and no duplicates.
- For every entry, both files exist and match the recorded `sha256` and `bytes`.
- `gitBlob` matches the recomputed blob id and both git index blob ids.
- `mode` matches the git index mode on both sides and the filesystem execute bit on both sides.
- `after` equals `before` with `docs/architect/` replaced by `docs/platform/`. `relation` is always `identical-mirror`. `collection` is the segment after `verification`. Every entry has exactly the policy §4.4 keys.
- There are 12 files with mode 100755, all `visibility-herdr/proofs/2026-09-0{6,8}-*/*.sh`, preserved on both sides.
- Totals match the policy: 302 Markdown and 565 other files, 17,176,516 bytes, 17 collections, and the per-collection counts in the §2.1 table.
- The receipt counts reproduce: architect 981, platform 1,189, payloads 867 and 867.
- Running `generateManifest({sourceCommit: 916116b04})` in memory reproduces the committed file byte for byte. The sort order is also stable across the C, en_US, tr_TR, sv_SE, da_DK and ja_JP locales.
- Sort-order caveat: the manifest is sorted with `localeCompare`, not in codepoint order (entry 0 is `current-cell.md`, which sorts before `P00.1.md`). See L1.

## 2. Defects

### H1: `--after` can pass with unrepointed legacy mentions (High)

- **Location:** `scripts/check-evidence-relocation.mjs:100-107` and `:152-162`.
- **What is wrong:** maintained text only fails if it contains a complete payload file path from the manifest, with or without the leading `docs/`. A mention of a collection directory, a `proofs/<date>/` directory or a `<track>` template gets through. So do encoded or normalisable forms (`p%2Emd`, `c1/./p.md`).
- **Scratch reproduction (case C):** `docs/how-to/g.md` contains `see docs/architect/a/verification/c1/ for proofs`. `--after` exits 0.
- **Live tree:** of the 78 tracked maintained files that name the legacy form `architect/agent-coordination/verification` (outside archive, plans, docs/history and .fgos), the verifier flags 53 and misses 25. Ten of the misses are real maintained consumers that policy §3 says must be repointed:
  - `src/runner/dispatch/{config,trust-store,worker-home}.mjs` (code comments)
  - `test/runner/dispatch-{executor-profile,worker-home,worker-session}.test.mjs` (test comments)
  - `docs/how-to/author-a-plan-loop-track.md`
  - `docs/how-to/coordination-examples/architecture-advisory-panel-v1-alternative-and-composite-reopen.md` (a `proofs/P01.2/proposals/` directory link)
  - `docs/knowledge/.../hook-registration-guard.md`
  - `docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md`

  The policy table names these exactly: "comments go stale and fail the 'no legacy path in comments' acceptance".
- **Fix:** match the legacy roots instead of individual file paths. Search for `architect/<area>/verification/<collection>` for each collection in the manifest, which covers both the repo-relative and the `../` relative forms. Classify each hit as history, fixture, alias or maintained. Add a test where a directory-form mention makes `--after` fail.

### H2: `--after` fails on text that policy says must never be rewritten (High)

- **Location:** `scripts/check-evidence-relocation.mjs:110-127`.
- **What is wrong:** history is excluded with a hand-written list (`docs/history/**` and `docs/platform/history/**` only). The constitution's `history` kind (minimum-constitution.json, kind `history`) also covers `docs/platform/<area>/history/**`, `docs/platform/<area>/subcomponents/<s>/history/**` and `docs/platform/<area>/reports/**`.
- **Live `--after` result:** 23 of the 53 hits are under `docs/platform/<area>/history/**` (for example the `retired-engine/**` files and `documentation-migration/source-inventory.md`). Another 4 are `test/fixtures/**` recorded run results, which policy §3 says "must not be rewritten". One is `CHANGELOG.md`, which §3 marks as "historical text; alias table covers it, no rewrite".
- **Consequence:** in Phase 9, `--after` cannot pass unless someone rewrites history or fixtures, which policy §4.3 and §3 forbid. The likely outcome is that someone edits the verifier under cutover pressure.
- **Fix:** classify through `classifyPath(rel, constitution)` and exclude the `history` and `evidence-payload` kinds. Add explicit, tested exclusions for `test/fixtures/**` recorded data and for CHANGELOG release history, citing policy §3. Reading the constitution through the existing door also fixes R1.

### H3: `--before` does not regenerate the consumer table (High)

- **Location:** `--before` branch, `scripts/check-evidence-relocation.mjs:309-447`.
- **What is wrong:** policy §4.6 says: "Anything a runtime consumer reads stays put … enforced by the consumer table being regenerated in the checker's `--before` run (search for the full legacy path and the collection names in code, tests and instruction files)." `--before` does no consumer search at all.
- **Consequence:** the Step 6 stop condition "newly found runtime reader blocks relocation readiness" has no mechanical guard. The receipt's `runtimeReaders: []` and `unclassifiedConsumers: []` come from a one-off scan that is not committed and not reproducible: no command, no per-file list and no classification are recorded.
- **Fix:** in `--before`, run `git grep -l -F` (or the tracked-file list) over `src test scripts bin apps packages core domains plugins .agents .claude .githooks` plus the AGENTS.md, CLAUDE.md and SKILL.md files. Search for the legacy root and for each collection name in the manifest. Compare the hits with a committed classified consumer list and fail on any unknown hit. Write the per-file table into the receipt.

### M1: `--before` accepts a legacy payload that is not in the manifest (Medium)

- **Location:** `scripts/check-evidence-relocation.mjs:435-447`.
- **What is wrong:** only the platform tree is checked for unlisted payloads. Policy §4.1(b) requires that "every file is recorded in the digest manifest". A legacy-only payload with no mirror would be deleted at cutover without any digest record.
- **Consequence:** `--after` would then only complain that the file still exists, which pushes the deleter to delete it.
- **Scratch reproduction (case A):** add `docs/architect/a/verification/c1/unlisted-legacy.md`. `--before` exits 0.
- **Fix:** in `--before`, also compare `scanLegacyPayloads` against the manifest's `before` set. Add a test for this case.

### M2: `classifyPath` is claimed as reused but never called (Medium)

- **Location:** `scripts/check-evidence-relocation.mjs:10,17`.
- **What is wrong:** `classifyPath` is imported and cited in the header comment. The receipt `reusedPrimitives`, progress.md and owner-answers L12-93 all say it was reused. `rg classifyPath` shows only the import and the comment.
- **Consequence:** payloads are classified by the inventory regex `isEvidenceMirrorPath` (which matches any `verification/<x>/<y>` path). History is classified by the hand-written list in H2. That second, hand-rolled classification is the cause of H2.
- **Fix:** use `classifyPath` (H2) or drop the import and correct all three records.

### M3: no test for the generator, and gaps in the negative tests (Medium)

- **Location:** `test/scripts/check-evidence-relocation.test.mjs`.
- **Missing coverage:**
  - `generateManifest` is imported (line 10) but never tested. The committed manifest comes from it, and nothing tests its shape, sort order, `after:null`/`moved` handling or determinism.
  - The test titled "changed byte in either file" (lines 164-188) only changes the platform file.
  - The wrong-mode test covers only the legacy file and only `--before`.
  - In `--after`, nothing tests changed bytes, wrong mode, a missing platform file, an unlisted payload, or a stray legacy payload outside the manifest (`scanLegacyPayloads`, lines 465-476).
  - No test covers H1, H2, M1 or R2.
- **Fix:** turn the cases into a table that runs each mutation against both targets and both modes. Add one test for `generateManifest` that builds a small git fixture and asserts sorted, stable output.

### M4: the receipt reports no blockers while readiness gaps remain (Medium)

- **Location:** `step-06-evidence-receipt.json:79` (`"blockers": []`).
- **What is wrong:** Step 6's stop condition includes "missing standing verification integration". Policy decision 8 says the verifier is the only guard on the platform copy and recommends a standing run. Neither exists yet:
  - `scripts/check-doc-retirement.mjs:149` still reports `evidence-digests` as blocked with "no verifier exist".
  - No test runs live `--before` against the committed manifest.

  This was correctly kept out of this slice's write scope, but the receipt should name it as an open readiness blocker routed to the Lead's tooling slice.
- **Also:** the "57 maintained text mentions" figure for live `--after` (owner-answers L12-93, progress.md) does not reproduce. At `00eaad96d` the scan finds 53, and the worktree has no untracked or ignored files. The cause is R3: the walk reads the filesystem rather than git. The 214/196/184/21 consumer counts do reproduce at `916116b04`. At HEAD they are 215/197/185/22 because the new test file is one more consumer.

### R1: the manifest exclusion path is resolved against the wrong base (Low)

- **Location:** `scripts/check-evidence-relocation.mjs:96-98` and `:632`.
- **What is wrong:** the CLI resolves `--manifest` against `repoRoot`, but the text scan resolves it against `process.cwd()`. When `--repo-root` is not the current directory, the manifest names every legacy path and gets flagged as maintained text.
- **Reproduction (case S):** manifest inside the repo root, run from another directory: a violation on `m.json`.
- **Why it is latent:** the real manifest lives under `plans/` (excluded) and the proposed sealed home is under `docs/platform/history/` (excluded). The test hides the bug because it passes an absolute path.
- **Fix:** resolve against `repoRoot` in both places.

### R2: the exclusion filters are broader than policy (Low)

- **Location:** `scripts/check-evidence-relocation.mjs:113-123`.
- **What is wrong:**
  - Any file whose name contains `alias-table` is excluded (case D: `docs/how-to/alias-table-notes.md` passes).
  - Any directory named `target`, `node_modules` or `.cargo` at any depth is excluded (case L: `docs/guide/target/x.md` passes).
  - All of `plans/` is excluded (case E). Policy says "history, archive and the alias table". Active plans and the program board are maintained text, although policy §3 treats `plans/**` as immutable record. Write that choice down explicitly.
  - Symlinked files are skipped.
  - Read errors are swallowed (`catch {}` at line 164), so an unreadable maintained file counts as clean.
- **Fix:** exclude exact registered alias-table paths and use top-level build-directory exclusions only. Scan the git tracked-file list (deterministic, ignores untracked junk). Report read errors as violations.

### R3: the text scan is not deterministic (Low)

- **Location:** `scripts/check-evidence-relocation.mjs:128-171`.
- **What is wrong:** the scan walks the working tree, so untracked or ignored files change the result. That explains the 57 vs 53 discrepancy in M4. Policy §2.1 and §3 measured with `git ls-files` and `git grep`.
- **Fix:** use the tracked-file list.

### R4: weak manifest validation and CLI exit codes (Low)

- **Location:** `scripts/check-evidence-relocation.mjs:287-298` and `:577-602`.
- **Manifest content is barely validated:**
  - An entry `{before:null, after:null}` is accepted (case G).
  - Duplicate entries and a nonsense mode string are accepted (case I: mode `bogus` on a 0644 file passes).
  - A `before` of `../../../../etc/hostname` is resolved outside the repo (case P).
  - Sort order and `sha256` format are not checked.
- **The CLI handles bad input poorly:**
  - A malformed manifest (version 2) throws an uncaught exception and exits 1 with a stack trace, which is the same exit code as "violations found" (case F). It should exit 2.
  - Unknown flags are ignored silently (case O).
  - Passing both `--before` and `--after` silently runs `--after` (case N).
- **Fix:** add a schema check (fixed keys; `before` must be a payload path under `docs/architect`; `after` null or the mirror path; sha256 is 64 hex characters; mode is 100644 or 100755; entries sorted and unique). Catch errors in `runCli` and exit 2. Reject unknown or conflicting flags.

### R5: mode and symlinks are checked against the filesystem only (Low)

- **What is wrong:** `checkFileMode` reads the filesystem execute bit, not the git index mode, so a `git update-index --chmod` change or `core.fileMode=false` goes unseen. A platform payload replaced by a symlink to the legacy file passes `--before` (case H). Git mode 120000 is not detected. Policy §4.3 protects git modes.
- **Fix:** in `--before`, also compare `git ls-files -s` mode and blob against `entry.mode` and `entry.gitBlob`. The `gitBlob` field is recorded but never verified. Reject symlinks.

### L1: sorting uses `localeCompare`, not codepoint order (Low)

- **Location:** `scripts/check-evidence-relocation.mjs:58,86,172,268,563-566`.
- **What is wrong:** policy §4.4 says "deterministic like the ratchet baseline", and the ratchet sorts in codepoint order (`check-legacy-docs-ratchet.mjs:365`, `sortOrder: 'codepoint-ascending'`).
- **Current effect:** the output is stable on this data across the locales tested. A future collation-sensitive name, or a small-ICU build, could reorder it.
- **Fix:** use a codepoint comparator, regenerate the manifest, and record the sort order.

### L2: duplicated main-module helper, and raw git spawns (Low)

- **Location:** `scripts/check-evidence-relocation.mjs:667-670`.
- **Duplicate helper:** this file defines its own `isMainModule`, while the shared `scripts/lib/is-main-module.mjs` exists and is used by both scripts this file imports from. The local copy lacks the realpath and URL-encoding handling the shared helper documents, so a symlinked invocation silently does nothing. Import the shared helper instead.
- **Raw git spawns:** the file spawns `git` directly (`:187`, `:198`), while `scripts/lib/git-ports.mjs` says outer scripts read through Inspect (Git spec §13). The sibling `check-doc-*` scripts have the same pattern, so this is informational only. Moving to Inspect belongs to a family-wide item.

## 3. Reuse audit (point 4)

| Primitive | Status |
|---|---|
| `computeSha256` (`check-legacy-docs-ratchet.mjs:112`) | Reused |
| `normalizePosix` (`check-legacy-docs-ratchet.mjs:43`) | Reused |
| `isEvidenceMirrorPath` (`check-doc-inventory-gates.mjs:1009`) | Reused |
| `classifyPath` | Claimed but not used (M2) |
| History classification | Re-implemented by hand in `isExcludedDir` instead of using the constitution `history` kind (H2) |
| `isMainModule` | Duplicated (L2) |
| `scanPlatformPayloads` / `scanLegacyPayloads` | Two copy-paste walkers that differ only in the root (lines 37-88). Make them one function with a root argument |
| `--before` / `--after` | The hash, mode and size blocks are repeated three times (lines 324-370, 385-431, 491-537). Use one `verifyFile(target, path, entry, phase)` helper |

## 4. Exceptional consumers (point 6)

- **Runtime readers: none confirmed.** Collection-name hits in product code are identifiers or comments only:
  - `executor-policy-dispatch-seams`: 7 src files, phase comments
  - `runtime-recovery`: plan-path comments in `recovery.mjs` and `run-lock.mjs`
  - `rust-host-r1-kernel`: a plans path in `scripts/measure-p08-performance.mjs`
  - `architecture-advisory-panel`: a comment in `operation-prompt-templates.mjs`
  - `visibility-herdr`: comments in the 3 dispatch files

  A search for dynamic `verification/${...}` construction in `src bin apps packages core domains scripts .githooks` found nothing relevant.
- **Consumer counts:**
  - At `916116b04`: total 214, legacy form 196, full path 184, platform form 21. The groups match the receipt.
  - At HEAD, `00eaad96d`: 215/197/185/22. The extra file is `test/scripts/check-evidence-relocation.test.mjs`.
- **New consumers since the policy's §3 table:** these exist but are not classified anywhere, and the receipt reports `unclassifiedConsumers: []` without a per-file table:
  - `test/scripts/check-doc-conservation.test.mjs`, `check-doc-retirement.test.mjs`, `doc-candidate-conservation.test.mjs` and `check-evidence-relocation.test.mjs` (synthetic strings)
  - 18 additional `docs/platform/**` files (policy counted 19, now 37), mostly `agent-coordination/history/retired-engine/**`
  - `docs/platform/proposals/*` (4)
  - `docs/platform/system-architecture/architecture/architecture-intent.md`
  - `docs/platform/host-invocation-routing/history/...`

  These cannot be audited until H3 adds the classified table.

## 5. Negative behaviours (point 3)

- **Tested, and they really fail:**
  - missing legacy file and missing platform file (`--before`)
  - changed platform file (`--before`)
  - unlisted platform payload (`--before`)
  - wrong legacy mode (`--before`)
  - remaining legacy file (`--after`)
  - full-path maintained mention (`--after`)
  - CLI exit codes 0 and 1
- **Not tested:** see M3, plus the scratch failures from cases A, C, D, E, G, H, I and L.
- Temp-directory cleanup in the tests is correct (try/finally `rmSync`). My scratch fixtures were removed.

## 6. Commands run

- `env -u CLAUDE_CODE_SESSION_ID node scripts/check-evidence-relocation.mjs --manifest plans/260925-documentation-authority-unification/reports/phase-08/step-06-evidence-relocation-manifest.json --before`: exit 0, 867 entries, 0 violations.
- `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/check-evidence-relocation.test.mjs`: exit 0, 9/9 pass.
- Independent recompute: `recompute.mjs`, 0 errors.
- Consumer and maintained-scan recount: `scan.mjs`.
- Negative probes: `probe.sh` and `probe2.sh`.

All scripts are in this scratch directory.

Status: DONE
Summary: The manifest checks out mechanically: all 867 entries, 12 executable files, byte-for-byte regeneration, and live `--before` passes. The verifier needs rework: `--after` misses directory-form legacy mentions and flags history and fixture text policy says must not be rewritten, `--before` lacks the §4.6 consumer regeneration and the unlisted-legacy check, and the receipt's `classifyPath` reuse claim is false.
