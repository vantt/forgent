# Plan: tsk-2ta — fgOS awareness hai cấp global vs project config (+ context 3 fallback)

**Decisions source:** `docs/history/global-project-config-awareness/CONTEXT.md` (D1, D1 amended, D2)

## Mode: high-risk

Flags counted (auth / authorization / data model / audit-security / external
systems / public contracts / cross-platform / existing covered behavior /
weak proof around the area / multi-domain):

- **data model** — yes: new persisted config schema (`~/.fgos/config.json`)
  + relocation of the existing project config file.
- **public contracts** — yes: `docs/specs/distribution.md` Data Dictionary
  #7 (doctor check set) gains a 4th entry; `.fgos-runner.json`'s path is
  referenced by existing code and tests.
- **existing covered behavior** — yes: `src/setup/checks.mjs`,
  `test/setup/*.test.mjs`, `test/scripts/fgos-shell-integration.test.mjs`
  already cover the exact paths this item changes.
- **weak proof around the area** — yes: D2's fallback case has zero test
  coverage today (`test/scripts/fgos-shell-integration.test.mjs:38-94`
  covers 2 of 3 real cases).
- **multi-domain** — yes: touches distribution
  (`scripts/fgos-shell-integration.sh`) and setup/config
  (`src/setup/*`, likely `src/runner/dispatch.mjs`) at once.

5 flags ≥ 4 → **high-risk**, by count alone (no hard-gate flag like
auth/data-loss/security/external-provider/validation-removal is present,
but the threshold is already crossed). A smaller mode would hide the
migration risk on existing installs and the multi-domain surface.

## Approach

Two locked decisions, each independently landable but bundled in one item
per an explicit product-owner call already on record
(`docs/distribution-vision.md` §3: "Gộp vào scope `tsk-2ta` (không tách
item riêng)") — see Split decision below.

### D1 — config unification (global file + project relocation + doctor check)

Chosen path:

