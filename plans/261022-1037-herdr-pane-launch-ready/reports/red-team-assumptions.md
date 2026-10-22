# Red team: assumption destroyer (plan 261022-1037-herdr-pane-launch-ready)

Reviewer roles: Fact Checker + Contract Verifier. Read-only; nothing run against panes.

## Finding 1: the "start banner" marker is already printed on the recorded READY screen; the new rule breaks agy and its cause is unproven
- **Severity:** Critical
- **Location:** phase-03 Requirements (marker `esc to dismiss`, "a ready verdict is never returned while a marker is still on screen", "existing vectors ... unchanged"); plan.md Design step 3
- **Flaw:** The plan treats `esc to dismiss` as the signature of a blocking start screen. In the repo's own real capture it is a footer of a NON-modal announcement shown above a live composer. Nothing in the repo shows that the banner swallows input, that esc dismisses it, or that it caused agy's exit. The plan's fixture is to be "synthesized from the backlog wording", and the backlog's banner ("Meet Gemini 4 Argon") is a different announcement from the one recorded.
- **Failure scenario:** Any agy run whose announcement persists, or whose esc does not dismiss it, presses esc twice and then returns `NotReady` after `READY_MS`. Today the same run ends `Unverified` or `Ready` and types the brief, and the 09:46 run passed with exactly this screen. About 10 existing agy vectors use `ready.txt` and expect Ready, so "existing vectors unchanged" cannot hold. Where the draft fixture shows a composer with text in it, esc may clear the draft.
- **Evidence:** `packages/agent-protocol/contracts/fixtures/terminal/agy/ready.txt:12-16` (banner `┃ esc to dismiss` at line 14, prompt `>` at line 16); `draft-in-composer.txt:14`; `ready.insp.json` (state idle, no rule); `vectors.json:22,38,153,168,202,228,246,272,290,316,358,486` all use the `ready` file; `vectors.json:427,453` (the source note only says "refused by the start-up announcement banner", no wording, no cause); `docs/backlog.md:63` ("Meet Gemini 4 Argon", "intermittent").
- **Suggested fix:** Capture the live banner first (herdr pane read on a fresh agy). Prove that esc dismisses it and what exits agy. Match a modal-only signature, or treat a persistent banner as a bounded `Unverified` and not `NotReady`. Re-baseline the existing agy vectors explicitly in the plan.

## Finding 2: the handshake makes every existing supervisor fake-pane test time out, and phase 4 only fixes a special mode
- **Severity:** High
- **Location:** phase-04 Requirements (fake "start-prompt mode ... appended ... when no scripted screen is set"); phase-01 Verify
- **Flaw:** The fake `pane run` runs the line through `script -qefc` with stdout to /dev/null. `pane read` serves only a scripted `screen` file. A `printf` probe therefore never shows up on the screen in default mode. The plan adds probe-visible output only behind the new flag, and only "when no scripted screen is set". Lifecycle tests script a screen for the agent.
- **Failure scenario:** After phase 1, every `supervise_terminal_fake_herdr` test and any other test reaching plain launch waits the full 15 s, then returns `NotStarted` and fails. Phase 1's verify runs only `cargo build -p fgos-run-supervisor`, so the red suite is not seen until phase 4. Phases 1-3 are therefore not independently landable, and the phase-1 revert/rollback claim fails.
- **Evidence:** `packages/run-supervisor/rust/tests/fixtures/fake-herdr-pane.py:144-158` (run via script, stdout DEVNULL), `:166-168` (`pane read` = scripted screen file); phase-01 "Verify" (build only); phase-04 "Requirements" bullet 1; `plan.md` "Phases" table (phase 4 depends on 1).
- **Suggested fix:** Move the fake-pane change (probe output served by default) into phase 1, run `cargo test -p fgos-run-supervisor` there, and make the probe answer independent of the scripted agent screen.

## Finding 3: the marker is burned before the handshake, so a slow shell now fails a launch that used to succeed
- **Severity:** High
- **Location:** plan.md Design "Data flow" (`publish launch-requested` then `wait_for_shell`); Risks row "Handshake timeout burns the slot"; phase-01 Requirements (timeout 15 s)
- **Flaw:** The plan publishes `launch-requested` first (never retried) and then waits up to 15 s. It calls this harmless because "nothing was typed that could execute". But before this change a slow shell (heavy rc, p10k, nvm, conda) buffered the launch line in the tty and ran it once ready, so the launch succeeded. The probe turns slowness past 15 s into a permanent `terminal-launch-not-started` for that slot. Errors from `read_screen` inside the poll are unspecified. With `?` they return `Err` after the marker is already burned. A single hung `herdr pane read` can also last 15 s (the driver default), so one call can overrun the whole handshake budget.
- **Failure scenario:** A machine with a 20 s shell start. The old path launches; the new one cancels every run. A transient herdr read error during the handshake kills the slot permanently.
- **Evidence:** `packages/terminal-control/rust/src/core.rs:393-424` (marker published at the top of `launch`, before `pane_run`); `packages/terminal-control/rust/src/driver/herdr.rs:23` (`DEFAULT_TIMEOUT_MS: 15_000` per command); phase-01 Requirements; plan.md Risks row 5.
- **Suggested fix:** Publish `launch-requested` immediately before typing the LAUNCH line, not before the probe. Treat read errors during the handshake as "not seen" up to the deadline. Cap each read call at the remaining budget. State how the 15 s relates to `READY_MS` (30 s) and the identify timeout (5 s).

