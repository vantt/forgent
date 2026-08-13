---
type: reference
source_capture_ids: [tsk-6bx-1, tsk-6bx-2]
---

# Gate-bypass config

Reference for `.fgos/gate-bypass.json`, the `fgos gate-bypass` verb, and
the `fgos-coding-exploring`/`fgos-coding-validating` Gate steps that consult
them — the full mechanism that lets a skill-embedded confirmation gate
auto-approve instead of asking (`docs/history/gate-bypass/CONTEXT.md`
D1-D5, superseded for the planning-stage gate by
`docs/history/coding-planning-validating-gate-redesign/CONTEXT.md` D1/D9-D11:
`fgos-coding-planning` has no gate of its own; `fgos-coding-validating` owns
the single merged gate in stage `planning`).

## `.fgos/gate-bypass.json`

```json
{ "level": "standard" }
```

`level` is one of `off` / `light` / `standard` / `heavy` — the same
vocabulary as the item schema's own `TIERS` (`src/state/work.mjs`), not
bee's `off`/`normal`/`full`/`total` naming. `off` is the default and
auto-approves nothing.

Read via `readGateBypassLevel(dir)` (`src/state/gate-bypass.mjs`). Fails
closed to `off` on any of:

- the file is missing
- the file is not valid JSON
- `level` is missing, not a string, or not one of the four recognized
  values

## `fgos gate-bypass` (CLI)

Read-only status verb, no arguments:

```
$ fgos gate-bypass
{ "level": "standard" }
```

Wrapped in the standard `fgos.v1` envelope like every other verb. No CLI
setter — edit `.fgos/gate-bypass.json` by hand, the same pattern
`.fgos/config.json` already uses.

## Coverage rule

A level covers a tier if the tier's rank is lower than the level's rank in
`['off', 'light', 'standard', 'heavy']` (`off` is rank 0 and covers
nothing):

| tier ↓ / level → | off | light | standard | heavy |
|---|---|---|---|---|
| light | no | yes | yes | yes |
| standard | no | no | yes | yes |
| heavy | no | no | no | yes |

## The three-part decision (`canAutoApprove`)

`canAutoApprove(item, artifactText, level)` returns `true` only when all
three hold:

1. **No hard-gate floor hit (D4).** `item.title`/`item.description` are
   scanned case-insensitively against `HEAVY_KEYWORDS`
   (`src/intake/risk-keywords.mjs`). Any hit forces `false` regardless of
   level or tier — this floor cannot be bypassed by raising the level.
2. **Tier covered (D5).** `item.tier` must be covered by `level` per the
   table above.
3. **No open items (D2).** `artifactText` (the gated CONTEXT.md/plan.md's
   raw content) must not have open items — see below.

## Completeness scan (`hasOpenItems`)

Fails closed (returns "has open items") on any of:

- a `TODO` or `FIXME` marker anywhere in the text
- no `## Outstanding questions` section present at all
- the section's body doesn't start with `None` (case-insensitive)

An artifact that never adopts the `## Outstanding questions` convention
is always treated as incomplete — this is a fail-closed default, not a
detection gap to fix later.

## Gate-step wiring (`fgos-coding-exploring`)

`fgos-coding-exploring`'s Gate section runs a check before presenting its
approval question, against `CONTEXT.md`:

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node -e "
var root = process.argv[1];
function resolveModule(relPath, needed) {
  return import(relPath).catch(() => ({})).then((local) => {
    if (needed.every((name) => typeof local[name] === 'function')) return local;
    return import(root + relPath.slice(1));
  });
}
Promise.all([resolveModule('./src/state/store.mjs', ['listWork']), resolveModule('./src/state/gate-bypass.mjs', ['canAutoApprove', 'readGateBypassLevel']), import('node:fs')]).then(([{ listWork }, { canAutoApprove, readGateBypassLevel }, fs]) => {
  const fgosDir = root + '/.fgos';
  const item = listWork(fgosDir).work[process.argv[2]];
  const artifact = fs.readFileSync(process.argv[3], 'utf8');
  const level = readGateBypassLevel(fgosDir);
  console.log(canAutoApprove(item, artifact, level) ? 'true' : 'false');
});
" -- "$root" "<item-id>" "docs/history/<feature>/CONTEXT.md"
```

The `.fgos/` state lookup resolves to the main checkout via `git
rev-parse --git-common-dir`, not the cwd — a worktree's own local
`.fgos/` is gitignored and per-worktree-local, so it never carries the
real item record (confirmed empirically: `listWork('.fgos')` from inside
a freshly claimed worktree returns `undefined` for the claimed item
itself). The `gate-bypass.mjs`/`store.mjs` code tries the cwd-relative
import first — the worktree's own branch already carries whatever
version it needs, including self-referential items that modify
`gate-bypass.mjs` itself — and falls back to `$root`'s canonical copy
only when the needed export is missing or the import throws, fixing the
stale-branch class of failure a flat cwd-only import used to hit
(`docs/history/gate-bypass/CONTEXT.md` D7).

Anything other than exactly `true` on stdout is treated as `false` and
fails closed to presenting the gate normally. On `true`, the skill posts
a non-question line (`auto-approved: CONTEXT.md (gate-bypass level
<level>)`) and logs a matching `fgos decision` entry (D3's audit trail)
instead of asking.

## Gate-step wiring (`fgos-coding-validating`)

`fgos-coding-validating` owns the single merged gate in stage `planning`
(`docs/history/coding-planning-validating-gate-redesign/CONTEXT.md` D1) —
this replaced the old `fgos-coding-planning`-side `planApprove` gate that
used to run the same `canAutoApprove` check shown above against `plan.md`.
The merged gate calls a different function with a wider signature,
`canAutoApproveMergedGate(item, planText, childSpecs, costVerdict, level)`
(`src/state/gate-bypass.mjs`), adding the plan's child specs and the
session's own reversibility read (`fgos-coding-validating/SKILL.md`'s Gate
step 1) on top of the same hard-gate-keyword/tier-ceiling/open-items axes
this section's `canAutoApprove` check already uses. See
`fgos-coding-validating/SKILL.md`'s own "check whether the gate can
auto-approve" step for the exact, current command — kept there rather than
duplicated here, since the gate this doc used to describe at this point
(`fgos-coding-planning`'s `planApprove`) is exactly the one D9-D11 removed.
