# Secrets Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define where an fgOS secret lives, who may resolve it, and how it reaches the one process that needs it, so that it does not leak through git and a confined agent cannot read it by trying, within what is physically possible. Config loading is a separate, later component that depends on this one.
Design status: Draft proposal. Not signed. Open questions for the owner stand in section 15.
Implementation status: Not started
Canonical: No (becomes canonical when signed)

Owner: Secrets component (proposed)
Source (planned): language not decided (section 15 question 1); thin wiring for `fgos secrets` and a `fgos doctor` check
Last reviewed: 2026-10-19
Supersedes: nothing. It replaces the hand-made practice recorded in section 2.
Related:
- docs/specs/confinement-authority.md (hostRead, "secret, not blind" limit)
- docs/history/glm-openrouter-executor/plan.md (decision that the key lives in an untracked file)
- src/runner/dispatch/provider-capacity.mjs (credentialSource, per-run private home)
- src/runner/dispatch/provider-adapter.mjs, src/runner/dispatch/adapters.mjs (variable expansion)
- src/config/global-config.mjs (global and project config merge)
- src/setup/checks.mjs, src/setup/registrations.mjs (doctor checks, setup registrations)
- .claude/hooks/privacy-block.cjs, .claude/hooks/lib/privacy-checker.cjs
- docs/platform/component-boundary.md
- docs/platform/platform-foundations.md (L10)
- core/instructions/design-principles.md
- docs/platform/agent-mailbox/spec.md (format model)
```

## 1. Purpose and scope

fgOS runs agent CLIs on provider accounts. Some of them need a key. Today the key is a line in an untracked file, a shell hook exports it into every process of the interactive shell, three places hold a copy, and nothing checks any of this. The Secrets component owns one decision: **which secret exists, where its value comes from, who may resolve it, and how it reaches exactly one consumer.** It never decides what a secret is used for, and it never prints a value.

In scope:

- a registry of declared secrets (name, source, consumers, redaction);
- one resolver and one expansion function for `${VAR}` references, with a loud failure on a missing value;
- a `SecretSource` port and its first adapter, a plain file with mode 0600;
- a login-store writer port per agent CLI, so a key reaches the store a CLI reads without an argument or an environment variable;
- the verb `fgos secrets status` and a `fgos doctor` check;
- the trust rules for loading a secret into a process;
- the migration off the present hand-made practice.

Out of scope:

- encryption at rest (`pass`, `gpg`, `systemd-creds`): a later adapter behind the same port, listed only as an open item;
- designing the consolidation of the config loaders: recorded as direction in section 11, not designed here;
- any prompt for a password. Runs are non-interactive (shell, cron, detached processes). No adapter may ask a person for input, ever;
- a secret manager service, rotation, leasing of provider keys, or per-user access control;
- protecting a secret from a worker that must hold it to do its job (section 7.3).

## 2. Why this exists, and the corrected evidence

Evidence is split by class: read from source, read from a machine file by name only, or not tested.

| Fact | Class | Source |
|---|---|---|
| The shared OpenRouter key was decided to live in an untracked file `.fgos/secrets.local.env`, sourced before dispatch | decision | `docs/history/glm-openrouter-executor/plan.md` (item 4) |
| The file is covered by one `.gitignore` line and nothing else; `.githooks/pre-commit` has no secret scan | source | `.gitignore` line 46; no match for a secret scan in `.githooks/pre-commit` |
| An interactive zsh hook in `~/.zshrc` walks up from the working directory and exports every variable of the file into the shell. Every child process, including an agent's Bash tool, inherits it | machine file | `~/.zshrc`, block "fgos project secrets" |
| A key is hard-coded in the `glm2` function of `~/.zshrc` (value not reproduced here) | machine file | `~/.zshrc` |
| A copy of the key sits in `~/.pi/accounts/openrouter/auth.json`, mode 0600, created by hand as an interim measure; `auth.json` entries were added to `~/.fgos/config.json` and `.fgos/config.json` | machine file, names and mode only | `ls -l`, `grep -n auth.json` |
| Two functions expand `${VAR}` and replace a missing variable with an empty string, so a typo yields an empty key and a later opaque failure | source | `src/runner/dispatch/provider-adapter.mjs` line 189 (`resolveEnvPatch`), `src/runner/dispatch/adapters.mjs` line 147 (`resolveExecutorEnv`) |
| Three further functions expand `${HOME}` only | source | `src/setup/agy-permissions.mjs` line 153, `src/runner/dispatch/provider-credential-probe.mjs` line 34, `src/setup/registrations.mjs` line 4459 |
| The OpenRouter key variable left the committed pi invocation env because pi reads the key from its login store `auth.json`; a test pins it | source | `git show 4f6fc44d7`; `test/runner/provider-adapter.test.mjs` line 402 |
| The privacy hook patterns cover `.env`, `.env.*`, `credentials`, `secrets.yaml`, `*.pem`, `*.key`, `id_rsa`, `id_ed25519`. They do not match `secrets.local.env` or `auth.json` | source | `.claude/hooks/lib/privacy-checker.cjs` lines 43 to 52 |
| `herdr pane --env KEY=VALUE` puts a secret value in the argv of the `herdr` process for the length of one call; the owner accepted this risk | decision | `git show 76d8539d1` |

**Correction.** An earlier statement in this project's discussion said that the bwrap confinement hides `.fgos/secrets.local.env` from workers. That was wrong. `docs/specs/confinement-authority.md` lists the file under the open limits as "secret, not blind" (section 9.2 closing paragraph), and the built-in `host-write-denied` policy has `hostRead: allow`. Read from the policy and the spec, a confined worker can read the file today. **This was not tested live.** A live probe is delivery step X1.

**Constraint kept from the past.** The pi invocation must not carry the OpenRouter key variable in its env (`4f6fc44d7`, `8f7463036` and the test). This spec does not reverse it; the design in section 6 is how the store pi reads gets its key without that variable.

## 3. Vocabulary

| Term | Meaning |
|---|---|
| Secret | A named value that must not appear in git, argv, logs or events |
| Declaration | One registry entry: name, source, consumers, redaction (section 5.1) |
| Reference | The text `${NAME}` inside a config value. It stands for a secret or an environment variable |
| Source | Where a value is read from; behind the `SecretSource` port |
| Consumer | A named executor, invocation or provider that is allowed to receive a secret |
| Login store | The file a CLI reads its credential from, for example pi `auth.json` |
| Materialize | Write a secret into a login store inside the per-run private home at lease time |
| Private home | The per-run home a lease gives a confined invocation (`provider-capacity.mjs`) |
| Resolve | Turn a name into a value for one consumer, once, at the point of use |

## 4. Architecture

The component is hexagonal (design principle 3) and sits in a low layer (principle 2): it knows no config format, no runner, no CLI name in its core.

```txt
 callers (never hold a value longer than one call)
   dispatch / runner      config loading (later)      fgos secrets status | doctor
        \                        |                          /
         v                       v                         v
   +----------------------------------------------------------+
   |                          CORE                            |
   |  registry of declarations                                |
   |  resolver: env -> project file -> global file            |
   |  one expansion function (fail loud, never prints values) |
   |  redaction list for logs and events                      |
   |                                                          |
   |  ports:  SecretSource        LoginStoreWriter (per CLI)  |
   +----------------------------------------------------------+
                |                          |
                v                          v
        file 0600 (first)          pi auth.json (first)
        pass / gpg / systemd-creds codex-home, omp, agy (later)
        (later, open item)
