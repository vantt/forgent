# tsk-3k4 — plan

Mode: **tiny** (0 flags from `fgos-routing`'s Mode-gate table: not auth,
not data model, not audit/security, not an external system, not a public
contract, not cross-platform, not touching existing covered behavior, not
weak-proof, not multi-domain — a one-file doc clarification with no code
change). No `CONTEXT.md` exists for this item — its discovery verdict was
`clear` (`fgos-coding-discovering`, 2026-08-17), which skips `exploring`
entirely, so there is no locked-decisions file to cite; `RESEARCH.md` in
this same directory is the evidence base instead.

## Impact-analysis capability gate

`fgos tool query --capability impact-analysis --status present` → gitnexus
present. Posture: **full**, but not load-bearing here — this piece touches
no function/class/method symbol (it edits skill-prose Markdown only), so
no blast-radius proof point applies.

## Finding (from RESEARCH.md, discovery round 1)

The observed behavior — `fgos-coding-shaping` running `WebSearch` 5x
back-to-back during `/fgOS:coding-shape`, with no `dispatch.mjs decide`
call anywhere in that sequence — is **not a gap**. It is the correct,
already-designed behavior, on five independent, converging pieces of real
evidence (full citations in `RESEARCH.md`):

1. The `PreToolUse` hook's matcher is the literal string `Agent|Task`
   (`test/setup/claude-code-hooks.test.mjs:23-24`), built specifically
   around the Agent/Task tool's own `subagent_type` field
   (`docs/history/tsk-60f/plan.md:86-113`) — a field `WebSearch` does not
   carry.
2. `dispatch.mjs`'s own header scopes the whole module to one question —
   spawn in-process or out-of-process — never "should this tool call
   happen." A direct `WebSearch` call is not a spawn.
3. `executor-dispatch-fallback.md`'s own "Valid reasons to dispatch"
   section names exactly four reasons; anything else "stays inline."
4. The closest real precedent — organized multi-branch research fan-out
   — was explicitly decided (tsk-5tm-2 D6) to bypass `decide`/`resolve`
   entirely, dispatching straight via native Task-tool.
5. No decision record anywhere uses the words "WebSearch" or discusses
   raw in-process tool calls as a named case — the boundary was never
   contested, just never written down as one explicit sentence.

## Approach

One piece, no split — the finding does not call for any code change (no
symbol, no config, no runtime behavior is wrong), only for leaving the
answer somewhere a future reader will actually find it before re-raising
the same question from scratch (AGENTS.md's own DoD question 6: "what
learning gets left behind"). Point 5 above is exactly the gap this closes.

**Rejected alternative: do nothing, close as `wontfix`-with-no-doc-change.**
Cheap, but throws away the one thing this investigation actually produced
— the reason it took real cross-referencing (5 separate files) to answer a
question a single sentence can answer next time. Reversible either way
(a doc sentence is trivially editable later), so the doc-clarification
side wins on cost/benefit: near-zero cost, removes a real recurring-
confusion risk this item's own discovery text described as already having
happened once.

**File touched:** `.agents/skills/_shared/capacity-dispatch-fallback.md`,
mirrored byte-identical (per its own D8 discipline) at
`plugins/fgOS/skills/_shared/capacity-dispatch-fallback.md`. One new
paragraph appended directly after the existing "Valid reasons to dispatch
instead of doing it inline" section's closing sentence ("Anything else
stays inline..."), stating plainly that a single direct tool call (or a
burst of them) made by the live session itself is never a `decide`
candidate — it spawns nothing, so there is no in-process/out-of-process
choice to make. No other file needs to change: this fragment is the one
place `docs/history/two-layer-dispatch/DISCUSSION.md` D2 already names as
the single source every consuming skill points to instead of restating.

**Post-merge addendum (first `fgos approve` attempt, verify-fail-post-
merge):** tsk-225 renamed both mirrors to `executor-dispatch-fallback.md`
(D3, `docs/history/capacity-naming-rename/CONTEXT.md`) and merged to main
concurrently with this item's own drive. Merging main into `fgw/tsk-3k4`
cleanly rename-tracked the paragraph into the new filenames (`git merge`,
92% similarity, no conflict) — the two paths below are the current, real
paths post-merge; every reference to the old `capacity-dispatch-
fallback.md` name in this plan (and in `RESEARCH.md`, left as-is
deliberately — that file is a dated record of what was true when the
research call ran, same period-accuracy discipline tsk-225's own D3 gives
`docs/history/*capacity*/`) predates that rename.

This is a prose clarification of already-decided, already-shipped
behavior — it does not reopen or reinterpret `tsk-60f`'s D1/D5 (hook
scope) or `tsk-5tm-2`'s D6 (research fan-out bypasses `decide`); both are
cited, neither is revisited.

## Shape

Single change, already applied directly during Shape (no further staging
needed — a doc-prose addition is its own smallest unit):

- Append the clarifying paragraph to both mirror files (done, `diff`
  confirms byte-identical).
- No test suite covers skill-prose content directly (it is read by an
  LLM at runtime, not executed) — `docs/how-to/write-verify-for-a-skill-
  prose-change.md`'s formal `npm test && POSITIVE && NEGATIVE` template is
  scoped to `SKILL.md` files specifically; this is a shared fragment, not
  a `SKILL.md`, so the lighter proof below (existence + content + mirror
  parity, still real and runnable) is the honest match for a tiny,
  additive, non-renaming change — there is no old pattern to prove gone.

Verify (updated from discovery's interim check, which only proved the
architectural fact still holds — this proves the actual deliverable
landed too):

```bash
grep -q "Agent|Task" test/setup/claude-code-hooks.test.mjs && \
grep -q "never itself a candidate for \`decide\`" .agents/skills/_shared/executor-dispatch-fallback.md && \
diff .agents/skills/_shared/executor-dispatch-fallback.md plugins/fgOS/skills/_shared/executor-dispatch-fallback.md
```

No split children. This item proceeds as itself — `fgos-coding-validating`
should read this as its `pass-through` verdict.

## Outstanding questions

None
