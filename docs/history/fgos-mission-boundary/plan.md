# fgos-mission-boundary — plan

Item: `tsk-4us`. Decisions: `docs/history/fgos-mission-boundary/CONTEXT.md`
(D1-D5). No split — one cohesive documentation change.

## Mode

**tiny** (0 flags counted): no auth, no authorization, no data model, no
audit/security surface, no external systems, no public contract in the
API/consumer-facing sense (AGENTS.md is a standing instruction sheet, not
an external contract), no cross-platform surface, no existing covered
behavior touched (net-new prose, no code path), no weak-proof area, single
domain. Exactly two files change, both prose, no gray areas — "a couple of
files, one direct task" per `fgos-routing`'s own tiny/small line. No lane
was handed off in prose (this item entered `planning` via native-first
handoff from `fgos-coding-shaping` → `fgos-coding-exploring`, never
through `fgos-routing`'s Orient step) — applying the Mode-gate table
directly here, per its own direct-entry fallback.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` →
`gitnexus` present but flagged stale by this session's own PostToolUse
hook (`last indexed: 7bb3231`) — **degraded**. Not load-bearing here: this
plan's only proof point is a grep/file-existence check on prose files, not
a blast-radius claim on code, so the stale index changes nothing this plan
depends on.

## Approach

Write `docs/decisions/0035-xac-lap-ranh-gioi-su-menh-fgos.md` (next real
number after `0034`, confirmed by listing `docs/decisions/`) in the same
shape every existing `docs/decisions/00xx-*.md` file already uses (context
→ decision → consequences, per `0030`'s own template) — restating D1-D5
from `CONTEXT.md` as the decision, D1 explicit about standing beside
`docs/decisions/0030` rather than becoming a 5th tier.

Add one new paragraph to `AGENTS.md`, placed immediately after the
existing "## Product priority order (docs/decisions/0030)" section (the
concrete meaning of D4/D1's "đứng sau" — physically after that section in
the standing sheet, not a lower-ranked tier inside it), naming the
mission #1/#2/#3 boundary and pointing at `docs/decisions/0035`. Since
this text must hold every turn including ordinary conversation
(`docs/platform-foundations.md` L8's placement test: "does this rule need
to hold when no workflow is running?" — yes, this is exactly the kind of
standing framing the 4-tier list already gets), it belongs in `AGENTS.md`
proper, not a reference file loaded on demand.

**Explicitly out of scope for this item (D2/D3, CONTEXT.md Feature
boundary):** registering the `mission` config default/doctor check in
code (`src/setup/registrations.mjs`), and wiring Iron Law's
`MODULE_RULES` (`tsk-1js`) to read it. `tsk-1js` already exists as its own
backlog item and already names this exact direction in its own
description ("hướng chưa chốt: MODULE_RULES thành cấu hình per-project") —
building the config mechanism now, with no real consumer picking it up in
the same change, would be speculative infrastructure (the STR82 precedent
this discussion itself cites: don't build until a real consumer needs it).
The decision doc names the mechanism in prose as the design fgOS commits
to; `tsk-1js` (unblocked, not depended-on) is where it gets built when
that item is picked up.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `docs/decisions/0035-*.md` | Low — new file, no existing reader depends on its absence | File exists, mentions `mission`, cites D1-D5 |
| `AGENTS.md` pointer paragraph | Low — additive only, no existing paragraph edited or removed | New paragraph present, mentions `0035` and `mission`; existing "Product priority order" section byte-unchanged |

No hard-gate flag applies (no auth, no data loss, no audit/security
surface, no external provider, nothing removed) — confirms **tiny**, not
`standard`/`high-risk`.

## Files touched

- `docs/decisions/0035-xac-lap-ranh-gioi-su-menh-fgos.md` — new decision
  doc (D1-D5).
- `AGENTS.md` — one new paragraph after "Product priority order", no
  existing text changed.

## Order

Single item, no split — `fgos graph --what-if tsk-4us` not run for
ordering since there is only one piece and nothing else to compare it
against. Write the decision doc first (it is the source both D-IDs and
the AGENTS.md paragraph cite), then the `AGENTS.md` paragraph pointing at
it — never the reverse, or the pointer would dangle mid-commit.

## Verify

Real, runnable command replacing the item's current placeholder
(`"chưa xác định — P15 bổ sung"`, confirmed to be `RETIRED_P14_PLACEHOLDER`
in `src/intake/discovery.mjs`):

```
test -f docs/decisions/0035-xac-lap-ranh-gioi-su-menh-fgos.md && grep -qi "mission" docs/decisions/0035-xac-lap-ranh-gioi-su-menh-fgos.md && grep -q "0035" AGENTS.md && grep -qi "mission" AGENTS.md
```

Checks the decision file exists and actually discusses `mission`, and
that `AGENTS.md` really points at it — not just that some file got
created somewhere.

## Outstanding questions

None