## Finding 4: "the probe starts with p and so can never answer yes" proves only the first keystroke
- **Severity:** High
- **Location:** plan.md Design step 1; phase-01 Requirements ("starts with `printf`", unit assertion); Test matrix row 1 ("probe cannot answer yes")
- **Flaw:** The probe line contains `y` (in `ready`), `n` (in `printf`) and a terminating Enter, and it is re-typed every 1.5 s. omz is single-read (verified), but the plan generalises the guarantee to "any start prompt". A prompt that loops on single keys (the p10k wizard, other `read -k` menus) takes the later letters or the Enter as answers. In omz itself, Enter equals yes. Only the swallowed-first-key arrangement keeps it safe, and the plan assumes the swallow always happens.
- **Failure scenario:** The first key `p` is rejected by a loop-style prompt, then `y` of `ready` is accepted as "yes" and runs a wizard or an update. Or an omz that did not swallow `p`, because the prompt printed late, receives the trailing Enter as the answer yes. The unit assertion pins only `starts_with("printf")`.
- **Evidence:** `~/.oh-my-zsh/tools/check_for_upgrade.sh:281-286` (`read -r -k 1`; case `[yY$'\n']` = update); plan.md Design step 1 and Test matrix row 1; phase-01 Requirements (probe `printf '%s%s\n' fgos-ready- <nonce>`).
- **Suggested fix:** Drop the universal claim. Scope it to omz and state the residual risk. Prefer a probe that cannot contain y/Y/Enter-as-answer (for example with no `y`, and sent without a trailing newline until echo-confirmed), or limit the retry to once.

## Finding 5: the omz facts omit the typed-ahead branch, so the failure model behind the tests is wrong
- **Severity:** Medium
- **Location:** plan.md Prior-art row "Verified omz facts"; phase-01 Step 3 (MemDriver swallows "the first N typed lines"); phase-04 fake ("first character consumed")
- **Flaw:** omz checks `has_typed_input` before it prompts. If anything is already typed ahead, it prints a reminder and never calls `read`. The incident (first key swallowed) therefore means the launch line arrived after the prompt was drawn, a timing window the plan never characterises. The fixtures instead model an unconditional swallow of whole lines or characters. Retried probes landing early get a different branch (no swallow at all), and the tests exercise neither the window nor the typed-ahead branch.
- **Failure scenario:** The suite is green with swallow models that do not match any omz behaviour. The first real run on another shell/timing (typed-ahead, so omz shows a reminder and eats nothing) is untested. The probe, whose first key is "consumed", may in fact run intact. Nothing is wrong there, but "swallowed first key -> probe retyped" is then never the live path, and the test proves a phantom.
- **Evidence:** `~/.oh-my-zsh/tools/check_for_upgrade.sh:263` (`has_typed_input` -> reminder), `:178-190`, `:281`; plan.md prior-art row; phase-01 Step 3 and Step 4 titles; phase-04 Requirements bullet 1.
- **Suggested fix:** Add the typed-ahead branch to the omz facts. Make the fake shell print the prompt and take the key only when it arrives after the prompt, and also cover the typed-ahead case. Name in the test why each swallow model is realistic.

## Finding 6: the core claim (token readable via herdr pane read on a real pane) is gated only by an "optional" smoke
- **Severity:** High
- **Location:** plan.md Risks row 1 (M x H), phase-01 "Verify" last bullet ("Optional live smoke ... not a gate"), phase-01 Requirements (`recent-unwrapped`, `--lines 40`)
- **Flaw:** All correctness rests on `herdr pane read --source recent-unwrapped --lines 40` showing the printf OUTPUT of a pane whose shell is mid-startup. No test touches real herdr: MemDriver returns `"screen of {pane}"`, the herdr fake echoes canned text (`herdr_driver_fake.rs:105`), and the fake pane serves a file. The meaning of `--lines` under `recent-unwrapped`, redraw behaviour (zsh syntax highlighting, autosuggest, right prompt, `clear`/fastfetch/p10k instant prompt in rc that redraws or clears the screen), and herdr's snapshot lag are all unverified. The smoke is optional and unrecorded.
- **Failure scenario:** On a real herdr the token is never observed (or only after the echoed line is redrawn). Every launch idles 15 s then `NotStarted`, on every machine. The same fault also breaks the plan's rollback claim ("revert restores typing"), because the burned slots are already recorded.
- **Evidence:** `herdr pane read --help` (sources `visible|recent|recent-unwrapped|detection`; `--lines <N>` unspecified for unwrapped); `packages/terminal-control/rust/tests/common/mod.rs:183-185` (`read_screen` returns a constant); `herdr_driver_fake.rs:105`; `packages/terminal-control/rust/src/driver/herdr.rs:529-556`; phase-01 Verify.
- **Suggested fix:** Make a live smoke on a real pane (default zsh+omz+p10k, bash, fish) a recorded gate before phase 2 starts. Consider `herdr pane wait-output --match <token>` (it exists) as the primitive, avoiding a hand-rolled poll and the `--lines` ambiguity.

