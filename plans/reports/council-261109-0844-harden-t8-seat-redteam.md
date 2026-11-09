# HARDEN T8 council: red-team seat (Skill/Domain)

Main `ae6d634ff` (origin/main when written; `27b2c580c`, the owned-files guard fix, is already in it). Written 2026-11-09 08:44 to 09:00 (Asia/Saigon) on fg-server2 in the linked worktree `t8-redteam-seat`. Lens: adversarial. The threat model is a careless agent with a shell, a hostile pulled branch or project (a symlink or YAML name in a skill, persona or domain tree), a foreign tool (AgentKit) that shares our directories, and drift nobody sees. Read-only: this report is the only repository file written.

Citations glossed once: **RUL104** (better, not bigger: harden what exists, add no mechanism without the owner), **L10** (add through the door, not alongside it: move every caller and delete the old path in the same change), **design principle 1/7/8** (one door, one authority, one owning proof per behaviour).

## What I ran

- **Read in full:** `src/setup/skill-wrappers.mjs` (copy, wrapper, mirror, assemble, discover, prune: 55-360, 630-1363), `scripts/build-skill-wrappers.mjs`, `scripts/project-agents.mjs`, `src/setup/instruction-projections.mjs` (path, splice, write), `src/runner/worktree.mjs` (`runWorktreeSetupCommands`, `provisionWorktree`), `scripts/build-rust-distribution.mjs` (path class and symlink refusal), `core/skills/distill/scripts/distill.mjs` (add, delta, git), `core/skills/_shared/private-cell-worktree.md`, `domains/coding/skills/_shared/coding-cell-policy.md`, `domains/coding/AGENTS.md`, `domains/marketing/AGENTS.md`, the `fgos-routing` text on doctrine, `.gitignore` skill rules, the two guard tests.
- **Grepped across** `core/skills`, `domains/*/skills`, `plugins/fgOS/skills`, `.claude/skills/ui-spec`, `domains/*/instructions` for destructive commands (`rm -rf`, `git reset --hard`, `git clean`, `--force`, `git stash`, `git add -A`, `pkill`, `kill -9`, `--no-verify`, `worktree remove`, `branch -D`) and for `allowed-tools`, `hooks:`, bang-command lines, `$ARGUMENTS`.
- **Reproductions** with scripts in the session scratchpad (`t8rt/repro.mjs`, `t8rt/pa.mjs`, scratch repos under `/tmp`, removed after): importing the worktree's `skill-wrappers.mjs`, `HOME` set to an empty dir.
- **Ran for real in the worktree:** `node scripts/build-skill-wrappers.mjs` (once, twice), `npm pack --dry-run --ignore-scripts`.
- **Not done:** no test file run (the two former reds are fixed on this main and I did not re-run the layer's 22 files), no Cargo build, no agent or seat dispatched, the program board not read (this report neither starts, finishes, blocks nor lands a lane). I did **not** reproduce the baseline's K3 (the skip-worktree removal refusal): `build:skills` died at the YAML parse before it reached the projection write.

## Baseline claims, checked against code

| Baseline claim | Result |
|---|---|
| K1 two reds in any worktree | **Already fixed** on this main by `27b2c580c` (`ownedFileSet` in both guards, `scripts/lib/git-ports.mjs:35`). H1 is done. The comment above `WIDE_SWEEP_ROOTS` (`check-decision-citation-drift.mjs:317-321`) still says "known, accepted duplicate" and the root still lists `.agents/skills` |
| K2 `build:skills` exits 1 in a checkout after writing | **Confirmed**: exit 1, `InstructionRegistryError ... git-addon-unavailable`, 125 `wrote ...` lines before it; tracked tree stayed clean |
| K4 wrapper step treats every `.agents/skills` dir as ours | **Confirmed**, and worse than stated (R-2) |
| K5 dead Gemini path | **Confirmed**: `generateGeminiSkillPackage`, `SKILL_ADAPTER_TARGETS`, `isGeneratedAdapterTarget`, `isCanonicalSkillSource`, `deriveSkillIntentId`, `mapSkillIntentToHostTriggers`, `discoverSharedFragments` are named only by `test/setup/skill-wrappers.test.mjs`. `createProjectSkillGuard` is named by **no** test file (K8 says "2 tests"; they reach it through `materializeSkillsIntoProject`) |
| K7 three dead fragments | **Confirmed**: `catchup-self-recovery.md` no reader, `coding-cell-policy.md` no reader, `private-cell-worktree.md` read only by `coding-cell-policy.md` |
| K10 14 domain `readdirSync` loops | My pattern finds 16 in `src scripts bin`; "at least 14" holds |
| 2.1 mirror copies `fgos-*`, `distill`, `instruction-audit` into the plugin | **Wrong**: `isMirroredDevSkillName` (`skill-wrappers.mjs:330-332`) is `_shared` or `fgos-*`; `plugins/fgOS/skills` holds neither `distill` nor `instruction-audit` |
| K12 / the ak copy step | **Confirmed live**: this fresh worktree holds 104 `ak-*` dirs in `.claude/skills` and `.agents/skills` straight after `fgos worktree create` |

## Part A: target shape (red-team view; line budgets are the other seats' call)

| Component | Authority (what it alone decides) | Contract and ports | Rust/Node, Node budget | Delete list (this lens) | Doctor rows kept | Size target |
|---|---|---|---|---|---|---|
| **Source skills and doctrine** (`core/skills`, `domains/*/skills`, `_shared`, `domains/*/AGENTS.md`, `domains/*/instructions`) | What a skill or doctrine says. Never what the host may run: no `allowed-tools`, `hooks:` or bang line exists today and a lint keeps it so | One dir per name; a doctrine file is read from the **payload**, never the project cwd (R-5) | Markdown; no code | the 3 dead fragments (K7, -284 lines, x3 copies), the stale GitNexus block in `domains/coding/AGENTS.md:46-89` (44 lines, foreign tool, 19 129 symbols against the real 58 821), the four "never" rules there that `domains/coding/instructions/worktree-safety.md` already projects (one authority) | none | -330 source lines |
| **Render pipeline** (`skill-wrappers.mjs`, `build-skill-wrappers.mjs`) | **Which names fgOS owns**: exactly the set `discoverCanonicalSkills` returns, plus `_shared`. Every step (assemble, wrap, mirror, prune) touches only those names and only files carrying our exact stamp | Three pure steps over one owned-name set; one copy leaf that uses `lstat` and refuses a symlink (the rule `scripts/build-rust-distribution.mjs` `collectSourceFiles` already applies to the release payload); the script stages the addon like its siblings | Node, no move. Budget: no growth after the Gemini cut (about 1 362 to 950) | Gemini generator and adapter classifier (H4, owner decision), `isGeneratedWrapper` and `carriesAssembledHeader` substring proofs replaced by one anchored check | none (guards below) | about -400 |
| **Render surfaces** (`.agents/skills`, `.claude/skills`, `plugins/fgOS/skills`) | Nothing: pure functions of the source. A tracked file there that the render did not produce is drift | Committed set = rendered set, proven by tests | n/a | the `.gitignore` per-name allowlists, once one test proves "every owned skill has a tracked wrapper" (R-6) | none | n/a |
| **Persona projection** (`scripts/project-agents.mjs`) | The file name of a projected persona is the **source file stem**, validated by the loader's own name rule; it never overwrites a file that lacks its stamp | `name` from YAML must equal the stem (R-1) | Node | `def?.name ?? file.name` as the path source | `agent-type-names-unique` | about +10 |
| **Domain data and registry** | Work's. Untouched here | see WORK-owned list | Node | none | `domain-registry-compiled`, `domain-workflow-operations-coverage` | no change |
| **Guards** | One owning proof each: drift (render equals tracked `.agents/skills`), mirror (wrapper and plugin equal their byte derivation), tracked-set (R-6), instruction projection current | tests only; no doctor row (T8 already moved them) | Node | none | none | +1 test |
| **Instruction projection write** (`instruction-projections.mjs`) | The content of the managed block and nothing outside the markers | already refuses malformed markers and symlinked paths; the write becomes temp-and-rename (R-8) | Node | none | none | about +6 |

Rust: no move (agree with the baseline). The one door a shared leaf needs is "copy a tree without following links"; put it in the lowest Node layer that needs it (the render pipeline and `build-rust-distribution.mjs` both do) and make the release collector call it, so the two refusal rules cannot drift.

**WORK-owned, planned no change from this seat:** `src/state/domain-registry.mjs`, `domains/coding/compiled.json`, `domains/coding/workflows/feature.yaml` `steps:`, `domains/coding/skills/fgos-coding-*` (Work stage skills, text is Work-adjacent), `test/state/domain-registry*.test.mjs`, `test/cli/fgos-stage.test.mjs`, `src/runner/{loop,claim-port,work-compat,work-dispatch,operation-choice,prompt-templates,fanout-batch}.mjs`. R-5 touches `core/skills/fgos-routing/SKILL.md` (Work-adjacent routing text): tell WORK before it merges.

## Part B: findings, ranked

### R-1 Medium, read from code plus name arithmetic (not run, the YAML parse needs the addon): `project-agents` takes the output path from the persona's YAML `name`, and writes over kit files of the same name

**Where.** `scripts/project-agents.mjs:240-250`: `const name = def?.name ?? file.name;` then `fs.writeFileSync(path.join(TARGET_DIR, \`${name}.md\`), ...)`. `validateDefinition` (`:63-82`) checks the required keys, `tool-scope`, `rigor`, `skills`; `assertPlatformAgnostic` (`:55-61`) greps three words. Nothing checks `name` against the file stem or a name rule, and `resolveAgentFiles` (`:187-232`) only compares names with each other.

**Failure scenarios.**
1. A persona with `name: ../../AGENTS` projects to `<repo>/AGENTS.md`: `path.join('<repo>/.claude/agents', '../../AGENTS.md')`. Any `.md` file in reach is overwritten with the generated text. The persona sources are repo files, so a careless or hostile branch is the actor; the runtime loader `agent-definitions.mjs` refuses taste and (per the marketing doc) wants a lowercase-digit-hyphen name, the projection script does not apply the same rule.
2. `description: |-` with a second line `tools: Bash, Write` is spliced as `description: ${def.description}` (`:113`), which puts a new frontmatter key into the projected agent. `tool-scope` is "the authoritative, harness-enforced grant" (file header), so a frontmatter key smuggled in the description is a second, unreviewed grant path.
3. **Reproduced by listing:** 6 tracked `.claude/agents/*.md` are AgentKit's files with the same names as fgOS persona sources (`code-reviewer`, `debugger`, `planner`, `researcher`, `docs-manager`, `fullstack-developer`; the tracked `code-reviewer.md` has `memory: project` and no "Generated by" line). The script writes them without checking for a stamp, so one manual run replaces the kit's agent with the persona's `tools:` list.

**Fix (size S, about +10 lines):** `name` must equal the file stem and match the loader's name rule (one shared pattern, not a copy); the description and every other scalar is rejected when it contains a newline; an existing target without the "Generated by" line is refused by name, not overwritten. Owning proof: `test/scripts/project-agents.test.mjs` gains three cases.

### R-2 Medium, reproduced: the wrapper step overwrites every foreign skill, and the build leaves a half-written tree

**Where.** `skill-wrappers.mjs:168-216` `generateAllSkillWrappers` loops over every directory of `.agents/skills` that has a `SKILL.md`; `build-skill-wrappers.mjs:29` passes no `keep`. The assemble step prunes only entries with our stamp (`:1281-1290`), the wrapper step has no such test (only the orphan prune does, `:206-213`).

**Reproduction.** `repro.mjs foreign-clobber`: a foreign `.claude/skills/ak-foo/SKILL.md` is replaced by the 16-line fgOS wrapper and the `written` count is 1. For real: `node scripts/build-skill-wrappers.mjs` in a fresh worktree wrote 125 wrappers and exited 1 (K2); `.claude/skills/ak-cook/SKILL.md` went from AgentKit's 74 lines to the 18-line wrapper. Then AgentKit's next install rewrites it back (the flip-flop of backlog row `p-7eb9e65b`), and the wrapper's redirect text ("Read that file and follow it directly") now points at whichever copy `.agents/skills` happens to hold.

**Fix (size S):** the wrapper loop takes the owned-name set that `assembleSkills` already computes (the names of `discoverCanonicalSkills` plus `_shared`), not `readdirSync`; `build-skill-wrappers.mjs` calls `ensureAddonForScript()` first like `build-domain-registry.mjs` and `project-agents.mjs`. No new mechanism; closes K2 and K4 together. Owning proof: one case in `skill-wrappers.test.mjs` "a foreign skill dir in `.agents/skills` and `.claude/skills` is left byte-identical".

### R-3 Medium, reproduced: the copy leaf follows symlinks, so a skill source can pull a local secret into a tracked surface, write outside the tree, or crash the prune

**Where.** `copyDirRecursive` (`:309-321`) uses `entry.isDirectory()` (false for a link) and falls through to `copyFile`, which is `copyFileSync` (follows links); `copyAssembledFile` (`:1177-1193`) reads with `readFileSync` (follows); `carriesAssembledHeader` (`:1198-1204`) uses `statSync` and recurses.

**Reproductions** (`repro.mjs`):
- `symlink-file`: `core/skills/s1/notes.txt -> /tmp/.../secret.txt`; `assembleSkills` wrote `.agents/skills/s1/notes.txt` containing `TOPSECRET`. `.agents/skills/fgos-*` is tracked, so `git add -A` then commits a copy of whatever the link named (a hostile branch adds the link, the maintainer runs `build:skills`). The release collector refuses links (`build-rust-distribution.mjs` `collectSourceFiles`), the render step does not.
- `symlink-target`: a pre-existing `.agents/skills/s1 -> /outside` made `assembleSkills` write `SKILL.md` into `/outside`. The same shape holds for `fgos setup` into a project whose `.claude/skills/<name>` is a planted link (the writer follows it; what is written is only our own files, so the damage is bounded to our known file names, but it is outside the project).
- `dangling-prune`: a foreign dir with a dangling link made `assembleSkills` throw `ENOENT`, and a looping link `ELOOP`, in the prune step (`:1286`), after the copies and before the wrappers: `build:skills` aborts half done. AgentKit dirs hold no links today (`find -type l` is empty in all five roots), so this is latent.

**Fix (size S, about +10, one shared leaf):** one `copyTree`/`readOwnedFile` that `lstat`s, refuses a link by name, and is used by `copyDirRecursive`, `copyAssembledFile`, `carriesAssembledHeader` and the release collector (L10: one door). Owning proof: the existing `skill-wrappers.test.mjs` copy cases gain "a link in a skill source is refused by name".

### R-4 Low/Medium, reproduced: ownership is a substring test

`isGeneratedWrapper` (`:146-153`) and `carriesAssembledHeader` (`:1203`) test `includes(marker)` anywhere in the file. `repro.mjs marker-quote`: a foreign `.agents/skills/kit-doc` that merely quotes the assembly header survives, but a foreign `.claude/skills/kit-doc/SKILL.md` that quotes the wrapper marker is **deleted** by the orphan prune once its `.agents` twin goes. A skill that documents our wrapper format (a skill-authoring kit does) loses its dir. **Fix (size S):** anchor the proof to the exact generated shape (frontmatter, then the marker as the first body line; the header as the first body line of an `.md`). Owning proof: one case each next to the existing prune tests.

### R-5 Medium, reasoned (no Node reader found; the skill text is the reader): domain doctrine is read by a cwd-relative path, so an external project injects its own, and the shipped one is stale

`core/skills/fgos-routing/SKILL.md:180-181,232`: "read `domains/<domain>/AGENTS.md` ... to load domain-specific standing doctrine". `materializeSkillsIntoProject` copies only `.agents/skills`; nothing copies `domains/` into a project (grep of `src/setup`, `bin/fgos.mjs`). So in a project that uses fgOS (mission 1) the path resolves in the project's cwd: either nothing, or a **project-authored `domains/coding/AGENTS.md` read as "standing doctrine"** with the authority of a shipped skill (hostile pulled project, or a stale local file). The item's `domain` is safe (`store.mjs:173-178` validates it against `DOMAINS`, so no `../` reaches the path), the path *root* is the gap.
The shipped file is also wrong: lines 46-89 are a GitNexus managed block (committed 2026-08-20; "19129 symbols"), which tells every routed session "MUST run impact analysis before editing any symbol" and contradicts the root AGENTS.md capability gate ("0 providers registered: inactive, skip"). Lines 9-44 duplicate `domains/coding/instructions/worktree-safety.md` (already projected into the AGENTS.md managed block): principle 7 (one authority).
**Fix (size S, docs plus one skill sentence):** delete the foreign block and the duplicated prose, leaving the one thing only this file says; change the skill to read the file from the payload by the path `fgos` reports (feature idea F-2 if no verb gives it today). WORK to be told (`fgos-routing` is Work-adjacent).

### R-6 Medium, reproduced by listing: a surface can diverge with no guard seeing it

`.gitignore:65-78`: `.claude/skills/*` is ignored except `fgos-*`, `distill`, `_shared`; `.agents/skills/*` except `fgos-*`, `distill`, `instruction-audit`, `_shared`. So `instruction-audit` has a tracked `.agents` render and a **generated but untracked** `.claude/skills/instruction-audit` (present in the main checkout, absent in every clone and worktree; `git ls-files .claude/skills` has no entry). The mirror test filters by name (`fgos-mirror.test.mjs:48`), so it never looks. A new core skill not named `fgos-*` gets the same silent gap. The allowlist of names now lives in `.gitignore` x2, `isMirroredDevSkillName`, the test filter and the worktree copy line: five places for one fact.
**Fix (size S):** one test "every name `discoverCanonicalSkills` returns has a tracked `.claude/skills/<name>/SKILL.md` and a tracked `.agents/skills/<name>`" (through `ownedFileSet`), then add the one missing `.gitignore` line. Rejected: more allowlists. Owning proof: that test, in `test/skills/fgos-mirror.test.mjs`.

### R-7 Low, reproduced for the name, reasoned for the URL: `distill` writes where the name says and prints an unquoted clone line

`distill.mjs:123-125` `sourcePath(root, name)` joins an unvalidated `name`: `add ../../../escaped --type git-repo --url x` created `<root>/escaped.md` (reproduced; fixed template content, only `.md`). `:287,295` print `git clone ${args.url} ${CLONES_DIR}/${name}` for the agent to run; a URL beginning with `-` (or a transport such as `ext::`) is option or transport injection if an intake row is taken from a web page (reasoned; git's default refuses `ext::`, a leading `-` is not refused by `git clone` without `--`). `meta.local` from a source file's frontmatter is joined into the clone path (`:150`); the pull is guarded by a prefix check (`:297`), the read-only `git -C` calls are not. **Fix (size S):** `name` must match `^[a-z0-9][a-z0-9-]*$`; the printed line is `git clone -- <url> <dir>` and `add` refuses a URL not starting with `https://`, `ssh://` or `git@`.

### R-8 Low/Medium, reasoned: the managed block is rewritten in place

`instruction-projections.mjs:333-346` `writeIfChanged` calls `fs.writeFileSync(filePath, ...)` on `AGENTS.md` directly. The marker splice and the symlink guard (`:56-75`, `:159-183`) are sound; the write is not atomic, so a crash or `ENOSPC` mid-write truncates `AGENTS.md`, which also holds text fgOS does not own (the owner's uncommitted omp block, per the standing memory note). The render step has `atomicCopyFileSync` (temp then rename) in the same module family. **Fix (size S, about +6):** temp and rename in `writeIfChanged`, same helper as the render step (one door).

### R-9 Low, measured: `npm pack` ships the foreign kit

`package.json` `files` lists `.agents/skills` whole; `npm pack --dry-run` on this tree lists 2 646 files of which **1 747 are `.agents/skills/ak-*`** (22 MB unpacked). The package is `"private": true` and the real release path (`build-rust-distribution.mjs`, Git-aware) excludes ignored bytes, so this is latent, but the baseline's section 4 option 5 ("not available") should also say the pack list is the other door. **Fix:** `files` names the owned skill dirs the way `.gitignore` does, or drops `.agents/skills` (setup assembles from `core/` and `domains/` already). Decide together with R-6 so the name list lives in one place.

### Cross-layer notes (not T8's, kept so they are not lost)

- `worktreeSetup.commands` (`src/runner/worktree.mjs:141-163`) runs shell lines from the **main checkout's** project config on every `fgos worktree create`; a pulled project whose tracked `.fgos/config.yaml` carries a hostile line runs it. The read from the main checkout correctly blocks a worker's own edit; the trust of a pulled project's config is the config component's decision (T4/T5).
- `--acknowledge-iron-law` (`src/cli/command-registry.mjs:1351,1771,1800`) is a plain boolean any caller passes; the `approve` plugin command's "means the person has already decided" is prose. Merge's (T9).
- Plugin commands splice `$ARGUMENTS` unquoted into shell lines (`plugins/fgOS/skills/show/SKILL.md:35` and other commands). The actor is the user typing the argument; no injection from data found.

### Hypotheses rejected (so the next review skips them)

- **Path traversal through a generated wrapper name.** Names come from `readdirSync`, so a `/` cannot occur; `assertPortableGeneratedSkillName` (`:785-809`) refuses `\`, empty, dot collapse, Windows reserved names and trailing dot or space; the Gemini intent check refuses backticks and newlines (`repro.mjs name-chars`). A control character in a dir name could reach the wrapper text (`:133`), but needs a dir author, and `assembleSkills` aborts on it first.
- **Skill text that tells an agent to run a destructive command.** The grep over every source skill, `_shared` fragment, doctrine file and plugin command finds only prohibitions (`fgos-lock-fence/SKILL.md:75`, `domains/coding/AGENTS.md:9,19,30`, `worktree-safety.md:15-17`) and the removal door `fgos worktree remove ... --delivered-to`. `private-cell-worktree.md:75-90` and `coding-cell-policy.md:88-93` say "never clean a worktree by hand: no Git clean of ignored files, no `rm` over a computed file list, no forced worktree removal" and name `--discard-ignored` for the one refusal it is for: consistent with the delete guard (`--discard-ignored` deletes inside a verified linked worktree, never follows a link out, refuses main). No `git add -A`, `git stash`, `reset --hard` instruction without its guard sentence.
- **A skill that grants itself tools or runs a command on load.** No `allowed-tools`, `hooks:` or bang-command line in `core/skills`, `domains/*/skills`, `plugins/fgOS/skills`, `.claude/skills/ui-spec`. (`instruction-audit.mjs:384` mentions `hooks` as a report field.)
- **A pulled project supplies a domain registry.** `domain-registry.mjs` reads `domains/` from `import.meta.dirname` (the payload), not the project; `compiled.json` is the only input.
- **Item `domain` as a path.** Validated against `DOMAINS` before it is stored (`store.mjs:173-178`).
- **Instruction projection writes outside the block.** Markers must be one balanced pair or the splice refuses (`:159-183`); the destination, effective set and ledger refuse a symlink in their path; owners are an allowlist (`instruction-registry.mjs:597-700`).
- **Release payload carries a link or a foreign skill when Git is present.** The collector refuses links; ignored files are excluded through the Git port (the baseline's `source-payload` test).
- **The two baseline reds in this main.** Fixed (`27b2c580c`).

## HARDEN tables

### Migration table

| Node part | What it decides | Move? | Reason | Order | Node budget after |
|---|---|---|---|---|---|
| `generateAllSkillWrappers` loop | Which `.claude` dirs we write | No | wrong set, not wrong language (R-2) | 1 | about +6 |
| `copyDirRecursive`, `copyAssembledFile`, `carriesAssembledHeader` | What a copy follows | No (one leaf) | R-3 | 1 | about +10 |
| `project-agents` name rule | Where a persona is written | No | R-1 | 1 | about +10 |
| Ownership proofs (`isGeneratedWrapper`, header) | What counts as ours | No | R-4 | 2 | about +4 |
| Gemini and adapter classifier | nothing in production | Delete (owner, H4) | K5 | 2 | about -400 |
| `writeIfChanged` | AGENTS.md write | No | R-8 | 3 | about +6 |

### Delete list (this lens)

- With owner agreement (H4): `generateGeminiSkillPackage`, `SKILL_ADAPTER_TARGETS`, `isGeneratedAdapterTarget`, `isCanonicalSkillSource`, the intent and trigger mapping that only feeds them, and their tests; each retired test names "behaviour removed".
- The 3 dead fragments (K7) and their census hashes; the GitNexus block and the duplicated rules in `domains/coding/AGENTS.md`.
- `def?.name ?? file.name` as a path source; the per-name `.gitignore` allowlists once R-6's test exists.

### Order of work

1. R-2 and R-3 together (same file, same set, one leaf), with the K2 script fix. 2. R-1. 3. R-4, R-6, R-8. 4. R-5 text (tell WORK). 5. K5/K7 deletions after the owner answers Q1.

## Feature ideas, kept apart (owner picks)

- **F-1 `fgos skills check` (read-only).** Reason: three readers prove "surfaces equal a render of the source" (drift test, mirror test, R-6's new test). Benefit: one proof the doctor and the guards call; a hostile symlink, a foreign clobber and an untracked wrapper become one named finding.
- **F-2 `fgos domain doctrine <domain>` (prints the shipped doctrine file).** Reason: R-5, the skill has no payload-relative path to read. Benefit: external projects get the shipped doctrine and never a project-authored file in its place.
- **F-3 Doctor row "foreign skill in an fgOS-owned root".** Reason: `ak-*` collisions (K1, K4) were found by red tests, not by a check. Benefit: the owner sees the collision before a build rewrites it; it would replace, not add to, the two guard exceptions.
- **F-4 A lint that refuses `allowed-tools`, `hooks:` and bang lines in source skills.** Reason: none exist today and the only thing keeping it so is review. Benefit: a skill can never grant itself authority silently.

## Unresolved questions

1. Q1 (H4): may the Gemini target go? The contract lists it as planned; reversing it is the owner's call.
2. Q2 (R-1): should `project-agents` stay a manual script, or is it dead? No package script and no doctor row calls it (only a comment in `registrations.mjs:281`); if dead, deleting it closes R-1 and the 6 kit-file collisions at once.
3. Q3 (R-5): is a project-authored `domains/<d>/AGENTS.md` ever meant to extend the shipped one? If yes, it needs an explicit, named extension path and trust note; if no, F-2.
4. Q4 (R-6/R-9): is `instruction-audit` meant to be a Claude skill in every clone (then track the wrapper) or a maintainer tool (then say so in `.gitignore`)?
5. Q5 (K3): who moves, the removal guard (treat a skip-worktree path byte-identical to HEAD as clean) or the projection writer (do not write `.fgos/instructions/effective/repo.json` from a linked worktree)? I could not reach the writer here (R-2 and K2 stop the build first); fixing K2 makes K3 reachable, so decide before it ships.
