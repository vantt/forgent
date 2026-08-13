---
item: tsk-f3p
---

# fgos answer's CLI help text says "resume to todo" — plan.md

Mode: tiny

No `CONTEXT.md`/`exploring` pass exists for this item — discovery's own
`fgos-researching` round (`RESEARCH.md`) fully resolved both parts of the
question with direct code/spec evidence, so discovery returned `clear` and
the item skipped straight to `planning` (per `fgos-coding-discovering`'s own
clear/unclear contract). `RESEARCH.md` is the locked evidence this plan
builds on, in place of a `CONTEXT.md`.

## Approach

`RESEARCH.md` Round 1 already separated the item's two parts:

1. **Real, narrow mismatch** — `src/cli/command-registry.mjs:341`'s
   `answer` verb description literally says "resume the item to todo,"
   but the actual resume logic (`src/state/store.mjs:747-763`,
   `answerAwaiting`) resumes to `statusAtAsk` (`doing` when a claim was
   held at ask-time, `todo` otherwise) — an intentional, already-shipped
   fix documented in `docs/specs/work-state.md:229,1016` under
   "claim-lock §5.1". Only the help string was never updated to match.
2. **Not a gap** — the "claimed-but-no-worktree, `pick` refuses to
   reclaim" scenario is already handled by the shipped `tsk-3ni`
   (session-claim-liveness) self-reclaim mechanism in `pick`'s
   claim-conflict path (`src/runner/claim-port.mjs:269-306`,
   `src/runner/claim-liveness.mjs`). No code change needed there.

Rejected alternative: changing `answerAwaiting`'s actual resume behavior.
Rejected because the current behavior is correct per spec (`claim-lock
§5.1`) — the OLD behavior (always `todo`) was the real bug, already fixed;
changing it again would reintroduce that bug.

Impact-analysis capability gate (`CLAUDE.md`): `fgos tool query
--capability impact-analysis --status present` reports GitNexus registered
and `present` — `impact-analysis: full`. Not exercised as a proof point
here: the change is a single static description string with no runtime
branch or caller depending on its content (confirmed by `rg` finding no
test asserting this string, per `RESEARCH.md`) — zero blast radius by
inspection, not something a blast-radius tool needs to confirm.

## Risk map

| Component | Risk | Proof |
|---|---|---|
| `src/cli/command-registry.mjs:341` description string | light | `npm test` still green; string reads correctly by inspection |

No medium/high risk entries — this is a one-line, non-executable string
edit with no behavior change.

## Shape

Change `src/cli/command-registry.mjs:341`'s `answer` verb `description`
from:

```
'Record the answer to a parked question and resume the item to todo.'
```

to something that states the real behavior, e.g.:

```
'Record the answer to a parked question and resume the item to its status before the question was asked (todo, or doing if a claim was held).'
```

No other file changes. No split — one honest, tiny piece of work.

## Verify

```
npm test
```

Real, already-runnable full suite — no dedicated test names this exact
string (confirmed in `RESEARCH.md`), so the honest verify is "the suite
stays green" plus visual confirmation the new string is accurate, not a
new test invented for a doc-string correction.

## Outstanding questions

None
