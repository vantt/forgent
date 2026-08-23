# plan.md — fgos-edit-role-flag (tsk-34o)

Mode: high-risk (Mode-gate hard-gate flag: audit/security — this item is
specifically about `.fgos/events.jsonl`'s provenance-trust integrity, so
the flag applies regardless of how small the actual diff is; per
`fgos-routing`'s own Mode-gate table, any hard-gate flag forces high-risk
lane on its own, independent of flag count).

No `CONTEXT.md` exists for this item — discovery's own verdict was `clear`
(`docs/history/fgos-edit-role-flag/RESEARCH.md` Round 1), which skipped
`exploring` entirely, so this plan's decisions trace to that research round
directly, the same shape `fgos-coding-planning`'s own Bootstrap step
describes for a clear-verdict item.

## Approach

**Chosen path:** add an optional `--role human|session` flag to `bin/
fgos.mjs`'s `case 'edit'` (currently line 1833's `editWork(dir, { id,
patch, role: 'human' })`), mirroring `case 'take'`'s already-existing
pattern verbatim (lines 2771-2776):

```js
const role = optionalField(flags.role, 'edit --role requires "human" or "session" (omit --role entirely to default to human)') ?? 'human';
if (role !== 'human' && role !== 'session') {
  throw new StoreError('validation', `edit --role must be "human" or "session" (got "${role}").`);
}
```

then pass `role` (instead of the hardcoded literal) into the existing
`editWork(dir, { id, patch, role })` call. Default stays `'human'` —
**zero behavior change for every existing caller** that never passes
`--role` — same backward-compatibility shape `tsk-5dn`'s `decision --kind`
fix already used successfully.

**Alternatives considered and rejected:**

- *Change `edit`'s default to `'session'` instead of adding an opt-in
  flag.* Rejected: this would flip behavior for every real human
  interactively running `fgos edit` today (a person editing a field
  directly, e.g. via a terminal), silently mislabeling THEIR writes as
  non-human — the exact inverse integrity problem this item exists to
  fix, just aimed the other way. `take`'s own precedent — default `human`,
  explicit opt-in to `session` — exists precisely because the CLI cannot
  tell caller identity from context alone, so the safer default is the one
  that does not silently discredit a real person's own action.
- *Add a new, more general actor-provenance mechanism (e.g. reading an env
  var to auto-detect "is this an agent")* — considered per the item's own
  "or some other reliable actor-provenance signal" phrasing. Rejected for
  this item's scope: `RESEARCH.md` Round 1 found the store layer
  (`editWork`, `src/state/store.mjs:295`) already accepts a generic `role`
  param with **no special-casing** — the identical shape `take` already
  uses successfully. An explicit, caller-declared flag (same as `take`) is
  simpler, already proven in production, and is the same mechanism this
  codebase already chose for the identical problem — introducing a second,
  different mechanism (auto-detection) here would be inventing a new
  pattern where an existing one already fits.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| `bin/fgos.mjs`'s `case 'edit'` | Medium — shared CLI verb, Iron Law applies (module `bin/fgos.mjs` is Iron-Law-gated) | New CLI test asserting `--role session` round-trips into the stored `work.edit` event's `payload.role`, plus a regression test asserting the omitted-flag default is still `'human'` (mirrors `test/cli/fgos-decision-kind.test.mjs`'s own two-test shape for `tsk-5dn`) |
| Existing callers of `fgos edit` (every skill/script invoking it without `--role`) | Low — default unchanged | Existing `edit`-covering tests in the suite stay green with no edits; `npm test` full run |
| `src/state/store.mjs`'s `editWork` | None — already accepts a generic `role` param today, confirmed live at `bin/fgos.mjs:1290` (`case 'discover'`'s own `editWork(dir, { id, patch: classificationPatch, role: 'session' })` call) | No store-layer change needed; `RESEARCH.md` Round 1 citation is the proof, not a new test |
| Consumers reading `role==='human'` as a trust signal (blast radius of adding the opt-out) | None found | `RESEARCH.md` Round 1: grepped `src/` and `scripts/` for `payload.role`/`.role ===`; the only semantic consumer (`src/runner/anti-loop.mjs:132-154`, `visitsSinceLastHumanEvent`) reads only `work.move` events, never `work.edit` — confirmed by direct read of that function |

**Impact-analysis posture:** `degraded` — GitNexus is `present`
(`fgos tool query --capability impact-analysis --status present`) but its
index is stale (last indexed `7bb3231`, flagged by this session's own
tool hooks), so its blast-radius answer would be weak evidence on its own.
Per `CLAUDE.md`'s gate, cross-checked instead with direct `grep`/`Read` of
every real `.role`/`payload.role` reference in `src/` and `scripts/`
(`RESEARCH.md` Round 1) — a suspicious "zero real consumers" result is
exactly the kind CLAUDE.md's gate says is worth double-checking, and it
was, by reading `anti-loop.mjs`'s actual body rather than trusting the
grep count alone.

**Files touched:**

- `bin/fgos.mjs` — add `--role` flag handling to `case 'edit'` (~5 lines,
  same shape as `case 'take'`'s existing block)
- `test/cli/fgos-edit-role.test.mjs` (new, or an existing `fgos-edit`
  test file if one already covers this verb — check before creating a new
  one) — cover `--role session` round-tripping and the unchanged default

## Shape

One honest piece, no split. This is the smallest possible fix for the gap
named in the item: expose the flag the store layer already accepts,
default unchanged, mirroring an already-proven pattern (`take --role`)
verbatim. Nothing about this item calls for more than one commit.

**Sketch of cases to prove** (scaled to `high-risk`'s fuller-map
expectation, even though the change itself is small):

- `--role session` round-trips into the stored event's `payload.role`
  (the new behavior).
- Omitting `--role` still produces `payload.role === 'human'` (regression
  guard on the unchanged default — this is the one that matters most,
  since silently flipping the default would be the actual security
  regression this item must not introduce).
- An invalid `--role` value (anything other than `human`/`session`) is
  rejected the same way `take --role` already rejects one — exit
  `validation`, no event written.
- Existing `fgos edit` callers with no `--role` flag anywhere in the
  codebase (skills, scripts) are unaffected — provable by the fact that
  none of them need to change at all, and the full suite stays green.

## Outstanding questions

None
