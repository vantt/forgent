# Review: 8573c8b34 fix(git): repair legacy fetch mappings and driver directory permissions

Read-only review on 2026-10-19 (Asia/Saigon) of the commit in the detached worktree `git-p01-fix-review`. I read the full diff, the lead report, the touched Rust/Node code paths and the Event Store mirror readers. I also checked the wildcard refspec against real Git 2.53.0 in a scratch repo. I did not run the repository test suites; the lead report says cargo, clippy and node runs were green.

**Verdict:** both landing defects are fixed correctly, and I found no Critical or High issues. The chmod repair works on a no-follow descriptor (`fchmod`), so there is no TOCTOU window between the owner check and the chmod, and it is idempotent. The refspec migration goes through the existing journaled, config.lock-protected writer and preserves user and push config. Four Medium and five Low findings follow.

## Empirical check (Git 2.53.0, scratch repo)

- With `+refs/fgos/legacy*:refs/fgos/remotes/origin/legacy*` and no legacy ref on the remote, `git fetch` exited 0. Once the remote had `refs/fgos/legacy`, it mirrored to exactly `refs/fgos/remotes/origin/legacy` (the empty suffix works). `git pull` succeeded too.
- With the remote also holding `refs/fgos/legacy-old` and `refs/fgos/legacyx/y`, plain fetch **also mirrored** `refs/fgos/remotes/origin/legacy-old` and `refs/fgos/remotes/origin/legacyx/y`.

## Critical
None.

## High
None.

## Medium

**M1. The wildcard mirrors any `refs/fgos/legacy*` ref, and one shape becomes a phantom event tip.** Files: `packages/git/rust/src/repository_config.rs:84` and `packages/event-store/rust/src/read.rs:46-53`.
- Check (2) asks that the fix never mirror unintended refs. A plain fetch now copies every remote ref whose name starts with `refs/fgos/legacy` (verified above).
- Most extras are harmless: `read.rs` skips any suffix that is not exactly `legacy`, and `sync.rs:143` only walks `.../events/`.
- One shape is not harmless. A remote ref `refs/fgos/legacy/events/<m>` mirrors to `refs/fgos/remotes/<r>/legacy/events/<m>`. `mirror_suffix` takes the *rightmost* separator, so it yields `events/<m>` and `tips()` treats the ref as an event stream for machine `<m>`.
- This ambiguity already exists through `refs/fgos/events/*/events/*`, and a remote writer could already write `refs/fgos/events/*`, so the trust boundary does not change. But the commit adds a new path into it.
- **Fix:** in `mirror_suffix`, strip exactly one `<remote>/` segment (remote names cannot contain `/`) and then require `legacy` or one of the three stream prefixes, instead of using `rfind`. Also have doctor `git-publication-refspecs` warn on any `refs/fgos/remotes/<r>/legacy?*` ref other than the exact one, and write down that `refs/fgos/legacy?*` is a reserved name nobody may create. Git cannot express "exact name or absent", so the glob itself is the right fix for the fetch failure.

**M2. The migration only repairs the configured remote; an exact line already on `origin` stays and keeps breaking fetch.** File: `src/setup/git-checks.mjs:15,44-49`.
- Before this commit, Node setup always wrote the exact line to `origin` (old `FETCH_MAPPING`).
- Setup and doctor now act only on `eventStore.remote`. If a project sets that key to something other than `origin`, the broken `remote.origin.fetch` exact line is never reported or repaired, so plain `git fetch origin` keeps failing. That is the original defect.
- **Fix:** have the doctor row and the fix also look for the obsolete exact form on `origin` when the configured remote differs. Repair it through the same `ensure_fetch_mapping` path for `origin`, or at least report it with a fix hint.

**M3. `GitDriver::new` now refuses a symlinked state root, and the advertised fix cannot repair it.** Files: `packages/git/rust/src/driver.rs:223` (new `trusted_directory(state_root)` before `canonicalize`) and `driver.rs:1084-1089`.
- Before, a state root that is itself a symlink was canonicalized and then checked. Now it is refused outright. That covers `XDG_STATE_HOME/fgos`, a dotfiles symlink, or an `FGOS_STATE_ROOT`/`FGOS_STATE_HOME` pin.
- The refusal tells the user to run `fgos doctor --fix (git-driver-directories)`. That fix opens the root with `O_NOFOLLOW` and fails with a raw `ELOOP` "Too many levels of symbolic links" error. The user gets a dead-end instruction.
- This behavior change is not in the spec's §12 text, which only says the *fix* rejects symlinks.
- **Fix:** if refusing a symlinked root is intended, write that in the spec and give the symlink refusal its own message that names the real remedy (point the root at a real directory) instead of `--fix`. If it is not intended, drop the pre-canonicalize check and keep the canonical-path check.

