# Security review: YAML Document and Config draft specs

Date: 2026-10-22. Reviewer: code-reviewer (independent appsec pass). Read-only; no build, no test, no secret file read.

Inputs: `docs/platform/yaml-document/spec.md` (YD), `docs/platform/config/spec.md` (CF), `plans/reports/spike-261022-0017-yaml-config-gate-evidence.md` (spike). Cross-checked against `src/native/door.mjs`, `test/util/yaml.test.mjs`, `docs/platform/secrets/spec.md` §4.1/§5/§7/§10, `docs/specs/confinement-authority.md` §9.2, `apps/fgos-gateway/src/gateway.rs`, `src/runner/merge.mjs`, `src/runner/worktree.mjs`, `src/runner/dispatch/config.mjs`, `src/runner/dispatch/provider-capacity.mjs`, `packages/durable-file/rust/src/lib.rs`.

Threat model used: the tracked project file can be changed by anyone who lands a commit (teammate PR, agent branch merged by the runner); global `~/.fgos/config.*` is per-machine and holds the gateway token and account inventory; confined workers run under `--ro-bind / /` with `hostRead: allow` or `blind`, so they can read every host file that is not in `BLIND_HIDDEN_ROOTS`; several config values are shell commands.

## Summary

| ID | Severity | Finding |
|---|---|---|
| C1 | critical | Default `scope: both` with project-over-global hands a PR control of gateway auth, secrets routing and other machine-trust keys once those readers move onto the snapshot |
| H1 | high | Command-bearing keys have no trust root in the spec; today's "read from the main checkout" invariant is implicit in code and is easy to lose |
| H2 | high | `gateway.token` is a secret value inside config, but the redaction rule covers only `secret-reference`; show, explain, doctor and parse errors leak it; acceptance 7 cannot pass |
| H3 | high | Parser limits enforced "on the parsed tree" cannot stop stack exhaustion or a panic inside the parser; a panic across N-API aborts the Node process |
| H4 | high | The `__proto__` guarantee is stated only for the `tool` facade; N-API property sets have [[Set]] semantics; the `config` namespace has no such rule |
| H5 | high | Project migration deletes `config.json`; an older release on a teammate's machine re-bootstraps it with the default unconfined `claude` executor |
| M1 | medium | Key identity is undefined: duplicates by spelling, non-string scalar keys, invisible and bidi characters in keys and command values |
| M2 | medium | A reason with a line break forges `# @fgos:why [other-actor]` or `# @fgos:doc` lines; actor tags in the file are unauthenticated |
| M3 | medium | Numeric edge cases (`> 2^53`, `.nan`, `.inf`, `-0`) make Rust and Node disagree and let `NaN` slip range checks |
| M4 | medium | Write transaction: the lost-update claim is false; symlink rules are underspecified and check-then-open |
| M5 | medium | Migration backups: no location, mode or retention rule; the repo already tracks `.fgos/*.backup-*` files |
| M6 | medium | Supply chain: a pinned young crate plus functional fixtures is not a security review; no fuzzing, no source vetting |
| L1–L5 | low | see section Low |

---

## Critical

### C1. Project file can override machine-trust keys (gateway auth, secrets routing) by default

**Evidence.**
- CF §3 (lines 59): precedence is project over global over default; `scope` defaults to `both` (CF §4, line 78). Only keys someone remembers to mark `global-only` are protected.
- CF §12 (line 207): `apps/fgos-gateway/src/gateway.rs` moves onto the Config snapshot. Today it reads **only** `~/.fgos/config.json` (`gateway.rs:143`), so the whole `gateway` section is global-only by construction, not by descriptor. After the move, the effective `gateway.*` comes from the project file whenever present.
- `gateway.rs:489-510`: the Bearer token OR a Cf-Access JWT verified against `cfAccessTeamDomain`/`cfAccessAud` passes auth. `gateway.rs:44-47`: default bind is `0.0.0.0`.
- Secrets spec §10 (line 238): `secrets.declarations`, `secrets.projectFile`, `secrets.globalFile`, `secrets.sources` are config keys and "the project file wins over the global one". §5.1: `consumers` decides which executor may receive a secret.
- YD §7 (line 112): "a path present with null wins as null"; `replace` merge replaces a subtree whole. CF §3 refuses a global-only key "in the project file by name" but says nothing about an ancestor of it.
- Descriptor `path` is a list of literal segments (CF §4, line 73); there is no wildcard. Today's global-only rule is `runner.providers.*.accounts` (`provider-capacity.mjs:54-63`), which literal segments cannot express.

