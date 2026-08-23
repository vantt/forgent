# Plan — fgos-global-install-stage-verb-skew (tsk-2ej)

Mode: standard

## Context

`docs/history/fgos-global-install-stage-verb-skew/RESEARCH.md` (discovery
round, 2026-08-12) confirmed the reported skew is real: the globally
installed `forgent@0.1.0` binary (pnpm global bin +
`/home/vantt/.local/share/pnpm/bin/fgos`, also listed by `npm ls -g`)
predates commit `c7aa4575` (tsk-403, the `decompose` → `plan` verb rename)
— its own `--help`/unknown-verb usage line lists `discover|decompose` with
no `plan` verb at all. forgentX's current checkout has both (`plan`
current, `decompose` kept as a compat alias, tsk-403 D11/D18).

No `CONTEXT.md` exists for this item — discovery's `clear` verdict skipped
`exploring` by design (`fgos-coding-discovering`'s own documented shape: a
clear verdict jumps straight to `planning`). This plan therefore treats
`RESEARCH.md`'s findings, plus the item's own description, as the locked
input instead of a separately-written `CONTEXT.md`.

**Assumption (not material, pinned here per this skill's own rule 6 — does
not change the item's own acceptance criteria: "install/setup/doctor xử lý
được tình huống ổn định thay vì gãy ngầm"):** the concrete fix is a new,
first-class `fgos version` read verb plus a matching `doctor` self-check,
rather than a broader CLI/skill version-negotiation protocol. Rationale:
- `fgos doctor` can only ever report on *itself* (whatever build is
  actually running it) — it structurally cannot detect its own staleness
  relative to a *newer* release, the same way no program can. What it
  *can* do is make its own version/commit legible on demand, closing the
  exact friction the bug report hit: reading `node_modules` directly to
  find this out is blocked by this repo's own scout-block hook
  (reproduced during discovery — see RESEARCH.md), and there is currently
  no `--version`/`version` verb at all (`grep -n "'version'"` over
  `bin/fgos.mjs`/`src/cli/command-registry.mjs`: zero hits) — the only way
  discovery found to tell old from new was diffing the unknown-verb usage
  line, which works but is not a designed, hook-safe, scriptable answer.
- A full cross-package version-negotiation protocol (skills declaring a
  required verb set, doctor cross-checking it against a manifest) is a
  real possible follow-up, but is a separate, larger product decision with
  its own tradeoffs (how would a *skill* declare its own required verb
  set? where would that manifest live relative to the npm package vs. the
  Claude Code plugin, which can update independently?) — out of scope
  here; flagged as a candidate follow-up item below, not silently dropped.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → GitNexus
registered and `present`. `impact-analysis: degraded`: `.gitnexus/meta.json`
shows `indexedAt: 2026-08-09T08:20:39Z` / `lastCommit: 4ce7a967...`, 3+ days
and several commits behind current HEAD (`c67d7f9c`). Confirmed stale in
practice, not just by timestamp: `mcp__gitnexus__impact({target: "runVerb",
direction: "upstream"})` returned "Target 'runVerb' not found" even though
`runVerb` demonstrably exists (`bin/fgos.mjs:961`) — a suspicious
zero-result, cross-checked per this repo's own capability gate. Cross-check
via `rg -n "runVerb\("` found the real call sites instead: `bin/fgos.mjs`
lines 2068/2078/2112 (internal recursive calls from `sync-root`/`approve`)
and line 4664 (the CLI's own entrypoint dispatch), plus
`test/cli/fgos-manifest.test.mjs`'s static drift guard, which parses
`runVerb`'s own `switch` body directly out of source.

Proof point below therefore leans on this `rg` cross-check, not GitNexus,
for `runVerb`'s blast radius. Risk is low regardless: the change is
strictly additive (one new `case 'version':` arm in an existing `switch`,
one new `COMMAND_REGISTRY` entry, one new `registerCheck(...)` call) — no
existing verb's behavior changes.

## Approach

Two small, independently verifiable pieces, in this order (no real
ordering dependency between them, but the verb should exist before the
doctor check that exercises it):

1. **`fgos version` — new read verb** (`bin/fgos.mjs`, `runVerb`'s
   `switch`, alongside `src/cli/command-registry.mjs`'s `COMMAND_REGISTRY`
   so `test/cli/fgos-manifest.test.mjs`'s drift guard stays green). Reads
   `package.json`'s own `version` field and the current build's git short
   SHA (best-effort — `git rev-parse --short HEAD` from the CLI's own
   install directory; `null` when not resolvable, e.g. a real npm tarball
   install with no `.git`, never thrown as an error). Also returns the
   full verb list straight from `COMMAND_REGISTRY.map(e => e.name)` — the
   same single source of truth `fgos --help --json` already uses, so a
   caller can check `data.verbs.includes('plan')` directly instead of
   parsing an unknown-verb error message.
   - `touchesState: false`, `requiresExistingStore: false` (no `.fgos/`
     access at all — this must work even where no store has been
     `init`ed yet, since "which build is this" is exactly the question to
     ask *before* trusting anything else about the install),
     `externalEffect: false`, `paginated: false`.
   - Files: `bin/fgos.mjs` (new `case`), `src/cli/command-registry.mjs`
     (new entry).
   - Proof point: `node bin/fgos.mjs version` from a plain tmp cwd (no
     `.fgos/`) returns `{packageVersion, gitCommit, verbs}` with `verbs`
     containing both `plan` and `decompose`; `test/cli/fgos-manifest.test.mjs`
     stays green (drift guard sees the new verb registered on both sides).

2. **`cli-version-visible` — new doctor check** (`src/setup/
   registrations.mjs`, next to the existing `registerCheck(...)` calls
   e.g. `node-version-and-git`). Calls the same version-resolving logic
   `version`'s handler uses (factored into one shared function so the verb
   and the check never drift from each other) and passes whenever it
   returns a well-formed `{packageVersion, gitCommit, verbs}` — the
   same "always green on a healthy build" shape `node-version-and-git`
   already has. Its real value is not the pass/fail (trivially true on any
   working install) but that `fgos doctor`'s own report now always prints
   the running build's version/commit — the first thing to compare against
   when a verb comes back "unknown" on some other machine, closing the
   discovery-round friction directly instead of leaving it to `--help`
   output diffing.
   - Files: `src/setup/registrations.mjs`.
   - Proof point: `fgos doctor` output includes a
     `cli-version-visible` row whose message embeds the resolved
     `packageVersion`/`gitCommit`.

No split: both pieces are small enough, and piece 2 depends on piece 1's
shared resolver existing — one item, two phases, not two items.

## Sketch of cases to prove

- Fresh cwd with no `.fgos/` at all — `fgos version` still works (doesn't
  require a store).
- Git checkout (this repo) — `gitCommit` is a real short SHA.
- `verbs` list matches `COMMAND_REGISTRY`'s own names exactly (no
  drift-guard failure).
- `fgos doctor`'s check list includes `cli-version-visible`, always
  `passed: true` on a working build (same class as `node-version-and-git`
  — nothing here can legitimately fail on a healthy install; it exists to
  surface a message, not to gate anything).

## CHANGELOG

Per `AGENTS.md`'s install/setup/doctor gate ("does this change something a
user of fgOS would see?") — yes, a new CLI verb is user-visible. Add a line
under `## [Unreleased]` in `CHANGELOG.md`.

## Candidate follow-up (not this item)

A real cross-package version-negotiation protocol — skills/plugin
declaring the verb set they require, `doctor` cross-checking a *target*
install (not just self-reporting) against it — is a bigger, separate
product decision. Worth a new item once/if this lighter `fgos version`
surface turns out insufficient in practice (same "build the cheap version
first, escalate only on real pain" stance already used for the
CHANGELOG-automation item, tsk-12m).

## Outstanding questions

None