**M4. A populated or unreadable `git-empty-hooks` makes the fix fail and the driver unusable, and the message gives no next step.** File: `driver.rs:212-219`.
- The fix refuses a populated hooks directory with the bare `trusted-hooks-not-empty`. It names neither the path nor what to do.
- A hooks directory the user owns but with mode 000 makes `read_dir` fail with a raw io error before any repair.
- Never deleting files from the hooks directory is the right call. The gap is the wording, which check (5) asks about.
- **Fix:** put the path and the remedy in the message (inspect it, remove the foreign files, rerun `--fix`). If you want, open the directory with the same no-follow descriptor before reading it, which also closes the small check-then-chmod window described in L1.

## Low

**L1. The emptiness check is path-based and separate from the descriptor chmod.** File: `driver.rs:214-218`. Another process running as the same user could add a file between `read_dir` and the `0500` chmod. Only the owner can do this, and the effect is that a populated directory ends up 0500. Low. The fix is in M4.

**L2. The obsolete form is derived three times with `[1].replace('*', "")`, and the policy is read by index.** Files: `repository_config.rs:96-99,210` and `node-addon/src/git.rs:205`. The DRY and one-source requirement is met for the policy itself, but the obsolete form and the `[1]` index are copied. **Fix:** export `obsolete_legacy_fetch_mapping(remote)` (or a small struct with `events`, `legacy` and `obsolete_legacy` fields) from RepositoryConfig and use it everywhere.

**L3. `eventStore.remote` is read but has no setup/config-merge registration.** File: `src/setup/git-checks.mjs:15`. The key is documented in the event-store spec (§ config table, line 583), but no registration in `src/setup/registrations.mjs` declares it. The AGENTS.md install/setup/doctor gate expects one. **Fix:** register the key and its `origin` default, or link the existing registration if there is one I missed.

**L4. The doctor message for an obsolete mapping names neither the cause nor the fix.** File: `git-checks.mjs:26`. When `obsoleteFetchMapping` is true, the row fails but the message is just the JSON refspec list. **Fix:** add text like `obsolete exact legacy mapping breaks plain fetch when the remote has no refs/fgos/legacy; run fgos doctor --fix (git-publication-refspecs)`.

**L5. The repair only tightens g+w/o+w on whatever root it is given.** Files: `driver.rs:1091-1095` and `state_root.rs:56-71`. The root comes verbatim from `FGOS_STATE_ROOT`/`FGOS_STATE_HOME`. A mis-pinned root such as `$HOME` would have its group write bit stripped. The user owns it and the change only tightens, so the risk is low. You could also require the basename `fgos`, or a marker file, before chmodding an existing root.

## What I checked and found sound

- **(1) chmod safety.** The repair opens the directory `O_NOFOLLOW|O_DIRECTORY`, checks the owner uid on that fd, and chmods the same fd (`File::set_permissions` is `fchmod`), so no TOCTOU exists between check and chmod. It never touches a parent: recursive create only makes *missing* parents. Foreign owners are refused. A rerun is idempotent: it returns false and the mode stays put. The 0o775 to 0o755 case only strips write bits, which matches the spec.
- **(2) Event Store consumers.** Sync and legacy reads still go to exactly `refs/fgos/remotes/<remote>/legacy` (`sync.rs:351,425,451,463`). Publication's own fetch still asks `ls-remote` for the exact `refs/fgos/legacy` and maps only that (`publication.rs:1610-1640`).
- **(3) Migration.** The migration uses the staged-draft, config.lock and WAL path. `--fixed-value --unset-all` removes only exact matches, and Git floor 2.53 supports it. `mapping_installed` makes readback and recovery require the obsolete line to be gone. The no-effect path is skipped when replacement is needed. Unrelated keys and push config are preserved, and a Rust test covers this. Older pending ConfigChange records that carry exact refspecs still recover, because `mapping_installed` only applies the obsolete rule when the wanted set has the wildcard.
- **(4) One source.** `publication_fetch_mappings` is the only definition. The Event Store `refspec.rs` copy and the Node `FETCH_MAPPING` constant are gone, and no other `refs/fgos/legacy:` mapping literal is left in `packages/` or `src/` outside one test fixture.
- **(5) Driver refusal wording.** The new `trusted_directory` messages name the path, mode, uid, cause and fix. Exceptions: the symlink and hooks cases (M3, M4) and the refspec row (L4).

## Unresolved questions

- Is refusing a symlinked state root in `GitDriver::new` intended (M3)?
- Does any project or global config in use set `eventStore.remote` to something other than `origin`? If none does, M2 is latent.
