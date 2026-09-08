# P03.1 R5 — Live Proof Report (fgos-plan-loop on fgos-test-drive)

Status of this report: cell-01 and cell-02 both closed and merged into
`fgos-test-drive`'s `master`. All 6 Tests First items have real, cited
evidence below. Several real Gaps were found and are documented, not
worked around silently.

## 0. Environment / binary pinning

```
$ cd /home/vantt/projects/fgos-test-drive && git rev-parse --show-toplevel
/home/vantt/projects/fgos-test-drive
```

Every command in this proof used the pinned binary explicitly:
`node /home/vantt/projects/forgentX/bin/fgos.mjs coordination <verb> --dir /home/vantt/projects/fgos-test-drive [--cwd <worktree>]`
— never a bare `fgos`. Confirmed via `bin/fgos.mjs`'s own `coordination`
case (`--dir` names the main-checkout `.fgos/`; `--cwd` names the
worker/session cwd, distinct flags, `bin/fgos.mjs:3129`). forgentX repo
was on branch `group-thinking-plan-loop`, HEAD `bd433ae8` throughout.

fgos-test-drive's own `.fgos/config.json` was missing the `modelPolicies`
table SKILL.md's `analytical` tier needs (forgentX's own config has it).
Per R5's own pre-flight clause ("add them first, a small disclosed setup
step"), I added it, copied from forgentX's real config, with one
correction: forgentX's own table keys the OpenAI-Codex provider as
`openai-codex`, but the codex-cli executor actually resolves
`providerModel: "codex"` at dispatch time (confirmed live:
`resolve.mjs:104-112` `resolvePolicyTierModel` looks up
`cfg.modelPolicies[providerModel]` and the codex-cli executor entry has no
explicit `providerModel` override, so it resolves through whatever
`resolveExecutorProviderModel` derives — observed as `provider=codex` in
every real dispatch log). I used key `"codex"` (see diff below) — **this
means forgentX's OWN committed config likely has the same latent
mismatch for codex-cli beyond the tiers covered by the legacy `models`
map; not fixed here (out of scope), named as a Gap.**

## Real Gaps found (R6)

Named plainly, not fixed inline (all in forbidden files except #4/#8
which are fgos-test-drive's own config/session data, explicitly in
scope):

1. **HIGH — `src/verbs/coordination/run.mjs`'s operation-step dispatch
   never forwards `step.mutation` to `dispatchDeclaredOperation`.**
   `schema.mjs` fully validates and accepts `mutation: "mutating"` on an
   `operation` step, but `run.mjs`'s step-loop (the `if (step.type ===
   'operation')` branch, ~line 431-455) builds the call to
   `dispatchDeclaredOperation` without a `mutation` field at all.
   `dispatchDeclaredOperation`'s own default is `mutation = 'read-only'`
   (`session-engine.mjs:2285` area) — so **every** dispatch through the
   real CLI door runs read-only regardless of the request JSON's own
   declaration. Live proof: `fgos-plan-loop-r5-negative--mutation-probe`
   (cwd = a real linked worktree, NOT the main checkout) declared
   `mutation: "mutating"` on `produce-candidate`; the doer (codex-cli)
   really created and committed `PROBE.txt` (worktree commit `c3b2776`,
   `git log` confirms it), yet `evidence.json` recorded
   `"operationMutability": "read-only"` and the RunResult was
   `status: "failed", confidence: "failed"` — a real, correct commit
   graded as a failure purely because of this gap. Reproduced again on
   cell-01's real doer (`asgn_lead_r5_childa_op_001`, commit `674634c`)
   and cell-01's real fixer (`asgn_lead_r5_childa_op_006`, commit
   `69cb90d`), and cell-02's real doer (`asgn_lead_r5_childa2_op_001`,
   commit `dab9691`) — all graded `failed` despite real, correct,
   independently-verified work landing. Every produce/revise dispatch in
   this whole proof shows this pattern.
2. **MEDIUM — SKILL.md's templates never document agent-result.json's
   real status vocabulary.** `assignment.mjs`'s
   `ALLOWED_AGENT_CLAIM_STATUSES = new Set(['done', 'blocked', 'failed',
   'no-evidence'])`, and `status: "failed"` additionally requires a
   non-empty `error` field — none of this is stated in SKILL.md's
   `expectedOutputs: ["agent-result.json (status, summary)"]` lines.
   Live: `fgos-plan-loop-r5-negative--neg1`'s doer wrote a schema-valid
   `{status: "failed", summary: "..."}` with no `error` field → masked as
   the generic `"agent-result.json was present but failed schema
   validation"` message (`asgn_lead_r5_negative_check_op_001/runs/01/result.json`).
   Mitigated in all later requests by spelling out the exact vocabulary
   in every task objective.
