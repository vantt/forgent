# Acceptance: real runs through herdr panes (phase 5)

Date: 2026-10-02. Branch `plan/261002-request-to-run-p6`. Run by the p6 branch's own `node bin/fgos.mjs run`, inside a live herdr session (`HERDR_ENV=1`, herdr 0.9.1-vantt.1, bwrap `/usr/bin/bwrap`).

Status: **PARTIAL.** Cases 1, 2, 3, 4, 6 Accepted with file evidence. Case 5 NOT RUN (reason below). Getting there needed six code fixes in the herdr path (section 3) and, for case 3, the follow-up round in section 3b; none of the Accepted runs had a key typed into a pane by hand.

## 1. Deviations from the brief

- **Store = the p6 worktree, not the main checkout** (`--dir /home/vantt/projects/forgentX-p6`). The main checkout is dirty and used by other sessions; nothing was written there.
- **Units ran in a second, detached worktree** `/var/tmp/p6-accept-work` (HEAD `eb8898f95`, `--worktree`), not in the store checkout. With the store and the workspace the same directory, a `workspace-write` producer is refused fail-closed (`attestation store directory ... overlaps with writable resource "workspace"`, `unit-run-1790927140155-52c35521`). The detached worktree is the production topology (store apart from workspace). Products written there were copied into the evidence folder; the worktree and `/var/tmp/p6-accept-bin` are removed at the end.
- **claude and glm needed new executor ids with herdr invocations.** The `claude` executor id is merged with the global default executor, which drops its own `invocations` (phase 4 concern 5), so the committed config had no way to run claude in a pane. Added `claude-herdr` and `glm-herdr` (committed, `4180be3fe`). The runs pin them with `--override` (`[{"scope":{"role":"producer"},"executor":"claude-herdr"},{"scope":{"role":"reviewer"},"executor":"glm-herdr"}]`).
- **Case 4 used a temporary config overlay**: executor `fake-limit`, capability `acceptance:limit`, and `idleTimeoutMs: 60000`. Not committed; `.fgos/config.json` was restored to the committed bytes afterwards.
- Claude workspace-trust: see section 4. `ca1`, `ca2`, `ca4` produced the producer's file inside the detached worktree under `plans/.../reports/evidence/`; copies are in the evidence folders.

## 2. Results

| # | Case | Result | Run id | Transport (read from `assignment.json`) | Providers | Wall | Lead-active |
|---|---|---|---|---|---|---|---|
| 1 | Unit docs, `reviewed`, producer + reviewer in panes | **Accepted** | `unit-run-1790932321930-c5ae2d4b` | herdr / herdr | producer claude (sonnet), reviewer z-ai (glm-5.2) | 2 min 06 s | 1 command, 0 keys into panes |
| 2 | Posture live: reviewer write refused, outbox write ok | **Accepted** | `unit-run-1790932481767-e16e7a18` | herdr / herdr | same | 4 min 21 s | 1 command, 0 keys |
| 3 | `architecture-advisory` Workflow in panes, one role on openai | **Accepted** (second round) | `wf-run-1790941388891-acbba971` (5 unit runs, 9 role runs) | herdr / herdr in all 9 | panel: claude (sonnet), openai (codex, account fgovn, gpt-5.6-terra), gemini (agy, account mucdong), xai (pi, account vantt, grok-4.3); critique reviewer openai | 8 min 18 s | 1 command, 0 keys |
| 4 | Provider-limit fallback, new pane, old pane stays | **Accepted** (fake screen) | `unit-run-1790934553748-4d3a3007` | herdr / herdr | fake-limit then claude (sonnet) | 81 s | 1 command, 0 keys |
| 5 | Same question on the old engine (`pre-engine-retirement`) | **NOT RUN** | none | n/a | n/a | n/a | n/a |
| 6 | Headless (no herdr), cli, same posture | **Accepted** | `unit-run-1790934670425-5d5c769e` | cli / cli | producer claude (sonnet), reviewer gemini (gemini-3.8-flash-medium) | 6 min 35 s | 1 command |

