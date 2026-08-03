# Why workflow prose gates on a capability query, not a hardcoded tool name

`tsk-1e4` rewrote `CLAUDE.md` and the `fgos-planning`/`fgos-validating`/
`fgos-executing` skill prose so that "should I demand GitNexus impact
analysis here?" is answered by querying the `impact-analysis` capability
(`tsk-1dj`'s tool registry) instead of assuming GitNexus is on this
machine. Sibling item `tsk-1e4` was explicitly carved out of `tsk-1dj`'s
own scope for exactly this reason — building the registry doesn't by
itself make anyone consult it; that's a prose contract, never automatic.

## The gate CLAUDE.md now states

```bash
fgos tool query --capability impact-analysis --status present
```

- **0 providers registered** — Inactive: skip impact-analysis evidence in
  verify/test scope; note `impact-analysis: inactive` in the plan/verify
  note. Not a gap.
- **Registered but not `present`** — Degraded: run every other required
  check, mark that proof weak, and name the gap plainly (e.g. "GitNexus
  registered but not present on this machine — blast radius not
  confirmed").
- **`present`** — Full: the MUST rules below apply exactly as written.

And the load-bearing framing for why this is prose, not code:

> This gate is prose the agent reads, never compiled logic — GitNexus is
> the first registered provider for `impact-analysis`, not the only one
> this gate can ever recognize. The block below regenerates from
> GitNexus's own template on `gitnexus analyze`; edit this gate section
> when the policy changes, never the rules inside the block.

## Why three separate skills needed their own edit, not just CLAUDE.md

Each skill consults the gate at a different moment in the item lifecycle,
so each needed the degrade-ladder wired into what that moment already
does:

**`fgos-executing`** — at the point it already reads a symbol's file
before editing it:

> Before editing a symbol, apply `CLAUDE.md`'s impact-analysis capability
> gate rather than assuming GitNexus is on this machine: `fgos tool query
> --capability impact-analysis --status present` decides whether the
> MUST-run-impact rule below is Full (present — run it), Degraded
> (registered but not present — proceed, but say the blast radius is
> unconfirmed), or Inactive (nothing registered — proceed without it).

**`fgos-planning`** — at the point a proof point would lean on blast-radius
evidence:

> Before writing a proof point that would lean on blast-radius evidence,
> run `CLAUDE.md`'s impact-analysis capability gate (`fgos tool query
> --capability impact-analysis --status present`) instead of assuming
> GitNexus is on this machine. Record the resulting posture
> (`impact-analysis: inactive|degraded|full`) in `plan.md` next to that
> proof point — inactive drops the requirement, degraded keeps it but
> marks the evidence weak, full keeps it exactly as before.

**`fgos-validating`** — checking the posture `fgos-planning` recorded is
still true, and treating a stale posture as a real failure, not a skip:

> **Impact-analysis posture** — where the plan leans on blast-radius
> evidence, does its recorded `impact-analysis: inactive|degraded|full`
> posture (`fgos-planning`'s step 3) match what `CLAUDE.md`'s
> impact-analysis capability gate actually reports right now (`fgos tool
> query --capability impact-analysis --status present`)? A stale or
> missing posture is a FAIL here, not a skip — never assume GitNexus is
> present because the plan says so.

And the one exception carved into validating's existing "never mark READY
on an unconfirmed assumption" rule:

> A row requiring blast-radius evidence is the one exception: an
> `inactive` posture (checked above) satisfies the row by itself — no
> provider means nothing to run — while `degraded` requires the gap named
> plainly in the row's result, never silently dropped.

## What stayed explicitly out of scope

Per `tsk-1dj`'s own locked decision D3 (which first flagged this gap):
building the tool registry and registering `gitnexus` as a provider does
not, by itself, make any workflow step ask the registry — "injection is a
prose contract, never automatic." `tsk-1e4` is the item that actually
performs that injection into the three lifecycle skills plus `CLAUDE.md`;
without it, the registry existing was inert.

## The fourth skill: `fgos-exploring` (`tsk-17w`)

`tsk-1e4` covered `fgos-planning`/`fgos-validating`/`fgos-executing`, but
left the earliest lifecycle stage — `fgos-exploring`, stage `clarify` —
without the same gate. `tsk-17w` closed that gap, adding the query to
`fgos-exploring`'s own scout step:

> Also query `CLAUDE.md`'s impact-analysis capability gate — the same
> check `fgos-planning`/`fgos-validating`/`fgos-executing` already run
> (`fgos tool query --capability impact-analysis --status present`) —
> rather than assuming GitNexus is on this machine, since this is the only
> clarify-stage session with real tool access (`judgeDiscovery` itself has
> none: `src/runner/dispatch.mjs:207-220`'s `--allowedTools` permits only
> `git add`/`git commit`).

Why `fgos-exploring` records the posture but never gates on it, unlike the
other three skills:

> Fold the result into `CLAUDE.md`'s three-way framing
> (`impact-analysis: inactive|degraded|full`) and record that line in
> `CONTEXT.md` in step 3, next to the other scout evidence. This is
> informational only — `fgos-exploring` edits no code and produces no
> proof points, so the posture never gates or reshapes which candidate
> decisions get asked here; it exists so a later reader of this item's
> `CONTEXT.md` sees the posture without re-deriving it.

With this item, all four lifecycle skills (`fgos-exploring`,
`fgos-planning`, `fgos-validating`, `fgos-executing`) plus `CLAUDE.md`
consult the same capability query — the injection `tsk-1dj`'s own D3 first
flagged as still-needed is now complete across the full item lifecycle.
