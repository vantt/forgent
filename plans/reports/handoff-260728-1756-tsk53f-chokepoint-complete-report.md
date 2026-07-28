# Handoff: tsk-53f choke-point consolidation complete

## What was done

**tsk-53f + 4 subtasks DONE** — all claim flows now go through single `src/runner/claim-port.mjs`:

| Commit | Task | Change |
|--------|------|--------|
| d924b2d | tsk-3oa | Created claim-port.mjs |
| 2bc009f | tsk-4mo | Refactored pick → claimWork(isolate:true) |
| a920d51 | tsk-1nu | Refactored take → claimWork(isolate:false) |
| 29dbf86 | tsk-2r4 | Refactored runner claimItem → claimWork(isolate:false, skipOutcome:true) |

**Bugs fixed:**
1. **main-checkout-lock was dead code** — now wired for all claims
2. **Leaf baseRef bug** — leaves now fork from root branch, not main
3. **Blocked+branch edge** — preserved for human rounds (take on blocked item with existing branch)

**Also done this session:**
- Triaged 5 worktree-in-out candidates into porting-log
- Folded duplicate `changeset-committed-truth-db-rebuild` into existing row
- Rejected it as duplicate

## claim-port.mjs API

```javascript
claimWork(dir, {
  id,              // work item id
  actor,           // 'session' | 'runner' | 'human'
  isolate,         // true = create worktree, false = no worktree
  skipOutcome,     // true = caller handles addOutcome (runner)
  claimTrigger,    // optional stamp
  repoRoot,        // defaults to process.cwd()
  worktreeDir,     // custom worktree dir (runner)
})
```

## Now unblocked

| Task | Description | Deps satisfied |
|------|-------------|----------------|
| tsk-1an | bootstrap .fgos copy at worktree creation | tsk-53f ✓ |
| tsk-3w8 | approve race when 2 sessions commit main | tsk-53f ✓, needs tsk-1an |

## Next steps

1. **Pick tsk-1an** — highest leverage (blocks tsk-3w8, tsk-56t)
2. Decision needed: **khóa-trong-cây** (session.mjs style symlink) vs **cô-lập-cây** (beegog style bootstrap-copy)

## CWD & state

- CWD: /home/vantt/projects/forgentX
- Branch: main (clean)
- All work committed
