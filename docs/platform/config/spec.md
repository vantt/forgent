# Config Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the single authority for fgOS configuration: which files, which schema, which value wins, who may write, and the comments every writer must leave
Design status: Draft. Directions accepted by the owner on 2026-10-22 (Node door, comment scope, Seat Binding §5.1 representation); not yet signed as a whole
Implementation status: Not started
Canonical: No (becomes canonical when signed)
Owner: Config component (proposed)
Source (planned): packages/config/rust (crate fgos-config); schema descriptors core/config-schema/
Contracts (planned): packages/config/contracts/
Last reviewed: 2026-10-22
Related:
- docs/platform/yaml-document/spec.md (the leaf below: parse, edit, merge primitive)
- docs/platform/secrets/spec.md (lower component; Config holds references, Secrets resolves them)
- docs/platform/holder-lock/spec.md (locks for the write transaction)
- docs/specs/seat-binding.md §5.1 (ladder comment, representation superseded by section 7 here)
- docs/specs/distribution.md, docs/distribution-vision.md (setup and doctor, project over global)
- docs/platform/component-boundary.md
- plans/reports/research-261021-2221-config-access-inventory.md
- plans/reports/spike-261022-0017-yaml-config-gate-evidence.md
- architecture panel run wf-run-1792598883803-72bd2251
```

## 1. Purpose

Config answers, for every fgOS component and every project using fgOS: what is the effective value of this setting, where did it come from, what does it mean, and how may it change. It applies a schema, supplied as data by each setting's owner, on top of the YAML Document component.

Two owner requirements shape it:

- **Comments are documentation and are mandatory.** A stranger, human or agent, opens the file and understands what each key does, which values it takes and why it holds the value it holds. Every writer leaves those comments, including `fgos setup`, `fgos doctor --fix` and an agent setting a value (owner, 2026-10-21).
- **JavaScript does not implement this layer.** Parsing, merging, precedence, schema checks and writes live in Rust; Node calls them through the native door (owner, 2026-10-21 and 2026-10-22).

## 2. Ownership boundary

| Owns | Does not own |
|---|---|
| Which files are config, their scope and precedence (section 3) | YAML syntax, byte-preserving edits, comment injection guard (YAML Document) |
| The schema dialect and its engine; validation of shape (section 4) | The meaning of a section: each section's descriptor is written by the component that owns the section |
| The effective snapshot with provenance and its cache (section 5) | Cross-field rules a section owner checks itself, such as most of `validateRunnerConfigShape` |
| The write doors, the write transaction and its conflict rule (section 6) | Lock mechanism (Holder-lock), durable replace (Durable File) |
| The `@fgos:` comment grammar and when a reason is required (section 7) | Secret values; Config stores references and Secrets resolves them (section 9) |
| The `fgos config` verbs and the config doctor checks (section 11) | Bootstrap files that stay JSON (section 3) |
| Migration of project files from JSON to YAML (section 13) | Which executor, model or tier a seat uses (Seat Binding) |

One implementation: the Rust crate `fgos-config`, linking `fgos-yaml-doc`. Rust consumers link it; Node calls it through the native door (section 12).

Dependencies, one way: Config → YAML Document, Holder-lock, Durable File, Secrets (for reference resolution, once Secrets lands). Nothing below imports Config.

## 3. Files, scope and precedence

| Source | Path | Scope | Notes |
|---|---|---|---|
| Project | `.fgos/config.yaml` (legacy `.fgos/config.json` until migrated) | the project; tracked in git, shared by teammates | never holds machine-local or secret values |
| Global | `~/.fgos/config.yaml` (legacy `~/.fgos/config.json`) | the machine; every release installed on it reads this file | mode 0600 |
| Runtime default | descriptor | built in | applied in memory, never written by a read |

Precedence: project over global over runtime default, the rule of `docs/distribution-vision.md`. A descriptor can narrow it: a key marked `scope: global-only` is refused in the project file by name, and `scope: project-only` the reverse.

**The project file is not trusted for machine keys.** Anyone who lands a commit can change the project file, so a key that decides who may reach this machine, which secret goes where, or what runs here unconfined must not be overridable from it. Rules:

1. A descriptor whose `sensitivity` is not `public` must declare `scope` explicitly; the descriptor lint refuses `both` for those keys unless the descriptor carries a written justification.
2. `global-only` applies to ancestors: a project value at any ancestor path of a `global-only` key, including `null` and a `replace`-merged mapping, is refused with the same error.
3. A descriptor path can name every entry of a map (section 4), so a rule such as "`runner.providers.<any>.accounts` is global-only" is expressible.
4. These are `global-only` from the first slice, each pinned by a fixture: the whole `gateway` section (today the gateway reads only `~/.fgos/config.json`, `apps/fgos-gateway/src/gateway.rs:143`, so this keeps current behaviour), `secrets.globalFile`, `secrets.sources`, `secrets.declarations.<any>.consumers`, `runner.providers.<any>.accounts` (today's rule in `provider-capacity.mjs`), `runner.llmAccounts`, and `bin.*`.

Exactly one source per scope: when both `config.yaml` and `config.json` exist in one scope, the read fails with `config-legacy-shadowed` and doctor reports it; Config never reads both and never writes both. The migration tombstone (section 13) is the one `config.json` content that does not count as a source.

Not config, and never converted to YAML: `.fgos/installation/activation.json`, `.fgos/distribution.json`, release `manifest.json`, `native-addon.json`, `.fgos/coexistence.json`, `~/.fgos/confinement-backends.json`, `events.jsonl`, `state.json`, lock and receipt files. Config starts after the bootstrap that reads them.

## 4. Schema

Each component that owns a section ships a **descriptor**, as data, at `core/config-schema/<section>.yaml`, with an `owner` field naming the component. Config bundles the descriptors with the release and imports no module of any owner; it never calls back into JavaScript.

A descriptor entry per key:

| Field | Meaning |
|---|---|
| `path` | key path: segments as in section 3 of the YAML Document spec, plus the segment `<any>` that matches every entry of a `map of T` |
| `type` | string, integer, number, boolean, enum, list of T, map of T, object |
| `values` | for enums and bounded numbers: the allowed values or range |
| `default` | the **runtime default**, applied when the key is absent in every source |
| `suggestion` | an optional **setup suggestion**, written only when setup materializes the key; never applied by a read |
| `scope` | `both` (default), `project-only`, `global-only` |
| `merge` | `deep`, `replace` or `leaf` (YAML Document merge primitive) |
| `absent` | `default`, `required` (missing is a reported error) or `off` (missing means the feature is off) |
| `sensitivity` | `public`; `command` (the value is executed or becomes argv: `invariantChecks.commands`, `worktreeSetup.commands`, `runner.executor` and `runner.executors.<any>` command, args and env, confinement backend references and the `unconfined` mode); `secret-reference` (section 9); `secret-value` (interim, `gateway.token` only, deleted when the token moves to Secrets) |
| `doc` | one line: what the key does |
| `version` | the descriptor's revision, bumped when `doc`, `values` or `default` change |

The schema dialect is small and closed (the listed types and fields); no JSON Schema engine. Shape errors are reported with the file, line, column and the descriptor that refused the value. A type mismatch is reported, never repaired. An unknown key is reported by doctor as a warning, and kept on every write.

The 15 `registerConfigDefault` calls in `src/setup/registrations.mjs` become descriptors in the first slice; the hand-written merge rules (`sanitizeGlobal`, the global-only account inventory, the `sectionOf` copies in `terminal-control`, `holder-lock-checks` and `run-supervisor-checks`) become descriptor fields.

The default and the suggestion are separate on purpose. Today `fgos setup` writes `node --test test/architecture.test.mjs` into every project's `invariantChecks.commands`, a command that fails in a project without that file, while the reader refuses to assume it. Under this schema that value is at most a `suggestion` of this repository, and its runtime default is the empty list.

## 5. Read: the snapshot

`snapshot(projectRoot)` returns, for the project and the machine:

- the effective value of every described key and of every undescribed key present in a file;
- for every value, its provenance: `project`, `global` or `default`, with file, line and column when it came from a file;
- the byte revision of each source file.

Rules:

1. **A read never writes.** No file is created, filled or reformatted by a read, a check or `doctor` without `--fix`. Today's `ensureRunnerConfigForDir`, which writes the project file on the read path, is removed; its callers receive the in-memory defaults and the list of keys a newer release describes but the file lacks.
2. **Missing is not malformed.** An absent file is an empty source. A file that does not parse, or breaks the `strict-config` profile, is an error for every caller, doctor and runner alike; it never becomes an empty object.
3. **Absent is not null** (YAML Document section 7).
4. **Cache by content.** A snapshot is reused while every source's size and sha256 and the descriptor bundle's digest are unchanged: one stat and one hash per source per read, never a process-lifetime cache. Measured: stat plus read plus sha256 of the 40 KB config costs about 24 µs, less than today's read plus `JSON.parse` at about 59 µs (spike, G1).
5. **Environment facts are not defaults.** Values that depend on the machine are detected at read time and reported with provenance `detected`, never written into the tracked project file (section 8).
6. **Command values come from the trusted root.** A `command` value is read from the main checkout's project file (or the global file), never from a linked worktree's copy. Today this holds only in call sites (`src/runner/merge.mjs:1216`, `:1246`, `src/runner/worktree.mjs:143` read from the repository root, not the candidate worktree); under Config it is a rule of the snapshot: `snapshot` takes the main checkout root for command keys whatever root the caller passes. A fixture pins that a worker's edit to its worktree's config does not change what the merge gate or the worktree setup executes.
7. **Snapshots handed to Node are plain data.** Objects built for JavaScript have no prototype and are created with define semantics, so no key, `__proto__` included, can change an object's prototype (YAML Document section 10).

## 6. Write: three doors and one transaction

Only three doors write config:

| Door | Writes |
|---|---|
| `fgctl init` / `fgos init` | creates a missing file from descriptors: every key with its comments (section 7) |
| `fgos doctor --fix` | the fixes doctor reported, each through a patch with a generated reason |
| `fgos config set`, `unset`, `patch`, `migrate`, `refresh-docs` (and the same operations through the Node door) | what the caller asked, with the caller's reason |

**Who may write.** The writer class comes from Session Identity, never from the caller:

- A confined worker writes no config through any door; every door refuses it by name (`config-write-confined`). A worker that needs a config change reports it in its result for the person or the conductor to apply. This also means no door needs a lock or writer identity inside a sandbox.
- A `command` or `global-only` key is written only by an unconfined session.
- The write itself records the writer id in the transaction result; the `[actor]` in the file is a copy for readers (section 7).

Every write is one transaction on one source file:

1. Take the lock for the scope: `project-config` (scope `repo`) or `global-config` (scope `machine`, so two projects on one machine cannot write the global file at once), two new rows registered in `packages/holder-lock/contracts/lock-registry.v1.json` with ranks set relative to `git` and `event-store`. The `repo-config` lock is Git's and is not borrowed.
2. Open the file through the file rules of section 9 and compare its byte revision, computed from that same open file, with the revision the caller's patch was computed against; on a difference, fail with `config-write-conflict` and write nothing.
3. Apply the edits through YAML Document, render the comments (section 7), validate the result against the schema.
4. Re-read the file and compare its revision again just before replacing it; on a difference, fail with `config-write-conflict`. Then replace the file through Durable File, keeping the file's mode (0600 for the global file).
5. Release the lock.

Limits stated, not hidden: one source per transaction, so there is no atomic write across the project and global files; and an editor outside fgOS that writes in the short window between the check in step 4 and the rename loses its edit without any error. Locks and compare-and-swap cannot see writers that take no lock; the second check only shrinks that window.

## 7. Comment contract

Owner decision 2026-10-22 (option "đủ trong file"): the file alone is enough to understand every key.

Every file starts with `# @fgos:v1`, the grammar version. Above each described key, three kinds of comment line, in this order:

