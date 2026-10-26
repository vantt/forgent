# Dynamic-import scanner receipt

## Result

Code and owning regression proof are complete. **Acceptance is blocked**, not claimed green: the addon-free product subset exposes one new site from the real E3 inline imports; the full native-backed tree scan remains for Lead.

Input HEAD: `2053f072ed947377072d7487c7d79ba5a5d6b5f7`.

Read the complete brief and HARDEN re-review with `git show origin/main:plans/reports/review-261026-1404-doc-g4-scanner-rereview.md`, the reading map, and Git spec §12. History searches and the `2fa7fe921` diff show that the existing `computeValueFlow` importer loop already owns export escapes. Reused that mechanism and its `escape`/`aliasedExport` state; no parallel walker or runtime mechanism was added.

## Change and owning proof

- `scripts/git-one-door-scan.mjs`: dynamic imports naming an exported wrapper's module now record an export escape unless they use the namespace/destructured awaited binding forms the caller resolver follows.
- `test/scripts/git-one-door-declarations.test.mjs`: HARDEN's static `rev-parse` caller remains declarable, but adding either an awaited inline `push` caller or a `.then` callback with `branch -D` refuses the declaration. These are separate subtests and neither executes the fixture's Git commands.
- Extended the existing positive import proof to cover `const`, `let`, and `var` namespace and aliased destructured awaited bindings. The existing positive `const ns = await import(...)` remains.
- Both new negative cases failed against the unchanged input scanner with **Missing expected exception**. After the fix: **82/82 pass**, no skips. The red run's three reported failures are the two negative subtests plus their parent group; the other 79 reported tests passed.

No declarations, records, docs, `readConfig` trust, census, native implementation or runtime callers were edited.

## Real-tree diagnostic and required Lead action

The CLI's default path is `main → scan → listFiles → inspectRepo → ensureScriptAddon → loadNativeAddon`; on an unshipped checkout it can build/stage the addon. Skill classification also parses YAML through the native door. Therefore `node scripts/git-one-door-scan.mjs --root .` was **not run**: loading addons and bootstrap writes outside the grant are expressly forbidden. Lead must run it in the staged environment, without `--write-census`, after resolving the finding below. No full-tree zero is claimed.

An explicitly incomplete diagnostic enumerated real tracked/untracked non-ignored paths with read-only Git, applied the existing product predicate, and omitted skill paths (listed in `product-subset.json`). It ran both the input scanner and final scanner over the same remaining real bytes, using the existing `scan({root, files})` API. Only the baseline module's relative import URLs were adapted in scratch; no evaluator, loader or production behavior was mocked.

- 1,112 recorded non-skill scan inputs.
- Input scanner: **0 sites**.
- Final scanner: **1 site**, `src/git/native.mjs:11`, family `unresolved-binary`, site ID `loadNativeAddon:3f09be41735e41645155e76a11a308aaad340a9ba3b0ec0d8a8a0b9b48ae5ff4`.
- Escapes: inline dynamic imports in `scripts/git/e3-bench.mjs:703`, `:716`, `:815`.
- All **20 existing declarations still match** (19 tooling and one hook). **No existing declaration** names `src/git/native.mjs` or E3. There is consequently no existing declaration to refresh or one newly refused declaration to identify.
- All nine subset class counts are identical before/after: configured-binary 95, hook-read-context 26, declared-tooling-exemption 19, uncalled-wrapper 10, rust-test 139, argv-runner 14, production-sandbox-probe 4, sandbox-door 2, git-driver 1. The full-scan standalone-skill-script class (review baseline: 4) is omitted, not verified.

A declaration-only exemption cannot safely clear the new escape: the declaration guard must refuse unresolved export callers. **Recommended out-of-scope repair:** change the three E3 expressions to an already followed `const { loadNativeAddon } = await import('../../src/git/native.mjs')` binding and then call the binding. Lead should verify that repair and rerun the full gate; do not add a permissive declaration or weaken this scanner fix. `needsWrites`: `scripts/git/e3-bench.mjs`.

## Commands and exits

All commands ran in `/home/vantt/projects/forgentX-p9-w1-d2`. Node execution proofs used `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons`. Tests set `TMPDIR` to an invocation-owned `mktemp -d /tmp/fgos-work/scanner-dynamic-import.XXXXXX` directory and removed it afterward. `receipt.json` records the commands and diagnostic JavaScript.