## Finding 7: the handshake retry cadence and nonce are not tested against a real clock or a reused pane
- **Severity:** Medium
- **Location:** phase-01 Requirements (retype after 1.5 s, poll 100 ms, nonce from `self.now()`); Test matrix row 1
- **Flaw:** `Core` deadlines use real `Instant::now()` while record times use the injectable `now_ms`. The plan's tests for retype (1.5 s) and never-ready (15 s) either sleep for real or need undeclared extra config and clock injection. The plan lists one config knob (`shell_ready_timeout_ms`) and no retry-interval or poll-interval knob. A poll at 10 Hz spawns a `herdr` process per poll. The nonce `self.now()` is epoch ms. A fixed-clock test, and a retained or re-used pane with scrollback, can see a stale identical token, so the "absent from the typed echo" proof degrades to "present from an earlier launch".
- **Failure scenario:** The suite gets slow (one test per case at 1.5 s+), or the test shortens only the total timeout and never reaches the retry. A second launch in a pane with an old token passes the handshake against a shell that has not started.
- **Evidence:** `packages/terminal-control/rust/src/core.rs:427` (`Instant::now()` deadline), `core.rs:56,83-90` (`now_ms` injectable only for record times); `packages/terminal-control/rust/src/route.rs:43,143` (only identify timeout knob exists); phase-01 Requirements.
- **Suggested fix:** Make retry and poll intervals config fields with test-sized values. Take the nonce from a process-unique counter plus pid and ms, not the clock alone.

## Finding 8: the quiet env is a half measure the plan scores as "update prompts off", and it leaks into every pane child
- **Severity:** Medium
- **Location:** plan.md Acceptance A, Design step 2, Open decision 2; phase-02
- **Flaw:** Acceptance A requires "panes fgOS creates start with the shell's update prompt off". The plan concedes the env is ignored when the user has a `zstyle ':omz:update' mode` (or an rc that sets/unsets it) and does nothing for non-omz prompts. So criterion A's second half can be satisfied by test and still not hold on the owner's own kind of machine. The env var is also inherited by every process in the pane, including the agent tree and sandbox. It is not scrubbed, and `DISABLE_AUTO_UPDATE` is not an fgOS-owned name. The owner is asked to accept the leak afterward instead of before the build.
- **Failure scenario:** The user has the zstyle mode `prompt`. The env is set, the prompt still appears, and the only defence is the handshake from Finding 3/4. The "update prompts off" criterion is marked done, yet the defect that triggered the item remains reachable.
- **Evidence:** `~/.oh-my-zsh/tools/check_for_upgrade.sh:15-19` (env read only when no zstyle); plan.md Prior-art "Verified omz facts" last rows and Rejected "Env only"; backlog `docs/backlog.md:63` ("start shells with their update prompts off").
- **Suggested fix:** Word criterion A honestly (best-effort env, handshake is the proof) or pair it with a verified second mechanism. Decide the scrub question (launcher.sh) before phase 2, since it changes the contract of what the agent environment contains.

## Finding 9: criterion B is met for one CLI only while the recorded incidents involve two
- **Severity:** Medium
- **Location:** plan.md Acceptance B and Open decision 3; phase-03 "CLIs with an empty list"
- **Flaw:** The backlog's first incident class also involved gemini/omp and a "Still starting after 10s" message, and the done criterion says "a delivery waits for the agent's input to be ready (start screen dismissed)". The plan implements a per-CLI data list with exactly one entry (agy), based on a banner whose live wording it has not captured (Finding 1). omp, pi, claude and codex keep today's unruled settle-then-type-anyway behaviour, where the brief is typed at whatever screen is up after `UNRULED_READY_MS`.
- **Failure scenario:** An omp run with a start notice still gets the pasted brief and exits. The plan calls it "done" because test C(2) covers agy only.
- **Evidence:** `docs/backlog.md:63` (omp case, "Still starting after 10s"); `packages/agent-protocol/rust/src/terminal/mod.rs:300-350` (unruled branch ends `Unverified` and types anyway); plan.md Open decision 3.
- **Suggested fix:** Either narrow acceptance B to "agents with a recorded banner" with the owner's agreement now, or add the omp capture to the plan's facts phase before building the data table.

Status: DONE
