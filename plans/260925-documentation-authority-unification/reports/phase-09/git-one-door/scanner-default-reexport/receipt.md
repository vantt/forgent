# Default re-export scanner receipt

**Code repaired; acceptance blocked on the no-addon constraint.** Input HEAD: `f142752fa9374b3c751df89cf2ca4dd59f3eba70`. Working directory: `/home/vantt/projects/forgentX-p9-w1-d2`.

## Change and owning proof

`scripts/git-one-door-scan.mjs` now refuses a matching named re-export whose alias is `default`: `computeValueFlow` sets the existing `aliasedExport` flag and records `escape(other, m.index, 'exported as default')`, rather than following the unresolvable default binding. Other named re-exports still use the existing queue. This reuses the export-escape mechanism introduced in `d0dcc24ec` and extended in `2fa7fe921`; it preserves `cb7342614`'s configured-adapter/namespace distinction. No second resolver, exception, feature, config, or dependency was added.

Extended the existing owning proofs in `test/scripts/git-one-door-declarations.test.mjs`, without removing assertions or tests:

- Re-export matrix: default barrel plus default-import `reset --hard` caller, with pass-through/fixed argv and direct/named-forwarded modules (four new cases). The local-export tests cannot observe this barrel boundary.
- Configured adapter fixture: retains the unrelated-barrel positive assertions, then requires the hidden default-import Git caller to surface one undeclared transport site with an `exported as default` escape. Even an explicit `configured-binary` declaration must refuse it. This protects the configuration-provenance bypass without duplicating the fixture.

**Green:** 66 tests passed, zero failed/skipped ([declarations.log](declarations.log)). **Red:** the final tests against scanner `f4324b27d` fail all four new wrapper cases with missing expected exceptions and the configured-adapter case with its missing undeclared site; the twelve previous re-export cases pass. Historical child exit 1 is expected; the control validates it and exits 0 ([negative-control.mjs](negative-control.mjs), [red.log](red.log)). Only import specifiers move in the historical snapshot, not scanner logic or assertions.

## Full-tree blocker — no parity claim

The exact required `node scripts/git-one-door-scan.mjs --root .` was **not run**: its `main()` imports `scripts/lib/git-ports.mjs`; `inspectRepo()` calls `ensureScriptAddon()`, which can stage/build an addon outside this grant before opening Inspect. The brief forbids native addons and out-of-scope writes.

A safe diagnostic instead supplies the same sorted tracked/untracked non-ignored paths from read-only `git ls-files` to the unmodified public `scan({root, files})` API, using each scanner's own `declaredProduct` filter. **Both `f4324b27d` and the repaired scanner fail** at `standaloneSkillOf → readStandaloneDeclaration → parseYaml → nativeDoor`, with `git-addon-unavailable: addon not shipped on this channel` ([full-tree-check.mjs](full-tree-check.mjs), [full-tree.log](full-tree.log)). No parser, classification, native check, or source file was skipped or mocked. `NODE_OPTIONS=--no-addons` remained set. No addon was staged or loaded.

Consequently fresh undeclared counts and per-class parity are **unverified**, not zero. No stored census is offered as a fresh proof, and no census was written. Lead must run the required CLI scan with authorized native support, comparing its counts with `f4324b27d`; this does not require an additional source write grant.

## Commands and exits

All commands ran in the working directory above. Protocol acknowledgement/final outbox publication are separate from these workspace commands. Every Node command used `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons`. Scratch consisted only of owned temporary directories under `/tmp/fgos-work/`, removed after use. Full shell strings are in [receipt.json](receipt.json).

