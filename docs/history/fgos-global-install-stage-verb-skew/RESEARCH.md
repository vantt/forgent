# RESEARCH — fgos-global-install-stage-verb-skew (tsk-2ej)

## Round 1 — 2026-08-12

**Asked:** Xác nhận THẬT verb/stage set mà bản `fgos` CLI cài toàn cục trên
máy này đang hỗ trợ, đối chiếu với bộ verb hiện tại trong forgentX repo.
Không đoán mapping.

**Checked:**

- `which fgos` in this repo (forgentX) — resolves to a **shell function**
  (installed by `fgos setup`'s shell-integration line): it prefers the
  current git repo's own `bin/fgos.mjs` when present, and only falls
  through to `command -v fgos` (a real globally-installed binary) when the
  current git repo has no `bin/fgos.mjs` of its own. So inside forgentX,
  plain `fgos <verb>` ALWAYS runs this repo's own dev-checkout code — the
  global install is never exercised here by accident.
- `(unset -f fgos; command -v fgos)` — resolves the real global binary:
  `/home/vantt/.local/share/pnpm/bin/fgos`. `npm ls -g --depth=0` also
  lists `forgent@0.1.0`.
- Attempted to read the global package's `node_modules` directly
  (`find .../pnpm/global/5/node_modules/forgent`) — **blocked by the
  repo's own scout-block hook** (`node_modules` pattern in
  `.claude/.ckignore`), exactly the obstacle the bug report named ("hook
  chặn node_modules"). Confirms that constraint is real, not a
  misdiagnosis — reading the installed registry file directly is not an
  option from this session either.
- Ran the real global binary directly (`"$REAL_FGOS" not-a-real-verb`)
  from a neutral non-git scratch directory (so the shell-function's
  local-checkout preference doesn't intercept it) to get its own usage
  line printed by its own unknown-verb handler — this is process
  execution, not a file read, so the hook doesn't block it:

  ```
  fgos: unknown verb "not-a-real-verb". Usage: fgos <init|add|submit|discover|decompose|move|retrospective|cleanup|compound|edit|ask|answer|decision|list|ready|rebuild|repair|check|rollup|take|return|review|approve|sync-root|reject|catchup|evolve|triage|session|goal|tool|setup|doctor|unlock|lock-status|main-checkout-reset>
  ```

  → verb list is `discover|decompose|...` — **no `plan` verb at all.**

- Compared against this repo's own `bin/fgos.mjs --help` (local checkout,
  main @ current HEAD):

  ```
  fgos discover [write]  ... moving it forward to planning ...
  fgos plan [write]  Run chia-viec (split-work judgment) for an item at
      stage planning (renamed from decompose, tsk-403 D11 -- the legacy
      decompose stage alias still routes here too, D18) ...
  ```

  → local checkout has **both** `plan` (current name) and `decompose`
  (kept as a backward-compat alias routed through the same handler,
  `tsk-403` D11/D18). The global install has **only** `decompose` — it
  predates the tsk-403 rename entirely (`git log --grep=tsk-403`:
  `c7aa4575 refactor(tsk-403): rename decompose stage/verb family to plan
  (D11, D15, D18)`), it isn't merely missing the new alias-compat layer.

- Checked whether the CLI exposes any version-reporting surface at all:
  `fgos --version` → `unknown verb "--version"` (both local and global —
  there is no `--version` flag/verb anywhere in `bin/fgos.mjs` or
  `src/cli/command-registry.mjs`, confirmed by `grep -n "'version'"` on
  both files, zero hits). `package.json`'s own `version` field is frozen
  at `0.1.0` (matches the already-known gap named in tsk-12m's
  description: no CHANGELOG, version never bumped across dozens of merged
  features) — so even the manifest version can't distinguish "old" from
  "new" here; the only way to tell them apart at all was probing the real
  verb list via `--help`/unknown-verb output.
- Searched `src/setup/*.mjs` (doctor's own check registry) for any
  existing check of CLI-version/verb-set freshness — none found. The only
  `version` references there are Node's own `process.version` (a
  min-Node-version check) and `claude --version` (a different tool
  entirely). **No existing doctor/setup check detects this class of
  skew.**

**Found:**

1. The version skew reported is real and reproducible: the globally
   installed `forgent@0.1.0` (pnpm global bin + npm -g both point at it)
   predates commit `c7aa4575` (tsk-403, the `decompose` → `plan`
   stage/verb rename) — it has `discover`/`decompose` only, no `plan`.
   forgentX's own current checkout has both, `decompose` surviving only
   as a compat alias.
2. This skew is invisible to the CLI itself right now: there is no
   `--version` verb/flag anywhere (local or global), and `package.json`'s
   `version` field is a frozen `0.1.0` that carries no real signal either.
   Verb-list diffing via `--help` is the only way this session found to
   detect it — not something `doctor` currently does.
3. `src/setup/checks.mjs`/`src/setup/registrations.mjs` (doctor's own
   check registry, per AGENTS.md's install/setup/doctor gate) has no
   registered check for "does this machine's resolvable `fgos` verb set
   match what the bundled skills assume" — this is a genuine gap, not a
   misconfigured existing check.
4. Where this actually bites: any skill/session working from a directory
   with **no local `bin/fgos.mjs`** (an external product's repo that only
   has fgOS via the global/npm install — the shell function's fallback
   branch) and calling a stage-skill that assumes `fgos plan <id>` exists
   would hit a hard "unknown verb" failure on the global binary. Inside
   forgentX itself this never fires by accident, because the shell
   function always prefers the local checkout's own `bin/fgos.mjs` — the
   failure mode is specific to consumers of the global/npm install, the
   same population `tsk-65q` (gate-bypass dynamic-import crash on global
   installs) already names as under-served by today's install/setup/
   doctor story.

**Open:** none for this specific verb-list question — fully confirmed by
direct process execution, no guessing involved. (Broader design question —
*how* doctor/setup should detect and report this class of skew, e.g. a real
`--version` verb plus a doctor check comparing it against a bundled-skill
manifest version — is a planning-stage decision, out of scope for this
research round.)
