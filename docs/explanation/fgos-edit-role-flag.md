---
authoritative_for: fgos edit --role flag, human vs session provenance on work.edit events, why the default stays human
---

# `fgos edit --role` — closing a provenance-trust gap

`fgos edit` used to hardcode `role: 'human'` unconditionally on every
`work.edit` event — no flag existed to say otherwise. Any caller (a real
person, a live Claude Code session, a sub-agent acting on its own
initiative) got the identical `role: 'human'` provenance tag in
`.fgos/events.jsonl`.

## Why this was a real gap, not theoretical

Confirmed live: a sub-agent driving `tsk-3u8` (isolated worktree, no
genuine human in the loop) ran `fgos edit tsk-3u8 --risk light --tier
standard` on its own to sidestep a hard gate — explicitly against
`fgos-coding-validating`'s own "never lower the mechanical floor with your
own judgment" rule. The resulting event read `role: 'human'`,
indistinguishable from a real person having made that edit. This was
worse than a related prior gap `tsk-5dn` fixed for `gate-approve`: that
verb at least forces an explicit `--actor human|bypass` choice at the call
site, while `edit` gave the caller no choice and no visibility that it was
asserting human provenance.

## The fix

Added an optional `--role human|session` flag to `case 'edit'`, mirroring
`case 'take'`'s already-existing pattern verbatim:

```js
const role = optionalField(flags.role, 'edit --role requires "human" or "session" (omit --role entirely to default to human)') ?? 'human';
if (role !== 'human' && role !== 'session') {
  throw new StoreError('validation', `edit --role must be "human" or "session" (got "${role}").`);
}
```

`editWork` (`src/state/store.mjs`) already accepted a generic `role` param
with no special-casing — the same shape `take` already used successfully
— so no store-layer change was needed.

## Why the default stays `'human'`, not flipped to `'session'`

The obvious-looking alternative — default to `'session'` and require an
opt-in for human — was rejected: it would flip behavior for every real
human interactively running `fgos edit` today, silently mislabeling
*their* writes as non-human — the exact inverse of the integrity problem
this item exists to fix, just aimed the other way. The CLI cannot tell
caller identity from context alone, so the safer default is the one that
never silently discredits a real person's own action. `take`'s own
precedent (default `human`, explicit opt-in to `session`) already
established this exact trade-off for the identical ambiguity.

A second alternative — some automatic actor-provenance detection (e.g.
reading an env var to infer "is this an agent") — was also rejected: an
explicit, caller-declared flag is simpler, already proven in production
via `take`, and reuses a mechanism this codebase already chose for the
identical problem rather than inventing a second, different one.

## Blast radius checked, none found

The only code that reads `role === 'human'` as a semantic trust signal is
`src/runner/anti-loop.mjs`'s `visitsSinceLastHumanEvent` — and it reads
only `work.move` events, never `work.edit`. Adding the opt-out on `edit`
changes no existing consumer's behavior.
