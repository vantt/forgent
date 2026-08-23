# gate-bypass-audit-decision-kind — plan

Mode: high-risk (hard-gate flag: audit/security — this item is directly
about the integrity of the retrospective/cleanup gate's audit trail).

## Approach

`fgos-coding-validating`'s Step 2 auto-approve branch logs an audit line
via the general-purpose `fgos decision` CLI verb
(`.agents/skills/fgos-coding-validating/SKILL.md`, "Step 2 — check whether
the gate can auto-approve"). `bin/fgos.mjs`'s `case 'decision'` (~line
1932) never reads `flags.kind`, so `addDecision` (`src/state/store.mjs`)
defaults `kind` to `'design'`. `checkRetrospectiveContent`
(`src/state/cleanup-harness.mjs:281`, `d?.kind !== 'engine'`) then counts
that record as human reflection, and the retrospective gate goes green
with no retrospective document behind it — for essentially every item
that ever auto-approved its validateApprove gate at the repo's configured
bypass level.

Rejected alternatives (both checked against current code, not assumed):

- **Skills-only fix (no CLI change).** Cannot work standalone: the CLI's
  `decision` case has zero `kind` plumbing today — a skill passing
  `--kind engine` would be silently dropped. `tsk-1ud`'s store-level
  `kind` field was only ever wired to internal call sites
  (`resolveDiscovery`/`resolvePlan`, `move`'s two override branches, the
  Iron Law warn-skip record, and `tsk-4kw`'s `sync-root`/
  `promote-to-component` fix), never exposed on the general verb.
- **Drop the `fgos decision` line entirely**, relying on the existing
  `fgos gate-approve` structured event (`actor: bypass`) instead, since
  `checkRetrospectiveContent` never reads gate-approve events at all.
  Checked `gate-approve`'s payload shape
  (`bin/fgos.mjs`'s `case 'gate-approve'` / `src/state/store.mjs`'s
  `addGateApproval`): `{id, gate, actor, verify}` — no bypass level, no
  rationale citation. Dropping the decision line would lose real audit
  information (which level authorized the bypass, and the citation to
  the locked gate-bypass decision), not just a redundant narrative line.
  Rejected.

**Chosen fix**: add an optional `--kind` flag to `fgos decision`
(`bin/fgos.mjs`'s `case 'decision'`), free text with no enum — same
posture the field already has at the store layer for `source`/`kind`
(`src/state/store.mjs`'s own doc comment) — defaulting to `'design'` when
omitted, so every existing caller's behavior is unchanged. Then update
`fgos-coding-validating`'s auto-approve audit line to pass
`--kind engine`.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `bin/fgos.mjs` `case 'decision'` | Medium — shared CLI verb, Iron Law applies | New CLI test asserting `--kind engine` round-trips into the stored event's `payload.kind`, plus a regression test asserting the omitted-flag default is still `'design'` |
| `fgos-coding-validating`'s audit line | Low — prose only, single call site | Manual read-through of the updated instruction; `test/skills/fgos-mirror.test.mjs` proves the `.claude/skills` wrapper stays in sync |
| `checkRetrospectiveContent` consumer | Low — unchanged, just now receives correctly-tagged records | Existing `test/state/cleanup-harness.test.mjs` coverage stays green; no behavior change needed there |
| `plugins/fgOS/skills/fgos-coding-validating/SKILL.md` (hand-mirrored leg, `test/skills/fgos-mirror.test.mjs` tsk-32b) | Low — mechanical copy | Byte-diff against `.agents/skills/fgos-coding-validating/SKILL.md` after edit |

## Files touched

- `bin/fgos.mjs` — add `--kind` flag to `case 'decision'`
- `test/cli/fgos-iron-law-gate.test.mjs` or a new focused test file —
  cover the new flag and the unchanged default
- `.agents/skills/fgos-coding-validating/SKILL.md` — pass `--kind engine`
  on the auto-approve audit line
- `.claude/skills/fgos-coding-validating/SKILL.md` — regenerated wrapper
  (`npm run build:skills`), expected to be a no-op since only body prose
  changed, not frontmatter
- `plugins/fgOS/skills/fgos-coding-validating/SKILL.md` — hand-synced copy
  (tsk-32b leg, byte-identical to `.agents/skills` source)
- `CHANGELOG.md` — user-visible fix entry (a skill now correctly tags
  its own audit-bookkeeping decisions)

## Verify

`npm test` (full suite green) — set on the item.

## Order

1. Write the failing/new test first (Iron Law: test-first for
   `bin/fgos.mjs`).
2. Implement the `--kind` flag.
3. Update the skill prose (`.agents/skills`, regenerate `.claude/skills`,
   sync `plugins/fgOS/skills`).
4. `npm test`.
5. CHANGELOG entry.