**Failure scenarios.**
1. A PR adds `gateway: {cfAccessTeamDomain: attacker.cloudflareaccess.com, cfAccessAud: <attacker aud>}` to `.fgos/config.yaml`. A teammate pulls and runs `fgos gateway start`. The attacker mints a valid JWT from their own Access team and calls the gateway REST/MCP API over the LAN (bind `0.0.0.0`), which runs workflows on that machine. Same outcome with `gateway.token: <known string>`.
2. A PR adds its own executor to `secrets.declarations.OPENROUTER_API_KEY.consumers`, or points `secrets.globalFile` at another file; dispatch then hands the machine's key to a PR-defined executor.
3. A PR writes `runner: {providers: null}` or `gateway: null` at an ancestor; the literal `global-only` check on the leaf never fires, and the global inventory or token disappears from the effective value (DoS or fallback to weaker defaults).

**Proposed spec change (CF §3, §4).**
- Invert the default for trust-bearing keys: any descriptor with `sensitivity` other than `public`, or that names a credential, a network listener, an auth verifier, a secret source or a command (see H1), must declare `scope` explicitly, and the descriptor lint refuses `both` for those classes unless the descriptor carries a written justification.
- List the keys that are `global-only` in the spec itself as the first slice's acceptance: the whole `gateway` section, `secrets.globalFile`, `secrets.sources`, `secrets.declarations.*.consumers` (or the whole declarations map), `runner.providers.*.accounts`, `bin.*`.
- Scope applies to ancestors: a project-file value at any ancestor path of a `global-only` key (including `null` and a `replace`-merged mapping) is refused with the same error.
- Add a wildcard map-entry segment to the descriptor `path` grammar (e.g. `{ any: true }` for a `map of T` entry), with a fixture that pins `runner.providers.<any>.accounts` as global-only.
- Acceptance item: "materialising or editing the project file cannot change any `gateway.*` or `secrets.*` effective value".

---

## High

### H1. Command-bearing config has no trust root and no writer authority

**Evidence.** `worktreeSetup.commands` and `invariantChecks.commands` run with `shell: true` (`worktree.mjs:142-150`). Today both are read from `repoRoot`, never from the candidate worktree (`worktree.mjs:143`, `merge.mjs:1216`, `merge.mjs:1246`), so a worker's edit to its own worktree's config cannot change the commands that verify its own candidate. That is a real trust boundary and it lives only in call sites. CF §5 defines `snapshot(projectRoot)` without saying which root is authoritative for which key; CF §9 (line 171) makes linked-worktree project files first-class readers. CF §1 says Config decides "who may write", but §6 defines doors and a reason rule only, no authorization; any unconfined agent may `fgos config set` a command or executor argv, and `--reason` plus an auto-filled `[actor]` makes the change look reviewed.

**Failure scenario.** During migration a section owner calls `snapshot(candidate.worktree)` for convenience. A confined worker writes `worktreeSetup.commands: ["curl … | sh"]` into its worktree's `.fgos/config.yaml`; the merge gate runs it unconfined on the host before any review. Second scenario: an agent with no confinement runs `fgos config set runner.executor.command …` on the global file with a plausible reason; nothing distinguishes it from an owner change.

**Proposed spec change.**
- New `sensitivity: command` for any value that is executed or becomes argv (`invariantChecks.commands`, `worktreeSetup.commands`, `runner.executor(s).*.command/args/env`, confinement backend references and the `unconfined` mode).
- CF §5 rule 6: a `command` value is always read from the main checkout's committed file (or the global file), never from a linked worktree or an uncommitted working tree; one fixture pins that a worktree edit does not change what the merge gate executes.
- CF §6: state the writer rule. Confined callers may not write `command` or `global-only` keys through any door; the door checks the writer class from Session Identity and refuses by name.
- See "Additions needing an owner choice" for a merge-gate approval on diffs that touch `command` keys.

