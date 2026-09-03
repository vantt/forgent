---
framework: diataxis
mode: explanation
---
# Why gate approval was separated from move-next

## The original observation

fgOS's stage gates had been conflating two different questions: "was the
current step's result okay, approved?" and "should the item advance to
the next step?" The item's own filing put it plainly:

> Các gate hiện tại đang hoạt động theo cơ chế duyệt để qua bước kế tiếp
> ... Tuy nhiên đúng ý nghĩa bản chất của nó thì nó phải duyệt kết quả
> của bước hiện tại ... Còn việc có đi qua bước kế tiếp hay không là một
> feature cơ học khác, được đặt ở cuối của tiến trình hiện tại, khi mà
> kết quả của tiến trình đó đã được duyệt.

The same item, claimed back in a different environment (planning-only
vs. run-to-completion), should behave differently at the move-next
decision without needing the approval semantics to change at all —
approval records whether the *current step* is good; advancing is a
separate, environment-dependent mechanical concern.

## D1–D3: a structured approve record, and dropping the re-judge

The first concrete design decisions: approvals get recorded as
structured fields in `gates[id]` (not just free text in the decision
log) — chosen specifically so `resolveDiscovery` doesn't have to parse
brittle text to find them, matching the shape `ask`/`answer`/
`statusAtAsk` already used. Scope was deliberately widened past a
minimal patch: do context-record (A), read-back-and-skip-judge (B), and
a shared move-next mechanism (D) together in one plan, not just the
cheapest independent slice. And once a stage's gate is approved,
`resolveDiscovery`/`resolveDecompose` drop the LLM judge call entirely —
verify must be proposed and recorded by `fgos-coding-exploring`/`fgos-coding-planning`
themselves at approval time, not synthesized by the engine afterward.

## D7: the "new verb" idea turned out to already partly exist

An earlier decision (D4) had proposed a brand-new `move-next` verb/skill.
It was superseded once a prior, already-shipped item (`tsk-ozl`) was
found to have already solved half the problem: `resolveDiscovery` already
skips its judge and moves straight ahead when a non-empty `CONTEXT.md`
exists — a content-based trust signal, not a new primitive. What was
actually still missing was narrower: `resolveDecompose` needed the same
skip-and-advance symmetry `resolveDiscovery` already had, `FALLBACK_VERIFY`
needed to become a real verify string instead of a placeholder, and — the
gap `tsk-ozl`'s own `CONTEXT.md` explicitly flagged as still open — an
explicit, audit-purpose approve record distinct from the mechanical
content-trust signal.

## D8→D9: from an env-signal primitive to one shared driver skill

An intermediate idea (D8) — teach `/fgOS:cook`'s existing drain loop a
`--stop-at <stage>` parameter — was itself superseded by a broader
realization (D9): `cook`, `pick`, `discover-loop`, and the future
planning/execution loops are all really the *same* driver, differing
only in where they get their id from (fresh submit / claimed / picked
from a stage-specific pool) and how far they're allowed to advance
(unlimited / one hop / up to a named stage or status). The shared shape:
read current stage/status → if `awaiting-human`, stop and surface the
question → if stage/status rank is already at or past the ceiling, stop
before invoking anything → otherwise look up `skillForStage` for the
current domain+stage, invoke it, let it call the transition verb, loop.

## D10 — a real self-correction on generality

A later decision explicitly walked back an overreaching claim from
earlier in the same session — that this driver shape would generalize
automatically to any future domain, not just coding. On challenge, the
session re-examined its own claim and concluded *both* "it generalizes
automatically" and "it definitely doesn't" were unproven guesses, since
no second real domain existed yet to test against:

> D9's driver CHỈ được khẳng định đúng cho domain THẬT DUY NHẤT đang tồn
> tại (coding) — KHÔNG khẳng định nó tự động tổng quát cho domain tương
> lai nào khác... FSM (moveStage/moveWork) là tầng universal thật sự,
> dùng chung mọi domain; driver (skillForStage-invoking loop) là scoped
> cho 1 LOẠI WORK cụ thể (coding dev lifecycle).

This distinction — a universal FSM layer vs. a driver scoped to one kind
of work — is exactly why the resulting skill was named `fgos-coding-driving`
(D12), not a domain-neutral name like `fgos-driving`: a generic-looking
name for a mechanism with no domain content of its own visible in the
skill invited exactly the overreach D10 had just caught, unlike the four
stage skills it drives, each of which is visibly coding-specific the
moment you open it.

## Shape decisions that followed from D9/D10

- **D11**: the structured approve record needed three parallel fields,
  not two — `contextApprove`/`planApprove`/`validateApprove` in
  `gates[id]`, since `fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating`
  each have their own gate. Each field is `{actor, at, verify}` —
  deliberately distinct from `fgos-coding-validating`'s own feasibility-matrix
  verdict field; the approve record only says "approved, by whom, what
  verify" — never the matrix content itself.
- **D13**: the ceiling parameter uses an explicit `stage:<name>` or
  `status:<name>` prefix (e.g. `stage:decompose`, `status:awaiting-approval`)
  rather than one bare string disambiguated by membership in two
  non-overlapping name sets — chosen for readability over minimal
  syntax, even though the prefix isn't strictly required to disambiguate.
- **D14**: `cook`/`pick` were retrofitted to call the new
  `fgos-coding-driving` skill instead of keeping their own duplicated
  loop logic — once the shared driver existed, `cook` reduces to
  "submit, then drive each queued id" and `pick` reduces to "claim, then
  drive one id" — keeping separate logic would have had no remaining
  justification.

## The decompose split that followed

The item itself split into three sequential tracks matching this design:
(1) the structured approve-record plumbing across the three gate skills
plus `store.mjs`/`replay.mjs`/`bin/fgos.mjs`, (2) porting
skip-and-advance symmetry into `resolveDecompose` and replacing
`FALLBACK_VERIFY` with the real verify string recorded by track 1, and
(3) the `fgos-coding-driving` skill itself plus the `cook`/`pick`
retrofit. An initial split proposal put `src/intake/plan.mjs` in
both track 1 and track 2's footprint, which the item's own `plan.md` had
never intended — corrected after human review to keep every track's
footprint disjoint, track 2 depending on track 1 sequentially rather than
sharing a file.