- Add a global config read at `~/.fgos/config.json` (new file, does not
  exist today — confirmed by exploring's scout grep).
- Move the project-local config path from `.fgos-runner.json` (cwd root)
  to `.fgos/config.json` (inside the `.fgos/` dir that already holds
  state) — CONTEXT.md D1 amended, a direct user naming decision, not a
  guess.
- When project `.fgos/config.json` is missing but the old
  `.fgos-runner.json` is present, read the old file as a fallback rather
  than treating the project as unconfigured — `fgos setup` is what
  performs the actual move to the new path (pinned as an assumption
  below; not material enough to re-open CONTEXT.md for).
- At merge time, project always overwrites global for any key present in
  both — no deep merge across the two roots (distinct from
  `mergeConfigDefaults`, which fills missing keys within a single file,
  not across global/project).
- New `fgos doctor` check reports which level is currently active
  (global/project) and whether the other level is also present — the
  check id and message text are implementer detail, not locked here.

Alternatives rejected:

- Keep `.fgos-runner.json`'s name unchanged, only add the global file —
  rejected: user explicitly asked for naming symmetry between the two
  levels (CONTEXT.md D1 amended).
- Auto-rename the old file the moment any read-only command (like
  `doctor`) runs — rejected: `doctor` never writes, by design (RUL9,
  `docs/specs/distribution.md`); the move belongs to `fgos setup`, an
  explicit write action (RUL10), not an implicit background rewrite
  triggered by a read.

### D2 — shell integration fallback

Chosen path: in `scripts/fgos-shell-integration.sh`, after
`_fgos_repo_root` resolves a root, `fgos()`/`fgos-runner()` check whether
`bin/fgos.mjs` (respectively `bin/fgos-runner.mjs`) actually exists at
that root. If not, fall back to `command fgos "$@"` /
`command fgos-runner "$@"` (the real PATH binary, i.e. a global install if
one exists). If that also fails, surface a clear error in the same style
as the existing "not a git repository" case — never the raw Node
`Cannot find module` trace this produces today.

Alternatives rejected: document as an accepted trade-off, matching the
linked-worktree precedent already settled in `docs/specs/distribution.md`
Edge Cases Settled — rejected because the user explicitly chose the code
fix over a documentation-only answer (see CONTEXT.md D2, direct
AskUserQuestion answer, not defaulted).

## Risk map

| Component | Risk | Proof point (→ fgos-coding-validating) |
|---|---|---|
| `.fgos-runner.json` → `.fgos/config.json` path move | Medium — existing code/tests reference the old path (`src/setup/checks.mjs:156`, `src/runner/dispatch.mjs`'s `ensureRunnerConfig`, `test/setup/*.test.mjs`) | Grep every reference to `.fgos-runner.json` across `src`/`test` before changing; confirm the old-path fallback read is real in the diff, not just described here |
| New global config (`~/.fgos/config.json`) merge precedence | Medium — brand-new code path, no test exists today | A test asserting a project-set value wins over a global-set value for the same key |
| New doctor check (config awareness) | Low — additive, read-only per RUL9 | `fgos doctor` output includes the new check id; check never writes a file even when reporting "not configured" |
| Shell fallback (D2) | Medium — touches the function everything else (including `fgos doctor` itself, from a dev checkout) depends on to run at all | Add the untested 3rd case to `test/scripts/fgos-shell-integration.test.mjs`: real git repo, not forgent, no `bin/fgos.mjs` → fallback invoked (or the new clear error, if no PATH binary exists) |
| `docs/specs/distribution.md` Data Dictionary #7 / RUL11 note drift | Low-medium — spec today states exactly 3 fixed checks | Update Data Dictionary #7's row to include the 4th check; note the literal-3 assumption is now stale, without claiming `tsk-2cs`'s registry work is done |

**impact-analysis: full** — GitNexus registered and `present`, confirmed via
`fgos tool query --capability impact-analysis --status present` during
`fgos-coding-exploring`. Before editing `scripts/fgos-shell-integration.sh`,
`src/setup/checks.mjs`, or `src/runner/dispatch.mjs`'s `ensureRunnerConfig`,
run `impact()` on each touched symbol per the CLAUDE.md/AGENTS.md gate and
report the blast radius before editing, exactly as those rules require.

## Files likely touched

- `scripts/fgos-shell-integration.sh` — D2 fallback logic
- `test/scripts/fgos-shell-integration.test.mjs` — new 3rd-case test
- `src/setup/checks.mjs` — new doctor check, updated project config path
- `src/setup/config-merge.mjs` — read, and possibly reused for the
  global-vs-project precedence logic (not necessarily changed)
- `src/runner/dispatch.mjs` — `ensureRunnerConfig`, if it references
  `.fgos-runner.json` directly (needs confirming with `impact()` during
  executing — flagged as an unproven assumption below)
- `test/setup/*.test.mjs` — new/updated coverage for the new path, the new
  doctor check, and merge precedence
- `docs/specs/distribution.md` — Data Dictionary #7 update
- `docs/coexistence.md` — likely untouched; that doc governs
  fgOS-vs-other-harness territory, a different concept from
  global-vs-project fgOS (CONTEXT.md's pinned distinction) — confirm no
  touch is actually needed once executing starts

## Order

`fgos graph --json` shows `tsk-2ta` as an isolated single-item component
with no registered deps, and it does not appear in `criticalPath` or
`topUnblock` — no graph signal to order by. Sequencing below is by risk
instead:

1. **D2 first** — smallest, most isolated (one script + one test file),
   zero collateral on the config-file surface.
2. **D1 second** — larger, touches more shared surface
   (`src/setup/`, `src/runner/`, multiple test files); benefits from D2
   already landed and stable underneath it.

## Split decision

No split. The product owner already decided
(`docs/distribution-vision.md` §3, verbatim: "Gộp vào scope `tsk-2ta`
(không tách item riêng)") to keep D2 bundled with D1 in one item rather
than spinning it out separately. Per the standing rule that a verified
user decision is not reversed without new evidence, this plan does not
re-litigate that call — D1 and D2 proceed as two ordered steps inside one
item, not two items.

## Verify command

```
npm test
```

Full suite — this item touches `src/setup/`, `src/runner/`, and
`scripts/`, each already covered by existing tests that must stay green
(AGENTS.md DoD question 5).

## Assumptions (pending fgos-coding-validating proof)

- The old `.fgos-runner.json` is read as a fallback (never deleted) until
  a project re-runs `fgos setup`, which is what actually performs the
  file move — an implementer-level detail CONTEXT.md correctly left open,
  pinned here rather than re-asked.
- `src/runner/dispatch.mjs`'s `ensureRunnerConfig` references the same
  config path — not yet confirmed by a direct read at planning time,
  flagged here as unproven for `fgos-coding-validating` to check before
  executing starts.
