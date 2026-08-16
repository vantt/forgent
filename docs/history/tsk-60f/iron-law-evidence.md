# tsk-60f — Iron Law evidence

`classifyIronLaw({filesChanged: <tsk-60f's real committed diff vs main>,
description})` at `approve` time: `required: true`, matched flags: `[]`,
matched modules: `[bin/fgos.mjs, src/runner/dispatch.mjs]` (real refusal
text from `fgos approve tsk-60f`, run from the main checkout).

Verify command: `npm test` (`node --test 'test/**/*.test.mjs'`).

## src/runner/dispatch.mjs — decide gains `--needs-soul`/`configured` (D2/D3)

Editing `decideCapacityCli`'s signature and return shape (adding
`configured`) made every pre-existing exact-shape assertion in
`test/runner/dispatch.test.mjs` fail before the assertions themselves were
updated — a real, observed red state, not a predicted one.

**Before (red)** — `node --test test/runner/dispatch.test.mjs`, run
immediately after editing `dispatch.mjs`, before touching the test file:

```
✖ decideCapacityCli resolves "in-process" for a kind:"task" capacity when hasLiveTaskAccess is passed true, alongside its agentType (2.06534ms)
✖ decideCapacityCli resolves "out-of-process" for the same kind:"task" capacity when hasLiveTaskAccess is omitted (safe default), still reporting its agentType (0.853324ms)
✖ decideCapacityCli omits agentType entirely for a kind:"tool" capacity that declares none (tsk-3ik-3) (0.799377ms)
✖ decideCapacityCli resolves "unavailable" when nothing is registered for the given purpose — the expected default state before any gather capacity exists (0.571049ms)
✖ decideCapacityCli resolves purpose-based (--for) to the same result a positional capacityId would, plus the resolved capacityId (0.612064ms)
✖ decideCapacityCli resolves work-item-based (--work) to the same result a positional capacityId would, plus the resolved capacityId -- explicit capacities.<id> override case (2.67851ms)
✖ decideCapacityCli resolves work-item-based (--work) to "in-process" by default when the resolved capacityId has NO explicit cfg.capacities entry ... (0.87758ms)
✖ decideCapacityCli resolves work-item-based (--work) to "out-of-process" when the caller has no live Task access ... (0.787901ms)
✖ a positional capacityId still wins over --work when both are somehow passed, same precedence --for already has (0.752744ms)
✖ the "decide" CLI entry point resolves --work <id> the same way as a positional capacityId (63.604101ms)
✖ the "decide" CLI entry point resolves --for <purpose> the same way as a positional capacityId (63.527333ms)
ℹ tests 233
ℹ pass 222
ℹ fail 11
```

Each failure's own diff showed the real cause: `actual` carried the new
`configured` field, `expected` (the stale assertion) did not — proof the
new field is actually being returned by the real code path, not merely
asserted to exist.

**After (green)** — same command, after updating every assertion to the
new shape and adding new `--needs-soul` coverage:

```
ℹ tests 238
ℹ suites 0
ℹ pass 238
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

A second red/green cycle on the same file, for the `resolve` retirement
(D4): after deleting `resolveCapacityCli` and the CLI branch, the same
suite showed:

```
✖ an unknown CLI subcommand still exits non-zero with a usage message naming resolve, execute, and decide (tsk-5tm-3 D5) (48.052747ms)
  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /resolve <capacityId>/. Input:
  'unknown subcommand "bogus". Usage: node src/runner/dispatch.mjs execute <capacityId> ...'
ℹ tests 231
ℹ pass 230
ℹ fail 1
```

— green after updating that one assertion to expect `resolve` gone:

```
ℹ tests 231
ℹ pass 231
ℹ fail 0
```

## bin/fgos.mjs — `fgos setup` wires the dispatch-decide hook (D1/D5)

Adding the new `dispatch-decide-hook-wired` doctor check
(`src/setup/registrations.mjs`, called from `bin/fgos.mjs`'s `setup` case)
made two pre-existing tests that assert the exact registered-check-id list
fail before those lists were updated:

**Before (red)** — `node --test test/setup/registrations.test.mjs`:

```
test at test/setup/registrations.test.mjs:193:10
✖ Data Dictionary #7 names exactly the registered doctor checks — no missing entry, no stale one
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  actual: [ ... 'dependencies-installed', 'enduser-docs-index-stale', ... ]
  expected: [ ... 'dependencies-installed', 'dispatch-decide-hook-wired', 'enduser-docs-index-stale', ... ]
```

— and `node --test test/setup/checks.test.mjs`:

```
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  actual: [ ... 'readme-install-tag-exists', 'iron-law-configured' ]
  expected: [ ... 'readme-install-tag-exists', 'iron-law-configured', 'dispatch-decide-hook-wired' ]
```

A third, real failure surfaced from the same change via
`test/architecture.test.mjs` (the whole-repo import-layer manifest test),
after the new `src/setup/claude-code-hooks.mjs` module was added and wired
into `bin/fgos.mjs`/`registrations.mjs` but before it was registered in
`docs/architecture-manifest.json`:

```
✖ import một chiều xuống: không file nào import ngược lên tầng trên
  actual: [
    'bin/fgos.mjs → src/setup/claude-code-hooks.mjs: đích không có row trong manifest',
    'src/setup/registrations.mjs → src/setup/claude-code-hooks.mjs: đích không có row trong manifest'
  ]
  expected: []
```

**After (green)** — all three, after updating the two hardcoded id lists
and the manifest entry:

```
node --test test/setup/registrations.test.mjs → tests 94, pass 94, fail 0
node --test test/setup/checks.test.mjs        → (part of the 229-test setup suite, all pass)
node --test test/architecture.test.mjs        → tests 3, pass 3, fail 0
```

## Full suite, both before and after the complete diff

`npm test` run at the end of implementation (after all 6 pieces, before
`fgos return`):

```
ℹ tests 3390
ℹ suites 0
ℹ pass 3385
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
```

Also proven live, twice, outside the test suite (not a fixture — real
subprocess spawns of `scripts/dispatch-decide-hook.mjs`, first against an
isolated repo with a registered out-of-process capacity, then against this
repo's own real `.fgos/config.json`):

```
$ echo '{"tool_name":"Agent","tool_input":{"subagent_type":"reviewer"},"cwd":"/tmp/..."}' \
    | node scripts/dispatch-decide-hook.mjs
BLOCKED: this Agent call resolves to out-of-process dispatch (no native in-process handler for "reviewer"). Run `node src/runner/dispatch.mjs execute` instead of calling this tool directly ...
exit: 2

$ echo '{"tool_name":"Agent","tool_input":{"subagent_type":"code-reviewer"},"cwd":"/home/vantt/projects/forgentX"}' \
    | node scripts/dispatch-decide-hook.mjs
exit: 0
```
