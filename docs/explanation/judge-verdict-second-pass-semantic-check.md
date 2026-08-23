# Why judgeDiscovery/judgeDecompose run a second, independent judge pass on `verify`

## The failure this closes

`judgeDiscovery`/`judgeDecompose` — the engine's model-backed judges that
move an item `clarify`→`decompose` (and `decompose`→`executing` for
children) — used to trust a model-proposed `verify` string once it was
merely a non-empty string. Nothing checked it was real, runnable shell, and
nothing checked it actually tested the thing the item was about.

Confirmed failure (`tsk-d3c`): the engine's stage move once auto-set
`verify` to the literal string `Skill("fgOS:ready") loads without 'Unknown
skill' error` — not valid shell syntax at all (`fgos return` runs `verify`
via a shell command) — and it named an already-working plugin skill instead
of the actually-broken dotdir skills, so it would have passed regardless of
whether the real bug was fixed. Both failures had to be manually corrected
via `fgos edit --verify` before the item could be trusted.

## Why a second model pass, not a syntax lint

A purely syntactic check (e.g. `bash -n` on the string) would have caught
this failure's first half — `Skill(...)` not being shell — but not its
second half: a syntactically valid command that names the wrong target.
Only a second, independent judgment pass can plausibly catch the semantic
case ("does this `verify` actually, verifiably prove *this* item's specific
claim") — a mechanical lint cannot.

The second pass gets the same `view` context (graph/impact block,
description, prior verdicts) the first pass got, plus the first pass's own
proposed `verify` string, and is asked exactly one question: does this
command prove the claim, not just "is this valid shell".

## Why disagreement parks instead of retrying

When the second pass disagrees with the first pass's `clear`/`verify`
verdict, the item parks in `awaiting-human` via the same `putInAwaiting`
fail-safe door an unclear first-pass verdict already uses — both verdicts
are surfaced to the person. It never silently overrides one judgment with
the other, and never auto-retries as the primary response to a
disagreement. An unresolved disagreement between two model judgments is
exactly the "genuinely needs a person" case the existing `fgos ask`/
`answer` gate contract already exists for; reusing `putInAwaiting` was
smaller than inventing a third disagreement-handling path.

From `src/intake/discovery.mjs`'s `resolveDiscovery`:

```js
if (typeof verdict.verify === 'string' && verdict.verify.trim()) {
  const secondPass = judgeVerifySemanticCorrectness(work, verdict.verify, cfg);
  if (!secondPass.agrees) {
    const ask =
      `Đề xuất verify bị nghi ngờ (chưa ghi vào clarify->decompose, cần xác nhận) — ` +
      `vòng 1 đề xuất: ${verdict.verify}\n` +
      `vòng 2 (kiểm tra độc lập) không đồng ý: ${secondPass.reason}`;
    putInAwaiting(dir, { id, ask, statusAtAsk: work.status });
    return { outcome: 'verify-disputed', id, verdict, secondPass };
  }
}
```

`judgeDecompose` gets the same treatment per-child: a bad child `verify`
invalidates only that child's normalization, not the whole decompose
batch, and never rides in silently accepted.

## Why the fail-safe contract still holds

`judgeDiscovery`/`judgeDecompose` never throw — any failure folds to
`{clear: false, question: DEFAULT_UNCLEAR_QUESTION}` (first pass) or an
equivalent "not clear"/invalid outcome (second pass). Adding a second
external-process call (the same `spawnSync`-based executor
`judge-executor.mjs` already uses for the first pass) had to extend this
same contract cleanly: a second-pass spawn error folds to the same
fail-safe outcome as a first-pass failure, never a thrown error, and never
silently treated as agreement.

## Scope boundary

This mechanism covers `verify` correctness only — both the judge-generated
half (`judgeDiscovery`/`judgeDecompose`) covered here, and a separate,
narrower write-time gate on session-authored `work.acceptance` clauses
(`text`+`evidence` supplied together) covered by the sibling item
`tsk-5q5-2`. Whether this second-pass pattern should extend to
`judgeDecompose`'s own top-level `reason` field or other model-proposed
prose is explicitly out of scope here.

## Why the parent item (`tsk-5q5`) locked scope before design

Two separate writers could let a wrong claim ride into an item's record
unchallenged, both surfaced by `tsk-d3c`'s own history: (1)
`judgeDiscovery`/`judgeDecompose` trusting a model-proposed `verify`
string once merely non-empty (the failure this doc covers), and (2)
session-authored `work.acceptance` clauses with no judge involved at all
(`tsk-5q5-2`'s scope). The parent item's own job was to lock *both* into
one scope before either child was designed:

> Scope covers **both** failure modes above: judgeDiscovery/judgeDecompose's
> `verify` generation (a real code path in `discovery.mjs`/`decompose.mjs`)
> AND session-authored `acceptance`-clause drift (no machine generation
> exists today — this half is a discipline/gate addition on top of the
> existing hand-authored write path, not a fix to an existing judge).

It also locked that a caught disagreement must park on a person rather
than auto-resolve either way — the same `putInAwaiting` behavior this doc
already describes above:

> When the second-pass semantic check disagrees with judgeDiscovery/
> judgeDecompose's own clear verdict, the item parks in `awaiting-human`
> via the existing `putInAwaiting` fail-safe door (the same one an unclear
> verdict already uses), surfacing both verdicts to the person — it never
> silently overrides one judgment with the other, and never auto-retries
> as the primary response to a disagreement.

### Second repro: unquoted prose breaks the shell, not just names the wrong target

A second, independent repro (folded in from a duplicate item, `tsk-65n`,
closed as wontfix once its evidence was captured here) showed the same
failure shape from a different angle — not a wrong target, but broken
shell syntax from explanatory prose the judge appended to the command:

> judgeDiscovery emitted verify "... && echo PASS || echo FAIL — check ...
> (blocked+take path, not direct take/pick) ..." — the unquoted
> explanatory prose after 'echo FAIL' carries parentheses, so /bin/sh
> aborts with 'Syntax error: "(" unexpected' (exit 2) before running
> anything. Same shape as this item's own `Skill("fgOS:ready")` repro: the
> judge appends a human sentence to a shell command. The item became
> unreturnable (`fgos return` parks it blocked regardless of the work)
> until a human ran `fgos edit --verify`.

This confirmed the second-pass check needed to catch more than one
failure shape — not just "names the wrong target" but "isn't valid shell
at all because of appended prose" — both fall under the same
semantic-correctness judgment pass described above, rather than needing
two separate mechanisms.

## When the second pass disagrees with itself, not just the first pass

The design above assumed the second pass's own judgment, whatever it is,
stays consistent for a given item's claim across rounds. `tsk-5cf`
reproduced a case where it didn't: on `tsk-4xg`, across 10 rounds of
proposing a corrected `verify` in response to each round's stated
objection, the judge's own criteria flatly reversed — round 6 rejected a
direct keyword grep as "too generic/just word presence"; round 8
explicitly demanded that same direct-grep approach back; round 9 rejected
a more specific phrase-grep as "too specific," the opposite of round 6's
complaint. With no CLI escape hatch, a genuine two-judge disagreement
(or, as this showed, a judge disagreeing with its own prior verdict)
could strand an item in the `awaiting-human`/`doing` park indefinitely.

The root cause traced to `buildVerifyCheckPrompt`: each round's prompt
was built fresh from only `{title, description, proposedVerify}` — zero
memory of the judge's own prior-round verdicts or stated reasons. Each
round was free to invent new unstated criteria with no continuity to the
round before it.

The fix (`b47f03f`) closed both halves locked as in-scope together:

- **Stabilize**: `resolveDiscovery` now threads
  `view.gates[id].ask` — the immediately-prior round's own dispute text,
  persisted by `replay.mjs`'s ask/answer fold as a single
  most-recent-value slot — into the next round's
  `judgeVerifySemanticCorrectness` call as a `priorRejection` argument,
  the same "give the judge its own prior context" shape
  `buildDiscoveryPrompt` already used for `view.discovery[id]`.
- **Override**: `fgos discover --force` lets a caller proceed past a
  disputed second-pass verdict instead of parking forever — never a
  silent bypass. Every use is logged as a real decision record naming
  the disagreement it overrode:

  ```js
  addDecision(dir, {
    id,
    text: `discover --force overrode a disputed verify: "${verdict.verify}"`,
    source: 'resolveDiscovery',
    rationale: `second pass disagreed: ${secondPass.reason}`,
  });
  ```

This override is a narrower escape valve than it might look: it exists
for the residual case where two independent judgment passes simply never
converge — a real possibility for an LLM-backed second pass, not a
deterministic check — not a general "skip the check" switch. The
disagreement-parks-not-retries stance from the section above stays the
default; `--force` only ever fires when a caller has already reasoned
live through the specific disagreement and chooses to proceed anyway,
with that choice recorded, never inferred.

## `--force` overriding the verdict is not the same as clearing the park it caused

`tsk-nfa` found a real gap in `--force`'s own contract, reproduced live on
`tsk-4y2`: the *first* `discover` call that hits a verify dispute parks
the item in `awaiting-human` via `putInAwaiting` (as this doc already
describes above), correctly. A *second* `discover --force` call on that
same, now-parked item successfully overrides the verdict and advances the
item's `stage` — but never touches `work.status`, which stays
`awaiting-human`. The item ends up mid-stage with a park status still
attached, and `fgos return`'s own guard then refuses with `work "<id>" is
"awaiting-human", not "doing" — nothing to return`. The only way out used
to be a manual `fgos answer` call the person had no signal to expect.

The fix keeps `--force`'s override narrow rather than widening it to also
clear the park: `discover --force` now refuses outright when the item's
live `status` is already `awaiting-human`, pointing at `fgos answer <id>
--text ...` as the resume path, instead of silently advancing stage while
leaving status inconsistent:

> `discover --force: work "<id>" is already "awaiting-human" -- run "fgos
> answer <id> --text ..." to resume it before retrying --force.`

The rejected alternative — having `--force` auto-resume the park itself,
reusing the item's own `statusAtAsk` snapshot the same way `answerAwaiting`
already does — was rejected specifically because it would need a
synthetic `answer` string manufactured by `--force` itself to satisfy the
same FSM requirement `answerAwaiting` enforces, which would blur the audit
trail (it would look like a person answered the park question when only
`--force` ran) and bundle two different kinds of override — verify-trust
and status-park — behind one flag. Status transitions stay exclusively
behind the existing ask/answer door; the cost is a two-command resume
(`fgos answer`, then re-run `discover --force`) in exchange for keeping
the override boundary honest — the same "never silently overridden"
stance this document already states for the verdict itself, now extended
to cover the park status a prior dispute round leaves behind.

## The mirror gap (`tsk-60r`): a genuinely SUCCESSFUL re-run also left a stale park behind

`tsk-nfa` above covers `--force` overriding a disputed verdict without
clearing the resulting park. `tsk-60r` found the mirror case: a park left
by a dispute, then resolved the *ordinary* way — no `--force` involved at
all — still went stale.

Repro: `fgos discover <id> --verdict clear --verify "<placeholder>"`
where the verify is a non-concrete placeholder gets disputed by the
second pass (`outcome: verify-disputed`), auto-parking the item to
`status: awaiting-human` with the round-1/round-2 dispute text recorded
as the `ask`. Fixing the verify to a real, runnable command and re-
running `fgos discover <id> --verdict clear --verify "<real command>"`
returns `outcome: clear` and genuinely advances the stage (e.g.
`clarify` → `decompose`) — but the item's `status` field stayed stuck at
`awaiting-human`, with the now-stale dispute `ask` still attached. A
manual `fgos answer <id> --text ...` was still required to unpark it,
even though the underlying dispute the park existed for had already been
resolved by the successful re-run itself.

This mattered beyond mere tidiness: `fgos-coding-driving`'s own hard rule
treats any `status: awaiting-human` as a live human-question stop
(`parkReasonForStatus === 'human-question'`) that a driving loop must
never answer on its own. A headless/automated driving loop would
incorrectly halt on an already-resolved dispute, mistaking a stale
leftover park for a real open question — the opposite failure direction
from `tsk-nfa`'s gap, but the same underlying cause: nothing connected a
successful `resolveDiscovery` outcome back to clearing the park state a
prior round of the very same function had set.

Fixed to clear the stale `awaiting-human` park automatically once
`resolveDiscovery` itself produces a genuine `clear` outcome on a retry —
the resolution came from the same call site that caused the park, so
clearing it here doesn't cross the ask/answer boundary the way `--force`
auto-resuming would have; it's the natural continuation of the same
discover call succeeding where it previously disputed.

## A new root cause for repeated disputes (`tsk-3jy`): the judge wasn't told what stage it's grading

Every prior contradictory-dispute case above (`tsk-4xg`, `tsk-5mc`) was
explained as the judge losing track of its own prior-round criteria —
fixed by threading fuller rejection history. `tsk-3jy` found a
*different* root cause producing the same symptom, observed live during
`tsk-5iv`'s own `discover` call: the judge demanded post-implementation
evidence for a `verify` command proposed at stage `clarify`, before any
code existed to prove it against — a category error, not a memory gap.

Real transcript: `tsk-5iv` was a fully-specified multi-file bugfix batch
with real file:line evidence for every fix already locked — only the
`verify` command itself was under dispute. Round 1 correctly rejected a
placeholder. Round 2 correctly rejected a full-suite-only check (a green
suite proves nothing if zero lines changed) — a legitimate complaint,
properly incorporated: round 3 added grep assertions targeting each
fix's expected code shape. But rounds 3 and 4 kept disputing anyway, now
demanding "git diff showing actual code changes" — evidence that cannot
exist yet at the `clarify` stage, since the `verify` command being
evaluated is a *specification* for what `fgos-coding-implement`/`fgos
return` will run *later*, not something run now. Every round's counter-
demand was answerable only by writing the implementation first, which
defeats the entire purpose of proposing `verify` during shaping.

**Root cause**: `buildVerifyCheckPrompt` never told the judge what stage
this evaluation happens at. Without that context, the judge implicitly
graded as though code already existed — and had no cap on how many
rounds of tightening it would accept before either agreeing or naming a
specific missing check, so it kept repeating a generic "need more proof"
rather than engaging with the already-improved command on its own terms.

**Why this matters beyond one item's 4 wasted rounds**: `--force` exists
and worked exactly as designed here — logged, with the disagreement
reason recorded, the documented escape valve this document already
covers above. The real risk is what happens *without* an operator who
knows to reach for `--force`: an agent that gives up and weakens its
`verify` to whatever the judge will accept produces a **worse** verify
command than the one that kept getting correctly-shaped-but-rejected —
the judge's own repeated pressure could select for weaker verification,
not stronger.

Fix: `buildVerifyCheckPrompt` now states explicitly that the verify is
proposed *before* any code exists, and the judge is required to name a
new, concrete, specific gap on disagreement rather than repeating a
generic "not enough proof" — closing off the goalpost-moving pattern
without touching the legitimate round-2-style complaint (a check that
proves nothing at all) this same mechanism must still catch.

A secondary, unconfirmed observation surfaced in the same session
(recorded here for anyone who hits it again, not chased down by this
item): mid-way through `tsk-5iv`'s background `fgos catchup`, that
session's linked worktree directory was found deleted while the item's
status was still `blocked` (not yet `delivered`). Root cause unconfirmed
— possibly `cleanupMergedBranch` firing from an earlier "merged" catchup
outcome that then got superseded by a concurrent session's own advance
on `main`, racing with this session's own status check.

## Second live contradiction (`tsk-25g`): single-round context wasn't enough, full history was

`tsk-5cf`'s stabilization fix above (single-most-recent-round
`priorRejection` threading) shipped, but a second live reproduction —
while working `tsk-5mc` — showed the exact same contradictory-criteria
failure mode `tsk-4xg` originally exposed, even with the fix active: 7
consecutive rounds, where round 4 demanded real execution proof over
structural text-presence checks, round 5 then demanded structural
text-presence checks *back* over the execution proof round 4 had just
asked for, round 6 combined both per round 5's own request, and round 7
still disputed on a narrower point. Two independent live occurrences
(`tsk-4xg` at 10 rounds, `tsk-5mc` at 7) of the same contradiction shape
was read as evidence this may be structural to an independent-judge-pass
design, not a one-off prompt gap — worth one more bounded stabilization
attempt, then treat `--force` as the accepted permanent answer either way
(product priority order, `docs/decisions/0025`, ranks Ship Faster over
further Polish on an already-shipped mitigation).

**Root cause of why the first fix wasn't enough**: `view.gates[id].ask`
(the slot `resolveDiscovery` threaded into `priorRejection`) is a
single-most-recent-value slot, not an accumulated history — each new
round only ever saw the *immediately prior* round's own objection, never
the full chain before it. A judge with no memory of round 2's stated
criteria has nothing stopping it from reversing round 2's own position by
round 4.

**The fix**: extend `priorRejection` from a single last-round string to
the full accumulated rejection history (`replay.mjs`'s `askHistory` fold,
threaded through `discovery.mjs`'s `resolveDiscovery`) — the judge now
sees every round's own prior stated objection, not just the latest one.
The same gap existed on the decompose path too: `resolveDecompose`'s
per-child `judgeVerifySemanticCorrectness` call (`decompose.mjs:703`) had
neither the context-threading half nor the `--force` override at all — a
child item disputed at decompose time had zero escape path, unlike a
clarify-stage item. Folded into the same fix rather than filed as a
separate near-identical follow-up, since it's the same root function and
the same already-designed fix shape.

**Empirical re-verification, not just a code review**: rather than trust
the fix by inspection, this item ran two real judge-round reproduction
attempts through the actual `fgos discover` pathway (`tsk-2wp` and
`tsk-4bl`, both discarded scratch items used purely to force real judge
rounds). Neither attempt managed to force a *true* adjacent-round
reversal synthetically — the failure mode has only ever been observed
serendipitously on real work, not reproduced to order in either of two
tries — but the second attempt (`tsk-4bl`, 3 real rounds) showed the
full-history mechanism actively working as designed: round B's own real
response explicitly named its objection "same core defect as round 1",
proving the judge was reading and integrating the accumulated history,
not just receiving it inertly. Combined with a full green test suite
(2605 passing), the full-history mechanism was kept as shipped, with the
residual honest caveat that the exact adjacent-round-reversal shape still
hasn't been forced under direct test — only observed live, twice, before
either fix.

Full round-by-round evidence:
`docs/history/tsk-25g-judge-verify-stabilization-audit/` and
`docs/history/tsk-5mc-verify-vacuous-pass-multiglob/CONTEXT.md`.

## Test-coverage gap closed (`tsk-5ld`): `resolveDiscovery`'s `--force` had shipped code with no test

`resolveDecompose`'s own `--force` override (the per-child parallel of
`resolveDiscovery`'s override described above) already had test coverage
for both its success and refusal paths (`tsk-25g`, `decompose.test.mjs`).
`resolveDiscovery`'s own equivalent `--force` logic (`discovery.mjs:
669-691`) had shipped with the same two behaviors — overriding a genuine
non-mechanical disagreement and logging the override decision; refusing
outright when the item is already `awaiting-human` — but neither path had
a test of its own, only `priorRejection` threading and the mechanical-
disagreement exemption were covered
(`test/intake/judge-verify-second-pass-stability.test.mjs`). `tsk-5ld`
closed that gap by mirroring the exact same two test cases already
proven for `resolveDecompose`, applied to `resolveDiscovery` instead.
