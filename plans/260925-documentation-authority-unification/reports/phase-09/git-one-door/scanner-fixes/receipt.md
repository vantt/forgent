# Git one-door scanner fixes receipt

## Outcome

Implementation and focused proof complete; **native-backed acceptance is blocked**, not claimed green. Input HEAD: `6215e614f97d520b6caa43060a6a72e1bb5c381f`.

Authority: the scanner-fixes brief, Git spec §§12/17, and HARDEN's review. The review's actual path on `origin/main` is `plans/reports/review-261026-1059-doc-g4-git-declarations.md`, not the board-relative path given in the brief. Read it with `git show origin/main:plans/reports/review-261026-1059-doc-g4-git-declarations.md`; the board log's matching `2026-10-26 11:06 HARDEN` line was also read.

## Repairs and owning proof

All additions are in `test/scripts/git-one-door-declarations.test.mjs`; no existing proof was removed or weakened.

1. **Fixed Git programs cannot masquerade as configured binaries.** Preserve the actual program value on internal JS scan records, rather than guessing its position at a derived wrapper call. Declaration validation follows binary parameters through existing `argumentValues`, named callers and value-flow callers. Any resolved literal Git program refuses `configured-binary`. An escaping binary parameter remains unknown even if another resolved caller supplies config; an unseen caller could supply Git. Escape retention requires proven configuration, not the declaration's label.
   - `configured declarations refuse fixed Git callback programs, including escaping write callers`: four cases, including HARDEN's `run.call(null, 'git', ['push', '--force', ...])`, plus Reflect.apply and array-slot escapes.
   - `configured declarations refuse escaping program parameters even with a known config caller`: two cases, unknown/config known caller plus an escaping Git caller.
2. **Tooling exemptions require observed literal read verbs.** Unknown verbs and writes such as `update-ref` now refuse classification. The existing verb parser permits trailing spreads only after a fixed verb whose read/write form does not depend on those operands; prefix spreads and spreads on config/reflog/symbolic-ref remain unknown. Strict identity hashing is unchanged, so existing pinned-reader declarations still match.
   - `tooling declarations reject literal writes and non-literal caller verbs`: ten cases, direct and pass-through shapes for update-ref, unresolved argv, a variable verb, a prefix spread and symbolic-ref with spread operands.
3. **Aliased exports refuse declarations.** The existing value-flow walker marks local export aliases/default exports as escapes, including flows through local aliases. Aliased exports cannot use the configured escape exception. Fixed-verb sites now inspect wrapper escape flow too; their hash remains unchanged.
   - `declared wrappers refuse aliased and default exports with undeclared reset callers`: four cases, `export { g as alias }` and `export { g as default }`, each with pass-through and fixed read argv, and an undeclared cross-file reset caller.

### Configuration provenance and declaration retirement

Enforcing escape provenance exposed the exact static gap named by the five configured declarations: `readSharedConfig(dir)[key]`. Extended the existing computed-property evaluator to handle a computed property of a call result, reusing `property()` and parsed-config provenance. No config-name/path allowlist, native workaround, new CLI flag, port or consumer edit was introduced.

`indexed returned configuration proves the program without trusting an escaping outer caller` owns the representative command-list reader shape, and checks that replacing parsed config with a literal Git default still reports a site.

The five configured declarations were removed because their own `retireWhen` condition is now met: the scanner proves parsed-config provenance. The five actual call sites are automatically classified as `(configuration file data)`; their locations and classes are retained in [product-subset.json](product-subset.json). The remaining **20 declaration entries are byte-for-byte equivalent as JSON values** to their input entries: one hook and 19 tooling reads. No rationale, identity or retirement condition on those entries was relaxed.

## Evidence and commands

Working directory: `/home/vantt/projects/forgentX-p9-w1-d2`. Every Node proof used `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons`; `TMPDIR` pointed to the invocation-owned `mktemp` directory `/tmp/fgos-work/scanner-fixes.2nVd27`. It is removed after evidence capture. No addon was loaded.

| Command / attempt | Exit | Result |
|---|---:|---|
| `node --test test/scripts/git-one-door-declarations.test.mjs`, initial new tests against unchanged scanner | 1 | Four new top-level groups red; loops had not yet been split into individually reported subtests. |
| Same focused command, first repair | 1 | 23/24; a proposed positive fixture incorrectly expected an escaping binary parameter to be proven safe. Corrected to require refusal. |
| Same focused command, expanded subtests | 1 | 43/44; the configuration fixture used a different direct-return shape. Replaced it with the actual command-list reader's local-section/property shape, not a production bypass. |
| Same focused command, subsequent repairs | 0 | 44/44, twice, before the alias cases were finalized. |
| `node --test /tmp/fgos-work/scanner-fixes.2nVd27/original-scanner.test.mjs`, final tests against input scanner | 1 | Existing 20 reported tests pass; all 21 distinct new cases are red (25 reported failures including four parent groups). [Red log](red.log). |
| `node --test test/scripts/git-one-door-declarations.test.mjs`, final source | 0 | **45/45**, no skips. [Green log](declarations.log). |
| `node --test test/git/one-door.test.mjs`, both attempts | 1 | 4 pass; 2 cannot start their repository-backed scans because the checkout addon is not shipped. Native-backed proof **not run**, for Lead. [Log](one-door.log). |
| Full-product `scan({root, files})` with read-only Git enumeration, final source | 1 | Cannot classify skill declarations: YAML calls the native door, which reports `git-addon-not-shipped`. [Stderr](full-api.stderr). No full-census result. |
| Product-subset `scan({root, files})`, skill paths explicitly omitted, both final attempts | 0 | Supplemental only: 999 recorded scan inputs, 0 sites, all 20 remaining declarations matched, all five retired config sites automatically classified. [Exact omissions/result](product-subset.json). **Not a substitute for the full gate.** |
| `node --check scripts/git-one-door-scan.mjs` | 0 | Syntax valid. |
| `node --check test/scripts/git-one-door-declarations.test.mjs` | 0 | Syntax valid. |
| Declaration-retirement/source-hash audit | 0 | [Audit](audit.json). |
| `git diff --check` | 0 | No whitespace errors. |

