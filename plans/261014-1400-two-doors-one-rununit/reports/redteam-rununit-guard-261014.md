# Red-team: dispatch takes generic inputs + source guards (feat/rununit-guard)

Date: 2026-10-14. Target: `git diff main...feat/rununit-guard` (HEAD 674468fdd).
I changed no files in the worktree. The probes live under `/tmp/claude-1000/redteam-guard/`:

- `guards.mjs` is a byte-for-byte copy of `extractImports`, the run-door guards, `findWorkLayerReach`, `findWorkShapedInputs` and `findDynamicLoads` from `test/architecture.test.mjs` (sliced with sed). It imports the real `test/helpers/js-source-lexer.mjs`.
- `attack1.mjs`, `attack1b.mjs` and `attack2.mjs` attack the source guards. `attack3.mjs` attacks rigor and the runtime refusal. `attack6.mjs` attacks the harness seam.
- `oldrepo/` and `cli-repo/` are the fixture repos used for the CLI runs.

Every HIT below was checked against real JS: `realjs.mjs` and `q/m.mjs` run the evasion syntax under Node 24 and it works.

## Summary

| # | Attack | Result |
|---|---|---|
| 1a | Work-shaped guard: computed, escaped, multi-line and reflective keys | **HIT** (several) |
| 1b | Lexer: a regex literal right after a block `}` hides code from every lexSource-based guard | **HIT** |
| 1c | Work-layer reach and state-import guard: import syntax `extractImports` cannot parse; a relay into `src/state/**` | **HIT** |
| 1d | Dynamic-load guard: `Function(...)` without `new`, `.constructor(...)`, `node:vm`, escaped `eval` | **HIT** |
| 1e | Run-door call-site guard: `d['executeAssignment']`, an escaped member, the `}`-regex trick | **HIT** |
| 1f | Guarded set lists `*.mjs` only, so `.js` and `.cjs` files (ESM under `"type":"module"`) are not scanned | **HIT** |
| 2 | Old on-disk data (workId/planContentHash/work/provenance.work) through `dispatch inspect` and `reconcile` | MISS (nested layout readable; the flat layout is unsupported, but it was before this change too) |
| 3 | Rigor lower than the capability floor; risk:heavy dropped on the decide hint and runUnit paths | MISS |
| 4 | `decide --work` for an item with its own agentType | MISS (same as main) |
| 5 | Tests from phases 00 and 10 | MISS: 172/172 green; touched suites 465/465 green |
| 6 | Production callers still passing a Work item; harness seam; CLI `decide --work` | MISS for breakage. Concerns are listed below |

Real source scan: none of the evasions in 1a to 1f occur in the current guarded files. I grepped for escapes, `Reflect.get`, `.constructor(`, `Function(`, `node:vm`, bracket door calls and non-`.mjs` files. These HITs are guard gaps, not existing violations.

---

## 1a. `findWorkShapedInputs` evasions (HIT)

Each line below returns `[]` from the verbatim guard and is valid JS that reads `opts.work`:

```js
const w = opts['wo'+'rk'];                 // string concat key
const w = opts[`wo${'rk'}`];               // template concat key
const w = Reflect.get(opts, 'work');       // reflection with a plain literal
const { ['wo'+'rk']: w } = opts;           // computed destructuring
const w = opts.work;                  // unicode escape in an identifier (runs: o2.work === 7)
const w = opts.\u{77}ork;
const w = opts['work'];               // escape inside a quoted key
const w = opts['\x77ork'];
with (opts) { use(work); }            // `with` + escape (plain `with ... work` IS caught)
const w = opts[('work')];                  // parenthesised key
const w = opts[0, 'work'];                 // comma expression
const w = opts[\n  'work'\n];              // multi-line computed key (quoted-key regex runs per line)
const { 'work'\n : w } = opts;             // multi-line quoted property key
const w = Object.getOwnPropertyDescriptor(opts, 'work').value;
for (const [k, v] of Object.entries(opts)) if (k === 'work') use(v);
```

These are caught as intended: `opts['work']`, `opts.work`, `opts?.work`, `opts?.['work']`, `assignment.provenance.work`, `{ work: w = {} }`, `{ 'work': w = {} }`, `{ ['work']: w }`, nested templates, a template with `'}'` in an interpolation, a regex containing a quote after `=`/`(`/`++`, class and private fields, and labels.