Evidence root: `plans/261002-1339-request-to-run-p6-herdr-posture-quota/reports/evidence/` (every path below is under it). Each run folder holds `unit.json` (trimmed: config snapshot replaced by its hash), per role/round `assignment.json`, and `runs/01/{result.json,run.json,exit.json,visibility.json,dispatch-plan.json,effective-execution-contract.json,brief-1.md,outbox/*}`. `protected/` (launcher scripts, which carry the glm key) is never copied; every file was checked against the secret values and none appears.

### Case 1 (Accepted)
- `ca1/unit-run-1790932321930-c5ae2d4b/`. Command: `fgos run --unit ca1-unit.json --pattern reviewed --override <above> --dir <p6> --worktree /var/tmp/p6-accept-work`.
- producer: executor `claude-herdr`, invocation `claude-herdr-bwrap`, transport `herdr`, posture `workspace-write`, model sonnet, `adapter: herdr-spawn`, pane `wS:p3TC`, 25 s, `completed-pass`, `visibility.confinement.status: confined-bwrap`.
- reviewer: executor `glm-herdr` (provider `z-ai`, glm-5.2 through OpenRouter), transport `herdr`, posture `read-only`, pane `wS:p3TD`, 101 s, verdict `pass` (`outbox/result-1.json` carries `assessment.verdict: pass`). Provider family differs from the producer's (`claude` vs `z-ai`); `bind()` enforced it.
- Product: `ca1/ca1-docs-note.md` (8 content lines about the `Transport (G7)` block); the reviewer's per-claim check is in `outbox/report-1.md`.
- One Enter was re-sent for the reviewer (`visibility.briefSubmitKeyResent: 1`) by the new submit check, not by hand.

### Case 2 (Accepted)
- `ca2/unit-run-1790932481767-e16e7a18/`; the unit tells the reviewer to run `touch POSTURE-PROBE-reviewer.txt` and `echo probe >> src/runner/execution/bind.mjs` in the repository and quote the output.
- Reviewer report (`.../reviewer/1/runs/01/outbox/report-1.md`), exact output: `touch: cannot touch 'POSTURE-PROBE-reviewer.txt': Read-only file system` and `(eval):1: read-only file system: src/runner/execution/bind.mjs`, both `EXIT=1`; it then wrote `report-1.md` and `result-1.json` to its outbox (both exist).
- Pane screens: `ca2/pane-log-reviewer-probe-frames.txt` (herdr `pane read` frames showing the refused writes).
- Repository side: `/var/tmp/p6-accept-work` has no `POSTURE-PROBE-reviewer.txt`, and `git status` shows only the evidence directory; `bind.mjs` unchanged.
- Posture in force for the producer was `workspace-write` (it wrote its note in the worktree), for the reviewer `read-only`.
- An earlier, unplanned sample of the same thing: in the first reviewer run for case 1 (`unit-run-1790931976358-5dc36b1c`, before the objective was reworded) the reviewer tried to write the note itself and reported `Read-only file system`.

### Case 3 (Accepted, second round)
The first round could not run it: only the claude and glm families ran confined in a pane, and codex, pi and agy died at launch (details kept in `ca3-blocked/`). A second round made the three work, then re-ran the case.

- Command: `fgos workflow start architecture-advisory --request "<question about where the confined-pane recipe should live>" --dir <p6> --worktree <p6>`; code at commit `bff6fb806` (the tree the full test run covered). The architecture capabilities' `prefer` lists were changed to `claude-herdr, openai, gemini, xai, glm-herdr` (committed) so each role binds a pane-capable executor. Every unit has a read-only posture.
- Result: `wf-run-1790941388891-acbba971`, status `completed`, outcome `pass`, 2026-10-02 11:43:08 to 11:51:26 (8 min 18 s). Evidence: `ca3/` (`workflow-events.jsonl`, `unit-runs/<unitRunId>/unit.json` with the config snapshot replaced by its hash, per role `assignment.json` and `runs/01/{result.json,run.json,exit.json,visibility.json,dispatch-plan.json,effective-execution-contract.json,brief-1.md,provider-capacity-selection.json,outbox/*}`; `protected/` never copied).
- Transport and providers, read from each `assignment.json` and `result.json` (`adapter`), not from the return value:

| Step / unit run | Role | Executor / invocation | Transport | Model | Account | Pane | Time |
|---|---|---|---|---|---|---|---|
| framing `unit-run-1790941388899-6db479b6` | producer | claude-herdr / claude-herdr-bwrap | herdr | sonnet | default login | wS:p3W1 | 47 s |
| shaping `unit-run-1790941435696-b0a2d4ec` | panelist-1 | claude-herdr / claude-herdr-bwrap | herdr | sonnet | default login | wS:p3W2 | 50 s |
| | panelist-2 | **openai / codex-herdr-fgovn** | herdr | gpt-5.6-terra | **fgovn** | wS:p3W3 | 79 s |
| | panelist-3 | gemini / agy-herdr-mucdong | herdr | gemini-3.8-flash-medium | mucdong | wS:p3W4 | 142 s |
| | synthesizer | xai / pi-herdr-vantt | herdr | grok-4.3 | vantt | wS:p3W5 | 55 s |
| critique `unit-run-1790941632741-4cd0aa40` | producer | claude-herdr | herdr | sonnet | default login | wS:p3W6 | 45 s |
| | reviewer | **openai / codex-herdr-fgovn** | herdr | gpt-5.6-terra | **fgovn** | wS:p3W7 | 114 s |
| synthesis `unit-run-1790941792112-f9c5002b` | producer | claude-herdr | herdr | sonnet | default login | wS:p3W8 | 45 s |
| explanation `unit-run-1790941837161-320cbf36` | producer | claude-herdr | herdr | sonnet | default login | wS:p3W9 | 50 s |

- The panel is on four provider families (claude, openai, gemini, xai): the three panelists and the synthesizer each differ from every sibling (`bind()` enforced it; with fewer families it refuses). Every role was `confined-bwrap` (`visibility.json`), posture `read-only`, and wrote `ack-1.json`, `report-1.md`, `result-1.json` into its outbox. The three non-claude roles record `provider-capacity-selection.json` with the leased account (`fgovn`, `mucdong`, `vantt`) and `credentialProvisioned: true`, without any credential value.
- Per provider, a single read-only Unit with an explicit probe (`ca3-providers/provider-probe-unit.json`) shows (a) the agent logged in, (b) repository writes refused, (c) outbox written:

| Provider | Run | (a) login | (b) repo write | (c) outbox | Note |
|---|---|---|---|---|---|
| openai codex, account fgovn | `unit-run-1790939670033-64a7b5b3` | `codex login status`: "Logged in using ChatGPT"; `CODEX_HOME` is a private path under `/tmp/fgos-confinement/` | `touch`: "Read-only file system", exit 1; `echo >> src/...`: "read-only file system", exit 1 | ack, report, result | |
| xai pi, account vantt | `unit-run-1790939810248-f68c3739` | pane shows grok-4.3 on the subscription; `PI_CODING_AGENT_DIR` is a private path | same two refusals | ack, report, result | |
| gemini agy, account mucdong | `unit-run-1790939860393-05133ad0` | pane header shows the mucdong account (address redacted in the copy); `HOME` is a private path | same two refusals | ack, report, result | |

  Reports are `ca3-providers/<codex|pi|agy>/<unitRunId>/producer/1/runs/01/outbox/report-1.md`; pane frames (sampled every 4 s, never typed into) are `ca3-providers/<codex|pi|agy>/pane-frames.txt`. The three probe runs were made before the evidence fix in section 3b, so the codex one still shows `credentialProvisioned: false`; the Workflow run shows `true`.
