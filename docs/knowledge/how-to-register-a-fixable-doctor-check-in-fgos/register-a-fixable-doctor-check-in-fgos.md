---
framework: diataxis
mode: how-to
---
# How to register a fixable doctor check in fgOS

You have a module that wants `fgos doctor` to detect a problem AND repair
it — not just report it. This is the pattern `tsk-2qz-1`/`tsk-2qz-2`
(`docs/history/doctor-fix-gate-bypass/`) built and proved end-to-end with
gate-bypass's own real entry.

## The three independent capabilities

`src/setup/registrations.mjs` lets a module register any subset of three
capabilities for one entry — none forces another:

- `registerCheck({ id, description, check })` — reports `{passed, message}`.
- `registerConfigDefault({ id, key, shape })` — this module's default shape
  under its own top-level key in the shared config file
  (`.fgos/config.json`).
- `registerFix({ id, fix })` — a function `(cwd) => { changed, message }`
  that repairs whatever the check reports as failing.

From `registrations.mjs` (`tsk-2qz-1`'s real capture):

> Register a fix (D3, docs/history/doctor-fix-gate-bypass/CONTEXT.md):
> `fix` is a function `(cwd) => { changed, message }` that repairs whatever
> this entry's own `check` (if any) reports as failing — idempotent, and
> scoped only to this entry's own concern, never another entry's. `fix`
> registration is independent of `check`/`configDefault` (same D2 style
> those two already follow) — a module may register any subset of the
> three.

## Step 1 — write the check

Read the current state and report pass/fail plus an actionable message.
gate-bypass's real check (`tsk-2qz-2`'s capture) is deliberately narrower
than the generic staleness scan every registered `configDefault` already
gets for free (`checkConfigNotStale`) — it also validates the *value*, not
just key presence:

```js
function checkGateBypassConfigured(cwd) {
  const shared = readSharedConfig(cwd);
  const level = shared?.gateBypass?.level;
  if (typeof level !== 'string' || !LEVELS.includes(level)) {
    return {
      passed: false,
      message: `gateBypass.level missing or not a recognized level (${LEVELS.join('/')}) -- run fgos doctor --fix`,
    };
  }
  return { passed: true, message: `gateBypass.level = "${level}"` };
}
```

