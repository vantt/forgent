---
framework: diataxis
mode: explanation
---
# Windows `npm install -g --prefix` has no `lib` or `bin` subfolder

`tsk-49r` added a CI workflow running the test suite across an OS matrix
(ubuntu, macOS, windows). `test/install-packaging.test.mjs` — the real
end-to-end proof that `npm pack -> npm install -g -> fgos init` works —
already asserted paths that are correct on Linux and macOS, but wrong on
Windows, and this only surfaced once the windows-latest matrix leg was
actually locked into the plan.

## What the test assumed, and what's actually true

The test's existing assertions assumed a Unix-shaped install layout:

```
path.join(installPrefix, 'lib', 'node_modules', 'forgent')
path.join(installPrefix, 'bin', 'fgos')
```

That layout holds on Linux and macOS — `npm install -g --prefix <dir>`
puts the package under `<dir>/lib/node_modules/` and drops executable
shims in `<dir>/bin/`. On Windows, confirmed via research (not assumption,
per this item's own CONTEXT.md D5 rationale) during planning, `npm`'s
global-install layout is structurally different: the package lands
directly under `<dir>/` (no `lib` subfolder), and the executable shims
(`.cmd`, extensionless, `.ps1`) are dropped directly in `<dir>/`, never in
a `bin/` subfolder. This is not a hypothetical edge case — it is a
structural mismatch that would fail the windows-latest matrix leg
immediately, the moment that leg actually ran.

The real fix, landed in `test/install-packaging.test.mjs`, branches
explicitly on `process.platform`:

```js
const installedPkgDir = process.platform === 'win32'
  ? path.join(installPrefix, 'node_modules', 'forgent')
  : path.join(installPrefix, 'lib', 'node_modules', 'forgent');
...
const fgosBin = process.platform === 'win32'
  ? path.join(installPrefix, 'fgos.cmd')
  : path.join(installPrefix, 'bin', 'fgos');
```

macOS follows the same layout as Linux — only `win32` needed its own
branch.

## Why this was a mid-planning decision, not a pre-locked one

The OS matrix itself (D3: run on ubuntu + macOS + windows) was locked
earlier, during `fgos-coding-exploring`. This path-layout mismatch surfaced only
after that, during `fgos-coding-planning` — a genuine mid-planning gap under that
skill's own material/grounded/answerable filter, not a re-litigation of
the OS-matrix decision itself. Locking "which OSes to test on" and
discovering "does the existing test's assumptions hold on all of them"
are two different questions that can only be answered in that order: the
mismatch is invisible until a real windows leg is actually in scope to
check against.

## The general shape

A cross-platform matrix decision (which OSes to run on) and a
cross-platform correctness check (does existing platform-specific logic
already handle all of them) are separate questions. Locking the matrix
first is necessary, but it is not sufficient — the moment a new OS enters
scope, anything that hardcoded a path shape, a shim extension, or a
directory layout for the previously-only-tested platform needs a fresh,
research-backed check against that new OS's real behavior, not an
assumption that "it probably works the same."
