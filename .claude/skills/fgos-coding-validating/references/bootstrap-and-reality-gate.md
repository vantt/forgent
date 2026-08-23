# Bootstrap and reality gate — full mechanics

The full detail behind SKILL.md's Steps 1-4.

## Step 1: Bootstrap

Read the item's `docsRef` to find `docs/history/<feature>/`, then read
CONTEXT.md and plan.md. If plan.md does not exist yet, or its shape was
never presented at `fgos-coding-planning`'s own gate, stop here and hand
the item back to `fgos-coding-planning` — an unapproved shape is never
validated.

If the domain declares a role graph and the item's current
`data.work[id].holder` (`fgos list --id <id> --json`) is not already
`implementer`, reclaim it before anything else:

```bash
fgos handoff-return "<item-id>" --note "reclaiming at Bootstrap -- holder was <role>"
```

Repeat, re-reading `holder` fresh each time, until it reads `implementer`
(a nested call can sit two deep). Stop when a call refuses with "no open
call" — the ordinary end state.

## Step 2: Reality gate

Score each of these PASS or FAIL, each with a concrete citation (a file
path, a command's real output, an existing test):

- **Mode fit** — does the plan's chosen size (from `fgos-routing`'s flag
  count) actually match what the item needs, not over- or under-built?
- **Repo fit** — does every file, function, and pattern the plan leans on
  actually exist, at the path and shape the plan claims?
- **Assumptions** — is every assumption the plan depends on either proven
  by reading the real code, or flagged as unproven below?
- **Smaller path** — is there an honestly smaller way to reach the same
  exit state that the plan overlooked?
- **Proof surface** — does every piece in the plan already carry a real,
  runnable verify command (never a placeholder or a description standing
  in for one)?
- **Impact-analysis posture** — where the plan leans on blast-radius
  evidence, does its recorded `impact-analysis: inactive|degraded|full`
  posture (from `fgos-coding-planning`'s Approach step) match what
  `CLAUDE.md`'s impact-analysis capability gate actually reports right
  now (`fgos tool query --capability impact-analysis --status present`)?
  A stale or missing posture is a FAIL here, not a skip — never assume
  GitNexus is present because the plan says so.

A FAIL on any dimension stops here: return the item to
`fgos-coding-planning` with the failing dimension and the reason, named
plainly. Never continue past a FAIL by treating it as a minor note.

## Step 3: Feasibility matrix

For every assumption the plan's risk map flagged medium or higher, write
a row: assumption | risk | proof required | evidence found | result.
Accepted evidence is a file actually read, a command actually run with
its real output, an existing test result, or an official version/doc
confirmation — never "should work" or model knowledge alone. A row with
no accepted evidence is an automatic **NOT READY**, regardless of how
reasonable the assumption sounds. A row requiring blast-radius evidence
is the one exception: an `inactive` posture (checked in Step 2) satisfies
the row by itself — no provider means nothing to run — while `degraded`
requires the gap named plainly in the row's result, never silently
dropped.

## Step 4: Decide

Using this vocabulary only:

```text
READY
READY WITH CONSTRAINTS
NOT READY - RETURN TO PLANNING
```

`READY` is a feasibility verdict, not the edge choice itself — the
session still has to actually pick the edge next, and the engine still
has to validate and apply it. A `NOT READY` verdict hands the item back
to `fgos-coding-planning` with the matrix attached; it is never softened
into a pass because the item has already spent time here.

## Step 5: Leave execution alone

Per the locked decision that Execute and its verify already have a
working mechanical path, this skill does not design or re-plan any of
that; a `READY` verdict only says the plan is provably buildable, not
that this skill has re-checked how it will be built.
