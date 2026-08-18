# Why fgOS retired `.fgos-runner.json` entirely instead of fixing its fallback chain

`tsk-5hv` removed `.fgos-runner.json` — the legacy config file
`.fgos/config.json` was meant to have already superseded — as a full
retirement, not another patch to the fallback chain that read it. Every
runtime path that could fall back to reading the legacy file had that
branch deleted outright, and the repo's own tracked copy of the file was
deleted along with it.

## The bug that triggered it: a direct read with zero fallback awareness

The root complaint wasn't actually about the fallback chain misbehaving
— it was worse than that. `scripts/project-agents.mjs`'s
`readRunnerModels()` read `.fgos-runner.json` directly via
`fs.readFileSync`, never checking `.fgos/config.json` at all. This
wasn't a fallback bug; it was code that ignored the canonical file
outright, unconditionally reading the file that was supposed to be
obsolete.

The evidence this was actively causing wrong behavior, not just
theoretically risky: at the time this was found, this repo's own two
config files had already drifted apart. `.fgos/config.json`'s
`runner.executors.judge.args` included `Task,WebSearch,WebFetch,Read,...`
in `--allowedTools`; the legacy file's copy was missing those entries.
`project-agents.mjs` was generating real agent definitions off a stale,
incomplete snapshot — a live, observable consequence of the bug, not a
hypothetical one.

## Not a novel bug — the same pattern had already been caught and fixed once, elsewhere

`src/runner/dispatch.mjs` had hit this *exact* shape of bug before
(`tsk-5vf` D2): a direct `ensureRunnerConfig(path.join(root,
'.fgos-runner.json'))` call bypassing the shared-config-first
resolution, fixed to match the resolution order every other caller
already used. `project-agents.mjs` was simply never brought in line with
that earlier fix — the same class of mistake reappeared in a second
call site because the fix the first time was applied locally, not at
the shared resolution layer.

## Why the response was "delete the file," not "fix the third call site"

The obvious minimal fix — redirect `readRunnerModels()` through the
existing fallback chain, the same way `tsk-5vf` fixed `dispatch.mjs` —
was explicitly rejected in favor of removing the fallback chain itself.
The reasoning: fixing this one call site to correctly read through the
fallback would leave the fallback chain itself in place, as a structure
that had already proven — twice now — that it's easy for a new call
site to bypass by accident. Removing the thing being bypassed closes the
whole bug *class*, not just this one instance of it.

**Cold-turkey, not a migration path**: no migration helper, no warn-only
transitional period. The rationale was explicit and specific to this
repo's own current state: no external project depends on fgOS yet — this
retirement is groundwork ahead of the first real release, not a
compatibility break for existing adopters, because there are none yet.
This reasoning is time-bound by design — it stops applying the moment
fgOS actually ships to users who might have their own `.fgos-runner.json`
files depending on the fallback.

**The repo's own tracked `.fgos-runner.json` was deleted too**, not just
stopped-being-read. Its data was already fully duplicated (and, by that
point, more current) in `.fgos/config.json` — once nothing in the
codebase reads it, keeping the file around is pure stale clutter, and a
repo about to ship its first release with a visibly drifted legacy
config file sitting in its root would be actively misleading to anyone
who found it.

## Scope: real logic changes, separated cleanly from narrative-only mentions

The fix touched real runtime behavior in four places: the shared-config
resolution module's own legacy-read branch, global-config's "either file
counts as project-present" check, the doctor's `config-not-stale` check,
and the direct-read bug itself in `project-agents.mjs`. A fifth,
easy-to-miss location carried the same bug in a different form: a *skill
prose* file (`.claude/skills/_shared/executor-dispatch-fallback.md`, and
its byte-identical, hand-maintained duplicate under `.agents/skills/`)
had a config-check script literally parsing `.fgos-runner.json` directly
in its own Step A — confirmed to have no projection script keeping the
two copies in sync, unlike some other dual-root files in this repo, so
both needed the identical edit by hand.

Separately, a batch of files only mention the filename in a code
*comment* — narrative describing past behavior, not live logic. These
were cleaned up only where already being touched, not hunted down as a
goal in themselves — including one deliberate exception:
`decompose.mjs`'s dotfile-tokenizer regex example comment keeps using
`.fgos-runner.json` as an illustrative dotfile name even after the real
file is gone, since that comment demonstrates tokenizer behavior on
dotfiles generically, not documentation of this specific file's
existence.

**Confirmed explicitly out of scope**: `bin/fgos-runner.mjs` — the
runner CLI binary. Its name collides with the retired config file, but
it's a different artifact entirely, and a grep confirmed it never reads
or references `.fgos-runner.json` as a path at all. Also out of scope:
`docs/history/**` and `docs/decisions/**` content mentioning the legacy
file — those are records of past decisions, never edited to match
current state, regardless of what changed since they were written.

Full decision record (D1-D2), the complete grep census separating
runtime-changing call sites from comment-only mentions, and the 17 test
files / ~15 docs enumerated as needing follow-up once the fallback
branch was actually deleted:
`docs/history/retire-fgos-runner-json-fallback/CONTEXT.md`.