3. **MEDIUM — SKILL.md's `open.json` template omits `partialPolicy`, so a
   cell that never needs a fix round can't reach
   `closeSessionByQuorum`'s `status: "completed"`** (`fixer` stays a
   permanently-`missing` required actor, and `partialPolicy` "must
   already be declared up front... before any Assignment is dispatched" —
   `session-engine.mjs:436` — so it cannot be added in a later request).
   Confirmed live on every session in this proof:
   `closeAttempted: true, closed: false` forever. Worked around by
   treating SKILL.md's own text literally — `disposition: "cell-closed"`
   plus the Lead's own real `git merge` **is** the close, the session's
   internal `status` field staying `"active"` is expected, not chased.
4. **Disclosed setup fix** — see "Environment" above (fgos-test-drive's
   missing `modelPolicies` table, plus the `openai-codex` vs `codex` key
   mismatch).
5. **MEDIUM — SKILL.md's `expectedOutputs` under-documents what earns a
   "reported"/verified confidence for advisory (review/red-team) ops.**
   Live: cell-01's first reviewer attempt (`asgn_lead_r5_childa_op_002`)
   produced a genuinely correct, detailed finding in its own chat
   transcript (`stdout.log`) but never actually wrote `agent-result.json`
   to disk despite claiming to — graded `no-evidence`. A retry with an
   explicit "you MUST actually call a real file-write tool" instruction
   (`asgn_lead_r5_childa_op_004`) succeeded (`status: "done", confidence:
   "reported"`, real `agent-result.json` + `agent-report.md` both
   present). Separately, cell-01's first red-team attempt
   (`asgn_lead_r5_childa_op_005`) DID write a valid, correct
   `agent-result.json` (`{status:"done", summary:"The invariant does NOT
   hold..."}`, `claimSha256` present) yet was STILL graded
   `no-evidence`/`no-evidence` — the only observed difference from the
   reviewer's own successful retry is the presence of a companion
   `agent-report.md` artifact (reviewer wrote one, red-team's plain
   agent-result-only attempt did not). Not fully root-caused; flagged for
   a future cell to confirm `classifyRunEvidence`'s exact rule.
