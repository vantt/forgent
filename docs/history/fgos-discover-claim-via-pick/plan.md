# Plan — /fgOS:discover claims via pick, not take

Item: tsk-20p

## Mode

**tiny** — flag count: 0 of 10 (auth, authorization, data model, audit/
security, external systems, public contracts, cross-platform, existing
covered behavior, weak proof, multi-domain — none apply). The user-facing
`/fgOS:discover <id>` invocation signature is unchanged; only the internal
claim mechanism swaps. One file, one direct task — matches `tiny`.

`fgos graph --json` confirms tsk-20p sits in its own size-1 component (no
deps, no children) — not on any critical path.

No `CONTEXT.md`/`exploring` round happened for this item (discovery
verdict was `clear` — the fix was already fully specified in the item's
own submitted text and confirmed via direct reads of
`plugins/fgOS/skills/discover/SKILL.md` and `plugins/fgOS/skills/pick/
SKILL.md` this same session, no gray area needing a person). Title +
verify are the whole spec here, same as any small item reaching `planning`
with no docs history.

## Approach

Chosen path: in `plugins/fgOS/skills/discover/SKILL.md` step 2 ("Claim if
not already claimed"), replace the `fgos take --role session` claim (plus
its `pick`-fallback-on-refusal branch) with a direct `fgos pick $ARGUMENTS`
+ `EnterWorktree` call, mirroring `/fgOS:pick`'s own steps 2/4 exactly.

Alternatives considered and rejected:
- **Keep `take`, add a separate worktree-entry step after it** — rejected.
  `pick` already does claim+worktree atomically; splitting it into two
  calls duplicates what `pick` is for, and reintroduces the exact
  branch-already-exists fallback logic `pick` itself already handles
  internally (confirmed live: `fgos pick` on an already-branched item
  returns `worktree.reused: true` rather than erroring, per tsk-5qs's own
  second `pick` call this session).
- **Leave `discover` as-is, only fix `cook`/`shaping`** — rejected per the
  user's own explicit direction: `discover` is its own flow with its own
  item (this one), separate from `tsk-hes` (cook) and `tsk-5qs` (shaping,
  already shipped).

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| `discover/SKILL.md` step 2: swap `take`→`pick`+`EnterWorktree` | Low — single skill-prose file, no signature change, direct parallel to `/fgOS:pick`'s own already-working steps 2/4 and to `fgos-coding-shaping`'s just-shipped identical pattern (tsk-5qs) | Verify below (POSITIVE/NEGATIVE grep + `npm test`), per `docs/how-to/write-verify-for-a-skill-prose-change.md` |

Impact-analysis capability gate (`CLAUDE.md`): GitNexus present, full
posture (checked earlier this session) — moot, skill-prose only, no
symbol/function touched.

Files touched: `plugins/fgOS/skills/discover/SKILL.md` (single file, no
mirror — plugin-namespace skills are not byte-identical-mirrored the way
`.claude/skills/**` / `.agents/skills/**` are, confirmed for the sibling
`coding-shape-distill` wrapper during tsk-5qs).

## Shape

Direct note (tiny mode):

1. Replace step 2's `fgos take --role session $ARGUMENTS --dir "$root"`
   call (and its "if the item already carries its own branch... fall back
   to `pick`" paragraph) with:

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   node "$root/bin/fgos.mjs" pick $ARGUMENTS --dir "$root"
   ```

   then `EnterWorktree` into the returned `data.worktree.path` — same
   fallback as `/fgOS:pick` step 4 (print path, stop, if `EnterWorktree`
   is unavailable/refuses).
2. Update step 2's surrounding prose (currently explaining `take`'s
   status-only semantics and the branch-exists fallback) to describe
   `pick`'s claim+worktree semantics instead — the fallback paragraph is
   removed entirely since `pick` already covers that case internally.
3. Step 3 ("Dispatch through `fgos-coding-driving`") needs no change —
   `fgos-coding-driving`'s own claim-timing rule already skips claiming
   again once it sees `status: doing`.

Concrete cases worth pointing to afterward (tiny-mode depth):
- A fresh `/fgOS:discover <id>` call on a `todo` item ends up inside that
  item's `fgw/<id>` worktree before `fgos-coding-discovering`/
  `fgos-coding-exploring` ever writes a file.
- `fgos-coding-exploring`'s `CONTEXT.md` commit (when the discovery
  verdict is `unclear`) lands on `fgw/<id>`, never on `main`.
- Re-running `/fgOS:discover` on an item already claimed by this same
  session (`status: doing`) does not re-claim or error.

## Outstanding questions

None

## Split

No split. One file, one honest piece of work.

## Proof surface

```
npm test && grep -q "fgos pick \$ARGUMENTS --dir" plugins/fgOS/skills/discover/SKILL.md && ! grep -q "fgos take \$ARGUMENTS --role session --dir" plugins/fgOS/skills/discover/SKILL.md
```

No medium/high risk entries — nothing beyond re-confirming this command is
runnable and matches what actually got written.
