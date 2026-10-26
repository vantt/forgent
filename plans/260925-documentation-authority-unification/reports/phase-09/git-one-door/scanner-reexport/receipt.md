# Git one-door re-export refusal receipt

## Result

The requested code slice is complete. `computeValueFlow` now refuses declarations whose exported wrapper reaches `export * from`, `export * as ns from`, or an exported namespace holder such as `import * as r ...; export const ns = r`. It reuses the existing importer cache, bounded value-flow queue, property paths, escape list and `aliasedExport` guard; no parallel walker or declaration exception was added. Named re-exports feed that same queue so an intermediate forwarding module cannot conceal these forms. Static and awaited dynamic namespace imports retain the wrapper's property path. Import/export syntax is blanked before scanning value uses.

Ordinary namespace imports remain declarable when their observed callers are reads. Export escapes also set the existing alias flag, so configured-program provenance cannot override their refusal. No census, declaration input, runtime Git code, docs, records or fixture file changed.

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