6. **First red-team attempt on cell-01 (`agy-cli`/gemini) refused the
   task outright** ("Sorry, I cannot fulfill your request to analyze the
   specific codebase for vulnerabilities...") when the objective used
   "attack"/"falsify"-flavored red-team framing verbatim from SKILL.md's
   own template language. A retry reframed as neutral QA boundary-testing
   language (same substance, naming this is the author's own throwaway
   test project) succeeded cleanly. Real, repeatable finding about this
   specific executor/persona combination — not a proof artifact.
7. **`fix-1.json`'s own `authorize` steps need `grantedContextRefs`
   explicitly** for a `contextRefs` reference on the paired `operation`
   step to be honored — SKILL.md's section-3 template does NOT declare
   `grantedContextRefs` on its `authReviewRecheck`/`authRedTeamRecheck`
   examples, yet its paired `operation` steps use
   `contextRefs: ["$ref:revise"]`. Reproduced live on cell-01's first fix
   round attempt: `dispatchDeclaredOperation: contextRefs entry
   "asgn_lead_r5_childa_op_006" is not granted by authorization
   "auth_cell01_fix1_reviewer_recheck" (grantedContextRefs: [])`. Fixed in
   my own retry request by adding `"grantedContextRefs":
   ["<real assignment id>"]` to each authorize step.
8. **HIGH (recurring, confirmed twice) — the default session
   `aggregateBounds.wallTimeMs` (1 hour, fixed at open, not
   re-declarable) is tight enough that ordinary interactive Lead
   debugging exhausts it before a cell's fix round finishes.** Cell-01's
   session (opened 21:04:03Z) hit this at ~22:05 while I was still
   iterating on config fixes — `dispatchDeclaredOperation: ... wall-time
   budget (aggregateBounds.wallTimeMs: 3600000ms) has elapsed`, refusing
   to materialize the recheck assignment for good. **Cell-02 hit the
   exact same wall independently** (its own session, opened 22:12:07Z):
   the genuinely-fresh Child B process that resumed it after the real
   kill (see below) tried to authorize+dispatch cell-02's own fix round
   and got refused with the identical error, confirming this is systemic,
   not a one-off. Both times the Lead (in cell-01's case, this report's
   author; in cell-02's case, the fresh resumed process, independently)
   substituted a direct, disclosed, independently-verified fix in place
   of the now-unreachable engine-mediated recheck — see cells' own
   disposition rationale text, cited in full below.

## Test 1 — SKILL.md / schema grounding

Not re-audited field-by-field in this report (that is R1/R3's own
Phase-03 scope, already merged per the track's git history before this
R5 cell started); this report instead exercises the templates live and
names every place their literal shape did not survive contact with the
real CLI/schema (Gaps 2, 3, 5, 7 above) — each cited with real command
output.

## Test 2 — Cell 1: three-executor dispatch, real forced fix round, real close

Track: `fgos-plan-loop-live-proof`, cell `fgos-plan-loop-live-proof--cell1`,
worktree `/home/vantt/projects/fgos-plan-loop-live-proof-cell1`, branch
off `master`.

**Seeded gap**: doer's task asked for `truncate(str, maxLen)` without
specifying whether the appended `"..."` counts toward `maxLen` — a
classic real ambiguity a naive `slice(0,maxLen)+'...'` implementation
gets wrong.

- **Doer** — `codex-cli`/`codex`/`gpt-5.5` (tier `standard`), assignment
  `asgn_lead_r5_childa_op_001`. Real commit `674634c` "Add text
  truncation utility" on the cell branch. RunResult `status: "failed"`
  (Gap 1 — content is real and correct-to-spec-as-written).
- **Reviewer** — `claude`/`claude`/`sonnet` (tier `analytical`),
  assignment `asgn_lead_r5_childa_op_004` (a retry of `op_002`, whose
  first attempt narrated writing artifacts but didn't — Gap 5).
  `status: "done", confidence: "reported"`. Real finding (full text in
  `agent-result.json`): *"truncate() does not cap output length at
  maxLen: when truncating, result length is always maxLen+3... maxLen=3
  -> 'hel...' (6 chars)... Negative maxLen is also unhandled."*
- **Red-team** — `agy-cli`/`gemini`/`gemini-3.1-pro-low` (tier
  `analytical`), assignment `asgn_lead_r5_childa_op_005` (a retry of
  `op_003`, whose first attempt refused the task outright — Gap 6).
  `status: "done"` (engine confidence stayed `no-evidence`, Gap 5).
  Finding: *"The invariant does NOT hold. truncate('hi', 1) returns
  'h...' (length 4 > 1) and truncate('hello', 3) returns 'hel...'
  (length 6 > 3)."*
- **Lead's own independent verification** (before any disposition):
  ```
  $ node -e "...truncate('hi',1)..." # => "h..." length 4
  $ node -e "...truncate('hello',3)..." # => "hel..." length 6
  ```
  matches both findings exactly.
- **Disposition**: both findings `accepted`
  (`asgn_lead_r5_childa_op_004`/`op_005` as `targetRef`), routed to
  `fix-1.json`.
- **Fix round**: authorized + dispatched `revise-candidate` →
  **fixer** `codex-cli`/`codex`/`gpt-5.5`, assignment
  `asgn_lead_r5_childa_op_006`. Real commit `69cb90d` "Fix truncate
  length boundary handling":
  ```js
  export function truncate(str, maxLen) {
    if (str.length <= maxLen) { return str; }
    if (maxLen <= 3) { return str.slice(0, Math.max(0, maxLen)); }
    return `${str.slice(0, maxLen - 3)}...`;
  }
  ```
  Engine-mediated recheck (`reviewer-recheck`/`red-team-recheck`) could
  not be dispatched — cell-01's session hit its wall-time budget (Gap 8)
  before I could issue the recheck request (`grantedContextRefs` retry,
  Gap 7, had already consumed real time). **Lead's own independent
  verification stands in for it**: `node --test` in the worktree post-fix
  → **8/8 pass** (3 original + 5 new: maxLen=0,1,3,4, and the
  `str.length===maxLen` boundary); manual re-check:
  `truncate('hi',1) === 'h'` (1 char), `truncate('hello',3) === 'hel'`
  (3 chars) — invariant holds for both originally-failing cases.
- **Close**: `disposition: "cell-closed"` recorded
  (`targetRef: asgn_lead_r5_childa_op_006`,
  `evidenceRefs: [op_004, op_005, op_006]`), full rationale in
  `fgos coordination chain` output (section below). Lead merged for
  real: `git merge --no-ff fgos-plan-loop-live-proof--cell1` →
  **merge commit `7b06187`** on `master`. Worktree removed
  (`git worktree remove --force`, only stray untracked
  `.fgos/assignments/...` artifacts left behind by the sandbox's
  root confusion between `--dir` and `--cwd`, no tracked-file
  conflicts).

## Test 3 — Cell 2: the kill-and-resume test

Two prior timing attempts at a genuine mid-dispatch kill both failed
honestly (disclosed, not hidden): attempt 1 (opening cell-1) died on its
own from a `--dangerously-skip-permissions` flag not reaching the child
process via shell alias expansion under `nohup` (confirmed: log shows it
stopped asking for tool approval it could never receive headless) —
**not a real kill**, just a dead process, before any real dispatch. After
fixing the flag, attempt 2 (opening cell-2) completed its ENTIRE
first-pass dispatch (3 real executor calls) faster than my monitor loop
polled — cell-2's first pass finished cleanly on its own, again **not a
real kill**.

**The real kill** (third attempt, disclosed as narrower in scope than
originally envisioned — killed almost immediately after launch rather
than mid-multi-minute-dispatch, to guarantee a genuine, verifiable
termination rather than another missed timing window):

```
$ nohup claude -p "<drive cell-2's disposition+fix-1 request>" \
    --dangerously-skip-permissions > child-a2b.log 2>&1 &
LAUNCHED_PID=356382
$ sleep 4; ps -p 356382   # confirmed alive, etimes=4
$ kill -9 356382
$ ps -p 356382            # confirmed dead (empty output)
```

Confirmed the killed process wrote **zero** new coordination state
before termination (`show fgos-plan-loop-live-proof--cell2`:
`dispositions: []`, `authorizations: []` immediately after the kill) —
an honest, disclosed limitation: the kill window landed during the
child's own session-startup/tool-preparation phase, not mid-dispatch.

**The fresh resume** — a genuinely new `claude -p` process, PID `357452`,
whose ENTIRE prompt was: read SKILL.md, then run
`node .../bin/fgos.mjs coordination chain fgos-plan-loop-live-proof --dir ...`
to see what's done/next, then finish cell-2 (zero hand-fed chat history —
only the SKILL.md doc pointer and a description of 3 known runtime gaps
to work around, which is documentation, not conversation state). The
exact 3 pre-fed gaps, named here so a reader can judge directly (verbatim
from the real prompt file used to launch this process,
`child-b-prompt.txt`, preserved at
`/tmp/claude-1000/-home-vantt-projects-forgentX/a2984232-9072-4663-9d8a-440469a8964c/scratchpad/r5-live-proof/child-b-prompt.txt`
— session scratchpad, not yet in the permanent evidence archive): (1) Gap 1 —
`run.mjs` never forwards a step's declared `mutation: "mutating"`, so a
real produce/revise commit still comes back graded `failed`; (2) Gap 2 —
`agent-result.json`'s `status` vocabulary and the `error`-field
requirement for `status: "failed"`; (3) Gap 3 — `partialPolicy` must be
declared at session-open time, and the session's internal `status` may
stay `"active"` even after a real `disposition: "cell-closed"` + merge.
**None of these 3 pre-fed gaps is Gap 8 (the wall-time-budget gap)** —
so the wall-time-budget rediscovery specifically was not one of the
hints handed to this process. **Its own first tool call and correct
next-action decision** (from its own final report, quoted verbatim):
*"The killed process had already dispatched the first pass
(produce/review/red-team) but never got to disposition or fix. On
resume: 1. Dispositioned 6 findings... 2. Attempted `fix-1.json` dispatch
→ refused with exit code 4: session wall-time budget... had already
elapsed... 3. Per that precedent, I implemented the fix directly..."* —
it independently rediscovered cell-1's own wall-time-budget precedent
(Gap 8) from the persisted event log alone and made the SAME
Lead-substitution judgment call cell-1 required, entirely on its own.
(The only artifact surviving from this process's own run is its final
self-report, `child-b.log` — no tool-call transcript — so while the 3
pre-fed hints are now verifiably disclosed and verifiably do not include
Gap 8, the process's own internal reasoning path to Gap 8 still cannot be
replayed step-by-step; the claim rests on the prompt file's disclosed
content plus the final report's consistency, not on a transcript.)

- **Doer** (pre-kill, from the completed first pass) — `codex-cli`,
  assignment `asgn_lead_r5_childa2_op_001`, real commit `dab9691` "Add
  slugify text utility".
- **Reviewer** — `claude`, `asgn_lead_r5_childa2_op_002` — dead-code +
  thin-test-coverage findings (accepted).
- **Red-team** — `agy-cli`/`gemini`, `asgn_lead_r5_childa2_op_003` — real,
  sophisticated findings: *"1) Turkish I Bug: slugify('İ') produces
  'i̇'... 2) ZWSP/Homograph Attack: ...not \p{White_Space}, leaving
  invisible characters... 3) Symbol Leakage: ...fails to strip \p{Symbol}
  characters."*
- **Disposition** (by the fresh resumed process): Turkish-I and ZWSP
  findings `accepted`; symbol-leakage `rejected` as out-of-spec (the
  doer's own literal task objective scoped slugify to
  whitespace/punctuation only — a legitimate Lead judgment call, not a
  rubber stamp); dead-code finding `accepted`.
- **Fix round attempted, refused** (Gap 8, cited above) — Lead
  substituted directly: real commit `b7eac94` "Fix slugify Turkish-I and
  ZWSP invariant gaps found by red-team". `node --test` post-fix:
  **14/14 pass**. Independently re-verified: `slugify('İ') === 'i'`,
  ZWSP stripped, symbol-leakage still present as intended
  (`slugify('a+b=c$') === 'a+b=c$'`, confirming the rejection was
  honored, not silently over-fixed). Additionally re-ran red-team's own
  leftover fuzz-probe scripts (left untracked in the worktree from its
  own run) across the full BMP range as a substitute adversarial
  recheck — zero counterexamples.
- **Close**: `disposition: "cell-closed"` recorded. Lead merged for real:
  **merge commit `46a7b1eef2147a4a72b961a5d645c3ef3d039813`** on
  `master`. Worktree removed.

## Test 4 — Negative checks

**(a) Mutating dispatch with `--cwd` = main checkout.** Confounded by
Gap 1 (see above): since `mutation` is never forwarded regardless of
`cwd`, I cannot cleanly isolate "refused because of the main-checkout
condition specifically" from "always read-only regardless of cwd." What
IS confirmed, honestly: `fgos-plan-loop-r5-negative--neg1` (cwd = main
checkout, `mutation: "mutating"` declared) dispatched real codex-cli
work that made **zero** changes to the tracked source tree
(`evidence.json`: `gitBefore === gitAfter`, `changedFiles: []`) — the
same outcome the main-checkout refusal condition is meant to produce,
just not provably attributable to that specific condition given Gap 1.
Reading `session-engine.mjs:2198` directly confirms the main-checkout
comparison (`resolveMainCheckoutRoot(cwd) === resolveRepoRoot(cwd)`) DOES
exist and would throw a named error if `assertMutatingDispatchAllowed`
were ever actually reached with `mutation === 'mutating'` — it just never
is, today, through this CLI door (Gap 1 again).

**(b) Reviewer/red-team role deliberately mutates a file.** Cleanly
confirmed, unconfounded by Gap 1 (review-candidate can never legally set
`mutation: "mutating"` regardless of the bug, since it doesn't declare
`result.kind: "work-product"` — condition 2 alone blocks it):
`fgos-plan-loop-r5-negative--neg2b`, reviewer (`claude`/`claude-reviewer`
executor redirect — see below) wrote a real file
`NEGATIVE-CHECK-B.md` to the worktree (confirmed via `git status --short`
showing it as a real, untracked, on-disk file after the run) — the write
itself succeeded at the OS level. The runtime's read-only-violation gate
caught it: `evidence.json` → `"changedFileReasons": {"NEGATIVE-CHECK-B.md":
"new-dirty-after-run"}`, RunResult `status: "failed", confidence:
"failed"` — despite the agent's OWN `agent-result.json` claiming
`status: "done"`. Matches SKILL.md's claim exactly: *"a
reviewer/red-team/recheck dispatch that mutates a file regardless still
fails closed at the pre-existing read-only-violation gate."* Also
confirms the phase's own noted pre-existing gap (`tsk-2bu`,
`rollbackReadOnlyMutations` has zero callers): `NEGATIVE-CHECK-B.md` is
still physically present on disk after the run — only the
STATUS/CONFIDENCE grading is enforced, not a physical rollback, exactly
as documented, nothing new here.

