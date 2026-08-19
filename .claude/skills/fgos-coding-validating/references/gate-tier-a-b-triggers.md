# Gate Step 1: tier A/B and the three triggers — full mechanics

The full detail behind SKILL.md's Gate Step 1.

Before checking bypass, decide honestly whether a person is needed at
all, using this two-tier criterion, in this order — **tier A first,
always**.

## Tier A — is there a valid action in reach that closes the gap?

Run the command, read the file, invoke `fgos-researching`, run `fgos
graph --what-if`. If yes: **do it, then re-ask this question from the
top.** Do not ask a person. When the action taken was invoking
`fgos-researching` and the domain declares a role graph, log the dispatch
right after it returns — whether it found something or came up empty:

```bash
node "$root/bin/fgos.mjs" handoff "<item-id>" --to researcher --reason consult --outcome "<the finding, one line>" --dir "$root"
```

You leave tier A only when the action does not exist, was tried and
failed, **or is forbidden by a rule** (the locked-decision case: this
skill may not reopen CONTEXT.md, so it structurally cannot resolve that
one alone).

Tier A runs first for a reason that is not stylistic: tier B weighs the
cost of *guessing*, and until tier A is exhausted, guessing is a false
option — the answer was available. Weighing cost before exhausting
action is how a session rationalizes not running the check it should
have run.

## Tier B — for whatever survives tier A: if this turns out wrong, what does the repair cost?

Measure the cost of **repair when the error surfaces** — mid- or
post-execute — not the cost of doing the work, and not the cost as it
looks right now at this gate (right now everything is cheap, because
nothing is materialized yet; reading it here would make every answer
"reversible" and the gate would never ask). Repair cost includes damage
already done in the window before anyone noticed, not just the diff that
fixes it. It is a property of the **decision**, not of each option.

- **Reversible** → pin it as a labeled assumption in plan.md and carry
  on.
- **Expensive** → it is a candidate question.

**The exception worth reaching for:** when the surviving options differ
in how reversible they are, **take the reversible one and carry on — do
not ask.** Only ask when every live option is hard to undo, or when the
reversible one is plainly wrong.

## The three triggers that earn a question — nothing else does

- **T1** — two or more options are still standing after a real
  comparison.
- **T2** — the plan needs something a locked CONTEXT.md decision
  contradicts, and citing cannot resolve it.
- **T3** — a child spec cannot be written with a real runnable `verify`,
  or with an `action` citing a real per-item decision id. The engine
  enforces this anyway; being unable to write it IS the signal, never a
  reason to invent one that passes.

Deliberately **not** a trigger: "high risk with insufficient proof". The
feasibility matrix already handles that — a row with no accepted evidence
is `NOT READY`, which returns to `fgos-coding-planning` rather than
stopping for a person. Adding it here would turn a self-correcting loop
into a wait.

Record the outcome as a two-value cost verdict for the auto-approve check
(Gate Step 2): `REVERSIBLE` when no trigger fired, anything else when one
did.
