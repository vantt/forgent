# tsk-4iv — `fgos uninstall`

**Stage:** clarify (fgos-coding-exploring). **Date:** 2026-08-01.

## Feature boundary

Add a new `fgos uninstall` verb that reverses what `fgos setup` (and the
project's own git-hooks wiring, `src/setup/git-hooks.mjs`) put in place —
shell-rc source line, `core.hooksPath`/`.githooks` wiring, and the
installed package itself — while **never** touching fgOS's own data or
config. This item belongs to the distribution/install-setup-doctor
cluster (`docs/distribution-vision.md`, `docs/specs/distribution.md`),
which today has **no uninstall branch** among its 7 pillars — this item is
the first one.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `fgos uninstall` actually removes the installed fgOS package via the detected package manager (npm/pnpm/yarn) — not just fgOS's own wiring. Chosen over a wiring-only reading of "gỡ bin" because `docs/specs/distribution.md`'s Install behavior supports all 3 managers symmetrically, and the item text says "gỡ bin" (remove the bin), not "gỡ wiring". |
| D2 | `.githooks/pre-commit` (and the `.githooks/` dir, if left empty afterward) is deleted only when `core.hooksPath` is still exactly `.githooks` at uninstall time — mirrors `installGitHooks`'s own fill-only detection in `src/setup/git-hooks.mjs` (never touches a hooksPath the caller repointed elsewhere). Any other value (custom, or already changed) is left completely untouched. |
| D3 | `fgos uninstall` requires explicit confirmation before running — it touches shell profiles, git config, and removes the installed package, so unlike `setup`/`doctor --fix` (which run immediately, no prompt), this one must not run silently. Exact confirmation UX (flag vs interactive prompt) is left to `fgos-coding-planning`. |
| D4 | (added at `fgos-coding-validating`, mid-planning gap) `fgos uninstall` does **not** delete the fgOS shell-rc source line itself — it only detects it and reports its rc file + path, instructing the human to remove it by hand. This keeps the item consistent with the already-locked `docs/history/shell-rc-dead-source-lines/CONTEXT.md` D1 ("fgOS never edits an rc file to remove a line — deletion stays a human act") rather than carving out an exception to it. D1 itself is not reopened or amended. |

## Pinned constraint (from item text, not re-asked)

`fgos uninstall` MUST preserve fgOS's own data and config: `.fgos/` data,
`~/.fgos/config.json`, and the project-level `config.json`. This is
already explicit in the item description, not a gray area — locked as a
hard constraint, not a D-decision.

## Scout evidence

- `fgos setup` (`bin/fgos.mjs:2704` case `'setup'`) has exactly 3 side
  effects today: (1) insert the shell-rc source line pointing at
  `scripts/fgos-shell-integration.sh` into detected bash/zsh profiles
  (`src/setup/shell-rc.mjs`), (2) fill missing default keys into
  `.fgos/config.json` (`src/setup/config-merge.mjs`,
  `ensureSharedConfigDefaults`), (3) fill-only set
  `core.hooksPath=.githooks` (`src/setup/git-hooks.mjs`,
  `installGitHooks` — never overwrites a pre-existing custom hooksPath).
  These are the only wiring surfaces uninstall has to reverse beyond the
  package removal itself.
- `installGitHooks`'s own docstring already states the fill-only
  contract ("a pre-existing `core.hooksPath` pointing anywhere OTHER than
  `.githooks`... is left untouched") — D2 mirrors this exact rule for
  deletion, so "owned by fgOS" is defined consistently between install
  and uninstall.
- `.githooks/` in this repo today holds only the one fgOS-authored
  `pre-commit` file (`git log --follow` traces it to
  `1f7a0e4 feat(str65-worktree-isolation-enforcement-5)`).
- `docs/specs/distribution.md` Data Dictionary #3 (Distribution file
  allowlist) does **not** include `.githooks/` — it is never shipped to
  downstream installs; the git-hooks wiring is scoped to whichever repo
  `fgos setup` is actually run inside (source repo contributors today;
  potentially any project once the file is authored there too — out of
  scope for this item to resolve).
- `docs/specs/distribution.md` Install behavior: the installer's package
  manager can be npm, pnpm, or yarn (all 3 supported symmetrically) —
  cited as the basis for D1 not special-casing npm only.
- `docs/distribution-vision.md` §6/§7: `tsk-4bc`'s MVP formally targets
  only `tsk-3nx`, `tsk-4c05`, `tsk-3uj`, `tsk-2jc` — **tsk-4iv is not
  among them**, despite the item description calling it "related to
  tsk-4bc (MVP umbrella)". Noted as a metadata discrepancy, not asked
  about — it doesn't change this item's own scope or acceptance
  criteria, only its relationship to the MVP rollup.
- Impact-analysis capability posture: **full** (`gitnexus` present,
  `fgos tool query --capability impact-analysis --status present`).

## Flagged for `fgos-coding-planning` (not decided here — implementation/architecture)

- How a running process reliably removes its own package's files across
  npm/pnpm/yarn and OSes (Windows file-locking risk in particular) —
  this is an architecture concern belonging to planning, not exploring.
- Exact confirmation UX (`--yes`/`--force` flag vs interactive prompt) —
  D3 only locks that confirmation is required, not its shape.
- Package-manager detection mechanism when uninstall runs (lockfile
  sniffing, `npm_config_user_agent`, etc.) — implementation detail.

## Canonical references

- `docs/distribution-vision.md` (7 pillars, no uninstall pillar yet)
- `docs/specs/distribution.md` (Install/Setup/Doctor behaviors, Data
  Dictionary)
- `src/setup/git-hooks.mjs` (`installGitHooks`, `mainCheckoutHookWired`)
- `src/setup/shell-rc.mjs`, `src/setup/config-merge.mjs`
- `bin/fgos.mjs` case `'setup'` (`:2704`)