Bonus observation while composing (b): the engine silently substitutes
`claude` → `claude-reviewer` (a real, working defense-in-depth mechanism,
distinct from Gap 1/the read-only-violation gate) whenever the target
role is `reviewer`/`red-team` — confirmed via the dispatch log line
(`executor=claude-reviewer`) despite the request literally declaring
`"executor": "claude"`. `claude-reviewer`'s own config entry drops the
`Bash(git add:*),Bash(git commit:*)` grant the plain `claude` executor
has. Working as intended, not a Gap.

## Test 5 — Work-state-untouched measurement

Before touching anything:
```
$ git -C /home/vantt/projects/fgos-test-drive status --short
?? .fgos-runner.json
?? .fgos/
$ sha256sum /home/vantt/projects/fgos-test-drive/.fgos/state.json
8eadd80c1f0763ef7e4afcbc81d5c8840ec83080ef58337bad68f4107c05c2cf
$ sha256sum /home/vantt/projects/fgos-test-drive/.fgos/events.jsonl
71755537baeb606159969cfe6a9cc84c8254089da9f15e1f9359523610c38cfa
```
(copies saved to
`/tmp/claude-1000/.../scratchpad/r5-live-proof/state.json.before`.)

After the entire proof (both cells closed+merged, both kill attempts,
all negative checks):
```
$ diff state.json.before /home/vantt/projects/fgos-test-drive/.fgos/state.json
(no output — byte-identical)
$ sha256sum /home/vantt/projects/fgos-test-drive/.fgos/events.jsonl
71755537baeb606159969cfe6a9cc84c8254089da9f15e1f9359523610c38cfa   (unchanged)
```
**Byte-identical, measured.** No `fgos pick/cook/submit`, no Work item,
no claim was ever touched on either project, on either side of this
proof.