```yaml
gateBypass:
  # @fgos:doc Gate bypass level for agent work. Values: off | light | standard | heavy. Default: off.
  # @fgos:why [vantt] dogfood repo, lighter gates.
  # Remember to reset before release.
  level: light
```

| Line | Written by | Content | Rule |
|---|---|---|---|
| `# @fgos:doc` | Config, from the descriptor | what the key does, its allowed values and its runtime default | rewritten only when the descriptor's `version` changes, and only by `doctor --fix` or `fgos config refresh-docs`, never as part of another write |
| `# @fgos:why [<actor>]` | whoever set the value | why the key holds this value | required when the value differs from the runtime default or from the value it would inherit; kept verbatim; never rewritten by Config |
| any other `#` line | a person | free notes | kept verbatim |

Reason rules for the write doors:

- `set`, `unset` and `patch` refuse with `config-comment-reason-required` when the value departs from the default or inherited value and no reason is given. An empty or whitespace reason, or a single generic word (`update`, `fix`, `change`), is refused the same way.
- A reason is one line. A reason containing a line break, U+2028, U+2029 or U+0085 is refused, not split. No comment line Config writes from caller text may begin with `@fgos:`, so a reason cannot forge a second `@fgos:why` naming someone else, or a fake `@fgos:doc`.
- `<actor>` is the writer identity from Session Identity (a person's name, or an agent's writer id), never typed by the caller. In the file it is provenance for readers, nothing more: anyone who edits the file by hand can type any actor, git history is the authority on who changed what, and no code branches on the actor text.
- When `init` or `doctor --fix` writes a runtime default, it writes `# @fgos:why [setup:default] platform default`; when it writes a detected or suggested value, the reason names the source (`[setup:detected] found claude on PATH`).
- A hand edit that departs from the default without a `@fgos:why` line is reported by doctor as `config-comment-missing-why`, a warning. The runner does not stop and no read writes anything.
- A `@fgos:doc` line that differs from the descriptor is reported as `config-doc-drift`, fixed by `doctor --fix`. `fgos config check` fails on it (doctor alone only warns), so a forged doc line is visible before a commit lands.
- Removing a key that carries a `@fgos:why` or free note requires the caller to acknowledge the loss (YAML Document `comment-would-be-lost`); `unset` asks for the reason to keep in the commit message.

