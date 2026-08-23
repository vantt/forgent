# plan.md — tsk-1xm: agy cli-spawn executor — capability allowlist over --dangerously-skip-permissions

Mode: **high-risk**

Flags counted per `fgos-routing`'s Mode gate: **authorization** (this
item's whole subject is the worker's permission/capability boundary),
**audit/security** (narrowing a real security posture — the effect of
getting the new allowlist wrong is either a broken worker or a
no-better-than-today security posture, not a new hole, but the flag is
mechanical, not judged on severity), **external systems** (`agy`, a
third-party CLI binary, is the surface being configured), **existing
covered behavior** (`test/runner/dispatch.test.mjs:710-722` currently
asserts `invocation.args.includes('--dangerously-skip-permissions')` —
this item's own change breaks that assertion by design and must update
it). Four flags, two of them (audit/security, external systems/provider)
independently hard-gate the lane per the mode-gate rule ("any hard-gate
flag ... → high-risk") — high-risk regardless of the 4-flag count alone.

No `CONTEXT.md` exists for this item — discovery's verdict was `clear`,
which skips `exploring` (D2 of the discovery/exploring stage split,
`docs/history/discover-stage-graph-and-skill-layering/`). Every claim
below traces to `docs/history/agy-permission-capability-allowlist/
RESEARCH.md`'s Round 1 (this item's own discovery-stage research pass) or
to a live command run in this same planning pass — cited inline, no new
`CONTEXT.md` needed since nothing here is a *product* decision requiring
Socratic lock, only a technical approach decision grounded in evidence
already gathered.

## Approach

> **SUPERSEDED — RESEARCH.md Round 4 (2026-08-18).** Everything below this
> notice describes an ALLOWLIST design (`permission.allow` /
> `permissions.allow` gating which commands may run). Round 4's live proof
> pass (2 `toolPermission` modes × 6 total rule-shape variants across
> Rounds 3–4, 0 successes for allow-gating) found that no allowlist shape
> is reachable for `command`-type tools in headless (`-p`) mode: `strict`/
> `request-review` blanket-deny every command regardless of
> `permissions.allow` content, and the one mode that does let commands
> run — `toolPermission: "always-proceed"` — runs *every* command by
> default (confirmed via an unlisted `whoami` probe succeeding) and only
> respects `permissions.deny`, i.e. it is a **denylist**
> (default-allow/explicit-deny), not an allowlist. This is a materially
> different, weaker security shape than the Approach below assumes, and a
> product trade-off call belongs to the person who owns this item's scope
> before implementation resumes — see RESEARCH.md Round 4's closing
> section for the three concrete framing-question answers this produces.
> The Rejected-alternatives reasoning, risk-map shape, and doctor/setup
> registration idea below are still structurally reusable once a
> denylist-based Approach replaces this one; only the *mechanism* section
> needs rewriting, not the whole plan.

**What discovery already established (RESEARCH.md Round 1):** `agy` has a
real permission-allowlist surface — `settings.json`'s `permission.allow`
(per-command pattern rules, `project`/`shared`/`global` scoped,
config-file-based, not a single CLI flag) — reachable from headless `-p`
mode without `--dangerously-skip-permissions`. Confirmed via `agy --help`,
`agy changelog` (cited by version), and a live no-quota `agy -p
"/permissions" --output-format json` query showing the real
`project`/`shared`/`global` scope model.

**New in this planning pass — which scope, and why (technical decision,
grounded, not a product gap needing a person):**

`.fgos/config.json`'s `runner.executors.agy.invocations[0].args` passes
`--new-project` on every dispatch (confirmed live this planning pass by
reading the committed config). `agy --help`'s own text for that flag:
"Create a new project for this session". A live check of agy's own
conversation metadata (`~/.gemini/antigravity-cli/cache/
conversation_metadata.json`, read this planning pass) shows each
conversation carries its own `ProjectID`, distinct per session,
workspace-keyed separately via `WorkspaceURIs`. Combined with the
`/permissions` query's `project` scope existing as its own bucket, a
`--new-project` dispatch almost certainly gets a **fresh** project-scoped
permission bucket every single dispatch — any `permission.allow` rule
written at `project` scope for one dispatch would not carry to the next.
**Decision: target `global` scope**
(`~/.gemini/antigravity-cli/settings.json`'s own `permission.allow`,
confirmed as the real on-disk file this planning pass — currently holds
only `trustedWorkspaces`, no `permission.allow` block yet), not `project`
scope. This is deliberately coarser than a per-item footprint — it does
not need to be narrower, because fgOS already has a second, independent
enforcement layer for the per-item file-scope question:
`footprintDiffHits` (`src/runner/frozen-judge.mjs:69-100`, D5 of
`docs/history/dispatch-activation-and-handoff-redesign/CONTEXT.md`) flags
any file touched outside an item's declared `footprint` **after the
fact**, at verify time, regardless of what a worker's own permission
layer did or did not allow. `agy`'s `permission.allow` and fgOS's
`footprintDiffHits` are complementary, not duplicate — the CLI layer's job
here is only to replace *unconditional* bypass with *some* real
capability gate (workspace-scoped file access, verify/shell commands,
committing changes; refusing network access, elevated privileges, writes
outside the workspace, etc.), never to re-implement per-item footprint
scoping that a different, already-existing mechanism already owns.