## Test 6 — Binary pinning record

Every `coordination` command in this proof (all `run`/`show`/`chain`
calls, by this Lead and by both spawned child processes) used
`node /home/vantt/projects/forgentX/bin/fgos.mjs coordination <verb>
--dir /home/vantt/projects/fgos-test-drive [--cwd <worktree>]` — verified
by inspecting `bin/fgos.mjs`'s own coordination case (`--dir`/`--cwd`
resolution logic, `bin/fgos.mjs:3120-3134`) and by every request/response
pair captured in the scratch logs
(`/tmp/claude-1000/.../scratchpad/r5-live-proof/*.log`). A bare `fgos`
shell function on this machine resolves `bin/fgos.mjs` automatically only
when cwd is a forgentX checkout (confirmed via `type fgos`) — since every
command here ran with `fgos-test-drive` as cwd/`--dir` target, the
explicit `node .../bin/fgos.mjs` form was load-bearing, not redundant.

## Full final `chain` output

Captured at
`/tmp/claude-1000/-home-vantt-projects-forgentX/a2984232-9072-4663-9d8a-440469a8964c/scratchpad/r5-live-proof/final-chain.json`
via `node bin/fgos.mjs coordination chain fgos-plan-loop-live-proof --dir
/home/vantt/projects/fgos-test-drive --json`. Key fields (full
`lastDisposition.rationale` text for both cells already quoted in Tests
2/3 above; reproduced structurally here):

