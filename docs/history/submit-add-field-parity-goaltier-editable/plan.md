# plan.md — submit/add field parity + goalTier editability (tsk-5fs)

Decisions: `CONTEXT.md` D1 (submit gains add's field parity), D2 (goalTier
editable via `fgos edit`, both `EDITABLE_FIELDS` and the `edit` CLI case's
flag parsing).

## Mode gate

Flags counted:
- public contracts — **yes**: `submit`/`edit`/`add` are the CLI's
  public write doors; this extends their flag surface.
- existing covered behavior — **yes**: `bin/fgos.mjs`'s `submit`/`edit`
  cases and `submitWork`'s `refs: []` default are already exercised by
  `test/cli/fgos.test.mjs` and `test/e2e/self-improve-loop.test.mjs`
  (`evolve --submit` calls `submitWork(dir, describeCandidate(picked))`
  with no third `opts` arg — see Risk map below).
- multi-domain — **yes**: `CONTEXT.md`'s feature boundary states both
  fixes apply to every domain, not just `coding`.
- auth / authorization / data model / audit-security / external systems /
  cross-platform / weak proof / spike-shaped — no. `goalTier`'s validation
  domain (`GOAL_TIERS`) and shape are unchanged; only its editability and
  submit's field surface move.

3 flags, no hard-gate flag → **standard**.

## Approach

Two small, related fixes, one item (no split — see below).

**D1 — submit field parity** (`bin/fgos.mjs`, `submit` case ~L924-956 and
`submitWork` ~L685-750):
- The `submit` case's `opts` object gains the same six fields `add`
  already exposes, each following `add`'s own existing pattern exactly
  (cited in `CONTEXT.md`'s scout evidence, `bin/fgos.mjs:801-900`):
  `refs`/`parent`/`footprint`/`goalTier`/`targets`/`urgent`, using
  `parseListFlag`/`optionalField` the same way `add`'s own flags do.
- `submitWork`'s `work` object currently hardcodes `refs: []` (L708) and
  has no `parent`/`footprint`/`goalTier`/`targets`/`urgent` keys at all —
  these need to be threaded from `opts`, mirroring how `deps: opts.deps ??
  []` (L704) already threads `opts.deps`. `refs` moves from hardcoded `[]`
  to `opts.refs ?? []` (same default-to-empty shape as `deps`); the other
  five follow the present-or-absent shape `add` already uses for
  `footprint`/`goalTier`/`targets` (`flags.x === undefined ? undefined :
  ...`).
- No new validation: `work.mjs`'s `validateWorkShape` is already the
  single source for every one of these fields' shape/domain rules (D6 in
  `add`'s flag comments) — `submit`/`submitWork` never duplicates that.

**D2 — goalTier editable** (`src/state/store.mjs` L228, `bin/fgos.mjs`
`edit` case ~L1150-1163):
- `store.mjs`'s `EDITABLE_FIELDS` Set gains `'goalTier'` — one entry.
  `editWork`'s existing `validateWork(candidate, ...)` call already
  re-validates the full merged candidate on every edit (confirmed by
  reading `store.mjs` L260-283), so `GOAL_TIERS` domain checking needs no
  new guard code — same precedent `parent`'s own addition to
  `EDITABLE_FIELDS` already set (store.mjs's own comment on the cycle
  guard, L292-299).
- `bin/fgos.mjs`'s `edit` case's simple same-name loop (`['title',
  'description', 'kind', 'risk', 'verify', 'tier', 'urgent']`, direct
  `flags[field]` lookup) cannot take `goalTier` as-is — the flag is
  `--goal-tier` (kebab, two words) but the patch key is `goalTier`
  (camelCase); the loop's `field` variable serves as both today, which
  only works for single-word fields. Needs its own one-off block, the
  exact pattern the same case already uses for `--docs-ref` →
  `patch.docsRef` (L1150-1163 region, `if (flags['docs-ref'] !==
  undefined) { patch.docsRef = optionalField(flags['docs-ref'], ...); }`)
  — same shape, `goal-tier`/`goalTier` substituted in.

**No split**: `fgos graph --json` shows tsk-5fs on neither `criticalPath`
nor `topUnblock` — it blocks no other open item, so ordering against the
rest of the backlog doesn't apply. Both fixes are small (each under ~15
lines), touch the same two files, share one theme (item creation/edit
field surface), and already share one proven functional verify
(`verify.sh`, written and confirmed to fail at the right point during
`fgos-coding-exploring`). Splitting would only add a `parent`-linked second item
for no real isolation benefit.