| Command | Exit | Result |
|---|---:|---|
| `git status --short`; scanner history and `git log -S'exported as default'` | 0 | Clean input; existing escape mechanism identified. |
| `git show --stat 2fa7fe921`; `git show cb7342614`; `git rev-parse HEAD f4324b27d`; scanner `git log -G'default\|re.export'` | 0 | Prior art and pinned comparison inspected. |
| `node …/negative-control.mjs` (with no-addons environment above) | 0 | Expected historical child exit **1**; 12 pass / 6 fail including the failing matrix parent. |
| `TMPDIR=<mktemp directory> node --test test/scripts/git-one-door-declarations.test.mjs` (same environment) | 0 | **66 pass / 0 fail**; fixture directory removed. |
| `git diff --check`; `git diff --stat`; source/test diff; first 20 lines of historical stored census | 0 | Scope/whitespace inspected; stored census not used as fresh proof. |
| `node …/full-tree-check.mjs` (same environment) | **1** | Both fresh scan attempts blocked by native YAML. |
| `node --check` for scanner, owning test, negative control and full-tree diagnostic; `git diff --check` | 0 | Syntax and whitespace valid. |
| `sha256sum` for scanner/test; `git status --short`; `git diff --numstat`; scratch-directory check | 0 | Only granted paths changed; no owned scratch left. |
| Inline no-addons Node receipt/hash/log/write-scope/scratch audit; `git diff --check` | 0 | Receipt parses, hashes match proved source, expected logs present, every changed path granted, owned scratch removed. |

Source SHA-256: scanner `a29950f549b4a1d4c63d3df787af6c67033f4495ad9800cd9c03bc69ffcadefc`; test `1fda050755c9ace77ff0a179edb18720ec4d0829e5ddabe3ff7eb93f4c513e19`.

## Follow-up and limits

- **W45-7, low, not fixed:** `import('./m.mjs').then(m => m.g(...))` and reassigned awaited imports can hide callers. Track separately; this patch deliberately does not expand into dynamic-import resolution.
- Authority read: complete assigned brief and `reviews/w45-g4-rework-review.{md,json}`, reading map, Git spec declaration/acceptance sections, previous re-export receipt and control. The review refers to §17; the declaration text currently appears in the spec's one-door section.
- **impact-analysis: degraded** — no live graph tool; fgOS CLI capability query forbidden by this brief. Read-only grep and Git history identify `valueFlowCalls`, wrapper resolution and declaration matching as consumers. No Git runtime operation changes. No commit was made, so no pre-commit graph claim is made.
- No fgOS CLI, lifecycle verbs, Git writes, native addon load/build, `npm test`, suite-launcher changes, docs/records changes, pair accounting, secrets access, or census writes. Receipts use the exact assigned paths; no external document preview was launched. No extra writable paths requested.

## Lead completion (2026-10-26)

The Lead ran the full-tree parity check that the Doer could not run. On top of plan HEAD `c5750a967`, `node scripts/git-one-door-scan.mjs --root .` reports 0 undeclared sites, and its class counts are byte-identical before and after this change: configured-binary 95, hook-read-context 26, declared-tooling-exemption 19, uncalled-wrapper 10, rust-test 139, argv-runner 14, standalone-skill-script 4, production-sandbox-probe 4, sandbox-door 2 and git-driver 1. A native run of `test/scripts/git-one-door-declarations.test.mjs` passes 66/0. The census is regenerated.

## Lead fix after w47 (2026-10-26)

**Finding (W47-1).** An export name written as a string literal, such as `export { g as "default" } from` or `as 'x-y'`, still hid callers, because the scanner compared the alias with its quotes still on.

**Fix.** The scanner now strips the quotes before comparing.
- An unquoted `default` takes the existing "exported as default" escape.
- Any other quoted name that is not a plain identifier escapes as "exported under a string name".

**Proof.**
- Two new shapes are in the re-export matrix, giving 8 new cases.
- Against the previous scanner, 65 tests pass and 9 fail: the 8 new cases plus their parent.
- Against the fixed scanner, 74/0 pass.
- The full-tree scan reports 0 undeclared sites, with class counts identical to the previous run.
- Spec §17 names the string spelling.
- The census is regenerated.