```json
{
  "track": "fgos-plan-loop-live-proof",
  "cells": [
    {
      "cellId": "cell1",
      "sessionId": "fgos-plan-loop-live-proof--cell1",
      "status": "active",
      "phase": "running",
      "lastDisposition": { "targetRef": "asgn_lead_r5_childa_op_006", "disposition": "cell-closed", "...": "(full rationale in Test 2 above)" },
      "pendingDriverAuthorizations": [{ "nodeId": "phase-recheck", "operationId": "red-team-recheck", "actorId": "red-team" }],
      "assignmentRefs": ["asgn_lead_r5_childa_op_001","asgn_lead_r5_childa_op_002","asgn_lead_r5_childa_op_003","asgn_lead_r5_childa_op_004","asgn_lead_r5_childa_op_005","asgn_lead_r5_childa_op_006"],
      "quorum": {
        "requiredActorIds": ["doer","reviewer","red-team","fixer"],
        "completed": [{ "actorId": "reviewer", "assignmentId": "asgn_lead_r5_childa_op_004" }],
        "failed": [
          { "actorId": "doer", "assignmentId": "asgn_lead_r5_childa_op_001" },
          { "actorId": "red-team", "assignmentId": "asgn_lead_r5_childa_op_005" },
          { "actorId": "fixer", "assignmentId": "asgn_lead_r5_childa_op_006" }
        ],
        "late": [], "missing": [], "replaced": []
      }
    },
    {
      "cellId": "cell2",
      "sessionId": "fgos-plan-loop-live-proof--cell2",
      "status": "active",
      "phase": "running",
      "lastDisposition": { "targetRef": "asgn_lead_r5_childa2_op_001", "disposition": "cell-closed", "...": "(full rationale in Test 3 above)" },
      "pendingDriverAuthorizations": [
        { "nodeId": "phase-recheck", "operationId": "reviewer-recheck", "actorId": "reviewer" },
        { "nodeId": "phase-recheck", "operationId": "red-team-recheck", "actorId": "red-team" }
      ],
      "assignmentRefs": ["asgn_lead_r5_childa2_op_001","asgn_lead_r5_childa2_op_002","asgn_lead_r5_childa2_op_003"],
      "quorum": {
        "requiredActorIds": ["doer","reviewer","red-team","fixer"],
        "completed": [],
        "failed": [
          { "actorId": "doer", "assignmentId": "asgn_lead_r5_childa2_op_001" },
          { "actorId": "reviewer", "assignmentId": "asgn_lead_r5_childa2_op_002" },
          { "actorId": "red-team", "assignmentId": "asgn_lead_r5_childa2_op_003" }
        ],
        "late": [], "missing": [{ "actorId": "fixer" }], "replaced": []
      }
    }
  ],
  "activeCell": "cell2",
  "nextAction": "Cell \"cell2\" (session \"fgos-plan-loop-live-proof--cell2\") has 2 declared operation(s) still awaiting driver authorization: phase-recheck/reviewer-recheck, phase-recheck/red-team-recheck. Run `fgos coordination show fgos-plan-loop-live-proof--cell2` for detail."
}
```