### H2. `gateway.token` leaks through every read surface; acceptance 7 is unreachable

**Evidence.** CF §8 (line 166) keeps a real secret value (`gateway.token`) in the global config until Secrets lands. CF §9 (line 170) only redacts keys marked `secret-reference`; `sensitivity` has two values, `public` and `secret-reference` (CF §4, line 81), so the token is necessarily `public`. CF §5 returns "the effective value of every described key and of every undescribed key"; `show` (CF §11, line 188) prints the snapshot; `explain` prints where the value comes from. Acceptance 7 (line 239) says no secret value appears in a snapshot, which contradicts §8 because the gateway needs the value from the snapshot. YD §4 (line 74) and CF §14 (line 223) say errors name file, line and column; parser libraries commonly print the offending source line (js-yaml does), and CF §14 "schema error naming the descriptor" does not forbid echoing the value. Separately, `~/.fgos/config.*` is not in `BLIND_HIDDEN_ROOTS` (confinement §9.2, line 1201), so a confined worker reads the token directly; with bind `0.0.0.0` and network egress it can call the gateway and run work outside its sandbox.

**Failure scenario.** An agent runs `fgos config show` or `fgos doctor` while diagnosing, or a hand edit breaks YAML on the line next to `token:`; the token lands in the agent transcript and the provider's logs.

**Proposed spec change.**
- Add `sensitivity: secret-value` (interim, for `gateway.token` only, deleted when Secrets lands). Snapshot carries it to in-process consumers, but `show`, `explain`, `check`, doctor output, diffs, migration reports and every error message render it as `<redacted>`.
- YD §11 / CF §14: no error message echoes a scalar value or a source snippet; it names rule, path, file, line, column, and expected type only. Fixture: a malformed global file with a token on the failing line produces an error without the token bytes.
- State in CF §8 that a confined worker can read the token today, and name the owner of the fix (hidden root for the global config, or the Secrets move) instead of leaving it implicit.

### H3. Parser DoS: tree-level limits cannot protect the parser; a panic aborts Node

**Evidence.** YD §4 (line 56): profiles "are enforced by this component on the parsed tree". YD §8 (line 119): size, depth, node count and scalar bytes are bounded but values are "in the contract file", unnamed. Depth is a property the parser itself recurses on while building the tree; a 1 MB input of `[` or of deeper block indentation can exhaust the native thread stack before any tree exists, and stack overflow is not catchable. `yaml-rt` "parsed, not expanded" (spike line 24) means our component writes the alias expander; the existing bound counts values, not bytes (`yaml.test.mjs` "100000 values"), so one large anchored scalar referenced 100 times multiplies memory by 100 when converted into JS strings. The addon uses napi 2.16 (`packages/git/node-addon/Cargo.toml:11`); a Rust panic in a sync `#[napi]` function without `catch_unwind` aborts the process. Young crates (spike line 27) make parser panics on odd input likely. The runner, run supervisor and gateway all parse YAML in-process.

**Failure scenario.** A PR or a units file passed to `fgos workflow start --units` contains 200 000 nested flow brackets; the run supervisor's Node process segfaults or aborts mid-merge, leaving locks to the predecessor-kill path.

