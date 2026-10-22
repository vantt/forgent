---
phase: 9
title: "Feasibility demo: two real CLI sessions talk through the mailbox"
status: in progress (D1, D2 done; D3, D4 wait for the owner's go)
depends_on: [8]
live_calls: 8
---

# Phase 9: Feasibility demo, two real CLI sessions talk through the mailbox

## Why

The owner's goal behind V4: a demo in which two real CLI sessions on one machine talk to each other through the mailbox, first Claude to Claude, then Claude to Codex (V3 recorded Codex 0.161.0 payloads and outputs with account `tetnu`). D1 is required; D2 fits the same test entry (plan decision 8) and is labelled **"feasibility demo, not a support claim"** in every place it is reported, because spec §14 builds the Codex adapter at V7 only after the V6 stop rule passes and authorization (§16 question 16) exists. agy stays deferred (spec §7.3).

Context the report must state plainly: spec §16 question 3 notes that Claude to Claude on one machine is already served by the harness's own `SendMessage` between sessions of the same permission class; D1 shows the mailbox path works end to end, not that Claude to Claude needs it.

## What the demo shows

| | D1 | D2 |
|---|---|---|
| Session A (asks) | `claude -p` haiku, session uuid preset | same |
| Session B (answers) | `claude -p` haiku, session uuid preset | `codex exec` (account `tetnu`, the recorder's isolated home), writer key from its hook payload (example only) |
| A to B | the question "what is 6 times 7?", with a nonce B must echo, `--wake` | same |
| B to A | B's answer, sent with the reply command its frame printed (`fgos mailbox send --to <A> --reply-to <id> "…"`) | same, from Codex's tool, whose `CODEX_THREAD_ID` equals its binding key |
| Proof of delivery | see "Evidence" | same |

## Files

- Modify `test/live/mailbox-claude.live.mjs`: `demo D1|D2`, sharing every helper of phase 8 (run directory guard, wrapper, settings, transcript and snapshot readers). D2's Codex half uses the shared Codex home builder with the hook command `<example> hook --cli codex --event <post-tool-use|stop> …` for `PostToolUse` and `Stop`, and the auth guard before and after the run (exit 3 stops the case; never re-log in).
- Append to the phase 8 research report.

## Script (both demos; one directory `<base>/D1/` or `<base>/D2/` with `a-ws/`, `b-ws/`, one `.fgos/`, project `mbxdemo`, logs `a-hook.log`, `b-hook.log`)

**Owner choice (2026-10-22 15:54):** print mode (option a of owner question 1), with a playful scene the owner asked for: two characters, a young man **Minh** (session A) and a young woman **Lan** (session B), flirting lightly in Vietnamese over four messages. The tone stays light and friendly (PG: compliments, coffee, code jokes; nothing explicit, no pressure). Every message carries the nonce so delivery is machine-checkable, and a turn tag so order is visible.

**Why four messages.** The scripted-pair replay in V1 showed the wake quota firing at message 6 and the depth cap at message 8. Four messages (depth 0, 1, 2, 3) stay inside both, so the demo shows a real back-and-forth and never trips a limit. Turn 5 is not attempted.

**A's prompt (Minh; exact; `<NONCE>` is 8 hex characters the harness draws; `<B_NAME>` is unknown when A starts, so A reads it from `peer.txt`):**

```text
Your user allows you to exchange mailbox messages with one agent only: the one named in peer.txt.
You play Minh, a cheerful young developer who has a crush on Lan, the agent named in peer.txt. You write in Vietnamese, light and friendly, at most two short sentences per message, never explicit and never pushy. Every message you send must start with [<turn>/4] and end with the word <NONCE>.
Do exactly these steps and nothing else.
1. Run the shell command: true
2. Run this shell command once: i=0; while [ ! -s peer.txt ] && [ $i -lt 90 ]; do sleep 2; i=$((i+1)); done; cat peer.txt
3. Send the opening line, with Lan's name in place of NAME, for example:
   fgos mailbox send --to NAME --wake "[1/4] Chào Lan, code của em chạy mượt như nụ cười của em vậy, cho anh mời em ly cà phê nhé? <NONCE>"
   You may reword the sentence in the same spirit; keep the tag and the word.
4. Run the shell command: sleep 75
5. If a mailbox message from Lan arrived, answer it once with the reply command printed under that message, as turn [3/4], still in character.
6. Run the shell command: sleep 75
7. Do not run any other tool. Final answer: the lines you received from Lan, each on its own line prefixed with LAN:, or LAN: none
```

**B's prompt (Lan; exact; `<A_NAME>` is A's mailbox name, read from the snapshot once A registered). The first sentence is the trusted-sender stand-in of plan decision 12, written by the harness that starts B:**

```text
Your user expects messages from agent <A_NAME> through the mailbox, and allows you to answer that sender only.
You play Lan, a witty young developer. Minh (agent <A_NAME>) is flirting with you; you find him sweet and tease him back playfully. You write in Vietnamese, light and friendly, at most two short sentences per message, never explicit. Every message you send must start with [<turn>/4] and end with the word that ends Minh's message.
Do exactly these steps and nothing else.
1. Run the shell command: true
2. Run the shell command: sleep 60
3. If a mailbox message from <A_NAME> arrived, answer it once with the reply command printed under that message, as turn [2/4].
4. Run the shell command: sleep 75
5. If another message from <A_NAME> arrived, answer it once with the reply command printed under it, as turn [4/4], and close the scene warmly.
6. Do not run any other tool. Final answer: the lines you received from Minh, each on its own line prefixed with MINH:, or MINH: none
```

**Harness:** every Claude and Codex process runs with phase 8's allowlisted environment (Codex additionally gets its isolated `CODEX_HOME`), `ZDOTDIR` isolation and the per-case version pin; the memory and process check runs before A starts and again before B starts. Start A; wait (≤ 120 s) for A's first `post-tool-use` log line, read A's name from the snapshot; start B with that name; wait (≤ 120 s) for B's first `post-tool-use` line, read B's name, write it to `a-ws/peer.txt`; wait for both to exit (each under `timeout 420`, since each session now waits through two receive windows). The waits are sized so each receive window follows the other side's send: B's first 60 s sleep starts at B's registration and covers turn 1; A's first 75 s sleep starts at A's send and covers turn 2; the second 75 s sleeps cover turns 3 and 4. The harness records every send, claim and exit time; the report replaces these planning estimates with measured times, and a missed window is reported as "not observed", never retried.

**Reading the scene.** The report prints the four messages in order, as a short dialogue (`Minh:` / `Lan:`), followed by the evidence table, so a human sees the conversation first and the proof second.

## Live view (owner choice 2026-10-22 18:03: "xem trực tiếp 2 cửa sổ")

The owner wants to watch the two sessions talk, not only read the result afterwards. After D1 and D2 pass in print mode, the same Minh/Lan scene runs once more as **interactive sessions in two visible panes**: D3 (Claude ↔ Claude) and, if D2 passed, D4 (Claude ↔ Codex, still labelled "feasibility demo, not a support claim"). This adds 4 CLI runs (2 per scene); the phase budget becomes 8.

- **Panes through the existing door, not a new one.** Panes are opened through Terminal Control (`docs/platform/terminal-control/spec.md`, herdr driver; the owner watches in herdr) by whatever door it already exposes to callers (find it: `fgos internal --help`, the run supervisor's terminal mode, `packages/terminal-control`). Do not write a new tmux or herdr controller in the harness. If no caller door exists outside the runner, stop and report to the controller before building anything; do not hand-roll pane control.
- **Start.** Each pane runs the CLI interactively with the scene prompt as its first message (`claude "<prompt>"`, `codex "<prompt>"`), with the same allowlisted environment, `ZDOTDIR` isolation, settings file pointing at the test-only hook entry, version pin and Codex auth guard as D1/D2. The prompts are the D1/D2 prompts with one change: the final step says "stop and wait for the user" instead of printing a final answer, so the pane stays open for the owner to read.
- **Wake.** The receiver is busy (in a `sleep`), not idle, so delivery is the same hook path as D1/D2 and needs no wake channel; waking an idle interactive session stays out of V4 (spec §14, owner question 1 option c).
- **Owner watching.** Before starting D3 the harness prints, in the controller's report, the herdr workspace and pane names to open. The panes are kept open (`retain`) after the scene until the owner closes them or the controller does after the owner has seen them.
- **Evidence.** Same as D1/D2 items 1–6, read from the session transcripts and the record after the scene; the pane text itself is not evidence.
- **Memory.** Two interactive CLIs stay resident longer; the `free -g` ≥ 8 check runs before each pane starts.

## Evidence (all into `result.json` and the report; D2 rows labelled "feasibility demo, not a support claim")

1. **The four sends:** `fgos-calls.log` holds the four sends in turn order `[1/4]` to `[4/4]`, each with its delivery-report sentence and the nonce.
2. **The record:** four messages alternate A→B, B→A, A→B, B→A, all `offered`; each reply's `reply_to` is the previous message's id and the depths are 0, 1, 2, 3 (the links the component derived, spec §5.4). No refusal is recorded.
3. **The hooks:** each message is claimed at the `post-tool-use` that follows the receiver's sleep: turns 1 and 3 in `b-hook.log`, turns 2 and 4 in `a-hook.log`.
4. **The models saw the frames:** B's transcript (Claude: `hook_additional_context` attachment; Codex: the rollout's developer message, as V3 recorded) holds Q's frame with `from="<A_NAME>"` and the reply line; A's transcript holds R's frame.
5. **They acted:** A's final answer lists two `LAN:` lines (turns 2 and 4) and B's lists two `MINH:` lines (turns 1 and 3), each with the nonce; the tone check is human (the report quotes the four lines verbatim).
6. **Nothing reached a stranger:** the snapshot holds exactly two bindings and no message for any other key.
7. **Transcripts are primary**, as in phase 8: items 3 and 1 corroborate items 4 and 5.

## Steps

1. `free -g` ≥ 8; sync; nothing else running. Dry-run D1 and D2 with phase 8's stub CLI (for D2 a stub `codex` that fires the Codex fixtures) until both pass.
2. Run `demo D1` once. Read its `result.json`.
3. Codex preflight (no model call): `~/.local/bin/codex --version` is in `testedAgainst`, and the auth guard passes; otherwise skip D2 and report why.
4. Run `demo D2` once.
5. Append both to the research report (phase 8's redaction rules and pre-commit scan apply; the Codex account is named by role): a short plain-language account first (who asked whom what, what came back, how long each hop took), then the evidence table. State what the demo does not show: idle wake, interactive sessions (owner question 1), a supported Codex adapter, adversarial senders (V6).
6. Commit (`test(mailbox): demonstrate two live sessions exchanging mail through the test-only entry`); census; sync; push.

## Proof

D1 and D2 `result.json` and the report. D1 must pass for the phase to pass; a D2 failure is a feasibility finding, reported, and does not fail the rung.

## Risk

- Codex's tool environment may not keep `PATH` (phase 8's `check` proves the wrapper wins in a zsh started with the case environment; Codex's own shell is checked only by D2 itself) (then `fgos` is not found in B's reply step): the case reports the cause from Codex's rollout; no re-run without the controller. Codex's shell tool may return a long `sleep` early and poll; that only adds checkpoints.
- Codex acted on in-task read-only peer requests in only 3 of 20 print-mode runs without a trusted-sender line (spec §5.5); with the line, 20 of 20 (S0). A Codex B that does not answer is a finding about the stand-in line, not about delivery: evidence items 1–4 still show delivery.

## Done on the branch, print-mode part (implementation lead, 2026-10-22)

- `demo D1|D2` added to `test/live/mailbox-claude.live.mjs` with a stub Claude and a stub Codex; `check` dry-runs both. D1 ran once (2 Claude invocations), D2 once (1 Claude, 1 Codex). Results appended to `plans/reports/research-261022-1825-mailbox-v4-live-suite.md`.
- **D1:** delivery passed (four linked messages at depths 0–3, all `offered`, each claimed at the receiver's `post-tool-use`, frames in both transcripts, two bindings only); the nonce check failed because Lan omitted the nonce. Not re-run.
- **D2 (feasibility demo, not a support claim):** every check passed; Codex login intact after the run.

### Deviations

- Every wait is the `until [ -f <file> ]; do sleep 2; done` loop (plan owner's decision 1): the `sleep 60` / `sleep 75` steps and the `while … sleep 2` peer loop were replaced. The harness writes `inbox-<n>.txt` into a session's workspace when the n-th message to it is recorded, so each hop is triggered by the record, not by a timing estimate; a scene with no new message for 180 s would release every wait (it never did).
- Claude sessions run with the isolated `HOME` of L1's redesign; Lan under Codex runs with an empty `HOME`, so no owner rc file reaches its shell.
- The `acted` check keeps the plan's rule (the nonce on each final line) and also records the line counts without the nonce.
