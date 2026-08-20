# Plan: fgos() shell wrapper auto-appends --dir when caller omits it

Item: `tsk-577p`. Mode: **standard** — touches an existing-covered-behavior
surface (`test/scripts/fgos-shell-integration.test.mjs`'s 9 existing tests)
and a widely-depended-on internal contract (`fgos()`, sourced by every
agent/human shell working in this repo), and is story-sized: one shell
function plus ~22 doc call sites plus a documentation gap. Discovery
verdict was `clear` (no `exploring` round, no `CONTEXT.md` — see
`RESEARCH.md` round 1 for the grounding evidence this plan cites).

## Approach

1. `scripts/fgos-shell-integration.sh`'s `fgos()` (not `fgos-runner()` —
   `grep -rn 'fgos-runner\.mjs' .agents/skills/` → 0 hits, so the doc-site
   friction this item exists to fix never touches that function; leaving
   it alone is YAGNI, not an oversight — see `RESEARCH.md` round 1):
   scan `"$@"` for an already-present `--dir`/`--dir=*` token; only when
   absent, append `--dir "$root"` after `"$@"` before the
   `node "$root/bin/fgos.mjs" "$@"` call. Order doesn't matter for
   argument-parsing purposes since it is only ever appended when no
   `--dir` exists yet, so there is nothing to "win" against.
2. `test/scripts/fgos-shell-integration.test.mjs`: extend the existing
   suite with two new tests — (a) calling `fgos <verb>` with no `--dir`
   results in the underlying `node .../bin/fgos.mjs` invocation receiving
   `--dir "$root"`; (b) calling `fgos <verb> --dir <explicit>` leaves that
   explicit value untouched (proves the "don't override an explicit
   `--dir`" constraint the item's own description flags as the one real
   risk to test before this is done).
3. Flatten each of the 22 call sites found by
   `rg -Fl --hidden 'root=$(git rev-parse --path-format=absolute --git-common-dir' --glob "!.claude/worktrees/**" .agents/skills`
   from the two-step `root=$(...)` + `node ... --dir "$root"` pattern into
   a single `fgos <verb> ...` line, dropping the now-redundant
   resolve+`--dir` plumbing and keeping every verb-specific flag exactly
   as it already reads. Purely mechanical — no verb, id, or flag value
   changes.
4. Document `scripts/write-wrapper-script.mjs` (confirmed to already exist
   with a working `--command`/`--dir`/`--name` CLI, currently referenced
   from exactly one doc site — `RESEARCH.md` round 1) in
   `plugins/fgOS/skills/_shared/fgos-cli-fallback.md`, the canonical
   CLI-invocation fallback doc every `plugins/fgOS/skills/**` wrapper
   already points to: a short note that when a call is still too complex
   for the worktree-isolation guard even after step 3's flattening (an
   embedded heredoc, a `$(cat file)`, multiple chained verbs), the escape
   hatch is `node scripts/write-wrapper-script.mjs --command "<full
   command>" --dir "$root"`, then running the path it prints.

No `fgos graph`-driven reordering needed: `tsk-577p` is its own isolated
component (`fgos graph tsk-577p --json` → `{"size":1,"items":["tsk-577p"]}`,
no deps, no dependents), so the four steps above are ordered purely by
internal dependency (fix the function first, prove it with a test, only
then touch the doc sites that assume the fix exists, then the unrelated
doc-discoverability addition last).

## No split

One honest piece. All four steps serve the same behavioral fix (steps 1-3)
or the same underlying discoverability gap the item's own description
bundles in ("kèm theo", step 4) — none is independently shippable in a way
that offsets writing separate `action`/decision-id citations `fgos-coding-
validating`'s child-spec shape would require, especially since this item
skipped `exploring` and has no `CONTEXT.md` decision table to cite from.

## Risk map

| Component | Risk | Proof |
|---|---|---|
| Auto-append conditional in `fgos()` | light — additive-only; a caller that already passes `--dir` is byte-identical to today, guarded by the "only when absent" check | New test (b) above proves an explicit `--dir` survives unchanged; existing 9 tests stay green untouched (none of them pass `--dir` today, so none change behavior) |
| Flattening 22 doc call sites | light — pure prose/example edit inside `.agents/skills/**`, no runtime code touched | NEGATIVE: `! rg -Fl --hidden 'root=$(git rev-parse --path-format=absolute --git-common-dir' .agents/skills` (zero files left with the old pattern); each rewritten line still runs the exact effective command once step 1 lands |
| Documenting `write-wrapper-script.mjs` | light — pure doc addition | POSITIVE: `grep -q "write-wrapper-script.mjs" plugins/fgOS/skills/_shared/fgos-cli-fallback.md` |

Impact-analysis posture: `degraded` — `fgos tool query --capability
impact-analysis --status present` returns GitNexus as `present` (checked
directly this session, not assumed), but its index is flagged stale (a
`PostToolUse` hook reminder fired after a real commit this session: "last
indexed: 7bb3231", behind current HEAD). Moot for this item regardless:
every file touched is either a shell script or Markdown prose, both
outside GitNexus's indexed code-graph surface (same finding `tsk-3k2`'s
own `plan.md` already recorded for this exact script) — a fresh index
would have nothing to say about these paths either. The risk map above
(a real behavioral test plus a grep-based call-site census) is the
complete proof surface for a `light`-risk item.

## D5 compliance (carried from the item's own description, verified in
## `RESEARCH.md` round 1)

`docs/history/fgos-worktree-state-write-guard/CONTEXT.md`'s D5 constrains
`bin/fgos.mjs` (the node CLI) — it resolves `.fgos/` strictly under
`process.cwd()` and never git-resolves upward itself. This plan does not
touch that constraint: the shell function does its own git-resolve (as it
already does today, unrelated to this item) and passes the result as an
explicit `--dir` argv element; `bin/fgos.mjs` still receives an explicit
flag every time, never re-derives anything on its own.

## Outstanding questions

None
