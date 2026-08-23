# tsk-3ev — plan

No `CONTEXT.md` for this feature — the item's own description already
fully specified the fix; intent was clear at `fgos-clarifying` with no
product decision to lock (no `fgos-coding-exploring` pass ran, so there is no
D-ID to cite).

## Mode

Flags counted: auth(no) · authorization(no) · data model(no) ·
audit/security(no) · external systems(no) · public contracts(no — skill
prose is agent-read guidance, not a code contract) · cross-platform(no) ·
existing covered behavior at risk(no — pure prose addition, no code path
touched) · weak proof around the area(no — the addition is the fix itself)
· multi-domain(no).

**0 flags → tiny.** One sentence added at two known insertion points,
each mirrored across two committed copies (`.claude/skills/` and
`.agents/skills/`) — four files total, no gray areas.

## Approach

Add one explicit warning sentence to two places, reusing the exact
mechanism the bug report (tsk-3ev's own description) already named:

1. `fgos-coding-validating`'s `## Handoff` section (currently ends by pointing at
   `fgos-routing` once the item reaches `executing` — see
   `.claude/skills/fgos-coding-validating/SKILL.md:213-220`) — state plainly that
   the `decompose`→`executing` edge (`releaseClaimOnExecuting`,
   `src/intake/plan.mjs:488-494`) drops the item's claim back to
   `todo`, so any path that continues by hand-calling `fgos-coding-implement`
   directly (instead of going back through the `fgos-coding-driving`
   loop, which already re-checks claim status fresh before invoking the
   `executing`-stage skill) is running against a claim that may already
   be gone.

2. `fgos-coding-implement`'s Orient step (currently reads title/refs/deps/
   docsRef only — `.claude/skills/fgos-coding-implement/SKILL.md:73-78`) —
   add the mirrored warning: a session arriving here NOT via
   `fgos-coding-driving` must re-check the item's live `status` before
   treating the initial `pick`/claim as still valid, and re-claim
   (`fgos pick <id>`) if it now reads `todo`.

Both sentences carry the same anchor phrase (`claim may already be
released`) so one grep proves both landed — see Verify below.

Rejected alternative: fixing this by making `releaseClaimOnExecuting`
conditional (skip the release when a hand-driven session is detected) —
out of scope. The item's own description frames this as a process/
documentation gap, not a code bug: the release-on-transition behavior
itself is correct (claim-lock §3b), only the warning about it was
missing. Changing the release behavior would be a different, larger item.

### Risk map

| Component | Risk | Proof point (for fgos-coding-validating) |
|---|---|---|
| Warning lands in the right section, both mirrors | low — pure text insertion, no logic | `grep -c` on all 4 files confirms the anchor phrase appears exactly once each |
| Wording stays accurate to the real mechanism | low — cites real file:line (`decompose.mjs:488-494`) already read for this plan | manual read at review, no automated check needed (prose-comprehension proof is explicitly NOT verify's job per `docs/how-to/write-verify-for-a-skill-prose-change.md`) |

Impact-analysis posture: not applicable — `fgos tool query --capability
impact-analysis --status present` shows GitNexus registered and `present`
(1 provider), so the gate's own vocabulary would call this `full`, not
`inactive` (an earlier pass of this plan mislabeled it, corrected at
`fgos-coding-validating`). It stays not-applicable in practice regardless: the
MUST-run-impact rule triggers "before modifying a function, class, or
method" — this item's footprint is pure `SKILL.md` prose, zero code
symbols, so the rule's own precondition never fires here.

## Files touched

- `.claude/skills/fgos-coding-validating/SKILL.md` — `## Handoff` section, one
  new sentence.
- `.agents/skills/fgos-coding-validating/SKILL.md` — same sentence, mirrored copy.
- `.claude/skills/fgos-coding-implement/SKILL.md` — Orient step (flow item
  1), one new sentence.
- `.agents/skills/fgos-coding-implement/SKILL.md` — same sentence, mirrored
  copy.

## Cases to prove (fgos-coding-validating)

- All four files carry the anchor phrase (`claim may already be
  released`) exactly once — no accidental duplication, no missed mirror.
- `npm test` still green (prose-only change, no behavior to regress).

## Verify

```
npm test && [ "$(grep -c "claim may already be released" .claude/skills/fgos-coding-validating/SKILL.md)" = "1" ] && [ "$(grep -c "claim may already be released" .agents/skills/fgos-coding-validating/SKILL.md)" = "1" ] && [ "$(grep -c "claim may already be released" .claude/skills/fgos-coding-implement/SKILL.md)" = "1" ] && [ "$(grep -c "claim may already be released" .agents/skills/fgos-coding-implement/SKILL.md)" = "1" ]
```

Per `docs/how-to/write-verify-for-a-skill-prose-change.md`: this is a
pure-addition prose change with no old pattern being removed (the whole
bug is an *absence* of a warning, not a wrong statement to retract), so
there is no natural NEGATIVE-vế old-pattern check. The `grep -c ... = "1"`
form still guards a real failure mode the doc's own POSITIVE-only warning
calls out — an accidental double-paste or a match landing outside the
intended section would not be caught by a bare `grep -q`.

## Split

None — one honest piece of work, proceeds as itself (`tsk-3ev`).
