---
framework: diataxis
mode: how-to
---
# Add a new npm dependency to forgent

A recipe grounded in `tsk-slq`, which added `yaml` as forgent's first-ever
runtime dependency (the repo had zero `dependencies`/`devDependencies`
before it). Two real, non-obvious failures happened along the way — this
recipe exists so the next dependency addition doesn't repeat them.

## 1. Register it in the doctor-check registry

`AGENTS.md`'s install/setup/doctor gate is explicit: a new infra
dependency "must register into `fgos setup`'s config-merge and `fgos
doctor`'s check registry (`src/setup/checks.mjs`) — not stand alone,
undiscoverable by doctor." `checks.mjs` is a thin re-export shim; the real
registry is `src/setup/registrations.mjs`'s `registerCheck`:

```js
function checkDependenciesInstalled(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  const root = mainCheckout ?? cwd;
  const packageJsonPath = path.join(root, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return { passed: true, message: 'no package.json — nothing to check' };
  }
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = Object.keys(pkg.dependencies ?? {});
  if (deps.length === 0) {
    return { passed: true, message: 'no runtime dependencies declared — nothing to check' };
  }
  const nodeModulesPath = path.join(root, 'node_modules');
  const missing = deps.filter((dep) => !fs.existsSync(path.join(nodeModulesPath, dep)));
  if (missing.length > 0) {
    return { passed: false, message: `missing from node_modules: ${missing.join(', ')} — run npm install` };
  }
  return { passed: true, message: `${deps.length} dependenc${deps.length === 1 ? 'y' : 'ies'} installed` };
}

registerCheck({
  id: 'dependencies-installed',
  description: 'package.json dependencies are present in node_modules',
  check: (cwd) => checkDependenciesInstalled(cwd),
});
```

`tsk-slq` shipped this as `dependencies-installed` — it already exists, so
a second dependency addition needs no new check, only confirms this one
still reports correctly.

## 2. Prepend `npm install` to any item's own `verify` command

`fgos return`'s re-verify step runs in a **disposable, detached** `git
worktree add --detach` checkout (`bin/fgos.mjs`'s `return` case,
`src/runner/goal-check.mjs` — the same primitive `return`/`merge`/the
runner loop all share). This checkout is a bare git tree — `npm install`
is never run there automatically. Before `tsk-slq` fixed its own `verify`,
a real friction event was captured (`fgos check tsk-slq`'s recorded
friction, verbatim):

```
"disposition": "blocked",
"errorClass": "verify-miss",
"layer": "verification",
"detail": "goal-check failed on branch \"fgw/tsk-slq\" (exit 1)",
```

The actual failure underneath that generic message was
`ERR_MODULE_NOT_FOUND: Cannot find package 'yaml'` — `npm test` ran in
the disposable checkout with no `node_modules` at all. This passed cleanly
in the author's own worktree (where `npm install` had already been run by
hand) and only failed inside `fgos return`'s own re-verify, which is why
it is easy to miss until the item is actually returned.

Fix: make the item's own `verify` command self-sufficient —

```
npm install && npm test && <rest of the item's real verify>
```

not a shared-engine fix. Making `goal-check.mjs`/the disposable-worktree
provisioning auto-install dependencies would fix this for every future
item at once, but is a separate, out-of-scope change to shared runner
infrastructure — `tsk-slq` deliberately left it as a flagged follow-up
rather than expanding its own footprint into `src/runner/`.

## 3. Expect `main` to have moved since the branch forked

`tsk-slq`'s branch forked before `tsk-2cs`'s extensible doctor-check
registry (`src/setup/registrations.mjs`) had even landed on `main` — 31+
commits arrived on `main` while the item was still being built. A direct
hand-edit to `checks.mjs` was written first, then reverted once the real
`registerCheck` mechanism was found after merging `main` in. If a
dependency-adding item's own branch is more than a few commits old,
merge `main` in before registering a new doctor check — `checks.mjs`
itself may no longer be the place to add it by the time the item ships.
