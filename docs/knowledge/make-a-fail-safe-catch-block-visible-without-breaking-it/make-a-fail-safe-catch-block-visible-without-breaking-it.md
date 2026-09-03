---
type: how-to
title: Make a fail-safe catch block visible without breaking it
tags: []
source_capture_ids: [tsk-6d8]
framework: diataxis
mode: how-to
---
# Make a fail-safe catch block visible without breaking it

Use this when you have a deliberately silent `catch {}` — one that exists
because a write failing there must never abort the flow that follows —
and you need to stop a real failure from being completely invisible,
without changing that fail-safe behavior.

## The trap

`src/intake/discovery.mjs` and `src/intake/plan.mjs` both write an
auto-computed `priority` via `editWork(dir, {id, patch: {priority}, role})`
inside a try/catch with an empty catch body, commented "Swallowed
intentionally." The reasoning is sound on its own: the
clarify/decompose resolution that follows must proceed even if this one
side write fails — a `lock-timeout` or any write-door rejection here
should never block the real resolution.

The consequence is what makes it a trap: a run where every single
priority write fails looks byte-for-byte identical, from the caller's or
a log reader's side, to a run where every write succeeds. That is exactly
why two more serious downstream priority bugs (an axis silently ignored,
an axis silently dead) went unnoticed for a while — nothing in the empty
catch ever left a trace.

## How to fix it

Add exactly one `process.stderr.write` line inside the catch, naming the
item id and `err.message` — and nothing else:

```js
} catch (err) {
  process.stderr.write(`priority write failed for ${id}: ${err.message}\n`);
}
```

Do **not**:
- re-throw — that defeats the fail-safe the surrounding code exists for;
- make a second write-door call from inside the catch (e.g. another
  `editWork` to record the failure) — that write can itself fail and
  recurse into the same silence you're trying to fix;
- add any other logic to the catch body — the only goal is a visible
  trace, not a recovery attempt.

`process.stderr.write` was chosen because it always succeeds and is
already the established pattern elsewhere in this codebase (e.g.
`lock-wait.mjs`) for exactly this "always-visible, never-blocking" signal.

## Confirm the fail-safe still holds

Before calling it done, confirm both directions:

- **A write that succeeds** produces no stderr output — behavior for the
  common case is unchanged.
- **A write that fails** still lets the clarify/unclear resolution that
  follows run identically to before — only a new stderr line appears,
  nothing else about control flow changes. Run the existing test file
  exercising the legacy-invalid-shape path that depends on this catch
  firing (`discovery.test.mjs`/`decompose.test.mjs`) and confirm it still
  passes unmodified.

## Real example (`tsk-6d8`)

`tsk-6d8` applied exactly this fix to both `discovery.mjs`'s and
`decompose.mjs`'s priority-write catch blocks — one stderr line each, no
other change to either catch body. Full evidence:
`docs/history/tsk-6d8-priority-write-catch-visibility/CONTEXT.md`.

## Related

- `docs/history/tsk-6d8-priority-write-catch-visibility/` — the full
  decision record (D1: stderr write, never a second write-door call or a
  re-throw) and research behind this fix.
