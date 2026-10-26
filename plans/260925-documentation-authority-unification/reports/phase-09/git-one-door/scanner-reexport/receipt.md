# Git one-door re-export refusal receipt

## Rework: configured adapter caller regression

**Code and owning proofs repaired; full-tree acceptance is blocked by the brief's no-addon constraint.** The earlier assertion that the re-export repair leaves the real census unchanged is withdrawn. It was not established by the declaration-only tests. The regression reported at `9fd202707` is real: `2fa7fe921` incorrectly treats *every* exported value with a nonempty property path as a namespace holder. That includes `cliSpawnAdapter.execute` and the registries receiving the adapter by value, so `computeValueFlow` records false export escapes and stops following the registered caller. A named barrel need not export `cliSpawnAdapter` to be present in this path.

The repair keeps namespace-import provenance in the **existing** bounded value-flow queue, forwards it through the existing aliases/parameters/holders, and clears it when the held function is selected. Only a path introduced by an actual namespace import triggers the namespace-holder refusal. Ordinary function properties and registry slots continue through imports and named re-exports. Namespace imports prepend the exported name to the existing property path rather than discarding that path. No parallel resolver, special executor name, declaration exception, configuration switch or native bypass was added.

The new owning test, **a configured function adapter stays classified beside an unrelated named re-export**, registers a function by value, gives it an `.execute` self-assignment, calls it with parsed configuration through the registry, and adds a named re-export list that excludes the function. It requires no undeclared sites and the same configured class count before/after adding the barrel. No existing proof was retired or weakened.

### Rework proofs

Working directory `/home/vantt/projects/forgentX-p9-w1-d2`, input HEAD `7bd705065`. All Node commands used `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons`; fixture/snapshot scratch lived in invocation-owned `mkdtemp` directories under `/tmp/fgos-work/` and was removed.

| Proof | Exit | Result |
|---|---:|---|
| `TMPDIR=<invocation scratch> env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node --test test/scripts/git-one-door-declarations.test.mjs` | 0 | **62 pass, 0 fail, 0 skipped**; [rework-declarations.log](rework-declarations.log). |
| `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node plans/260925-documentation-authority-unification/reports/phase-09/git-one-door/scanner-reexport/rework-controls.mjs` | 0 | [rework-controls.log](rework-controls.log): all **12** re-export negatives fail against `129cbb127` with missing expected exceptions; the adapter regression fails against `2fa7fe921` with the false namespace-holder escape and passes against `fbcb8e016`. The harness checks the expected child exits/counts; it changes only snapshot imports, not scanner logic. |
| Full declared-product scan via unmodified `scan({root, files})`, with read-only `git ls-files` supplying tracked/untracked non-ignored paths | 1 | **Blocked**, [rework-full-scan.log](rework-full-scan.log): `standaloneSkillOf` → `readStandaloneDeclaration` → `parseYaml` → native door throws `git-addon-not-shipped`. No classes or empty-census result are claimed from this attempt. |
| `node --check` for scanner, owning test and rework control; `git diff --check`; tracked/untracked write-scope audit | 0 | Syntax/whitespace valid; every changed/new file is inside the exact writable list. |

**Why the exact CLI scan was not run:** contrary to the rework brief's statement that it needs no addon, `main()` imports `scripts/lib/git-ports.mjs`, whose `inspectRepo()` calls `ensureScriptAddon()` and may stage/build an addon before opening Inspect. Separately, even supplying the exact product files to the public scan API reaches native YAML while checking standalone skill declarations. Running that staging route or loading an addon would violate this assignment. No fallback parser, omitted source set, mock, production skip or census write was used to hide the gap. The Lead must authorize/run native-backed full-tree acceptance, or supply a revised contract; this is a permission/dependency blocker, not a request to edit another file.

### Census correction and class comparison limit

Fresh per-class comparison against `fbcb8e016` **has not completed** under the no-addon contract. The rework brief reports **89 configured-binary** and one undeclared site after the regression. Reading the *stored* census at `fbcb8e016` and HEAD gives the identical table below; this is historical artifact data, **not** a fresh scan, and cannot certify the rework:

| Class | Stored at `fbcb8e016` | Stored at input HEAD | Fresh rework scan |
|---|---:|---:|---|
| configured-binary | 92 | 92 | blocked |
| standalone-skill-script | 3 | 3 | blocked |
| hook-read-context | 23 | 23 | blocked |
| rust-test | 112 | 112 | blocked |
| argv-runner | 13 | 13 | blocked |
| production-sandbox-probe | 4 | 4 | blocked |
| uncalled-wrapper | 20 | 20 | blocked |
| git-driver | 1 | 1 | blocked |
| declared-tooling-exemption | 19 | 19 | blocked |
| sandbox-door | 2 | 2 | blocked |

