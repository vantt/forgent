# Note for the fgOS refactor: the driving prototype uses only `solo`

2026-11-16, from the plan-supervisor pilot (`tools/plan-supervisor/`, pkm plan `261115-2140-packaging-followups`,
three slices done and independently re-verified). Read this before you decide how Workflow should drive plans.

## What the prototype does today

A session (the conductor) runs `fgos-cook` by hand: `propose`, then `fgos run ... --case <id> --activity ... --pattern solo`
for judge, validate and each writing slice, then re-runs the slice's checks and records them (`plan-board.mjs verify`).
A supervisor tick and a no-LLM watchdog sit beside it. Everything outside fgOS's own ledger (the owner queue, my
verification records, the measures) is in TSV/JSON files under `~/.local/state/plan-supervisor/<project>/`.

## Why only `solo`, and what it costs

1. The owner wanted one provider family. With one family, `reviewed` is refused (`independence-unsatisfiable`: the
   reviewer and red-team seats must differ in family from the producer), and the refusal still spends a dispatch.
2. `solo` on an activity whose unit is `reviewed` counts as a deviation; the frame allows **2** per case
   (`deviation-limit-reached`), so each plan phase needed its own case.
3. `solo` has no independent review seat. The conductor's own re-run of fmt, clippy and tests stands in; that is weaker.

## What the real driver should do instead (asks, in order of value)

- **Make "claude-only, solo" a declared route, not a deviation.** A project-level choice of base pattern or a listed
  `may-instead` route for `implement-item`, so it is not counted against `deviationsBeforeAsk`. `config check` should
  warn when the allowed executor set cannot satisfy a pattern's independence (today it only fails at dispatch).
- **Use the higher patterns where they fit** instead of everything `solo`: `reviewed` with an independent family for
  rigor-high slices, `code-change` for a writing slice with its verify loop, `consult` for the scout/survey step,
  `research-fan-out` for validating a plan from several angles, `rfc` or `panel` for planner decisions that were
  settled by one agent in the pilot. The pilot never exercised them.
- **Own the loop.** The per-slice loop (dispatch, verify, record, decide) is done by a session by hand and costs the
  conductor context. It should be a Workflow run whose steps include the verification and whose ledger records the
  independent checks (`verify`) and the hand-over event, instead of TSV files beside the ledger.
- **Own the watching.** The watchdog exists because a headless leader failed silently for ~43 min and the owner found
  it. A `fgos` verb or Workflow hook should alert on failed, refused or stalled unit runs, and on admission refusals,
  which leave no unit summary and are invisible to the pilot's report.
- **Fix the loose ends found on the way** (details in `review-261116-1313-plan-supervisor-pilot-friction.md`): a closed
  case still reports `status: running` with an orphan reservation and no way to clear it; a soft-deadline exit with
  code 0 is labelled `infra-exec-failed`; `propose` refuses `write-overlap` for slices that run one after another
  with `dependsOn`; the `gate-command-missing` text names `capabilities.code:implement.verify`, the real key is
  `runner.capabilities.code:implement.verify`.
- **Record cost.** Unit summaries carry time and outcome but no tokens or cost. The pilot measured completion, lead
  time, accuracy proxies and session size only; tokens were dropped for lack of a source.
- **A sanctioned top-level launcher** for leader sessions. A confined `fgos run` seat cannot dispatch writers; a
  top-level `claude -p ... --allowedTools 'Bash(fgos:*)'` can call fgos but was never given a proper contract.

## How to judge the driving design later

Run it on two more plans, with the measures in `tools/plan-supervisor/README.md`, before changing the flow. The
pilot is one plan, one conductor, nine owner interventions; its numbers show direction, not a result.
