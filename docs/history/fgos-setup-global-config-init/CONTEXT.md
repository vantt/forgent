---
type: context
title: fgos setup initializes global config (tsk-1ri)
timestamp: 2026-08-08T07:59:00.000Z
---

# fgos setup initializes global config

## Feature boundary

Pillar 6 of `docs/distribution-vision.md` (global/project/dev-checkout
coexistence) is already implemented and wired into real runtime by
`tsk-2ta` — see `docs/history/global-project-config-awareness/CONTEXT.md`
and the shaping discussion that led here,
`docs/history/fgos-plugin-cli-resolution/DISCUSSION.md#task-setup-init-global-config`.
`src/config/global-config.mjs` reads `~/.fgos/config.json` and merges it
with project config (project always wins per key), wired into
`src/runner/dispatch.mjs`'s `loadRunnerConfigFromDir`/
`ensureRunnerConfigForDir` — the real path every `fgos`/`fgos-runner`
invocation uses. A doctor check (`config-awareness`) reports which level
is active.

The one real gap: `fgos setup` never writes/initializes
`~/.fgos/config.json` — only `doctor` reads it (read-only). A user who
wants a global config has no guided or automated way to get one; they
would have to hand-write the file themselves, undocumented.

This item closes that gap: `fgos setup` initializes `~/.fgos/config.json`
the same way it already initializes the project-local shared config file,
plus refreshes `docs/history/global-project-config-awareness/CONTEXT.md`'s
stale "Chưa làm" section (it currently claims this wiring is undone, which
is now known false — the runtime wiring itself was already real before
this item started; only the `setup`-writes-global piece was the actual
gap).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `fgos setup` writes the FULL default shape into `~/.fgos/config.json` on init — the same shape `assembleRegistryDefaults()` produces, the same shape `ensureSharedConfigDefaults` already writes for the project-local `.fgos/config.json`. Not an empty `{}` placeholder. Fill-missing-only discipline (`mergeConfigDefaults`) applies uniformly at BOTH levels — a value already present (global or project) is never overwritten, only genuinely-missing default keys get added. |
| D2 | `fgos setup` initializes/updates `~/.fgos/config.json` on EVERY run, unconditionally — no `--global` flag gate. Matches `fgos setup`'s existing "always attempts its work, never asks first" contract (`docs/specs/distribution.md` Setup Behaviors, RUL10), now extended to the global level as well as the project level it already covers. |

## Pinned terms

- **global config** — `~/.fgos/config.json` (`os.homedir()`-relative,
  `src/config/global-config.mjs`'s `defaultGlobalConfigPath()`). Read by
  `loadGlobalConfig`, merged via `mergeWithGlobalConfig` (project wins),
  reported by the `config-awareness` doctor check. As of this item, also
  written by `fgos setup`.
- **project config** — `.fgos/config.json` at the resolved main-checkout
  root (`sharedConfigFilePath(dir)`). Already initialized/kept current by
  `fgos setup` via `ensureSharedConfigDefaults` — the existing pattern D1
  mirrors for the global file.
- **fill-missing-only** — `mergeConfigDefaults`'s existing contract
  (`src/setup/config-merge.mjs`): recursively fills any key present in
  defaults but absent from existing, never touches a key already present,
  at any nesting depth. Already the discipline both project-config init
  and global-vs-project merge use; D1 confirms it also governs
  global-config init itself, not a new/different discipline.

## Scout evidence

- `src/setup/registrations.mjs:161-171` — `ensureSharedConfigDefaults(dir)`,
  the existing project-local init pattern: read existing, compute
  `assembleRegistryDefaults()`, `mergeConfigDefaults`, write only when
  something changed or the file didn't exist. D1's global-init should
  mirror this shape (exact function/call-site left to `fgos-coding-planning`, not
  designed here).
- `src/config/global-config.mjs` — `loadGlobalConfig` (missing file → `{}`,
  not an error), `mergeWithGlobalConfig`, `describeConfigAwareness`. No
  write path exists here today — `fgos setup`'s gap is real, confirmed by
  `rg "GLOBAL_CONFIG_PATH|defaultGlobalConfigPath|~/.fgos" bin/fgos.mjs
  src/setup/*.mjs` returning zero hits before this item.
- `src/runner/dispatch.mjs:288,342` — `mergeWithGlobalConfig` already
  wired into the real `fgos`/`fgos-runner` read path; unaffected by this
  item, cited here only as the reason global config, once it exists, has
  real operational effect and is not merely diagnostic.
- `docs/specs/distribution.md` Setup Behaviors section — `fgos setup`
  "always attempts its work... a shell profile that does not exist is
  simply skipped rather than refused" — the existing unconditional-action
  contract D2 extends to the global level.
- `docs/history/global-project-config-awareness/CONTEXT.md` "Outstanding
  cũ" — explicitly names "Có cần `fgos setup` cũng ghi/khởi tạo
  `~/.fgos/config.json` hay chỉ `doctor` đọc read-only — chưa quyết" as an
  open question. D1/D2 above answer it. That doc's own "Chưa làm" section
  also needs a refresh (see Outstanding below) — it currently
  (incorrectly) still describes the `mergeWithGlobalConfig` runtime wiring
  as undone, which is stale as of `src/runner/dispatch.mjs:288,342`
  already being real.
- Impact-analysis capability gate: `fgos tool query --capability
  impact-analysis --status present` → GitNexus registered, `status:
  present`, but `tsk-1lg` (open, separate item) already flags the index as
  stale (434 commits behind). Posture: **degraded** — this item's
  implementer should re-run `impact()` on whatever symbol they touch
  (likely `ensureSharedConfigDefaults` or a new sibling function in
  `src/setup/registrations.mjs`) once the index is fresh, or cross-check
  with `rg` if a GitNexus answer looks suspicious, per `CLAUDE.md`'s gate.

## Canonical references

- `src/setup/registrations.mjs:161-171` (`ensureSharedConfigDefaults`,
  pattern to mirror)
- `src/config/global-config.mjs` (global config primitives, currently
  read-only)
- `docs/history/global-project-config-awareness/CONTEXT.md` (tsk-2ta,
  needs its "Chưa làm"/"Outstanding cũ" sections refreshed once this item
  ships)
- `docs/history/fgos-plugin-cli-resolution/DISCUSSION.md#task-setup-init-global-config`
  (the shaping discussion this item was scoped out of)
- `docs/specs/distribution.md` (Setup/Doctor behaviors, Data Dictionary —
  likely needs a line updated once `fgos setup` also writes global config)

## Outstanding questions deferred to planning

- Exact function/call-site shape for the global-config init (new sibling
  function next to `ensureSharedConfigDefaults`, or a parameterized
  version of it) — implementation choice.
- How `fgos setup`'s output reports global-level added keys (own message
  line, folded into the existing project-level message, etc.) —
  implementation/UX choice.
- Real `verify` command for this item — ordinary JS-behavior verify
  (`npm test` plus an explicit assertion that a fresh `HOME` gets
  `~/.fgos/config.json` populated by `fgos setup`, isolated the same way
  `test/config/global-config.test.mjs` already isolates `HOME` for its own
  tests, never touching the dev machine's real `~/.fgos/config.json`) —
  not the skill-prose POSITIVE/NEGATIVE shape, since this item's main
  change is JS behavior, not skill prose (the CONTEXT.md-refresh doc edit
  is a secondary, non-behavioral part of the same item).
- Exact wording of the refreshed `docs/history/global-project-config-awareness/CONTEXT.md`
  sections — content edit, left to whoever implements.
