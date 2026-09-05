# Red-Team Report — P03.1 R5 Live Proof (independent, parallel to Reviewer)

Verdict: **APPROVE_WITH_CONCERNS**. Attempted real falsification of all six
assigned attacks against the real, currently-present evidence (not a
re-read of the report's own narration). The core proof holds up under
attack: real cross-provider dispatches, a real seeded bug genuinely caught
and fixed, a real kill (`kill -9` on a live PID, confirmed dead), real
merge commits, and real, independently-reproducible zero-touch of
`fgos-test-drive`'s own Work state. Two real concerns found, neither of
which invalidates R5's substance but both of which the report should
correct before being taken as fully transparent.

## Attack 1 — Work-state-untouched, harder

Went beyond re-checking the sha256 before/after (which only proves the two
endpoints match, not that nothing happened transiently in between):

```
$ cd /home/vantt/projects/fgos-test-drive
$ git log --all --diff-filter=A --oneline -- .fgos .fgos-runner.json
(empty)
```

Across the ENTIRE git history of every ref (`--all`, not just current
branch), `.fgos/` and `.fgos-runner.json` have never once been added by
any commit — they are permanently untracked. Also:

```
$ grep -rniE 'fgos (pick|cook|submit|approve)|"kind":\s*"work|workRef|missionId' \
    docs/history/r5-live-proof-evidence/
(zero matches)
```

No Work-verb invocation or Work-shaped field appears anywhere in the
archived request JSONs or raw command logs. **Result: the
Work-state-untouched claim is real and independently reproducible, on
stronger grounds than the report's own before/after hash comparison
alone.** No finding.

## Attack 2 — the "genuinely fresh, zero-context resume" claim

**MEDIUM — the report's own text contradicts itself on this exact claim.**

The report (line ~259-264) states the fresh resumed process's ENTIRE
prompt was "read SKILL.md, then run `fgos coordination chain` ... zero
hand-fed chat history — only the SKILL.md doc pointer **and a description
of 3 known runtime gaps to work around**, which is documentation, not
conversation state."

Separately (line ~271-274) the SAME report claims this process
"independently rediscovered cell-1's own wall-time-budget precedent (Gap
8) from the persisted event log alone ... entirely on its own."

These two claims cannot both be fully true unless the report discloses
that Gap 8 (the wall-time-budget exhaustion) was NOT one of the 3
pre-fed "known runtime gaps" — and it never names what those 3 gaps
actually were. Checked the only surviving artifact of that process,
`docs/history/r5-live-proof-evidence/child-b.log` (37 lines): it contains
**only the process's own final self-narrated report**, no tool-call
transcript (consistent with plain `claude -p` non-streaming output — no
`--output-format stream-json`/`--verbose` was used, confirmed absent from
every command citation in the report). Searched the whole evidence
archive and `/tmp` for any fuller transcript under that process's PID
(`357452`) or "child-b" — none exists.

**Conclusion**: there is no way, from the real evidence available, to
verify whether the wall-time-budget rediscovery was actually independent
or was one of the 3 things it was told to expect. The report's
"entirely on its own" framing for this specific sub-claim is not
falsifiable either way from disclosed evidence, and given the prompt
admittedly included gap-hints, it reads as plausibly overclaimed. This
does not undo the parts of Test 3 that ARE independently verifiable (the
real kill+dead-PID sequence, the real correct disposition of 6 findings,
the real fix commit `b7eac94`, the real merge `46a7b1e` — all confirmed
by git log below) — but the "zero-context" characterization of the
specific wall-time-budget judgment call is weaker than stated.