Undescribed keys get no `@fgos:doc` line; their notes are kept.

**Seat Binding §5.1.** The tier ladder that §5.1 writes as a `"$comment"` key beside `modelPolicies`, `tierFallback` and `maxTier` is rendered instead as `# @fgos:doc` lines on those keys. Owner decision 2026-10-22. The ladder text stays one constant owned by the Seat Binding crate and is supplied to Config through that section's descriptor; the representation clause of D-ADR0072 is superseded in the same change, recorded in `docs/specs/seat-binding.md`'s "Lịch sử quyết định", and the pending seat-binding plan's phase 05 drops its `$comment` handling. No `$comment` key is introduced anywhere.

## 8. Values that are not defaults

| Value | Today | Under Config |
|---|---|---|
| `runner.executor` when the project names none | probed from `PATH` at first run and written into the tracked project file | detected from `PATH` at read time (the existing `findExecutableOnPath`), provenance `detected`; written only when a person or agent sets it, with a reason |
| `bin.globalFgosPath` | cached in `~/.fgos/config.json` by setup | a cache under `~/.fgos/runtime/`, not config |
| `gateway.token` | a generated secret written into `~/.fgos/config.json` by `doctor --fix` | moves once into the Secrets component; until Secrets lands, the existing fix stays as the one documented exception (written only when missing, so at most once per machine, through the transaction of section 6), and the key is `sensitivity: secret-value` (section 9) |

