# Iron Law evidence — tsk-47r

`classifyIronLaw` result against the item's own description + touched files
(`src/evolve/iron-law.mjs`, run live in this worktree):

```json
{
  "required": true,
  "matchedFlags": ["security", "credentials"],
  "matchedModules": []
}
```

`matchedModules` is empty — `src/setup/registrations.mjs` is not in
`MODULE_RULES` (it is a config-default registration, not a `src/runner/`,
`src/evolve/`, or `bin/fgos.mjs`-shaped self-modifying-capable module).
`matchedFlags` trips instead: the item's own description discusses `pi`'s
OAuth credential handling and security posture (`security`, `credentials`
both appear as literal words), which is enough on its own to require the
Iron Law regardless of which files changed.

## Test command

The item's own `verify`:

```bash
npm test -- test/setup/registrations.test.mjs test/setup/checks-setup-config.test.mjs
```

## Shape of this change

`src/setup/registrations.mjs`'s single `registerConfigDefault({id: 'runner',
key: 'runner', ...})` call gained an `executors: { pi: PI_EXECUTOR_DEFAULT }`
key and a `modelPolicies['openai-codex']` entry, layered onto the existing
shape the same way `capabilities: DEFAULT_CAPABILITY_SLOTS` already is (one
registration, not a second competing one — `assembleRegistryDefaults`
composes flat per-key, so a second `key: 'runner'` registration would
silently overwrite this one rather than merge). `PI_EXECUTOR_DEFAULT` is a
new exported constant mirroring `agy`'s live `executors.agy` shape, with the
exact `--provider openai-codex --model gpt-5.5` invocation the D4 live
proof-test (RESEARCH.md Round 4) confirmed GREEN.

The before/after contrast reverts `src/setup/registrations.mjs` alone in
this worktree back to its pre-change committed content (`git checkout HEAD
-- src/setup/registrations.mjs`, i.e. this item's own branch HEAD before
this session's uncommitted edit), runs the two updated tests against that
reverted file, then restores the changed content and runs them again.

## Failing-before transcript

`src/setup/registrations.mjs` reverted to its pre-change committed content
(no `PI_EXECUTOR_DEFAULT` export). The two ripple tests already updated to
import and assert against `PI_EXECUTOR_DEFAULT` fail to even load:

```
$ node --test test/setup/registrations.test.mjs test/setup/checks-setup-config.test.mjs
file:///.../test/setup/checks-setup-config.test.mjs:39
import { DEFAULT_CAPABILITY_SLOTS, PI_EXECUTOR_DEFAULT } from '../../src/setup/registrations.mjs';
                                   ^^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/setup/registrations.mjs' does not provide an export named 'PI_EXECUTOR_DEFAULT'

file:///.../test/setup/registrations.test.mjs:14
import { DEFAULT_CAPABILITY_SLOTS, PI_EXECUTOR_DEFAULT } from '../../src/setup/registrations.mjs';
                                   ^^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/setup/registrations.mjs' does not provide an export named 'PI_EXECUTOR_DEFAULT'

ℹ tests 2
ℹ suites 0
ℹ pass 0
ℹ fail 2
```

A clean, unambiguous failure: the pre-change code has no `pi` executor
registration at all, and both tests that assert its presence refuse to even
load — exactly the gap this item's config-registration step closes.

## Passing-after transcript

`src/setup/registrations.mjs` restored to its changed (working-tree)
content (confirmed via `git diff --stat`, unchanged from before the revert).
Same two test files:

```
$ node --test test/setup/registrations.test.mjs test/setup/checks-setup-config.test.mjs
✔ a new module can register a config-default independently of any check (D2)
✔ registerConfigDefault rejects a non-object shape
✔ registerConfigDefault requires a non-empty key
✔ the runner's own config-default is registered under the "runner" key (built-in, proves the same mechanism a new module would use)
✔ a new module can register a fix via registrations.mjs and see it in checks.mjs's own FIX_REGISTRATIONS, without checks.mjs being edited
✔ registering a fix with a duplicate id throws rather than silently shadowing the original
✔ registerFix requires a fix function
✔ runFixes invokes every registered fix against the given cwd and reports id/changed/message per entry
✔ ensureSharedConfigDefaults on a fresh dir writes every registered entry under its own key, including the built-in "runner" one
✔ ensureSharedConfigDefaults on an already-complete shared file does not rewrite it
✔ Data Dictionary #7 names exactly the registered doctor checks — no missing entry, no stale one
✔ Data Dictionary #7b names exactly the registered doctor fixes — no missing entry, no stale one
✔ plugin-skill-cli-reachable passes when a local bin/fgos.mjs exists, without touching PATH
✔ plugin-skill-cli-reachable passes when no local bin/fgos.mjs exists but fgos resolves from PATH
✔ plugin-skill-cli-reachable fails when neither a local bin/fgos.mjs, a project-local install, a cached global path, nor a live PATH install exists
✔ cli-version-visible passes and its message embeds the resolved packageVersion
✔ plugin-dev-skills-packaged passes cleanly when the project has no .claude/skills or plugins/fgOS/skills at all
✔ plugin-dev-skills-packaged passes when every .claude/skills/fgos-* dev-skill has a matching plugins/fgOS/skills/ copy
✔ plugin-dev-skills-packaged fails and names any .claude/skills/fgos-* dev-skill missing from plugins/fgOS/skills/
✔ gateway-token-configured check fails when HOME has no gateway.token, and fix provisions a real one the check then accepts
✔ gateway-token-configured fix is idempotent — an existing token is never rotated out from under a client that already has it
✔ the gateway config-default is registered under the "gateway" key with port and an unarmed null token
ℹ tests 26
ℹ suites 0
ℹ pass 26
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Full `npm test` (all 3655 tests, including `test/setup/checks.test.mjs`'s
third ripple update) was also run clean before this evidence file was
written — 3650 pass, 0 fail, 5 skipped (unrelated pre-existing skips).
