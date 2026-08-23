# plan.md — tsk-652: uninstall --remove-package false-success on non-npm installs

Mode: small

1 flag (existing covered behavior — `test/setup/self-uninstall-spike.test.mjs`
already covers `--remove-package`'s happy path). No CONTEXT.md: discovery
verdict was clear.

## Approach

**Chosen path:** before running `npm uninstall -g forgent`
(`bin/fgos.mjs` uninstall case, `--remove-package` branch), confirm this
copy is actually reachable through npm's own global `node_modules` —
`npm root -g` then check `<that path>/forgent` exists. If not, report
`outcome: 'skipped'` with a clear reason instead of running the command
and claiming `outcome: 'removed'`/`'failed'` for a package npm never
touched. This does not attempt to detect or support pnpm/yarn removal —
tsk-4iv-2's own SPIKE deliberately scoped this feature to npm-only; this
item closes the "false success" gap that scoping left open, it does not
widen the scope.

**Alternatives rejected:**
- *Detecting and shelling out to pnpm/yarn's own removal command* —
  rejected, real scope creep beyond what tsk-4iv-2 locked (npm-only,
  Linux/macOS-only) and beyond what this item's own evidence asked for
  (an honest refusal, not multi-manager support).
- *Checking `process.execPath`/`import.meta.url` to infer the install
  manager* — rejected. Both pnpm and npm end up running the same `node`
  binary from broadly similar-looking paths depending on OS/version; `npm
  root -g` plus a real file-existence check is a direct, verifiable fact
  about what npm itself can see, not an inference from a path shape.

**Risk map:** Light — one guard added before an existing `execFileSync`
call; no change to the npm-installed happy path other than one extra,
cheap synchronous check.

**Impact-analysis posture:** `degraded` (GitNexus present but stale, same
posture recorded for tsk-2xj this session).

## Shape

- `bin/fgos.mjs`'s `uninstall` case, `--remove-package` branch: add the
  `npm root -g` + existence check before the existing `execFileSync('npm',
  ['uninstall', ...])` call. On a confirmed-absent package, set
  `packageRemoval = { attempted: false, outcome: 'skipped', reason: "..." }`
  and skip the npm call entirely.
- `test/setup/self-uninstall-spike.test.mjs` (or a new test file) — add a
  case that fakes `npm root -g` (or points HOME/PATH so the real `npm root
  -g` result has no `forgent` inside it) and asserts `outcome: 'skipped'`,
  never `'removed'`.

**Concrete cases to prove against:**
- Existing behavior that must not regress: a real npm-global-installed
  copy still reports `outcome: 'removed'` (the existing
  `self-uninstall-spike.test.mjs` happy-path case).
- The actual bug case: `npm root -g`'s own directory does not contain
  `forgent` (simulating a pnpm/yarn install, or no install at all) →
  `outcome: 'skipped'`, never `'removed'` or a misleading `'failed'`.
- Partial failure: `npm root -g` itself fails to run (npm not on PATH at
  all) → same `'skipped'` outcome with a reason naming that, never a crash.

## Split decision

No split.

## Outstanding questions

None
