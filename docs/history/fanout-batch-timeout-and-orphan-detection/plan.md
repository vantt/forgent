# Plan — tsk-vuj

Mode: tiny

0 hard-gate flags apply (no auth, no data model, no audit/security, no
external provider, no cross-platform, no validation removed) — a single
skill-prose reference file, one direct task. `fgos graph --json`: tsk-vuj
is its own isolated component (size 1, no deps chain), consistent with
tiny.

## Approach

Chosen path: edit
`plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md`'s
Step 3 only — add three things next to the existing `fanout-batch` bash
block, no other file touched:

1. A note directly above the bash block: **always start `fanout-batch`
   backgrounded** (`run_in_background: true`), never as a foreground
   attempt. Cite the real cause with evidence:
   `fanoutBatchExecutorCli` (`src/runner/dispatch/cli.mjs:687-799`) runs a
   plain `for` loop (line 715) that sequentially awaits
   `pick`->`executeExecutorCli`->`return` per candidate with no
   backgrounding of its own — confirmed by direct read, and confirmed live
   by a 2-minute Bash-timeout (exit 143) on a real 5-candidate batch.
2. A note on how to wait: rely on the harness's own background-completion
   notification, **never** `ScheduleWakeup` — that tool is documented as
   `/loop` dynamic-mode pacing only and requires `prompt` unless
   `stop:true`, which is exactly the second error hit in practice.
3. A new subsection: what to do if the backgrounded `fanout-batch` process
   itself dies mid-run, leaving claimed-but-orphaned children. Point at
   `/fgOS:stale` (`staleDoingAdvisory`/`classifyStaleDoing`,
   `src/state/graph-metrics.mjs:483-514`) as the existing detection
   mechanism, with the real caveat found in research: a claim made through
   `fanout-batch`'s own `fgos pick` call records `claimRole: session`, so
   `classifyStaleDoing` puts it on the slow 24-hour **human** grace, not
   the 15-minute **agent** grace — a caller should not expect `/fgOS:stale`
   to flag a dead fanout-batch claim quickly. Resume by re-driving the
   orphaned id in a fresh session (`/fgOS:pick <id>`) once confirmed dead
   elsewhere and not still legitimately running.

Alternatives rejected:

- **Fixing `fanoutBatchExecutorCli` itself to background its own
  execution** (e.g. spawn detached, return immediately) — rejected for
  this item's scope: the caller (this skill's own reference doc) already
  has a correct, harness-native way to background any Bash call
  (`run_in_background: true`); duplicating that inside the CLI itself
  would be a second, redundant backgrounding mechanism for no real gain,
  and is a larger, riskier change than a doc fix. Out of scope here.
- **Passing `claimRole: runner` from `fanoutBatchExecutorCli`'s own `pick`
  call** so orphaned claims get the fast 15-minute grace instead of
  24-hour — real, found during research (RESEARCH.md round 1, finding 3),
  but changes `src/runner/dispatch/cli.mjs` behavior, not just prose, and
  is a distinct, separately-scoped follow-up. Recorded here as an
  Outstanding question below rather than folded into this doc-only fix.

Files touched (only one):

- `plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md`

Risk map: standard/low — a documentation-only change to prose a session
reads before acting; no runtime code path changes. No proof point beyond
the verify below is needed (risk does not rise to medium/high).

Impact-analysis posture: `full` — corrected after `fgos-coding-validating`'s
reality gate caught an unverified `inactive` claim in an earlier draft of
this section: `fgos tool query --capability impact-analysis --status
present` (re-run fresh at validating) actually returns GitNexus, `status:
"present"`. Full posture changes nothing about this plan's own proof
requirements, though — this item carries no blast-radius-dependent proof
point (a single reference-doc edit with no code path change), so `full`
posture is recorded here for accuracy but triggers no additional row in
the feasibility matrix below.

## Shape

Tiny — a direct, described change to one file, no phased breakdown needed.

Concrete cases the plan already covers by construction (no extra sketch
needed at tiny scale): the empty/boundary case (a 0-candidate or 1-candidate
batch still benefits from always-background guidance, no special case);
existing behavior preserved (Steps 1/2/4/5/6 of wave-dispatch-mechanics.md
are unchanged — only Step 3 gets the three additions above); no concurrent-
access or partial-failure surface is introduced by a prose-only change.

## Split decision

None — pass-through. One honest piece, not split into children.

## Verify

Per `docs/how-to/write-verify-for-a-skill-prose-change.md` (this item edits
a skill-prose reference file consumed at runtime by `fgos-fanout`'s own
Workflow section, the same category that doc's rationale covers even though
its own glob list names `SKILL.md` literally): `npm test`, a POSITIVE arm
proving the new guidance really landed (five distinct, long-enough-to-not-
false-match phrases, scoped to the exact file), and a scope-guard arm
proving this item never touched `src/` (trap #2 from that doc — a bare
POSITIVE with no scope guard would also pass a change that quietly touched
code).

```
npm test && grep -q "Always run this backgrounded" plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md && grep -q "run_in_background: true" plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md && grep -q "Wait for the harness's own background-completion notification" plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md && grep -q "classifyStaleDoing" plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md && grep -q "/fgOS:stale" plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md && ! git diff --name-only main...HEAD | grep -q "^src/"
```

Supersedes the rough two-grep verify set during discovery (a provisional
stab before this skill's own Approach/Shape steps designed the real
command per the standing verify-for-skill-prose doc) — synced onto the
item's own `verify` field below.

## Outstanding questions

None (the `claimRole: runner` follow-up from RESEARCH.md round 1 finding 3
was raised at the Gate; the person split it into its own item, tsk-62w,
dep-linked to tsk-vuj — out of this item's own scope, nothing left open
here).
