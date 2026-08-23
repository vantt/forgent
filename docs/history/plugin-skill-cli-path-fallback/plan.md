---
type: plan
title: Plugin skill CLI path fallback (tsk-1no)
timestamp: 2026-08-09T06:56:00.000Z
---

# Plan: Plugin skill CLI path fallback

Mode: small — 1 flag applies (public contracts: `plugins/fgOS/skills/*/SKILL.md`
is the documented external activation surface for a consumer project,
`docs/specs/fgos-plugin.md`). No auth/data-model/audit/external-system/
cross-platform/validation-removal flag applies. 23 files change, but the
change is one mechanical pattern applied identically everywhere — "a few
files, no gray areas" (CONTEXT.md D1–D3 already locked the fix shape; no
open product question remains, only the two implementation choices this
plan settles below).

Impact-analysis posture (CLAUDE.md gate, `fgos tool query --capability
impact-analysis --status present`): GitNexus registered, `status: present`
— but per `tsk-1lg` (open, untouched here) its index is 434 commits stale.
Posture recorded as **degraded**: no proof point below leans on GitNexus:
every claim about the 23 files and the doc line comes from direct `rg`
reads (CONTEXT.md's own Scout evidence), not the graph.

## Approach

**Chosen path:** apply the exact fallback CONTEXT.md D3 already locked
(mirror `scripts/fgos-shell-integration.sh:29-46`'s three-branch shape —
local `bin/fgos.mjs` → PATH `fgos` → clear stated error) as a literal,
repeated shell snippet at every one of the 23 files' call sites, plus one
new `registerCheck` entry in `src/setup/registrations.mjs`, plus one
sentence fixed in `docs/specs/fgos-plugin.md`.

**Rejected alternative — a shared sourced script
(`plugins/fgOS/skills/_shared/fgos-cli.sh`) instead of a repeated inline
snippet.** `plugins/fgOS/skills/terminal/rename.sh` proves a plugin CAN
ship a real executable script that survives into a consumer project's
cache copy, so this was a real option, not a strawman. Rejected because it
buys DRY-ness the codebase does not need here in exchange for a second
resolution mechanism (source-a-script vs. run-a-verb) for the same one
concept the existing 23-file convention already keeps as a repeated
literal template (the CURRENT broken template is itself already repeated
23 times, byte-identical — this plan keeps that convention, just fixes
the one line inside it, per YAGNI/KISS). A shared script also reopens a
question D1 already closed (the plugin never bundles executable logic
beyond thin per-verb wrappers) without CONTEXT.md having weighed that
trade-off — out of this plan's authority to decide unilaterally.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| 23 `SKILL.md` prose edits | Low — mechanical, same snippet, only the trailing verb/args differ per file | `rg -l` count over the fallback marker must equal 23 (verify POSITIVE below) |
| New doctor check | Low — additive, read-only (`registerCheck`, no `--fix` entry per CONTEXT.md D3's own scope — it names only the check, not a fix) | Real unit test added to `test/setup/registrations.test.mjs` (both branches: local `bin/fgos.mjs` present, and PATH-only) |
| `docs/specs/fgos-plugin.md` line ~167 | Low — one sentence, already flagged stale by CONTEXT.md's own Scout evidence | grep pin on the new sentence (verify POSITIVE) |
| Scope creep into `.claude/skills/fgos-*` (D2 explicitly rules this out) | Low but worth a hard verify guard, since a careless find/replace across "every fgos skill file" could easily drift into the wrong tree | verify NEGATIVE: no `.claude/skills/fgos-*` path in this branch's diff |

**Files touched, in order:**

1. `plugins/fgOS/skills/*/SKILL.md` (23 files, exact list per CONTEXT.md
   Scout evidence: `submit`, `pick`, `list`, `ready`, `move`, `return`,
   `ask`, `answer`, `goal`, `show`, `rollup`, `check`, `graph`,
   `conflicts`, `triage`, `stale`, `unlock`, `merge-list`, `merge-next`,
   `cleanup-next`, `retro-next`, `discover`, `decompose`) — first, since
   the doctor check and the doc line both describe behavior these files
   define.
2. `src/setup/registrations.mjs` + `test/setup/registrations.test.mjs` —
   second, the new check.
3. `docs/specs/fgos-plugin.md` — last, documenting the now-true behavior.

## Shape

**1. The fallback snippet (D3), applied at every one of the 23 files'
call sites, replacing the current bare line:**

```
node ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs <verb> <args>
```

with:

```bash
# fgos CLI fallback (tsk-1no D3)
FGOS_BIN="${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs"
if [ -f "$FGOS_BIN" ]; then
  node "$FGOS_BIN" <verb> <args>
elif command -v fgos >/dev/null 2>&1; then
  fgos <verb> <args>
else
  echo "fgos: no bin/fgos.mjs at ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX} (not a forgent checkout) and no global fgos install on PATH" >&2
  exit 1
fi
```

`<verb> <args>` is whatever that call site already passes today (e.g.
`submit`'s step 2 is `list --json`, step 4 is `submit "<text>" --deps
<ids> --dir "..."`) — this plan changes only the resolution wrapper, never
the verb/argument shape any file already has. A file that calls the CLI
more than once (e.g. `submit`, `pick`) gets the marker comment + branch at
each call site — never a single shared block referenced twice, per the
rejected-alternative reasoning above (each call site stays a fully
self-contained snippet, same as today).

**2. New doctor check**, `src/setup/registrations.mjs`, id
`plugin-skill-cli-reachable`, description "a `fgos` CLI is reachable from
this project (local `bin/fgos.mjs` or a global PATH install)":

```js
function checkPluginSkillCliReachable(cwd) {
  const localBin = path.join(cwd, 'bin', 'fgos.mjs');
  if (fs.existsSync(localBin)) {
    return { passed: true, message: `local bin/fgos.mjs found at ${localBin}` };
  }
  try {
    const onPath = execFileSync('sh', ['-c', 'command -v fgos'], { encoding: 'utf8' }).trim();
    return { passed: true, message: `fgos resolved from PATH at ${onPath}` };
  } catch {
    return {
      passed: false,
      message: `no bin/fgos.mjs at ${cwd} and no global fgos install on PATH -- every /fgOS:* slash command will fail on first use (run: npm install -g github:vantt/forgent)`,
    };
  }
}

registerCheck({
  id: 'plugin-skill-cli-reachable',
  description: 'a fgos CLI is reachable from this project (local bin/fgos.mjs or a global PATH install)',
  check: (cwd) => checkPluginSkillCliReachable(cwd),
});
```

FIXED at fgos-coding-validating (reality-gate repo-fit check, tsk-1no): the
earlier draft claimed this mirrors "checkNodeAndGit's existing PATH-lookup
helper" — false, verified by reading `registrations.mjs:228-239` directly.
`checkNodeAndGit` has no reusable PATH-lookup helper; it only wraps
`execFileSync('git', ['--version'])` in its own try/catch, specific to
`git`. The corrected code above follows that SAME try/catch shape
(`execFileSync` + catch, no shared helper invented), applied to `sh -c
"command -v fgos"` instead — same convention, not a new one, but no
helper to "reuse" because none exists.

Add a matching unit test to `test/setup/registrations.test.mjs`
(mirroring `checkShellIntegrationSourced`'s or `checkNodeAndGit`'s own
existing test shape in that file): one case with a fixture `bin/fgos.mjs`
present (passes, local-bin message), one case with no local bin and a
stubbed `fgos` on `PATH` (passes, PATH message), one case with neither
(fails, install-hint message).

**3. `docs/specs/fgos-plugin.md`**, the `Pointers (implementation)` bullet
that currently reads (line ~167):

> `repo/plugins/fgOS/skills/<verb>/SKILL.md` — one skill per verb (...);
> each wraps `node ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/
> $FGOS_NESTED_PREFIX}/bin/fgos.mjs <verb> ...`.

becomes:

> `repo/plugins/fgOS/skills/<verb>/SKILL.md` — one skill per verb (...);
> each wraps `fgos <verb> ...`, resolved via the project-local
> `bin/fgos.mjs` when present, else a global PATH install of `fgos`, else
> a clear stated error (tsk-1no) — never a raw Node "Cannot find module".

## Outstanding questions

None — both implementation choices CONTEXT.md deferred here (snippet
shape: repeated literal, not a shared script; doctor-check name/shape:
`plugin-skill-cli-reachable` above, read-only, no `--fix` entry) are
settled in Shape above. The doc-update question is settled: yes, in this
same change (D3 already named the doc as needing it; no reason to split
a one-sentence doc fix into a second item).
