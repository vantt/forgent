# Current Cell: none — track closed

Status: track complete
Last updated: 2026-09-07
Next action: none. All five phases of the architecture-advisory-panel
track are done; P05.2, the track's final cell, closed with a real
comparative live proof against a real external project and real
implementation of both accepted recommendations.

## What closed this track

P05.2 (comparative live proof and promotion) ran two real 9-phase
sessions through the actual `fgos coordination run/show` product path
against herdr-gateway (a real project outside forgentX), with
heterogeneous dispatch (claude-bwrap=Anthropic, agy-bwrap=Gemini), a
real person's real Decision Dialogue turn ("Làm theo khuyến nghị"),
and real implementation of both accepted recommendations — verified
against herdr-gateway's own real test suite (268/268 passing), landed
as two real commits there (0.1.20→0.1.22).

Full detail: `P05.2.md`. Track-wide summary: `index.md`.

## Five further real platform gaps found closing this cell

Getting from "register 3 executors" (`tsk-1o4`) to a genuinely
completed real session surfaced five more real, previously-undocumented
gaps in the coordination engine itself, each filed rather than worked
around silently:

- `tsk-31d` — `agy -p` ignores the invoking OS cwd for relative paths.
- `tsk-1ed` — the auto-generated dispatch prompt never states the
  required `agent-result.json` schema.
- `tsk-oed` — `aggregateBounds` carries an undocumented third bound
  (`wallTimeMs`, default 1 hour) that can permanently block a session
  regardless of unused round/assignment budget.
- `tsk-3yo` — the mutation-detector cannot distinguish a real
  confinement breach from an unrelated concurrent editor of the same
  target repo.
- The `agent-result.json` write-path (this repo's own `.fgos/assignments`,
  not the target project's cwd) is disclosed inline in `claude-bwrap`'s
  own config comment rather than filed separately.

None of these block anything already shipped; all are real, open
platform-improvement opportunities for whoever picks them up next.

## If resuming work on this track's own subject matter later

This track itself is closed — there is no cell to reopen. Follow-up
work belongs to whoever owns it:

- `core/skills/fgos-architecture-panel/SKILL.md` and
  `docs/how-to/use-fgos-architecture-panel.md` still say the three
  executors are "not yet registered" — stale as of P05.2, named as a
  loose end in P05.2.md's own Promotion section, not fixed in this
  cell to avoid re-opening its own already-large scope.
- herdr-gateway's own `web/src/block-classify.ts` and
  `docs/specs/terminal-detail.md` are that project's own files —
  further work there (e.g. Agy's own color-only menu shape, still
  disclosed and unfixed) belongs to that project's own maintainers.
- The five work items named above are real, standalone platform gaps —
  pick any of them up independently of this track.

## Also resolved, independent of the track

The vnflow implementation question (from P01.3's Phase 9) is closed: the
person authorized it, `fullstack-developer` implemented kongming's
3-step plan on vnflow, verified independently by the Coordinator (1658/1673
pass, zero regressions vs. main), pushed, and opened as
https://github.com/vantt/vnstock-analysis/pull/1.
