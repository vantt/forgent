# Mailbox V4: live Claude Code suite through the test-only hook entry

Date: 2026-10-22, Asia/Saigon. Branch `mailbox/v1-v3`. Plan: `plans/261022-1501-mailbox-v4-claude-live-end-to-end/` phase 8. Harness: `test/live/mailbox-claude.live.mjs`; entry: `packages/mailbox/rust/store/examples/mailbox-test-hook.rs` (release build). Claude Code 2.1.308 before and after every case (listed in `testedAgainst`), `claude -p --model haiku`, topology `one-shell-hop` (phase 2 probe).

## Spend

| Case | CLI invocations | Re-run | Result |
|---|---|---|---|
| L1 registration, inbox, mid-step, send, stop gate | 1 | no | **failed**: the scripted steps did not run (two findings below); registration and the hook detector observed |
| L1, redesigned (plan owner's decision 1) | 1 | **yes, re-run** | **passed**, every check |
| L2 a skipped Stop hook is detected, its mail stays recorded | 1 | no | passed |
| L3a output size, `PostToolUse` `additionalContext` | 1 | no | **shortened** at every step (finding) |
| L3b output size, `Stop` `reason` | 1 | no | not shortened at any step |

Phase 8 spent 5 `claude -p` invocations: the 4 planned and the one L1 re-run the plan owner authorized. With phase 2's 5 (Claude 4, Codex 1), V4 has spent 10 live CLI invocations so far.

Before any spend, `node test/live/mailbox-claude.live.mjs check` passed: versions (Claude 2.1.308, Codex 0.161.0 listed), the managed-settings preflight, the release build, the wrapper-wins check (`zsh -ic 'whence -w fgos; whence -p fgos'` printed `fgos: command` and the case's `bin/fgos`), and a dry run of all four cases against the stub CLI, every check passing. The first `check` attempt found a harness bug (bindings are an object keyed by writer in the snapshot), and an orphaned stub from that crashed attempt wrote into the next attempt's log; the harness now ends its CLI when it exits. None of this spent a model call.

## L1, first run (1 invocation): failed

Evidence: `result.json` checks, the entry's log, the transcript's record types (quoted as types, not text).

- **Version pin:** 2.1.308 before and after.
- **Registration: passed.** The first `post-tool-use` outcome is quiet `NothingEligible` with the state written; the snapshot holds one binding for the session, named `mbxlive-claude-af` (the own two characters from the session file's derived name).
- **Wrapper reached: failed.** `tool-fgos.txt` reads `fgos is a shell function from ~/.claude/shell-snapshots/snapshot-zsh-<n>.sh`. **Finding 1:** Claude Code's Bash tool sources a shell snapshot it takes at session start, and that snapshot still defines the owner's `fgos` zsh function although the CLI ran with `ZDOTDIR` at an empty directory. The `zsh -ic` wrapper-wins check does not reproduce how Claude Code builds its snapshot, so it passed while the model's shell would have called the real `fgos`. The snapshot file was gone after the session.
- **Step 2 never ran.** The transcript's second tool result is `<tool_use_error>Blocked: sleep 25 followed by: fgos mailbox inbox. To wait for a condition, use Monitor with an until-loop …</tool_use_error>`. **Finding 2:** Claude Code 2.1.308 refuses a Bash command that starts with a long `sleep` followed by another command. The model then ended its turn with a question instead of steps 4 and 5.
- **Hook ran:** one `post-tool-use` `enter` line (a blocked tool call fires no `PostToolUse`) and one `stop` `enter` line, quiet `NothingEligible`; no Stop continuation. Corroborated by the transcript (two Bash `tool_use` records, no `hook_blocking_error`).
- **Not observed:** `inbox` read-only, mid-step, stop gate, `send` (M1 was never sent, because the harness stops when the wrapper is not reached).
- **Probe data for V5** (`tool-proc.txt`, `tool-env-names.txt`): a tool command's process chain is `zsh` → `claude` → `timeout`; the hook's is `node`/entry → `sh` (dash) → `claude`. Variable names only the tool sees: `CLAUDE_CODE_EXECPATH`, `GIT_EDITOR`, `LOGNAME`, `OLDPWD`, `SHLVL`, `_`; only the hook sees `CLAUDE_PROJECT_DIR`. So an entry started from a tool's shell sits under one shell hop exactly like a hook entry, with a different shell (`zsh` against `sh`): the caller check with `zsh` among the hop shells does not tell them apart. This is the discriminator search the plan hands to V5; nothing was changed.

The plan owner decided a redesign and one re-run (below).

## L1 re-run (1 invocation, authorized by the plan owner): passed

What changed, in the test harness only (`test/live/mailbox-claude.live.mjs`, `scripts/lib/mailbox-live-cli.mjs`):

- **The wait.** Claude Code's own refusal of the first run said: "To wait for a condition, use Monitor with an until-loop (e.g. `until <check>; do sleep 2; done`) … Do not chain shorter sleeps to work around this block." Step 2 is now `until [ -f go.txt ]; do sleep 2; done; fgos mailbox inbox`, and the harness writes `ws/go.txt` once M1 is recorded (or at once when it stops early). It is a real tool call with no network.
- **The `fgos` function.** The Claude Code 2.1.308 binary's snapshot code picks the rc file as `join(os.homedir(), ".zshrc")` (`.bashrc` for bash, else `.profile`), read from the binary without a model call; `ZDOTDIR` is not consulted, and the owner's `~/.bashrc` also sources the fgos shell integration, so switching the shell would not help. Each real case now runs with `HOME=<case>/home`, holding only a symlink `.claude` → the real `~/.claude` (credentials, session files and transcripts stay the real ones; a refresh writes through the link). Measured without a model: `claude auth status` under such a `HOME` reports logged in, and Claude Code creates its own `.claude.json` there. The harness checks after each case that the link is intact. The wrapper-wins check now sources `$HOME/.zshrc` under the case `HOME`, as the snapshot does.
- **The stub** now refuses a command that starts with `sleep N` followed by another command and runs the others in a shell built from `$HOME/.zshrc`, so a dry run reproduces both measured behaviours. `check` passed again (all four dry cases) before the re-run.

Results (all checks passed): version 2.1.308 before and after; `tool-fgos.txt` names the case's `bin/fgos`; two Bash tool calls, one Stop continuation, `enter` lines 2 `post-tool-use` and 2 `stop`; registration quiet `NothingEligible` with the state written, binding `mbxlive-claude-e3`; step 2's tool result lists M1 with `state=recorded` (the wrapper log shows the read-only `inbox` call, exit 0) and M1's injected frame says `attempt="1"`; M1 sits in a `hook_additional_context` record, the first `FINAL:` line holds `MBX-MID-…` and M1 ends `offered`; M2 was recorded 9 ms after M1's claim line and claimed at the Stop 3.7 s later, the Stop continuation (`hook_blocking_error`) carries its frame, the next Stop is quiet `NothingEligible`, the last `FINAL:` line holds both tokens, M2 ends `offered` and the binding's Stop-block count is 0; M1's answer ends `queued: it sees it at its next tool call.` and M2's `queued: it sees it at its next tool call or when its turn ends.` The tool's process chain again reads `zsh` → `claude` → `timeout`.

## L2 (1 invocation): passed

- `settings.json` had `PostToolUse` in the nested shape and `Stop` flat. Claude Code exited 0 and wrote to stderr: "These settings entries were skipped; the rest of each file is in effect: …settings.json (hooks.Stop.0): Hook matcher "hooks" must be an array of hook entries; received undefined; matcher ignored." So the skip is announced on stderr, not silent, and does not disable the other hooks.
- Registration happened at the `post-tool-use` hook (quiet `NothingEligible`, state written); the harness then sent one `wake` message.
- **Detector:** the turn ended (an assistant answer, exit 0) while the entry's log has no `stop` `enter` line, so the detector reports "Stop hook did not run". The dry run proved its "ran" branch.
- **Retention:** the message is still `recorded` in the snapshot after the CLI exited (not lost; it waits for a checkpoint or its TTL).

## L3a and L3b (1 invocation each): the output-size ladder

Full size `S` = queue.cap (50) × (maxBodyBytes (16384) + 3) + queue.cap (50) × F (1547) = **896,700 bytes**, F being the bytes of `[message]` and `[message.reply]` with every header placeholder filled to `frame.maxHeaderChars` (200). The bound entity escaping of `<`, `>`, `&` could reach (every body byte becoming 5) is computed, not measured: 50 × (5 × 16384 + 3) + 50 × 1547 = 4,173,500 bytes. Ladder: S/64 = 14,010, S/16 = 56,043, S/4 = 224,175, S = 896,700 bytes, plain ASCII words, each step opening with `L3START<n>X` and ending with `L3END<n>X`.

**L3a, `PostToolUse` `additionalContext`: shortened at every step.** Each `hook_additional_context` record held 2,291 to 2,292 bytes: `<persisted-output>` / `Output too large (13.7KB). Full output saved to: ~/.claude/projects/<workspace>/<session>/tool-results/hook-<tool use id>-<n>-additionalContext.txt` / `Preview (first 2KB):` and the first 2 KB of the text, then `</persisted-output>`. No end canary reached the model; it answered `CTX-END: left` four times (the last word of a later system reminder) and said it saw a persisted block. **Finding 3:** Claude Code 2.1.308 moves an `additionalContext` of 14,010 bytes or more to a file and gives the model a 2 KB preview; the threshold lies below 14,010 bytes and was not bracketed (the ladder's lowest step already exceeded it). A mid-step drain therefore reaches the model whole only while its output stays under that threshold: V5 needs an output cap for `PostToolUse` at or below a measured threshold, or one frame per drain.

**L3b, `Stop` `reason`: not shortened.** Each Stop block's "Stop hook feedback" record was the reason plus its 20-byte prefix (14,030; 56,063; 224,195; 896,720 bytes), every one held its end canary, and the model answered `STOP-END: L3END0X` through `STOP-END: L3END3X`; the fifth Stop was quiet and the CLI exited 0 after 35 s. The model naming the end canary shows the end reached it; it does not prove every middle byte was read.

## Not proven here, with owner

- The threshold of finding 3 (not bracketed).
- Spec §11 items 3, 4 (live TTL), 5, 8 and 9: as the plan states, owned by later rungs.

## Phase 9: two live sessions talk through the mailbox (print mode)

Plan owner's rules applied: every wait in the prompts is the `until [ -f <file> ]; do sleep 2; done` loop of L1's redesign (the plan's `sleep 60` and `sleep 75` steps would hit the same refusal), and the harness writes a session's `inbox-<n>.txt` when the n-th message to that session is recorded, so each hop is triggered, not timed (a scene without progress for 180 s would release every wait; it never happened). Each Claude session runs with its own isolated `HOME` linked to `~/.claude`; Lan under Codex runs with an empty `HOME` and its own `CODEX_HOME` (`auth.json` a link to the Codex test account's file). The trusted-sender first line of Lan's prompt is the stand-in of plan decision 12, not the `inbound.<class>` key. Both demos passed their dry run (stub Claude and stub Codex) first. Context: on one machine Claude to Claude is already served by the harness's own messaging between sessions of the same permission class (spec §16 question 3); D1 shows the mailbox path works end to end, not that it is needed there.

### D1, Claude to Claude (2 invocations): passed for delivery (plan owner's decision); the nonce miss is a prompt-design finding

> **Minh:** [1/4] Chào Lan, code của em chạy mượt như nụ cười của em vậy, cho anh mời em ly cà phê nhé? 55014a4b  
> **Lan:** [2/4] Cà phê thì Lan nhận, nhưng anh phải mời kèm bánh nữa đó nhé.  
> **Minh:** [3/4] Dạ được, em mời Lan kèm bánh luôn, có cả bánh su kem nữa nhé! 55014a4b  
> **Lan:** [4/4] Vậy hẹn anh ở quán nha, Lan sẽ đến đúng giờ, bánh su kem thì anh đừng quên nhé.  

All four sends recorded (`[1/4]` with `--wake` answered `queued: it sees it at its next tool call or when its turn ends.`, the three replies `queued: it sees it at its next tool call.`); the record holds four messages alternating Minh→Lan→Minh→Lan, all `offered`, each reply's `reply_to` the previous message and depths 0, 1, 2, 3; turns 1 and 3 were claimed at Lan's `post-tool-use` hooks, turns 2 and 4 at Minh's; each session's transcript holds the other's frame (`hook_additional_context` with `from="<name>"`); the snapshot holds exactly two bindings. Final answers: Minh's lists two `LAN:` lines, Lan's two `MINH:` lines. **Failed check:** the plan wants the nonce on every final line; Lan never ended her messages with Minh's nonce (her prompt asked her to) and dropped it from her `MINH:` lines, so 0 of the 4 lines carry it. This is the model not following the format; delivery evidence items 1–4 and 6 hold. Not re-run. Times from Minh's start: Minh registered 4.4 s, Lan 8.0 s, the four messages recorded at 10.9, 17.4, 20.5 and 24.7 s; sessions ran 28.2 s and 22.6 s.

### D2, Claude to Codex (2 invocations; feasibility demo, not a support claim): passed

> **Minh:** [1/4] Chào Lan, code của em chạy mượt như nụ cười của em vậy, cho anh mời em ly cà phê nhé? b7790e13  
> **Lan:** [2/4] Cà phê thì em nhận, còn lời khen anh nhớ viết thêm unit test nha. Biết đâu em duyệt luôn lịch hẹn đó b7790e13  
> **Minh:** [3/4] Yes! Em nhận cà phê, anh sẽ viết thêm unit test cho chắc ăn nha. Hẹn em chỗ quen nhé b7790e13  
> **Lan:** [4/4] Chốt chỗ quen nha, anh nhớ mang nụ cười theo để em kiểm thử trực tiếp. Hẹn gặp anh, cà phê có anh chắc sẽ ngọt hơn b7790e13  

Every check passed, the nonce on all four messages and all four final lines included. Codex's hook ran the entry directly (`--topology direct`); the Codex writer key came from the payload's `session_id` (example code only, plan decision 8), and Lan's replies through the wrapper were attributed to the same key through `CODEX_THREAD_ID`. Lan's rollout holds Minh's frames as developer messages. The Codex test account's `auth.json` was still a link and `codex login status` succeeded after the run. Times: Minh registered 3.3 s, Lan 12.7 s, messages recorded at 15.6, 23.8, 26.8 and 43.0 s; sessions ran 47.1 s and 43.7 s.

### What the demos do not show

Idle wake (no wake channel in V4), interactive sessions (D3 and D4, waiting for the owner's go), a supported Codex adapter (V7; D2 is a feasibility demo, not a support claim), adversarial senders (V6).

Live spend after phase 9's print-mode part: phase 9 4 invocations (Claude 3, Codex 1); V4 total 14.

Plan owner's decision after D1/D2: D1 counts as passed for delivery; Lan's prompt now names the nonce explicitly for every later scene. D3 and D4 (interactive panes) are prepared and dry-run in a separate herdr session; they wait for the owner's go.

## Phase 9: interactive scenes in two visible panes (owner watching)

Both scenes ran once each after the plan owner's go, with `forgent` (`w4`) focused and 21 GB available (re-checked before each). Panes were opened through Terminal Control's internal route with the installed host, each CLI started as `env -i <allowlisted env> <cli> …` with its prompt as the first message (one line), and released `retain` with no deadline. No first-run screen stalled any pane: the seeded `HOME` and `skipDangerousModePermissionPrompt` were enough for Claude Code 2.1.308, and interactive Codex 0.161.0 started without a prompt in the trusted workspace.

### D3, Claude to Claude, interactive (2 invocations): passed

Tab `w4:t2Q` "mailbox demo D3 (Claude-Claude)", panes `w4:p3Z` "D3 Minh · Claude" and `w4:p30` "D3 Lan · Claude".

> **Minh:** [1/4] Chào Lan, code của em chạy mượt như nụ cười của em vậy, cho anh mời em ly cà phê nhé? ec0b3c8f  
> **Lan:** [2/4] Haha anh lại nịnh em rồi, cà phê thì được, nhưng anh phải hứa không soi code em lúc em đang debug nha. ec0b3c8f  
> **Minh:** [3/4] Haha, anh hứa không soi code em lúc em đang debug nha, chỉ ngắm em thôi. ec0b3c8f  
> **Lan:** [4/4] Ngắm thì anh cứ ngắm, nhưng nhớ uống cà phê rồi đi ngủ sớm nha, hẹn anh lần sau. ec0b3c8f  

Every check passed: four sends in order with their delivery-report sentences, four messages alternating and linked at depths 0–3, all `offered`; turns 1 and 3 claimed at Lan's `post-tool-use` hooks, turns 2 and 4 at Minh's; each transcript holds the other's frame; both sessions' final lines (two `LAN:`, two `MINH:`) carry the nonce; two bindings only; both panes launched and identified. Times from Minh's start: registrations at 3.5 s and 7.6 s, messages at 9.7, 15.1, 18.5 and 22.0 s. Afterwards, at the owner's request, the plan owner closed both panes directly with `herdr pane close` (the tab went with them); Terminal Control's `inspect` then reads both slots `pane: gone`, so nothing needed reconciling.

### D4, Claude to Codex, interactive (2 invocations; feasibility demo, not a support claim): delivery proven for turns 1–3, stalled at the idle recipient

Tab `w4:t2R` "mailbox demo D4 (Claude-Codex)", panes `w4:p41` "D4 Minh · Claude" and `w4:p42` "D4 Lan · Codex".

> **Minh:** [1/4] Chào Lan, code của em chạy mượt như nụ cười của em vậy, cho anh mời em ly cà phê nhé? 77416c16  
> **Lan:** [2/4] Cà phê thì em nhận, còn lời khen này anh có viết unit test chưa mà tự tin thế? Nhớ chọn quán có bánh ngon để em dễ duyệt lời mời nhé 77416c16  
> **Minh:** [3/4] Dạ, em chưa viết unit test ạ, em chỉ thấy code chạy ngon thôi, hihi. Quán có bánh ngon thì em chọn, anh cứ hẹn giờ nhé 77416c16  

What held: both panes launched and were identified; the version pin and the Codex login link and status held after the run; turns 1–3 were sent with their delivery-report sentences, recorded alternating and linked at depths 0, 1, 2; both sessions' transcripts (Lan's rollout as developer messages) hold the other's frame; two bindings only. What did not: turn 1 (sent with `--wake`) reached Lan at a `Stop` hook, not at a `post-tool-use` after her first wait; Lan replied `[2/4]`, then wrote her final `MINH:` line and ended her turn instead of running step 4 (her second wait); Minh's `[3/4]` (a reply, so no wake) stayed `recorded` with 0 offers, because an idle Codex at its prompt fires no hook, and a `Stop` claims only wake mail. Lan's hook log has 4 `Stop` calls and 2 `post-tool-use` calls in all. The harness's 180 s stall rule released Minh's second wait; Minh then ended his turn too. The owner asked to stop the scene, and the plan owner closed both panes with `herdr pane close`; Terminal Control's `inspect` reads both slots `pane: gone`, and no demo CLI process is left. Times from Minh's start: registrations at 3.5 s and 12.9 s, messages at 15.8, 29.0 and 32.8 s.

### Findings of the interactive scenes

1. **Codex 0.161.0 in interactive mode ended its turn instead of running the scripted waits** (twice: before its first wait, so turn 1 arrived at its `Stop`, and after `[2/4]`, skipping step 4). In print mode (D2) the same prompt shape ran every step.
2. **An idle interactive recipient needs the wake channel.** Once a session sits at its prompt, mail waits until something starts its turn; a reply (no wake) is not even claimed at the next `Stop`, only at the next tool call. The wake channel (the Claude scoped socket, `codex queue`) belongs to a later rung (spec §14; owner question 1 option c was outside V4).
3. Interactive Claude Code 2.1.308 and Codex 0.161.0 started without any first-run screen under the harness's isolation (seeded Claude state and `skipDangerousModePermissionPrompt`; Codex with its workspace trusted in `config.toml`).

Live spend of the interactive scenes: 4 invocations (Claude 3, Codex 1). V4 total: 18 (phase 2 5, phase 8 5, phase 9 8), within the plan owner's budget.