Known gap until the token moves: a confined worker can read `~/.fgos/config.json` today, because it is not among the paths `hostRead: blind` hides (`BLIND_HIDDEN_ROOTS`, `src/runner/dispatch/confinement/resources.mjs:26`), and with the gateway bound to `0.0.0.0` by design (D7 in `gateway.rs`) it could call the gateway. The fix belongs to the token's move into Secrets, or to adding the global config file to the hidden roots, whichever the owner schedules first.

## 9. Secrets and file safety

- Config stores references to secrets, never values; a key marked `secret-reference` is never expanded in a snapshot, diff, explanation, doctor output or generated comment. Resolution belongs to Secrets (`docs/platform/secrets/spec.md` section 4.1), and Config does not copy its resolver.
- A `secret-value` key (only `gateway.token`, until it moves) is carried in the in-process snapshot to the consumer that needs it, and rendered as `<redacted>` by `show`, `explain`, `check`, doctor output, diffs, migration reports and every error message.
- **No error echoes a value.** A parse, profile or schema error names the rule, path, file, line, column and expected type; it never contains a scalar value or a source snippet. A fixture breaks the line next to the token in a global file and checks the error contains no token bytes.
- **File rules.** The project file must resolve inside the worktree root it belongs to; the global file inside `~/.fgos`. Every path component is opened without following symlinks (`openat2` with `RESOLVE_BENEATH | RESOLVE_NO_SYMLINKS` where the kernel has it, per-component `O_NOFOLLOW` otherwise), the byte revision is computed from the same open file that is read, and a symlinked `.fgos` directory, `~/.fgos` directory or config file is refused with `config-path-symlink`. Linked worktrees keep working because each worktree's `.fgos` is a real directory of that worktree.
- The global file is mode 0600 and a write keeps that mode. On Windows file modes do not restrict readers; the equivalent protection is unproven and tied to gate G4.
- Reason text and descriptor text go through the YAML Document injection guard; neither can create a key.

