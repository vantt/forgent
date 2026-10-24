# Suite repair receipt

**Implementation complete; native verification blocked by write scope.** Input HEAD: `a1fae5356b18b990d554c527396fe9295ba1f53d`. No suite-green, gate acceptance or cutover claim. [Machine receipt](receipt.json) includes exact argv, exits and durable log references.

## Changes and prior art

- `test/runner/merge-land.test.mjs` and `test/workflow/units-runner.test.mjs`: make only each lease-race `prepare` mock async and await the original native call before reading `candidate`. `publish` and all assertions are unchanged. The six timing cases below still invoke the real native implementation and real lease acquire; no replacement behavior or additional test was introduced.
- `cca48c63a` made native Land prepare/publish asynchronous; `22e5b322c` introduced the prepared-candidate reads that still assumed synchronous native prepare. Read-only `git show` confirmed both changes and the owning Git §7 contract. Product code is unchanged. Static scope is these two existing proof callbacks, not their production callers; graph blast radius is **unconfirmed**, with impact-analysis **degraded/unqueried** under the no-fgOS-CLI brief and absent GitNexus MCP.
- `f06b30fa3` changed runner pane-retention/doctor prose after the registry pin. Reused `scripts/generate-doc-inventory.mjs --carry-forward-identity-registry`, **not hand-edited hashes**. Precedent: phase-08 `owner-answers.md`, L12-125, “Registry and remaining blocker” / command table, and registry commit `0962d4e83`.
- As in that precedent, single-source carry correctly refuses edited/new `business-rules` (exit 1). The existing repo-wide carry succeeds (exit 0); its compact JSON output was copied byte-for-byte into the expressly writable working registry. No generator, liveness test or scanner was modified. No frozen reproduction baseline was changed.

## Six race fixes retained

| Existing owning proof | Timing | Implementation | Behavioral rerun |
|---|---|---|---|
| Runner Land lease acquired after admission | before prepare | async + await | Not run; native staging boundary below |
| Runner Land lease acquired after admission | after prepare | async + await | Not run; same boundary |
| Runner Land lease acquired after admission | before publish | async + await | Not run; same boundary |
| Workflow Land lease acquired after admission | before prepare | async + await | Not run; same boundary |
| Workflow Land lease acquired after admission | after prepare | async + await | Not run; same boundary |
| Workflow Land lease acquired after admission | before publish | async + await | Not run; same boundary |

[Exact test-delta verification](test-delta-verification.json) reconstructs each edited file from HEAD with only the two prescribed substitutions and proves every original assertion is unchanged. This is **not** behavioral execution evidence.

## Registry result

[Registry verification](registry-verification.json): all **101,711** prior claim IDs remain exactly once across active/gap/retired populations; **0 lost IDs**. Active units **93,220 → 93,887**; runner stays **517 → 517**, with complete current anchor/digest equality. Registry commit is the input HEAD and its runner blob equals `HEAD:docs/specs/runner.md` (`144945ba6919df51e8024122a40dff17809bab88`).

The generator updates both changed runner units: `business-rules` (`ebb1251f… → f182ae33…`) and `unheaded-block-93` (`fb0b0100… → 797c7185…`). The stable heading retains `claim_32d366486b72925c171d9fefc84179e2` with `needs-review` lineage. The edited positional unit gets a new opaque claim ID; its prior ID is preserved in the gap population, not silently reused or lost. Repo-wide carry also records **140 edited-kept, 952 added, 151 new gaps, 134 removed-pending-disposition** units. These are generator identity outcomes, **not semantic approvals or accepted retirements**; existing review owners retain those duties.

## Commands and exits

Node commands ran from the original linked checkout, singly, with `CLAUDE_CODE_SESSION_ID` unset, `TMPDIR=/tmp/fgos-work/w4-suite-fix-brief`, and `FGOS_HOST_BIN=<releasePath>/bin/fgos`. Only `releasePath` was explicitly read from the authorized activation file: `/home/vantt/.local/state/fgos/releases/sha256:a970a7e6052bdef1bb4113212d16caf5f2a916f6a66d2a6130b744fe458328c8`.

| Command after that environment prefix | Exit | Evidence |
|---|---:|---|
| `node --test test/scripts/doc-runner-liveness.test.mjs` before | 1 | Real registry mismatch in both runner units |
| `node scripts/generate-doc-inventory.mjs --carry-forward-identity-registry --identity-registry plans/260925-documentation-authority-unification/reports/phase-06/working-identity-registry.json --commit HEAD --source-path docs/specs/runner.md --json-out /tmp/fgos-work/w4-suite-fix-brief/runner-registry.json` | 1 | Strict single-source carry refuses edited heading |
| Same carry command without `--source-path`, output `current-registry.json` in the same scratch directory | 0 | Existing repo-wide carry |
| `node /tmp/fgos-work/w4-suite-fix-brief/install-registry.mjs` | 0 | ID conservation, source/blob authentication, exact generator-output installation |
| `node --test test/scripts/doc-runner-liveness.test.mjs` after | 0 | **1 passed, 0 failed, 0 skipped**, all 31 protected headings / 13 complete-record cases retained |
| `node --check test/runner/merge-land.test.mjs` | 0 | Syntax only |
| `node --check test/workflow/units-runner.test.mjs` | 0 | Syntax only |
| Read-only `loadNativeAddon()` preflight | 1 | `git-addon-not-shipped`; no staging attempted |
| `git diff --check` | 0 | No whitespace errors; repeated after receipt creation |

## Native verification boundary and handoff

**Neither `node --test test/runner/merge-land.test.mjs` nor `node --test test/workflow/units-runner.test.mjs` was launched.** This is not a failing behavioral result and not a passing test. `FGOS_HOST_BIN` alone does not make an unrelated release addon belong to the source payload. The read-only preflight refuses `git-addon-not-shipped`.

`test/git/land-fixture.mjs` calls `ensureGitAddon()` at module load; Workflow calls `ensureScriptAddon()`, whose `git-addon-not-shipped` fallback calls the same staging door. Inspection of `scripts/git-addon.mjs` and `scripts/lib/git-addon-stage.mjs` shows cache-miss staging builds into `target/` and writes `.fgos/runtime/git-addon/f5c96e7ee8b7c094/`. Those writes are outside the exact list and the brief explicitly forbids `.fgos` mutation. No build, fallback, loader patch, fake cache, alternate parser, skip switch or copy-of-test workaround was attempted. Lead must provide matching already-staged prerequisites or authorize a separate staging action, then run both complete files singly with the required environment. Required prospective write paths are recorded in `needsWrites`; they were **not written**.

Read the execution plan §§1–2, W1 review notes, owner answers, W1 Git one-door receipt, main-import receipt, prior liveness/regression receipts and current suite attribution. No fgOS CLI/lifecycle verb, repository Git mutation, pair accounting, main lease, push, full suite, Cargo invocation, service or protected bookkeeping write occurred. Scope contains only the two tests, working registry and this receipt directory. No user-visible production change requires a changelog entry. Markdown preview remains Lead custody; no preview service was started inside this bounded worker.
