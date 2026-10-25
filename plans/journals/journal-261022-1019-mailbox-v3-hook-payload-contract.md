# Journal: Mailbox V3 hook payload contract, 2026-10-22

## What happened

- V3 was built on `mailbox/v1-v3` in seven phases plus a Codex recording. Claude Code and Codex are drained against payloads recorded from the real CLIs. agy is deferred.
- The first Codex run failed at login: the `tetnu` refresh token had already been used. No login was attempted. The owner later logged the account in again, and three runs recorded Codex 0.161.0.
- agy 1.4.4 refused both `additionalContext` shapes that 1.4.2 had accepted three days earlier. A subagent in agy is a separate conversation with no marker, and it fires its own Stop. Under the one-binding-per-head rule, such a subagent would take the head's binding, so the plan owner deferred the agy drain.

## Lessons

- **Proof of injection.** A canary string in a transcript is not proof; only the record type is. For Claude, a raw `hook_success` record holds the canary even when nothing was injected. For agy, the refusal shows only in its log file and never on screen.
- **Recorder tooling.**
  - `printenv A B C` loses the variable names, so use `env | grep`.
  - agy reads the word right after `-p` as the prompt.
  - Hook calls need one sequence across all events, or their order is lost.
- **Codex login guard.** A live account may refresh its tokens during a run. What matters is that the run home's `auth.json` stays a symlink to the real file, never a copy. Comparing the file's bytes was the wrong guard.
- **Codex writer key.** Codex's hook process sees no session id; only its tool processes see `CODEX_THREAD_ID`. The V5 entry must therefore take the Codex writer key from the payload.
- **Repository guards.** The assignment-tree listing guard flagged an ordinary `readdirSync` in the recorder. The redaction guard's first draft read a CLI home under the run directory as a user's home, and a path of short segments as one base64 run. Both drafts were refined, and planted secrets are still caught.
- **Repeated literals.** Fixture file names repeated across four test files became one module; the change was cheap at this size.