## 10. Holder-lock bootstrap

Holder-lock reads config today: `readPredecessorKillWaitMs` (`src/holder-lock/protocol.mjs:70-88`) merges the project and global files, swallowing parse errors into an empty object, and is called on the common acquire path (`src/holder-lock/index.mjs:173`) and by `src/run-supervisor/direct-launch.mjs:251`. Config's own write transaction needs a lock, so this would be a cycle.

- Config acquires its locks with the constant `DEFAULT_KILL_WAIT_MS`, never through `readPredecessorKillWaitMs`.
- The two callers above receive `killWaitMs` from a Config snapshot passed in by their caller; `protocol.mjs` stops importing the config modules; `lock-config-invalid` becomes a schema error of the `lock` descriptor.
- Until those two callers move, Holder-lock still reads the config files on its acquire path; this spec does not claim otherwise.

## 11. Verbs, setup and doctor

`fgos config` (native verb):

| Verb | Effect |
|---|---|
| `show [--path <p>]` | the effective snapshot with provenance; secret references shown as references |
| `explain <path>` | the descriptor: doc, type, values, default, scope, owner, and where the current value comes from |
| `check` | validate both files; no write |
| `set <path> <value> --reason <text>` / `unset <path> --reason <text>` | one transaction (section 6); `<path>` uses YAML Document's path text form (keys joined by `.`, a key containing `.`, `[`, `]` or a quote written bracket-quoted as `["a.b"]`), so no key is ever addressed by accident |
| `patch <file> --reason <text>` | several edits in one transaction on one source |
| `migrate [--global]` | JSON to YAML (section 13) |
| `refresh-docs` | rewrite `@fgos:doc` lines whose descriptor version changed |

Doctor checks, registered in `src/setup/checks.mjs` as the install/setup/doctor gate requires: `config-parse` (both files parse under `strict-config`), `config-schema` (types and values), `config-legacy-shadowed`, `config-format-legacy-json`, `config-doc-drift` (fix: refresh), `config-comment-missing-doc` (fix: render), `config-comment-missing-why` (warning, no fix), `config-unknown-key` (warning), `config-global-permissions` (fix: chmod 0600). `fgos setup`'s config merge becomes a call to `init` for missing files and to `doctor --fix` for missing keys.

A committed config file that does not parse stops every verb on every teammate's machine, by design (section 5 rule 2). Two consequences: enforcement hooks such as the `dispatch-decide` PreToolUse hook fail closed (they refuse the guarded action, never allow it), and `.githooks/pre-commit` runs `fgos config check` on a staged config file so a broken file is caught before it is committed.

## 12. Node door

Owner decision 2026-10-22: native door.