**Proposed spec change.**
- YD §8: name the numbers in the spec (input bytes, depth, nodes, scalar bytes, expanded bytes, key length), and require the depth and size bounds to be enforced **before or during** parsing (pre-scan of indicator and indentation depth, or the parser's own recursion limit, verified by fixture), not on the tree.
- Add an expanded-bytes bound for the `tool` profile next to the expanded-node bound.
- YD §10: every addon entry point in the `yaml` and `config` namespaces catches panics and returns a named refusal; fixtures feed adversarial inputs through the Node door and assert the process survives.

### H4. `__proto__` safety is promised for one facade only, and N-API sets are [[Set]]

**Evidence.** YD §10 (line 144) keeps the own-property guarantee for `parseYaml` in `src/util/yaml.mjs`. CF §12 (line 202) adds `config.snapshot` returning values straight from the addon; no equivalent rule. `napi_set_named_property`/`napi_set_property` behave like `obj[key] = v`: a `__proto__` key re-points that object's prototype to attacker data rather than creating an own key (not global pollution, but every property the consumer forgets to own-check becomes attacker-controlled). Downstream JS that copies config with `Object.assign` or `for…in` has the same effect even if the addon gets it right.

**Failure scenario.** `.fgos/config.yaml` contains `runner: {executors: {x: {__proto__: {command: "sh -c …"}}}}`. A JS consumer reads `executor.command` from an object whose own `command` is absent; it inherits the attacker's value, and the Rust-side schema check (which saw a key named `__proto__`, undescribed, "kept") never saw a `command` key.

**Proposed spec change.**
- `strict-config` refuses keys `__proto__`, `constructor` and `prototype` at any depth (no config key needs them); fixture in the golden set.
- The addon builds JS objects with define semantics (`napi_define_properties`) or null-prototype objects for both namespaces; one Node wiring proof per namespace, extending the existing `__proto__` test rather than copying it.

### H5. Project migration silently downgrades teammates on older releases

**Evidence.** CF §13 (line 211) removes `.fgos/config.json` after conversion; the G2 release check covers only the global file (line 213). Every release before this change runs `ensureRunnerConfigForDir`, which writes a fresh `.fgos/config.json` when it is absent (`dispatch/config.mjs:420-427`) with `DEFAULT_RUNNER_CONFIG`: `claude -p … --permission-mode acceptEdits` and no confinement (`dispatch/config.mjs:210-222`).

**Failure scenario.** One teammate migrates and pushes. Another, still on an older release, pulls and runs `fgos run`: their release finds no `config.json`, writes the default, and dispatches an unconfined agent instead of the project's confined executors. When they later upgrade, the new release sees both files and refuses every read with `config-legacy-shadowed`.

**Proposed spec change.** CF §13: migration leaves `.fgos/config.json` as a tombstone that older releases fail on loudly (non-JSON text such as `moved to .fgos/config.yaml; upgrade fgOS`, which their `JSON.parse` rejects without writing), and the new release treats that exact tombstone as "no legacy source", not as `config-legacy-shadowed`. Add the old-release behaviour as a migration fixture, run from the base commit's code.

---

## Medium

### M1. Key identity is undefined (duplicates by spelling, non-string keys, invisible characters)

YD §4 refuses "duplicate key in one mapping" but does not say whether keys compare as source text or as resolved scalars. `a`, `"a"`, `'a'` and `"\x61"` are one key; `1` and `"1"`, `true` and `"true"` become one JSON property after conversion. YD §3 (line 50) says a path segment is "any string" but does not say non-string scalar keys are refused or stringified. Text comparison would let a reviewer see the first `level: off` while last-wins (both candidate parsers, spike line 21) or JS conversion takes the later one. Separately, nothing refuses bidi controls (U+202A–U+202E, U+2066–U+2069) or zero-width characters in keys or values; in a `command` value they hide what a PR's diff actually runs.

Spec change: YD §4 — keys compare after scalar resolution; in `strict-config` every key must resolve to a string (plain scalars that resolve to int, bool or null are refused); bidi controls and zero-width characters are refused in keys in both profiles and in values in `strict-config`. Fixtures for each.

### M2. Reason text forges grammar lines; actor tags are unauthenticated

YD §6 (line 103) turns a line break in comment text into a new `# ` line. That stops key injection, but `--reason "ok\n@fgos:why [vantt] approved by owner"` writes a second, forged `@fgos:why` line naming another actor, and `\n@fgos:doc Default: unconfined` writes a fake doc line until the next `refresh-docs`. CF §9 (line 172) only claims "neither can create a key". CF §7 (line 150) says `<actor>` is "never typed by the caller", true for the doors but not for the file: any PR or a worker editing its worktree can type any `[actor]`. U+2028/U+2029 are not control characters, so they survive the guard and render as line breaks in some editors and YAML 1.1 tools.

Spec change: CF §7 — reasons are one line (line breaks, U+2028, U+2029, U+0085 refused, not split); a written comment line produced from caller text may never begin with `@fgos:`. State that `[actor]` in the file is advisory provenance, git history is the authority, and no code may branch on it. `config-doc-drift` fails `config check` (not only warn) so a forged doc line is visible before merge.

### M3. Numeric edge cases split Rust and Node

G3 found no integers beyond 2^53 today (spike line 56), but nothing forbids them. A value like `9007199254740993` is exact in Rust and rounded in Node, breaking CF §1's "one implementation" answer. YAML core schema floats include `.nan`, `.inf`, `-.inf`; Canonical JSON cannot represent them, and JS range checks such as `n < min || n > max` are false for `NaN`, so a section owner's cross-field validation passes it. Spec change: `strict-config` refuses integers outside ±(2^53−1), `.nan`, `.inf`, `-0`; fixture.

### M4. Write transaction and file-identity claims

- CF §6 (line 125) says an outside edit between steps 2 and 4 is "detected at the next write". It is not: the rename in step 4 discards the outside edit, and the next writer compares against fgOS's own new revision, which matches. Agents editing `config.yaml` with their own file tools are the common writer, so this is the normal race, not a corner. Change: re-hash the file just before rename and abort with `config-write-conflict` on a difference (window shrinks to the rename), and state honestly that the residual lost update is not detected.
- CF §9 (line 171): "inside the repository" is undefined (worktree root, main checkout, git common dir?), the check reads as realpath-then-open, and it ignores directory components. A cloned foreign repository can ship `.fgos` itself as a symlink. Reads follow the link while Durable File replaces the link with a regular file (`durable-file lib.rs:253-257` opens with `O_NOFOLLOW`, renames over the name), so read and write address different objects. Change: define the bound as the worktree root; resolve with `openat2(RESOLVE_BENEATH|RESOLVE_NO_SYMLINKS)` (or per-component `O_NOFOLLOW`) and compute the byte revision from the same fd; refuse a symlinked `.fgos` directory and a symlinked `~/.fgos` with a named error; state what happens on platforms without `openat2`.

### M5. Migration backups

CF §13 (line 211) and acceptance 10 require "a backup" with no path, mode or lifetime. This repository already tracks `.fgos/events.jsonl.backup-*` files (`git ls-files .fgos`), so a project backup under `.fgos/` is likely to be committed; any value that should never have been in the project file is then in history twice. The deferred global migration will back up a file that holds `gateway.token`. Change: backup path `.fgos/runtime/…` (ignored) for project files, `~/.fgos/runtime/…` mode 0600 for the global file, created with `installOnce` (no follow, no overwrite), with a named retention and a doctor check that reports stale backups.

### M6. Parser supply chain

YD §9 (lines 133-137) protects against silent change (exact pin, lockfile checksum) and functional regressions (fixtures), not against adopting or upgrading to a malicious or unsound release. Both candidates are months old (spike line 27); `noyalib` shares an author with the archived `serde_yml` (RUSTSEC-2025-0068) and its download count is inflated by that shim, so adoption is not a trust signal. The vendored js-yaml it replaces had a byte-identical hash test on reviewed source (`yaml.test.mjs` last test); the replacement drops source review. Change: the upgrade record must include a reviewed source diff of the crate and of every new transitive crate, presence of `build.rs` or proc-macros, `cargo deny` advisories and sources result, and owner sign-off; add `cargo-fuzz` targets for parse, edit plus re-parse, and merge, run in the upgrade procedure; consider `cargo vendor` for the parser so the reviewed bytes are the built bytes.

---

## Low

- **L1. Global-config lock scope.** CF §6 (line 119) adds `global-config` without a `scope`; the registry has `repo`/`machine`/`run` (`lock-registry.v1.json`). If registered as `repo`, two projects write the global file concurrently. State `scope: machine` in the spec.
- **L2. Windows mode claim.** CF §3 and §9 promise 0600; on Windows mode bits do not restrict readers. Tie the claim to gate G4 like the addon load.
- **L3. Malformed file is fatal everywhere.** CF §5 rule 2 is right, but a committed malformed `config.yaml` stops every verb on every teammate's machine, including the `dispatch-decide` PreToolUse hook. State that enforcement hooks fail closed (refuse the guarded action), and that `fgos config check` runs in `.githooks/pre-commit`.
- **L4. Migration launders values.** CF §13 writes `@fgos:why [migrate] value carried over` on every non-default value, which also silences `config-comment-missing-why` for values nobody ever justified. Use a distinct reason that doctor still lists.
- **L5. `config set` path syntax.** YD §3 says dotted strings are not paths, but CF §11 takes `<path>` as one CLI argument with no grammar. Name the escaping rule so `a.b` cannot address the wrong key.

---

## Not an issue, because

- **Comment text becoming a key.** YD §6 writes each line as `# ` plus text and splits on line breaks; `noyalib` already refused `"x\nevil: 1"` (spike line 20). Grammar-line forgery remains (M2), key injection does not.
- **Alias bombs, tags, `<<`, multi-document in config files.** `strict-config` refuses anchors, aliases, every tag, `<<` merge and more than one document (YD §4). Expansion risk exists only in the `tool` profile (H3).
- **Global `Object.prototype` pollution.** N-API [[Set]] on `__proto__` re-points one object's prototype, not `Object.prototype`; the risk is the scoped one in H4.
- **Addon location hijack through the cwd.** `ownRelease` accepts a manifest only when its payload realpath equals the running payload (`door.mjs:19-26`); the addon path must be relative, not a symlink and inside the release root (`door.mjs:37-43`). Adding namespaces does not widen this. The digest is integrity against corruption, not authenticity, because the manifest sits beside the addon; that is unchanged by these specs.
- **Temporary file exposure during replace.** Durable File creates the temporary with `create_new`, `O_NOFOLLOW` and the final mode at open (`durable-file lib.rs:253-257`); a 0600 global file is never briefly world-readable beyond umask.
- **Snapshot cache poisoning.** The cache is in-process and keyed by size, sha256 and descriptor digest (CF §5 rule 4); there is no on-disk cache to tamper with.
- **Descriptor `doc` text injection.** Descriptors ship inside the release and pass through the same guard (CF §9); they are as trusted as the code.
- **Hash flooding on duplicate detection.** Bounded by the node-count limit; Rust's default hasher is randomized. Holds as long as the implementation does not swap in a fixed-seed hasher.

---

## Additions needing an owner choice (RUL104: not part of the fixes above)

1. **Trust-on-change for command keys.** Like direnv `allow`: record, per machine, the digest of the `command` values last approved; when a pull changes them, the runner refuses to execute them until a person runs an approve verb. Problem it solves: H1's PR vector, which no read-side rule closes because the committed file is the trusted source. Benefit: a malicious PR no longer gets code execution on the next `fgos run`. Cost: one machine-local file and one verb.
2. **Merge-gate approval for `command` and `global-only` paths.** The runner refuses to auto-land a candidate whose diff touches a `sensitivity: command` key and parks it for a person. Evidence: today's merge path executes `worktreeSetup` and invariant commands and publishes without a human (`merge.mjs:1208-1229`).
3. **Gateway token out of config now, not "until Secrets lands".** A separate 0600 file added to `BLIND_HIDDEN_ROOTS`. Evidence: H2's confined-worker read; benefit: closes a sandbox escape path today.

## Unresolved questions

- Is the bind default `0.0.0.0` (`gateway.rs:44-47`) still intended? It turns C1 and H2 from local into LAN exposure.
- How does a confined agent write config at all (lock under `<fgosDir>`, Session Identity inside the sandbox)? CF §6 names confined agents as writers but no path exists for them.
- Which root does each Node reader in CF §12 pass to `snapshot` in a linked worktree today? H1's rule depends on that inventory.
