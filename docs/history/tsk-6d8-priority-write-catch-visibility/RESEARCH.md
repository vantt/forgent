# RESEARCH: priority-write catch blocks swallow errors silently

## Round 1 (tsk-6d8, stage discovery)

**Checked:** `src/intake/discovery.mjs:289-310`, `src/intake/plan.mjs`'s
priority-write try/catch (the one immediately after the `computePriority`
call, ~line 609-631 in this branch's current state — note: this branch
already carries `tsk-4hb`'s merged fix, which added an `addDecision` call
*inside* both try blocks, so a failure there would ALSO be silently
swallowed by the same bare `catch {}` today).

**Found:** both catches are bodyless (`catch { // Swallowed intentionally
...}`), matching the item's own citation exactly. The fail-safe *intent*
(never let a priority-write failure abort the clarify/unclear resolution
that follows) is sound and stays unchanged — the item's own description
agrees ("Lập luận fail-safe... là hợp lý"). The gap is purely
observability: nothing distinguishes "every write succeeded" from "every
write silently failed."

**Fix shape:** capture the error (`catch (err)`) and write one line to
stderr — never a second write-door call (which could itself fail and
recurse into the same problem), never a thrown re-raise (would defeat the
fail-safe). `process.stderr.write` is the established pattern for this
exact "always succeeds, never fails, visible in operation" signal
elsewhere in the codebase (`src/runner/lock-wait.mjs`'s own progress
line, confirmed by direct read this session's earlier `tsk-mgb` work).

**Verdict:** `{clear: true, verify: "npm test"}`
