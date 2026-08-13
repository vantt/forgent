# Research: tsk-14a — pass-through item's `verify` never synced from plan.md before executing

## Round 1 — 2026-08-13 (fgos-researching, called from fgos-coding-discovering)

**Asked:** Does `fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`
(or their underlying `src/` implementation) currently sync a pass-through
(non-split) item's own `verify` field to the real command designed in
`plan.md`'s proof surface, before executing/returning it? Does this gap
still exist post `coding-planning-validating-gate-redesign`? Is it the same
mechanism as tsk-4m4's own "Known adjacent hole" paragraph, or has it
diverged?

**Checked:**
- `src/intake/plan.mjs:476-619` (`resolvePlan`, the live planning→executing
  transition function; formerly `resolveDecompose` in `decompose.mjs`,
  renamed under tsk-403 D15).
- `src/state/store.mjs:818-848` (`recordGateApprove` / `GATE_APPROVE_GATES`).
- `.claude/skills/fgos-coding-validating/SKILL.md:260-350` (the merged
  reality-gate flow and its `gate-approve --gate validateApprove --verify`
  call).
- `.claude/skills/fgos-coding-planning/SKILL.md`,
  `.claude/skills/fgos-coding-implement/SKILL.md` — grepped for
  `fgos edit`/`--verify`.
- tsk-4m4's own item description (`fgos list --id tsk-4m4 --json`) for its
  "Known adjacent hole" paragraph.

**Found:**

1. `resolvePlan` (`src/intake/plan.mjs:543`) computes the verify it stamps
   onto every `moveStage(..., to: 'executing', ...)` call as:

   ```js
   const planApproveVerify = view.gates?.[id]?.planApprove?.verify ?? work.verify;
   ```

   The function's own comment (`plan.mjs:531-542`) confirms `planApprove`
   is a **retired** gate name (`coding-planning-validating-gate-redesign`
   D9-D11 removed `fgos-coding-planning`'s own gate; no live skill writes
   a new `planApprove` record) — so `view.gates?.[id]?.planApprove?.verify`
   is always `undefined` for any item that went through the current
   architecture. Every current item therefore falls straight through to
   `?? work.verify` — the item's own **current, possibly-still-placeholder**
   `verify` field.

2. `fgos-coding-validating`'s own gate-approve call
   (`SKILL.md:305-308`) is explicit that the `verify` it records is
   **"the item's own current `verify` field ... read fresh — this skill
   proves the plan's existing verify still holds against reality, it does
   not design a new one"**. `recordGateApprove` (`store.mjs:832-848`) only
   appends `{gate: 'validateApprove', verify}` to the event log; it never
   writes `work.verify` itself (no `moveWork`/`edit` call in that
   function). Nothing reads `gates[id].validateApprove.verify` back into
   `resolvePlan`'s `planApproveVerify` chain either — that chain only ever
   checks the dead `planApprove` key.

3. Grepping all three skill docs
   (`fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`)
   for `fgos edit`/`--verify` finds **zero** calls to `fgos edit --verify`
   anywhere in the standard flow. Only `normalizeChild` (`plan.mjs:175`,
   the `decompose --children` path) forces a real verify onto a **child**
   item at creation time — confirming the original bug report's own claim
   that pass-through (non-split) items are the gap, not split children.

   **Conclusion (1): the gap tsk-14a describes is confirmed present in the
   current, post-redesign codebase.** The mechanism is slightly worse than
   the item's own description suggests: it isn't just "nothing calls `fgos
   edit --verify`" — `resolvePlan` actively reads a dead gate key
   (`planApprove`) that can never be populated post-redesign, so the
   fallback to stale `work.verify` is unconditional for every current item,
   not merely the common case.

4. tsk-4m4's own description contains this exact paragraph: *"Known
   adjacent hole, not opened or closed by this: resolveDecompose's
   pass-through path (decompose.mjs:542) moves a root to `executing`
   carrying planApproveVerify with no check at all."* — `decompose.mjs:542`
   is the pre-rename location of the exact same `planApproveVerify` line
   now at `plan.mjs:543` (confirmed via the file's own header comment on
   the rename, tsk-403 D15).

   **Conclusion (2): tsk-14a and tsk-4m4's "Known adjacent hole" are the
   SAME mechanism, not diverged.** They are two complementary observations
   about the identical code site: tsk-4m4 says nothing there *checks*
   `planApproveVerify` for correctness; tsk-14a says nothing upstream ever
   *populates* it with the real designed command in the first place. Fixing
   either without the other still leaves a real gap — tsk-14a's own fix
   direction (sync plan.md's designed verify onto `work.verify` before
   hand-off) and tsk-4m4's fix direction (move verify-correctness judgment
   to planApprove/validateApprove, away from `clarify`) are complementary,
   not competing — tsk-14a supplies the value tsk-4m4's judgment would need
   to check.

**Open:** tsk-4m4 itself is still open (`todo`/`discovery`) and is tsk-14a's
own declared dependency. tsk-4m4's fix direction would relocate *where*
verify-correctness is judged; it does not by itself sync plan.md's designed
verify onto `work.verify`. tsk-14a's own scope (the sync step) is
independently well-defined regardless of tsk-4m4's outcome — it does not
require tsk-4m4 to land first to be *planned*, only possibly to be
*sequenced* around if the two touch the same call site in the same edit.