- Not part of the Accepted run: the first Workflow attempt `wf-run-1790940009740-16803ed6` failed (panelist-2 and panelist-3 were refused with "dispatch for cwd ... is already in flight"; evidence `ca3-first-attempt/`), and a second complete pass `wf-run-1790940254877-1a85385b` ran before the last two fixes of section 3b (private-home removal, evidence flag); its files are not kept, the final run above supersedes it.
- Limits: the question was a design question about this repo, so the panel proves the transport, the four families and the confinement, not the quality of the advice (the reports are in the evidence folder to read). Only one openai account (fgovn) is in the inventory. During the first attempts (login not yet provisioned into the pane) a codex pane showed a ChatGPT "usage limit ... try again at 8:24 PM" screen; a plain `codex exec` with the tetnu account home showed the same message at that time while fgovn answered. It did not recur once the login was provisioned and its cause is not established. The screen text contains "usage limit", which is one of the configured patterns, but I stopped that run after 10 minutes before the ladder reported, so provider-limit fallback on a real screen is still unmeasured (section 5, point 3).

### Case 4 (Accepted; limit of the test: a fake screen, not a real provider limit)
- `ca4/unit-run-1790934553748-4d3a3007/`. Capability `acceptance:limit`, `prefer: [fake-limit, claude-herdr]`. The fake executor (`ca4/fake-limit.sh`) prints "Claude usage limit reached. You have hit your usage limit. Try again in 3 hours ..." plus "[fake screen ... not a real provider limit]" and sleeps. `idleTimeoutMs` was 60 s in the overlay so the case fits in minutes; the default is 5 min (see section 3).
- `producer/1`: executor `fake-limit`, transport `herdr`, pane `wS:p3TP`, `classification.outcome: infra/provider-limit`, `failure.code: provider-limit`; `visibility.json` records `outcome: provider-limit` with the screen line; `stderr.log`: "ended as provider-limit: the screen says a provider limit was reached ... Pane wS:p3TP is left open."
- `producer/1-fb1`: executor `claude-herdr`, transport `herdr`, pane `wS:p3TQ`, `provenance.fallbackFrom = {executor: fake-limit, invocation: fake-limit-herdr, transport: herdr, reason: provider-limit}`, `completed-pass`, 16 s. `unit.json` `bindings["producer/1"]` lists both attempts.
- The old pane stayed open for the whole run; I closed it after reading this evidence. Pane frames: `ca4/pane-log.txt`.
- **The limit screen the owner saw ("Claude usage limit reached ... Try again in 3 hours (resets 11:00pm)") is this fake screen, not a real limit.** Executor `fake-limit`, model `fake`, panes `wS:p3TG`, `wS:p3TJ`, `wS:p3TM` (earlier attempts) and `wS:p3TP`; runs `unit-run-1790932774142-d7d8c2b4`, `unit-run-1790933528509-9aa9a4a0`, `unit-run-1790934148893-19755245`. No real claude pane hit a limit: `claude-herdr` ran sonnet on the owner's default login, glm on OpenRouter; the status line showed 75-76 % of the weekly quota.
- The earlier attempts failed for real reasons found and fixed on the way (section 3): the ladder never fired (reported status stuck on `working`), then had no idle limit configured, then could not read the screen (`herdr agent read` prints plain text).

### Case 5 (NOT RUN)
A worktree at tag `pre-engine-retirement` (`13f7f01fd`) was created and the old engine is present (`fgos coordination start|operation|authorize-and-dispatch|fan-out|contribution|disposition|close`, protocol `architecture-advisory-panel-standard-v1`). `coordination start` refuses without `--objective` and `--writer-id`, and the engine needs a Lead to author and authorize every step (framing, three shaping dispatches, critique, synthesis, explanation; 6-13 `operation-authorized` plus dispositions in the 11 historical sessions) against its own event store. Driving it here would make "Lead-active" my own typing rather than a measurement of the engine, and the new engine could not run case 3 for the same question anyway. Worktree removed. The comparison remains the one in `261001-0327-request-to-run-p4-discussion-patterns-engine-retirement/reports/acceptance-case-2.md` (separate sources, not a controlled experiment).

