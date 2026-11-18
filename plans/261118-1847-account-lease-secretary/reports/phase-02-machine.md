# ACCOUNT-LEASE phase 2 machine result, fg-server2 (lead:OPC, 2026-11-18 19:04-19:20 +07)

Result: pool `claude` = tetcu, anhdvh, van.tran (lease order); `vantt` moved to new pool `claude-miu`. tetcu and anhdvh probe healthy; van.tran is at its weekly limit (resets 03:00 +07) and its probe did not finish.

| step | command | exit | result |
|---|---|---|---|
| 0 | `cp -p accounts.yaml accounts.yaml.bak-202611181904` (in `~/.fgos/private`) | 0 | backup written |
| 1 | `chmod 700 claude-tetcu claude-anhdvh claude-van.tran` | 0 | all three were already 0700 |
| 2 | `fgos config patch <3 set items> --global --reason "p-mnymjukvqd account lease pane pool"` | 0 | accounts tetcu, anhdvh, van.tran added to pool `claude`, each `credentialStore: {claude: ${HOME}/.fgos/private/claude-<id>}`. Note: the key `van.tran` must be written `runner.llmAccounts.claude["van.tran"]`; the plain dotted path splits it and the patch refuses `patch-spans-files` |
| 3a | `fgos dispatch probe-account --provider claude --account tetcu --json` | 0 | outcome ok, verdict healthy |
| 3b | `fgos dispatch probe-account --provider claude --account anhdvh --json` | 0 | outcome ok, verdict healthy |
| 3c | `fgos dispatch probe-account --provider claude --account van.tran --json` (under `timeout 300`) | 124 | no verdict: the probe's pane (w6:p146) showed "You've hit your weekly limit · resets 3am"; the session waited instead of exiting, the CLI was cut at 300 s, OPC closed the pane. Nothing was recorded for van.tran |
| 3d | `fgos config patch <unset claude.vantt; set claude-miu.vantt> --global --reason "p-mnymjukvqd vantt moves to pool claude-miu after tetcu and anhdvh probed healthy"` | 0 | `vantt` deleted from pool `claude`; new pool `claude-miu` holds `vantt` with the same store. No tier cell names `claude-miu` |
| 4a | `fgos dispatch explain --for execute --json` | 0 | pool `claude`: tetcu, anhdvh, van.tran all `usable: true`, no problems; no vantt in pool `claude` |
| 4b | `fgos doctor` | 0 | `llm-accounts-shape` ok (14 accounts in 10 pools); `confined-pane-accounts` ok |

## Open for the lead

1. van.tran shows `usable: true` in explain only because no probe result was recorded. Until 03:00 +07 a lease of
   van.tran gets a weekly-limit session. Re-probe after 03:00, or record its exhaustion first.
2. A probe of an exhausted Claude account does not end: the session sits at "Usage limit reached · continuing
   automatically at 3am" and the probe waits until its caller's timeout. The probe should treat that screen as
   `exhausted` and end. This is a backlog candidate for the account-probe owner.

Rollback: restore `~/.fgos/private/accounts.yaml.bak-202611181904`.