Violated requirement: phase-03.md Test-3 acceptance ("the fresh...
session's own first tool call ... made with zero hand-fed context").
Smallest fix: the report should either name the exact 3 gaps disclosed
upfront (so a reader can judge overlap with Gap 8 directly) or drop the
"entirely on its own"/"from the persisted event log alone" framing for
the wall-time-budget rediscovery specifically.

## Attack 3 — Gap 1 (HIGH, run.mjs never forwards mutation), re-verified from source

Confirmed real, not a misreading, directly from the current repo state
(branch `group-thinking-plan-loop`, HEAD `3b80bbf8`):

```
$ grep -n "mutation" src/verbs/coordination/run.mjs
(zero matches — exit code 1)
```

The word "mutation" does not appear anywhere in `run.mjs`. Read the
operation-step dispatch branch directly (`run.mjs:429-455`): the object
literal built for `dispatchDeclaredOperation` lists `operationId`,
`targetActorId`, `objective`, `expectedOutputs`, `contextRefs`,
`constraints`, `capabilities`, `writerId`, `fromAssignmentId`, `intent`,
`round`, `taskKey`, and conditionally `cliPolicy` — no `mutation` key,
even though `step.mutation` is a real, schema-validated field on an
`operation` step. Cross-checked the callee
(`src/runner/coordination/session-engine.mjs:2288` area,
`dispatchDeclaredOperation`'s own destructured params): `mutation =
'read-only'` is the default, and the function's own doc comment states
plainly the default "preserves every pre-existing caller's behavior
byte-for-byte — only a caller that explicitly passes 'mutating' ever
reaches `assertMutatingDispatchAllowed`." Since `run.mjs` never passes it,
this default silently applies to every real CLI-door dispatch regardless
of what the request JSON declares.

This is source-level, unambiguous confirmation — not something a
correctly-formed request could have avoided; the bug is in the caller
(`run.mjs`), not in any request shape. Smallest fix: add `mutation:
step.mutation` to the object literal at `run.mjs:429-448`.

## Attack 4 — commit ledger + hidden artifacts

```
$ git -C fgos-test-drive log --all --oneline
ed5deb0 docs: archive P03.1 R5 live-proof evidence (fgos-plan-loop)
b7eac94 Fix slugify Turkish-I and ZWSP invariant gaps found by red-team
dab9691 Add slugify text utility
69cb90d Fix truncate length boundary handling
674634c Add text truncation utility
c3b2776 Add mutation probe
987e8f0 feat: add isPalindrome string utility with tests   <- pre-existing, unrelated to this proof
521b44f first commit
$ git branch -a
* master
  fgos-plan-loop-live-proof--cell1
  fgos-plan-loop-live-proof--cell2
  fgos-plan-loop-r5-mutation-probe
  fgw/tsk-2rl5x                                            <- pre-existing, unrelated
$ git worktree list
~/projects/fgos-test-drive                    ed5deb0 [master]
~/projects/fgos-plan-loop-r5-mutation-probe   c3b2776 [fgos-plan-loop-r5-mutation-probe]
```

Every commit hash in the report's own ledger matches exactly (`674634c`,
`69cb90d`, `7b06187` merge, `dab9691`, `b7eac94`, `46a7b1e` merge,
`ed5deb0` archive) — no hidden or omitted commit found.

**MEDIUM — one real, undisclosed leftover: the
`fgos-plan-loop-r5-mutation-probe` worktree AND its branch are still
present on disk right now**, at
`/home/vantt/projects/fgos-plan-loop-r5-mutation-probe`, containing
untracked `PROBE.txt` and `NEGATIVE-CHECK-B.md`. The report explicitly
states "Worktree removed" for both cell-1 and cell-2 (lines 220-221,
303), but never mentions this third worktree/branch at all — neither as
removed nor as intentionally kept. It is genuinely still there
(`git status --short` in that worktree shows `?? NEGATIVE-CHECK-B.md`;
`ls -la` shows real file timestamps from 2026-09-05 04:00-04:08). Given
this whole proof ran against a real, separate host project that the
plan's own P02 coordinator note explicitly worried about disrupting
("real, in-progress, unrelated user work already on it that a mis-run
proof could disrupt"), leaving an un-mentioned worktree + branch behind
is a real, if minor, disclosure gap — not a scary one, but the report's
own "Worktree removed" framing for the other two cells makes this
omission read as inconsistent rather than deliberate. Smallest fix:
either remove the leftover worktree/branch and note it in the report, or
explicitly disclose it was kept on purpose (it does double as the
physical evidence for Attack 5/negative-check-b below, so deletion isn't
free — but silence isn't either).

No other stray branches, orphaned commits, or reflog entries beyond what
the report discloses (`reflog` shows exactly the 2 merges + the archive
commit + the initial commit, nothing else).

## Attack 5 — negative check (b), re-verified adversarially

Confirmed genuinely, not narrated:

```
$ cat /home/vantt/projects/fgos-plan-loop-r5-mutation-probe/NEGATIVE-CHECK-B.md
reviewer mutated this file
```

File genuinely exists on disk, real content matches the task's own
instruction. Raw `neg2b-result.log` (the actual stamped `fgos.v1`
contract output, not a summary):

```json
"steps": [{ "as": "review", "actorId": "reviewer",
  "status": "failed", "confidence": "failed",
  "executor": "claude", "provider": "claude" }]
```

Matches the report's claim exactly — real OS-level write succeeded, real
engine-level grading failed closed, real physical survival (the known
`tsk-2bu` gap: `rollbackReadOnlyMutations` has zero callers). No finding
— this negative check is exactly as claimed.

## Attack 6 — re-run the test suite from clean state, right now

```
$ cd /home/vantt/projects/fgos-test-drive && node --test
...
ℹ tests 14
ℹ pass 14
ℹ fail 0
```

14/14 pass, right now, matching the report's claimed count exactly (8
`truncate` tests + 6 `slugify` tests). Not stale. No finding.

## Summary of findings

| Severity | Finding | Status |
|---|---|---|
| HIGH | Gap 1 (`run.mjs` never forwards `step.mutation`) | Confirmed real from source, not a misreading (Attack 3) |
| MEDIUM | Cell-2 "zero-context"/"entirely on its own" resume framing self-contradicts the report's own admission of pre-fed gap hints; unverifiable from surviving evidence | New finding (Attack 2) |
| MEDIUM | Undisclosed leftover worktree + branch (`fgos-plan-loop-r5-mutation-probe`) still live on the host project, never mentioned as removed or kept | New finding (Attack 4) |
| — | Work-state-untouched claim | Reconfirmed, stronger evidence than report's own (Attack 1) |
| — | Negative check (b) | Reconfirmed genuine (Attack 5) |
| — | Test suite (14/14) | Reconfirmed current, not stale (Attack 6) |

Neither MEDIUM invalidates the live proof's central results (three real
distinct-executor dispatches, a genuine seeded-bug catch-and-fix cycle,
a real kill of a real PID, real merges, real isolation from Work state,
Gap 1 as the single most important finding). Both are disclosure/framing
issues the report should tighten, not evidence that the proof did not
happen.

Claude-Session: https://claude.ai/code/session_01Q7qMX2hkJLtEdpk92M21AJ
