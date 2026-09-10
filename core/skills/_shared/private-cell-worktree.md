# Private cell worktree

Every mutating coordination cell (`fgos-code-panel` change, `fgos-plan-loop`
cell) runs on its own branch in its own linked git worktree. This is not a
preference: the session engine refuses `mutation: "mutating"` whenever
`--cwd` resolves to the main checkout (`session-engine.mjs`
`assertMutatingDispatchAllowed`, Mutation Rule condition 3), and a worker that
lands in the wrong directory writes into someone else's tree. The Lead opens
the worktree as a plain git operation before any request, verifies it, and
removes it after the merge. No request field expresses any of this.

Substitute `<prefix>` with the calling skill's own prefix (`code-panel` for a
code-panel change, `<track>` for a plan-loop cell) and `<slug>` with the
change/cell id (safe charset: letters, digits, `-`, `_` — no periods).

## Open

```sh
main=$(git rev-parse --show-toplevel)          # run from the main checkout
base=$(git -C "$main" rev-parse --abbrev-ref HEAD)
wt="$main/../<prefix>-<slug>"
branch="<prefix>--<slug>"

if [ -e "$wt" ]; then
  echo "refuse: $wt already exists — inspect with 'git worktree list', remove or pick a new slug" >&2; exit 1
fi
if git -C "$main" show-ref --verify --quiet "refs/heads/$branch"; then
  git -C "$main" worktree add "$wt" "$branch"           # reuse the branch, fresh directory
else
  git -C "$main" worktree add "$wt" -b "$branch" "$base"
fi
[ -f "$wt/package-lock.json" ] && npm ci --prefix "$wt" --silent   # workers run the real test command here
```

Naming is deterministic so `git worktree list` reads as an inventory:
directory `../<prefix>-<slug>` (the prefix keeps it from colliding with a
sibling checkout such as `../forgentX`), branch `<prefix>--<slug>` (the
double dash is what `fgos coordination chain <prefix>` groups on). Reusing an
existing branch with a fresh directory is the same retry-without-collision
rule `src/runner/worktree.mjs` applies to `fgw/<id>` branches. Record `$base`
— it is the merge target and belongs in the close rationale.

## Verify before every dispatch

```sh
[ "$(git -C "$wt" rev-parse --show-toplevel)" != "$main" ] || { echo "refuse: cwd is the main checkout" >&2; exit 1; }
[ "$(git -C "$wt" rev-parse --abbrev-ref HEAD)" = "$branch" ] || { echo "refuse: wrong branch in $wt" >&2; exit 1; }
git -C "$wt" status --porcelain   # expect empty before open.json; expect only the doer's commit after produce
```

Pass the path explicitly on every `run` for this cell — `open.json`,
`fix-N.json`, `close.json` alike — and never rely on the shell's cwd:

```sh
fgos coordination run --cwd "$wt" --file open.json
```

Put the same guard into the Doer/Fixer objective text, because a worker can
be started in the wrong directory by its transport (a herdr pane is the
operator's own shell; a headless spawn has ignored its cwd before): *"First
run `git rev-parse --abbrev-ref HEAD` and stop immediately if it is not
`<prefix>--<slug>`."* After the step reports, check `git -C "$wt" log
--oneline -3` for the commit yourself before any disposition.

## Close

After the cell's `close.json` and the Lead's own merge — never inside a
coordination request:

```sh
git -C "$main" merge --no-ff "$branch"
git -C "$main" worktree remove "$wt"          # from the main checkout, never from inside $wt
git -C "$main" branch -d "$branch"            # only after the merge; keep it if the cell is deferred
```

If `worktree remove` refuses because the tree is dirty, read the dirt first —
an uncommitted worker file is evidence, not noise — then `--force` only once
it is recorded.
