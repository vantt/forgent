# Git phase 03 handoff

Implemented steps 1–5 on `git/p03-worktree`: Rust Worktree port, combined-addon binding, thin Node facade, public `fgos worktree create`, read-only doctor row, contracts, specs, changelog and regenerated skills. Default creation is detached; named branches and literal bases (including annotated tags) are supported. Existing runner/session/integration callers remain for the planned phase 07 migration. No staging or commits performed.

Reused LockScope/opaque handover, Inspect topology, hardened driver, WAL admission/TargetAttempt and reachability pins; extracted the existing Refs pin installer instead of duplicating it. Prior art: `dd35a4b4e` introduced the admin door/provisioning boundary; `6e2e99093` added force rollback, which G-033 explicitly supersedes for this port. No provisioning callback or force-removal fallback was added. Impact-analysis: inactive (zero registered providers).

Proof: Rust tests pass (90 top-level tests, one ignored); clippy is clean. Focused Node validation passes 191 tests, one skipped. Real Git is SIGKILLed at ptrace syscall barriers for all four residue shapes; move recovery preserves binary/untracked/symlink/executable content and unrelated edits. Node checks cover custody refusal, live cwd, dirty/ignored bytes, stripped state, realpath nesting, replay, doctor and the CLI adapter.

Reproduce from this checkout:

```sh
cargo test -p fgos-git -p fgos-node-addon
cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
node --test test/git/*.test.mjs test/verbs/worktree-create.test.mjs test/runner/worktree-admin-multiprocess.test.mjs test/setup/git-checks.test.mjs test/setup/checks.test.mjs test/architecture.test.mjs test/rust-host/command-routes.test.mjs
node scripts/export-command-selectors.mjs --check
node --test test/cli/subcommand-flag-drift.test.mjs
npm run build:skills && git diff --exit-code -- .agents/skills plugins/fgOS/skills
```

The CLI drift command has exactly one remaining failure: its hardcoded `MULTI` list at `test/cli/subcommand-flag-drift.test.mjs:199` must include `worktree`. Its new per-worktree flag check passes. That test file is outside the write scope and was not changed. Generated-surface diff exits 1 for the intended skill-line change; a second generation is byte-identical (SHA-256 `9d32243619e9666fe95e82a05c5d6108fa27362df6aea7da0d555831beb1253d`).

Full-suite reproduction used the checkout host without hardcoding a Cargo target:

```sh
cargo build -p fgos
python3 - <<'PY'
import json, subprocess, os
meta = json.loads(subprocess.check_output(['cargo', 'metadata', '--no-deps', '--format-version', '1']))
env = os.environ.copy()
for name in ['CLAUDE_CODE_SESSION_ID', 'CODEX_THREAD_ID', 'FGOS_SESSION_ID']:
    env.pop(name, None)
env['FGOS_HOST_BIN'] = os.path.join(meta['target_directory'], 'debug', 'fgos')
env['FGOS_STATE_ROOT'] = '/tmp/fgos-work/p03-suite/fgos'
os.makedirs(env['FGOS_STATE_ROOT'], mode=0o700, exist_ok=True)
subprocess.run(['npm', 'test'], env=env, check=True)
PY
```

Without the state-root assignment, the sandbox refuses the default full-suite lock with EROFS. With it, the run finishes: 7,178 pass, 850 fail, 132 skipped, 65 todo. Failures include read-only `/var/tmp` fixtures and terminal timeouts; this run also saw the earlier CLI registry failure and two runtime addon updates while I rebuilt during the run. It is not a green or clean full-suite proof. Final focused validation ran after those changes. Logs: `/tmp/fgos-work/p03-{cargo-final,clippy,node-all-final,subcommands,npm-confined}.log`. Windows and power-loss proofs were not run. MDView preview failed because its database is read-only.

Additional scope needed: the one-line CLI test list update, and the required GIT lane update in `plans/261017-1313-fgos-platform-program-board/plan.md`. No out-of-scope edits were made.

Status: BLOCKED
Summary: Steps 1–5 are implemented and focused checks pass; the final gate needs the out-of-scope CLI test update and a full-suite run outside this sandbox.
Concerns/Blockers: Missing write scope for the CLI test and program board; full-suite sandbox restrictions.
Context refs:
- (none)
