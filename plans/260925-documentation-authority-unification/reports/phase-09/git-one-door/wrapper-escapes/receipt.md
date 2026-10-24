# Wrapper-escape declaration repair receipt

Authority: [escape brief](../../w5-g4-escape-brief.md), following the [wrapper review](../../reviews/w5-g4-wrapper-review.md). Input HEAD: `0d8068bdd12d19f552feb5c59d414443744cc13c`.

## Result and owning proof

- `declaredSiteId` reuses `valueFlowCalls` once and retains both its callers and escapes. `applyDeclarations` refuses escaping wrappers with `invalid Git declaration: wrapper escapes for <path>: <first escape>`, except `configured-binary`, whose program has parsed-config provenance. No resolver or Git port was added.
- Extended the existing `WRAPPERS` fixtures in `test/scripts/git-one-door-declarations.test.mjs`: `.call`, `Reflect.apply` and array-slot calls for tooling, the verifier callback and the cold-hook callback. All **nine new subcases were red before the fix** (missing expected exception); all are green after. Existing proofs were neither removed nor weakened. Automatic value-flow classification remains owned by `test/git/one-door.test.mjs`; the unchanged hook drift file provides its existing boundary proof.
- Updated the scanner comment, Git spec §12, CHANGELOG and [Git-owner review request](../git-owner-review-request.md). The request separately records the **open pre-existing aliased-export false negative** (`export { runner as r2 }` on a binary-parameter wrapper, cross-file `r2('git', ['reset', '--hard'])`, zero sites without declarations); it is deliberately not fixed here.
- Regenerated the census only by the production CLI's `--write-census` flag. **0 undeclared sites**, 1,127 scanned files, all 25 existing declarations still match. Their identities, reasons, classes, retirement conditions and declaration bytes are unchanged. The only census additions are the reported `escapes` fields; file digests and payload digest are unchanged (the scanner already excludes itself).
- All 20 hook/tooling declarations have no escapes. Exactly one configured declaration retains an escape: `src/runner/merge.mjs:958`, `landRunnerItem:cc9889cc48b52606b9bc90ec69d9c7e3216188c53719a6b06f5243f78ef87115`, reports `passed to an unresolved callee (src/runner/merge.mjs:919)`. The other merge declaration at line 992 also matches and reports an empty escape list. This is the configured-binary exception, not an exemption for caller-selected tooling/hook programs.

[Machine audit](audit.json), [replayable read-only audit](audit.mjs), [first CLI scan](scan-1.json), [second CLI scan](scan-2.json). The audit asserts unchanged declarations, census file digests and pre-existing class rows (after removing only the new escape field), empty sites, no hook/tooling escapes, the configured exception, byte-identical scans/census and a passing `verifyCensus` against the actual working tree.

## Commands and exit codes

All commands ran from `/home/vantt/projects/forgentX-p9-w1-d4`. Scratch: `/tmp/fgos-work/w5-g4-escape/`.

### Tests first, then fix

`releasePath` was read from the brief-authorized activation file, not inferred from PATH:

```sh
RELEASE_PATH=$(node -p 'JSON.parse(require("fs").readFileSync("/home/vantt/projects/forgentX/.fgos/installation/activation.json", "utf8")).releasePath')
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work/w5-g4-escape \
  FGOS_HOST_BIN="$RELEASE_PATH/bin/fgos" \
  node --test test/scripts/git-one-door-declarations.test.mjs test/githooks/census-drift.test.mjs
```

Resolved release: `/home/vantt/.local/state/fgos/releases/sha256:a970a7e6052bdef1bb4113212d16caf5f2a916f6a66d2a6130b744fe458328c8`.

| Run | Exit | Outcome | Evidence |
|---|---:|---|---|
| New tests, unchanged scanner | 1 | 13 existing tests pass; nine new subcases fail with missing exception, plus their parent reports failure (10 reported failures, not ten distinct cases) | [red log](logs/red.log) |
| Same tests, repaired scanner | 0 | 23/23 pass, no skips, including all nine new subcases and all three hook drift tests | [green log](logs/green.log) |

No suite launcher, `npm test` or `cargo test` was run. Test fixture Git writes occur only in disposable scratch repositories, not the source repository.

### CLI census and repeatability

The first attempt preloaded the released addon via the loader's supported explicit descriptor, then invoked the real CLI:

```sh
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work/w5-g4-escape \
  NODE_OPTIONS='--import=/tmp/fgos-work/w5-g4-escape/release-addon.mjs' \
  node scripts/git-one-door-scan.mjs --write-census --json
```