The cheapest red tests to add to the guard's `caught` list are `Reflect.get(opts, 'work')`, `opts[\n'work'\n]`, `opts.work` and `opts['work']`. Two fixes cover most of them:
1. Decode `\uXXXX`, `\u{...}` and `\xXX` escapes in `code` and `shape` before matching.
2. Match any quoted `'work'|'workItem'|'docsRef'` token as a whole string literal in code, on the full `code` rather than per line. That is the same rule the domain-literal guard already uses. An allowlist would cover the intended `{ type: 'work' }` selector.

## 1b. Lexer: a regex after a block-closing `}` hides code (HIT, affects every lexSource guard)

`lexSource` treats `}` as a value terminator, so it reads a following `/` as division. After a block, function or class body, `/` starts a regex literal. The lexer then reads a quote inside the regex as the start of a string and blanks everything up to the matching quote. That includes real code, and with a backtick it can span many lines.

Real JS that runs: `/tmp/claude-1000/redteam-guard/realjs.mjs` prints `w = {"id":"W1"}`.

```js
if (x) {}
/'/.test(y); const w = opts.work; //'
```

Reproducers:

```js
findWorkShapedInputs('x.mjs', "if (x) {}\n/'/.test(y); const w = opts.work; //'")             // []
findWorkShapedInputs('x.mjs', "function f() {}\n/`/.test(y);\nconst w = opts.work;\nconst x = opts.workItem;\n//`") // []
findWorkShapedInputs('x.mjs', "class A {}\n/'/.test(y); const w = opts.work; //'")           // []
usesSymbol("if (x) {}\n/'/.test(y); executeAssignment(a); //'", 'executeAssignment')        // false
usesSymbol("function f() {}\n/`/.test(y); executeAssignment(a); //`", 'executeAssignment')  // false
```

`findDynamicLoads` uses the same `shape`, so `import(spec)` hides the same way. Note that `f(x) /'/; ...` is NOT a hit: after a call's `)` the slash really is division, so the lexer is right there. A fix needs a stack that records whether each `{` opened a block or an object/template expression. Push "block" when the `{` follows `)` of a control head, `=>`, `else`, `do`, `try`, `finally`, a function or class head, or appears at statement start. On a block `}`, set `last` so the next `/` opens a regex.

## 1c. Work-layer reach and state-import guard: import syntax `extractImports` cannot parse (HIT)

The patterns in `extractImports` require whitespace after `import` and after `from`, and they stop at the first `;`, even one inside a comment. Every case below returns `[]` from `findWorkLayerReach`. The `src/state` direct-import guard uses the same extractor, so it is blind to the same syntax.

```js
import{spawnWorker}from'../work-dispatch.mjs';           // no whitespace (valid JS; verified)
export*from'../work-dispatch.mjs';
import { x } /* ; */ from '../work-dispatch.mjs';        // ';' inside a comment ends [^;]*?
import { a, // ;\n b } from '../work-dispatch.mjs';
import { x } from '../work-dispatch.mjs?v=1';            // query string: Node loads it; WORK_LAYER_MODULES anchors on .mjs$
import { x } from '/abs/repo/src/runner/work-dispatch.mjs'; // absolute path: dropped as non-relative
await import('file:///repo/src/runner/work-dispatch.mjs');  // literal file: URL, passes findDynamicLoads too
```

Relay into the Work store outside the guarded set (also a HIT): `WORK_LAYER_MODULES` does not include `src/state/**`. The direct-import guard checks only direct imports, so a one-hop relay passes both guards:

```js
// src/runner/dispatch/a.mjs
import { moveWork } from '../relay-out.mjs';
// src/runner/relay-out.mjs  (not guarded)
export { moveWork } from './../state/store.mjs';
// findWorkLayerReach('src/runner/dispatch/a.mjs', read) -> []
```

This already happens in real code. `src/runner/dispatch/assignment-normalizer.mjs -> execution-contract.mjs -> src/runner/paths.mjs -> src/runner/worktree.mjs -> src/state/store.mjs` loads the Work store module (`addWork`/`moveWork`) into dispatch. Only `StoreError` is imported today. The guard text says the guarded files "reach nothing in the Work layer", but it cannot see this path. Fix: add `/(^|\/)state\//` to `WORK_LAYER_MODULES`, or name `src/state/store.mjs` and `src/state/domain-registry.mjs`. Then decide whether `worktree.mjs`'s `StoreError` import is an accepted edge with a reason.

## 1d. `findDynamicLoads` evasions (HIT)

