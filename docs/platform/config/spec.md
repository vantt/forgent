# Config Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the single authority for fgOS configuration: which files, which schema, which value wins, who may write, and the comments every writer must leave
Design status: Signed by the owner on 2026-10-22 as a whole; amended 2026-10-23 (section 4 now JSON Schema, section 10 settled, counts corrected) and again 2026-10-23 11:45 (shape in the schema, values in a separate standard file, fewer annotations); see "Lịch sử quyết định"
Implementation status: Rust crate done (schemas and standard for every section, snapshot with provenance, scope rules, one-file write transaction, comment grammar, redaction; validator `jsonschema` =0.60.0, record in packages/config/upgrade-record.md). Slice D done 2026-10-24: confinement mask for `~/.fgos/private` (G6), machine files, the two-stage account and token move, the comment renderer, project migration, the findings engine and the native verbs `fgos config show|explain|standard|check|set|unset|patch|migrate|refresh-docs`. Slice C done (Node door): every Node, gateway, herdr-dashboard and work-state reader goes through the `config` namespace of the native door, Node through the facade `src/config/facade.mjs`; the doctor rows, the `fgos setup` `init` call, the machine view, the fail-closed hook rule and the project and global migration are in place; `src/config/shared-config-file.mjs` and `src/config/global-config.mjs` are deleted. Open: Windows (G4), the global files of machines that still run a release reading JSON, and turning `config-format-legacy-json` from a warning into a failure once every machine is converted
Canonical: Yes
Owner: Config component (proposed)
Source: packages/config/rust (crate fgos-config); section schemas (JSON Schema authored as YAML) core/config-schema/, section standards (the release's standard values) core/config-standard/
Contracts: packages/config/contracts/
Last reviewed: 2026-10-25
Related:
- docs/platform/yaml-document/spec.md (the leaf below: parse, edit, merge primitive)
- docs/platform/secrets/spec.md (lower component; Config holds references, Secrets resolves them)
- docs/platform/holder-lock/spec.md (locks for the write transaction)
- docs/specs/seat-binding.md §5.1 (ladder comment, representation superseded by section 7 here)
- docs/specs/distribution.md, docs/distribution-vision.md (setup and doctor, project over global)
- docs/platform/component-boundary.md
- plans/reports/research-261021-2221-config-access-inventory.md
- plans/reports/spike-261022-0017-yaml-config-gate-evidence.md
- plans/reports/research-261023-1109-json-schema-validator-crate-choice.md (the validator crate, section 4)
- architecture panel run wf-run-1792598883803-72bd2251
```

## 1. Purpose

Config answers, for every fgOS component and every project using fgOS: what is the effective value of this setting, where did it come from, what does it mean, and how may it change. It applies a schema, supplied as data by each setting's owner in the standard JSON Schema dialect, on top of the YAML Document component.

Two owner requirements shape it:

- **Comments are documentation and are mandatory.** A stranger, human or agent, opens the file and understands what each key does, which values it takes and why it holds the value it holds. Every writer leaves those comments, including `fgos setup`, `fgos doctor --fix` and an agent setting a value (owner, 2026-10-21).
- **JavaScript does not implement this layer.** Parsing, merging, precedence, schema validation and writes live in Rust; Node calls them through the native door (owner, 2026-10-21 and 2026-10-22).

## 2. Ownership boundary

| Owns | Does not own |
|---|---|
| Which files are config, their scope and precedence (section 3) | YAML syntax, byte-preserving edits, comment injection guard (YAML Document) |
| Loading the bundled section schemas and standard files, the lint of the schemas' `x-fgos-` annotations and of the standard against them, and applying a JSON Schema validator crate to the effective value (section 4) | The JSON Schema syntax and the value checker (the standard and the validator crate); the meaning of a section: each section's schema is written by the component that owns the section |
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
| Project | `.fgos/config.yaml` (legacy `.fgos/config.json` until migrated) | the project; tracked in git, shared by teammates | holds only what this project changes from the standard; never machine-local or secret values |
| Global | `~/.fgos/config.yaml` (legacy `~/.fgos/config.json`) | the machine; every release installed on it reads this file | holds only what this machine changes from the standard; mode 0600 |
| Accounts | `~/.fgos/private/accounts.yaml` | the machine | the account pools (`runner.llmAccounts`, `runner.providers.<name>.accounts`); mode 0600 |
| Gateway token | `~/.fgos/private/gateway-token` | the machine | the gateway bearer token, one line, nothing else, not YAML; mode 0600 |

`~/.fgos/private/` (mode 0700) holds the accounts file, the token file and every backup that may contain either; it is hidden from every confined worker (section 9). One directory, not a list of file names, so a backup or a later machine secret is hidden by where it is written, not by remembering to add it.
| Standard | the standard files bundled with the release (`core/config-standard/<section>.yaml`) | built in | the complete standard configuration (section 4); read-only; applied in memory, never written by a read |

Precedence: project over global over standard, the rule of `docs/distribution-vision.md`. A schema can narrow it: a key whose schema node carries `x-fgos-scope: global-only` is refused in the project file by name, and `x-fgos-scope: project-only` the reverse. The accounts file is a source for its own keys only and the token file is not config at all: neither is a layer of this ladder, and a key that belongs to one of them is refused in the project and global files by name (`config-key-in-wrong-file`, naming the file it belongs in). A value `detected` at read time (section 8) ranks between global and standard and exists only for keys whose schema node says `x-fgos-absent: detected`; a project or global value always wins over it.

**Config files hold only differences.** The standard is complete and ships with every release, so a project or global file holds only the keys a person or agent changed, each with its `@fgos:why` (section 7). Redundancy is judged per file against the standard only, never against the global file, because the global file differs per machine: a project value equal to the standard is redundant, and so is a global value equal to the standard; a project value equal to the standard over a different global value is still redundant by this rule, and a project that wants to pin the standard over machine overrides says so with `x-fgos-merge: replace` on that path or a project-only schema node. No door writes a redundant value (`set` of a value equal to the standard on an absent key is a no-op with a named notice; on a present key it is an `unset`); doctor reports one found in a file as `config-redundant-value` (warning, fix: remove, which needs the `comment-would-be-lost` acknowledgement when the value carries a note). A file writes only the fields it changes (`runner.capabilities.code:review.confinement`), never a whole copied entry, so the fields it did not change keep following the standard. To switch off a standard entry a file sets it to `null`, where the map's `additionalProperties` schema lists `"null"` among its `type` values.

Why (evidence 2026-10-22): this repository's project file is 1557 lines, of which `runner.capabilities` is 759 and `runner.executors` 531. They were seeded by setup and have since been edited by hand into the tuned catalog the project runs on: 0 of the 36 seeded capabilities still equal the setup seed (`DEFAULT_CAPABILITY_SLOTS`), which still says `unconfined` where the file requires confinement. Every other project got the old seed and keeps it, which is how `rigorToTier` and the `invariantChecks` command outlived their decisions. Moving the catalog into the release's standard is what lets the next project start from the tuned catalog, not from a stale seed.

**The project file is not trusted for machine keys.** Anyone who lands a commit can change the project file, so a key that decides who may reach this machine, which secret goes where, or what runs here unconfined must not be overridable from it. Rules:

1. A schema node whose `x-fgos-sensitivity` is not `public` must declare `x-fgos-scope` explicitly; the annotation lint refuses `both` for those keys unless the node carries a written justification (a `$comment` that starts `justification:`, section 4).
2. `x-fgos-scope: global-only` applies to ancestors: a project value at any ancestor path of a `global-only` key, including `null` and a `replace`-merged mapping, is refused with the same error.
3. A schema path can name every entry of a map (`additionalProperties`, section 4), so a rule such as "`runner.providers.<name>.accounts` is global-only" is expressible (in this spec `<name>` is prose for any entry of a map, not schema syntax).
4. These are `global-only` from the first slice, each pinned by a fixture: the whole `gateway` section (today the gateway reads only `~/.fgos/config.json`, `apps/fgos-gateway/src/gateway.rs:143`, so this keeps current behaviour), `secrets.globalFile`, `secrets.sources`, `secrets.declarations.<name>.consumers`, and `bin.*`. The account pools (`runner.providers.<name>.accounts`, today's rule in `provider-capacity.mjs`, and `runner.llmAccounts`) and `gateway.token` go further: they leave the config files for their own files (table above).

Exactly one source per scope: when both `config.yaml` and `config.json` exist in one scope, the read fails with `config-legacy-shadowed` and doctor reports it; Config never reads both and never writes both. The migration tombstone (section 13) is the one `config.json` content that does not count as a source.

Not config, and never converted to YAML: `.fgos/installation/activation.json`, `.fgos/distribution.json`, release `manifest.json`, `native-addon.json`, `.fgos/coexistence.json`, `~/.fgos/confinement-backends.json`, `events.jsonl`, `state.json`, lock and receipt files. Config starts after the bootstrap that reads them.

## 4. Schema and standard

Config files are YAML, so people can edit them and keep comments. Their schema invents no syntax: it is **JSON Schema draft 2020-12**, the dialect of fgOS's other contracts (`packages/*/contracts/*.schema*.json`, and `docs/contracts/fgos-gateway-api-v1.yaml` through OpenAPI 3.1). What matters is standard fields; syntax and validator are the best existing ones, and developers maintain the schema with ordinary JSON Schema tooling (owner, 2026-10-23).

**Shape and values are separate files** (owner, 2026-10-23 11:45), so developers maintain shape in the schema and values in the standard, and a person can open the standard, copy from it or edit it:

| What | File | Holds |
|---|---|---|
| Section schema | `core/config-schema/<section>.schema.yaml` | shape and meaning only: type, enum, bounds, description, properties, additionalProperties, required, `$defs`/`$ref`, and the few annotations below |
| Section standard | `core/config-standard/<section>.yaml` | the release's standard values for that section: a normal config file in the `@fgos:` comment format (section 7), validated by the schema exactly like a project or global file |

The file name before the first `.` is the top-level key (`runner.schema.yaml` and `runner.yaml` are the `runner` section). Each component that owns a section ships both. A schema is parsed with the same `strict-config` profile as a config file and then handed to the validator as JSON. Config bundles both sets with the release and imports no module of any owner; it never calls back into JavaScript.

**Standard keywords keep their standard meaning:**

| Keyword | Use here |
|---|---|
| `type` | string, integer, number, boolean, array, object; a type list such as `[object, "null"]` |
| `enum`, `minimum`, `maximum` | the allowed values and the bounded range |
| `description` | one line: what the key does and its allowed values; with the standard value read from the standard file it is the text of the generated `# @fgos:doc` line (section 7) |
| `properties` | the known keys of an object |
| `additionalProperties` | the schema of every entry of a map or catalog (replaces the earlier custom `<any>` path segment); `patternProperties` is not used (the path walk does not interpret patterns) |
| `required` | keys that must be present in the effective configuration (judged on the merged value, below) |
| `$defs`, `$ref` | reuse inside the bundled set; no remote reference is followed |
| `$id`, `$comment` | the revision and the notes for people, below |
| `default` | **not used.** The standard file is the one source of standard values, so a second copy cannot drift; the lint refuses the keyword |

**Facts the standard cannot express are annotation keywords with the `x-fgos-` prefix**, the minimum set. JSON Schema validators ignore keywords they do not know, so these never change validation:

| Annotation | Values | Meaning |
|---|---|---|
| `x-fgos-scope` | `both` (default), `project-only`, `global-only` | which file may hold the key (section 3) |
| `x-fgos-sensitivity` | `public` (default); `command` (the value is executed or becomes argv: `invariantChecks.commands`, `worktreeSetup.commands`, `runner.executor` and `runner.executors.<name>` command, args and env, confinement backend references and the `unconfined` mode); `secret-reference` (section 9); `secret-value` (interim, `gateway.token` only, deleted when the token moves to Secrets) | how the value is treated |
| `x-fgos-file` | `config` (default), `accounts`, `token` | the one file the key may live in |
| `x-fgos-merge` | `deep`, `replace`, `leaf` | the YAML Document merge primitive's rule for this path |
| `x-fgos-absent` | `detected`, `required`, `off`; used only where the standard file holds no value for the key | `detected`: no standard value, detected at read time (section 8); `required`: no standard value, missing is a reported error; `off`: missing means the feature is off. `fgos config standard` prints `required` and `detected` keys as commented placeholders |

The other facts the earlier annotation list carried live where JSON Schema already puts them or belong elsewhere:

| Fact | Where |
|---|---|
| Revision of the schema (what triggers doc refresh, section 7) | the schema's `$id`: `urn:fgos:config-schema:<section>:v<N>`, N a positive integer bumped when a `description`, `enum`, bound or the section's standard value changes |
| Owning component | the schema root's `$comment`, whose first line is `owner: <component>` |
| Justification for keeping `x-fgos-scope: both` on a non-public key (section 3 rule 1) | that node's `$comment`, which starts `justification: <text>` |
| A setup suggestion (a value `init` may write for a new project) | not in the schema. It is a value, not shape, and only one case used it (this repository's `invariantChecks` command, which this repository keeps in its own config, section 13). `init` takes any such value from the setup code that creates the file and writes it with `@fgos:why [setup:suggested] <source>` (section 7); a read never applies it |

An annotation on a schema node applies to every descendant node that does not state it itself (so `x-fgos-scope: global-only` on `gateway` covers the whole section). A config path resolves to a schema node by walking `properties`, then `additionalProperties`, following `$ref`; a path with no node is undescribed.

**Config's own code keeps only what no validator does:** loading the bundled schemas and standard files; a small lint of the `x-fgos-` annotations, of the `$id` and `$comment` conventions, of the scope and sensitivity rules of section 3 and of the standard against the schema (unknown annotation, wrong annotation value, missing `$id` revision or `owner:` comment, a `default` keyword, missing `description`, implicit or unjustified scope, wrong file placement, a standard value on a secret, file-placed or absent-marked key, a standard file with no schema, a standard that fails its own schema); scope and placement enforcement; the snapshot (merge through YAML Document, provenance); the write transaction; the comment grammar; redaction. There is no custom type dialect and no custom value checker.

**Validation is the validator crate's.** "The validator crate" is an existing JSON Schema validator chosen by the owner after a supply-chain review (`plans/reports/research-261023-1109-json-schema-validator-crate-choice.md`; the owner picked `jsonschema` 0.60.0 on 2026-10-23, conditional on the source review `plans/reports/review-261023-1145-jsonschema-supply-chain-review.md`); Config adopts it only after that sign-off, behind the same gate Slice A used for its parser. It validates the **effective** value (the merge of the layers), never one file alone, because a file holds only differences (section 3) and `required` and whole-section shape can only hold for the merge. A standard file is validated like any other file, as a layer, with `required` judged only on the merge. A finding carries the instance path, the schema keyword and the schema path, attributed to a source file, line and column through the snapshot's provenance; the validator's message text is dropped, because it can quote a value (section 9). A type mismatch is reported, never repaired. A key with no schema node is reported by doctor as a warning, and kept on every write.

**The standard is data, complete and readable.** The standard files hold every standard value, and a value may be a whole catalog: the entries of a map (every capability, every executor, every model policy, the tier fallback, the patterns, the workflow presets) are listed in the owning section's standard file, not seeded from JavaScript constants (today `DEFAULT_CAPABILITY_SLOTS` in `src/setup/registrations.mjs:2262` and the other setup seeds). A standard file is a normal config file: it starts `# @fgos:v1`, and each key carries its `# @fgos:doc` line rendered from the schema (section 7). It is the baseline, not a difference, so it carries no `@fgos:why` and the redundancy rule (section 3) does not apply to it. The files ship with the release and `fgos config standard` prints them in section order. The standard holds no account, no token and no machine-detected value, so it is the same on every machine.

**The first standard is authored from this repository's tuned catalog**, not from the setup seed: the seed is stale (section 3) and the tuned catalog is the one that runs every day. Owner decision G-B2, 2026-10-23, rule A: catalogs (`runner.capabilities`, `runner.executors`, `modelPolicies`, `tierFallback`, `patterns`, `defaults`, `coordination`) come from the tuned file after the machine-specific scrub (the catalog is not clean: an executor description names a login profile), into `core/config-standard/runner.yaml`; scalars come from the code defaults, that is, what every reader assumes when the key is absent (this repository's own timeouts, tier ceiling and parallelism stay its differences); project-specific keys (`runner.executor`, `runner.generatedPaths`) are detected or empty; account material is never in the standard. After that, a standard change is a standard-file or schema change reviewed like code, with the schema's `$id` revision bumped.

A standard entry that a later release renames or removes is reported by doctor when a file still holds fields under the old name (`config-unknown-key`): for a map with a catalog, a name is known when it is in the standard or allowed by `additionalProperties`, so where a map does not allow free names a stray old name is visible.

To change a standard value, a person or agent copies the fields to change into the project or global file and edits them there (`fgos config set`, or by hand with a `@fgos:why`). A map merges per entry (`x-fgos-merge: deep` at the map), so changing one capability means writing one capability, and every other entry keeps following the standard into the next release. A file that wants to own a whole section uses `x-fgos-merge: replace` on it, which the schema must allow. The installed copy of the standard files is never edited in place: a release upgrade replaces it.

The 14 `registerConfigDefault` calls that `src/setup/registrations.mjs` held became section schemas and standard files in the first slice (the config file has 15 top-level sections; `lock` has no registration and is retired, section 10). The hand-written merge rules became annotations or were retired: the seat-binding capability keys refused in the global file become `x-fgos-scope: project-only`; the account inventory becomes `x-fgos-file: accounts` with `x-fgos-scope: global-only`; the last `sectionOf` copy and `mergeWithGlobalConfig`'s fill-missing merge were the merge primitive's own defaults and are deleted; the `runner.rigorToTier`, stale-tier-key and extended-cell filters of `sanitizeGlobal` serve older releases on the machine and are not annotations.

Value and suggestion are separate on purpose. Today `fgos setup` writes `node --test test/architecture.test.mjs` into every project's `invariantChecks.commands`, a command that fails in a project without that file, while the reader refuses to assume it. Under this design the standard value of `invariantChecks.commands` is the empty list (in `core/config-standard/invariantChecks.yaml`), and that command is at most a value this repository keeps in its own file.

## 5. Read: the snapshot

`snapshot(projectRoot)` returns, for the project and the machine:

- the effective value of every described key and of every undescribed key present in a file;
- for every value, its provenance: `project`, `global`, `accounts`, `standard` or `detected`, with file, line and column when it came from a file (a `standard` value names the bundled standard file);
- the byte revision of each source file.

Rules:

1. **A read never writes.** No file is created, filled or reformatted by a read, a check or `doctor` without `--fix`. The former `ensureRunnerConfigForDir`, which wrote the project file on the read path, is deleted; its callers receive the in-memory standard.
2. **Missing is not malformed.** An absent file is an empty source. A file that does not parse, or breaks the `strict-config` profile, is an error for every caller, doctor and runner alike; it never becomes an empty object.
3. **Absent is not null** (YAML Document section 7).
4. **Cache by content.** A snapshot is reused while every source's size and sha256 and the digest of the schema and standard bundle are unchanged: one stat and one hash per source per read, never a process-lifetime cache. Measured: stat plus read plus sha256 of the 40 KB config costs about 24 µs, less than today's read plus `JSON.parse` at about 59 µs (spike, G1).
5. **Environment facts are not defaults.** Values that depend on the machine are detected at read time and reported with provenance `detected`, never written into the tracked project file (section 8).
6. **Command values come from the trusted root.** A `command` value is read from the main checkout's project file (or the global file), never from a linked worktree's copy. Today this holds only in call sites (`src/runner/merge.mjs:1216`, `:1246`, `src/runner/worktree.mjs:143` read from the repository root, not the candidate worktree); under Config it is a rule of the snapshot: `snapshot` takes the main checkout root for command keys whatever root the caller passes. A fixture pins that a worker's edit to its worktree's config does not change what the merge gate or the worktree setup executes.
7. **Snapshots handed to Node are plain data.** Objects built for JavaScript have no prototype and are created with define semantics, so no key, `__proto__` included, can change an object's prototype (YAML Document section 10).

## 6. Write: three doors and one transaction

Only three doors write config:

| Door | Writes |
|---|---|
| `fgctl init` / `fgos init` | creates a missing file holding the grammar line, a header that points to `fgos config standard`, and any value setup chose for this project with its reason; no standard value is copied in |
| `fgos doctor --fix` | the fixes doctor reported, each through a patch with a generated reason |
| `fgos config set`, `unset`, `patch`, `migrate`, `refresh-docs` (and the same operations through the Node door) | what the caller asked, with the caller's reason |

**Who may write.** The writer class comes from Session Identity, never from the caller:

- A confined worker writes no config through any door; every door refuses it by name (`config-write-confined`). A worker that needs a config change reports it in its result for the person or the conductor to apply. This also means no door needs a lock or writer identity inside a sandbox.
- A `command` or `global-only` key is written only by an unconfined session.
- The write itself records the writer id in the transaction result; the `[actor]` in the file is a copy for readers (section 7).

Every write is one transaction on one source file:

1. Take the lock for the scope: `project-config` (scope `repo`) or `global-config` (scope `machine`, covering the global, accounts and token files, so two projects on one machine cannot write them at once), two new rows registered in `packages/holder-lock/contracts/lock-registry.v1.json` with ranks set relative to `git` and `event-store`. The `repo-config` lock is Git's and is not borrowed.
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
| `# @fgos:doc` | Config, from the schema's `description`, `enum` and bounds and the standard file's value | what the key does, its allowed values and its standard value | rewritten only when the rendered line differs after the schema's `$id` revision or the standard value changed, and only by `doctor --fix` or `fgos config refresh-docs`, never as part of another write |
| `# @fgos:why [<actor>]` | whoever set the value | why the key holds this value | required on every value a config file holds, since a file holds only values that differ from the standard (section 3); kept verbatim; never rewritten by Config |
| any other `#` line | a person | free notes | kept verbatim |

Reason rules for the write doors:

- `set`, `unset` and `patch` refuse with `config-comment-reason-required` when no reason is given (every value a file holds differs from the standard, section 3; the redundant no-op needs none). An empty or whitespace reason, or a single generic word (`update`, `fix`, `change`), is refused the same way.
- A reason is one line. A reason containing a line break, U+2028, U+2029 or U+0085 is refused, not split. No comment line Config writes from caller text may begin with `@fgos:`, so a reason cannot forge a second `@fgos:why` naming someone else, or a fake `@fgos:doc`.
- `<actor>` is the writer identity from Session Identity (a person's name, or an agent's writer id), never typed by the caller. In the file it is provenance for readers, nothing more: anyone who edits the file by hand can type any actor, git history is the authority on who changed what, and no code branches on the actor text.
- `init` and `doctor --fix` never write a standard value into a file. When they write a suggested value, the reason names the source (`[setup:suggested] this repository's own invariant command`).
- A value in a file without a `@fgos:why` line is reported by doctor as `config-comment-missing-why`, a warning. The runner does not stop and no read writes anything.
- A `@fgos:doc` line that differs from the schema's `description` is reported as `config-doc-drift`, fixed by `doctor --fix`. `fgos config check` fails on it (doctor alone only warns), so a forged doc line is visible before a commit lands.
- Removing a key that carries a `@fgos:why` or free note requires the caller to acknowledge the loss (YAML Document `comment-would-be-lost`); `unset` asks for the reason to keep in the commit message.

A `description` of several lines renders as one `# @fgos:doc` line per source line, in order; the allowed values, bounds and standard value follow the first line. The standard value shown is the one in the standard layer (a scalar, or a list of at most 120 characters; a map shows through its own keys, null is not shown).

Keys with no schema node get no `@fgos:doc` line; their notes are kept.

**Seat Binding §5.1.** The tier ladder that §5.1 writes as a `"$comment"` key beside `modelPolicies`, `tierFallback` and `maxTier` is rendered instead as `# @fgos:doc` lines on those keys. Owner decision 2026-10-22. The ladder text stays one constant owned by the Seat Binding crate and is supplied to Config through that section's schema (its `description`); the representation clause of D-ADR0072 is superseded in the same change, recorded in `docs/specs/seat-binding.md`'s "Lịch sử quyết định", and the pending seat-binding plan's phase 05 drops its `$comment` handling. No `$comment` key is introduced anywhere.

## 8. Values that are not defaults

| Value | Today | Under Config |
|---|---|---|
| `runner.executor` when the project names none | probed from `PATH` at first run and written into the tracked project file | detected from `PATH` at read time (the existing `findExecutableOnPath`), provenance `detected`; written only when a person or agent sets it, with a reason |
| `bin.globalFgosPath` | cached in `~/.fgos/config.json` by setup | a cache under `~/.fgos/runtime/`, not config |
| `gateway.token` | a generated secret written into `~/.fgos/config.json` by `doctor --fix` | moves to `~/.fgos/private/gateway-token`, created by `fgos setup` (or `doctor --fix`) only when missing, through Durable File's create-only install with mode 0600 at creation, one line and a final newline, no comment grammar and no YAML; the gateway and its clients read that file; the value is `sensitivity: secret-value` (section 9) until it moves into the Secrets component, which changes where the value comes from, not this file rule |

Why the token leaves config now (owner, 2026-10-22, folding backlog item p-a189ff31): a confined worker can read `~/.fgos/config.json` today, because it is not among the paths `hostRead: blind` hides (`BLIND_HIDDEN_ROOTS`, `src/runner/dispatch/confinement/resources.mjs:26`), and with the gateway bound to `0.0.0.0` by design (D7 in `gateway.rs`) it could call the gateway outside its sandbox.

## 9. Secrets and file safety

- Config stores references to secrets, never values; a key marked `secret-reference` is never expanded in a snapshot, diff, explanation, doctor output or generated comment. Resolution belongs to Secrets (`docs/platform/secrets/spec.md` section 4.1), and Config does not copy its resolver.
- A `secret-value` (only the gateway token, until it moves into Secrets) is carried in the in-process snapshot to the consumer that needs it, and rendered as `<redacted>` by `show`, `explain`, `check`, doctor output, diffs, migration reports and every error message.
- **No error echoes a value.** A parse, profile or schema error names the rule, path, file, line, column and expected type; it never contains a scalar value or a source snippet. Fixtures break the line next to an account entry in an accounts file, and next to a value in a global file, and check the error contains no bytes of either value.
- **File rules.** The project file must resolve inside the worktree root it belongs to; the global file inside `~/.fgos`, the accounts and token files inside `~/.fgos/private`. Every path component is opened without following symlinks (`openat2` with `RESOLVE_BENEATH | RESOLVE_NO_SYMLINKS` where the kernel has it, per-component `O_NOFOLLOW` otherwise), the byte revision is computed from the same open file that is read, and a symlinked `.fgos` directory, `~/.fgos` directory or config file is refused with `config-path-symlink`. Linked worktrees keep working because each worktree's `.fgos` is a real directory of that worktree.
- The global, accounts and token files are mode 0600, `~/.fgos/private` is 0700, and a write keeps those modes; doctor `config-global-permissions` checks and fixes all four. Account entries are `sensitivity: secret-reference` where they name a login store, so `show` prints the account names and pools, never what a login store holds. On Windows file modes do not restrict readers; the equivalent protection is unproven and tied to gate G4.
- **`~/.fgos/private/` is hidden from every confined worker, whatever its `hostRead` control.** No worker needs it: the runner, which runs outside the sandbox, reads the account pool, leases one account and hands the worker only that account's credential; the gateway token is used only by the gateway and its unconfined clients. Today hiding is weaker than this rule in two ways: it runs only under `hostRead: blind` (`requestIsBlind`; some built-in policies set `allow`), and its tokens name only project directories (`BLIND_HIDDEN_ROOTS`, `src/runner/dispatch/confinement/resources.mjs:26`, which masks directories with `--tmpfs` in the bwrap driver). So this rule depends on a confinement change owned by the confinement spec (`docs/specs/confinement-authority.md`, cross-referenced from `docs/platform/secrets/spec.md` open question 4): a home-directory token for `~/.fgos/private` and masking it for every confined dispatch. A directory keeps the existing `--tmpfs` mechanism; no file mask is needed. Until that change lands, the private files are no better protected from confined workers than `config.json` is today, and gate G6 stays open. A probe in the confinement harness checks the mask under each built-in policy.
- A snapshot taken by a confined session has no accounts layer and says so in its provenance (`accounts: unavailable-confined`); a verb that leases an account (a nested `fgos run`) is refused by name (`config-accounts-unavailable-confined`), never left to fail on a missing file. The confined fact is one marker variable (`FGOS_CONFINED=1`) the confinement driver sets in every confined worker and the crate's `session_class` reads; it is information for the session, not a security boundary (a worker that unsets it only loses these polite refusals, and the sandbox mask is what protects the files).
- Reason text and schema text go through the YAML Document injection guard; neither can create a key.

## 10. Holder-lock bootstrap (settled)

Holder-lock no longer reads config. Commit `a620881e7` (2026-10-22, "move the Node facade and its callers onto the in-process door") deleted `lock.predecessorKillWaitMs`, its reader `readPredecessorKillWaitMs` and the doctor row `lock-predecessor-kill-wait`: every caller waits the constant `DEFAULT_KILL_WAIT_MS` (2000 ms, `src/holder-lock/protocol.mjs:18`, passed at `src/holder-lock/index.mjs:198`). Config takes its own locks through the lock registry with the same constant, so there is no cycle and no `lock` section schema. A file that still carries `lock.predecessorKillWaitMs` holds a key with no schema node, which doctor reports as a warning and migration drops (section 13).

## 11. Verbs, setup and doctor

`fgos config` (native verb):

| Verb | Effect |
|---|---|
| `show [--path <p>]` | the effective snapshot with provenance; secret references shown as references |
| `standard [--path <p>]` | the release's standard configuration with its `@fgos:doc` lines, ready to copy an entry from |
| `explain <path>` | the schema node: description, type, enum or bounds, standard value, scope, owner, and where the current value comes from |
| `check` | validate both files; no write |
| `set <path> <value> --reason <text>` / `unset <path> --reason <text>` | one transaction (section 6); `<path>` uses YAML Document's path text form (keys joined by `.`, a key containing `.`, `[`, `]` or a quote written bracket-quoted as `["a.b"]`), so no key is ever addressed by accident |
| `patch <file> --reason <text>` | several edits in one transaction on one source |
| `migrate [--global]` | JSON to YAML (section 13) |
| `refresh-docs` | rewrite `@fgos:doc` lines whose rendered text differs from the schema and standard (after an `$id` revision or standard change) |

Exit codes: a verb that refuses (a file that does not parse, a refused write, a failed `--machine-checked` gate) and `check` when any finding is a `fail` row exit with 65 and print the failure ids with file, line, column and path, never a value. The write verbs and `check` need the no-follow write door and the findings engine, which exist on Unix only; elsewhere they refuse with `config-platform-unsupported`.

Doctor checks: one row per finding id, with its doctor severity, `check` severity and fix, in `packages/config/contracts/doctor-rows.v1.json` (the owning list; this spec does not copy it). They are produced by the crate's findings engine and registered in Node through `src/setup/config-checks.mjs`, as the install/setup/doctor gate requires; the facade's `checkConfig` and `fixConfig` call them. `config-format-legacy-json` is a warning until every machine's files are converted, then becomes a failure by a change to that contract file. `fgos setup` calls `init` for a missing project or global file (a header-only file; a legacy `config.json` counts as present) and writes no default into either file; `doctor --fix` applies the fixes it reported (redundant values, keys in the wrong file, permissions, doc drift, missing machine files). Doctor also reports files directly under `~/.fgos` outside `private/` that hold an account pool or a token (`config-secret-outside-private`, fix: move under `private/`).

A committed config file that does not parse stops every verb on every teammate's machine, by design (section 5 rule 2). Two consequences: enforcement hooks such as the `dispatch-decide` PreToolUse hook fail closed (they refuse the guarded action, never allow it), and `.githooks/pre-commit` runs `fgos config check` on a staged config file so a broken file is caught before it is committed.

## 12. Node door

Owner decision 2026-10-22: native door. As built:

- The combined addon has a `config` namespace (entries `snapshot`, `standardValue`, `accounts`, `check`, `fix`, `init`; source `packages/git/node-addon/src/config.rs`), and the `addon.versions()` marker checked in `src/native/door.mjs` names it, so a payload refuses an addon that lacks it. `explain` and `applyPatch` exist in the crate and the native `fgos config` verbs, and have no Node caller.
- One Node facade module, `src/config/facade.mjs`, replaced `src/config/shared-config-file.mjs` and `src/config/global-config.mjs`, which are deleted with `mergeWithGlobalConfig`, `mergeConfigDefaults` for config, the `JSON.stringify` config writers, the registered config defaults and the write-on-read in `ensureRunnerConfigForDir` (L10). Every Node reader of a config file goes through it; an architecture test (`test/architecture.test.mjs`, the config-door guard) fails on any read of a config file outside it. The facade has no JavaScript fallback: a process that cannot load the addon fails each call with the door's own named error.
- The door returns JSON text; the facade parses it into plain data whose objects have no prototype and are built with define semantics (section 5 rule 7). A refused file surfaces as a `ConfigDoorError` carrying failure ids, files and positions, never a value; `isConfigRefusal` separates that from a door failure.
- `readMachineConfig` reads the machine alone (global file, accounts when unconfined, standard) with no project; `readStandardValue(path)` answers the bundled standard's value at a dotted path and reads no file, so a section owner that drops a layer's value takes the layer below from it, never from a second snapshot; `initConfigFile` is the only creation of a config file from Node (section 11).
- The confinement class comes from the `FGOS_CONFINED` variable the bwrap driver sets; the facade reads it once per call, so a confined session never receives the accounts layer and the door refuses its writes.
- Section owners keep their own cross-field validation (for example `validateRunnerConfigShape`), run on the snapshot after Config's shape check. Nothing resolves a default from a copy kept in JavaScript: tests and callers take the standard.
- The `globalFgosPath` cache moved out of config into `~/.fgos/runtime/bin-cache.json` (`src/setup/bin-discovery.mjs`; the shell integration reads that file).
- `.githooks/pre-commit` runs `fgos config check` on a staged config file, and `scripts/dispatch-decide-hook.mjs` fails closed on a config refusal (section 11). The legacy standalone `.fgos/gate-bypass.json` is consulted by `src/state/gate-bypass.mjs` only when the effective `gateBypass.level` came from the standard alone.
- Rust consumers read through the crate as well: `packages/herdr-fgos-common/rust/src/settings.rs`, `packages/work-state/rust/src/lib.rs`, `herdr-dashboard/src/main.rs` and `apps/fgos-gateway/src/gateway.rs`.
- Node cost per snapshot read, measured before the cutover: one N-API call (about 12 µs) plus the digest check (spike, G1).

## 13. Migration

**Project files.** `fgos config migrate` converts `.fgos/config.json` to `.fgos/config.yaml` per project: backup of the JSON file, conversion with generated `@fgos:doc` lines and `@fgos:why [migrate] carried over from config.json, reason never recorded` on every value kept, semantic equivalence check through Canonical JSON (the effective value read through the new files must equal the effective value read from the JSON file, byte for byte in canonical form), then the JSON file is replaced by a tombstone. Migration also:

- drops every value equal to the standard (section 3's redundancy rule), and lists what it dropped in its report; a dropped value that later changes in the standard follows the standard, which is the point. Where the machine's global file holds a different value for a dropped path, the effective value on that machine changes; migration lists every such path in its report and does not proceed without `--accept-machine-overrides`, so the change is seen, not silent. The equivalence check compares the effective values computed with the same global file on both sides, so it fails exactly on those listed paths and nowhere else; the check reads `command` values from the two files it compares, not from the main checkout, so it lists machine overrides of `command` values when run in a linked worktree as well;
- moves account pools to `~/.fgos/private/accounts.yaml` and the token to `~/.fgos/private/gateway-token` (global migration, below), never into the project file. A move spans two files, so it writes and verifies the destination first, then removes the key from the source; a crash between the two leaves the key in both, reported as `config-key-in-wrong-file`, and the destination wins;
- turns every `"$comment"` key into `@fgos:doc` lines and removes the key: this repository's project file already carries `runner.$comment` (landed by `37ab5c0fc`, ahead of this spec), and `stripConfigComments` (`src/runner/dispatch/config.mjs:280`, called at `config.mjs:448`, `:505` and `src/runner/execution/seat-policy.mjs:63`) is deleted when those readers move to Config. Unknown sections are kept. The spike found no duplicate keys in the real files, so a mismatch aborts instead of repairing (G3).

- **Tombstone, not deletion.** A teammate still on an older release would find no `config.json`, and every older release writes a fresh one with the default executor (`claude -p … --permission-mode acceptEdits`, no confinement; `src/runner/dispatch/config.mjs:210-222` and `:420-427`), then dispatch an unconfined agent. So migration leaves `.fgos/config.json` holding the exact text `moved to .fgos/config.yaml; upgrade fgOS`, which older releases fail to parse and refuse loudly without writing. The new release treats that exact text as no legacy source. A migration fixture runs the older release's reader against the tombstone.
- **Migrated reasons stay visible.** The `[migrate]` reason says no reason was ever recorded; doctor lists those values as `config-comment-migrated-why` so they get a real reason over time instead of being silenced.
- **Backups.** A project backup goes to `.fgos/runtime/config-migrate/` (git-ignored), the global backup to `~/.fgos/private/config-migrate/` with mode 0600, because it holds the account pools and the token; both are created with Durable File's create-only install (no overwrite, no symlink follow); doctor reports backups older than 30 days as `config-migrate-backup-stale`. A backup is never written next to the config file, because this repository already tracks `.fgos/*.backup-*` files.

**Global file.** Not converted until no release on the machine still reads or writes `~/.fgos/config.json`. Then `fgos config migrate --global --convert --machine-checked [--dry-run]` converts it the same way as a project file, after both stages of the key move (it refuses with `config-migrate-moves-pending` while an account or token key is left), and its effective value must stay exactly the same, since no machine layer lies under it; the backup goes to `~/.fgos/private/config-migrate/` and the YAML file is 0600. The token and account moves use the same machine check, applied to their keys only, so they can land before the global file is converted: they land when no release on the machine still reads those keys from the global file (on the main machine today there is one release, G2). After the move the gateway reads only the token file and the runner only the accounts file; a missing file is a doctor failure, never a fallback to the old key. The machine check is what `--machine-checked` records; which of the owner's machines have converted is stateful and lives in the migration records under `plans/reports/`. A one-way YAML-to-JSON view for older readers is not part of this spec; if it is ever needed it is a new decision with its own cost (two files, not atomic).

**Tests.** One shared fixture helper (`test/helpers/config-fixture.mjs`) writes every test config file, so the format switch was one change in the helper; `test/architecture.test.mjs` fails a test that writes one elsewhere.

**Separate item, landed first.** The `invariantChecks` default (section 4): the setup default is the empty list, doctor passes an absent section or an empty list and still fails a malformed one, and this repository keeps its own command in its own config (backlog p-be6b5abe, 2026-10-22).

## 14. Failure cases

| Case | Result |
|---|---|
| A config file does not parse or breaks `strict-config` | error with file, line, column, for every caller; doctor `config-parse` |
| `config.yaml` and `config.json` both present in a scope | `config-legacy-shadowed`; no read guesses |
| Value of the wrong type | schema error naming the schema path and keyword, never the value; never repaired |
| Key outside its scope | refused by name, naming the file it belongs in |
| Concurrent write | `config-write-conflict`; the loser writes nothing |
| Change without a reason where one is required | `config-comment-reason-required` |
| Addon missing on the channel | the door's named error; no JavaScript fallback |
| A confined session calls a write door | `config-write-confined`; nothing written |
| A config file or `.fgos` directory is a symlink, or resolves outside its root | `config-path-symlink`; nothing read or written |
| A project value sits on or above a `global-only` path | refused by name, naming the global file |
| An account pool or the gateway token found in a config file | `config-key-in-wrong-file`, naming the file it belongs in |
| A confined worker calls a verb that needs the account pool | `config-accounts-unavailable-confined` |

## 15. Acceptance

1. `init` creates a file with no standard value in it; every key a door writes carries `# @fgos:doc` (doc, values, standard value) and `# @fgos:why`; running `refresh-docs` twice leaves the bytes unchanged the second time and never touches `@fgos:why` or free notes; `fgos config standard` prints the complete standard with its `@fgos:doc` lines and no account, token or detected value; every standard file validates against its schema.
2. Editing one deep value keeps every other byte identical, comments included.
3. Two writers from one revision: one commits, the other gets `config-write-conflict`; no torn file.
4. Read, check and doctor without `--fix` never create or modify a file; missing is not malformed; a malformed file never becomes an empty object.
5. Project over global over standard; a map merges per entry, so a file that changes one capability inherits every other capability from the standard of the running release; absent is not null; lists are leaves; a wrong type is reported; no door writes a value equal to the one it would inherit.
6. A comment-only edit changes the byte revision and nothing semantic.
7. No `secret-reference` is expanded anywhere and no `secret-value` is rendered outside the in-process consumer; the global, accounts and token files are 0600 and `~/.fgos/private` is 0700; a symlinked config file or `.fgos` directory is refused.
8. Rust and Node read through one implementation; no JavaScript config parser or merger remains.
9. A reason of whitespace or a single generic word is refused; a line break in a reason never produces a key.
10. Migration keeps unknown sections and notes, passes the canonical equivalence check, writes a backup and removes the JSON file.
11. Config's own lock acquisition does not read config, and no Holder-lock path reads config (`rg -n "readPredecessorKillWaitMs|predecessorKillWaitMs" src packages apps test --glob '!target'` finds nothing).
12. Writing the project file cannot change any effective `gateway.*`, `secrets.*` (the `global-only` paths of section 3) or `bin.*` value, including through `null` or a `replace` at an ancestor; a project or global file holding an account pool or the token is refused with `config-key-in-wrong-file`.
13. A worker's edit to its linked worktree's config does not change any `command` value the merge gate or worktree setup executes.
14. A confined session's write through any door is refused with `config-write-confined`.
15. `show`, `explain`, `check`, doctor output and every error render `gateway.token` as `<redacted>`; no error contains a value or a source snippet.
16. A snapshot object in Node has no prototype; a `__proto__` key cannot change any object's prototype.
17. After migration, an older release reading the project refuses the tombstone and writes no `config.json`.
18. A confined worker cannot read anything under `~/.fgos/private` under any built-in policy, `hostRead: allow` included, and a run leased through the account pool still gets its one credential.
19. Migrating a project file drops every value equal to the standard, keeps every other value with its reason, lists every path whose effective value changes because of a machine's global file and stops without `--accept-machine-overrides`, and otherwise passes the effective-value equivalence check.
20. A move of an account pool or the token interrupted between its two writes leaves the key in both files, doctor reports it, and the destination wins.

## 16. Gates

| Gate | Status |
|---|---|
| G1 parser spike and costs | done 2026-10-22: two candidates round-trip byte-identically; N-API about 12 µs per call; digest check about 24 µs |
| G2 releases sharing `~/.fgos` | the machine check (`--machine-checked`) gates the global file conversion and the key moves; the machines that run Slice C are listed in the stateful records under `plans/reports/` (the live migration report and the activation guide), not here |
| G3 parse of real config files | done: no duplicate keys, no out-of-range integers |
| G4 addon and host on Windows | open; needs a Windows machine (the write verbs and `check` refuse there with `config-platform-unsupported`) |
| G6 confinement hides `~/.fgos/private` for every confined dispatch | done 2026-10-24: design in `docs/specs/confinement-authority.md` section 9.3, implemented by Slice D (commit `f0b79f31d`); the harness probe `machine-private-hidden` passes under every built-in policy and `hostRead` value on real bwrap, and its falsifier reads the planted file |
| G5 test fixtures | done: one shared helper (`test/helpers/config-fixture.mjs`) owns every test write of a config file, and `test/architecture.test.mjs` fails a test that writes one elsewhere; the default runner config copy is deleted and tests take the standard |

## 17. The six questions (platform L5)

1. **What to read first?** This spec and `docs/platform/yaml-document/spec.md`; the inventory report for today's readers and writers.
2. **What kind of work?** A new foundation component that replaces `src/config/`, the bypass readers, the write-on-read and the hand-written merges.
3. **What contract does it touch?** The config files of every project using fgOS, the new `~/.fgos/private` files and their readers (the gateway token reader in `gateway.rs`, the lease readers in `provider-capacity.mjs` and `llm-accounts.mjs`), the setup and doctor registry, the Holder-lock registry (two new locks), the section schemas and standard files (JSON Schema, one validator crate), the confinement hidden set (G6), the addon ABI marker, Seat Binding §5.1.
4. **How much risk?** High: every component reads config, and projects outside this repository carry these files. The equivalence check, the conflict rule, the deferred global migration and the machine-file moves on the owner's machines carry it.
5. **What proof means done?** The acceptance list as Rust tests with golden fixtures; one Node wiring proof per door; `npm test` and `cargo test --workspace` green.
6. **What learning is left?** Decisions below and in `distribution.md` and `seat-binding.md`; gate evidence in the spike report.

## 18. Lịch sử quyết định

- **2026-10-21: comments are documentation, every writer writes them.** Owner. The first proposal, that tools never rewrite a file a person edits, was withdrawn: it protected comments from writers instead of making writers carry them.
- **2026-10-21: two components, YAML Document below Config with a schema.** Owner direction; the panel (wf-run-1792598883803-72bd2251) agreed on two Rust authorities, no JavaScript fallback parser, reads that never write, and locks independent of Config.
- **2026-10-22: Node door is the native addon.** Owner, over the panel's alternative of a JSON projection plus spawn. Measured afterwards (G1): N-API about 12 µs per call against 3 to 40 ms per spawn.
- **2026-10-22: comment scope "đủ trong file".** Owner: `@fgos:doc` carries what the key does, its allowed values and its default; `@fgos:why` is required when a value departs from the default or inherited value; a hand edit without a reason is a doctor warning.
- **2026-10-22: Seat Binding §5.1 ladder rendered as `@fgos:doc`.** Owner, as owner of that contract; supersedes the representation clause of D-ADR0072 when this lands.
- **2026-10-22: global file migration deferred** until no release on any of the owner's machines reads or writes the JSON file; no dual-file view in this spec.
- **2026-10-22: the standard ships complete; config files hold only differences; accounts and token get their own files.** Owner: people change a few points, mostly account pools; capabilities, executors, tiers, patterns and workflows are rarely customised but need one standard set, independent of accounts, to copy from or read. Evidence: this repository's project file is 1557 lines, 1290 of them the capability and executor catalog, tuned by hand from a setup seed that every other project still carries stale (0 of 36 seeded capabilities still equal the seed), and stale seeded values already outlived two decisions (`rigorToTier`, the `invariantChecks` command). Owner chose: the release's standard is read-only and a file writes only the fields it changes (no whole-file eject); account pools and the token move to `~/.fgos/private/`, hidden from every confined worker whatever its `hostRead` (folds backlog item p-a189ff31). Folded from an independent review the same day (`plans/reports/review-261022-1316-config-spec-standard-and-machine-files.md`): redundancy judged against the standard only, migration stops on machine-override changes, one private directory instead of two hidden files so backups are covered, the confinement dependency named as gate G6, and the first standard authored from this repository's tuned catalog.
- **2026-10-22: security review folded in.** An independent review (`plans/reports/security-review-261022-0021-yaml-config-specs.md`) found that project-over-global with `scope: both` by default would let a pull request take over gateway auth and secret routing once the gateway reads the snapshot. Tightened in this spec without new mechanisms: explicit scope for non-public keys, ancestor and wildcard scope rules, the first-slice `global-only` list, `command` and `secret-value` sensitivities, command values read from the main checkout, confined sessions write no config, one-line reasons that cannot forge grammar lines, redacted errors, no-follow file opens, a second revision check before rename, a machine-scope global lock, a migration tombstone for older releases, and backups under `runtime/`. Three proposals that add mechanisms sit outside this component and are recorded as backlog items instead (approval of changed commands per machine and a merge-gate hold on command diffs, both runner policy; moving the token out of config before Secrets lands, an existing gap).
- **2026-10-22: signed.** The owner reviewed and signed this spec as a whole after the standard and private-directory revision and its review, together with the YAML Document spec.
- **2026-10-23: section schemas are JSON Schema draft 2020-12, authored as YAML.** Owner (10:54): config files stay YAML so people can edit them and keep comments; the schema must not invent a syntax, standard fields matter, and syntax and validator should be the best existing ones, which developers can maintain. Replaces the custom descriptor dialect (own types, `values`, `<any>` path segment, own value checker) with `type`, `enum`, `minimum`/`maximum`, `default`, `description`, `properties`, `additionalProperties`, `required`, `$defs`/`$ref`, plus annotations `x-fgos-scope`, `-sensitivity`, `-file`, `-merge`, `-absent`, `-suggestion`, `-justification`, `-owner`, `-version`. Reason: no reinvented dialect; the same dialect as the packages' contracts and the gateway's OpenAPI 3.1; an existing validator crate does the checking (chosen separately by the owner after a supply-chain review, adopted only after sign-off). Config keeps only loading, a small annotation lint, scope and placement, the snapshot, the write transaction, the comment grammar and redaction. Validation runs on the effective value, not on a lone file.
- **2026-10-23: corrections found by the Slice B plan.** Section 10 replaced by the settled fact (`a620881e7` removed every config read from Holder-lock; acceptance 11 adjusted); the registration count is 14, not 15 (15 and 17 came from `rg` also matching the function definition and two error strings); only `src/terminal-control/config.mjs:40` still has a `sectionOf` copy; the first standard's rule A (G-B2, 2026-10-23 10:40) recorded in section 4.
- **2026-10-23 11:45: shape and values are separate files; annotations reduced to the minimum.** Owner. `core/config-schema/<section>.schema.yaml` holds shape and meaning only (JSON Schema 2020-12); `core/config-standard/<section>.yaml` holds the release's standard values as a normal config file in the `@fgos:` format, validated by the schema like a project or global file; `fgos config standard` prints the standard files; precedence stays project over global over standard. Reason: a human-readable standard set that people can open, copy from or edit, while developers maintain shape in the schema and values in the standard. The JSON Schema `default` keyword is not used (the standard file is the one source of standard values, so nothing can drift; the lint refuses it). The annotations `x-fgos-version`, `-owner`, `-justification` and `-suggestion` are removed, leaving `x-fgos-scope`, `-sensitivity`, `-file`, `-merge` and `-absent`: the revision is the schema's `$id` (`urn:fgos:config-schema:<section>:v<N>`), the owner and the written justification of section 3 rule 1 live in `$comment`, and a setup suggestion is a value, so it is not schema (only the `invariantChecks` command ever used it; `init` takes such a value from setup code and writes it with `[setup:suggested]`). Supersedes the annotation list and the `default` row of the 10:54 decision. Validator pick recorded: `jsonschema` 0.60.0, conditional on the source review.
- **2026-10-25: Slice C, the Node door cutover.** One facade (`src/config/facade.mjs`) over the native `config` namespace replaced `shared-config-file.mjs`, `global-config.mjs` and every direct reader; the door returns JSON text that the facade turns into prototype-free objects; `init` is the one creation of a config file and `fgos setup` calls only it (a header-only file, never defaults); the machine view reads the global file, accounts and standard with no project; the `bin` cache left config for `~/.fgos/runtime/bin-cache.json`; the dispatch hook fails closed on a config refusal; the legacy `gate-bypass.json` is read only when the level came from the standard alone. Reason: one authority, reads that never write, no JavaScript merge to drift from the Rust one. Revert the landing with `git revert -m 1` of its merge commit `b6fac0706`.
