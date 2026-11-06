# Provider route faults on design-lap, 2026-11-06: gemini Argon 404, agy over herdr, `--account`, pi/deepseek limit

For: HARDEN (fg-server2). From: lead:DOCOS on design-lap (owner machine). Everything you need is quoted
below; local run ids appear only as labels, never as the only evidence.

Already sent, not repeated here: `plans/reports/debug-261106-1557-omp-update-banner-seat-foreground-not-agent.md`
(omp seat loses the herdr foreground, backlog `p-4bkfiw7d3j`).

## Context

- Task: one `architecture-advisory` council (5 steps: framing, shaping, critique, synthesis,
  explanation). Started 5 times on 2026-11-06; all 5 ended `failed`, every time on provider or route
  infrastructure, never on content.
- Active fgOS release for every seat: `sha256:0be72b797429…` (from each seat's `launcher.sh`).
- Versions on design-lap (read 2026-11-06 22:2x +07):
  - `omp --version` → `omp/18.17.0` (binary `~/.local/bin/omp`, mtime 15:55 +07 the same day = the update)
  - `~/.local/bin/agy --version` → `1.5.2` (pane banner: `Antigravity CLI 1.5.2`)
  - `pi --version` → `1.5.0` (`@earendil-works/pi-coding-agent`, Node 24.18.0)
  - `herdr --version` → `herdr 0.9.1-vantt.1`
- Gemini executor routes: `omp-herdr` (herdr-spawn) and `omp-cli-bwrap` (cli-spawn), both
  `credentialStore: {use: omp, homeEnv: PI_CODING_AGENT_DIR, files: ["agent.db","config.yml"]}`.
  Tier flagship model = `gemini-4-argon-high`; omp resolves it to provider `google-antigravity`,
  model `gemini-4-argon`, thinking high. The profile `gemini-tetcu72` logs omp in with Antigravity
  (`agent/config.yml`: `modelRoles.default: google-antigravity/gemini-3.8-flash`).

| Run (start, +07) | Where it died | Cause | Section |
|---|---|---|---|
| R1 15:56 | shaping, gemini seat (herdr-spawn) | omp 18.17.0 natives missing in sandbox | 5 |
| R2 16:47 | shaping, gemini seat (cli-spawn) | `Cloud Code Assist API error (404)` | 1 |
| R3 18:03 | framing, 0.1 s | `--account gemini/tetnu` moved framing onto gemini | 3 |
| R4 18:40 | shaping, xai synthesis seat | xAI Grok OAuth signed out (owner re-logged in) | (not a fault here) |
| R5 19:40 | synthesis, deepseek reviewer | pi 402 credits → `terminal:blocked:usage-limit` | 4 |

R4 is listed only for completeness: its gemini seat ran `agy -p` on account `tetnu` and passed; the
xai seat's screen read `Warning: auth: xAI Grok OAuth (SuperGrok or X Premium+) account <redacted> was
signed out automatically. Run /login to sign in again.`

## 1. omp gets 404 for `gemini-4-argon` when launched the way fgOS launches it

**Symptom.** The gemini seat on account `tetcu72` fails with HTTP 404 from Cloud Code Assist, on both
fgOS routes. The owner, running `omp` through his zsh wrapper (`command omp --profile="$profile" "$@"`,
profile `gemini-tetcu72`) interactively in herdr, gets Argon answers in the same hour.

**Invocation (R2, cli-spawn, settled 09:55:20Z = 16:55 +07)**, from the seat's envelope:

```
omp --model gemini-4-argon-high --thinking medium --tools read,write,edit,bash,grep,glob \
    --mode json --auto-approve -p "<brief>"
# leased home: PI_CODING_AGENT_DIR=<temp copy of ~/.omp/profiles/gemini-tetcu72/agent: agent.db, config.yml>
```

Quoted `stdout.log` (last event):

```
"api":"google-gemini-cli","provider":"google-antigravity","model":"gemini-4-argon",
"stopReason":"error","errorMessage":"Cloud Code Assist API error (404): {\n  \"error\": {\n
\"code\": 404,\n    \"message\": \"Requested entity was not found.\",\n    \"status\": \"NOT_FOUND\"\n  }\n}\n",
"errorStatus":404,"credentialId":2
```

Classified `failure: {family: provider, code: nonzero-process-exit}`, outcome `infra`.
Same 404 over herdr-spawn: `fgos run "Reply with exactly one line: the model name you are running as…"
--provider gemini --capability architecture:shape --worktree <panel wt> --timeout 5m --json`
(10:37Z): pane showed omp's `Gemini 4 Argon` status line, then

`✘ Cloud Code Assist API error (404): { "error": { "code": 404, "message": "Requested entity was not found.",`.
omp then sat idle at its prompt; fgOS did not read the error from the screen and the run ended only
at the 5-minute timeout (exit 11). A second herdr try at 11:18Z ended the same way (`execution-timeout`,
exit 143).

**Timeline of direct tests (all outside fgOS, real profile, prompt "Reply with the single word OK.",
`--mode json -p` unless noted):**

| UTC (+07) | Launch | Result |
|---|---|---|
| 11:17:12 (18:17) | `PI_CODING_AGENT_DIR=~/.omp/profiles/gemini-tetcu72/agent omp --model gemini-4-argon[-high] --thinking medium` | `stopReason: stop` (OK), both spellings |
| 11:17:24 | fresh dir with `agent.db config.yml` only | `errorStatus: 404` |
| 11:17:30 | same dir, `models.db` added, second run | `stopReason: stop` |
| 11:27–11:28 | fresh dirs with `models.db`, ± `PI_CONFIG_DIR`, ± WAL files, two runs in one fresh dir | 404 in every variant |
| 11:28:10 | real profile `PI_CODING_AGENT_DIR`, 3 runs | 404, 3/3 |
| 11:29:55 | `omp --profile=gemini-tetcu72 --model gemini-4-argon-high` ×2, then `PI_CODING_AGENT_DIR` ×1 | 404, 3/3 |
| 11:30:08 | `--profile=gemini-tetcu72` with `--model gemini-4-argon`, `google-antigravity/gemini-4-argon`, `--thinking high`, `--thinking off` | 404, 4/4 |
| 11:34:30 | **interactive** in a new herdr pane: `omp --profile=gemini-tetcu72 --model gemini-4-argon`, typed `hi, reply with one word` | replied `Hi`; status line `π-gemini-tetcu72 > ◒ Gemini 4 Argon` |
| ~11:35 | same pane, interactive: `PI_CODING_AGENT_DIR=<profile>/agent omp --model gemini-4-argon` | `"message": "Requested entity was not found."`; status line `π > ◒ Gemini 4 Argon` |
| ~11:36 | same pane, interactive, copied home like fgOS (`agent.db config.yml models.db` + own `PI_CONFIG_DIR`) | same 404 |

Owner screenshot ~11:15Z: interactive `omp-gemini-tetcu72` answering with Argon.

**Retracted hypothesis: `models.db`.** From the 11:17 pair I concluded the leased home lacked
`models.db` and changed config to copy it. That was a first-run confound: the passing run was the
second run in a dir the first run had just populated, and the real profile (which has `models.db`)
went 404 3/3 ten minutes later. The temporary config was reverted; `models.db` is not the cause.

**Ruled out.**
- Model spelling or thinking suffix: bare `gemini-4-argon`, `-high`, `google-antigravity/…`,
  `--thinking off|medium|high` all behave the same at a given moment.
- Sandbox (bwrap) and the copied home alone: the real, unsandboxed profile also 404s.
- Account-wide Argon outage at 11:34Z: interactive `--profile` succeeded then.
- omp catalog: `models.db` under `gemini-tetcu72` still lists `gemini-4-argon` under `google-antigravity`.

**Open hypotheses (not separated):**
1. Launch shape. `--profile=<name>` scopes "auth, sessions, settings, and caches" (omp help) to the
   whole profile root (`agent/ cache/ logs/ plugins/ run/ stats.db`); fgOS only sets
   `PI_CODING_AGENT_DIR` to a copy of `agent/`. In the one same-pane comparison (11:34 vs ~11:35),
   `--profile` worked and `PI_CODING_AGENT_DIR` 404'd. Cloud Code Assist's "Requested entity was not
   found" is commonly a missing or wrong project id for the login; where omp keeps that is unknown.
   Note `credentialId: 2` in the failing event: the agent store may hold several credentials and the
   two launch shapes may pick different ones.
2. Server-side quota on the same Google account. `agy` on `tetcu72` reports Argon exhausted (section 2,
   `RESOURCE_EXHAUSTED (code 429) … Resets in 39h22m46s` at 10:59Z), and omp may surface the same
   refusal as 404. Against it: the interactive `--profile` success at 11:34Z came 35 min after that 429.
   Print mode with `--profile` failing 6/6 at 11:29–11:30 fits neither hypothesis cleanly.

**Suggested owning proofs.**
- Lease layer (`src/runner/dispatch/llm-accounts.mjs` / `provider-capacity.mjs`): a test that the
  leased omp home holds what `omp --profile=<name>` reads, or a decision recorded that `--profile`
  is the only supported omp account switch. Reproduce first on fg-server2 with a
  `google-antigravity` profile: same minute, `--profile` vs `PI_CODING_AGENT_DIR`, interactive and `-p`.
- `fgos dispatch probe-account --provider gemini --account tetcu72` passed at 10:59Z on the default
  model (`omp-cli-bwrap ok … "text":"OK"`), while the flagship model 404'd. The probe proves the
  login, not the tier the seat will ask for.
- Terminal classifier: a herdr screen ending in `✘ Cloud Code Assist API error (404)` should settle
  as a provider failure, not run to timeout.

## 2. agy (Antigravity CLI 1.5.2) in a herdr pane never submits the brief

**Symptom.** A temporary invocation (project config only, since reverted):

```
{id: agy-herdr-tetcu72, via: cli, adapter: herdr-spawn, confinement: {backend: bwrap}, command: agy,
 credentialStore: {use: agy, homeEnv: HOME},
 args: ["--mode","accept-edits","--new-project","--model","{model}"],
 interactiveMode: {exitCommand: "/exit", kind: agy, trustStore: {kind: agy}}}
```

`fgos dispatch probe-account --provider gemini --account tetcu72 --json` (10:58:55Z):

```
verdict cli-fault
omp-herdr ok 31650
omp-cli-bwrap ok 19929 {"type":"message_start",… "text":"OK" … "provider":"google-antigravity"
agy-herdr-tetcu72 other 30075
```

The agy pane (`stdout.log`): launch line ran, agy drew its start screen, the brief landed in the input
box, and nothing was sent:

```
      ▄▀▀▄        Antigravity CLI 1.5.2
    ▀▀▀▀▀▀▀▀      Gemini 3.8 Flash (Medium)
 ┃ Changes to third-party model access
 ┃ Opus 5.5 and Sonnet 5.5 are available on paid Pro and Ultra plans. Third-party model access will no longer be available on your current plan starting on November 18, 2026.
 ┃ esc to dismiss
> ↑ 50 more lines
  …
  - Claim path: …/outbox/result-1.json
```

Outbox empty; run settled `terminal:delivery-unknown`. Same result at ~11:03Z with account `tetnu`.
Two oddities on that screen: the model shown is `Gemini 3.8 Flash`, not the probe's `{model}`, and the
banner says `esc to dismiss`.

**Headless works.** Direct `HOME=~/.agy-homes/<acct> agy -p "Reply with the single word OK…"
--model gemini-4-argon-high --print-timeout 2m`:

| Account | Result (10:59–11:00Z) |
|---|---|
| tetcu72 | `error: Individual quota reached… Resets in 39h22m46s.` / `AGY_ERROR: {"short_error":"RESOURCE_EXHAUSTED (code 429)…","error_code":429}`, exit 3 |
| tetnu | `OK` |
| mucdong | model not in plan (lists `Claude Sonnet 4.6 (Thinking)`, `Claude Opus 4.6 (Thinking)`, `GPT-OSS 120B (Medium)`) |

The fgOS headless route (`agy-cli-bwrap`, cli-spawn, args `-p {prompt} --mode accept-edits
--new-project --print-timeout 30m --model {model}`, the shape of the old `agy-cli-mucdong`) probed
healthy on `tetnu` and carried R4's gemini seat to `pass`. Manually in a herdr pane, sending
`Escape` before typing reached the model (it answered with the quota error on `tetcu72`, quota panel:
`You have hit your weekly limit`).

**Ruled out.** Login and model access on `tetnu` (headless passes); bwrap and the agy credential copy
(same files serve the passing headless route).

**Open hypothesis.** The `esc to dismiss` banner holds focus, so the submit key is swallowed. This is the
case backlog `p-a178ca5c` describes for agy 1.4.2 ("Meet Gemini 4 Argon … esc to dismiss" banner),
marked done in main `172b3906b` ("a delivery waits for the agent's input to be ready (start screen
dismissed) before typing"). Either that readiness gate does not recognise the 1.5.2 banner, or it does
not apply to an `interactiveMode.kind: agy` invocation declared in config.

**Suggested owning proof.** Extend the readiness/delivery test that owns `p-a178ca5c` with an agy
1.5.2 start screen carrying this banner; assert the brief is submitted (outbox written), not only typed.

## 3. `fgos workflow start --account gemini/tetnu` moved the framing seat onto gemini

**Invocation (11:03:58Z):**

```
fgos workflow start architecture-advisory --request "$REQ" --account gemini/tetnu \
  --dir /home/vantt/projects/forgentX --worktree /home/vantt/projects/forgentX-docos-panel --json
```

**The flag's own description** (`fgos --help --json`, `commands[workflow].subcommands.start
.parameters.properties.account`, read 11:02:26Z; same text in `src/cli/command-registry.mjs`):

> "Pin an account, written pool/account (for example openai/work); kept for resume. Seats whose
> chosen model is served by another pool run unpinned; refused if the pool has no such account."

(`fgos workflow start --help` in text form does not print option descriptions; only the JSON help does.)

**What happened.** Framing has one producer seat that ran openai in all four other runs:

| Run | framing executor | model |
|---|---|---|
| R1, R2, R4, R5 | `openai` | `gpt-6.1-sol` |
| R3 (`--account gemini/tetnu`) | `gemini` | `gemini-4-argon-high` |

R3 framing seat policy provenance:

```json
"executor": {"value": "gemini", "source": {"scope": "cliOverride"}},
"model":    {"value": "gemini-4-argon-high", "source": {"scope": "cliOverride"}},
"tier":     {"value": "flagship", "source": {"scope": "cliOverride"}}
```

Caveat for whoever reads provenance: every seat in every run, with or without `--account`, records
executor source `cliOverride` (e.g. R1 framing `{"value":"openai","source":{"scope":"cliOverride"}}`).
The label alone does not discriminate; the executor change from openai to gemini does.

Then the lease refused it, 0.1 s after start (`stderr.log`, runnerNote, classification):

```
provider capacity refused for "gemini": provider-capacity.lease-conflict (account "gemini/tetnu" holds no "omp" login store)
failure: {family: provider, code: provider-capacity-lease-conflict}, outcome provider-limit
```

The dispatch plan picked the default gemini route `{"via":"cli","adapter":"herdr-spawn"}` (omp), even
though the pinned account only declared an `agy` credential source and an `agy-cli-bwrap` route
existed. Two faults, then: the pin changed the executor of a seat outside the pool, and the route
choice ignored which credential stores the pinned account has.

**Workaround used (R4, R5):** no `--account`; `fgos dispatch reconcile provider-capacity quarantine
--provider gemini --account tetcu72 --until <+07 20:09, later extended> --reason …` so the lease fell
through to `tetnu`. Quarantine since cleared; all temporary config reverted 15:16Z.

**Suggested owning proof.** At the account-pin resolver (`src/runner/execution/account-pin.mjs`,
called from `src/workflow/case-start.mjs`): with `--account gemini/x`, a seat whose chosen entry is
openai keeps executor openai and runs unpinned. At the lease: a pinned account whose only store is
`agy` selects an invocation with `credentialStore.use: agy` or refuses before the run starts.

## 4. pi/deepseek seat: a usage-limit visible only in its pane fails the whole synthesis step

**Seat (R5 synthesis, reviewer role, herdr-spawn):** `pi --model deepseek/deepseek-v4-pro --thinking
medium --tools read,write,edit,bash,grep,find,ls --approve`, account `openrouter`
(`provider-capacity-selection`: `reasonCodes: ["quota-limit"]`).

Pane (`stdout.log`):

```
Error: 402: {"message":"This request requires more credits, or fewer max_tokens. You requested up to 914824
tokens, but can only afford 10285. To increase, visit https://openrouter.ai/settings/credits and add more
credits","code":402,"metadata":{"limit_source":"openrouter_credits", … "previous_errors":[{"code":402,
"message":"… You requested up to 914824 tokens, but can only afford 18809. …"}]}}
If this looks like a pi bug, /bug sends a report to the developers.
2.7%/1.0M (auto)                                                   deepseek/deepseek-v4-pro • high
```

fgOS stopped it at 13:28:32Z (20:28 +07) with `stop-requested.json` `cause: cancel`; runnerNote:

```
the agent was stopped: terminal:blocked:usage-limit. Its screen ended with: If this looks like a pi bug, …
Answer the prompt in the pane, or grant trust for this project in the agent's own home, then run again.
The pane is left open.
```

Classification: `failure: {family: provider, code: provider-limit, cause: quota}`.

**Effect.** Synthesis settled `provider-limit` at 13:33:42Z and the workflow failed, although the
producer (claude) passed and the other two reviewers (xai, openai) returned findings. The case frame
was `fallbackPerSeat: 2`, the step's `seatLaunchCeiling: 16`, `seatLaunchesUsed: 4`: no fallback
launch was tried for the dead seat.

**Notes.**
- The remedy line ("grant trust for this project") is the trust-prompt remedy, wrong for a 402.
- `914824` requested tokens: pi asks for nearly the full context as `max_tokens`, and OpenRouter
  pre-authorises it against the balance. Backlog `p-d2dc4f2e` recorded the same pattern on 2026-10-20
  (~911k, seat idle 20 min); this time fgOS did detect it (`usage-limit`) instead of idling.
- Same backlog row: a failed seat gets no fallback to another family, and `fgos workflow resume` does
  not rerun a failed step, so each failure here cost a fresh council run.

**Suggested owning proofs.** (a) pi invocation: a bounded `max_tokens` so a low balance does not refuse
small calls. (b) Classifier: an OpenRouter 402 screen maps to a credits remedy, not a trust remedy.
(c) Step settle: one reviewer seat ending `provider-limit` with launches left under `fallbackPerSeat`
gets its fallback, or the reason it does not is recorded in the settle event.

## 5. omp 18.17.0 natives (already mailed)

After the 15:55 +07 omp update, R1's gemini seat (herdr-spawn, bwrap, settled 09:05:34Z) exited 1 with
`Cannot find module '/$bunfs/root/native/pi_natives.linux-x64-modern.node'` and "The compiled binary
should extract one of: /home/vantt/.omp/natives/18.17.0/pi_natives.linux-x64-{modern,baseline,}.node".
The sandbox mounts `$HOME` read-only, so the first run after an update cannot extract. Running omp once
outside the sandbox created `~/.omp/natives/18.17.0` (16:28 +07); `omp --version` alone does not.

## Unresolved

- Section 1: which of launch shape (`--profile` vs `PI_CODING_AGENT_DIR`) or server quota explains the
  404; print-mode `--profile` failing 6/6 fits neither cleanly. Needs a same-minute A/B on fg-server2.
- Section 2: whether the readiness gate from `172b3906b` covers config-declared agy invocations.
- Whether the `tetcu72` Antigravity weekly limit (agy: resets ~2026-11-08 09:00 +07) is the same
  quota omp draws on.

Status: DONE
Summary: Five provider/route faults from the five failed 2026-11-06 council runs are documented with quoted logs, versions, invocations and timelines; the models.db hypothesis is retracted as a first-run confound.
Concerns: Section 1 root cause is still open. Provenance `cliOverride` appears on every seat in every run, so section 3 rests on the openai→gemini executor change, not on the source label.