### Case 6 (Accepted)
- `ca6/unit-run-1790934670425-5d5c769e/`, run with `HERDR_ENV` and the other `HERDR_*` variables unset (herdr absent), same Unit as case 1 (output file `ca6-docs-note.md`).
- producer: `claude` / `claude-cli-bwrap`, transport `cli`, posture `workspace-write`, `adapter: cli-spawn`, 24 s. reviewer: `gemini` / `agy-cli-bwrap-mucdong`, transport `cli`, posture `read-only`, gemini-3.8-flash-medium, 371 s. Both `completed-pass`.
- The posture was applied by the same confinement path: `ca6/confinement-excerpt.json` (from `protected/prepared-invocation`) shows backend `bwrap`, requirement `workspace-write` for the producer and `host-write-denied` for the reviewer, worker command `/usr/bin/bwrap --ro-bind / / ...`; the effective contract states `filesystem: workspace-write, enforced` and `read-only, enforced`. Zero herdr calls (no pane created).
- Pinned invocations were needed (`--override` with `claude-cli-bwrap` and `agy-cli-bwrap-mucdong`): the executors' first cli invocations are not confined.

## 3. Defects found in the herdr path and fixed (one commit each, tests through `runUnit`/the fake herdr)

| Commit | Defect (evidence) | Fix |
|---|---|---|
| `f635ad235` | The task prompt was typed into the claude pane and never submitted: the confined launch never waited for the agent's prompt, so the submit key went to a UI still starting (`herdr agent explain` showed `idle` with the brief sitting in the prompt box; the pane stayed like that for 19 minutes until a key was pressed by hand). Also claude stopped on its own "read outside the working directories" prompt for the brief in the run directory. | Wait for herdr's screen detector to show a ready prompt before typing; afterwards submit an unsent draft with Enter (bounded, spaced; `briefSubmitKeyResent` in `visibility.json`); a visible blocking dialog stops both. Claude panes get `--add-dir <runDir>` (only the run directory). |
| `4180be3fe` | A claude pane routed through OpenRouter stopped on a blocking notice "We're changing auto mode ... this session isn't eligible because your requests go through openrouter.ai ... Enter to continue / Esc to cancel"; nobody answered and the tool call ended "Interrupted". Not a banner. | `CLAUDE_CODE_AUTO_MODE_SERVER=0` in the `glm-herdr` env (name read from the claude 2.1.287 binary; verified live: no notice, 43 s probe). Config test pins it and that the key is only the `${GLM_OPENROUTER_API_KEY}` placeholder. |
| `5a21d07a7` | A pane reviewer wrote a claim without `assessment.verdict` and the run was refused (`invalid-agent-result-claim`): the herdr brief took the role from an object the effective contract never carries, so only the headless prompt stated the requirement. | The assignment role/operation now reaches `renderBrief`. |
| `2e9b53f6c` | A confined pane's `agent get` status stays the "working" fgos reported at launch forever; the poll loop saw a finished/hung/limit-stopped agent as busy, so idle and limit checks never ran (a hung pane held 12 minutes in the first glm probe). | Read herdr's detector verdict first for a confined target; reported status only as fallback. |
| `ed962c89f` | With no `idleTimeoutMs` in the runner config (the committed config has none) the idle check is off, so the usage-limit screen is never read. | Herdr rounds get a 5-minute default idle limit; a configured value wins (`idleTimeoutMs` also governs cli-spawn, so it was not changed globally). |
| `aade09363` | `herdr agent read` prints plain text on this herdr, not the JSON envelope the client required: every screen read threw and was swallowed, so the limit line was never matched and stalled panes were reported as a bare `timed-out-idle` (seen in `unit-run-1790934148893-19755245`). | Take a non-JSON success body as the screen; failures stay named. |

Verification: `env -u CLAUDE_CODE_SESSION_ID node --test` over `test/runner`, `test/cli`, `test/workflow` after the first four: 3250 tests, 3182 pass, 0 fail, 3 skipped (rest todo); `test/setup` 648/648; targeted herdr and execution suites after the last two: 186 and 213 tests, 0 fail. Full `npm test` after the last commit (`CLAUDE_CODE_SESSION_ID` unset): 6519 tests, 6446 pass, 0 fail, 8 skipped, 65 todo, exit 0. The new `run-herdr` tests were checked to fail without their fix (the sticky-status one fails after 45 s with the detector read disabled).