- The combined addon gains a `config` namespace (`snapshot`, `explain`, `check`, `applyPatch`), and the `addon.versions()` marker in `src/native/door.mjs` names it in the same change.
- One Node facade module replaces `src/config/shared-config-file.mjs` and `src/config/global-config.mjs`. Every Node reader moves onto it, including the seven that read `config.json` directly today (`gateway-control.mjs`, `events-compaction.mjs`, `events-jsonl-truncation-guard.mjs`, the two `registrations.mjs` check and fix sites, `dispatch/cli.mjs`, `dispatch/config.mjs`'s explicit-path load). `mergeWithGlobalConfig`, `mergeConfigDefaults` for config, the five `JSON.stringify` writers and the write-on-read in `ensureRunnerConfigForDir` are deleted in the same change (L10).
- Section owners keep their own cross-field validation (for example `validateRunnerConfigShape`), run on the snapshot after Config's shape check.
- An architecture test fails on any read of a config file outside the facade.
- Node cost per snapshot read: one N-API call (about 12 µs) plus the digest check; a doctor run with about 40 reads costs about 1.4 ms against about 2.4 ms today (spike, G1).
- Rust consumers move in the same slice: `packages/herdr-fgos-common/rust/src/settings.rs`, `packages/work-state/rust/src/lib.rs`, `herdr-dashboard/src/main.rs` (whose own `herdrOrchestrator` reader is a leftover duplicate of `settings.rs`), and `apps/fgos-gateway/src/gateway.rs`.

## 13. Migration

**Project files.** `fgos config migrate` converts `.fgos/config.json` to `.fgos/config.yaml` per project: backup of the JSON file, conversion with generated `@fgos:doc` lines and `@fgos:why [migrate] carried over from config.json, reason never recorded` on every non-default value, semantic equivalence check through Canonical JSON (the converted value must equal the JSON value byte for byte in canonical form), then the JSON file is replaced by a tombstone. Unknown sections are kept. The spike found no duplicate keys in the real files, so a mismatch aborts instead of repairing (G3).

- **Tombstone, not deletion.** A teammate still on an older release would find no `config.json`, and every older release writes a fresh one with the default executor (`claude -p … --permission-mode acceptEdits`, no confinement; `src/runner/dispatch/config.mjs:210-222` and `:420-427`), then dispatch an unconfined agent. So migration leaves `.fgos/config.json` holding the exact text `moved to .fgos/config.yaml; upgrade fgOS`, which older releases fail to parse and refuse loudly without writing. The new release treats that exact text as no legacy source. A migration fixture runs the older release's reader against the tombstone.
- **Migrated reasons stay visible.** The `[migrate]` reason says no reason was ever recorded; doctor lists those values as `config-comment-migrated-why` so they get a real reason over time instead of being silenced.
- **Backups.** A project backup goes to `.fgos/runtime/config-migrate/` (git-ignored), the global backup to `~/.fgos/runtime/config-migrate/` with mode 0600; both are created with Durable File's create-only install (no overwrite, no symlink follow); doctor reports backups older than 30 days as `config-migrate-backup-stale`. A backup is never written next to the config file, because this repository already tracks `.fgos/*.backup-*` files.

**Global file.** Not converted until no release on the machine still reads or writes `~/.fgos/config.json`. On the owner's main machine there is one release and one project (G2); the other machine is not checked yet. A one-way YAML-to-JSON view for older readers is not part of this spec; if it is ever needed it is a new decision with its own cost (two files, not atomic).

**Tests.** 104 test files write `config.json` by hand (G5). One shared fixture helper replaces them before any format change, so the format switch is one change in the helper.

**Separate item, can land first.** The `invariantChecks` default (section 4): the runtime default becomes the empty list, doctor passes an absent section and still fails a malformed one, and this repository keeps its own command in its own config.

## 14. Failure cases

| Case | Result |
|---|---|
| A config file does not parse or breaks `strict-config` | error with file, line, column, for every caller; doctor `config-parse` |
| `config.yaml` and `config.json` both present in a scope | `config-legacy-shadowed`; no read guesses |
| Value of the wrong type | schema error naming the descriptor; never repaired |
| Key outside its scope | refused by name, naming the file it belongs in |
| Concurrent write | `config-write-conflict`; the loser writes nothing |
| Change without a reason where one is required | `config-comment-reason-required` |
| Addon missing on the channel | the door's named error; no JavaScript fallback |
| A confined session calls a write door | `config-write-confined`; nothing written |
| A config file or `.fgos` directory is a symlink, or resolves outside its root | `config-path-symlink`; nothing read or written |
| A project value sits on or above a `global-only` path | refused by name, naming the global file |

## 15. Acceptance

1. `init` creates every described key with `# @fgos:doc` (doc, values, default) and `# @fgos:why [setup:*]`; running `refresh-docs` twice leaves the bytes unchanged the second time and never touches `@fgos:why` or free notes.
2. Editing one deep value keeps every other byte identical, comments included.
3. Two writers from one revision: one commits, the other gets `config-write-conflict`; no torn file.
4. Read, check and doctor without `--fix` never create or modify a file; missing is not malformed; a malformed file never becomes an empty object.
5. Project over global over default; absent is not null; lists are leaves; a wrong type is reported; materializing a project file never pins a value inherited from global.
6. A comment-only edit changes the byte revision and nothing semantic.
7. No `secret-reference` is expanded anywhere and no `secret-value` is rendered outside the in-process consumer; the global file is 0600; a symlinked config file or `.fgos` directory is refused.
8. Rust and Node read through one implementation; no JavaScript config parser or merger remains.
9. A reason of whitespace or a single generic word is refused; a line break in a reason never produces a key.
10. Migration keeps unknown sections and notes, passes the canonical equivalence check, writes a backup and removes the JSON file.
11. Config's own lock acquisition does not read config; the two Holder-lock callers take `killWaitMs` from a snapshot.
12. Writing or materializing the project file cannot change any effective `gateway.*`, `secrets.*` (the `global-only` paths of section 3), `runner.providers.<any>.accounts` or `bin.*` value, including through `null` or a `replace` at an ancestor.
13. A worker's edit to its linked worktree's config does not change any `command` value the merge gate or worktree setup executes.
14. A confined session's write through any door is refused with `config-write-confined`.
15. `show`, `explain`, `check`, doctor output and every error render `gateway.token` as `<redacted>`; no error contains a value or a source snippet.
16. A snapshot object in Node has no prototype; a `__proto__` key cannot change any object's prototype.
17. After migration, an older release reading the project refuses the tombstone and writes no `config.json`.

## 16. Gates

| Gate | Status |
|---|---|
| G1 parser spike and costs | done 2026-10-22: two candidates round-trip byte-identically; N-API about 12 µs per call; digest check about 24 µs |
| G2 releases sharing `~/.fgos` | done on the main machine (one release, one project); the second machine is open |
| G3 parse of real config files | done: no duplicate keys, no out-of-range integers |
| G4 addon and host on Windows | open; needs a Windows machine |
| G5 test fixtures | counted (104 files); the helper is the first implementation step |

## 17. The six questions (platform L5)

1. **What to read first?** This spec and `docs/platform/yaml-document/spec.md`; the inventory report for today's readers and writers.
2. **What kind of work?** A new foundation component that replaces `src/config/`, the bypass readers, the write-on-read and the hand-written merges.
3. **What contract does it touch?** The config files of every project using fgOS, the setup and doctor registry, the Holder-lock registry (two new locks), the addon ABI marker, Seat Binding §5.1.
4. **How much risk?** High: every component reads config, and projects outside this repository carry these files. The equivalence check, the conflict rule and the deferred global migration carry it.
5. **What proof means done?** The acceptance list as Rust tests with golden fixtures; one Node wiring proof per door; `npm test` and `cargo test --workspace` green.
6. **What learning is left?** Decisions below and in `distribution.md` and `seat-binding.md`; gate evidence in the spike report.

## 18. Lịch sử quyết định

- **2026-10-21: comments are documentation, every writer writes them.** Owner. The first proposal, that tools never rewrite a file a person edits, was withdrawn: it protected comments from writers instead of making writers carry them.
- **2026-10-21: two components, YAML Document below Config with a schema.** Owner direction; the panel (wf-run-1792598883803-72bd2251) agreed on two Rust authorities, no JavaScript fallback parser, reads that never write, and locks independent of Config.
- **2026-10-22: Node door is the native addon.** Owner, over the panel's alternative of a JSON projection plus spawn. Measured afterwards (G1): N-API about 12 µs per call against 3 to 40 ms per spawn.
- **2026-10-22: comment scope "đủ trong file".** Owner: `@fgos:doc` carries what the key does, its allowed values and its default; `@fgos:why` is required when a value departs from the default or inherited value; a hand edit without a reason is a doctor warning.
- **2026-10-22: Seat Binding §5.1 ladder rendered as `@fgos:doc`.** Owner, as owner of that contract; supersedes the representation clause of D-ADR0072 when this lands.
- **2026-10-22: global file migration deferred** until no release on any of the owner's machines reads or writes the JSON file; no dual-file view in this spec.
- **2026-10-22: security review folded in.** An independent review (`plans/reports/security-review-261022-0021-yaml-config-specs.md`) found that project-over-global with `scope: both` by default would let a pull request take over gateway auth and secret routing once the gateway reads the snapshot. Tightened in this spec without new mechanisms: explicit scope for non-public keys, ancestor and wildcard scope rules, the first-slice `global-only` list, `command` and `secret-value` sensitivities, command values read from the main checkout, confined sessions write no config, one-line reasons that cannot forge grammar lines, redacted errors, no-follow file opens, a second revision check before rename, a machine-scope global lock, a migration tombstone for older releases, and backups under `runtime/`. Three proposals that add mechanisms sit outside this component and are recorded as backlog items instead (approval of changed commands per machine and a merge-gate hold on command diffs, both runner policy; moving the token out of config before Secrets lands, an existing gap).