Both stored artifacts list zero sites, illustrating why the unchanged artifact was not proof of unchanged behavior. A logging-only scratch diagnostic of wrapper resolution (the full classifier still ran and failed at native YAML) found no `transport.mjs` raw site before the regression or after this repair, and exactly the reported `cliSpawnAdapter` raw site at `2fa7fe921`. Its pre-final configured records were 189/183/189 respectively, before deduplication and final classification: diagnostic evidence only, **not class census counts**. Product source at input HEAD differs from `fbcb8e016` only in the scanner; read-only Git comparison confirmed that fact.

**Rework limitations/deviations:** impact-analysis remains degraded (no live graph tool). An initial capability CLI query was mistakenly launched alongside reading the brief and failed with exit 127 because the worktree has no installation; no further fgOS CLI call was made. An initial full-tree comparison helper hit the default child stdout buffer limit, then the native YAML blocker after increasing the buffer; the scratch helper was removed, not shipped as a purported proof. No Git writes, lifecycle calls, native addon loads/builds, `npm test`, suite-launcher edits, docs/record edits, pair accounting or census writes were performed. No extra writable paths or install/config defaults are needed. Required outbox files are the execution-contract exception. Preview was not launched because its external writes are outside the grant.

## Historical receipt (prior round; result claims superseded above)

The earlier round reported the requested code slice complete. `computeValueFlow` now refuses declarations whose exported wrapper reaches `export * from`, `export * as ns from`, or an exported namespace holder such as `import * as r ...; export const ns = r`. It reuses the existing importer cache, bounded value-flow queue, property paths, escape list and `aliasedExport` guard; no parallel walker or declaration exception was added. Named re-exports feed that same queue so an intermediate forwarding module cannot conceal these forms. Static and awaited dynamic namespace imports retain the wrapper's property path. Import/export syntax is blanked before scanning value uses.

Ordinary namespace imports remain declarable when their observed callers are reads. Export escapes also set the existing alias flag, so configured-program provenance cannot override their refusal. No census file, declaration input, runtime Git code, docs, records or fixture file changed in that round; this did not establish that fresh scan results were unchanged.

Authority read: `w43-scanner-reexport-brief.md`, `reviews/w42-g4-fixes-review.{md,json}` (S4), `git-one-door/scanner-fixes/receipt.md`, `docs/specs/reading-map.md`, and Git spec §§12/17 plus its decision history. Prior-art inspection identifies `d0dcc24ec` as introducing export-alias refusal; this change extends it rather than repairing `findCallers` with another traversal.

## Owning proof

Extended only `test/scripts/git-one-door-declarations.test.mjs`:

- **declared wrappers refuse star and namespace re-exports with undeclared reset callers**: three shapes × pass-through/fixed read argv × direct/named-forwarding module = **12 negative cases**. Each preserves a valid baseline declaration, adds a hidden `reset --hard` caller, and requires `invalid Git declaration: wrapper escapes`.
- **a namespace import without a re-export remains declarable**: two positive cases, static and awaited dynamic imports. They protect against accidentally refusing namespace imports wholesale.

Existing tests were not removed or weakened. The historical scanner at **`129cbb127349909fe171da418215e383d8ea06c7`** fails all 12 new negative cases with **Missing expected exception**; the other 48 reported tests pass. Node reports 13 failures including the negative group's parent. Final source: **61 pass, 0 fail, 0 skipped**. See [red.log](red.log), [declarations.log](declarations.log), and [audit.json](audit.json).

The persisted [negative-control.mjs](negative-control.mjs) reproduces the historical run from the repository root. It copies historical source to an invocation-owned `/tmp/fgos-work/` directory, changes only relative module specifiers to their real dependencies, copies the final tests changing only their scanner import, and removes its scratch in `finally`. No scanner logic, loader, native dependency or production check is mocked or skipped.

## Commands and exits

Working directory: `/home/vantt/projects/forgentX-p9-w1-d2`; input HEAD: `4c81209f968a3d4c1c4324dd0c858d8fe47688e9`. All Node proof processes used `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons`. Test fixtures used `TMPDIR=/tmp/fgos-work/scanner-reexport.BYfEzv` or the negative-control helper's own scratch. Both scratch areas were removed.