## 3b. Second round: codex, agy and pi in panes (defects found and fixed)

Prior art first (`docs/specs/confinement-authority.md` section 13.1 records it): the sanctioned way to give a confined agent its account was already there (private-home `resourceBindings` on `codex-cli-bwrap` plus the machine-global provider account inventory, `RUL65b`), but only for cli-spawn and only for codex. The round extended it instead of adding a mechanism.

| Commit | Defect (evidence) | Fix |
|---|---|---|
| `6e8d0304e` | A pane's agent could not be logged in: the herdr door never passed the leased account to the confinement request (`executeExecutorCli` read it from a bag nobody filled), and the dispatch refused credential provisioning for any adapter but cli-spawn. A codex pane showed the sign-in screen. | The door takes `providerCapacity`; the refusal no longer excludes herdr-spawn; new `home-files` credential source (explicit file list, owner-only, fail closed, exec bit kept for a helper) next to `codex-home`. |
| `6e8d0304e` | The private home starts without trust decisions, so codex stopped at its folder-trust dialog; trust was seeded only into the real account store. | Trust is derived from the real store and written to the private one (`config.toml` / agy `settings.json`); a linked worktree may derive it from its main checkout. The real store is not edited. |
| `6e8d0304e` | agy: the typed brief was lost (the pane showed an empty prompt for 5 minutes). herdr says "idle" for an agent kind it has no screen rule for even while the UI is not drawn, the brief went in 1.7 s after launch, and the resend never fired because a boot spinner counted as "brief taken". | For a verdict with no rule, the brief is typed after the screen has changed from the launch and held still (bounded at 15 s); the live herdr test no longer depends on a 2-second worker. |
| `acde5fd07` | The three herdr invocations passed the prompt as an argument: agy rejected it ("Prompts are read only from -p/--print"), and codex/pi received the assignment prompt (with an artifact path outside the outbox) beside the brief. | `{prompt}` removed from the herdr args; the round types the brief pointer. codex trades `--dangerously-bypass-approvals-and-sandbox` for `-s danger-full-access -a never` (bwrap encloses it); `resourceBindings` private-home added to all three. |
| `4106fbc55` | The first Workflow attempt failed: the second and third panelist were refused with "dispatch for cwd ... is already in flight" (`ca3-first-attempt/`). The herdr door held an exclusive per-directory lock for every call. | A read-only dispatch shares the directory (as the supervisor path already did); a writer is still refused. |
| `2880e3846` | `provider-capacity-selection.json` said `credentialProvisioned: false` for a pane that had its account. | Read from the prepared-invocation record. |
| `6912291dc` | A successful pane run left its private home, with a copy of the account login, in the temp directory. | Removed once the worker returned; kept after a failure, like its pane. |
| `27030e1b8` | A confined pane with no matching account in the inventory would only show a sign-in screen. | `fgos doctor` check `confined-pane-accounts`. |

Machine state: the three accounts were added to `runner.providers` in `~/.fgos/config.json` (openai: `fgovn`; xai: `vantt`; gemini: `mucdong`, with their credential file lists; the file before the change is not kept in the repo). That inventory is global-only by design, so a fresh machine needs the same entries; `fgos doctor` names a pane whose entry is missing. Panes I opened were closed; the stale credential copies of earlier failed rounds under `/tmp/fgos-confinement` were removed.

Verification: `CLAUDE_CODE_SESSION_ID` unset, `test/runner` 2416 tests (before the last two fixes), `test/cli` 841 (776 pass, rest todo), `test/workflow` 23, `test/setup` 651; full `npm test` after the last code commit: 6550 tests, 6477 pass, 0 fail, 8 skipped, 65 todo.

## 4. Trust prompt (claude workspace trust)

