# DIST review: workspace `sh` shim rewrite on `mailbox/v1-v3`

- Date: 2026-10-24 (Asia/Saigon). Role: distribution-component reviewer, standing in for DIST sign-off (owner approval 2026-10-24, option B).
- Branch head reviewed: `fb09b7486`. Shim commits: `dc8e92240` (builtins-only parse), `72042d720` (tests, live suite), `b0e39084a` (replace by rename through `fgos_durable_file`).
- Files: `packages/distribution/rust/src/shim.rs`, `packages/distribution/rust/examples/print-workspace-shim.rs`, `packages/distribution/rust/Cargo.toml`, `CHANGELOG.md`, `test/live/mailbox-claude.live.mjs`.
- Review only. Nothing in either checkout was edited or committed. The real `.fgos/installation` was only read, with `cmp`.

## Evidence run

The scratch area is `~/projects/forgent-worktrees/mailbox-evidence/dist-shim-scratch/`.

- `gen.py` regenerates `old.sh` (from main `546948586`) and `new.sh` (from the branch) out of the Rust format strings.
- I checked `new.sh` against the crate's own `print-workspace-shim` example, built from a `git archive` export: byte-identical.
- The live main shim `/home/vantt/projects/forgent/.fgos/installation/bin/fgos` equals `old.sh` byte for byte. Every existing workspace therefore holds the old body.
- `cargo test -p fgos-distribution --lib shim` on the export: 11 passed.
- I wrote a differential harness, `diff_harness.py`. Its scope:
  - 44 activation shapes × 4 shells (dash, bash --posix, busybox sh, zsh --emulate sh) × 4 caller environments, giving 704 old/new pairs. The cases are set up so that V5's 360 cases do not cover them.
  - Activation shapes: missing, a directory, a symlink, a dangling symlink, mode 000, empty, binary garbage, truncated, minified, CRLF, an embedded NUL, a relative `releasePath`, duplicate keys, a nested `status` first, a key prefix (`statusX`), tabs around the colon, many commas, and no final newline.
  - `releasePath` containing: a space, `'`, `"`, `$(touch PWNED)`, a backtick command, `$HOME`, `*`, `?`, `[ab]`, a JSON `\n`, a tab, a leading `-`, a backslash, raw non-UTF-8 bytes `\xff\xfe`, UTF-8 letters, a trailing comma or space, and an inner CR.
  - Caller environments: plain; `PATH=/nonexistent` (no `sed`/`awk`/`dirname`); exported variables that share the shim's names; bash with an exported `SHELLOPTS=errexit:nounset:pipefail:posix`.
- Invocation forms tested: an absolute path, `./fgos`, `sh fgos` from inside `bin/`, PATH lookup through an absolute or a relative entry, a symlinked `bin` directory, and a symlink to the shim.

Results:

- **Injection:** no case created `PWNED` with either shim. The new body never evaluates the file's content: no `eval`, the `case` word is unquoted only where no splitting applies, and every pattern built from data is quoted. I found no injection beyond what the old shim allowed. Whoever can write `activation.json` already chooses the exec target, under both bodies.
- **Equivalent behaviour:** every special character, non-UTF-8, symlinked activation, relative `releasePath` (resolved against the caller's cwd, as before), and every invocation form.
- **Differences:**
  - CRLF is now accepted. This is intended and documented.
  - With an empty `PATH` the new shim works, while the old one fails with `dirname: not found`.
  - A `SHELLOPTS` pipefail/errexit/nounset caller changes nothing in either body.
  - The remaining differences are findings below.
- **Cost:** dash, 200 runs. Old p50 7.16 ms, new p50 0.84 ms.

## Ownership and process

- **Owner and door.** The bodies come from `packages/distribution/rust/src/shim.rs` (`sh_body`, `workspace_shims`). The only writer is `write_workspace_shims`, called from `publish_and_tail` (`packages/distribution/rust/src/init.rs:1147`), which `fgctl init`, `upgrade` and `repair` all reach. The only drift check is `check_workspace_shims`, called from `verify_workspace` (`init.rs:1762`), which is `fgctl verify`.
- **No side door.** No Node or mailbox runtime code writes the shim. The live suite writes a private copy under its own `BASE` from the generator's example (`test/live/mailbox-claude.live.mjs`), never into an activated workspace.
- **Who authored it.** The mailbox lane edited the DIST crate itself, but through the owner's door. With this review standing in for the DIST sign-off, that process is acceptable.
- **Drift is decided by the `fgctl` on PATH, not by the activated release.** `fgctl` is its own installed asset (`fgctl-<tag>-<target>.tar.gz`, spec RUL15/RUL16). `check_workspace_shims` compares against "what this fgctl writes".
  - Once a machine's `fgctl` is upgraded, `fgctl verify` reports every existing workspace as `differs ... run fgctl repair` until `repair`, `upgrade` or `init` rewrites it.
  - Downgrading `fgctl` flips the report back. That is consistent: the shim body does not depend on the release it launches.
- **Version marker.** `.fgos/installation/` is per machine (gitignored), so a mixed fleet never shares a shim and byte equality is enough. No marker is needed. `activation.json`'s `shimVersion: "1"` (`init.rs:1191`) is written but read by nothing, and it was not bumped. It is harmless, but it now describes nothing (see L5).

## Findings

### Medium

**M1. The new shim hangs forever if its literal carriage return is lost.**
- Status: consequence CONFIRMED; trigger PLAUSIBLE.
- Location: `packages/distribution/rust/src/shim.rs:33` (`cr='CR'`, replaced at `:67`), `:36` and `:45`.
- Problem: when `cr` is empty, `*"$cr"*` matches every string, and `v=${v%%""*}${v#*""}` leaves `v` unchanged, so the `while :` loop never ends.
  - I reproduced this by emptying `cr`: dash, bash --posix and busybox each hit `timeout 3` (exit 124) on a normal activation.
  - The CR byte sits mid-line (`cr='\r'` followed by `'`), so CRLF-to-LF conversion does not touch it. A shell that ignores CRs in scripts (Cygwin bash `set -o igncr`, a common Windows setting) or any tool that strips a lone CR would empty it.
  - The sh shim is the documented Git Bash launcher on Windows.
  - Before this change, a mangled shim failed or worked. Now every `fgos` call, including every agent hook, spins at 100% CPU until the CLI's hook timeout kills it.
- Fix: never loop on an empty `cr`. For example, guard both uses: `[ -z "$cr" ] || while :; do case $v in *"$cr"*) ... esac; done`, and the same for `${2%"$cr"}`. Add one unit test that runs the body with the CR replaced by nothing and asserts that it returns instead of hanging (wrap the spawn in a timeout).

**M2. The CHANGELOG names the wrong check and the wrong trigger, and `docs/specs/distribution.md` is not updated.**
- Status: CONFIRMED.
- Location: `CHANGELOG.md:17` (the "workspace launcher" sentence) and `docs/specs/distribution.md:331`, which the branch leaves unchanged.
- Problem:
  - The line says an existing launcher "reads as different in `fgos doctor` until `fgctl repair` rewrites it, after a release with this change is activated". No `fgos doctor` check compares the shim: no `src/setup/*` registration does, and the only caller of `check_workspace_shims` is `verify_workspace`. Drift is reported by `fgctl verify`.
  - The trigger is upgrading the installed `fgctl`, not activating a release.
  - The spec's "Workspace launchers" bullet still does not record two settled facts from this change: the reading rules (builtins only, first match, CRLF accepted) and that launchers are replaced by rename. This misses L5 question 6.
- Fix:
  - Reword the CHANGELOG sentence along these lines: "`fgctl verify` reports an existing workspace's launcher as different once the `fgctl` on PATH carries this change, until `fgctl repair` (or `upgrade`) rewrites it."
  - Add one sentence to the spec bullet at `:331` covering the reading rules and the rename.
  - Do not add a doctor check in this change (RUL104). If the owner wants shim drift visible in `fgos doctor`, open a separate item.

### Low

**L1. The shim's new variable names leak to the release entry when the caller exported the same names.**
- Status: CONFIRMED.
- Location: `shim.rs:35-49` (`v`, `value`, `line`, `cr`, `found_status`, `found_path`).
- Problem: in POSIX sh, an imported variable stays exported. Assigning it changes what the exec'd `fgos` sees. With `v=callerv value=callervalue line=callerline` in the environment, the release entry received `v=<releasePath> value=<releasePath> line=` from the new shim, and the caller's values from the old one. The old shim already leaked `status`, `self_dir`, `activation`, `release_path` and `entry` the same way. This change adds three generic names (`line`, `value`, `v`).
- Fix: use a prefix nobody exports for every shim variable, for example `_fgos_v` and `_fgos_line`. It costs nothing at run time.

**L2. An unreadable `activation.json` exits 1 or 2 with a shell error, instead of 3 with the fix hint.**
- Status: CONFIRMED.
- Location: `shim.rs:52` (`done < "$activation"`).
- Problem: with the file at mode 000, the old shim printed `not ready () -- run fgctl repair` and exited 3 in all four shells. The new shim exits 2 (dash) or 1 (bash, zsh) with `cannot open ...`. busybox still exits 3. The spec says the launcher "refuses with exit 3". No caller branches on 3 for the shim (checked with `rg` across `src`, `bin`, `apps`, `packages`), so only the message and the contract are affected.
- Fix: replace `[ -f "$activation" ]` with `[ -f "$activation" ] && [ -r "$activation" ]`, or add a separate `-r` test with the same exit-3 message. Both are builtins.

**L3. The read loop does not stop once both keys are found.**
- Status: CONFIRMED.
- Location: `shim.rs:49-52`.
- Problem: the whole file is read on every call. This makes no difference at today's 20-line activation, but a 20k-line activation took 0.80 s against 0.10 s for the old shim, and a 20k-comma line took 0.50 s against 0.10 s (the comma loop is quadratic). The file is written by `fgctl`, so this is not a trust boundary.
- Fix: `[ -n "$found_status" ] && [ -n "$found_path" ] && break` at the end of the loop body.

**L4. Under busybox, a NUL inside a value is dropped.**
- Status: CONFIRMED (corrupt input only).
- Problem: `"status": "re\0ady"` reads as `ready` with the new shim and was refused by the old one. dash, bash and zsh agree with the old shim.
- Fix: no action needed beyond a note. `fgctl` never writes a NUL.

**L5. `shimVersion` stays at `"1"` although the shim format changed.**
- Status: CONFIRMED that nothing reads it.
- Location: `init.rs:1191`.
- Problem: there is no behavioural effect, but a future reader may trust the field.
- Fix: no change in this merge. When the DIST lane is next active, either retire the field or define what bumps it.

### Not findings (checked)

- **Atomic write.** `replace_durably_with_mode` creates a `create_new` + `O_NOFOLLOW` temp file `.durable-file-<pid>-<seq>.tmp` in `bin/`, fsyncs it, renames it over the name, and fsyncs the directory. A concurrent `fgos` exec sees the old inode or the new one, never a partial file. The test at `shim.rs:363-389` proves the old open descriptor keeps the old bytes. There is a theoretical window between the rename and the follow-up `chmod 0755` (`:196`) under a umask that clears the owner `x` bit. No real umask does that, so I am not counting it.
- **"Plain `fgos` runs the activated release".** Unchanged. The entry is still `<releasePath>/bin/fgos` from `activation.json` only, with no cwd or PATH fallback. `self_dir` is now relative when `$0` is relative. It is used only once, before any `cd`, so the result is the same. It also now works for a `$0` like `linkdir/../bin/fgos`, where the old logical `cd` failed.
- **Caller `set -e`/`-u`/`pipefail`.** These do not reach a shebang-exec'd script. Bash's exported `SHELLOPTS` does, and it changed nothing in either body. The new body has no pipelines left for `pipefail` to affect.
- **Doctor `active-release-matches-checkout`.** This check covers the Node payload and is unaffected. The shim is outside the release manifest by design.

## DIST verdict

**Approve after the named fixes: M1 (guard the empty-CR loop, plus one test) and M2 (correct the CHANGELOG sentence, add the spec sentence).** L1 and L2 are a few lines each in the same generator and are worth folding into the same commit. L3 to L5 are optional.

Status: DONE
Summary: The shim change goes through the distribution crate's own door. It matches the old shim on 704 differential cases except where intended (CRLF accepted, no PATH needed), is not injectable, and is written atomically. Approval for merge depends on fixing the empty-CR infinite loop (M1) and the misleading CHANGELOG line plus the missing spec line (M2).
Concerns/Blockers: M1 and M2 block DIST approval. The Windows/Cygwin `igncr` trigger for M1 was not reproduced on a real Windows host.
