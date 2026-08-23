---
type: explanation
title: Why `HEAVY_KEYWORDS` matching moved from substring to word-boundary
source_capture_ids: [tsk-1gj]
---
# Why `HEAVY_KEYWORDS` matching moved from substring to word-boundary

`HEAVY_KEYWORDS` (`src/intake/risk-keywords.mjs`) is matched against free
text in two places, both previously via a plain case-insensitive
substring scan (`text.includes(keyword)`):

- `classifyIronLaw` (`src/evolve/iron-law.mjs`) — flags a diff for the
  Iron Law failing-test-first gate.
- `classify()` (`src/intake/classify.mjs`, via its shared `countMatches`
  helper) — sets `tier`/`risk` at `fgos submit` time.

Both false-positived on a keyword appearing as a substring inside an
unrelated word — `"auth"` matching inside `"authoring"`, `"author"`,
`"authentic"`.

## The real incident

Confirmed directly: this exact substring misclassified `tsk-69g`
(`fgos-coding-shaping`, whose own description talks about "authoring"
documents) as `tier: heavy` at submit time (`classify()`) **and** tripped
the Iron Law gate at approve time (`classifyIronLaw`) — the same root
cause hit twice, from the same shared keyword list. First observed while
working `docs/history/fgos-coding-shaping/CONTEXT.md`.

## Locked decision

Word-boundary matching applies to **both** `classifyIronLaw` and
`classify()` — not `classifyIronLaw` alone, as the item's original submit
text had scoped it. Both consumers run the identical substring pattern
against the same shared `HEAVY_KEYWORDS` list (`classify.mjs`'s
`countMatches` helper mirrors `iron-law.mjs`'s own inline check);
`test/evolve/iron-law.test.mjs` already imports and tests `classify` and
`classifyIronLaw` together, never separately; and the same substring hit
both of them on `tsk-69g` from one root cause. Fixing only one would have
left the other's false-positive exposure live.

**Word-boundary match** — a keyword match only counts when the keyword is
not immediately preceded or followed by another word character
(letter/digit/underscore) in the source text: `"auth"` matches standalone
or as `"auth,"`, but not inside `"authoring"`/`"author"`/`"authentic"`.

## Why the fix went through the shared helper, not a special case

`countMatches` (`classify.mjs`) is the single shared helper behind
`HEAVY_KEYWORDS`, `LIGHT_KEYWORDS`, and every `KIND_KEYWORDS` list.
Fixing it directly — rather than special-casing `HEAVY_KEYWORDS` inside
it — uniformly removed the same substring false-positive from
`LIGHT_KEYWORDS`/`KIND_KEYWORDS` matching too, as a natural side effect,
not a separately-decided scope expansion.

## Out of scope

`matchedModules` (`iron-law.mjs`'s separate, path-prefix/equals matching
mechanism) — untouched by this fix. Only the keyword-substring matching
semantics changed, never the `HEAVY_KEYWORDS` list contents themselves.

## Implementation (commit `6c79833`)

Touched `src/evolve/iron-law.mjs`, `src/intake/classify.mjs`, and
`src/intake/risk-keywords.mjs`, plus new coverage in
`test/evolve/iron-law.test.mjs` for both the true-positive case (keyword
standalone, must still match) and the newly-fixed false-positive case
(keyword as a substring inside another word, must not match). Several
`HEAVY_KEYWORDS`/`LIGHT_KEYWORDS`/`KIND_KEYWORDS` entries are Vietnamese
(`"bảo mật"`, `"thanh toán"`, `"đổi tên"`...), which a plain ASCII `\b`
regex does not reliably bound — the exact boundary implementation was
left to planning/implementation to get right for those entries too, not
just the ASCII ones.

## A third consumer was missed (`tsk-1gj`): `gate-bypass.mjs` never migrated

This fix's own scope reasoning ("fixing only one would have left the
other's false-positive exposure live") named exactly two consumers,
`classifyIronLaw` and `classify()` — but a third, independent
`HEAVY_KEYWORDS` consumer existed and was never touched:
`src/state/gate-bypass.mjs`'s `canAutoApprove`/
`canAutoApproveValidate` (identical `hardGateHit` blocks at :132/:152, as
the file stood at the time — `canAutoApproveValidate` was later deleted by
`coding-planning-validating-gate-redesign/CONTEXT.md` D9-D11 and replaced
by `canAutoApproveMergedGate`, which carries the same `matchesKeyword`
word-boundary fix this section describes) kept the original raw substring
scan, and didn't even import `matchesKeyword`:

> "The other two `HEAVY_KEYWORDS` consumers already migrated
> (`src/intake/classify.mjs:63`, `src/evolve/iron-law.mjs:87`) —
> `gate-bypass.mjs` is the sole holdout, and doesn't even import
> `matchesKeyword`."
> — real `docs/history/tsk-1gj-gate-bypass-word-boundary-match/CONTEXT.md`

A real-backlog scan quantified the cost: 21 of 482 items matched a
`HEAVY_KEYWORDS` entry only as a substring, never as a genuine
word-boundary match — e.g. `"auth"` inside `"...human-authored
plan..."`, `"delete"` inside `"...createworktree now deletes .fgos/
outright..."`. `canAutoApprove` checks `hardGateHit` **first** and
returns `false` unconditionally on a hit, regardless of tier — so these
21 items could never auto-approve at any tier, 12 of them despite
already having a `tier` that `standard` mode would otherwise have
covered. Each item pays this gate at up to 3 separate checkpoints
(`fgos-coding-planning`'s auto-approve, `fgos-coding-validating`'s auto-approve,
`fgos-fanout`'s inherited floor, which shares the same function) — up to
63 unnecessary human-asks total, for exactly the class of prose this
project's own risk vocabulary says should never trigger one.

**The fix**: swap both `hardGateHit` computations to use
`matchesKeyword` (the same shared helper this doc's own fix already
built), dropping the now-redundant `.toLowerCase()` call in the process
(`matchesKeyword`'s own regex already handles case-insensitivity).
Existing tests needed no change — checked directly, and none of
`gate-bypass.test.mjs`'s existing fixtures relied on the substring bug
to pass (its "auth"/"payment" cases were genuine standalone-word
matches all along).

The general lesson: fixing a shared helper's *implementation* doesn't
retroactively fix every *caller* still using the old inline pattern
directly — `gate-bypass.mjs` predated `matchesKeyword`'s introduction and
was simply never revisited when the other two consumers migrated. A
migration scoped by "every known consumer of this bug" is only as
complete as the consumer inventory it was checked against.

## Related

- `docs/history/heavy-keywords-word-boundary-match/CONTEXT.md` — full
  decision record and scout evidence.
- `docs/history/fgos-coding-shaping/CONTEXT.md` — where this
  false-positive was first observed, on `tsk-69g`.
- `docs/history/tsk-1gj-gate-bypass-word-boundary-match/CONTEXT.md` —
  the missed third consumer's own fix.