Not reproduced on this machine. `visibility.json` of every claude/glm pane records `trustSeedFailed: trust seed refused for "/var/tmp/p6-accept-work": its repo root "/home/vantt/projects/forgentX-p6" is not itself trusted, so there is nothing to derive trust from` (seeding is derived only from a trusted repo root, by design; the p6 worktree is not in `~/.claude.json`, only `/home/vantt/projects/forgentX` is). Despite that no trust dialog appeared in any sampled pane screen (`ca2/ca4 pane logs`, 1-3 s sampling), and `claude` started in `/var/tmp/p6-accept-work` without one (the owner's settings have `skipDangerousModePermissionPrompt: true`). So the code path that seeds for the real cwd works when the root is trusted (existing tests), and where it is not, the new readiness check stops before typing at any visible dialog and the ladder reports `blocked` with the screen line. I did not widen trust derivation and did not touch `~/.claude.json`; the entries the runner seeds are removed on settle (`trustRemoved: claude-json`). If the owner still sees the dialog, send me the pane text: it would be a different build/setting than the one measured here.

## 5. Concerns and what is not covered

1. **G7 is now met for five families** (claude, claude routed through OpenRouter as z-ai, openai/codex, gemini/agy, xai/pi), each with one account in the pane executors. Concerns that remain: the inventory entries live in the machine-global config and are not created by `fgos setup`; pi downloads nothing now only because `bin/fd` is in its file list; an agent that keeps state the file list does not name (a new onboarding flag, say) will meet it as a first-run screen, which the readiness check reports as `blocked` or an idle timeout, not as a silent pass.
2. **Pane startup noise and cost:** every sandboxed claude prints five `SessionStart:startup hook error ... EROFS ... ~/.claude/session-env` lines (harmless; sessions are not persisted). The glm reviewer is slow and its first submit key was lost both times (`enters=1`); durations 101 s and 234 s against 25 s for claude.
3. **Fallback was proven with a fake screen only**; the limit patterns (`DEFAULT_USAGE_LIMIT_PATTERNS`) remain unmeasured against a real claude/codex limit screen. cli-spawn has no limit detection, so a headless run never falls back.
4. **Idle limit:** the herdr default (5 min) makes a long silent stretch with the detector reporting `idle` stale; claude working shows as `working` so ordinary runs are not affected, but a run that legitimately waits more than 5 minutes idle needs `idleTimeoutMs`.
5. On a non-agent process in a pane the brief is re-typed twice by the existing resend logic (`ca4/pane-log.txt`); harmless for the fake, noise otherwise.
6. Bind picks an executor's FIRST herdr invocation (phase 4 concern 3) and run records show `confinement: null` in `result.json` for both transports; the confinement proof is in `visibility.json` (herdr) and `protected/prepared-invocation` (cli, excerpted).
7. A hung herdr round that is stopped by killing `fgos run` leaves `dispatch--<cwd>.lock` until the process dies; I killed my own stale processes by pid only.
8. Early attempts that are not evidence for any case (kept out of the folders): `unit-run-1790927140155-52c35521` (store/workspace overlap), `...1790927186351-aba875d5` (codex), the probes `...1790927223535/537` (pi crash, pane left idle), `...1790927936523-89d88a37` (claude pass after 408 s with the submit key lost), `...1790928371264-412209ac` (glm interrupted), `...1790929931572-a932dc90` (a nudge script pressing Enter, killed). In the unplanned probes I pressed Enter on one stuck pane (`wS:p3SW`) once, to confirm the diagnosis, and ran a script that pressed Enter on unsent drafts (`nudges.log`: one nudge) before the fix existed; neither is in an Accepted run.
9. Cleanup: panes I created are closed (`herdr pane list` at the end shows only the panes that existed at the start, plus one owner pane `wS:p3TA` that appeared during the work and was left alone); `/var/tmp/p6-accept-work` worktree, `/var/tmp/p6-accept-bin` and `/var/tmp/p6-old-engine` removed; no entry left in `~/.claude.json` by the runner.