| # | Command / command group | Exit | Evidence/result |
|---|---|---:|---|
| 1 | Atomic assignment acknowledgement (`printf` to `.tmp`, then `mv`) | 0 | Required runner acknowledgement only. |
| 2 | `git status --short`; `git rev-parse HEAD`; `git show origin/main:plans/reports/review-261026-1404-doc-g4-scanner-rereview.md`; scanner history and `-S ImportExpression` | 0 | Clean input, review and prior art. |
| 3 | Scanner history `-G 'importersOf|computeValueFlow|await.*import'`; `git show d0dcc24ec --stat`; `git show 2fa7fe921 -- scripts/git-one-door-scan.mjs` | 0 | Reused existing escape machinery. |
| 4 | `node --test test/scripts/git-one-door-declarations.test.mjs`, unchanged scanner | 1 | Expected negative control: `red.log`. |
| 5 | Same test command, final scanner | 0 | `declarations.log`: 82 pass, 0 fail. |
| 6 | `git diff --check`; `git diff --stat`; targeted source diff | 0 | Two intended code files. |
| 7 | Initial supplemental before/after API scan attempt | 1 | Read-only Git enumeration exceeded Node's default stdout buffer (`spawnSync git ENOBUFS`); no scan result. Scratch removed. |
| 8 | Corrected supplemental API scan, enumeration buffer 32 MiB | 1 | `product-subset.json`; empty `product-subset.stderr`. Expected newly exposed E3 site; counts unchanged. **Not acceptance.** |
| 9 | Both `node --check` commands; diagnostic assertions; immutable-file diff; `git diff --check`; `git status --short` | 0 | Confirmed exact three escapes, same counts, all 20 declarations; declarations/native/E3 unchanged. |
| 10 | Final receipt parse, source hash and write-scope validation; `git diff --check` | 0 | Receipt/evidence integrity and allowed paths only. |
| — | `node scripts/git-one-door-scan.mjs --root .` | not run | Requires native Inspect/bootstrap; delegated to Lead under the brief's explicit exception. |

The first diagnostic accidentally included a redundant outer `git ls-files` pipeline while its heredoc supplied Node stdin; the actual inner enumeration failed at the default buffer ceiling. The corrected invocation removed the redundant pipeline and increased only the diagnostic enumeration buffer. Neither attempt altered scanner behavior to make checks pass.

## Constraints and remaining proof

Impact-analysis: **degraded/unconfirmed**, not inactive. The brief forbids the fgOS capability-query CLI and this session exposes no GitNexus MCP tools. Source inspection shows `valueFlowCalls` feeds wrapper resolution and declaration identities; downstream boundaries are scanner/census generation and verification, not runtime Git operations. The new real E3 site is reported rather than hidden.

No fgOS CLI/lifecycle verb, git write/staging/commit, addon load, full-suite launcher, npm test, Cargo, secret access or workspace `.fgos/` write was performed. The runner-required acknowledgement/results outside the workspace are the explicit contract exception. Scratch directories were removed after each invocation. No new config, dependency or infrastructure assumption was introduced. Documentation preview was not started because it could write external registry state outside this grant.

Lead owns the E3 caller repair and native-backed full-tree acceptance. HARDEN must re-review before Land. Existing counts from the review are a baseline, not a substitute for that acceptance proof.

## Lead completion (2026-10-26)

**E3 repair.** The three inline imports in `scripts/git/e3-bench.mjs` (`:703`, `:716`, `:815`) now bind the module first: `const { loadNativeAddon } = await import(...)`, then `loadNativeAddon(loader)`. This is the form the caller resolver follows. No declaration was added and no check was weakened.

**Full-tree scan.** `node scripts/git-one-door-scan.mjs --root .` reports 0 undeclared sites. Class counts are identical to the scan before this change:

| Class | Count |
|---|---:|
| standalone-skill-script | 4 |
| hook-read-context | 26 |
| configured-binary | 95 |
| rust-test | 139 |
| argv-runner | 14 |
| production-sandbox-probe | 4 |
| uncalled-wrapper | 10 |
| git-driver | 1 |
| declared-tooling-exemption | 19 |
| sandbox-door | 2 |

**Tests.** A native run of `test/scripts/git-one-door-declarations.test.mjs` passes 82/0. Against the previous scanner it gives 79/3; the 3 failures are the new dynamic-import cases.

**Docs and census.**
- Spec §17 states the dynamic-import rule.
- CHANGELOG updated.
- Census regenerated.