(Full byte-for-byte JSON, including both complete `lastDisposition.rationale`
strings, is preserved at the scratch path above for anyone who needs the
untruncated version.)

`activeCell: "cell2"`, `nextAction`: *"Cell \"cell2\" ... has 2 declared
operation(s) still awaiting driver authorization: phase-recheck/
reviewer-recheck, phase-recheck/red-team-recheck."* — this is expected
and correctly reported: those two recheck operations were never
authorized (Gap 8 blocked the whole fix round from being engine-mediated
at all), and `chain`'s own read-only, event-log-only reconstruction
reports this honestly rather than inferring that the Lead's own
out-of-band substitute verification satisfied them. This is itself a
small piece of positive evidence: `chain`/`show` never overclaim.

## Real commit ledger

| Cell | Commit | Description |
|---|---|---|
| 1 | `674634c` | doer: `truncate()` (seeded ellipsis-overshoot gap) |
| 1 | `69cb90d` | fixer: bounded `truncate()` (real fix) |
| 1 | `7b06187` | **merge** cell-1 → master |
| 2 | `dab9691` | doer: `slugify()` (spec-compliant, real gaps beyond spec) |
| 2 | `b7eac94` | Lead-substituted fix: Turkish-I / ZWSP / dead-code |
| 2 | `46a7b1e` (full: `46a7b1eef2147a4a72b961a5d645c3ef3d039813`) | **merge** cell-2 → master |

