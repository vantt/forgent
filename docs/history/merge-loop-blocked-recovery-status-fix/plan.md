---
type: plan
title: plan — merge-loop stale `proposed` status reference (tsk-3q8)
timestamp: 2026-08-12T16:53:00.000Z
---

# plan — tsk-3q8

Mode: **tiny**. Flag count: 0 of {auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain}
apply — a two-line text correction inside one skill-prose file, no code
path, no behavior change to any engine verb. `fgos-routing`'s own
mode-gate table (0-1 flags → tiny/small) puts this at `tiny`: a couple of
lines, one direct task, no gray area.

## Approach

`RESEARCH.md` (round 1) already confirmed the claim with direct evidence:
`plugins/fgOS/skills/merge-loop/SKILL.md:204-206` names `proposed` as the
FSM's `blocked` recovery door; `src/state/status-fsm.mjs`'s real
`TRANSITIONS` table has no `proposed` status at all (superseded by 0024,
migrated by `scripts/migrate-status-proposed-to-awaiting-approval.mjs`);
the real doors out of `blocked` are `todo`/`doing`/`awaiting-approval`/
`delivered`/`wontfix`. `awaiting-approval` is the one relevant here — it's
what `bin/fgos.mjs`'s `approve` case reads to retry a merge, matching the
item's own empirical confirmation (`fgos move tsk-1wr --to
awaiting-approval --expect blocked` succeeded; the retry landed clean).

No alternatives considered — this is a factual correction to match live
FSM state, not a design choice.

Risk map: none. Text-only change to one Markdown file; nothing else in
the repo reads or depends on this specific playbook sentence
programmatically (the `fgos move` command it documents is typed by a
person following the playbook, not parsed by any script).

Files touched: `plugins/fgOS/skills/merge-loop/SKILL.md` (lines 204-206
only).

Impact-analysis: not applicable — no code symbol is touched, only prose.

## Shape

Replace `proposed` with `awaiting-approval` in both places on lines
204-205:

- `fgos move <id> --to proposed` → `fgos move <id> --to awaiting-approval`
- `` `blocked -> proposed` recovery door `` → `` `blocked ->
  awaiting-approval` recovery door ``

No other wording in the playbook step changes (the retry-once semantics,
the stop condition, and the reported-on-failure fields all stay exactly
as they are).

This item touches a `plugins/fgOS/skills/**/SKILL.md` path — per
`docs/how-to/write-verify-for-a-skill-prose-change.md`, verify uses the
`npm test && POSITIVE && NEGATIVE` shape, `--hidden`-safe patterns (n/a
here, target isn't under a hidden dir), and a scope guard confirming the
diff stays out of `src/`:

```
npm test && grep -qF 'fgos move <id> --to awaiting-approval' plugins/fgOS/skills/merge-loop/SKILL.md && grep -qF 'blocked -> awaiting-approval' plugins/fgOS/skills/merge-loop/SKILL.md && ! grep -qi 'proposed' plugins/fgOS/skills/merge-loop/SKILL.md && ! git diff --name-only main...HEAD | grep -q '^src/'
```

POSITIVE (two greps): the new literal command string and the new FSM door
name both exist in the file. NEGATIVE: no case-insensitive `proposed`
remains anywhere in the file (confirmed in RESEARCH.md round 1 that these
are the only two occurrences). Scope guard: diff never touches `src/`.

No split — one honest two-line edit, not multiple items.

## Outstanding questions

None
