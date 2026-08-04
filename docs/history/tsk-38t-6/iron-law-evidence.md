# Iron Law evidence: tsk-38t-6

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` on this item's final
diff returns `required: true` — `matchedModules: ["src/state/store.mjs",
"bin/fgos.mjs"]` (both files-changed matches: `src/state/store.mjs` and
`bin/fgos.mjs` are both on `MODULE_RULES`, `src/evolve/iron-law.mjs`),
`matchedFlags: []` (no `HEAVY_KEYWORDS` substring hit in this item's own
description).

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/state/store.mjs", "bin/fgos.mjs"]
}
```

`src/state/store.mjs` is a genuine, direct match — this item's own scope
(task instructions, point 4) names it explicitly as the file to check
against `MODULE_RULES`. `bin/fgos.mjs` is also directly matched (this item
adds `--domain-fields` to the `add`/`edit` CLI cases there) — unlike
`tsk-slq`'s evidence file (where every touched file was net-new and outside
`MODULE_RULES`), this item's real diff touches two self-modifying-capable
modules for real, so the gate applies with no false-positive caveat needed.

## Failing-test-first proof

Test command: `node --test test/state/domain-fields.test.mjs` (part of
`npm test`).

**Before the fix** — `src/state/work.mjs`/`src/state/store.mjs`/
`bin/fgos.mjs` reverted to their pre-item state (`git checkout cdcdcd6 --
src/state/work.mjs src/state/store.mjs bin/fgos.mjs`, `cdcdcd6` being the
commit immediately before this item's own `5afd94a`), keeping only the new
test file `test/state/domain-fields.test.mjs`: no `domainFields` field
existed anywhere in the schema/store/CLI, so the test module itself failed
to even load — `work.mjs` had no `validateDomainFields` export yet. Real
transcript:

```
file:///home/vantt/projects/forgentX/.claude/worktrees/agent-a75bf97e413ac9473/test/state/domain-fields.test.mjs:26
import { validateWorkShape, validateDomainFields, WorkValidationError } from '../../src/state/work.mjs';
                            ^^^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/state/work.mjs' does not provide an export named 'validateDomainFields'
    at #asyncInstantiate (node:internal/modules/esm/module_job:327:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:431:5)
    at async node:internal/modules/esm/loader:643:26
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v24.18.0
✖ test/state/domain-fields.test.mjs (42.072634ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 47.78123

✖ failing tests:

test at test/state/domain-fields.test.mjs:1:1
✖ test/state/domain-fields.test.mjs (42.072634ms)
  'test failed'
```

**After the fix** — restored this item's real diff (`git checkout 5afd94a
-- src/state/work.mjs src/state/store.mjs bin/fgos.mjs`): `work.mjs` gains
`domainFields` shape validation in `validateWorkShape` plus the new
`validateDomainFields(work, domain)` fieldSchema-based validator;
`store.mjs` adds `'domainFields'` to `EDITABLE_FIELDS` and calls
`validateDomainFields` in both `addWork` and `editWork`; `bin/fgos.mjs`
adds `--domain-fields` to the `add`/`edit` CLI cases. Same test file, real
transcript:

```
✔ work.add with a valid domainFields succeeds and the field lands on the item (4.206874ms)
✔ work.edit --domain-fields overwrites the WHOLE object (latest-wins), not a deep merge (1.838499ms)
✔ an item with no domainFields at all still validates and replays exactly as before (RUL11 zero-migration) (0.663551ms)
✔ validateWorkShape rejects domainFields that is an array (0.426575ms)
✔ validateWorkShape rejects a domainFields domain key mapping to a non-object (string) (0.155928ms)
✔ validateWorkShape rejects a domainFields domain key mapping to null (0.130841ms)
✔ validateWorkShape rejects a domainFields domain key mapping to an array (0.13018ms)
✔ addWork rejects a malformed domainFields before any event is appended (0.378503ms)
✔ validateDomainFields accepts a domainFields[domain] value that matches the declared fieldSchema (0.16537ms)
✔ validateDomainFields rejects a domainFields[domain] value that violates the declared fieldSchema (wrong type) (0.230046ms)
✔ validateDomainFields is a no-op when the domain declares no fieldSchema (e.g. real "coding" today) (0.120117ms)
✔ validateDomainFields is a no-op when the item has no domainFields at all (0.101696ms)
✔ validateDomainFields only reads the namespace matching the item's OWN work.domain — other namespaces are left untouched, never validated (0.102455ms)
✔ validateWorkShape leaves an other-domain namespace present but does not deep-validate it (shape-only, generic across every key) (0.09726ms)
ℹ tests 14
ℹ suites 0
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 78.40435
```

Full suite after the fix (`npm test`, the item's own recorded `verify`
command run in full): **2498 tests, 2493 pass, 0 fail, 0 cancelled, 5
skip** (the 5 skips pre-exist this item, unrelated; baseline before this
item was 2484 tests, 2479 pass, 0 fail, 5 skip — this item added exactly
the 14 new tests above, zero regressions elsewhere).
