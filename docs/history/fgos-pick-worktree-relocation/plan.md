# plan.md: fgOS pick worktree relocation (tsk-424)

## Mode

**small** — a few files, no gray areas.

Flag count: 1 of 10 (auth, authorization, data model, audit/security,
external systems, public contracts, cross-platform, multi-domain, weak
proof around the area — all no; **existing covered behavior** — yes,
`fgos pick`'s worktree creation is asserted in `test/cli/fgos.test.mjs`).
1 flag stays in the 0–1 "tiny/small" band. Called **small** rather than
**tiny** because the change touches more than a couple of files once the
proving test and the now-stale skill-doc fallback note are counted, but
none of it is gray-area judgment — every piece is a direct, mechanical
edit. The override mechanism itself (`opts.worktreeDir` on
`createWorktree`) is already proven, pervasively test-covered
(`test/runner/worktree.test.mjs`) — this item threads an existing,
trusted mechanism into one new call site, not new machinery.

## Approach

**Chosen path** (per D1/D2, `CONTEXT.md`): in `bin/fgos.mjs`'s `case
'pick'`, add `worktreeDir: path.join(repoRoot, '.claude', 'worktrees')` to
the `claimWork(...)` call. This is the only call in the whole codebase
that needs it — `claimWork`/`createWorktree` already accept and honor
`opts.worktreeDir` (`src/runner/claim-port.mjs:170`,
`src/runner/worktree.mjs:216`) with zero changes to either function.

**Rejected alternatives** (both already excluded by D1/D2, not
reopened): a doc-only "always open a new session" or "formalize the
Bash/absolute-path workaround" answer; changing `createWorktree()`'s own
shared default so it affects Case B (`fgos-runner`) and the merge/approve
ephemeral worktrees too.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| `bin/fgos.mjs` pick call site (add one opt) | low | existing pick suite (`test/cli/fgos.test.mjs:2661` onward) plus a new assertion that `data.worktree.path` sits under `.claude/worktrees/` |
| Case B / merge-ephemeral call sites (untouched) | low | existing `test/runner/loop.test.mjs`, `test/e2e/runner-loop.test.mjs`, `test/runner/merge.test.mjs` pass unchanged — no code path there is touched |
| Real `EnterWorktree` second-switch behavior against the new location | **medium** | not unit-testable (needs the live harness tool, not mockable in `node --test`) — this is the actual tsk-1wd repro (root claim → `EnterWorktree` in → pick a child → `EnterWorktree` into the child) and is this item's `fgos-coding-validating` reality check, not a guess here |

**Files touched, in order:**

1. `bin/fgos.mjs` — pick case: add the `worktreeDir` opt to the
   `claimWork` call (~line 1264, `repoRoot: process.cwd()` site).
2. `test/cli/fgos.test.mjs` — extend the existing pick test(s) around
   line 2661/2682 so the `fs.existsSync(data.worktree.path)` assertion
   also asserts the path starts under `path.join(cwd, '.claude',
   'worktrees')`.
3. `plugins/fgOS/skills/pick/SKILL.md` step 3 — note that the
   decompose-mid-session second-switch case is now fixed at the infra
   level (this item); the fallback prose stays as-is for the remaining,
   genuinely different STR83 "nested-at-start" limit, which this item
   does not touch.

No real ordering dependency exists between 1–3 beyond doing the code
change before the test that proves it; `fgos graph --id tsk-424 --json`
confirms `tsk-424` is an isolated, size-1 component with no deps/blocks,
so no cross-item sequencing question applies.

## Shape (small)

One direct code change (file 1), one test extension proving it (file
2), one doc-prose correction (file 3). No phases needed at this mode.

**Concrete cases to prove:**

- `fgos pick` (both no-`--id` frontier-head and explicit `--id` paths)
  creates its worktree under `<repoRoot>/.claude/worktrees/` instead of
  `os.tmpdir()/fgos-worktrees` — new assertion, file 2.
- Every existing pick behavior (frontier claim, explicit-id claim,
  branch/worktree creation, branch-reuse-on-reclaim) still passes
  unchanged — regression, existing suite in file 2's test file.
- Case B and merge/approve ephemeral worktrees are provably untouched —
  regression, existing suites in `loop.test.mjs`,
  `runner-loop.test.mjs`, `merge.test.mjs` (no code path there changes
  at all).
- The actual tsk-1wd repro now succeeds: claim a root, `EnterWorktree`
  into it, pick a child of that root, `EnterWorktree` into the child —
  second switch succeeds instead of being refused. This is the medium-risk
  proof point that only `fgos-coding-validating`'s live reality check can carry,
  not a unit test.

## Split decision

No split. One honest piece of work — `tsk-424` proceeds as itself, no
children created. (`fgos graph --id tsk-424 --json`: isolated, size-1
component, nothing to unblock by splitting.)

## Verify

```
node --test test/cli/fgos.test.mjs test/runner/worktree.test.mjs test/runner/loop.test.mjs test/runner/merge.test.mjs
```

This supersedes the stale, discovery-generated `verify` currently on the
item (a grep-based doc-presence check left over from before D1 pivoted
the fix from doc-only to an infra change — see `CONTEXT.md`).
