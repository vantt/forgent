# Example family: consolidated Decision Request, and resume

Two things live in this file because the protocol's own graph ties them
together: Phase 4 ("Ask Reluctantly") is coordinator bookkeeping, not a
graph operation (see `SKILL.md`'s Entry Flow table — Phase 4 has no node of
its own), and whatever it decides directly shapes what a resumed session
needs to re-derive.

## Part 1 — the real pattern: both sessions to date sent zero

**Honest disclosure, not a gap being smoothed over:** neither
[P01.2](../../architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/decision-request.md)
nor P01.3 ever sent a Decision Request to the person. Both wrote the file
anyway, because "we decided not to ask" is itself a decision that needs a
record — a successor coordinator should never re-derive it from nothing, or
worse, re-ask what was already reasoned through. Here is P01.2's real
verdict table, reproduced in full because the reasoning IS the artifact:

| Candidate gap | User-exclusive? | Material now? | Disposition |
|---|---|---|---|
| Whether "local ownership" means a cache, replica, or independent authority | Partially — scoutable in part, final scope is the person's own intent | Yes, in principle | **Not asked yet** — each shaper states its own explicit working definition instead; divergence here is useful signal |
| Whether the pressure is latency, offline, install/distribution, or velocity | No — scout-answerable | Scout already answered it | **Resolved by scouting**, not asked |
| Whether "native" implies reimplementation or relocation | No — scout-answerable | Yes | **Resolved by scouting** — the shell owns zero relocatable library code |
| Whether the shell is a product bet or a spike | **Yes — only the person can say** | Doesn't flip the technical recommendation, only the investment level | **Not asked now** — carried as a named dependency into the explanation, stated plainly as "the part that stays theirs" |
| Whether the decision is already made | N/A — already answered directly by the person before dispatch | No | **Answered**, not re-asked |

**No candidate cleared both bars (genuinely user-exclusive AND material
enough to change what Phase 5 should produce) strongly enough to interrupt.**
This is the real discipline: a gap that fails the materiality test is never
silently dropped — it is carried forward as an explicit named default,
stated in every downstream shaper's prompt, and surfaced again, by name, in
the final explanation as something that remains the person's own call.

## Part 2 — a constructed case where a Decision Request WOULD send

No real session to date has crossed both bars for more than one gap at
once, so this half is deliberately marked as constructed for illustration —
doctrinally shaped the same way, not a copy of a real send. Say a case
arrives with a genuine, undefaultable compliance fact bound up in the
architecture question (`SKILL.md`'s own named exception: "if proceeding
requires inventing a fact about the person's own obligations that cannot be
defaulted safely, ask immediately and say why waiting would have been
worse"). A single, consolidated message — never a first question, then a
second one three minutes later:

> Before the panel diverges on designs, two things only you can settle,
> together, not two separate messages:
>
> 1. **Data residency.** Does this system need to keep data inside one
>    legal jurisdiction? This changes which storage topologies are even
>    legal candidates before a single shaper starts, so we can't default it.
> 2. **Existing commitment.** Is there already a contractual SLA number for
>    this service, or are we free to propose one? If one exists, every
>    shaper needs it as a hard constraint, not a target to invent.
>
> Everything else we found was either answerable by reading the repository
> (see scout-report.md) or doesn't change what a first proposal looks like —
> we're proceeding on those without asking. If we don't hear back, we'll
> proceed with [named default] for #1 and [named default] for #2, both
> reversible before Phase 7.

This is the "ask reluctantly, but clearly, and only once" shape: batched,
each question stated with why it can't wait and why it can't be defaulted,
and a named fallback stated up front rather than leaving the person to
guess what happens if they don't answer.

## Part 3 — resuming a session, from durable artifacts and `show` alone

This half IS live-verified, not constructed — see the how-to guide's own
"Resuming a session later" section for the real command sequence and real
`fgos coordination show --json` output this reuses. The fresh-session
resume order (`SKILL.md`'s own list) puts `show`'s own reported quorum and
`pendingDriverAuthorizations` FIRST, ahead of any prose file:

1. `fgos coordination show <id> --json` — the hard, replay-derived truth of
   phase/quorum state and what's still pending, independent of any prose
   file's own claim.
2. `session.md` — the coordinator's compact status board. If it disagrees
   with (1), trust (1).
3. `intake.md`, then the newest `human/<n>-person.md` — what was actually
   asked and said, read before any panel artifact.
4. `interpretation.md` and `dispositions.md` — what the panel believes and
   what the driver has authorized.
5. Only what the next action actually needs — not every proposal, "to feel
   oriented."

No chat history, no raw dispatch log, and — confirmed by the live proof in
the how-to guide — no re-reading of `decision-request.md`/`session.md` is
strictly required to know **what's next**: `show`'s own `quorum.missing` and
`pendingDriverAuthorizations` already say it, straight from the event log.
Those prose files answer **why**, which `show` cannot.