**Exit 1**: `git-addon-second-load`. See the scope incident below and [full stderr](logs/build-1.stderr). No census was produced by that attempt.

Subsequent invocations used the existing staged descriptor directly, with read/probe state confined to scratch. No loader patch, mock Inspect, check bypass or further addon bootstrap was used:

```sh
export TMPDIR=/tmp/fgos-work/w5-g4-escape
export FGOS_STATE_ROOT=/tmp/fgos-work/w5-g4-escape/fgos
export FGOS_HOST_BIN="$PWD/.fgos/runtime/git-addon/78bf08605a0e9590/fgos"
export FGOS_ACTIVE_MANIFEST_PATH="$PWD/.fgos/runtime/git-addon/78bf08605a0e9590/manifest.json"
env -u CLAUDE_CODE_SESSION_ID node scripts/git-one-door-scan.mjs --write-census --json
# Exit 0. Snapshot census in scratch.
env -u CLAUDE_CODE_SESSION_ID node scripts/git-one-door-scan.mjs --json > /tmp/fgos-work/w5-g4-escape/scan-1.json
env -u CLAUDE_CODE_SESSION_ID node scripts/git-one-door-scan.mjs --json > /tmp/fgos-work/w5-g4-escape/scan-2.json
# Both exit 0, 0 sites.
cmp /tmp/fgos-work/w5-g4-escape/scan-1.json /tmp/fgos-work/w5-g4-escape/scan-2.json
# Exit 0, byte-identical. SHA-256s in audit.json.
env -u CLAUDE_CODE_SESSION_ID node scripts/git-one-door-scan.mjs --write-census --json
# Exit 0 again.
cmp /tmp/fgos-work/w5-g4-escape/census-first.json packages/git/contracts/mutation-census.v1.json
# Exit 0, byte-identical census.
node /tmp/fgos-work/w5-g4-escape/audit.mjs
# Exit 0, assertions including verifyCensus pass.
git diff --check
# Final exit 0; an earlier run exited 2 for an extra EOF blank line in the review request, then corrected.
```

Census SHA-256: `26110adb416a328fe279cac200ded4e64ae58fd63f1ca6addccf9afd3ad7173d`. The final pair of retained CLI scans was run after creating these evidence paths, so both include the same outside-product file counts.

## Prior art, impact and limits

Read the brief and review, reading map, Git spec's boundary and classification contracts, predecessor receipt and the existing declaration implementation/tests. `git log -S'valueFlowCalls(ctx, file, owner).calls'` and the actual diff identify `db4b7de4d` as adding caller binding while discarding the already computed escapes. The walker already reports these shapes; preserving its result is the missing piece. No consumer migration, new component, config default, environment contract, dependency, setup/doctor registry row, declaration re-authoring or pinned-generator change is needed.

Source search shows `declaredSiteId` is called only from `scan`; `applyDeclarations` is called only from `scan`. Census build, doctor verification and scanner tests are the affected boundaries. **Impact-analysis: degraded**, not graph-confirmed: an initial `fgos tool query --capability impact-analysis --status present` was mistakenly attempted in parallel with reading the brief and exited 127 (`no .fgos/installation found`). The brief forbids fgOS CLI use; no further capability CLI or lifecycle verb was issued. No GitNexus impact/detect-changes result or owner acceptance is claimed.

## Scope incident (not hidden by green tests)

The failed first CLI attempt's released-addon preload did **not** make the default loader recognize this checkout as that release's payload. `ensureScriptAddon` fell through to automatic staging, **built Cargo targets under `target/` and wrote `.fgos/runtime/git-addon/78bf08605a0e9590/`**, then refused a second addon load. This violated the brief's no-`.fgos`/scratch-only write restriction; the helper also invokes its staged host's version check. These were unintended side effects of the verification command, not authorized product changes. They are preserved, not deleted or modified to conceal the incident; cleanup is for the Lead/owner. The retained stderr records the build and error. `git status` shows no tracked change outside the exact writable list, but does not prove absence of ignored runtime artifacts.

No source-repository stage/commit, lifecycle action, accounting pair, program-board update, secret edit or consumer/hook edit was made. New report artifacts live under the granted `git-one-door/**` subtree. MDView was not started: its external registry/database writes are outside this grant. `needsWrites: []`: no additional product write scope is needed for the repair; this does not erase the unintended runtime writes above.

This receipt claims the scoped behavioral repair and focused proof, **not** full-suite/Cargo-test completion, general scanner completeness, Git-owner acceptance, cutover authorization, or clean execution of every constraint.
