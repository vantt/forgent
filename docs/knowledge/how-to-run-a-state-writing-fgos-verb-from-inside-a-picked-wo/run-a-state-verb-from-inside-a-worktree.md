---
type: how-to
title: How to run a state-writing `fgos` verb from inside a picked worktree
tags: []
timestamp: 2026-07-29T08:40:07.000Z
source_capture_ids: [tsk-56t, tsk-1wn]
framework: diataxis
mode: how-to
---

# How to run a state-writing `fgos` verb from inside a picked worktree

Use this when a session has switched into a claimed item's worktree
(`/fgOS:pick`'s own `EnterWorktree` step) and needs to call a state-writing
verb — `ask`, `answer`, `decision`, `discover`, `edit`, `move`, `return`,
`compound`, `unlock`, or a second `pick`/`submit`/`goal` — from there.

## Before you start

A linked worktree under `.claude/worktrees/` never carries its own
`.fgos/` (ADR0020, `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md`)
— `createWorktree` checks one out, then deletes it outright, on purpose, so
nothing can silently diverge from the one real store in the main checkout.
A `requiresExistingStore: true` verb (`bin/fgos.mjs`'s own
`COMMAND_REGISTRY` flags each one) run bare from a worktree cwd refuses
with exit 4:

```
fgos: .fgos/ not found at "<worktree>/.fgos" -- run "fgos init" here first,
or check you are not inside a linked worktree (worktrees never carry
.fgos/, per ADR0020: docs/decisions/0020-chan-fgos-khoi-worktree-worker.md).
```

## Steps

1. **Resolve the main checkout root** from wherever the session's cwd
   actually is:

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   ```

   This works from a linked worktree or the main checkout itself
   identically — `git-common-dir`'s parent is always the one real
   checkout, regardless of which worktree you're standing in.

2. **Pass `--dir "$root"` on the state verb call.** Two equivalent forms,
   depending on which script copy you're invoking:

   ```bash
   # Using the worktree's own bin/fgos.mjs (has the fix once this item is merged):
   node ./bin/fgos.mjs <verb> ... --dir "$root"

   # Using an explicit absolute path (what plugins/fgOS/skills/*/SKILL.md
   # templates do, via ${CLAUDE_PROJECT_DIR}):
   node "$root/bin/fgos.mjs" <verb> ... --dir "$root"
   ```

   `--dir` is additive and opt-in — a bare `fgos <verb>` (no `--dir`) is
   completely unaffected; it still resolves `.fgos/` under the caller's
   own cwd exactly as before (D5). Passing `--dir` pointed at the *same*
   directory you're already standing in (e.g. running from the main
   checkout itself) is a harmless no-op.

3. **Read verbs stay silent-safe, but now warn.** `list`/`ready`/`graph`/
   `stale`/`check`/`rollup`/`conflicts`/`triage` don't refuse on a missing
   store (a fresh non-worktree dir with no store yet is legitimately "not
   evaluated") — but called bare from a linked worktree, they now print a
   stderr line naming the gap instead of silently looking like "no open
   work":

   ```
   fgos: warning: .fgos/ not found at "<worktree>/.fgos" -- this view may
   be empty because the real store lives elsewhere (worktrees never carry
   .fgos/, per ADR0020); pass --dir <mainRoot> to read it.
   ```

   Passing `--dir "$root"` on these too silences the warning and returns
   the real data.

## Why this exists

A separate guard (tsk-4fu-2, `bin/fgos.mjs`'s `requiresExistingStore`
check) already stops a worktree-resident state verb from silently writing
into a phantom local `.fgos/` — but that guard alone left no *documented,
ergonomic* way to actually run the call correctly from there. Before this,
a session either had to `cd` back out to the main checkout mid-session
(risky in a real persistent shell — a forgotten subshell permanently moves
the session's cwd off the worktree it's supposed to be editing in) or hit
the refusal repeatedly with no clear next step. `--dir` removes that
operator-error class outright: the cwd never needs to change, and the
worktree stays the session's actual working directory throughout.

## Real example

This exact gap surfaced through `tsk-3fb`/`tsk-37v` (2026-07-28): a session
ran `discover`/`decision`/`return` from inside a picked worktree, and
`fgos approve` later reported `"doing", not "proposed"` even though the
work had genuinely completed on `fgw/<id>` — main's own `.fgos/` had only
ever seen the original `pick` (run correctly from main), never anything
that followed inside the worktree.

Fixed and verified end-to-end in `tsk-56t`'s own session: from inside
`.claude/worktrees/tsk-56t-w84oHC`, running

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node ./bin/fgos.mjs return tsk-56t --dir "$root"
```

moved the item `doing -> proposed` — real `work.move` event landing in
the main checkout's `.fgos/events.jsonl`, visible via a plain `fgos list`
from main immediately after, with no manual `cd`, subshell, or sync step.

## A third case: a verb whose write target ignores `--dir` entirely

The two categories above (`requiresExistingStore: true` refuses loudly;
the eight read verbs warn) assumed those were the only two ways a
worktree-resident call could go wrong. `tsk-1wn` (2026-07-30) found a
third: a verb registered `requiresExistingStore: false` that still writes
a real file, using a variable derived from `process.cwd()` instead of the
already-`--dir`-aware `dir` — neither refusing nor warning, just silently
targeting the wrong location.

`fgos docs-index`'s handler set `const repoRoot = process.cwd();`
(`bin/fgos.mjs`), completely independent of the `dir` variable its own
`listWork(dir)` call two lines later used for state. A worktree session
running the `fgos-indexing`-instructed bare `fgos docs-index` (no `--dir`
at all, since the verb never refused to prompt for one) would:

- read an empty outcomes view — `listWork` on a missing store rebuilds to
  `{}` silently, no crash, no warning (`docs-index` isn't in the read
  verbs' `STORE_MISSING_WARNING_VERBS` set either) — so every entry's
  `sourceCaptureId` came back `null`;
- scan and write `docs/enduser-docs-index.json` inside the **worktree's
  own local checkout**, never the shared main-checkout file.

Fixed by deriving the write-target root from `dir` itself
(`repoRoot = path.dirname(dir)` — `dir` is always exactly
`<repoRoot>/.fgos`, per `fgosDirFromRoot`, `src/runner/paths.mjs`), the
same root `--dir` already resolves, instead of a second, independent
`process.cwd()` read. The lesson generalizes: any verb whose handler
writes a real file (not just event-log state) needs that write's root
derived from the SAME resolved root as `dir`, never a second,
independent `process.cwd()`/`__dirname`-style read — two different root
resolutions in the same handler is exactly how a fix like `--dir` support
stops covering the whole handler. Full evidence and the locked decisions:
`docs/history/docs-index-repo-root-fix/CONTEXT.md` (D1).

## A fourth case: `STORE_MISSING_WARNING_VERBS` missing an entry can silently return the WRONG safety answer, not just an empty one

The "read verbs warn" set in step 3 above isn't fixed forever — a verb
missing from `STORE_MISSING_WARNING_VERBS` doesn't always fail safe with
an empty-looking view. `tsk-3u2` first found `fgos schedule` itself
missing from the set (fixed there, and in
`docs/how-to/compute-a-parallel-dispatch-wave-schedule.md`'s own
"Update (tsk-3u2)" section). A follow-up review (`tsk-3g5`, filed right
after `tsk-3u2` merged) found three more verbs with the same gap —
`gate-bypass`, `doc-sources`, `lock-status` — and one of them is a
materially worse failure shape than the original:

- **`gate-bypass` from a worktree with no `.fgos/` silently returned
  `level: "off"`** — while the real main checkout's actual level was
  `"standard"`. This is not an honest-looking empty result the way a
  missing store normally reads; it is a **silently wrong safety answer**,
  confirmed by running the command directly and comparing outputs. A
  caller trusting the worktree's own answer would believe gate-bypass
  was disabled when it genuinely was not.
- **`doc-sources` silently returned `count: 0`** from a worktree — reads
  exactly like "no other captures are linked to this doc path," the same
  empty-but-plausible-looking failure shape `docs-index`'s bug (the third
  case above) already showed.
- **`lock-status` always reported `"free"`** from a worktree, regardless
  of the real lock state in the main checkout — another case where the
  wrong answer looks like a normal, safe-sounding one instead of an
  obvious error.

All three are `requiresExistingStore: false` verbs (so they don't refuse
outright like the `requiresExistingStore: true` category above) but were
simply missing from `STORE_MISSING_WARNING_VERBS`, unlike the already-
covered read verbs. Fixed by adding all three to that set — the same
`--dir <mainRoot>` fix already described above applies. The generalized
lesson: any verb reading state without `requiresExistingStore: true`
needs a deliberate check that it's either in `STORE_MISSING_WARNING_VERBS`
or has some other honest way of signaling "this may not be the real
answer" — omission from that set is not a neutral default, since some
verbs' own empty/off/free-looking defaults are indistinguishable from a
genuine, confidently wrong answer.

## A fifth round: `evolve` and `docs-index` still missing, and a proposed structural fix

A round-3 independent review (`tsk-5iv`), after `tsk-3g5` merged, found
`STORE_MISSING_WARNING_VERBS` still missing two more verbs — `evolve`
and `docs-index` — both `requiresExistingStore: false`, both silently
returning an empty/stale result from a `.fgos/`-less worktree with zero
stderr warning. Verified concretely: `fgos evolve` returned `[]` from a
worktree versus 26 real candidates from main, no warning either way —
the identical silent-empty-result failure class the fourth case above
already described for `doc-sources`. Fixed by adding both to the set.

**This is the third separate round widening the same hand-maintained
`Set`** (`tsk-3u2`, `tsk-3g5`, now this one) — the review noted, without
committing to it as in-scope here, that deriving the set automatically
from the command registry's own `requiresExistingStore: false` flag
(minus an explicit opt-out list for verbs that legitimately create or
manage the store themselves — `init`/`setup`/`uninstall`/`doctor`/
`session`) would close this whole class of gap structurally instead of
requiring a fourth, fifth, or sixth manual widening whenever a new verb
is added. Left as a documented option for a future item, not implemented
here — the immediate real gap (two more silently-wrong-answer verbs) was
fixed directly instead.

## A sixth case: a non-verb *script* resolving the wrong root, cosmetic but still worth fixing

`tsk-5ma` found the same `resolveRepoRoot()`-vs-main-checkout mistake in
a place that isn't a CLI verb at all: `scripts/fgos-session-start-hook.mjs`
— the hook that prints "fgOS canonical paths" context when a session
starts. Line 16 called `resolveRepoRoot()` (`git rev-parse
--show-toplevel`, which returns whichever checkout `cwd` is currently
in) instead of `resolveMainCheckoutRoot()`, then derived the storage
path from that. Confirmed live from inside a linked worktree:
`resolveRepoRoot()` returned the worktree's own path
(`.claude/worktrees/tsk-5hv-P9OLdR`); `resolveMainCheckoutRoot()`
correctly returned the real main checkout. Since `.fgos/` is
unconditionally wiped from every freshly-created worktree (ADR0020), the
wrong root silently produces a path to a directory that simply doesn't
exist.

Found while fixing 8 other instances of the exact same bug class during
`tsk-5hv`'s `.fgos-runner.json` retirement — this was the one remaining
real instance, confirmed by auditing every other `resolveRepoRoot()`
caller in the codebase. Two other callers were checked and confirmed
**not** the same bug: `bin/fgos-runner.mjs`'s and `loop.mjs`'s own uses
are intentional per the runner's documented contract (operate on
whichever checkout it's invoked from); `git-hooks.mjs`'s
`resolvesToGithooks` genuinely needs the worktree's own root, since
`core.hooksPath` wiring has to resolve correctly from *any* worktree,
not just the main checkout.

**Impact stayed narrow, by the hook's own design**: its own header
comment states it "NEVER THROWS, ALWAYS EXITS 0... path injection is
pure convenience, never load-bearing" — so this bug never broke
anything functionally. It only misled whoever read the printed
"canonical paths" context at the start of a session that happened to
start fresh with `cwd` already inside a `.claude/worktrees/*` directory
— not the common `/fgOS:pick` mid-session-switch case, which runs this
hook only once, before the switch, and was never affected.

## Related

- `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` — why a linked
  worktree never carries its own `.fgos/` in the first place.
- `docs/history/fgos-worktree-state-write-guard/CONTEXT.md` and
  `plan.md` — the locked decisions and shape behind this fix.
- `docs/how-to/clear-a-stuck-main-checkout-lock.md` — a related
  worktree/main-checkout-boundary recovery, for the claim lock rather than
  the store path.
- `docs/how-to/add-a-read-only-fgos-verb-and-plugin-skill.md` — its own
  step 2 mirrors an existing read-only entry's flags for any new verb;
  that recipe alone would have reproduced this exact bug for a verb that
  writes a real file, so it now flags the case.
- `docs/history/docs-index-repo-root-fix/CONTEXT.md` — the full D1-D4
  decision trail behind the third case above.
- `docs/how-to/compute-a-parallel-dispatch-wave-schedule.md` — the
  `fgos schedule` instance of the `STORE_MISSING_WARNING_VERBS` gap that
  the fourth case above generalizes from.
- `docs/how-to/safely-reset-the-main-checkout.md` — a related but
  distinct failure shape found in the same `tsk-5iv` review round: a
  worktree-resolution bug where the resolved root was silently *wrong*
  (not just an empty warning-worthy result).
