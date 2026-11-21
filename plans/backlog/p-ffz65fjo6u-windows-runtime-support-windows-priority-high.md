---
id: p-ffz65fjo6u
title: "Windows runtime support (Windows, priority high, owner decision 2026-11-13: rc.7 ships Windows at the level \"installs and activates\")"
status: proposed
priority: P1
area: windows
created: 2026-11-13
---

# Why

On Windows fgOS installs and activates (`install.ps1`, `fgctl init`, shims, pin, `fgos --version`, `fgos doctor --json` returns a report), but its runtime is not supported yet, so `fgos doctor` is not ok there. Walls measured on windows-latest in the PowerShell consumer proof (run 43264791668, step "fgos doctor --json must report ok: true on a clean runner", 50 failing rows): (a) Config: about 25 rows `config-platform-unsupported` (`.fgos\\config.yaml`, `.fgos\\private/accounts.yaml`; Config spec G4 "addon and host on Windows" is open), which also fail `node-version-and-git` ("git not available: config-platform-unsupported ..."), runner, dispatch, tool-registry, confinement-policies, terminal-control and git-component rows; (b) Event Store and Work: ten rows `event-store-unsupported-platform` (work-classification-vocabulary, work-step-vocabulary, work-recorded-conflicts, root-drift, leaf-notify-drift, delivered-not-on-trunk, event-store-open-root, event-store-machine-id, event-store-legacy-layout); `fgos init` now leaves the Work store out and says so (`workStore: "unsupported-platform"`); (c) confinement: `bwrap-available`, `confinement-bwrap-platform` ("platform win32 is not Linux"); (d) identity: `identity-ssh-keygen` cannot parse `OpenSSH_for_Windows_9.5p2, LibreSSL 3.8.2` (`parseOpensshVersion` in `src/setup/identity-checks.mjs` wants `OpenSSH_<n>.<n>`); (e) rows whose fix is `fgos doctor --fix`: `project-fgos-launcher` (another fgos first on PATH), the five agent hook rows, `config-doc-drift`, `git-repository-config`, `git-operation-journal`. Also under this row: on Windows the focused-tests job does not run five node test files that fail there (measured in run 43282189032): `test/rust-host/fgctl-init-activation.test.mjs` (the lock-holder helper script fails with `ERR_UNSUPPORTED_ESM_URL_SCHEME` on a bare drive path), `fgctl-init.test.mjs` (`fgos ready --json` refuses with `event-store-unsupported-platform`), `fgctl-init-preflight-tail.test.mjs`, `release-tree.test.mjs` (the staged harness run: `stderr byte mismatch`, exit 4) and `test/setup/project-launcher.test.mjs` (the cmd launcher case never prints `release-ran`). Also: the Windows focused-tests step runs the identity crate without its `mint` tests (a counter claim is a clone and a push of a file remote: `transport 'file' not allowed`, `Access is denied (os error 5)`) and without its `project` tests (`the_main_root_answers_the_shared_root_table` compares a verbatim and a plain spelling, `init_mints_once_and_reads_the_same_file_from_a_worktree` gets `untrusted-worktree`); the Git write path has no Windows proof and `worktree.rs` caller-supplied path arguments still go out in the verbatim spelling (see `p-w4cxqq2sbw`). Owner question: should a doctor row of a Linux-only component report "not applicable on this platform" and pass (or be omitted) on Windows, or stay failing until the component exists there?

# Done when

A Windows user gets a doctor that is ok when what exists on Windows is healthy, Config reads and writes on Windows, and each row of the five groups is either passing or declared not applicable by the owner.

# Notes

2026-11-21 23:55 (lead:S6A, phase 20 on s6/p20-2 at fb3a98842): with the Windows refusal and the win32 Node run route removed, host `fgos run` starts on every platform, but a `fgos run` that writes files still cannot run end to end on Windows. Two walls of this row block it: (a) Config cannot read a project config on Windows (`config-platform-unsupported`, `packages/config/rust/src/files.rs`), and (c) a CLI agent seat has no Windows confinement backend (`posture-unavailable` without bwrap). The deleted Node route hit the same walls, so nothing regressed.

Migrated from the legacy backlog table. Original status: proposed.