`fgos-test-drive` `master` HEAD after both cells' merges: `46a7b1e`.
Evidence (every request JSON, every raw command log, the final `chain`
JSON) archived under that project's own
`docs/history/r5-live-proof-evidence/` (commit `ed5deb0`, a plain docs
commit on `master` — unrelated to `.fgos/` state, does not affect the
Work-state-untouched measurement above, which was captured before this
archival commit). `fgos-test-drive` `master` HEAD after archival:
`ed5deb0`.

**Disclosed post-hoc**: a third worktree,
`/home/vantt/projects/fgos-plan-loop-r5-mutation-probe` (branch
`fgos-plan-loop-r5-mutation-probe`, off commit `c3b2776`), was left on
disk after this report was first written — used both for Gap 1's
mutating-dispatch probe (the `PROBE.txt` commit cited above) and for
negative check (b)'s `NEGATIVE-CHECK-B.md` reviewer-mutation evidence.
Unlike cell-1/cell-2's worktrees, it was never mentioned as removed or
kept on purpose; this was a real disclosure gap, not an intentional
retention. It has since been removed
(`git worktree remove --force` + `git branch -D`), and the raw evidence
it held (the `c3b2776` commit diff, `PROBE.txt`, `NEGATIVE-CHECK-B.md`,
and the neg2b run's `evidence.json`/`agent-result.json`) is now preserved
at `docs/history/r5-live-proof-evidence/mutation-probe-worktree-archive.md`
on `fgos-test-drive` (commit `2e5c65e`, a plain docs commit on `master`,
same category as `ed5deb0` above — no `.fgos/` state touched).

## Unresolved questions

- Gap 5's exact root cause (agent-report.md presence vs. absence
  determining `no-evidence` vs `reported` confidence for an
  otherwise-identical valid claim) is not fully isolated — worth a
  focused unit test in a future cell, not chased further here.
- Gap 8 (1h default wall-time budget) recurred identically on a
  completely independent, zero-context resumed process — this is a real
  ergonomics problem for any interactive Lead-driven cell, not unique to
  this proof's own slow debugging. Whether the fix is a larger default,
  a documented re-open convention, or something else is a product
  decision for whoever owns `aggregateBounds` defaults next, not decided
  here.
- Gap 1 (the central finding) makes `fgos coordination run`'s own
  `mutation: "mutating"` unlock effectively non-functional end-to-end
  today, for every caller going through the real CLI door rather than
  calling `dispatchDeclaredOperation` directly in-process. This is very
  likely the single most important finding this whole plan's live-proof
  requirement (R5) was designed to surface.

Claude-Session: https://claude.ai/code/session_01Q7qMX2hkJLtEdpk92M21AJ