| Command / operation | Exit | Result |
|---|---:|---|
| Required acknowledgement: Node `fs.writeFileSync(ack + '.tmp', ...)`, then `fs.renameSync(...)` | 0 | Written before task work, outside workspace as required by execution contract. |
| `git status --short && fgos tool query --capability impact-analysis --status present` | 127 | Initial tree clean; query refused because no installation exists above this worktree. **Deviation:** this was launched in parallel with reading the brief, before its no-fgOS-CLI restriction was known. No further fgOS CLI call was made. |
| `git log -8 --oneline -- scripts/git-one-door-scan.mjs` | 0 | Prior art. |
| `git log --oneline -G 'exportAll\|ExportAll\|re-export\|findCallers\|valueEscapes' -- scripts/git-one-door-scan.mjs` | 0 | No matching history output. |
| `git show --stat 129cbb127` | 0 | Verified negative-control revision. |
| `git log -4 -p -G 'aliasedExport\|moduleImports' -- scripts/git-one-door-scan.mjs` | 0 | Read the existing alias/escape repair. |
| `mkdir -p /tmp/fgos-work && mktemp -d /tmp/fgos-work/scanner-reexport.XXXXXX` | 0 | Created invocation scratch `scanner-reexport.BYfEzv`. |
| Initial inline Node relocation (`git show 129cbb127:scripts/git-one-door-scan.mjs`, import-only relocation, copy tests) | 0 | Same operation now preserved in `negative-control.mjs`. |
| `TMPDIR=/tmp/fgos-work/scanner-reexport.BYfEzv env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node --test /tmp/fgos-work/scanner-reexport.BYfEzv/original-scanner.test.mjs` | 1 | Initial direct-only negative control: all six new negative cases red, 48 pass / 7 fail including parent. Final `red.log` supersedes this run. |
| `TMPDIR=/tmp/fgos-work/scanner-reexport.BYfEzv env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node --test test/scripts/git-one-door-declarations.test.mjs` (initial repair) | 0 | 55/55 before adding named-forwarding coverage. |
| `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node --check scripts/git-one-door-scan.mjs` | 0 | Both initial and final syntax checks. |
| `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node --check test/scripts/git-one-door-declarations.test.mjs` | 0 | Both initial and final syntax checks. |
| `git diff --check && git diff --stat && git diff -- scripts/git-one-door-scan.mjs test/scripts/git-one-door-declarations.test.mjs` | 0 | Initial patch inspection. |
| `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node plans/260925-documentation-authority-unification/reports/phase-09/git-one-door/scanner-reexport/negative-control.mjs` | 1 (expected) | Final historical proof: 48 pass / 13 fail, all 12 new negative cases red. Output: `red.log`. |
| `TMPDIR=/tmp/fgos-work/scanner-reexport.BYfEzv env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node --test test/scripts/git-one-door-declarations.test.mjs` (final) | 0 | **61/61**. Output: `declarations.log`. |
| `env -u CLAUDE_CODE_SESSION_ID NODE_OPTIONS=--no-addons node --check plans/260925-documentation-authority-unification/reports/phase-09/git-one-door/scanner-reexport/negative-control.mjs` | 0 | Reproducer syntax valid. |
| `git diff --check` | 0 | Final source whitespace check. |
| `git status --short && git diff --numstat && git rev-parse HEAD` | 0 | Only two allowed source files plus this allowed report directory changed. |
| Inline no-addons Node evidence audit and scratch cleanup | 0 | Asserted final counts, all 12 missing exceptions, exact tracked-change scope; hashed historical/final source and tests, removed invocation scratch. Output: `audit.json`. |
| Final no-addons scanner syntax, receipt/audit JSON and source-hash validation, tracked/untracked write-scope audit, `git diff --check` | 0 | Final artifacts parse; source hashes still match proved bytes; every changed/untracked file is in the exact writable grant. |

The two mandatory acceptance commands both exit 0. The negative control deliberately exits 1 and is not an acceptance failure. No full census or native-backed tests were attempted: the Lead owns those checks.

## Optional lows and handoff

- **Trailing read-verb spreads: unchanged.** Prior repair deliberately accepts a trailing spread after a fixed read verb. Such operands cannot replace the verb or move a ref, but `diff`/`log`/`show` can write a file via `--output`; this residual filesystem-write risk is acknowledged, not claimed closed. Keep this slice focused on S4 rather than changing existing spread acceptance and its consumers.
- **Unresolved configured-binary with no escapes: unchanged.** It is existing behavior explicitly owned by `an explicitly declared unresolved consumer command uses the existing configured-binary class`; tightening it would change that covered contract. The brief expressly permits leaving it, and no configured-binary declarations remain in the real declaration file.
- **Impact-analysis: degraded, not graph-confirmed.** The initial capability query failed and no graph tool is available in this session. Source review locates the blast radius in `computeValueFlow` → `valueFlowCalls` → wrapper resolution/declaration validation and census generation. Risk is scanner classification (the reviewed bypass was medium), not runtime repository mutation.
- Lead: regenerate the real census, run native-backed checks, and update the spec as delegated by the brief. No whole-tree or native acceptance is claimed here. This code slice requires no additional writable path.

No git write, staging/commit, lifecycle verb, `npm test`, suite launcher, native-addon proof load, secret access or `.fgos/` workspace mutation was performed. The required outbox acknowledgement/result handoff is the execution-contract exception. No new configuration or installation dependency was introduced. Markdown preview was not started because external preview/registry writes are outside this exact grant.
