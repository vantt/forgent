# Hand-off: HARDEN ledger rows with no receiver confirmation

From `lead:HARDEN` (claude-aiwy@fg-server2), 2026-11-18 18:30. To the secretary (Miu): please record each row below in the backlog (`docs/backlog.md`, ids from `fgos identity mint backlog`) or in the plan that owns it, then answer with the row ids you created. The owner asked for this hand-off; HARDEN's root plan is closed (`plans/reports/closing-261118-1344-harden-root-closing.md`, section 6 part 4 has the evidence).

Source table: `plans/261021-1118-harden-low-layers-bottom-up/plan.md`, section "Hand-off ledger". Receivers' rows that already say "recorded" with a commit are not listed.

| Row | What it is | State on main `0981437d2` plus later | Suggested home |
|---|---|---|---|
| H3 | Whoever lands H13 owes the TEST lane a ping | No ping recorded | Note in TEST plan; closes when H13 is confirmed |
| H12 | Doc edits for DOC (`process/spec.md`, `component-boundary.md`, `holder-lock/spec.md`, `reading-map.md`, three more) waiting for session `forgentx-5f`, which no longer runs | No receiver | New backlog row for the DOC lane; ask the supervisor which lane takes it |
| H13 | Each CLI call verifies the release once | Done in part: host no longer self-hashes; no cross-process cache by owner decision 81 Q4 | Close the row with that sentence; the TEST ping (H3) is the only open piece |
| H17 | Two host-binary resolvers; host `.fgos` ancestor walk | Resolver is one authority now; the `.fgos` walk was not checked independently | Backlog row: verify the walk, then close |
| H11 | Release-manifest canonical-JSON producer and verifier pair | Two implementations remain, a code comment declines the merge (`scripts/build-rust-distribution.mjs:39`) | Close the row as declined, citing that comment |
| H19, H20 | SEAT review items for T1 phase 6 and T5 phase 06 | Row has no confirmation text | Ask SEAT's successor lane whether each landed; close or reopen |
| H22 | Write-once self record for the hot mutex (idea) | Work layer is deferred (owner 2026-11-18) | Keep open under the Work layer backlog |
| H23 | `finally` in `withStateTx` after T1 changed `release()` to return a settle outcome | Not verified whether it landed after the WORK cutover | Backlog row: check `hot-lock.mjs`, then close or reopen |
| H24 | Gateway `node bin/fgos.mjs` branch | Done in code (`gateway.rs:365-369`, a 503 naming `fgctl init`) | Close the row with that evidence |
| H9, H10 | host-runtime T9 list, doctor per-row timing | Owner chose on 2026-11-18: do the echo fixture, `RouterPolicy` and doctor timing; defer the admission gate. Plan `plans/261118-1818-harden-t9-leftovers`, backlog p-syd72acyow, p-s2qkffw2cr, p-ltwb2h3k6s, p-afwjbaupv7 | Already recorded; close H9 and H10 pointing at the plan |

Also open and not mine: two reds on main (`test/cli/fgos-workflow.test.mjs:90` expects `--plan` to be an unknown flag, but OPS-METRICS landed it; `test/setup/instruction-projections.test.mjs:232` reports stale instruction projections) and the unpushed local commit `0308aef23` in the main checkout.
