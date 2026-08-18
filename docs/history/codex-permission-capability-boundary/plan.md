# plan.md — tsk-4kh: wire codex CLI as an executor with a live-proven permission boundary

Mode: **high-risk**

Flags counted per `fgos-routing`'s Mode gate: **authorization** (this
item's whole subject is the worker's permission/capability boundary,
same reasoning tsk-1xm counted this flag under), **audit/security**
(replacing an unconditional-bypass default with a real sandboxed
boundary is a real security posture change — mechanical flag, not
judged on severity), **external systems** (`codex`, a third-party CLI
binary, is the surface being configured — mirrors tsk-1xm exactly),
**existing covered behavior** (`test/runner/dispatch.test.mjs:1203-1224`
already tests `detectAssistantCli(['claude', 'codex'], dir)`; confirmed
by direct read this round that none of those 3 tests assert codex has
NO template, so adding one is additive, not a break — still counted as
a flag since it is existing coverage this item's own change sits next
to). Four flags, two of them (audit/security, external systems)
independently hard-gate the lane — high-risk regardless of count alone,
same conclusion tsk-1xm's own plan.md reached for the same reasons.

`docsRef` registered this pass (`docs/history/codex-permission-
capability-boundary/`) — discovery's verdict was `clear`, which skips
`exploring`, so no `CONTEXT.md` exists; every claim below traces to
`RESEARCH.md` Round 1 (this item's own discovery-stage research) or a
live command run in this same planning pass, cited inline.

## Approach

**What discovery already established (RESEARCH.md Round 1, live-proven,
not assumed):** `codex exec -s workspace-write` (no
`--dangerously-bypass-approvals-and-sandbox`) is a real, OS-enforced
default-deny sandbox — file writes confined to the workspace + `/tmp`/
`$TMPDIR`, network access blocked entirely (DNS resolution itself
fails), and it is the CLI's own **default** shape, not something this
item needs to configure into existence the way tsk-1xm had to build
`permissions.deny` for `agy`. Confirmed via three live probes from this
repo's own worktree: a file-write-plus-shell-command dispatch
succeeded cleanly (no hang, no silent no-op); a write outside the
workspace failed at the OS filesystem layer (`read-only file system`);
a network call failed at DNS resolution. A fourth probe
(`codex sandbox -- <cmd>`) confirmed the same boundary holds with ZERO
LLM turns involved — the enforcement lives in the sandbox layer itself,
not in agent-turn judgment that could be skipped or buggy.

**Consequence — no shared external config file needs provisioning.**
Unlike `agy` (which required a `~/.gemini/antigravity-cli/settings.json`
denylist to get ANY working boundary), `codex`'s boundary is expressed
entirely as a CLI flag (`-s workspace-write`) inside `.fgos/config.json`'s
own `runner.executors.codex.invocations[0].args` — the one file this
item actually needs to touch for the mechanism itself. This means:

- **No new `src/setup/*.mjs` doctor check/fix module is needed for the
  permission boundary.** The existing generic `config-not-stale` check
  already covers `.fgos/config.json` staying in its registered default
  shape; there is no second, external, machine-wide file this item
  introduces a dependency on (AGENTS.md's install/setup/doctor gate: a
  new infra dependency needs registration — there isn't one here to
  register).
- **`codex`'s binary presence is already covered by the existing
  `tool-registry-configured` check** (`src/state/tool-registry.mjs`'s
  `toolsFromExecutors` derives tool entries straight from
  `runner.executors` — confirmed by reading `.fgos/config.json`'s own
  top-level keys this pass: no separate `tools` section exists, `agy`
  itself has no bespoke presence-check module either). Adding
  `runner.executors.codex` is enough; no new registration code.

This is a materially simpler deliverable than tsk-1xm's, not a lesser
one — the item's own text anticipated a possible "codex turns out MORE
capable than agy's" outcome and asked for it to be documented plainly;
this is that outcome.

**Decision: `-s workspace-write`, not `-s read-only` or
`-s danger-full-access`.** `read-only` cannot satisfy the worker
contract (it needs to write within its own footprint and commit);
`danger-full-access` removes the sandbox boundary entirely, the same
class of over-permission `--dangerously-bypass-approvals-and-sandbox`
represents. `workspace-write` is the minimal mode that lets the actual
contract (read/write within footprint, run verify/shell commands,
`git add`/`git commit`) succeed, per RESEARCH.md Round 1's own live
proof.

**Rejected alternative — `-a untrusted`/`-a on-request` approval
policies.** `codex exec`'s own default for non-interactive dispatch is
already `-a never` (confirmed live via the printed session header,
`approval: never`, with no `-a` flag passed) — the correct headless
shape (never prompt a human that is not there), matching the class of
behavior tsk-1xm had to get `agy` into via `--mode accept-edits` +
`toolPermission: always-proceed`. `codex` already defaults there for
`exec`; no flag needed to reach it.

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| `.fgos/config.json`'s new `codex` executor entry (`-s workspace-write`, no bypass flag) | High — if the args cause a real dispatch to hang, silently under-behave, or fail to cover `git add`/`git commit`, the new capacity is broken on day one | Proof point below: a live `codex exec -s workspace-write` dispatch from a REAL `fgw/<id>` worktree (not just this planning pass's scratch probe) running the full worker contract — file write, `git add`, `git commit`, a verify shell command — must complete, not hang, and the commit must actually land |
| `runner.modelPolicies` needing a new provider entry (`openai`, mirroring `gemini`'s shape for `agy`) | Standard — model name validity is a real external dependency, but wrong-model is a loud, cheap-to-fix failure (dispatch errors immediately), not a silent one | A live `codex exec` dispatch using the chosen model name must complete without a model-resolution error |
| `src/runner/dispatch/config.mjs`'s `SUPPORTED_EXECUTOR_TEMPLATES` gaining a `codex` entry (bootstrap template for OTHER projects auto-detecting codex on PATH) | Light — confirmed by direct read this pass that no existing test asserts the current codex-has-no-template state; additive only | `npm test -- test/runner/dispatch.test.mjs` green after the addition, plus a new case proving a codex-only PATH now bootstraps the verified template instead of falling through to the "found X, no verified template" message |
| `test/runner/dispatch.test.mjs`'s existing `detectAssistantCli`/`SUPPORTED_EXECUTOR_TEMPLATES`-adjacent coverage | Light — pure additions, no existing assertion contradicts them (confirmed by direct read) | Full suite green |

**`impact-analysis: full`** — GitNexus is `present`
(`fgos tool query --capability impact-analysis --status present`,
checked live this pass). This item DOES touch a real existing symbol
(`SUPPORTED_EXECUTOR_TEMPLATES`, `src/runner/dispatch/config.mjs`) —
unlike tsk-1xm, whose footprint was config-only. Run
`impact({target: "SUPPORTED_EXECUTOR_TEMPLATES", direction: "upstream"})`
before editing it at implementation time and report the blast radius,
per `CLAUDE.md`'s gate.

**Files likely touched:**
- `.fgos/config.json` — new `runner.executors.codex` entry +
  `runner.modelPolicies.openai` (or whatever `providerModel` name is
  chosen) — main checkout only, never inside a worktree (ADR0020; same
  lesson tsk-1xm's own item carried).
- `src/runner/dispatch/config.mjs` — `SUPPORTED_EXECUTOR_TEMPLATES`
  gains a `codex` entry, once the args shape is confirmed working
  end-to-end against this repo's own `.fgos/config.json` (same evidence,
  reused — not a second research pass).
- `test/runner/dispatch.test.mjs` — a new case proving the bootstrap
  path picks up the codex template once it exists.
- `CHANGELOG.md`'s `## [Unreleased]` (AGENTS.md: "does this change
  something a user of fgOS would see?" — yes, a new dispatch capacity).

**Order:** no dependents/dependencies (`fgos graph --json` this pass:
`tsk-4kh` has no edges to any other item) — order is internal: (1)
confirm the full worker contract (write + `git add`/`git commit` +
verify shell command) via a live `codex exec` dispatch from a real
`fgw/<id>` worktree — validating's job, not guessed here; (2) confirm a
real, working model name for the chosen provider/tier; (3) write
`.fgos/config.json`'s `codex` executor entry (main checkout); (4) add
the `SUPPORTED_EXECUTOR_TEMPLATES` entry + its test case; (5)
`CHANGELOG.md` line.

## Shape

One piece, not split — the whole change is a config entry plus one
small, low-risk bootstrap-template addition reusing the same proven
args; splitting the `.fgos/config.json` wiring from the
`SUPPORTED_EXECUTOR_TEMPLATES` addition would leave the second half
without its own reason to exist (it exists specifically because the
first half proved the args work).

Concrete cases to prove against, matching high-risk's depth:
- boundary: a `codex exec -s workspace-write` call **without**
  `--dangerously-bypass-approvals-and-sandbox`, using the chosen args,
  against a prompt that needs exactly the worker contract's capabilities
  (file write inside the workspace, `git add`, `git commit`, a shell
  verify command) — must complete, not hang, not silently no-op, and
  the commit must actually be present in the branch afterward.
- existing behavior that must not regress: `detectAssistantCli`'s three
  existing tests (`test/runner/dispatch.test.mjs:1203-1224`) must stay
  green unmodified — this item's change is additive to
  `SUPPORTED_EXECUTOR_TEMPLATES`, never a change to `detectAssistantCli`
  itself.
- partial failure / refusal path: a call attempting something outside
  the sandbox (writing outside the workspace, or a network call) must
  fail loudly with a real error (per RESEARCH.md's live proof:
  `read-only file system` / DNS resolution failure) — never hang, never
  silently succeed.
- idempotence: re-running `fgos doctor` after the config change reports
  `tool-registry-configured`/`config-not-stale` cleanly, with no new
  doctor check needed for this item's own mechanism (see Approach above
  for why).

## Outstanding questions

None