```js
Function('return 1')();                          // no `new`
const f = (()=>{}).constructor('return 1');      // Function constructor through a prototype
const AF = (async()=>{}).constructor; AF('x');
Reflect.construct(Function, ['x']);
import vm from 'node:vm'; vm.runInThisContext(code);
module.require(x); process.mainModule.require(x); // the regex excludes a preceding '.'
eval('1');                                   // escaped identifier
globalThis['ev'+'al']('1');
```

The red test should add `Function('x')`, `vm.runInThisContext` and `(()=>{}).constructor('x')` to the `caught` list. Note `new Worker(code, { eval: true })` is caught only by accident: it matches the `eval:` property name.

## 1e. Run-door call-site guard evasions (HIT)

`usesSymbol` works on `shape`, which blanks string contents.

```js
usesSymbol("import * as d from './dispatch.mjs'; d['executeAssignment'](a);", 'executeAssignment')     // false
usesSymbol("import * as d from './dispatch.mjs'; d['execute'+'Assignment'](a);", 'executeAssignment')  // false
usesSymbol("import * as d from './dispatch.mjs'; d.\\u0065xecuteAssignment(a);", 'executeAssignment')  // false
usesSymbol("if (x) {}\n/'/.test(y); executeAssignment(a); //'", 'executeAssignment')                   // false (1b)
```

The first one is the cheapest red test. Fix: also test `code` (not only `shape`) for a quoted whole-string `'executeAssignment'`. A stronger fix is to flag any namespace import (`import * as d`) of a run-door home or the barrel outside the allowed callers.

## 1f. Non-`.mjs` files are not guarded (HIT)

`mjsFilesUnder` keeps only `*.mjs` entries that are `isFile()`. `package.json` has `"type":"module"`, so `src/runner/dispatch/x.js` is ESM, and `findWorkShapedInputs`, `findDynamicLoads`, the domain-literal guard and the run-door scan never read it. The transitive walk does follow such a file when a guarded `.mjs` imports it. A symlinked `.mjs` is skipped too (`isFile()` is false). Reproducer: add `src/runner/dispatch/evil.js` containing `export const f = (o) => o.work;` and import it from any guarded `.mjs`. The suite stays green. Fix: scan `\.(m|c)?js$` and include symlinks, or fail on any non-`.mjs` source file under the guarded roots.

---

## 2. Old data on disk (MISS)

I built the fixture `/tmp/claude-1000/redteam-guard/oldrepo` with `assignment.json` carrying `workId`, `planContentHash`, `work:{rigor,docsRef}` and `provenance.work`, plus a `run.json` and a v1 `result.json` carrying `workId`/`planContentHash`, plus an admission generation.

- `node bin/fgos.mjs dispatch inspect --dir <repo> --run run-old-1` and `--assignment asgn-tsk-old-1` both return `resolved`, provenance `legacy-derived`, runId `run-old-1`.
- `dispatch reconcile plan --run run-old-1 --action collect-result` returns `planned`, with a snapshot digest.
- `node src/runner/dispatch.mjs reconcile <runDir>` returns `settled`, and the runResult keeps `workId: "tsk-old"`.
- The flat layout (`assignments/<id>/run.json` with no `runs/NN`) gives `inspect --run` → `not-found` and `reconcile plan` → `blocked: no matching Run`. The low-level `reconcile <dir>` does settle it. This branch does not touch `runtime-inspection.mjs` or the reconcile code (absent from `git diff --stat`), so this is pre-existing behaviour, not a regression.

## 3. Rigor floor (MISS)

Results from `resolveAssignmentDispatchPolicy`:
- assignment.rigor `low`, capability rigor `high` → `high` (source: capability).
- op policy `high`, assignment `low` → `high`.
- assignment `critical`, cliOverride `low` → `critical`.

The decide hint passes `workDispatchHint(work)` through `workRigorFor`, which reads risk:heavy as high. `hintDemand` then puts `rigor` and `domain` on both the no-explicit-executor branch and the main `assignmentForPolicy`, matching main's old `work: workItem` at both sites.

The runUnit path: `workUnitFor` sets `unitData.rigor = workRigorFor(item, matchedOp.policy)`. `run.mjs` puts it in `assignment.policy.rigor`, and `bind()` already takes the stronger of unit and capability rigor.

The only callers of executeAssignment are `run.mjs` and `cli.mjs` probe-account, and neither passed `opts.work` on main. So no item rigor was dropped.