## Risk map

| Component | Risk | Proof point (for fgos-coding-validating) |
|---|---|---|
| `submitWork`'s `refs: []` → `opts.refs ?? []` | medium — this is the one line every existing `submit`/`evolve --submit` caller already depends on | `test/e2e/self-improve-loop.test.mjs`'s `evolve --submit` path calls `submitWork(dir, describeCandidate(picked))` with no 3rd `opts` arg (confirmed by reading `bin/fgos.mjs:3259`) — `opts.refs` is `undefined` there, so `opts.refs ?? []` stays byte-identical to today's hardcoded `[]`. Full `npm test` run is the actual proof. |
| `submit` case's 6 new flags | low — additive, mirrors `add`'s already-shipped pattern verbatim | `verify.sh`'s D1 assertions (submit round-trip) |
| `edit` case's new `--goal-tier` one-off block | low — mirrors the existing `--docs-ref` block verbatim | `verify.sh`'s D2 assertions (edit round-trip) |
| `store.mjs` `EDITABLE_FIELDS` addition | low — one Set entry, validation already generic | `verify.sh`'s D2 assertions |
| Cross-domain effect | low — every touched field (`refs`/`parent`/`footprint`/`goalTier`/`targets`/`urgent`) is domain-agnostic in `work.mjs` | none needed beyond the above; no domain-specific branch exists in this code |

Impact-analysis capability posture: **full** (`fgos tool query
--capability impact-analysis --status present` → GitNexus `present`,
checked fresh this session). `fgos-coding-implement` at `executing` must run
`impact({target: "submitWork", direction: "upstream"})` and `impact({target:
"editWork", direction: "upstream"})` before editing either, per this
project's own GitNexus gate (`AGENTS.md`) — not performed here, planning
only records the requirement and the posture that makes it non-optional.

## Shape (standard)

**Phase 1 — D2 (goalTier editable).** Smaller, self-contained, no
cross-caller risk.
1. `src/state/store.mjs`: add `'goalTier'` to `EDITABLE_FIELDS`.
2. `bin/fgos.mjs` `edit` case: add the `--goal-tier` one-off block
   (mirrors `--docs-ref`).
3. Run `verify.sh`'s D2 half manually (or the whole script, D1 will still
   fail until Phase 2) to confirm the edit round-trip.

**Phase 2 — D1 (submit field parity).**
1. `bin/fgos.mjs` `submit` case: add the 6 new `opts` fields.
2. `bin/fgos.mjs` `submitWork`: thread `opts.refs ?? []` (replacing the
   hardcoded `[]`) and the 5 new present-or-absent fields into the `work`
   object.
3. Run `verify.sh` in full — both D1 and D2 assertions must pass.

**Concrete cases to prove** (standard-mode depth): the six new submit
flags all present at once (verify.sh's own scenario); a `submit` call with
none of the six flags (must stay byte-identical to today — no field
present, `refs: []`); an `edit --goal-tier` call on an item that already
has a `goalTier` (overwrite, not just first-set); a `edit --goal-tier
invalid-value` call (must still reject via the existing `GOAL_TIERS`
validation — no new guard, so this is really "did we accidentally bypass
`validateWork`", not a new rule).

## Assumptions

- The `edit` case's existing `--docs-ref` one-off block is the correct
  precedent to mirror for `--goal-tier`, rather than trying to force it
  into the same-name simple loop — pinned here as implementation-only
  (not material to `CONTEXT.md`'s decisions), confirmed by direct reading
  of `bin/fgos.mjs`'s `edit` case, not a guess.