```

Rules, checked by `test/architecture.test.mjs` against `docs/architecture-manifest.json` once code exists:

1. The core imports no adapter, no CLI name (`pi`, `codex`, `omp`, `agy`, `claude`) and no config file format.
2. One door (principle 1). The two `${VAR}` copies of section 2 collapse into the one expansion function in the same change that introduces it; both old paths are deleted (L10). The `${HOME}`-only copies move to it only if the owner extends the function to `~` and `$HOME` in section 15.
3. The core takes the environment and the file reader as parameters, so every rule is testable without a real file.
4. A port is added only with a real second implementation. `SecretSource` has one now and a named second (encryption, section 15) so it is a port by owner decision. `LoginStoreWriter` has one real adapter now (pi) and three that exist as CLIs and are measured at their step (section 12).

### 4.1 Layering relative to config loading

Credentials and config loading are two components. `secrets` is lower. Config loading will depend on it to resolve `${VAR}` references and must not carry a copy of the resolver. Today the loaders are scattered (global and project merge in `src/config/global-config.mjs`, per-area readers elsewhere). Consolidating them is a separate item. This spec records only the direction: one config loader above one secrets component, neither knowing the other's internals beyond the expansion function.

## 5. Core model

### 5.1 Declaration

A declaration names a secret without containing it. It is safe to commit.

| Field | Meaning |
|---|---|
| `name` | The reference name, for example `OPENROUTER_API_KEY` |
| `source` | Which `SecretSource` adapter holds it (first: `file`) |
| `consumers` | The executors or providers allowed to receive it. A resolve for any other consumer is refused |
| `redact` | Always true in this version. The name and a derived marker go to the redaction list; the value never goes anywhere |
| `loginStore` | Optional: the CLI whose login store receives it at lease time (section 6.2) |

Where declarations live is a configuration key (section 10). The registry holds no value.

### 5.2 Resolver order

For a reference `${NAME}` a caller resolves for a named consumer, in order:

1. the process environment of the resolving process, when `NAME` is set there;
2. the project secrets file, `.fgos/secrets.local.env` of the active project;
3. the global secrets file under the user's fgOS directory.

First hit wins. This matches "project always overwrites global" in `docs/distribution-vision.md` and `src/config/global-config.mjs`. The order is a decision to confirm (section 15 question 7) because step 1 lets an inherited variable override a file; that is wanted for cron and CI, and is why the interactive shell export of section 7.1 is removed.

### 5.3 Expansion

One function expands `${NAME}` inside a string.

- A reference that does not resolve is an error. The message names the variable and the files searched, and never a value. Silent replacement by an empty string is removed.
- A literal `${` in a value that is not a reference needs an escape; the form is chosen at implementation and recorded in the contract, not here.
- The function returns the expanded string and a list of the names it used, so a caller can register them with redaction and report them in `status`.

## 6. Ports

### 6.1 SecretSource

| Operation | Contract |
|---|---|
| `get(name)` | The value, or "absent". Never prompts. A source that cannot answer without a prompt reports "unavailable" and the resolver goes to the next source |
| `has(name)` | Presence only, for `status` |
| `describe()` | Where it looks, in words and paths, never a value |
| `check()` | The source's own health: for the file adapter, mode and owner |

The first adapter is a plain file of `NAME=value` lines. It requires mode 0600 and the owning user. A file that is group or world readable is reported by `check()` as a failure and is not read until fixed. The adapter never rewrites the file. A symlink is refused.

### 6.2 LoginStoreWriter, one adapter per CLI

A CLI reads its credential from a login store, not from an environment variable we want to avoid. The writer puts a secret there.

Contract for every writer: idempotent; the target file mode is 0600; no prompt; the value is written only into a path the caller names; the call returns a verdict that does not contain the value.

| CLI | Store | Status |
|---|---|---|
| pi | an `api_key` entry for the provider in `auth.json`; the entry is verified by `pi auth check --provider openrouter` | first adapter |
| codex | codex-home credential files | later adapter |
| omp | its login store | later adapter, measured when built |
| agy | its home files | later adapter, measured when built |

The existing `credentialSource` kinds `codex-home` and `home-files` (`src/runner/dispatch/provider-capacity.mjs`, `CREDENTIAL_SOURCE_KINDS`) describe an account whose login was made by a person and is copied into a private home. They are the same door as a writer, with a different origin for the credential: a person's login versus a declared secret. The writer reuses the lease's private-home provisioning and does not add a second way to place files in a home.

**Where the key lives after the change.** The materialization happens at lease time into the per-run private home. The persistent account directory (`~/.pi/accounts/openrouter/`) then holds no key. The hand-made `auth.json` of section 2 is the interim copy and is deleted at migration (section 11).

## 7. Trust and safety

### 7.1 Rules

1. **No export into the interactive shell.** The shell hook of section 2 is removed. A secret is never placed in the environment of a shell a person or an agent works in. That is what makes the agent's Bash tool unable to read it from `env`.
2. **Load into the dispatch process only.** Dispatch resolves a secret in its own process and injects it into the one confined worker that is a declared consumer, for its own provider only.
3. **Never in argv.** A value passes through an environment variable of the child, a login store inside the private home, or a file descriptor, never a command-line argument. `herdr pane --env` is the known exception, accepted in `76d8539d1`; whether it still applies is open (section 15 question 8).
4. **Redaction.** The names in the registry, and the marker derived from each resolved value, are masked in logs, events, receipts and error text. Redaction is a safety net, not the control.
5. **Fail loud, never print.** An unresolved reference stops the run before launch with the variable name and the files searched.
6. **No prompt.** A source that needs a person to type something is unavailable, not blocking.
7. **No value in git.** Declarations are committed; values are not. A secret scan in `.githooks/pre-commit` is a delivery step (section 12) and a doctor check, because today one `.gitignore` line is the only guard.

### 7.2 Threat model

| Threat | Handled by | Residual |
|---|---|---|
| Value committed to git | rule 7, scan at commit, `.gitignore` | a value pasted into a tracked file in a form the scan misses |
| Agent in an interactive, unconfined session reads the file or the environment | rule 1; deny rules and privacy patterns (section 15 question 4) | an unconfined agent runs as the user and can read any file the user can; this is physically not preventable by this component |
| Confined worker reads a secret file it does not need | `hostRead: blind` extended to secret paths (section 15 question 4); materialization into the private home so the persistent paths hold no key | until the extension exists, a confined worker can read `.fgos/secrets.local.env` (section 2, not tested live) |
| Process list or herdr internals show a value | rule 3 | accepted exception, section 7.1 |
| Log or event shows a value | rule 4 | a transformed value (base64) escapes a marker match |

### 7.3 The limit that cannot be closed

A worker must hold the key it uses. A worker that deliberately reads its own key cannot be prevented, only limited. The limit is a dedicated, spend-capped, revocable key per provider, so a leak costs a bounded amount and is one revocation away from over. Whether the owner creates and rotates these keys is open (section 15 question 3). This component can name the consumers a key is for; it cannot make a key harmless.

### 7.4 The privacy hook

`.claude/hooks/privacy-block.cjs` and its patterns are a guard for Claude Code reads and shell commands in a session where the hook is installed. Its patterns do not cover `secrets.local.env` or `auth.json` (section 2). Extending them is cheap and is a safety net; it is not a boundary, because a prompt-approved bypass exists by design (the `APPROVED:` prefix in the hook header) and a worker outside Claude Code does not run it.

## 8. Verbs

| Verb | Purpose |
|---|---|
| `fgos secrets status` | For each declared secret, in words: which source it resolves from (env, project file, global file, or unresolved), which consumers need it, and whether its login-store target is set up. Never a value, never a length, never a prefix |
| `fgos doctor` check | Fails on: a source file readable beyond its owner, a declared secret that resolves from no source, a login store holding a key outside a private home, an export of a declared name into the interactive shell profile, a missing commit scan. The check registers in `src/setup/checks.mjs` |

No verb prints, copies or edits a value. Writing a secret into a source is done by the person with an editor in this version; a `set` verb needs a no-echo input path and is not part of this slice.

## 9. Relation to other components

| Component | Relation |
|---|---|
| Config loading (later) | Depends on the expansion function for `${VAR}`. Must not copy it (section 4.1) |
| Provider capacity (`provider-capacity.mjs`) | The lease already creates the per-run private home and copies a person's login into it. The writer of section 6.2 runs at the same point |
| Confinement (`docs/specs/confinement-authority.md`) | Owns what a worker can read. This component asks for secret paths to be hidden from it (section 15 question 4); it does not implement hiding |
| Hook installer and doctor (`src/setup/*`) | Own installation of any hook and the registry of checks. This component adds one check and one setup registration, no new mechanism |
| Privacy hook | A safety net over secret-looking names (section 7.4) |
| Dispatch | The only process that resolves a secret for a worker (rule 2) |

## 10. Configuration

Each key registers into `fgos setup` config-merge and `src/setup/registrations.mjs`, and each check into `src/setup/checks.mjs`, per the install gate in `AGENTS.md`. The project file wins over the global one. A `CHANGELOG.md` `[Unreleased]` line lands with the first user-visible verb.

| Key | Default | Meaning |
|---|---|---|
| `secrets.declarations` | none | the declarations of section 5.1 (names only, committable) |
| `secrets.projectFile` | `.fgos/secrets.local.env` | the project source file |
| `secrets.globalFile` | a file under the user's fgOS directory, path fixed at implementation | the global source file |
| `secrets.sources` | `["file"]` | the enabled `SecretSource` adapters, in order |

The directory and the 0600 expectation are the new files and permissions that the install gate requires to be registered in `fgos doctor`.

## 11. Migration

Each step is a change on the owner's machine or in the repository. None of them is done by this spec.

1. Remove the zsh hook that exports the project secrets file from `~/.zshrc`.
2. Move the key out of the `glm2` function in `~/.zshrc`. The function takes the value from the component's resolver, not from a literal.
3. Delete the interim `~/.pi/accounts/openrouter/auth.json` once the writer materializes it at lease time. Remove the `auth.json` entries added to `~/.fgos/config.json` and `.fgos/config.json` for that interim, after checking which of the existing `auth.json` entries are person-made logins that must stay (`.fgos/config.json` lines 818, 944, 1135, 1168; `~/.fgos/config.json` line 288).
4. Rename the shared variable to one name. Candidate `OPENROUTER_API_KEY`; today `GLM_OPENROUTER_API_KEY`. This is a decision to confirm (section 15 question 5). Rename the file entry, the test reference in `test/runner/provider-adapter.test.mjs`, and the config references in one change.
5. Rotate the key that sits as a literal in `~/.zshrc`. A value that has lived in a shell profile and in a transcript is treated as exposed.
6. Replace the two `${VAR}` functions with the one expansion function and delete both.

Direction only, not designed: the scattered config loaders move under one loader above this component (section 4.1).

## 12. Delivery steps and proof gates

| Step | Content | Proof gate |
|---|---|---|
| G0 | The owner signs this draft and answers the questions that block code: language (question 1), variable name (question 5), resolver order (question 7) | decisions recorded; `AGENTS.md` says a new area gets a spec before code |
| X1 | Probe, no code: from a confined worker, try to read the project secrets file and the environment; run with and without the shell export | a report states the observed result; section 2 is corrected if it differs |
| S1 | Core: registry, resolver, the one expansion function with fail-loud; delete both old copies; ordinary tests for order and for the missing variable | tests green; `rg` finds one `${VAR}` expansion for secrets |
| S2 | `SecretSource` and the file adapter with the permission check; `fgos secrets status`; doctor check | status prints no value in any case (a test greps its output for the value); doctor fails on a 0644 file |
| S3 | The pi `LoginStoreWriter`, materialized at lease time into the private home; the account directory holds no key | `pi auth check --provider openrouter` passes inside the private home, and the persistent account directory has no `api_key`; the existing pinned test still passes |
| S4 | The commit scan in `.githooks/pre-commit`; privacy pattern extension; removal of the shell export (migration 1 to 6) | a staged file with a fake key is refused; `fgos doctor` reports clean on the migrated machine |
| S5 | Later writers (codex, omp, agy), each measured on a real CLI first | each passes a live check on the owner's machine |

Nothing here changes a locked law of `docs/platform/platform-foundations.md`.

## 13. Failure modes

| Failure | Cause | Rule that prevents or reports it |
|---|---|---|
| Empty key reaches a provider and the run fails opaquely | a typo in `${NAME}`; old expansion returned an empty string | section 5.3: unresolved reference stops the run, naming variable and files |
| A key is readable by other local users | source file mode wider than 0600 | `check()` refuses to read; doctor fails |
| A key is in every shell child | the shell export | rule 1; doctor check on the profile |
| Two copies drift (file and login store) | a hand-made copy | section 6.2: one declared source, store written at lease time |
| A worker reads a key it does not own | `hostRead: allow`, not tested live | X1 probe; section 15 question 4; section 7.3 limit |
| A value lands in a log | a tool echoes its environment | rule 4 redaction; residual stated in section 7.2 |
| A source needs a password and the run is detached | encrypted source added later | rule 6: unavailable, resolver continues, the run fails loud if no source answers |
| A login store writer leaves a partial file | crash during write | atomic write to a temp file in the same directory, then rename; mode 0600 from creation |

## 14. Conformance tests

An adapter passes these before it is enabled; the core passes the first four with no real file.

1. Resolver order: env, then project file, then global file; first hit wins.
2. A missing reference fails and the message contains the variable name and the searched files, and no value.
3. `status` output, error text and event text contain no secret value, no length and no prefix.
4. A consumer not listed in a declaration is refused.
5. File adapter: mode wider than 0600, wrong owner, and a symlink each fail `check()` and the file is not read.
6. Login store writer: second call is a no-op; resulting mode is 0600; the value is absent from the returned verdict; the CLI's own check (for pi, `pi auth check --provider openrouter`) passes.
7. No adapter prompts: run each with stdin closed and a time limit.

## 15. Open questions for the owner

1. **Language.** Answered 2026-10-20: Rust. What stays open is the bridge from the Node callers (dispatch, config loading, the lease code): a host verb or a Node addon like the event store. The first slice report recommends a host verb; this is decided when the Node cutover starts.
2. **Encryption adapter.** `pass`, `gpg` or `systemd-creds` behind the `SecretSource` port, with a non-interactive unlock for cron. Which, and when? The port is built so the file adapter can be replaced without a caller change.
3. **Per-provider spend-capped keys.** Does the owner create a dedicated, capped, revocable key per provider and accept rotating them? Without it, section 7.3 gives no bound.
4. **Agent read protection for unconfined interactive sessions.** Options: deny rules for the secret paths in the agent CLI's own settings, extending the privacy patterns of section 7.4 to `secrets.local.env` and `auth.json`, and extending confinement `hostRead: blind` to secret paths. The first two are safety nets only; the third needs the confinement owner. Which of them, and in what order?
5. **One name for the shared key.** Answered 2026-10-20: `OPENROUTER_API_KEY`.
6. **Scope of the expansion function.** Does it also take over the three `${HOME}`-only expansions of section 2, or stay for secrets and environment references only?
7. **Resolver order.** Answered 2026-10-20: environment, then project file, then global file.
8. **herdr argv.** `76d8539d1` recorded the accepted risk; the comment is no longer in `src/runner/dispatch/transport.mjs` and a search for `--env` there finds nothing. Does the risk still apply, and where?

## 16. Decision history

| Date | Decision | By | Status |
|---|---|---|---|
| 2026-10-19 | Build a `SecretSource` port first; first adapter is a file with mode 0600; encryption is a later adapter behind the same port | owner | accepted |
| 2026-10-19 | Threat model: a secret must not leak through git, and an agent must not read it by deliberately trying, within what is physically possible | owner | accepted |
| 2026-10-19 | Credentials and config loading are separate components; `secrets` is lower; config loading depends on it; consolidating the loaders is a separate item | owner | accepted in direction |
| 2026-10-19 | Runs are non-interactive; no prompt for a password | owner | accepted |
| 2026-10-19 | One name for the shared OpenRouter key is wanted | owner | accepted; the name is decided on 2026-10-20 (next row) |
| 2026-10-20 | The shared key is named `OPENROUTER_API_KEY` (question 5, answered) | owner | accepted; the rename is migration step 4 |
| 2026-10-20 | Resolver order is environment, then project file, then global file (question 7, answered) | owner | accepted |
| 2026-10-20 | The core and verbs are Rust (question 1, answered); the Node bridge is a later step, and the first slice only reports the options | owner | accepted; first slice landed on main as the crate `fgos-secrets` |
| 2026-10-20 | Run the read probe of step X1 from a confined worker | owner | accepted; run the same day, result in section 17 |
| 2026-10-20 | Interim rename on this machine (host `fg-server2`): the entry in `.fgos/secrets.local.env` is now `OPENROUTER_API_KEY` with the same value (checked by comparing hashes of the value, never printed). The key itself is not rotated. Tests, docs and the changelog still carry the old name; migration step 4 is otherwise open | owner | done on this machine only; other machines keep their own file |
| 2026-10-20 | Key rotation, the literal key in the `glm2` function and per-provider spend-capped keys are the owner's own later work. For now the bar is that the configuration works; the component and its agents do not track or remind about them (section 15 question 3 stays recorded, not pursued) | owner | accepted |
| 2026-10-20 | The secrets auto-load hook was removed from `~/.zshrc` and `~/.bashrc` on this machine (host `fg-server2`) (migration step 1). Checked before: no runtime code reads the variable, no other project has a secrets file, the pi login store holds the key. Checked after, from a fresh interactive zsh and bash with the old variables removed from the inherited environment: none of the three key variables is set, and `fgos dispatch probe-account` for `deepseek` and `z-ai` is healthy. The removed blocks are kept in `~/.fgos/removed-secrets-hook-261020.txt` for restore | owner | done on this machine; other machines follow the guide |
| 2026-10-17 to 2026-10-19 | The OpenRouter key variable leaves the pi invocation env; the key is read from the login store | maintainer | landed in `4f6fc44d7`; kept by this spec |
| 2026-08-25 | Secret values in `herdr pane --env` argv are an accepted risk | owner | recorded in `76d8539d1`; reopened as question 8 |

## 17. Evidence and limits

- Read: the source files and commits named in section 2; the names and modes of the machine files; the privacy patterns.
- Tested on 2026-10-20 (step X1, one confined `claude` worker under bwrap, read-only, `test -r` and a presence check of variable names; no content or value was read): the worker CAN read `.fgos/secrets.local.env`, `~/.pi/accounts/openrouter/auth.json` and `~/.zshrc`, and `GLM_OPENROUTER_API_KEY` was SET in the worker's environment while `OPENROUTER_API_KEY` and `DEEPSEEK_API_KEY` were not. The variable reached the worker because the parent process carried it; the zsh hook export (section 7.1 rule 1) is the likely source. This confirms both the open `hostRead` limit and the shell-export leak. Scope of the evidence: one worker, one run; the `pi` workers' environment is a whitelist (checked in a prepared invocation) and was not probed this way.
- Not tested: whether `pi auth check --provider openrouter` accepts an entry materialized into a per-run private home; whether the lease point allows a writer step without a change to the lease code.
- Correction recorded: the earlier claim that bwrap hides the file from workers was wrong (section 2).
- The brief for this spec spoke of three copies of `${VAR}` expansion. Two copies expand environment variables and blank a missing one; three more expand `${HOME}` only. The table in section 2 states what was found.
- The names in a machine file were read; no secret value is reproduced in this document.
- Not covered: Windows and macOS file permission semantics; cross-machine distribution of secrets; backup of the secrets file.