Observations (not hits):
- An item with `rigor: low, risk: heavy` resolves to `low`. That is D18 as written ("risk heavy only when no rigor") and the same as main.
- The rigor provenance `source.scope` changes from `'work'` to `'assignment'`. No reader in src matches on `'work'`.

## 4. `decide --work` with its own agentType (MISS)

The only change is `workItem?.agentType` → `workHint.agentType ?? undefined`. The hint keeps non-empty strings and turns anything else into null/undefined. Main passed a non-string through, but `resolveExecutorConfig` can only use a string.

CLI runs in `cli-repo` all give `executorId: fgos-coding-implement`:
- plain, risk:heavy and coding-domain items: in-process with `--has-live-task-access`, out-of-process (`native-first.0033.cli-spawn-shaped`) without.
- `--stage discovery`: `fgos-coding-discovering`.
- Unknown id: `no work item "no-such" found`.
- The bare `src/runner/dispatch.mjs decide --work` refuses with a pointer to `fgos dispatch decide` (same message as on main).

## 5. Tests from phases 00 and 10 (MISS)

`env -u CLAUDE_CODE_SESSION_ID node --test test/runner/operation-choice.test.mjs test/runner/driver-rununit.test.mjs` passed 172/172. That includes "Finding 3: stale stored READY result when plan.md modified" (both variants), "driver loop runOnce: validate-plan READY advances Work", and "full cycle: the driver runs validate-plan through runUnit ... an edited plan is not consumed".

Touched suites (`architecture`, `dispatch`, `assignment-policy`, `assignment-provenance`, `work-size-rigor`, `dispatch-confinement-authority`) passed 465/465.

## 6. Other

Production callers (MISS): `rg` finds every call site of `decideExecutorCli`, `compileDispatchPlan`, `buildAssignment`, `executeAssignment`, `executeExecutorCli` and `resolveAssignmentDispatchPolicy` across src/bin/scripts/domains/core. None passes `work`, `workItem` or `workExecutorId`, and none spreads a caller-supplied object into the refused positions.

Concerns (not regressions, worth an item each):
- **`refuseWorkItemInput` checks only top-level own keys.** `{ work: undefined }` is refused, which is good, but these pass silently: `options.work`, `cliOverride.workItem`, an inherited `work` (`Object.create({work})`), a top-level `docsRef`, and `assignment.work`. `resolveAssignmentDispatchPolicy({assignment:{..., work:{rigor:'critical'}}})` gives `standard` with no refusal. Nothing reads these today, so it is fail-safe, but the stated promise ("refused instead of silently ignored") holds only at the top level. A custom `resolveWork` that returns the legacy `{workItem, executorId}` shape gets a confusing "supplied without the executor identity" error instead of a "takes no Work item" error, because `workHint.workItem` is not checked.
- **The harness seam is unreachable in production.** `domainHarnessFor` and `loadHarnessModule` are called only from tests, and so is `workDispatchContext`. On main, no production caller passed `work` to `buildAssignment` either, so the seam was already unreachable there; it has moved but is still not wired. `isSubstantiveEvidenceRef` (where `opts.work?.refs` was removed) has no caller in src or test at all.
- **Harness edge cases are all safe:**
  - Path traversal is impossible. `../coding`, `coding/../coding`, `constructor`, `__proto__`, `toString` and `hasOwnProperty` all give `undefined`. Inherited keys pass the `DOMAINS[name]` truthiness check, but no matching harness file exists.
  - A harness that throws at call time propagates out of `buildAssignment` ("boom at call").
  - A harness that throws at import time silently counts as no harness. That is fail-open on domain validation, but the same design as main.
- **`buildDeclaredAssignment` no longer derives `contextRefs` from `work.docsRef`/`plan.md`/`CONTEXT.md`/`work.refs`.** The only production caller of `buildAssignment` is the inline probe-account path in `cli.mjs`, so nothing changes in production today. Any future declared-shape caller must pass `contextRefs` itself.

Status: DONE_WITH_CONCERNS
Summary: The runtime change holds up. There is no regression in old-data reads, rigor floors, `decide --work` or the phase 00/10 tests, and no production caller passes a Work item. The new source guards can be evaded several ways: escaped, computed, multi-line or reflective keys; a regex after a block `}` that blinds the lexer; import syntax `extractImports` cannot parse; `src/state` not counted as Work layer, which real dispatch code already reaches through worktree.mjs; `Function`/`vm`/`.constructor`; `d['executeAssignment']`; and `.js` files. Each has a one-line reproducer above.
