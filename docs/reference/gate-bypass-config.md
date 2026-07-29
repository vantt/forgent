---
type: reference
source_capture_ids: [tsk-6bx-1]
---

# Gate-bypass config

Reference for `.fgos/gate-bypass.json` and the `fgos gate-bypass` verb —
the config/state layer that lets a skill-embedded confirmation gate
auto-approve instead of asking (`docs/history/gate-bypass/CONTEXT.md`
D1-D5). This layer only computes the yes/no; wiring it into
`fgos-exploring`/`fgos-planning`'s actual Gate steps is a separate piece
not covered by this capture.

## `.fgos/gate-bypass.json`

```json
{ "level": "standard" }
```

`level` is one of `off` / `light` / `standard` / `heavy` — the same
vocabulary as the item schema's own `TIERS` (`src/state/work.mjs`), not
bee's `off`/`normal`/`full`/`total` naming. `off` is the default and
auto-approves nothing.

Read via `readGateBypassLevel(dir)` (`src/state/gate-bypass.mjs`). Fails
closed to `off` on any of:

- the file is missing
- the file is not valid JSON
- `level` is missing, not a string, or not one of the four recognized
  values

## `fgos gate-bypass` (CLI)

Read-only status verb, no arguments:

```
$ fgos gate-bypass
{ "level": "standard" }
```

Wrapped in the standard `fgos.v1` envelope like every other verb. No CLI
setter — edit `.fgos/gate-bypass.json` by hand, the same pattern
`.fgos-runner.json` already uses.

## Coverage rule

A level covers a tier if the tier's rank is lower than the level's rank in
`['off', 'light', 'standard', 'heavy']` (`off` is rank 0 and covers
nothing):

| tier ↓ / level → | off | light | standard | heavy |
|---|---|---|---|---|
| light | no | yes | yes | yes |
| standard | no | no | yes | yes |
| heavy | no | no | no | yes |

## The three-part decision (`canAutoApprove`)

`canAutoApprove(item, artifactText, level)` returns `true` only when all
three hold:

1. **No hard-gate floor hit (D4).** `item.title`/`item.description` are
   scanned case-insensitively against `HEAVY_KEYWORDS`
   (`src/intake/risk-keywords.mjs`). Any hit forces `false` regardless of
   level or tier — this floor cannot be bypassed by raising the level.
2. **Tier covered (D5).** `item.tier` must be covered by `level` per the
   table above.
3. **No open items (D2).** `artifactText` (the gated CONTEXT.md/plan.md's
   raw content) must not have open items — see below.

## Completeness scan (`hasOpenItems`)

Fails closed (returns "has open items") on any of:

- a `TODO` or `FIXME` marker anywhere in the text
- no `## Outstanding questions` section present at all
- the section's body doesn't start with `None` (case-insensitive)

An artifact that never adopts the `## Outstanding questions` convention
is always treated as incomplete — this is a fail-closed default, not a
detection gap to fix later.
