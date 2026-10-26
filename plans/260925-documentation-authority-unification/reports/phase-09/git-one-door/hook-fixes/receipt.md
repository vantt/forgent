# Documentation lease hook fixes

Base: `6215e614f97d520b6caa43060a6a72e1bb5c381f`. Implemented; native-capable verification remains with Lead.

## Changes

1. `guardReferenceTransaction` admits non-deletion main updates already reachable from fetched `origin/main`. Missing origin retains the old local policy; ancestry/read errors do not grant admission. Unpublished scoped moves and held-main deletion remain refused.
2. Git spec §7 explicitly names linked-worktree merge/cherry-pick/rebase/am/`--no-verify` and direct `git push origin HEAD:main` gaps. This is convention plus typed doors, not complete hook enforcement.
3. Zero-old-OID creation compares against the object-format empty tree, calculated without writing an object.
4. Moved the 2026-10-22 hardening checkpoint from §18 owner decisions to §7 dated history.

Reused the existing shared policy, read-only adapter, owning unit/e2e files, lease CLI transitions and `landRunnerItem`. Prior art: `8b20f5185`, `83a331410`; neither supplied published-history admission. The shell hook is unchanged.

## Proofs

| Command/check | Exit | Result |
|---|---:|---|
| Full unit file, required `--no-addons` invocation | 1 | 4 pass / 13 fail; native-dependent cases unavailable |
| Full e2e file, required `--no-addons` invocation | 1 | 2 pass / 34 fail; native-dependent cases unavailable |
| Focused new unit tests, `--no-addons` | 0 | Both pass: absent-main empty-tree baseline; published ancestry/absence/error/deletion classification |
| Focused final two-clone e2e, `--no-addons` | 1 | Clone A/B created; blocked at native lease bootstrap, before acquire/Land/pulls |
| `g0join/join.py --pin HEAD` | 0 | 1929 effective rows approved; no gaps |
| `fchain/check.py --pin HEAD`, report sink redirected only | 0 | 595 files / 229 patches / 20 links; no findings |
| `rebind/rebind.py --check`, twice | 0 | Live drift 0 |
| Node syntax checks, shell syntax check, `git diff --check` | 0 | Clean |

The new e2e uses two clones of a bare origin: A acquires, commits holder docs, lands through the existing holder door, releases and publishes; B pulls across every step with hooks wired and no holder token. During held state B's unpublished main update is refused. **This native-capable wiring proof has not passed here; Lead must run it.** Addon loading stayed disabled, not bypassed.

Fchain's sole report sink was redirected before writing because its default `fchain/check.json` is outside scope. Its tracked bytes stayed identical (digest in `plan-checks.json`); no chain-check file needed deletion. No checker decision logic changed. G0/Fchain are HEAD-pinned, not semantic approval of uncommitted bytes.

The live recursive binding scan inspected 150 documents / 13930 binding rows: none targets `docs/platform/git/spec.md`. No G0 edge was required; `g0-rework-rebindings.json` remains unchanged. No ownership/pair-accounting recipe was run. No approval is inherited or authored.

Exact verification commands, exits, failed initial redirection attempts and limitations are in `receipt.json`; compact check evidence is in `plan-checks.json`, with focused test logs alongside. Large intermediate checker dumps were removed after summarization.

Impact analysis is degraded: no GitNexus MCP in this session and the brief forbids the fgos capability query. Direct caller/history inspection covered the shared guard and default-preserving e2e fixture extension. No Git commit, lifecycle operation, new dependency or config was added. The repository-wide Unreleased note needs out-of-scope `CHANGELOG.md`; it was not written.

## Lead completion (2026-10-26)

The Doer turn could not commit: the census had to be regenerated, and `CHANGELOG.md` was outside its scope. The Lead finished the work on the same branch.

- `git hash-object -t tree --stdin` is not in the scanner's read-verb set. It is replaced by the fixed empty-tree id for the repository's object format, read with `rev-parse --show-object-format`. The ids were checked against Git: sha1 `4b825dc6…`, sha256 `6ef19b41…`.
- The scanner fix (d0dcc24ec) is merged under this work. The `leaseGitRead` hook declaration takes the new siteId `d9a1f33e…` and adds the read verb `merge-base`. The census is regenerated (`--write-census` exit 0).
- `CHANGELOG.md` gets one Unreleased line.
- Native runs with `FGOS_HOST_BIN` set to the active release:

  | Test file | Pass / fail |
  |---|---|
  | `test/runner/documentation-cutover-lease.test.mjs` | 17/0 |
  | `test/e2e/documentation-cutover-lease-hooks.test.mjs` | 36/0, including "a second clone pulls published acquire, holder docs and release but refuses unpublished main" |
  | `test/scripts/git-one-door-declarations.test.mjs` | 45/0 |

## Lead rework after w42 (2026-10-26)

**Finding.** The w42 review found that the published-history rule also admitted a rewind of main past the acquire commit. That would drop a held sidecar.

**Fix.**
- Main is admitted only when it moves forward onto published history: the new OID is an ancestor of, or equal to, `origin/main`, and either the old OID is an ancestor of the new one or main is being created. This uses a shared `isAncestor` read; `merge-base` is already declared.
- The unit case `rewind` was added. It fails against the previous hook and passes now.
- §7 states the forward-only rule and names a local `refs/remotes/origin/main` rewrite as an uncovered route.
- The CHANGELOG line was updated.
- The `leaseGitRead` siteId is now `75e0ded2…`, and the census was regenerated.

**Native runs.**

| Test file | Pass / fail |
|---|---|
| `test/runner/documentation-cutover-lease.test.mjs` | 17/0 |
| `test/e2e/documentation-cutover-lease-hooks.test.mjs` | 36/0 |
| `test/scripts/git-one-door-declarations.test.mjs` | 45/0 |
| `test/githooks/census-drift.test.mjs` | 3/0 |
