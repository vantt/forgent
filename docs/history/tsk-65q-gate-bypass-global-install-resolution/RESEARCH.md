# RESEARCH — tsk-65q (gate-bypass Gate-section check crashes on global install)

## Round 1 — 2026-08-13

**Asked:** (1) exact file+line where the Gate-section check dynamic-imports
`gate-bypass.mjs`/`store.mjs` cwd-relative; (2) why it works in dev-checkout
self-hosting but crashes "Cannot find module" on a pure global npm install
onto another project; (3) what Node-native mechanism resolves a package's
own module path independent of caller cwd, and whether the codebase already
has a working precedent for it.

**Checked (repo search, `rg`):**

- `.claude/skills/fgos-coding-exploring/SKILL.md:327-341` and
  `.claude/skills/fgos-coding-validating/SKILL.md:262-298` — both carry the
  identical inline `node -e` snippet. It defines:

  ```js
  function resolveModule(relPath, needed) {
    return import(relPath).catch(() => ({})).then((local) => {
      if (needed.every((name) => typeof local[name] === 'function')) return local;
      return import(root + relPath.slice(1));
    });
  }
  ```

  Two-tier resolution only: (a) `import('./src/state/store.mjs')` —
  relative to the Node process's **cwd** (there is no module URL context
  for a `node -e` script, so Node treats the cwd as the base for a relative
  specifier); (b) on failure/missing export, `import($root + '/src/state/store.mjs')`
  where `$root = git rev-parse --path-format=absolute --git-common-dir |
  xargs dirname` — the **current git repo's own root**, not fgOS's own
  install location.
- `.claude/skills/fgos-coding-exploring/SKILL.md:343` (prose already in the
  skill file) confirms the intent of tier (a): "this worktree's own branch
  already carries whatever version it needs... falls back to `$root`'s
  canonical copy only when the needed export is missing or the import
  throws." Both tiers assume the **calling repo itself** vendors
  `src/state/*.mjs` — true for forgentX (dev-checkout self-hosting) and for
  any repo where fgOS's own source tree is what's being called from, false
  for a project that only has fgOS via `npm install -g` (no
  `src/state/*.mjs` at cwd or at that project's own `$root`).
- **Root cause confirmed, not assumed:** neither tier ever looks at where
  the `fgos` package **itself** is installed (npm global lib dir, pnpm
  global store, or wherever `npm install -g github:vantt/forgent` put it).
  For a session working inside an external product's repo with fgOS only
  globally installed, both `import(relPath)` and `import($root + ...)`
  point at paths that do not exist in that repo → both throw → the
  `.catch(() => ({}))` on tier (a) swallows the first failure silently,
  then tier (b)'s own `import()` throws uncaught (no `.catch` wraps it) —
  confirms the item's own description ("crashes 'Cannot find module'
  unconditionally").
- **Existing precedent for the correct fix, found in this repo's own code:**
  `bin/fgos.mjs:15-32` — every import there is a **static** relative
  specifier (`from '../src/state/gate-bypass.mjs'`, etc.). A static ES
  module import resolves relative to the **importing file's own real
  location** (`import.meta.url`), never the caller's cwd and never the
  caller's own repo root. This is exactly why running the installed `fgos`
  binary from inside ANY project — global install, dev-checkout, npx —
  already resolves `gate-bypass.mjs`/`store.mjs` correctly today, with zero
  special-casing: Node's own module resolution does the work, because the
  import lives inside the file that ships with the package, not inside a
  string reconstructed from cwd/git-root at call time.
- **No existing CLI verb exposes the check itself.** `bin/fgos.mjs` imports
  `readGateBypassLevel` (line 25) and exposes it read-only via `case
  'gate-bypass':` (line 2221-2223, returns `{level: readGateBypassLevel(dir)}`)
  — but `canAutoApprove`/`canAutoApproveMergedGate` (the functions the
  skill-embedded resolver actually needs) are never imported into
  `bin/fgos.mjs` at all (`grep -n canAutoApprove bin/fgos.mjs` — zero
  hits). The skill files reimplement their own ad hoc resolver specifically
  because no CLI verb does this computation today.
- `test/state/gate-bypass.test.mjs` exists and covers
  `readGateBypassLevel`/`isTierCovered`/`hasOpenItems` at the module level
  — it does not exercise the skill-embedded inline resolver (that lives in
  Markdown prose, not in a `.mjs` file `node --test` can import).

**Found:**

1. Root cause is confirmed by direct code reading, not inferred: the
   Gate-section check's own two-tier `resolveModule` never tries the
   package's own real install location — only cwd and the calling repo's
   git root, both of which are empty of `src/state/*.mjs` for a pure
   global-install consumer.
2. A working, in-repo precedent for the correct resolution already exists:
   `bin/fgos.mjs`'s own static relative imports, which resolve correctly
   from any install shape because Node resolves them against the
   importing file's own location, not cwd.
3. The natural fix direction this evidence points to: stop reimplementing
   module resolution inline in skill prose; route the check through the
   `fgos` CLI itself (a new verb, since none exists today) so it inherits
   `bin/fgos.mjs`'s already-correct resolution for free. The exact verb
   shape/name is an implementation decision, left to planning — this
   round only confirms the fix class is real and precedented, not which
   verb signature to add.

**Open:** none for the discovery-stage question (is the goal understood
well enough to proceed, and is there a real evidence-backed fix direction —
yes to both). The exact new-verb interface, and whether to extend
`gate-approve`/`gate-bypass` or add a new verb, is left open for
`fgos-coding-planning`.
