# Supervisor wake 2026-11-24 23:09

## Event drained

- `7aa9f9b9240c7c1c` `question-answered` `q-qzcq5xti2k`, successor this session (`head:supervisor-forgent`, live).
  Owner chose "allow cargo and node for claude workers in project config".
  - Applied through `fgos config patch` (set `runner.executors.claude.invocations` with `--allowedTools 'Bash(cargo:*)'
    'Bash(node:*)' 'Bash(npm test:*)'` on `claude-cli-bwrap`): refused `config-key-out-of-scope belongs-in=global`.
    Executor `args` are `x-fgos-scope: global-only` (`core/config-schema/runner.schema.yaml`) and lists are leaves, so
    the grant cannot live in `.fgos/config.yaml`. Nothing was written.
  - Answer and refusal written back to `plans/261124-0004-heads-operate-without-owner/phase-02-argv-window.md`
    ("Owner answer q-qzcq5xti2k"), landed by ticket `c-791984-1795536526205`.
  - Follow-up `q-owq4jhwng7` asked (supersedes `q-qzcq5xti2k`, which the store marked cancelled): recommended route is
    the lead pinning the standard full-confinement invocation `claude-herdr-bypass-bwrap` for the rerun; fallback is the
    owner adding `--allowedTools` in the global config; third option parks phase 2 behind `261124-1853`.
  - Event marked handled.

## Plans

- Admission: no admissible plan (lanes 4 free, leads 1/3).
- Running: `261124-0004-heads-operate-without-owner`, lead live and idle on a genuine owner wait. Phase 1 done
  (`719331230`); phase 2 parked on `q-owq4jhwng7`; phases 3, 6, 7 draft behind it.
- No `lead:SUPERVISOR` session is live.

## Friction worth an item

- `fgos convention path --kind report` needs `--type`; without it the error says only "report type is empty".
- `fgos config patch` from a confined head cannot read a file in the session scratchpad or `.fgos/runtime/tmp`
  (read-only), and refuses `-`; the patch file had to be staged under the plan directory.
