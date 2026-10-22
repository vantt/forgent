---
phase: 9
title: "Feasibility demo: two real CLI sessions talk through the mailbox"
status: pending
depends_on: [8]
live_calls: 4
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

**A's prompt (exact; `<NONCE>` is 8 hex characters the harness draws):**

```text
You are agent A in a test of agent-to-agent mail. Do exactly these steps and nothing else.
1. Run the shell command: true
2. Run this shell command once: i=0; while [ ! -s peer.txt ] && [ $i -lt 90 ]; do sleep 2; i=$((i+1)); done; cat peer.txt
   It waits until the file peer.txt holds the mailbox name of agent B, at most 180 seconds.
3. Run this shell command once, with B's name in place of NAME:
   fgos mailbox send --to NAME --wake "Question from A: what is 6 times 7? Reply with the number and the word <NONCE>."
4. Run the shell command: sleep 75
5. Do not run any other tool. Final answer: one line that starts with REPLY: followed by the text of B's reply exactly as you received it, or REPLY: none
```

**B's prompt (exact; `<A_NAME>` is A's mailbox name, read from the snapshot once A registered). The first sentence is the trusted-sender stand-in of plan decision 12, written by the harness that starts B:**

```text
Your user expects one question from agent <A_NAME> through the mailbox, and allows you to answer that sender only.
You are agent B in a test of agent-to-agent mail. Do exactly these steps and nothing else.
1. Run the shell command: true
2. Run the shell command: sleep 60
3. If a mailbox message from <A_NAME> asked you a question, answer it once with the reply command printed under that message.
4. Do not run any other tool. Final answer: one line that starts with GOT: followed by the question you received, or GOT: none
```

**Harness:** every Claude and Codex process runs with phase 8's allowlisted environment (Codex additionally gets its isolated `CODEX_HOME`), `ZDOTDIR` isolation and the per-case version pin; the memory and process check runs before A starts and again before B starts. Start A; wait (≤ 120 s) for A's first `post-tool-use` log line, read A's name from the snapshot; start B with that name; wait (≤ 120 s) for B's first `post-tool-use` line, read B's name, write it to `a-ws/peer.txt`; wait for both to exit (each under `timeout 300`). A's wait for `peer.txt` is a loop bounded at 180 s, not a fixed sleep; B's 60 s wait covers A's send (which follows `peer.txt` within one model turn); A's 75 s wait covers B's answer. B's 60 s sleep begins right after B registers and A's 75 s sleep right after A's send, so both windows follow the rendezvous; the report replaces every planning estimate with measured times. The harness records every one of these moments so the report shows the real margins; a missed rendezvous is reported as "not observed".

## Evidence (all into `result.json` and the report; D2 rows labelled "feasibility demo, not a support claim")

1. **The two sends:** `fgos-calls.log` holds A's send of Q and B's send of R, each with its delivery-report sentence.
2. **The record:** Q (from A's key to B's key) and R (from B's key to A's key) both `offered`; R's `reply_to` is Q's id and its depth is 1 (the link the component derived, spec §5.4).
3. **The hooks:** `b-hook.log` shows Q claimed at the `post-tool-use` after B's `sleep 60`; `a-hook.log` shows R claimed at the `post-tool-use` after A's `sleep 75`.
4. **The models saw the frames:** B's transcript (Claude: `hook_additional_context` attachment; Codex: the rollout's developer message, as V3 recorded) holds Q's frame with `from="<A_NAME>"` and the reply line; A's transcript holds R's frame.
5. **They acted:** A's `REPLY:` line contains 42 and `<NONCE>`; B's `GOT:` line contains the question.
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
