# Delphi live run on mdview (2026-10-05)

Run from inside `/home/vantt/projects/mdview` with forgentX code, `workflow start delphi --request <search-index question>`.

## Result

- Run 2 (`wf-run-1791196890335-6466fc15`): completed, 4 steps pass, ~12 min.
- Run 1 (`wf-run-1791195929806-1f688991`): failed at once, `headless-no-executor`: mdview's `delphi:propose` capability had no `prefer` pool (only the stub). Fixed in mdview `.fgos/config.json` (git-ignored; backup in session scratchpad) by copying the `delphi:synthesize` pool.
- Run 1b (`wf-run-1791195956706-842d7c56`): round 2 failed. See findings 1-2. `workflow resume` on a failed run does nothing, so run 2 was a fresh start.

## Verified live (previously only hermetic tests)

| Feature | Evidence |
|---|---|
| `inputs` / `sameSeat` at propose-round-2 | brief lists `inputs/seat-A.md` (group summary) and `inputs/own-previous.md` (own round-1 proposal); revised proposals reference their own earlier position |
| `persona` | policy.persona = panelist/synthesizer in every binding |
| `workflow start` in background | `detached` pid returned at once; `advance.log` + `advance.lock` behaved as specified |
| Provider-limit detection | agy/tetcu72 "Individual quota reached, resets in 24m" classified `provider-limit`, account quarantined, fallback to next candidate |
| Fallback + re-selection | on xai failure/limit the next run chose gemini/mucdong and others without manual action |
| Panel of 5 provider families | claude, openai, xai, gemini(agy), glm all passed |

## Findings

1. **xai auth failure classified as `execution-timeout`.** pi pane showed `OAuth refresh failed for xai ... invalid_grant` immediately, herdr reported `idle`, supervisor waited 300 s then ended `timed-out-idle` / `needs-input`. No quarantine of the account. A visible auth error on the pane should end the attempt at once as an auth failure. (User re-logged xai afterwards; run 2 passed.)
2. **Fallback failure kills the whole unit.** One panelist's candidates (gemini quota, then xai) both failed, so `propose-round-2` ended `execution-failure` and the step failed even though panelists 1 and 2 had passed.
3. **Quarantine length vs reset time.** agy said reset in 24 m; quarantine `until` = +60 min.
4. **Anonymization leak.** `seat-A.md` (anonymized group summary) says the synthesis seat "refers to them as panelist-1..3, which map to seat-A..C by content". Seat labels are used, but the summary itself reveals the mapping hint and role names.
5. **Blind enforcement not provable from run artifacts.** `blind: true` is in the workflow events, but per-assignment `result.json` has `confinement: null` and no `hostRead`/attestation record; only the claude pane shows a bwrap launcher (`--unshare-pid`). The canaries passed in earlier reports; this run neither confirms nor refutes enforcement for the live panel.
6. Round 2 gave panelist-3 different executors across rounds (xai round 1, gemini round 2): fine, but note `sameSeat` follows the seat, not the executor.

## Fixed after the run

- Finding 1+2: idle pane with a dead credential now ends `provider-limit` after ~15 s (`AUTH_FAILURE_PATTERNS` in liveness), so the candidate walk continues; capacity classifier quarantines the account `auth-token`/`manual-clear`. With that, a seat's walk no longer stops on the first non-limit failure.
- Finding 3: quota quarantine uses the provider's named reset window ("Resets in 24m1s"), default 1 h.
- Finding 4: delphi feedback-synthesis objective forbids role ids / seat-to-role order. Content-level, because input copies are byte-for-byte with sha256 checks.
- tetcu72 quarantine cleared by hand via `fgos dispatch reconcile provider-capacity clear-quarantine` (quota restored per user). gemini/mucdong still quarantined until 11:46 UTC.
- Full suite: 6715 pass, 0 fail.

## Housekeeping

Closed the two stale herdr panes this run left (`wS:p420`, `wS:p42Z`). mdview config edit: `delphi:propose` pool only.

## Unresolved

- Should a unit tolerate one failed seat when every candidate of that seat fails (quorum)? Not done: product decision.
- Run 3 (`wf-run-1791198761595-28f05967`, after the fixes): completed in 7 min, no fallback needed, group summary has no role ids; tetcu72 selected again (no quarantine). The dead-credential probe was not exercised live (xai was logged in), only by tests.
- Where should blind attestation be recorded per assignment (finding 5)?
