# Phase 2g result: BLOCKED, nothing changed

`packages/component-authority/model/doors/installation-shim-location.json` was not edited and no file was deleted.
The phase's step 2 says to remove the row's `debt` entry only if the copy is gone, and to stop and report when the
path is still built. It is still built.

## Step 1 — the check the phase asks for

```
$ rg -n 'installation/bin' packages/herdr-fgos-common
packages/herdr-fgos-common/rust/src/fgos.rs:380:/// Resolves the workspace shim `<root>/.fgos/installation/bin/fgos`: present,
```

The only textual hit is a doc comment, but the path is built from parts, which the same `rg` misses. Production
code:

- `packages/herdr-fgos-common/rust/src/fgos.rs:373-378` — `fn shim_path(root) -> PathBuf` joins
  `.fgos` / `installation` / `bin` / `fgos`.
- `packages/herdr-fgos-common/rust/src/fgos.rs:387` — `fn resolve_fgos` builds
  `let install_root = root.join(".fgos").join("installation");` and calls `shim_path(root)` at line 386.

Both are live production functions (no `#[cfg(test)]`, the test module starts at line 485). The four
`.join("installation").join("bin")` hits at lines 1002, 1030, 1072 and 1090 are inside `mod tests` and are not
debt.

The row's own patterns still match it: `.join\("installation"\)` and `['"]\.fgos['"],\s*['"]installation['"]`.

## Step 2 — why the debt entry cannot be removed now

Removing it does not merely pass, it fails the phase's own Verify command. Proved by temporarily deleting `debt`
from the row and running the gate (the row was then restored byte-for-byte; `git status` is clean):

```
$ node --test --test-name-pattern='every door row holds' test/architecture.test.mjs
✖ every door row holds: patterns appear only in allowed or debt files, and no entry is stale
  actual: [ '[installation shim and activation record location]
            packages/herdr-fgos-common/rust/src/fgos.rs:375 does the job outside its door' ]
```

So a debt-less row needs the copy deleted first (CA-D2: every caller moves to the survivor and the copy is deleted in
the same commit). That is out of this phase's write scope twice over:

| Blocker | Path | Why it is outside |
|---|---|---|
| The copy to retire | `packages/herdr-fgos-common/rust/src/fgos.rs` | Not in the phase's "Files it may write" (the row only), and not in the plan footprint's 2g row. |
| The survivor it must move onto | `packages/distribution/rust/src/shim.rs` (`PROJECT_SHIM_RELATIVE`, line 14) | `packages/distribution/rust/src/**` is not in this phase's footprint either. |
| The crate edge the move needs | `packages/herdr-fgos-common/rust/Cargo.toml` | It depends on `serde`, `serde_json` and `fgos-config` only; adding `fgos-distribution` is the crate edge the owner moved out of this plan. |

## The wait the phase declares has not cleared

The phase's "Waits" section and the plan's waits list both say 2g stays `draft` until backlog item
`p-rypvkc3kai` lands. It has not:

- `plans/backlog/p-rypvkc3kai-the-herdr-driver-resolves-the-installation-shim.md` — `status: proposed`.
- `plans/backlog.md:471` — the row still reads `proposed`.

That item's Done-when also fixes the shape this phase must wait on: "One Rust owner of the shim path lives in a
crate that both distribution and herdr-fgos-common already depend on (check the shared dependencies first, for
example fgos-config's paths), fgos.rs uses it, its debt entry is gone, and Cargo.lock is unchanged." If that item
finds the owner inside `fgos-config` (which `herdr-fgos-common` already depends on), no distribution crate edge is
needed, the survivor is a third path, and this phase's step 2 becomes a one-line removal of `debt` from the row. It
is the wait item, not this phase, that decides the survivor.

## Prior art: this exact row was already reported blocked

`reports/unit-261123-0819-p02-result.md` (the pre-re-cut phase 2) reached the same conclusion for this row and named
the same last SHA. Nothing on `main` has moved that file since:

```
$ git log -1 --format='%h %s' -- packages/herdr-fgos-common/rust/src/fgos.rs
154b8d4af feat(gateway): loopback by default, caller record, bounded execute, in-flight cap, link-safe reads
$ git diff 154b8d4af..HEAD --stat -- packages/herdr-fgos-common/rust/src/fgos.rs
(empty)
```

## Deleted paths and last SHAs

None — no path was deleted in this attempt. For phase 11's bookkeeping, the path this row still owes is:

| Row | Path still to delete | Last SHA that still had it |
|---|---|---|
| `installation-shim-location` | `packages/herdr-fgos-common/rust/src/fgos.rs` (`shim_path`, `resolve_fgos`) | `154b8d4af` |

## Decision-history line for phase 11

None. No twin was retired, so there is nothing for the owning area spec
(`docs/platform/packaging-distribution/spec.md` § "Lịch sử quyết định") to record yet. The row, its `allowed`
survivor (`packages/distribution/rust/src/shim.rs`) and its `retiredBy` (`S7: the Node reader retires with the Node
payload; distribution keeps writing`) are unchanged.

## Owning proof (Verify)

`node --test test/architecture.test.mjs` — the owning test is
`every door row holds: patterns appear only in allowed or debt files, and no entry is stale`
(`test/architecture.test.mjs:1970`), which runs `checkDoors` over the model's door rows. That one test passes on
this branch with the row unchanged, and the probe above shows it is exactly the test that fails if `debt` is removed
without deleting the copy. That is the same behaviour phase 10 will finally own with `node --test
test/architecture.test.mjs` again (`phase-10-land-checks.md`), so no new proof was added here.

Full-file run of `node --test test/architecture.test.mjs` on this branch: 87 pass, 1 fail —
`A4 boundary guard: dispatch, execution, the dispatch barrel and src/workflow/** name no domain or Workflow step
literal`, failing with `git-addon-unavailable: addon not shipped on this channel: onboard this project with fgctl
init` from `src/util/yaml.mjs:44` via `src/native/door.mjs:14`. That failure is a missing native addon in this
worktree, not this row, and it fails identically on the untouched tree.

## What would unblock this phase

1. `p-rypvkc3kai` lands: one Rust owner of the shim path exists, `fgos.rs` calls it, and the copy at
   `packages/herdr-fgos-common/rust/src/fgos.rs:373-397` is gone.
2. Then this phase is a one-file change: drop the `debt` entry from
   `packages/component-authority/model/doors/installation-shim-location.json`, re-run
   `node --test --test-name-pattern='every door row holds' test/architecture.test.mjs`.

Status: BLOCKED
Summary: `packages/herdr-fgos-common/rust/src/fgos.rs:373-397` still builds `.fgos/installation/bin/fgos` (`shim_path`, `resolve_fgos`); the phase's own check fails when `debt` is dropped, and both the copy and its survivor are outside this phase's write scope, so the row was left unchanged.
Concerns/Blockers: Needs `p-rypvkc3kai` (still `proposed`) to move the shim path onto a crate `herdr-fgos-common` already depends on, or footprint additions for `packages/herdr-fgos-common/rust/src/fgos.rs`, `packages/distribution/rust/src/shim.rs` and `packages/herdr-fgos-common/rust/Cargo.toml`. Nothing was written or deleted.