A generic `configDefault` registration only catches a *missing* key
(`mergeConfigDefaults`' own contract) — a present-but-malformed value
(e.g. `level: "total"`) is never "missing", so it needs its own check if
that distinction matters to your module.

## Step 2 — write the fix, idempotently

The fix must be a no-op (`changed: false`) when the state is already
valid — never rewrite unnecessarily:

```js
function fixGateBypassConfigured(cwd) {
  const shared = readSharedConfig(cwd);
  const currentLevel = shared?.gateBypass?.level;
  if (typeof currentLevel === 'string' && LEVELS.includes(currentLevel)) {
    return { changed: false, message: `gateBypass.level already "${currentLevel}"` };
  }
  const existingGateBypass =
    shared.gateBypass && typeof shared.gateBypass === 'object' && !Array.isArray(shared.gateBypass)
      ? shared.gateBypass
      : {};
  const merged = { ...shared, gateBypass: { ...existingGateBypass, level: DEFAULT_LEVEL } };
  writeSharedConfig(cwd, merged);
  return { changed: true, message: `wrote gateBypass.level = "${DEFAULT_LEVEL}" to ${sharedConfigFilePath(cwd)}` };
}
```

## Step 3 — register all three together

```js
registerConfigDefault({
  id: 'gateBypass',
  key: 'gateBypass',
  shape: { level: DEFAULT_LEVEL },
});

registerCheck({
  id: 'gate-bypass-configured',
  description: 'gateBypass.level in the shared config file is present and a recognized level',
  check: (cwd) => checkGateBypassConfigured(cwd),
});

registerFix({
  id: 'gate-bypass-configured',
  fix: (cwd) => fixGateBypassConfigured(cwd),
});
```

No edit to `bin/fgos.mjs` or `src/setup/checks.mjs` is needed for the
registration itself — `DOCTOR_CHECKS`/`FIX_REGISTRATIONS` are live,
re-exported bindings that pick up a new entry automatically.

## Step 4 — how `doctor --fix` runs it

`fgos doctor` stays exactly as before by default (no writes, RUL9's
original contract). Passing `--fix` runs every registered fix *before*
re-reporting checks, so the returned `checks` array reflects post-fix
state (`bin/fgos.mjs`'s real `case 'doctor'`):

```js
case 'doctor': {
  const fixed = flags.fix ? runFixes(process.cwd()) : undefined;
  const checks = DOCTOR_CHECKS.map(({ id, description, check }) => {
    const { passed, message } = check(process.cwd());
    return { id, description, passed, message };
  });
  return fixed === undefined ? { checks } : { fixed, checks };
}
```

This is a deliberate reversal of `docs/specs/distribution.md`'s RUL9
("doctor's checks never write anything, under any circumstance") and RUL11
("doctor --fix does not exist yet") — intentional per
`docs/distribution-vision.md` §3, not drift. Without `--fix`, behavior is
byte-identical to before this flag existed.

## Step 5 — legacy-file fallback, if your data used to live elsewhere

If your module's data previously lived in its own standalone file (like
gate-bypass's old `.fgos/gate-bypass.json`, `{"level": "..."}`), read the
shared file first and fall back to the old file only when the shared file
has no valid entry yet — never delete the old file. Real shape from
`src/state/gate-bypass.mjs`'s `readGateBypassLevel`:

```js
export function readGateBypassLevel(dir) {
  let shared;
  try {
    shared = readSharedConfig(path.dirname(dir));
  } catch {
    shared = undefined;
  }
  const sharedLevel = shared?.gateBypass?.level;
  if (typeof sharedLevel === 'string' && LEVELS.includes(sharedLevel)) {
    return sharedLevel;
  }
  return readLegacyStandaloneLevel(dir);
}
```

Note the `path.dirname(dir)` — `readSharedConfig`/`sharedConfigFilePath`
(`src/config/shared-config-file.mjs`) take the **repo root**, while a
function like `readGateBypassLevel` may have every existing caller already
passing the `.fgos` directory itself. Check your own function's existing
call sites before assuming which one you're given.

## Real-world lesson: `changed: false` is a success state, not a failure — the renderer has to agree

`docs/history/doctor-fix-pretty-status-line/CONTEXT.md` (`tsk-45g`) records
a real bug where `bin/fgos.mjs`'s `--pretty` renderer violated the exact
contract this doc documents above (Step 2): a registered fix's `{changed,
message}` return has no third, failing state — `changed: false` means "the
check was already correct, nothing to do," not an error. The renderer's
`doctor` branch fed `f.changed` straight into `formatCheck`, which renders
`false` as a red `✗` — so a fully healthy `gateBypass.level` state printed
as a failure line just because the fix found nothing to repair:

> "D1: `renderPretty`'s doctor `fixed` loop... must stop using `f.changed`
> as the `formatCheck` pass/fail boolean... `changed: false` therefore
> means 'already correct,' a success state, not a failure — yet
> `formatCheck(f.changed, ...)` renders it as a red `✗`... Fix lines must
> render `✓` (green) unconditionally — a registered fix per its own
> documented contract either writes the corrected value or reports it was
> already correct; there is no third, failing outcome in the `{changed,
> message}` shape."

If you're registering a fix and see its line render red on a healthy
system, this is the class of bug to check for — the renderer, not your
fix's own logic, may be reading the wrong field. The `message` string is
where "changed" vs. "already fine" belongs; the color no longer needs to
(and must not) also encode that distinction.

## Real-world lesson: a shared config file can land without your module's key

`docs/history/doctor-fix-gate-bypass/CONTEXT.md` D4 records a real,
material finding during this item's own execution: the shared config file
this pattern depends on (`tsk-2ta`/`tsk-5vf`) can land on `main` *before*
your module registers into it. Confirm the real file/mechanism exists by
direct read (`git log`, `cat .fgos/config.json`, `git show` the registry
module) rather than trusting an item tracker's `status: done` alone — a
milestone item can be "done" while still leaving a real gap for the next
consumer to close.