**Rejected alternative — `agent.md`'s `commandExecutionPolicy` (v1.1.6,
selected via `--agent <name>`).** RESEARCH.md flagged this as a second
candidate. Not pursued here: it requires authoring and shipping a custom
agent definition file as a new artifact this repo would need to maintain
and keep in sync with the executor config, versus `permission.allow`
which is a few JSON lines in a config file `fgos setup`/`doctor` can
already provision the same way they provision everything else
(`docs/distribution-vision.md`'s config-merge model). Revisit only if a
validating-stage proof point shows `permission.allow` cannot express what
this item needs.

**Rejected alternative — `--sandbox` flag alone.** `agy --help`: "Run in a
sandbox with terminal restrictions enabled." This restricts the terminal,
not tool-call permissions — orthogonal to the capability-allowlist
question this item is about, not a substitute for `permission.allow`. Not
pursued as the primary mechanism; may be a genuinely complementary
defense-in-depth layer, but that framing (`tsk-49o`) is explicitly out of
this item's scope per its own description ("KHÔNG trùng tsk-49o").

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| `.fgos/config.json`'s `agy` args (drop `--dangerously-skip-permissions`, add `--mode accept-edits`) | High — if the new args cause a real dispatch to hang or silently under-behave, every out-of-process `agy` dispatch breaks | Proof point below: a live `agy -p` call with the new args, no `--dangerously-skip-permissions`, against a real prompt that needs a file write plus a shell command, run headless, must complete (not hang) and must not silently succeed with nothing applied |
| `~/.gemini/antigravity-cli/settings.json`'s new `permission.allow` block | High — wrong pattern syntax either over-permits (no real improvement over today) or under-permits (worker cannot do its job, soft-denies legitimate calls) | Same live proof point above, plus a second live call attempting something the ruleset should refuse (e.g. a network call or a write outside the workspace) confirming a soft-deny, not a hang and not a silent allow |
| `test/runner/dispatch.test.mjs:710-722` (existing coverage asserting `--dangerously-skip-permissions` presence) | Light — a known, local test-file edit | `npm test -- test/runner/dispatch.test.mjs` green after the assertion is updated to the new args shape |
| `fgos setup`/`fgos doctor` registration for the new `permission.allow` infra dependency (AGENTS.md's install/setup/doctor gate: "a new file it expects to exist, a tool it shells out to... must register into fgos setup's config-merge and fgos doctor's check registry") | Standard — `src/setup/checks.mjs` already has a registry pattern to extend, precedent exists | `fgos doctor` reports the new check by name and fails/warns correctly when the on-disk agy settings file is missing the expected `permission.allow` block; `fgos setup` provisions it when absent (idempotent — a second run makes no further change) |

**`impact-analysis: not applicable to this item's scope.** GitNexus is
`present` (`fgos tool query --capability impact-analysis --status
present`, checked live this pass) but this item's whole footprint is a
JSON config value plus one test file — no function/class/method symbol is
being modified, so there is no blast-radius question for GitNexus to
answer here. Named explicitly per `CLAUDE.md`'s gate rather than silently
skipped.

**Files likely touched:**
- `.fgos/config.json` — `runner.executors.agy.invocations[0].args`
- `test/runner/dispatch.test.mjs` — the assertion around line 722
- `src/setup/checks.mjs` — new doctor check for the `permission.allow`
  infra dependency
- setup's config-merge path (wherever `src/setup/checks.mjs`'s sibling
  provisioning code lives — read at implementation time, not guessed here)
- `CHANGELOG.md`'s `## [Unreleased]` (AGENTS.md: "Does this change
  something a user of fgOS would see? If yes, add a line")

**Order:** no dependents/dependencies (`fgos graph --json` this pass:
`tsk-1xm` is its own size-1 connected component) — order is internal to
this one piece: (1) confirm the exact `permission.allow` pattern shape via
a live proof point (validating's job, not guessed here), (2) write the
`fgos doctor`/`fgos setup` registration using that confirmed shape, (3)
swap `.fgos/config.json`'s args, (4) update the existing test, (5)
`CHANGELOG.md` line.

## Shape

One piece, not split — the whole change is one coherent unit (config plus
its own doctor/setup registration plus the one test it breaks); splitting
a config-value swap from the doctor check that makes it discoverable
would leave either half incomplete on its own (AGENTS.md's gate is
explicit that an infra dependency without doctor/setup registration is
"not stand alone, undiscoverable by doctor" — a real gap, not a
nice-to-have).

Concrete cases to prove against, matching high-risk's depth:
- boundary: a headless `agy -p` call **without**
  `--dangerously-skip-permissions`, using the new args, against a prompt
  that needs exactly the allowed capabilities (file write inside the
  workspace, a shell verify command, committing the result) — must
  complete, not hang, not silently no-op.
- existing behavior that must not regress: a normal `fgos-coding-implement`
  dispatch through `agy` (the same shape earlier items already ran green
  through, per `docs/history/dispatch-activation-and-handoff-
  redesign/CONTEXT.md`'s own "Phép thử của D4" section) must still
  complete successfully with the new args — a regression here breaks every
  future `agy` dispatch, not just this item's own scope.
- partial failure / soft-deny path: a call attempting something outside
  the intended allowlist (e.g. writing outside the workspace, or a network
  call) must soft-deny with a named stderr reason (per RESEARCH.md's
  changelog citation: "soft-denies such tools and prints a stderr notice
  naming the allow-rule needed") — never hang waiting on a human that
  is not there in a headless dispatch.
- idempotence: `fgos doctor`/`fgos setup`'s new check/provisioning runs
  twice with no further change the second time.

## Outstanding questions

None
