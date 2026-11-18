# Phase 05 live proof: Miu on her own pool (fg-server2, 2026-11-18)

Machine steps by lead:OPC (owner chose option A through Miu, 2026-11-18 ~20:45); full log kept by OPC in
`.fgos/runtime/tmp/al-p05-miu-result.md` on fg-server2. Credentials and login files were never read or printed.

## Landed

| What | Commit |
|---|---|
| `runner.personas.secretary.pool: claude-miu` (config door live; origin carries the secretary persona block that the shared checkout held only locally in 0308aef23) | e9f6ca0f2 |
| CHANGELOG, three lines (A8) after 1455 freed the file | 9011c3121 |
| Fix found by the live start: `account_view` (`packages/execution/rust/src/accounts.rs`) collects `runner.personas.*.pool`, proof vector `openai-solo` in `packages/execution/contracts/bind.v1.json` | 88dc6a190 |
| Doctor registry count test follow-up of phase 3 | 09f84d5ae |

Releases activated by OPC: 34a46c78 (p4), 43c64e04 (c86d4ec8a), 084fe2ef (a4537ad92, contains 88dc6a190).

## Acceptance criteria

1. **AC1 done.** `fgos dispatch explain --for execute --json`: pool `claude` = tetcu, anhdvh, van.tran, no `vantt`.
   `fgos doctor` on fg-server2: `llm-accounts-default-login-home` ok ("no runner.llmAccounts store sits on its CLI
   default login home"), `llm-accounts-shape` ok (14 accounts, 10 pools), `confined-pane-accounts` ok. Owning proof
   `test/setup/model-pool-checks.test.mjs` (phase 3).
2. **AC2 done.** Explain for `execute` and `code:review` walks only pool `claude` among claude pools, never
   `claude-miu`. `fgos dispatch explain` has no `--persona` flag (the phase file assumed one); the persona side is
   proven by the real head start below and the golden cases of phase 4 plus the bind vector of 88dc6a190.
3. **AC3 done.** Pane: `npm run fgos:dev -- run "Reply with the single word ok..." --provider claude --capability
   code:review` exit 0, unit `unit-run-1795005652875-0afef431`, lease `claude/tetcu`. Miu: `fgos head start
   secretary --name miu --json` exit 0, attempt `head-secretary-miu-2`, lease `claude-miu/vantt`, skill
   `fgos-secretary` loaded, project Stop hooks run. Rotation: `fgos head rotate secretary --name miu --json` exit 0,
   `rotated:true`, gen 3, old attempt ended, successor `head-secretary-miu-3` leases `claude-miu/vantt`, one pane.
   The first head start (before 88dc6a190) was refused `pool-unusable`; OPC rolled back to a hand-started Miu until
   the fix was active.
4. **AC4 by owning proof.** No natural pane quota event occurred during the run; phase 4 golden case "every pane
   account quarantined walks to the next family and never names the persona pool" stands, as the criterion allows.

## F13 and F14

- F13 closed in phase 1: no seat resolves to unconfined `claude-cli`.
- F14: skill and Stop hooks work in the confined head. Gap: a first `head start` reads only hand-offs under
  `.fgos/runtime/session-rotation/<persona>-<name>/`; a hand-off written elsewhere (here
  `plans/handoffs/miu-restart-handoff-20261118-2055.md`) is not seen, so OPC pointed Miu at it by prompt.

## Open items (out of scope, RUL11: own backlog rows)

1. First head start after a hand-started session ignores a hand-off outside the rotation directory (F14 above).
2. `fgos dispatch probe-account` on an exhausted Claude account waits at the usage-limit screen until the caller's
   timeout instead of returning `exhausted` (phase 2 report).
3. Bind provenance labels a persona pool's source as `modelPolicies.<family>.<tier>`; `explain` names
   `personas.<name>.pool` correctly (phase 4 review, non-blocking).
4. Re-probe `claude/van.tran` after its weekly reset (03:00 +07, 2026-11-19); until then a lease of it meets a
   weekly-limit session.

## For Miu (owner asked to be told)

Miu now starts with `fgos head start secretary --name miu` on her own account (`claude-miu/vantt`) and rotates
herself (`fgos head rotate secretary --name miu` or `/handoff`); panes never spend her quota.

## Rollback

`fgos config unset runner.personas.secretary.pool --reason "<why>"`, then open Miu by hand with
`claude --model sonnet` (as on 2026-11-18 before this plan).
