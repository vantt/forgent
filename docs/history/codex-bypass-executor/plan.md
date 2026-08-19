# plan.md — tsk-3tkc: wire codex CLI as an executor via bypass-all

Mode: **high-risk**

Flags counted per `fgos-routing`'s Mode gate, same reasoning tsk-4kh's own
`plan.md` used for the same subsystem: **authorization** (the whole
subject is the worker's own permission/capability boundary — here, the
explicit decision to remove rather than build one), **audit/security**
(shipping an unconditional bypass executor into the dispatch fleet is a
real security-posture change, mechanical flag, not judged on severity),
**external systems** (`codex`, a third-party CLI binary, is the surface
configured). Two of three (audit/security, external systems)
independently hard-gate the lane — high-risk regardless of count, same
conclusion tsk-4kh's own plan.md reached.

No `CONTEXT.md` exists: this item's discovery verdict was `clear`
(`docs/history/codex-bypass-executor/RESEARCH.md` Round 1), which skips
`exploring` entirely. The one real product decision this plan rests on —
accept `--dangerously-bypass-approvals-and-sandbox` rather than leave
`codex` unwired — was made explicitly by the user in the live session
that filed this item (tsk-3tkc's own description), after reviewing
tsk-4kh's full research record (`docs/history/codex-permission-
capability-boundary/RESEARCH.md`, unmerged branch `fgw/tsk-4kh`, Rounds
1-4). That record is this plan's own precedent doc — read before writing
this file.

**`impact-analysis: degraded`** — GitNexus is `present`
(`fgos tool query --capability impact-analysis --status present`) but
its index is flagged stale (`last indexed: 7bb3231`, older than current
HEAD). Not load-bearing for this plan regardless: the change below never
edits an indexed symbol, only a config file (see Approach) — no
`impact({target, direction})` call is needed for this item's own
footprint. Recorded per the capability gate's own instruction, not
skipped.

## Approach

**What discovery already established (RESEARCH.md Round 1, live-proven,
not assumed, carried forward from tsk-4kh's own Rounds 1-4):**
`codex exec --dangerously-bypass-approvals-and-sandbox` runs the full
worker contract (a directly-invoked shell command, plus a NESTED
subprocess spawn — the exact shape `.githooks/pre-commit` needs for its
own `git rev-parse` calls) successfully end to end. `-s workspace-write`
(the real OS sandbox) cannot: it blocks the nested spawn with `EPERM`,
confirmed still true on current `main` (RESEARCH.md Round 1, point 3).
The user's own explicit trade-off, reviewed and accepted this session:
no sandbox boundary at all, in exchange for `codex` actually being usable
as a dispatch executor in this repo today.

**Single config-only change — no source code, no new doctor check/fix
module.** Unlike a sandboxed boundary (which needs live-proven policy
flags AND a fallback path for whatever the sandbox blocks), bypass-all
needs nothing provisioned: it is one CLI flag on one invocation. This
item touches exactly one file, `.fgos/config.json`, adding a `codex`
entry to `runner.executors` mirroring `agy`'s own shape (RESEARCH.md
Round 1, point 1):

```json
"codex": {
  "kind": "agent",
  "description": "OpenAI Codex CLI (bypass-all -- no sandbox boundary, see docs/history/codex-bypass-executor/)",
  "allowCrossProvider": true,
  "invocations": [{
    "via": "cli", "adapter": "cli-spawn", "command": "codex",
    "args": ["exec", "--dangerously-bypass-approvals-and-sandbox", "{prompt}"]
  }]
}
```

**No `providerModel`/`rigorOverrides`, no new `runner.modelPolicies`
entry.** `agy`'s own entry needs `--model {model}` because its CLI
requires an explicit model argument; `codex --help` (tsk-4kh Round 1)
showed no such required flag, and nothing found this session contradicts
that (RESEARCH.md Round 1, point 2). `codex exec` runs against whichever
model `~/.codex/config.toml`/the account already defaults to. This is the
simpler, honestly-sufficient answer the open question in RESEARCH.md
flagged as legitimate rather than blocking — no `openai` provider entry
is created because nothing in this item's own invocation ever asks
`resolveExecutorConfig` to look one up.

**Out of scope, deliberately — `SUPPORTED_EXECUTOR_TEMPLATES`
(`src/runner/dispatch/config.mjs:159`).** That table is for OTHER
projects' bootstrap auto-detection of `codex` on `PATH`, not for wiring
`codex` as THIS repo's own dispatch executor — the item's own goal. Not
touching it keeps this item's footprint to the one config file and means
none of tsk-4kh's plan.md's three repo-invariant checks (architecture-
manifest.json row, distribution.md Data Dictionary rows, `checks.test.mjs`
hardcoded id-list) apply here — those only trip on a new
`src/setup/*.mjs` doctor check/fix module, and this item adds none. If a
later session wants codex auto-detected for OTHER projects, that is new
scope, filed as its own item against the evidence already sitting in
RESEARCH.md Round 1 point 4 (still no entry today) — not silently folded
into this one.

**`.fgos/config.json` edits land on the MAIN checkout only, never inside
this item's own linked worktree** (`fgw/tsk-3tkc`) — ADR0020 strips
`.fgos/` from every worktree's working tree, so a worktree branch can
never carry that file's change itself (same lesson tsk-4kh's own
description carried forward as a hard requirement). Execute must commit
this change from the main checkout, not from inside `fgw/tsk-3tkc`.

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| `.fgos/config.json`'s new `codex` entry (bypass-all, no `--model`) | High — if the args are wrong, dispatch through `codex` is broken on day one; if the security framing is wrong (someone reads this as a sandboxed executor), that's a worse failure than a broken command | Discovery's own smoke-test verify (`docs/history/codex-bypass-executor/RESEARCH.md` Round 1) run from a REAL `fgw/<id>` linked worktree (not the main checkout scratch tree tsk-4kh's own Round 4 probe used) — file write, `git add`, `git commit` against a real pre-commit hook run, must all succeed, not hang |
| Security-posture documentation | Standard — a silent, undocumented bypass executor sitting next to `agy`'s sandboxed-by-comparison entry is a real trap for a future session that assumes every executor carries some boundary | The `description` field on the config entry itself says "bypass-all -- no sandbox boundary" plus a pointer to this doc; `CHANGELOG.md`'s `## [Unreleased]` gets a line per AGENTS.md's install/setup/doctor gate ("does this change something a user of fgOS would see") |
| No `runner.modelPolicies`/`src/setup/*.mjs` touched | Light — confirmed by RESEARCH.md Round 1 points 2 and the "no new doctor module" framing above; nothing to prove beyond the smoke test already covering the one invocation that would surface a missing-model error loudly | Smoke-test verify above; a model-resolution failure is loud and immediate, not silent |

## Shape

One piece, no split — a single config-file addition with a documentation
note, proven by one live smoke test from a real worktree. `fgos-coding-
validating` runs that proof; nothing here is deferred to a child item.

Concrete cases the smoke test covers: a real shell command (`echo`) plus
a real nested subprocess spawn (`git rev-parse`, the exact shape
`.githooks/pre-commit` needs) both succeeding unsandboxed, from inside
`fgw/<id>`'s own worktree layout (git-dir/git-common-dir split), not just
a plain top-level checkout — the one distinction tsk-4kh's own Round 2
found actually mattered (a linked worktree's `.git` redirects outside its
own `workdir`).

## Outstanding questions

None