The original-scanner red run used `git show 6215e614f97d520b6caa43060a6a72e1bb5c381f:scripts/git-one-door-scan.mjs` in scratch. Only its relative imports were resolved to the real dependency files; the final test file was copied unchanged except for its scanner import pointing to that scratch module. No scanner logic was patched for this negative control.

### Reproduce the full API attempt without CLI auto-staging

```sh
git ls-files -co --exclude-standard -z |
  env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node --input-type=module -e '
import fs from "node:fs";
import path from "node:path";
import { scan, declaredProduct } from "./scripts/git-one-door-scan.mjs";
const root = process.cwd();
const product = fs.readFileSync(0, "utf8").split("\0").filter(Boolean).filter(declaredProduct(root));
const result = scan({ root, files: product.map(f => path.join(root, f)) });
console.log(JSON.stringify(result));
process.exitCode = result.sites.length ? 1 : 0;
'
```

The supplemental subset uses the same API and real bytes, with `product.filter(f => !/\/skills\//.test(f))`; the JSON lists every omitted path. This is an explicitly incomplete diagnostic, not a skipped production check made green.

`node scripts/git-one-door-scan.mjs --root . --json` was **not run**: its default Inspect path invokes `ensureScriptAddon`, which may build/stage outside the grant when no addon is shipped. `--write-census` would additionally write the out-of-scope census. The full API attempt establishes the native requirement without triggering that bootstrap. No environment switch, mock YAML/Inspect, copied addon, loader patch or test-only production branch was added to evade it.

Exploratory scans are not acceptance proofs: two initial scratch diagnostic attempts accidentally supplied all repository files rather than only the declared product and timed out at 120s/600s (the tool reported no process exit code). The corrected product scan encountered the native YAML dependency (exit 1). Node/scripts/hooks-only diagnostics exited 0 before the repair, then 1 for expected stale configured declarations, 1 for the newly enforced pinned-reader spread check, and 0 after the corresponding fixes. None loaded native code or wrote a census.

## Prior art, impact and constraints

`git log -G 'configured-binary|wrapper escapes|aliased'` and the diffs identify `db4b7de4d` as adding caller fingerprints and `1c64b1904` as retaining escapes while exempting the entire configured class. Earlier evaluator work is in `d4839a339` / `876ea737f`. Reused the lexer, property evaluator, caller/value-flow resolvers and owning declaration proof; the missing pieces were declaration-specific validation and call-result indexing.

Impact-analysis: **degraded under the explicit no-fgOS-CLI constraint**, not graph-confirmed. Source inspection: `scan` alone calls `declaredSiteId` and `applyDeclarations`; the shared JS evaluator/value-flow logic also feeds automatic wrapper classification. Affected boundaries are scanner output, census generation and downstream census verification. HARDEN's High-risk bypass was reported before editing. No runtime Git operation or native implementation changed.

No fgOS CLI, lifecycle verb, git write, staging/commit, native addon load, npm test, full-suite launcher, Cargo command, secret access or accounting operation was performed. No `.fgos/` runtime/build artifacts were created. Scratch was limited to the invocation-owned directory under `/tmp/fgos-work/`. No new config default, infrastructure dependency or installation behavior was introduced. MDView was not started because external preview/registry writes are outside this grant.

## Lead handoff and optional follow-ups

Mandatory acceptance remains blocked on a Lead-owned staged environment: run the full scanner CLI and native-backed `test/git/one-door.test.mjs`; do not infer a full-tree zero from the subset. The existing census was not regenerated or manually edited.

Out-of-scope integration writes, **not performed** (`needsWrites`):
- `packages/git/contracts/mutation-census.v1.json`: regenerate through the scanner after full verification, because declaration input bytes changed.
- `docs/platform/git/spec.md`: replace the now-stale open aliased-export gap statement with refusal behavior and record the tooling-read guard.
- `CHANGELOG.md`: add the Unreleased scanner-guard fix entry.

Optional review lows are deferred: rows 19/22's tree-OID readers require consumer changes outside this grant; rows 9–18's byte-pinned retirement condition needs a Lead/owner-selected phase/date, not an invented deadline. No further tooling or feature was added.
