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
