---
phase: 2
title: "Record the real payloads and the accepted outputs"
status: pending
priority: P2
effort: "6h"
dependencies: [1]
---

# Phase 2: Record the real payloads and the accepted outputs

## Goal

Commit redacted fixtures of the `Stop` and `PostToolUse` hook payloads, recorded on this machine from the three CLIs:

- Claude Code 2.1.306;
- Codex 0.161.0;
- agy 1.4.4.

Check the versions again at run time, use what is installed, and say so in the fixtures.

Also record the output shape each CLI was shown to **inject**. Each CLI's fixtures must be reproducible by one recorded command per mode. No fixture is synthesized and then labelled as recorded.

## Where and how the runs happen (isolation)

- **Raw directory, outside every git checkout.** Use `${TMPDIR:-/tmp}/fgos-work/mailbox-v3-record/<cli>/<mode>/`, the scratch fallback named in AGENTS.md.
  - Reason: a full-bypass agent must not be able to write the shared branch.
  - Reason: the repository's `.claude/settings.json` and `.agents/hooks.json` must not load.
  - Only the redacted fixtures enter the repository.
- **Clean id environment.** The recorder launches each CLI with `env -u FGOS_SESSION_ID -u CODEX_THREAD_ID -u CLAUDE_CODE_SESSION_ID -u CLAUDECODE`.
  - It refuses to start if any of these is still set in the child's environment.
  - It writes into `source` which parent variables were removed: names only.
  - So a recorded id variable is one the CLI itself set (red-team: the recording agent's own session id leaked into every child).
- **Claude:** run `command claude -p --model haiku --dangerously-skip-permissions --setting-sources "" --settings <runDir>/settings.json "<prompt>"`.
  - If the installed version refuses an empty `--setting-sources` (check `--help`; it lists `user, project, local`), use the narrowest list it accepts.
  - Record which user hooks still fired, for example the owner's `SessionStart` herdr hook.
- **Codex:**
  - Isolated `CODEX_HOME=<runDir>/home` containing:
    - `auth.json` as a **symlink** to `${CODEX_ACCOUNTS[tetnu]}/auth.json`. Read the account home with `zsh -ic 'print -r -- ${CODEX_ACCOUNTS[tetnu]}'`, never through `_codex_current_account`, which follows whichever account is active.
    - `config.toml` with `[features]\nhooks = true` and `[projects."<runDir>/ws"]\ntrust_level = "trusted"`.
    - `hooks.json` shaped like the existing `~/.codex/hooks.json`: `{"hooks":{"PostToolUse":[{"hooks":[{"type":"command","command":…}]}],"Stop":[…]}}`.
  - Run `CODEX_HOME=<runDir>/home command codex exec --dangerously-bypass-hook-trust --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check -C <runDir>/ws "<prompt>"`.
  - **After every Codex run, check `test -L <runDir>/home/auth.json` and that it still points at the account file.** If it is no longer a link:
    1. stop;
    2. delete the plain file;
    3. tell the controller that the owner's `tetnu` Codex login may need a fresh `codex login`.
  - Never copy `auth.json`, and never touch `~/.codex*`.
- **agy:**
  - Hooks go in `<runDir>/ws/.agents/hooks.json`, with a flat `"Stop":[{"type":"command","command":…}]` and a nested `"PostToolUse":[{"matcher":"*","hooks":[{"type":"command","command":…}]}]` (spec §7; probe of 2026-10-19).
  - Run `HOME=${AGY_ACCOUNTS[tetnu]} command agy -p --dangerously-skip-permissions "<prompt>"` with cwd `<runDir>/ws`.
  - Because the workspace is outside the repository, no repository hooks load. Record the hook count from agy's log line "loaded N named hooks from M hooks.json file(s)".
- **Flag changes:** if the installed version rejects any flag above, read that CLI's `--help`, adapt, and record the exact command used.

## What is recorded per CLI (three one-shot runs, print mode)

| Run | Hook behaviour | Prompt (exact text goes in the script) | What it yields |
|---|---|---|---|
| `dump` | Every hook call dumps stdin and prints nothing | "Run the shell command `printenv CODEX_THREAD_ID CLAUDE_CODE_SESSION_ID FGOS_SESSION_ID > tool-env.txt; echo mailbox-fixture` once, then answer `done`." | <ul><li>`PostToolUse` payload (a Bash tool) and `Stop` payload</li><li>the id variables the hook process received</li><li>those the tool process received (`tool-env.txt`)</li><li>the hook process's PID namespace (`readlink /proc/self/ns/pid`) against the recorder's own</li><li>the transcript record types this CLI writes for hooks</li></ul> |
| `accept` | The first `PostToolUse` returns the candidate context shape carrying canary `MBX-CTX-<random>`. The first `Stop` returns the candidate block shape carrying `MBX-STOP-<random>`. Later calls only dump | same as `dump` | <ul><li>whether each canary was **injected** (rule below)</li><li>the second `Stop` payload (Claude/Codex `stop_hook_active: true`, agy `executionNum: 1`): the "continued" and "first Stop" markers that decision 8 reads</li></ul> |
| `subagent` | Dump only, for **every** event, including `SubagentStop` if the CLI has it | "Use a subagent (your Task/Agent tool or the CLI's equivalent) to run `printenv CODEX_THREAD_ID CLAUDE_CODE_SESSION_ID > sub-env.txt; echo mailbox-subagent`, then answer `done`." | <ul><li>a subordinate `PostToolUse` payload and its marker</li><li>whether the subagent fired a `Stop` of its own</li><li>the subagent's tool env</li><li>or evidence that the CLI has no subagent tool, or that one could not be triggered</li></ul> |

The candidate shapes are tried in the order below until one is accepted. Record every attempt, accepted or not.

- **Context at `PostToolUse`:**
  - Claude and Codex: `{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"<text>"}}`.
  - agy: `{"additionalContext":"<text>"}` (measured 2026-10-19, spec §7).
  - Fallback for a CLI that rejects its first shape: the other of the two.
- **Block at `Stop`:** `{"decision":"block","reason":"<text>"}` for all three (measured 2026-10-19).

**Injection rule.** The bare canary string is not proof, because Claude logs every hook's raw stdout as a `hook_success` attachment. A shape counts as accepted only when one of these holds:

- **Claude `PostToolUse`:** the canary is inside an attachment whose type is `hook_additional_context`.
- **Any `Stop`:** a second `Stop` call arrived with the "continued" marker, and the CLI's transcript has a model turn after the block that contains the canary's request (the prompt asks the model to repeat the token).
- **Codex and agy `PostToolUse`:** the canary is inside the record type that the `dump` run shows the CLI uses for injected hook context, not one that logs raw hook output.
  - Read the transcript structure from the `dump` run first, and name both types in `vectors.json` `source`.
  - If no such distinction can be made for a CLI, stop and report to the controller (the shape cannot be proven).

Where to look:

- Claude: `~/.claude/projects/<cwd-slug>/<session>.jsonl`.
- Codex: the rollout at the payload's `transcript_path`.
- agy: `brain/<id>/.system_generated/logs/transcript.jsonl` under its `HOME`.

The recorder stores `{accepted: bool, matchedType, rejectedTypes}`. The raw run evidence stays in the raw directory; only the accepted value goes into `accepted-<event>.json`.

## Files

- **Create `scripts/record-mailbox-hook-fixtures.mjs`.**
  - Its location follows the repository's precedent for fixture generators, `scripts/regenerate-observe-fixtures.mjs`.
  - It uses Node built-ins only.
  - Its header comment is its manual: purpose, every subcommand, the exact commands above, what it leaves behind and how to clean up.
  - `scripts/git-one-door-scan.mjs` scans `.mjs` files, so regenerate the census in the same commit.
  - Subcommands:
    - `hook <cli> <event> <runDir>`: the hook command each CLI is configured with.
      - Reads stdin in full and writes `<runDir>/calls/<n>-<event>.json` (stdin as received).
      - Writes the values of the three `ENV_ORDER` variables to `<runDir>/calls/<n>-<event>.ids.json` (raw directory only).
      - Writes its PID namespace link next to them.
      - In `accept` mode, prints the candidate output once per event (a marker file in `<runDir>` records that it did).
      - Always exits 0.
    - `run <cli> <mode>`: sets up the isolated configuration described above, runs the CLI once under `timeout 300`, and checks the version before and after (both are written to `<runDir>/versions.json`).
      - Prints the CLI's exit status and the paths it wrote.
      - For Codex, it then checks the `auth.json` link.
    - `check <cli> accept`: applies the injection rule and writes `<runDir>/accepted.json`.
    - `redact <cli>`: turns the raw calls into the committed fixtures, following the rules below.
      - Refuses if the before and after versions of any run differ, or if the three runs used different versions.
      - Prints, for human review, every key whose string value it replaced only because the key was not on the safe list.
    - `clean <cli>`: deletes `<runDir>` (Codex homes, rollouts and the raw calls) once `redact` and the guard test are green.
- **Create the fixtures in `packages/mailbox/contracts/fixtures/hooks/<cli>/`:**
  - Payloads: `stop.json`, `stop-continued.json`, `post-tool-use.json`, and `post-tool-use-subagent.json` (only if recorded).
  - Accepted outputs: `accepted-stop.json` and `accepted-post-tool-use.json`. Each is the exact accepted output, with the canary text replaced by the placeholder `{{TEXT}}`.
  - `vectors.json`, in the precedent shape `{ "cli", "source", "vectors" }`. `source` is a single text that names:
    - the version and the date;
    - the exact command of each run;
    - the variables removed from the parent environment;
    - the injection record type matched and the types rejected;
    - the hook PID namespace (same as or different from the recorder's);
    - which user hooks fired;
    - what was deferred and why (for example "post-tool-use-subagent: Codex 0.161.0 offered no subagent tool in exec mode");
    - the redaction rules version.

    `vectors` starts as an empty list; phases 5 and 6 fill it. The environment evidence goes into the vectors those phases read: phase 6's key-derivation vectors carry `hookIdVars` and `toolIdVars` as placeholders.
- **Create `packages/mailbox/contracts/adapters.v1.json`:** `{ "contract": { "id": "mailbox-adapters", "version": 1 }, "testedAgainst": [ { "cli": "claude", "version": "2.1.306" }, … ] }`, using the versions actually recorded. This is the spec §4.1 shape `{cli, version}`, spelled in camelCase.
- **Create `packages/mailbox/rust/store/tests/fixtures_contract.rs`.**

## Redaction rules (version 1)

These rules work by allowlist (red-team: a denylist let unknown keys through unchanged). The recorder applies them; the guard test checks the result independently.

- **Structure is kept.** Every key and every non-string value (numbers, booleans, null) stays as it is.
- **String values are replaced**, with one of the placeholders below, unless the value is on that CLI's safe list.
- **The safe list holds:**
  - event names (`hook_event_name` values);
  - tool names;
  - the `permission_mode` and `effort` words;
  - the known prompt texts (`done`, `mailbox-fixture`, `mailbox-subagent`, the `printenv` command);
  - the canary placeholder;
  - path placeholders.
- **Ids.** Session, thread, conversation, prompt, tool-use, turn and agent ids, and any UUID-shaped or ≥ 16-character hex value, become `00000000-0000-4000-8000-0000000000NN`. Within one CLI the mapping is stable and one-to-one: the same real value always gets the same placeholder, so equality between values is preserved.
- **Paths**, replaced longest first: the run directory → `/run-dir`, then the repository path → `/repo`, then the home directory → `/home/user`. The same applies to the **slug form** of each path (`/` → `-`, as in `-home-<name>-projects-…`), which becomes `-run-dir`, `-repo` and `-home-user`. Account names (`tetnu` and the other `CODEX_ACCOUNTS`/`AGY_ACCOUNTS` keys) become `account`.
- **Other strings** become `"<redacted>"`.

## Tests first (file `tests/fixtures_contract.rs`)

| Test | Behaviour | Why no existing test owns it |
|---|---|---|
| `fixtures_hold_no_secret_or_personal_value` | Every file under `contracts/fixtures/hooks/` parses as JSON and contains none of: <ul><li>the OS user name (`USER`/`LOGNAME` read at test time) in any form, including the slug `-home-<name>-`</li><li>any account name from the list in the test's doc comment</li><li>`/home/<x>/` other than `/home/user`</li><li>a UUID outside the placeholder family</li><li>any of `sk-`, `sk-ant-`, `ghp_`, `gho_`, `ghs_`, `ghu_`, `github_pat_`, `xox[bp]-`, `AKIA`, `ya29.`, `1//0`, `-----BEGIN`, or a JWT prefix `eyJ…\.`</li><li>a base64 or hex run of 32 or more characters that is not a placeholder</li><li>an e-mail address</li></ul> | Redaction guard, independent of the recorder's code |
| `every_tested_cli_has_its_fixtures` | Every `testedAgainst` CLI has the fixture directory, `stop.json`, `post-tool-use.json` and both `accepted-*.json`, and its `vectors.json` `source` names that same version | The version has one owner (decision 11); this test checks the fixtures exist, it does not copy the version |
| `every_cli_of_the_first_slice_is_tested` | `claude`, `codex` and `agy` each appear in `testedAgainst` | No silent gap |

Write the tests before recording. They fail at first (there are no fixtures yet) and go green only from real recordings.

## Steps

1. **Sync** (plan.md). Run `command claude --version; command codex --version; command agy --version` and note the versions.
2. **Write `tests/fixtures_contract.rs`** (red).
3. **Write the recorder.** Dry-check `hook` on its own: `printf '{"a":1}' | node scripts/record-mailbox-hook-fixtures.mjs hook claude stop <tmp>` must write the files and exit 0.
4. **Record**, per CLI in the order Claude, Codex, agy: `run dump`, then `run accept`, then `check accept`, then `run subagent`.
   - Each run is a long command; run it so that its exit is observable (plan.md).
   - Do one run per mode. Repeat a run only if it failed for an environmental reason (expired auth, rate limit), and record the repeat.
5. **If an `accept` canary was not injected,** try the fallback candidate once and record both attempts. If neither is accepted, stop and report the evidence to the controller: that CLI's adapter cannot be built as specified.
6. **If the hook's PID namespace differs from the recorder's** for a CLI, stop and report it. The head would be judged `Unknown` from inside the hook (plan risk).
7. **Subagent evidence:**
   - If the `subagent` run shows an unmarked subordinate event, or a subagent `Stop`, or no subagent could be triggered, apply owner question Q1's provisional default and record it in `source`.
   - If the CLI has no subagent tool, record that as the reason.
8. **Redact and review:** run `redact <cli>` for each CLI. Read every fixture by eye once, together with the list of replaced unknown keys printed by `redact`. Then run `cargo test -p fgos-mailbox --test fixtures_contract`; it must be green.
9. **Clean up and inventory:** run `clean <cli>` for each CLI. List in the commit message body what the CLIs left outside the raw directory:
   - Claude project transcripts under `~/.claude/projects/<slug>`;
   - agy conversations under `${AGY_ACCOUNTS[tetnu]}/.gemini/antigravity-cli/`.

   Delete nothing the CLIs own.
10. **Commit:** regenerate the census, then commit `test(mailbox): record Claude Code, Codex and agy hook payloads as fixtures`. Sync at the end of the phase, run the proof, push.

## Acceptance criteria

- Fixtures exist for all three CLIs and both events, recorded on the installed versions with no version change during a run. Each `source` names the versions, date, commands, removed variables and the injection record types; `adapters.v1.json` lists the same versions.
- `cargo test --locked -p fgos-mailbox` is green.
- Every deferred fixture has a stated reason. Nothing synthesized is presented as recorded.
- Codex's `auth.json` link was intact after every run. The raw directory is deleted.
- A stranger can re-record with `node scripts/record-mailbox-hook-fixtures.mjs run <cli> <mode>`, using the header comment alone.

## Risks

- **Split versions.** A CLI update between runs would split one CLI's fixtures across versions. The before-and-after version check refuses that case; then record that CLI again in one sitting.
- **Account rate limits.** The runs are tiny; if a 429 appears, space them out.
- **Model compliance.** The model may not repeat the canary token in a `Stop` continuation. The `Stop` rule also accepts the second `Stop` call with the continued marker as proof that the CLI continued. Record which evidence held.
