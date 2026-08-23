# CONTEXT: long-work-item-ids (tsk-3tk)

## Feature boundary

Investigate why some fgOS work items are created with unusually long ids
that look like an encoded/slugified title (e.g.
`choke-point-createworktree-callsite-wrapper`,
`bo-hardcode-ten-trunk-main-trong-merge-e-5i0`), and close the gap so
`fgos add` refuses to create one going forward. This item covers
diagnosis + the guard rail only — it does not touch `fgos submit`'s
existing short-id generator, and it does not rewrite or migrate any
existing long id already in `.fgos/events.jsonl`.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope is report + fix (not report-only). See root cause below. |
| D2 | Fix shape is a hard reject: add a max-length check to `validateWorkShape` (`src/state/work.mjs`) alongside the existing `ID_PATTERN` kebab-case check, so `fgos add` refuses an over-long id at write time. Exact threshold value and its justification is left to `fgos-coding-planning`. |

## Root cause (scout evidence)

- `fgos add <id> ...` (`bin/fgos.mjs:682-760`) takes `id` straight from the
  caller's positional argument (`positional[0] ?? flags.id`, line 683) —
  no auto-generation, no length cap.
- `src/state/work.mjs:22`: `ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/`
  only enforces kebab-case shape, no length bound.
- By contrast, `fgos submit` (`bin/fgos.mjs:770+`) derives a title via
  `deriveTitle` (`src/intake/classify.mjs:20`, capped at
  `TITLE_MAX_LENGTH = 60`) and then a **separate**, always-short id via
  `generateId` (`src/intake/classify.mjs:115-128`): fixed `tsk-` prefix +
  a 3-8 char base36 hash suffix, so `submit`-created ids are always
  ≤ 12 chars.
- There is no `encode(title)` function anywhere in the codebase
  (`grep -rn "encode" src bin` and a scan for slugify/generateId-style
  helpers found only `generateId`, which is short-id-only). The long ids
  are the literal, caller-typed result of writing the full title (or a
  slugified version of it) directly into `add`'s id argument.
- Confirmed via a scan of `.fgos/events.jsonl` `work.add` events with
  `payload.id.length > 20`: 8 such items exist today, none carry a
  `writer` field (unlike later `work.move` events on the same ids), e.g.:
  - seq 1: `bo-hardcode-ten-trunk-main-trong-merge-e-5i0` (2026-07-16)
  - seq 750-752: `choke-point-take-vs-pick-claim-eligibility`,
    `choke-point-workingtree-clean-duplication`,
    `choke-point-createworktree-callsite-wrapper` (2026-07-29)

## Fix safety (scout evidence)

- `validateWork`/`validateWorkShape` is called from exactly two write
  paths in `src/state/store.mjs`: `addWork` (line 155) and `patch` (line
  227). Neither replay (`listWork` → `rebuildView`, `store.mjs:750`) nor
  any fold path calls `validateWork` — confirmed by grep; the codebase's
  own comment at `store.mjs:171` states "legacy events replay untouched
  (R11)" for a prior schema-adjacent change, the same discipline this fix
  relies on.
- Consequence: adding a max-length check to `validateWorkShape` only
  blocks **new** `fgos add` calls. The 8 existing long-id items keep
  replaying and functioning exactly as before — nothing about this fix
  touches, migrates, or invalidates them.

## Pinned terms

- "long id" in this item's scope = a `work.id` created via `fgos add`
  that is the full (or near-full) title text turned into a kebab-case
  string, as opposed to a short deliberately-chosen identifier or a
  `submit`-generated `tsk-<hash>` id.

## Deferred (out of scope)

- Migrating/renaming the 8 existing long ids — not requested, and
  renaming a work id has graph-wide ripple (deps/parent references) this
  item does not take on.
- Changing `fgos submit`'s id generation — already short, not implicated.
- A `--id` convenience/suggestion feature for `add` (e.g. auto-deriving a
  short id when `--id` is omitted) — not asked for; `add` requiring an
  explicit id is existing, intentional behavior per its own error message.

## Canonical references

- `bin/fgos.mjs:682-760` — `add` verb.
- `src/state/work.mjs:22,122-129` — `ID_PATTERN`, `validateWorkShape`.
- `src/intake/classify.mjs:20-36,115-128` — `deriveTitle`, `generateId`
  (the `submit`-only short-id path, for contrast).
- `src/state/store.mjs:139-179,181-230` — `addWork`, `patch` (the only two
  `validateWork` call sites).
- `.fgos/events.jsonl` — evidence log (8 long-id `work.add` events).

## Outstanding questions for planning

- Exact max-length threshold for the new check, and its justification
  (e.g. relative to `generateId`'s ≤12-char output, or to
  `TITLE_MAX_LENGTH = 60`, or an independent number).
- Exact rejection error message wording (mirror `ID_PATTERN`'s existing
  error message style at `work.mjs:129`).
- Whether a test fixture/unit test belongs in `test/state/work.test.mjs`
  or a new file, and whether an e2e-level `fgos add` CLI test is also
  warranted.
