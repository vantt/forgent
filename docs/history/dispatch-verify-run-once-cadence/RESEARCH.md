# Research log — dispatch verify-cadence (tsk-2ky)

## Round 1 — 2026-08-19 (discovery stage, fgos-researching helper)

**Asked:** Do the worker-facing prompt templates or the shared coding-worker
contract already state an explicit "run the real verify command exactly
once, near the end, after all edits are made" cadence rule, or is that
constraint genuinely absent today?

**Checked:**
- `src/runner/prompt-templates/worker-prompt-skill-pointer.txt` (full file,
  1-49) — "Expected proof" section (lines 24-27): "Your work is judged only
  by this verify command, which the runner runs itself after you finish
  (your own report is never trusted on its own): {verify}". No cadence or
  frequency language anywhere in the file.
- `src/runner/prompt-templates/worker-prompt-default.txt` (full file,
  1-43) — identical "Expected proof" wording (lines 18-21), same absence.
  Confirms the gap is not specific to the skill-pointer variant; both
  worker-facing templates share the same text.
- `.agents/skills/_shared/coding-worker-contract.md` (full file, 1-192) —
  Layer 2 rule 2 (lines 84-89): "Verify is a real shell command, run before
  you claim done... Run it yourself; if it fails, fix the root cause and
  rerun the exact command." States WHO runs it and WHEN AT MINIMUM (before
  claiming done), never a cap on how many times or "once, near the end".
  "rerun the exact command" (line 87) is itself conditioned on a prior
  failure — not a general invitation to iterate, but not a prohibition on
  iterating either.
- `rg -i "exactly once|run it once|once, near the end|verify cadence|re-run.*verify|repeatedly.*verify"` across `src/runner/prompt-templates`,
  `.agents/skills/_shared`, `docs` — no cadence rule found anywhere in
  worker-facing text. One directly relevant hit outside worker-facing text:
  `.agents/skills/_shared/executor-dispatch-fallback.md:100-103` (a
  DRIVER-side doc, not worker-facing) already documents this exact failure
  mode as observed and worked around, not fixed at the source: "an executor
  that iterates by re-running its own full verify command several times
  mid-run flooded the relay ... tripping Monitor's own rate-limit" — this
  is the citation tsk-2ky's own description already names as "already fixed
  as its own small, separate thing" (the tee-filter fix). The repo has
  precedent for treating repeated-verify as an accepted/routed-around
  executor behavior at the relay layer, not (yet) something the worker
  contract tries to prevent at the source.

**Found:** No worker-facing text — neither prompt template, nor the shared
contract — states any verify-cadence rule (frequency, timing relative to
edits, or a cap on re-runs) today. The two textual candidates named in the
item's own description are both confirmed verbatim and both genuinely
silent on cadence, not just under-specified. The only existing repo
reference to "runs verify multiple times mid-run" treats it as a known
relay-layer symptom to filter around (`executor-dispatch-fallback.md`),
not a worker-instruction gap flagged for a text fix.

**Verdict:** clear — the absence is confirmed by direct reading of both
candidate files in full, not inferred from the item's own paraphrase.

## Round 2 — 2026-08-19 (discovery stage, fgos-researching helper)

**Asked:** What do the already-proven executors' (pi, claude) own past
live proof-test transcripts show about verify-run cadence — once near the
end, or repeatedly mid-run like agy/gemini-3.6-flash-medium did on
tsk-4bq?

**Checked:**
- `docs/history/pi-executor-runtime-capacity/RESEARCH.md` Round 4 (lines
  180-323), attempt 4b (the completion path, lines 218-247): the
  throwaway item `tsk-1o8j` was created with `verify: "true"` (line 200 —
  the trivial always-pass shell builtin). The transcript records `pi`'s
  tool calls as `read`, `write`, `bash` across 310 JSON lines and lists
  five concrete actions (re-read skill chain, write file, commit, no
  merge/fgos-call, report `[DONE]`) — it never separately calls out a
  `verify`-command execution step at all, trivial or otherwise. No
  count, no timing recorded.
- `docs/history/claude-named-executor/RESEARCH.md` Round 5 (lines
  355-397): the throwaway item `tsk-3i1` used `verify: "test -f
  PROOF2.txt"` (line 397's own quoted stdout: "Verify passed (`test -f
  PROOF2.txt`)") — also a trivial, near-instant file-existence check, not
  a real multi-step test suite. The stdout line implies the verify ran at
  least once, but the transcript records no count or mid-run timing
  either.

**Found:** Both existing proof-tests used a deliberately trivial/cheap
verify command (`true`, `test -f <file>`) precisely because their own
purpose was proving contract compliance (worktree boundary, commit
discipline, `[DONE]`/`[BLOCKED]` vocabulary), not verify-cadence. Neither
transcript records how many times verify ran or when relative to edits —
a cheap check re-run several times would be invisible in both transcripts
and in practice harmless. This means: **the repeated-verify behavior
observed on tsk-4bq (agy/gemini, full `npm test`, 6 re-runs) is NOT
contradicted or confirmed by either existing proof-test** — there is no
existing evidence either way for whether `pi` or `claude` would behave
differently from `agy`/`gemini` against a real, expensive verify command.
Establishing that would need a NEW live dispatch with a non-trivial verify
command, which is outside what discovery-stage evidence-gathering alone
can produce.

**Verdict:** clear — the absence of cadence evidence in prior proof-tests
is itself a confirmed, evidenced finding (not a guess), and it correctly
scopes what this item CAN vs. CANNOT conclude from existing repo history
alone.

## Round 3 — 2026-08-19 (executing stage, live dispatch of this item's own Implement step)

**Observed, not asked-for:** this item's own Implement step was dispatched
out-of-process to `agy`/`gemini-3.6-flash-medium` — the exact
provider/model combination originally observed misbehaving on tsk-4bq.
The worker's own returned `stdout` (full dispatch result in
`.fgos/events.jsonl` seq 21243/nearby, `executor.dispatch`) shows three
separate background launches of the item's own verify command before
landing: "I have launched the verification command... in the background
(task-21)... launched the updated verification command... (task-37)...
launched the final proof check... (task-53)."

**Caveat — not a clean A/B test:** the cadence rule this item adds did
NOT exist in `coding-worker-contract.md` at the START of this dispatch —
the worker was creating that very sentence as its own deliverable, so
this is not "same provider, rule already present, still re-verifies 3x".
It cannot be read as evidence the new rule fails to change behavior.

**What it IS evidence for:** an anecdotal, live, same-session confirmation
that `agy`/`gemini-3.6-flash-medium` has a real, recurring tendency to
re-run a cheap/moderate verify command multiple times per task rather
than once (3x here, vs. 6x on tsk-4bq's own much larger multi-file
change) — mildly supporting root-cause candidate #2 from this item's own
description ("provider/model natural behavior... a normal, even
reasonable, agentic habit absent a stated constraint against it") without
ruling out candidate #1 (the now-fixed textual gap), since the rule
was not yet in force during this run.

**Follow-up this surfaces (not actioned by this item — named, not
created):** a true A/B check — same provider, a fresh item whose
`coding-worker-contract.md` ALREADY carries the new cadence sentence at
dispatch start — would be the definitive way to test whether the fix
this item lands actually changes agy/gemini's behavior. Left as a named
follow-up per this item's own plan.md Alternative #2 (out of this item's
own scope), not spawned as a new backlog item by this session on its own
authority.
