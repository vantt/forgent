# Plan — tsk-3hp

Mode: standard

No `CONTEXT.md` exists for this item — discovery verdict was `clear`
(`fgos discover --verdict clear`), so `exploring` was skipped. Every claim
below traces to `RESEARCH.md`'s Round 1 (discovery-stage research) instead
of a locked D-id.

## Lane

2 flags apply from `fgos-routing`'s Mode gate: public contract touched
(the `fgos edit` CLI surface every skill/worker relies on) and existing
covered behavior touched (`test/cli/fgos-edit.test.mjs`, `test/state/
store.test.mjs` already exercise the allowlist door this item extends).
2 flags → **standard**, matching the item's own `risk: standard`.

`fgos graph --json`: tsk-3hp is not on `criticalPath` and `topUnblock` is
empty for it — no ordering constraint from other in-flight work.

Impact-analysis posture: **full** — `fgos tool query --capability
impact-analysis --status present` returned GitNexus `present`. No
medium/high entry appears in the risk map below, so no blast-radius proof
point is required this round (Approach's own rule: only medium/high
entries need one).

## Approach

**Chosen path.** Close the gap in two layers, both real per RESEARCH.md:

1. `footprint` already has a working edit path (`fgos edit --footprint`)
   but no step in `fgos-coding-planning` ever calls it for a pass-through
   item. `action` has NO edit path at all today — the field is already
   schema-valid (`src/state/work.mjs:608-618`, `touched('action')`) but
   `edit`'s own allowlist (`src/state/store.mjs:280` `EDITABLE_FIELDS`,
   `bin/fgos.mjs`'s `case 'edit'` scalar-field loop, `src/cli/command-
   registry.mjs`'s `edit` parameter spec) never exposes it — three call
   sites, same shape as the existing `title`/`description` scalar fields.
2. Add a "Sync a pass-through item's own `action`/`footprint` fields"
   section to `domains/coding/skills/fgos-coding-planning/references/
   verify-sync-and-gap.md` (the canonical source per `assembleSkills`,
   `src/setup/skill-wrappers.mjs:183-223` — `.agents/skills/`, `.claude/
   skills/`, `plugins/fgOS/skills/` are all generated copies), mirroring
   the existing verify-sync section's exact shape: for a pass-through
   item only, once Approach/Shape name the files touched, sync `footprint`
   from that file list and `action` from a directive sentence citing
   `plan.md`, unless the item already carries a real, distinct value for
   either — never overwrite a deliberately-set one. One-line update to
   `SKILL.md`'s own Step 5 prose to mention both fields, not just verify.
   Regenerate the three copies with `node scripts/build-skill-wrappers.mjs`
   (`npm run build:skills`).

**Alternatives rejected:**
- Fixing only `footprint`, leaving `action` unaddressed — rejected: the
  `buildPrompt` Directive line (`src/runner/dispatch/prepare.mjs:100`)
  would still render `(không có)` for any pass-through item with no
  D-id-citing action, half-closing exactly the cold-pickup risk tsk-577p's
  evidence describes.
- Mechanically deriving `action` prose from `plan.md`'s Approach section
  instead of a real CLI edit path — rejected on the same reasoning
  `tsk-3xd`'s D2 already used to reject this for split children
  (`docs/history/tsk-3xd-decompose-child-directive-prose/CONTEXT.md`):
  no reliable 1:1 mapping from variable-length Approach prose to one
  directive sentence; brittle across tiny/standard/high-risk modes.

**Risk map:**

| Component | Risk | Proof |
|---|---|---|
| `src/state/store.mjs` `EDITABLE_FIELDS` (+`'action'`) | light | `npm test` (existing `test/state/store.test.mjs` covers the allowlist door) |
| `src/cli/command-registry.mjs` `edit` params (+`action`) | light | `npm test` |
| `bin/fgos.mjs` `case 'edit'` scalar loop (+`'action'`) | light | `npm test` + manual positive: `fgos edit <id> --action "x"` then `fgos list --id <id> --json` shows it |
| `verify-sync-and-gap.md` / `SKILL.md` prose (+ new section) | light | doc-only, no runtime path; regenerated-copy check (`node scripts/build-skill-wrappers.mjs` reports the same 3 files re-synced, nothing else drifts) |

No medium/high entries — additive, precedented (mirrors the existing
`footprint` field's own shape exactly), no schema change, no new
validation.

**Files touched, in order:**
1. `src/state/store.mjs` — add `'action'` to `EDITABLE_FIELDS`.
2. `src/cli/command-registry.mjs` — add `action` to `edit`'s `parameters`
   and its description string.
3. `bin/fgos.mjs` — add `'action'` to the `case 'edit'` scalar-field loop.
4. `domains/coding/skills/fgos-coding-planning/references/
   verify-sync-and-gap.md` — new pass-through `action`/`footprint` sync
   section.
5. `domains/coding/skills/fgos-coding-planning/SKILL.md` — Step 5 prose,
   one line.
6. `node scripts/build-skill-wrappers.mjs` — regenerate `.agents/skills/`,
   `.claude/skills/`, `plugins/fgOS/skills/` copies.
7. `test/cli/fgos-edit.test.mjs` — new case(s) for `--action`.

## Shape

**Phase 1 — schema/CLI plumbing.** `EDITABLE_FIELDS` + command-registry.mjs
+ bin/fgos.mjs. Proof: `npm test`, plus a manual positive
(`fgos edit <id> --action "x"` succeeds and round-trips through
`fgos list --id <id> --json`) and a manual negative (empty string still
rejected, same non-empty-string validation `description` already gets from
`work.mjs`).

**Phase 2 — planning-skill sync step.** New section in
`verify-sync-and-gap.md` (mirrors the existing verify-sync section's
structure: check-if-placeholder-or-absent, sync-if-so, skip-if-real-value-
already-set), one-line `SKILL.md` Step 5 update, regenerate the three
generated copies.

**Phase 3 — regression test.** Extend `test/cli/fgos-edit.test.mjs`:
`--action` patches the field; an empty `--action ""` is rejected the same
way `--description ""` is (non-empty-string validation); `--footprint`/
other existing flags are unaffected (no regression in the same file).

**Concrete cases to prove:**
- Empty/boundary: `fgos edit <id> --action ""` → rejected (validation),
  matching `description`'s existing empty-string behavior.
- Existing behavior must not regress: `--footprint`, `--verify`, and the
  `kind`-only-editable-at-`todo` constraint (hit live during this item's
  own discovery pass) stay exactly as they are today.
- Concurrent access / partial failure: not applicable — pure allowlist +
  parameter-spec addition, no new concurrency surface.

## Outstanding questions

None
