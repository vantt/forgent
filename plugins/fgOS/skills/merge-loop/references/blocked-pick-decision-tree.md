# The blocked-pick decision tree — full mechanics

The full detail behind SKILL.md's Step 4, for the "anything else is a
blocked pick" branch. Work every blocked pick through these sections, in
order, never skipping ahead: escalate-only carve-outs, the self-recovery
pointer (already run inline by `approve` before this loop ever sees the
result), and the same-id-twice stop rule for reasons with no playbook.

## Escalate-only carve-outs, checked before any playbook

Two cases never get a playbook, whatever `reason` came back and however
many attempts are notionally left:

- **Iron Law** (`blocked: "iron-law"`, or an `approve` block whose reason
  is `iron-law`) — never run a playbook for it, never call `fgos
  catchup`, never call `fgos ask <id>` to park it, and never run
  `/fgOS:approve <id> --acknowledge-iron-law` on this skill's own
  authority. An Iron Law hold always needs a real human operator, with no
  exception this skill is ever allowed to apply.

  **Record it and walk past it; the run continues.** Add `<id>` to this
  run's Iron Law list and go on to the next iteration. One held item must
  not hold up the items behind it that can still land, and a person
  should be called back once for the whole list rather than once per held
  item — Step 5 gathers each one's evidence and Step 6 presents them all
  together.

  **The held item stays exactly `awaiting-approval`.** Never `fgos ask`
  it, never move it to `awaiting-human`, never move it at all. There is
  deliberately no `awaiting-approval → awaiting-human` FSM edge to use
  here — building one was considered and rejected. Skipping happens in
  this prose, never in the item's state.

  One id, one record: if an id already on this run's Iron Law list comes
  back `iron-law` again on a later iteration, that is no progress — end
  the loop there, with the list as it stands. The engine normally parks a
  known-tripping candidate into `skipped` on the following call rather
  than re-attempting it, so a second live trip for the same id means its
  pre-check and the real gate disagree, which re-running cannot fix.

- **A root that has not gathered all of its children.** The blocked
  `<id>` resolves to itself as root (so its merge target is the trunk,
  not a `fgw/<rootId>` integration branch) AND at least one of its
  descendants is still open. Stop the loop and report; run no playbook,
  no `catchup`, no retry. Landing a root into the trunk while any of its
  children are still open is exactly the partial land this design
  forbids, and retrying never makes it safe — the missing children are
  the problem, not the merge.

  Read this, never infer it:

  ```bash
  fgos rollup <id>
  ```

  A descendant counts as finished only when its `status` is one of
  `delivered`/`retrospective`/`cleanup`/`done`/`wontfix` — anything else,
  including `blocked` and `awaiting-approval`, is still open. Walk the
  whole chain, not just direct children: an open grandchild anchors the
  root exactly the way an open child does.

## Self-recovery decision rules and named playbooks

The self-recovery decision logic, universal rules (once-per-id-per-run cap, decision trail requirement, verified evidence bar, and outcome reading rules), and named playbooks for eligible block reasons (`verify-fail-post-merge`, `verify-timeout-post-merge`, `integration-drift`, `merge-failed-unclassified`, `merge-conflict`) are defined in the shared reference:

`plugins/fgOS/skills/_shared/catchup-self-recovery.md` (mirrored at `.agents/skills/_shared/catchup-self-recovery.md`).

Because `approve` runs the shared playbook inline before ever returning a
blocked result (see `approve/SKILL.md` step 7), any blocked pick this
loop reads has already undergone one self-recovery attempt inside
`approve`. Re-running the playbook here would be redundant, not merely
wasteful — the attempt is already spent. This loop records the blocked
pick, logs the rationale, and enforces its own once-per-id-per-run stop
rule below; it never invokes the shared playbook itself.

## The same-id-twice stop rule, for reasons with no playbook

This rule fires **only for a block reason that has NO playbook** above.
It used to swallow every reason indiscriminately, which meant a
documented, machine-runnable recovery stopped the loop and woke a person
for nothing.

Reasons with no playbook today: `fgos-write-rejected`, plain
`verify-fail`, and any reason this file does not name at all — a reason
added to the CLI later correctly falls here rather than being guessed at.

For those reasons only, compare `<id>` against the id picked (and
blocked) on the immediately preceding iteration:

- **Different id, or this is the first blocked pick of the run** —
  normal. Continue to the next iteration, remembering this `<id>` as
  "last blocked."
- **Same `<id>` blocked on two consecutive iterations in a row** — stop
  the loop. Report the id and the block reason(s) in a plain chat
  message in the current conversation.

A reason that DOES have a playbook never reaches this rule; the
once-per-run rule above is its stop instead, and that one fires on the
FIRST repeat rather than the second. Narrowing this rule therefore makes
the loop stricter for playbook reasons, not more permissive — the only
thing it removes is the wait for a second identical block before a
person is told.
