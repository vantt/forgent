# Research — tsk-3hp

## Round 1 — 2026-08-23 (discovery)

**Asked:** Does `domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md`
(fgos-coding-planning's Step 5 doc) really define a sync step for `verify`
but nothing equivalent for `action`/`footprint` on pass-through (non-split)
items? Does `buildPrompt` actually render placeholders when those fields
are absent? Is `action` really settable only via the decompose path (D1 of
tsk-3xd)?

**Checked:**
- `domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md`
  (full read) — defines "Sync a pass-through item's own `verify` field" and
  "Sync a split root item's own `verify` field". No section syncs
  `action`/`footprint` for a pass-through item anywhere in the file.
- `domains/coding/skills/fgos-coding-planning/SKILL.md` Step 5 — confirms
  the doc above is the full mechanics for that step; Step 4 (split) is the
  only place `action`/`footprint` are written, and only into split-child
  specs (`references/split-and-child-specs.md:28-45` — both fields
  mandatory there, but only for split children materialized at the gate).
- `src/runner/dispatch/prepare.mjs:91-102` (`buildPrompt`) — confirmed:
  `action = typeof work.action === 'string' && work.action.trim() ? work.action : '(không có)'`;
  `readFirst` derived the same way from `work.footprint`. An item with
  neither field set renders both placeholders verbatim in the worker
  prompt, exactly as tsk-577p's evidence describes.
- `docs/history/tsk-3xd-decompose-child-directive-prose/CONTEXT.md` D1/D3 —
  `action`+`footprint`("read_first") wiring was scoped to `decompose.mjs`
  only (`normalizeChild`/`addWork`, the split-children path). The manual
  `fgos add --parent` path and, by the same reasoning, the plain pass-through
  (no-split) path were explicitly never wired.
- `src/cli/command-registry.mjs:284-309` (`edit` command spec) — `footprint`
  IS an editable field on `edit`. `action` is NOT listed among edit's
  parameters at all.
- `bin/fgos.mjs` `case 'edit'` (~line 1619) — the scalar-field allowlist
  patched by `edit` is `['title', 'description', 'kind', 'risk', 'verify',
  'tier', 'urgent']` — `action` is absent from this allowlist too, and
  `footprint` is patched separately via the list-field loop
  (`['refs', 'deps', 'footprint']`).
- `src/state/work.mjs:608-618` — `action` IS already a validated schema
  field (`touched('action')`, non-empty-string check) — the validation
  exists; only the CLI's `edit` verb never exposes a way to set it on an
  already-created item.

**Found:** The claimed gap is real for `footprint` (no sync step exists;
CLI already supports fixing it via `fgos edit --footprint`) but the gap is
one layer deeper for `action`: there is currently NO way at all — CLI or
otherwise — to set `action` on an existing item outside the decompose
child-creation path, since `edit` never exposed it despite the schema
already validating it. Adding `--action` to `edit`'s parameters (mirroring
the existing `footprint` scalar-field pattern exactly, same shape as
`title`/`description`) is a small, precedented, additive CLI change with
no schema/validation work left to do.

**Still open:** none — this is a normal implementation-approach decision
(how to expose the already-valid `action` field through `edit`), not a
product/scope question. Left for `fgos-coding-planning`'s Approach step to
detail (files touched: `src/cli/command-registry.mjs`, `bin/fgos.mjs`,
`domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md`).

**Verdict:** clear. Verify proposed: `npm test` (whole-suite regression —
the fix spans a CLI parameter addition plus a skill-reference doc, no
existing single test file targets this gap yet).
