# plan.md — tsk-3kl

Mode: tiny (0 hard-gate/story flags apply — no auth, authorization, data
model, audit/security, external-system, public-contract, cross-platform,
existing-covered-behavior, weak-proof-area, or multi-domain concern; a
couple of files, one direct task, per fgos-routing's own Mode-gate
thresholds).

## Approach

Add a new "Step B.5 — log the dispatch" section to
`.agents/skills/_shared/executor-dispatch-fallback.md`, immediately after
Step B's existing "Once Monitor reports the command exited..." paragraph
(the point where Step B already has `executorId`, `provider`, `command`,
and `model` in hand from the execute call's own final JSON line — see
RESEARCH.md Round 1, point 2). The new step calls:

```bash
node "$root/src/runner/dispatch.mjs" log <EXECUTOR_ID> --id "<id>" \
  --provider "<provider>" --command "<command>" [--model "<model>"]
```

using exactly the fields Step B's own JSON result already returned —
`<EXECUTOR_ID>` is the same value Step A already resolved, `<id>` is the
currently claimed item id (already known to every consuming skill's own
reasoning step). No new field needs to be resolved; this is purely wiring
an existing, already-tested CLI verb (`dispatch.mjs log` →
`logExecutorDispatch`, `src/runner/dispatch.mjs:1786`/`2179-2197`,
confirmed present and unmodified) into a fragment that currently never
calls it (RESEARCH.md Round 1, point 1).

**Mirror discipline (RESEARCH.md Round 1):** the canonical copy is
`.agents/skills/_shared/executor-dispatch-fallback.md`; apply the
byte-identical edit to `plugins/fgOS/skills/_shared/executor-dispatch-
fallback.md` too — the two are a hand-maintained mirror pair, enforced by
`test/skills/fgos-mirror.test.mjs`'s own `_shared` assertion. Never touch
`.claude/skills/_shared/` — that directory does not exist; `.claude/skills`
is a generated thin-wrapper layer (tsk-1qi) that carries no fragment copy
of its own.

**Impact-analysis gate (CLAUDE.md):** not applicable to this piece — no
function/class/method is edited. `logExecutorDispatch` and the `log` CLI
subcommand are cited, read-only, unmodified. The change is additive prose
in a fragment file, so GitNexus's "MUST run impact before editing a
symbol" rule has no symbol to run against here.

**`fgos graph --json`:** skipped — this is a single honest piece with one
action (edit two mirrored files, run the existing test), so there is no
multi-piece ordering decision for `criticalPath`/`topUnblock` to inform.
Noted here so the skip is a recorded decision, not a silent omission.

## Files touched

- `.agents/skills/_shared/executor-dispatch-fallback.md`
- `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md`

No `src/` file changes — this item is prose-only.

## Risk map

| Component | Risk | What proves it |
|---|---|---|
| Fragment prose addition | light | `test/skills/fgos-mirror.test.mjs` (both copies stay byte-identical) plus a manual positive check that the new heading and `dispatch.mjs" log` call text actually landed (see note below) |

## Verify

Item's own `verify` (set at discovery, `fgos-researching`'s own proposal,
already a real command — never overwritten here per this skill's own
hard rule "if the item already carries a real, distinct verify, do
nothing"):

```
node --test test/skills/fgos-mirror.test.mjs
```

**Known gap, documented not fixed here:** this command alone proves the
two copies match each other — it does NOT positively prove the "Step B.5"
section was actually added (an edit that touches neither file, or reverts
both, still passes it). `docs/how-to/write-verify-for-a-skill-prose-
change.md` names this exact failure shape (a verify with only a mirror/
negative-style check, no positive existence check) as trap #5's sibling —
its own literal scope (`**/SKILL.md`) does not cover this `_shared/*.md`
fragment file, so its structure was not imposed on `work.verify` here, but
the same reasoning applies. Mitigation: `fgos-coding-implement`'s own
self-review pass should additionally confirm, before returning:

```
grep -qF '## Step B.5 — log the dispatch' .agents/skills/_shared/executor-dispatch-fallback.md \
  && grep -qF 'dispatch.mjs" log ' .agents/skills/_shared/executor-dispatch-fallback.md
```

This is advisory (not the recorded `work.verify`), consistent with this
skill's own rule against overwriting an already-real verify field.

## No split

One honest piece — a two-file prose addition. `fgos-coding-validating`
should read this as `pass-through`.

## Outstanding questions

None
