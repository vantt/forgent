---
type: context
title: Retire .fgos-runner.json — remove the legacy-fallback support entirely
tags: [config, runner, cleanup]
timestamp: 2026-08-07T04:56:00.000Z
source_capture_ids: []
---

# Retire `.fgos-runner.json` — remove the legacy-fallback support entirely

tsk-5hv.

## Feature boundary

`.fgos/config.json` becomes the ONLY config source fgOS ever reads, at
every layer (shared-config resolution, global-config's project-present
check, doctor's staleness check, the runner's own dispatch/resolve path,
and `scripts/project-agents.mjs`'s agent-definition projection). Every
runtime code path that currently falls back to reading `.fgos-runner.json`
gets that branch removed, not patched to read it correctly — this item is
explicitly a retirement, not a second bug-compatible fallback fix. This
repo's own tracked `.fgos-runner.json` is deleted as part of this item.
Comment-only mentions of the filename (historical narration inside doc
comments, not live logic) are cleaned up where touched but are not the
point of the item.

Out of scope: `docs/history/**` and `docs/decisions/**` content that
mentions `.fgos-runner.json` — those are records of past decisions, never
edited to match current state. Also out of scope: `bin/fgos-runner.mjs`
(the runner CLI binary) — a name collision with the config file, not the
same artifact, and it does not read `.fgos-runner.json` (confirmed by
scout below).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Retire the runtime fallback cold-turkey (no migration helper, no warn-only path). Remove every `.fgos-runner.json` read path outright. Rationale: no external project depends on fgOS yet (user-confirmed) — this cleanup is groundwork for the first release, not a compatibility concern for existing adopters that don't exist yet. |
| D2 | Delete this repo's own tracked `.fgos-runner.json` as part of this item. Its data is already duplicated (and current) in `.fgos/config.json` — once no code reads it, it is pure stale clutter, and leaving a drifted file around a repo about to ship its first release is actively misleading. |

Both also recorded via `fgos decision --id tsk-5hv` (seq 8983, 8984).

## Pinned terms

- **"the legacy file"** / **"the legacy fallback"** = `.fgos-runner.json` at
  repo root, and the code paths in `src/config/shared-config-file.mjs` /
  `src/config/global-config.mjs` / `src/setup/registrations.mjs` that read
  it when `.fgos/config.json` is absent.
- **"the canonical file"** / **"the shared config file"** =
  `.fgos/config.json`, resolved via `sharedConfigFilePath()`
  (`src/config/shared-config-file.mjs`).
- **"the direct-read bug"** = `scripts/project-agents.mjs`'s
  `readRunnerModels()`, which reads `.fgos-runner.json` directly and has
  *no* fallback awareness at all — it never even checks whether
  `.fgos/config.json` exists. This is the root complaint tsk-5hv was filed
  for; D1 subsumes fixing it by deleting what it was reading instead of
  redirecting it to a chain that will itself be removed.

## Scout evidence

Full grep census (`rg -l '\.fgos-runner\.json'`) at time of filing, split
by what actually needs to change vs. what's inert prose:

**Fallback logic to remove (runtime behavior changes):**
- `src/config/shared-config-file.mjs` — `readSharedConfig()`'s legacy-read
  branch (lines ~46-54) and the `legacyRunnerConfigPath()` export (~25-27).
- `src/config/global-config.mjs` — `projectPresent`'s "either file counts"
  check (~line 62 comment, tsk-5vf D2 origin).
- `src/setup/registrations.mjs` — the `config-not-stale` doctor check
  (~368-371) and `checkConfigNotStale`'s legacy-aware read (~152-156,
  299-303).
- `scripts/project-agents.mjs:52` `readRunnerModels()` — the direct-read
  bug itself; once the file is gone this just reads `.fgos/config.json`
  the same way `readSharedConfig()` does (or calls it directly — a
  planning-level implementation choice, not locked here).
- `.claude/skills/_shared/capacity-dispatch-fallback.md` **and** its
  duplicate `.agents/skills/_shared/capacity-dispatch-fallback.md` — Step
  A's config-check script does
  `JSON.parse(readFileSync('$root/.fgos-runner.json'))` directly. Confirmed
  by diff: the two files are byte-identical, and no projection script
  keeps them in sync (unlike `agents/*.yaml` → `.claude/agents/*.md` via
  `scripts/project-agents.mjs`) — both copies are hand-maintained and both
  need the identical edit.

