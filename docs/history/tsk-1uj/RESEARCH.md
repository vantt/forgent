# Research — tsk-1uj (bật `docRegistry.enforce: true`)

## Round 1 — 2026-08-27

**Asked:** (1) Where exactly does `docRegistry.enforce` get read, and what
branch of behavior does it gate? (2) Does any real (non-test) consumer or
existing test currently rely on the soft-fail (`enforce: false`) branch in
a way that would break once the live flag flips to `true`?

**Checked:**
- `rg -n "docRegistry" src bin --glob "*.mjs"` — repo search, all hits read.
- `bin/fgos.mjs:1823-1882` (the `knowledge attest` subcommand) and
  `bin/fgos.mjs:1900-1959` (the legacy `compound` subcommand) — read
  directly with line citations.
- `rg -n "docRegistry" test --glob "*.mjs"` and `rg -n "attested.*false" test
  --glob "*.mjs"` — repo search over the test tree.
- `rg -n "knowledge attest" --glob "*.mjs" --glob "*.md" -g '!test/**' -g
  '!docs/history/**'` — repo search for every real (non-test) caller.
- `src/setup/registrations.mjs:2452-2478` — the `DEFAULT_DOC_REGISTRY_SETTINGS`
  constant and its own doctor check, read directly.
- `.fgos/config.json` (this repo's live shared config) — read directly:
  `{"enforce": false}` today.

**Found:**
1. Exactly one gate, two call sites, same shape. `bin/fgos.mjs:1850`
   (`knowledge attest`) and `bin/fgos.mjs:1947` (legacy `compound`) both
   read `sharedConfig?.docRegistry?.enforce === true` fresh on every call
   (no caching). When `true`, `knowledge attest` throws a
   `StoreError('validation', ...)` fail-closed on any of 3 conditions:
   the doc-path resolves to more than one doc (`bin/fgos.mjs:1856`), it
   resolves to none (`:1859`), or it resolves but the path given is an
   alias rather than the registered `currentPath` (`:1862`). When
   `false` (today's live value), those same 3 conditions instead return
   `{attested: false, reason: 'docRegistry.enforce is off and this path
   does not resolve to a single registered currentPath', docPath,
   captureId}` (`bin/fgos.mjs:1864-1868`) — a soft, non-throwing skip.
   The one check that always applies regardless of the flag is the
   pre-existing git-HEAD commit check (`bin/fgos.mjs:1837-1839`).
2. No real consumer depends on the soft-fail branch firing. The only
   real (non-test) skill caller,
   `domains/coding/skills/fgos-coding-knowledge/SKILL.md:38` (mirrored at
   `plugins/fgOS/skills/fgos-coding-knowledge/SKILL.md:38`), always calls
   `fgos knowledge attest --doc-path <currentPath> --capture-id <id>`
   with the registry's own `currentPath` from the registry-first writer
   flow (tsk-28x-9) — by construction, that path is already a registered,
   non-alias `currentPath`, so it satisfies the `enforceRegistry === true`
   branch's 3 conditions today, not just the soft-fail one.
   `scripts/knowledge-canary.mjs:43-57` calls attest as its own gate proof
   and already throws if the result is not `attested: true` — it has
   never tolerated the soft-fail shape, so it is already functionally
   exercised as if enforcement were on.
3. Every test referencing `docRegistry`/`enforce` builds its own isolated
   sandbox config (`writeSharedConfig(tmpDir, ...)` in
   `test/cli/knowledge-attest-gate.test.mjs:23`, an inline fixture object
   in `test/setup/checks.test.mjs:1044`, `DEFAULT_DOC_REGISTRY_SETTINGS` in
   `test/setup/checks-doctor-config.test.mjs:218`) — none of them read this
   repo's own `.fgos/config.json`, so flipping the live value has zero
   effect on any existing test's pass/fail. One test's own title
   (`test/cli/knowledge-attest-gate.test.mjs:105`, "with docRegistry.enforce
   off (the real default)") becomes a stale *description* once this repo's
   live default flips, but it still exercises a real, still-supported code
   path (a fresh install's own default stays `false`, see point 4) and
   needs no functional change — at most a comment/title touch-up, not a
   fix.
4. `DEFAULT_DOC_REGISTRY_SETTINGS` (`src/setup/registrations.mjs:2452-2454`,
   `{enforce: false}`) is a *separate* concern from this repo's own live
   `.fgos/config.json` value: it is the shape `fgos setup`'s config-merge
   applies to any brand-new fgOS install, most of which start with an
   empty registry (0 topics/docs) where hard-enforcing on day one would
   deadlock every retrospective attest before that project ever
   bootstraps. This item is scoped to this repo's own live config value
   only — the global default is out of scope and should not change.

**Still open:** none — the mechanism, its exact gate points, and the
absence of any real consumer relying on soft-fail are all confirmed
directly against the current code and config, not inferred.
