# Why workflow prose gates on a capability query, not a hardcoded tool name

`tsk-1e4` rewrote `CLAUDE.md` and the `fgos-coding-planning`/`fgos-coding-validating`/
`fgos-coding-implement` skill prose so that "should I demand GitNexus impact
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

**`fgos-coding-implement`** — at the point it already reads a symbol's file
before editing it:

> Before editing a symbol, apply `CLAUDE.md`'s impact-analysis capability
> gate rather than assuming GitNexus is on this machine: `fgos tool query
> --capability impact-analysis --status present` decides whether the
> MUST-run-impact rule below is Full (present — run it), Degraded
> (registered but not present — proceed, but say the blast radius is
> unconfirmed), or Inactive (nothing registered — proceed without it).

**`fgos-coding-planning`** — at the point a proof point would lean on blast-radius
evidence:

> Before writing a proof point that would lean on blast-radius evidence,
> run `CLAUDE.md`'s impact-analysis capability gate (`fgos tool query
> --capability impact-analysis --status present`) instead of assuming
> GitNexus is on this machine. Record the resulting posture
> (`impact-analysis: inactive|degraded|full`) in `plan.md` next to that
> proof point — inactive drops the requirement, degraded keeps it but
> marks the evidence weak, full keeps it exactly as before.

**`fgos-coding-validating`** — checking the posture `fgos-coding-planning` recorded is
still true, and treating a stale posture as a real failure, not a skip:

> **Impact-analysis posture** — where the plan leans on blast-radius
> evidence, does its recorded `impact-analysis: inactive|degraded|full`
> posture (`fgos-coding-planning`'s step 3) match what `CLAUDE.md`'s
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

## The fourth skill: `fgos-coding-exploring` (`tsk-17w`)

`tsk-1e4` covered `fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`, but
left the earliest lifecycle stage — `fgos-coding-exploring`, stage `clarify` —
without the same gate. `tsk-17w` closed that gap, adding the query to
`fgos-coding-exploring`'s own scout step:

> Also query `CLAUDE.md`'s impact-analysis capability gate — the same
> check `fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement` already run
> (`fgos tool query --capability impact-analysis --status present`) —
> rather than assuming GitNexus is on this machine, since this is the only
> clarify-stage session with real tool access (`judgeDiscovery` itself has
> none: `src/runner/dispatch.mjs:207-220`'s `--allowedTools` permits only
> `git add`/`git commit`).

Why `fgos-coding-exploring` records the posture but never gates on it, unlike the
other three skills:

> Fold the result into `CLAUDE.md`'s three-way framing
> (`impact-analysis: inactive|degraded|full`) and record that line in
> `CONTEXT.md` in step 3, next to the other scout evidence. This is
> informational only — `fgos-coding-exploring` edits no code and produces no
> proof points, so the posture never gates or reshapes which candidate
> decisions get asked here; it exists so a later reader of this item's
> `CONTEXT.md` sees the posture without re-deriving it.

With this item, all four lifecycle skills (`fgos-coding-exploring`,
`fgos-coding-planning`, `fgos-coding-validating`, `fgos-coding-implement`) plus `CLAUDE.md`
consult the same capability query — the injection `tsk-1dj`'s own D3 first
flagged as still-needed is now complete across the full item lifecycle.

## `present` doesn't mean fresh or intact (`tsk-j7y`)

During `tsk-480`, GitNexus's `impact()` MCP tool gave false-negative and
false-not-found blast-radius evidence while `fgos tool query
--capability impact-analysis --status present` reported the capability
as fully healthy:

> `impact({target:"appendWorkerLog", direction:"upstream"})` reported
> `impactedCount:0` even though `src/runner/loop.mjs:702` and `:761`
> really do call it (confirmed by direct grep);
> `impact({target:"runVerb", direction:"upstream"})` returned "Target
> 'runVerb' not found" even though `async function runVerb(...)` is a
> real top-level exported-from-module function in `bin/fgos.mjs` that
> dispatches every CLI verb.

The gap: `probeTool`'s presence check for an `mcp`/`skill` capability was
directory-existence only (`fs.existsSync` on the tool's `scanTarget`) —
it said nothing about whether the index behind that tool actually
reflects the repo's current state.

**Fix**: GitNexus's own `.gitnexus/meta.json` already carries a
`lastCommit` field recording which commit the index reflects. `probeTool`
now compares that against the repo's current `git rev-parse HEAD` and
resolves the tool's status to `'stale'` instead of `'present'` when they
diverge — folded into the existing **degraded** bucket of the three-way
framing above, not a fourth word (at least 12 files under
`docs/history/**` already cited the three-way framing verbatim; widening
"degraded" to also mean "present but stale" was a one-line prose change
there, versus review everywhere the framing is copied).

`CLAUDE.md`'s gate prose now reads:

> Registered but not `present`, or `present` but flagged `stale` —
> Degraded: run every other required check, mark that proof weak, and
> name the gap plainly (e.g. "GitNexus registered but not present on this
> machine — blast radius not confirmed", or "GitNexus present but its
> index is behind the current HEAD — blast radius may be stale"). A
> `present` status only means the tool is installed, never that its
> index is fresh or intact — a suspicious zero-result or "not found"
> answer from an impact-analysis tool is worth a quick grep/rg
> cross-check before being trusted, regardless of what `fgos tool query`
> reports.

**What's still a residual gap, deliberately not built here**: FTS/graph
**corruption** (the deeper failure `tsk-480` actually hit — a crash on
reindex, `"FTS index 'file_fts' is inconsistent"`) has no cheap on-disk
pre-flight signal; `meta.json`'s own `capabilities.fts.status` still read
`"available"` even after the live index was later found corrupted.
Detecting corruption for real requires actually running `analyze`, too
expensive to run as part of every presence probe (YAGNI) — `analyze`'s
own error already names its fix (drop/recreate `file_fts`) when it does
surface. Staleness (index behind HEAD) and corruption (index broken
regardless of freshness) are deliberately distinct terms — the fix here
only covers the former.

## `full` doesn't mean complete per-file coverage either (`tsk-38h`)

`tsk-j7y` closed the staleness gap — a `present` status now means the
index reflects the repo's current commit. But a fresh, non-stale index
can still have zero symbol-level coverage for one specific file, which is
a *third*, distinct mechanism from both "not present" and "stale."

`tsk-38h` first reproduced this on `bin/fgos.mjs`: `impact()` reported no
upstream callers for `resolveDiscovery`/`resolveDecompose` and could not
find `runVerb` at all — even right after a fresh `gitnexus analyze` (8241
symbols, 17s). Grep confirmed real call sites existed
(`bin/fgos.mjs:965`/`986`, `loop.mjs:977`/`997`). A second, independent
reproduction landed later, during `tsk-5zg`'s own required impact-analysis
step: `impact({target:'runVerb', direction:'upstream',
file_path:'bin/fgos.mjs'})` still returned "not found" on a freshly
rebuilt index (15935 nodes, 0 stale). A direct cypher query — `MATCH
(f:Function) WHERE f.filePath = 'bin/fgos.mjs' RETURN f.name` — confirmed
`bin/fgos.mjs` carries **zero indexed `Function` symbols at all**. Not a
stale-index or wrong-name issue: the whole file sits outside the parser's
symbol-level coverage, likely a size/complexity ceiling (the file is
5000+ lines).

**Why this didn't need a fourth status word.** The existing "degraded"
bucket's own unconditional cross-check line — "a suspicious zero-result
or 'not found' answer from an impact-analysis tool is worth a quick
grep/rg cross-check before being trusted, regardless of what `fgos tool
query` reports" — already operationally covers this case: a session that
follows that line catches a large-file zero-coverage miss the same way it
would catch staleness. What was missing was making the *mechanism*
explicit under the "full" bucket itself, so a reader doesn't read `full`
as "guaranteed complete." `CLAUDE.md`'s gate prose now reads:

> `present`, freshly checked — Full: the MUST rules below apply exactly
> as written. A `full` posture still is not a guarantee of complete
> per-file coverage: a genuinely fresh, non-stale index can still carry
> zero indexed symbols for one large/complex file (tsk-38h — confirmed on
> `bin/fgos.mjs`, 5000+ lines, zero indexed `Function` symbols even
> immediately after a fresh reindex), a distinct mechanism from staleness
> that the cross-check line above already covers unconditionally.

So the three-way framing (inactive/degraded/full) stays a three-way
framing — this item only sharpens what "full" honestly promises, it
never adds a fourth bucket.