**Repo-root tracked file:**
- `.fgos-runner.json` (1.4K, git-tracked, last touched commit b4708fd
  "tsk-62d") — to be `git rm`'d (D2). At filing time it was already
  drifted vs. `.fgos/config.json`: the canonical file's
  `runner.executors.judge.args` carries `Task,WebSearch,WebFetch,Read,...`
  in `--allowedTools` that the legacy file's copy is missing — live proof
  the two-file setup silently diverges.

**Comment-only mentions (no runtime behavior, narrative cleanup only where
touched):** `src/setup/config-merge.mjs`, `src/state/gate-bypass.mjs`,
`src/runner/loop.mjs`, `src/runner/prompt-templates.mjs`,
`src/intake/plan.mjs` (a dotfile-tokenizer regex example — the
comment can keep `.fgos-runner.json` as an illustrative dotfile name even
after the file itself is gone, since it is demonstrating tokenizer
behavior on dotfiles generically, not documenting this file's existence),
`bin/fgos.mjs` (3 mentions), `src/cli/command-registry.mjs`'s help text
("default .fgos-runner.json in cwd", two spots; "migrating a legacy
.fgos-runner.json when present" in the `setup` description).

**Confirmed NOT in scope:** `bin/fgos-runner.mjs` — the runner CLI entry
point. Name collision with the config file only; grep confirms it never
reads or references `.fgos-runner.json` as a path.

**Tests exercising the fallback (17 files)** — enumerated in tsk-5hv's own
description; will need updating once the fallback branch is deleted (a
`readSharedConfig()` test asserting the legacy-read behavior, for example,
becomes a test asserting that behavior no longer exists).

**Active (non-historical) docs describing current fallback behavior** —
also enumerated in tsk-5hv's description (`docs/routing-handoff-contract.md`,
`docs/specs/runner.md`, `docs/specs/reading-map.md`,
`docs/reference/forgentx-tool-registry-configuration.md`,
`docs/reference/capacity-cross-provider-governance.md`, three
`docs/explanation/*.md`, five `docs/how-to/*.md`, `docs/backlog.md`).

**Impact-analysis posture (CLAUDE.md gate):** GitNexus registered and
`present` — full posture. Planning/implementation must run `impact()`
before editing any of the symbols above, per `CLAUDE.md`'s Always-Do
rules.

**Skill-prose verify constraint:** this item touches
`.claude/skills/_shared/capacity-dispatch-fallback.md`, a skill-prose file,
so per `docs/how-to/write-verify-for-a-skill-prose-change.md` its `verify`
must be `npm test && <POSITIVE> && <NEGATIVE>`, with `rg --hidden`
(default `rg` skips `.claude/`/`.agents/`), excluding
`.claude/worktrees/**` and `.fgos/events.jsonl.backup-*`, plus a
`git ls-files` path-name check alongside the content grep — a
negative-only verify would falsely pass if the deliverable were simply
deleted instead of correctly changed.

## Canonical references

- `src/runner/dispatch.mjs:1161-1166` — this exact bug pattern
  (`.fgos-runner.json` direct-read bypassing the canonical file) was
  already found and fixed once here, tsk-5vf D2. Precedent for what
  "fixed" looks like, though D1 here goes further (delete the source of
  the bypass, not redirect it).
- `src/config/shared-config-file.mjs` — the canonical resolution module;
  after this item, `readSharedConfig()` reads only `.fgos/config.json`.
- `docs/how-to/write-verify-for-a-skill-prose-change.md` — verify shape
  constraint, read in full during this discovery pass.

## Outstanding questions deferred to planning

- Whether `scripts/project-agents.mjs`'s `readRunnerModels()` should call
  `readSharedConfig()` directly (reuse) or read `.fgos/config.json` with
  its own minimal parse — an implementation choice, not a product decision.
- Whether the 17 affected test files and ~15 affected docs get handled in
  this one item or split into children at decompose — sizing/splitting is
  `fgos-coding-planning`'s judgment, not locked here.
- Exact wording for `src/cli/command-registry.mjs`'s help text and for the
  `config-not-stale` doctor check's new (fallback-free) description —
  implementation detail.
