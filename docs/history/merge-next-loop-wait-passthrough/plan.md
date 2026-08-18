# tsk-328 — plan.md

Mode: small

## Approach

`fgos graph --json` (this session, 2026-08-11): tsk-328 is not on the
critical path (`depth: 10`, path rooted at `tsk-4vo`) and has no
`topUnblock` candidates — it does not unblock other work, so no
`--what-if` split comparison is needed (D4 below: no split).

Impact-analysis posture: `full` — GitNexus present and freshly queried
this session (`fgos tool query --capability impact-analysis --status
present`, one provider, `status: present`).

Chosen path: wire `--wait`/`--no-wait`/`--timeout` passthrough into the
two skill wrappers named in `CONTEXT.md` D1, verbatim-forwarded to the
already-working `fgos merge next` CLI call — no `src/`/`bin/` code
change, no new flag design (the CLI side already exists per D1's cited
evidence).

Rejected alternative: adding the flags to `fgos catchup`'s CLI surface.
Ruled out by D1 — `catchup` never acquires `.fgos/main-checkout.lock`,
so a wait-budget override there would have nothing to attach to.

### Risk map

| Component | Risk | Proof point |
|---|---|---|
| `plugins/fgOS/skills/merge-next/SKILL.md` step 1/2 | low — prose-only, no `src/`/`bin/` touch | verify's POSITIVE grep below, plus a manual `/fgOS:merge-next --wait 5000` dry description trace (`fgos-coding-validating`) |
| `plugins/fgOS/skills/merge-loop/SKILL.md` step 1/3 | low — prose-only, changes what prompt string gets forwarded to `/loop` | verify's POSITIVE grep below, plus a manual trace that the built prompt string is `/fgOS:merge-next --wait <ms>` when the flag is present, and bare `/fgOS:merge-next` when absent (unchanged default) |

No medium/high risk in this map — both changes are additive prose edits
to an existing, already-forwarding CLI call; the default (no flags
passed) path is unchanged, so a caller not opting in sees identical
behavior to today.

## Shape

One piece, not split (D4 — see below). Two files change:

1. **`plugins/fgOS/skills/merge-next/SKILL.md`**
   - Step 1 ("Ignore `$ARGUMENTS`") changes to: parse `$ARGUMENTS` for
     `--wait <ms>`, `--no-wait`, and `--timeout <ms>` only — the same
     three flags `approve`/`sync-root` already accept
     (`src/cli/command-registry.mjs:501-504`). Any other token in
     `$ARGUMENTS` (an id, an unrecognized flag) is still rejected/ignored
     exactly as today — `merge next` still takes no id.
   - Step 2's bash block forwards whichever of the three flags were
     present, verbatim, onto both the `node "$FGOS_BIN" merge next ...`
     and `fgos merge next ...` call sites — same shape `merge`'s own
     command-registry entry already documents for "next" (`"next" only:
     forwarded to the underlying approve call").

2. **`plugins/fgOS/skills/merge-loop/SKILL.md`**
   - Step 1 ("Ignore `$ARGUMENTS`") changes the same way: parse the same
     three flags, reject anything else — `/loop`/`/fgOS:merge-next`
     still take no id here either.
   - Step 3 builds the `/loop` `prompt` string as `/fgOS:merge-next
     --wait <ms>` (or with `--no-wait`/`--timeout <ms>`) when a flag was
     present, or the bare `/fgOS:merge-next` unchanged when none were —
     so every subsequent loop iteration keeps forwarding the same
     explicit budget, not just the first one.

### Sketch of cases worth proving (`fgos-coding-validating`)

- No flags passed to either skill — behavior byte-identical to today
  (bare `fgos merge next` / bare `/fgOS:merge-next` prompt).
- `--wait <ms>` passed to `/fgOS:merge-next` — reaches the underlying
  `fgos merge next --wait <ms>` call unchanged.
- `--wait <ms>` passed to `/fgOS:merge-loop` — the built `/loop` prompt
  string carries `--wait <ms>` on every iteration, not just the first.
- An unrecognized token in `$ARGUMENTS` (e.g. a bare id) — still
  rejected/ignored the same way today's "ignore $ARGUMENTS" step already
  does; this item does not change that boundary, only narrows what gets
  read out of it.

## Decide the split

No split (D4 rule): this is one honest, small piece of work — two prose
edits to already-existing skill files, no independent sub-pieces worth
tracking separately.

## Verify

Per `docs/how-to/write-verify-for-a-skill-prose-change.md` (both touched
files are `plugins/fgOS/skills/**/SKILL.md`):

```
npm test && grep -q -- '--wait' plugins/fgOS/skills/merge-next/SKILL.md && grep -q -- '--wait' plugins/fgOS/skills/merge-loop/SKILL.md && ! grep -qF 'Ignore `$ARGUMENTS`.` `merge next` takes no arguments' plugins/fgOS/skills/merge-next/SKILL.md && ! grep -qF 'Neither `/loop` nor `/fgOS:merge-next` takes' plugins/fgOS/skills/merge-loop/SKILL.md
```

- POSITIVE — both files mention `--wait` (the new passthrough exists).
- NEGATIVE — the old blanket "ignore everything" step-1 wording is gone
  from both files (confirms the step was actually rewritten, not just
  appended to).
- `npm test` first, per the how-to doc's required shape.

Runtime-proof ownership (per the same how-to doc, since no shell command
can assert the prose is followed correctly): `fgos-coding-validating`'s reality
check traces the four cases in the sketch above by reading both `SKILL.md`
files directly, not by executing them.

## Outstanding questions

None
