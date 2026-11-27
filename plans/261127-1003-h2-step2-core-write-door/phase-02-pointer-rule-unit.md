---
phase: 2
title: "Pointer rule unit through the context engine"
status: ready
dependencies: []
---

# Phase 2: pointer rule unit through the context engine

## Inputs

- `plan.md` decision D5 and fact F8.
- `docs/platform/agent-context-engine/spec.md` sections 4 (rule schema), 6 (write-time checks), 7 (compile).
- An existing unit for the frontmatter shape: `core/instructions/scratch-artifacts.md`, `core/instructions/convention-paths.md`.
- `docs/platform/documentation/subcomponents/write-door/spec.md` sections 3, 7 rule 1, 11 item 1 (the line holds no
  rules itself; it only points).
- `src/setup/instruction-projections.mjs` (how the compile is called).

## Footprint

`core/instructions/documentation-door.md`, `.fgos/instructions/effective/**`.

## Steps

1. Write `core/instructions/documentation-door.md` with the engine's frontmatter (`id: documentation-door`,
   `kind: procedure`, `owner: core`, `scope`, `mode: append`, `specificity`, `title`, `description`,
   `lifecycle: live`, `valid_from`) copied in shape from a sibling unit. Body: one or two sentences. Before writing,
   changing or retiring maintained documentation, follow the documentation write door. Find the unit that already
   carries your claim with `fgos doc locate`, grow it, and request admission instead of creating a document. The
   procedure is the shared fragment `write-door.md` of the core skills. Name no path that does not exist on `main`
   when this phase lands. Phase 4 creates the fragment, so the body names it by fragment name, not by path.
2. Run `fgos internal context-engine check --protocol 1 --paths core/instructions/documentation-door.md`. If it
   refuses `rule-near-duplicate`, read the nearest rule. Then reword, or declare the relation the engine names.
   Never bypass the hook.
3. Compile with `fgos internal context-engine compile --protocol 1` (or the setup path in
   `instruction-projections.mjs` that calls it), and commit `.fgos/instructions/effective/rules.json` with the unit.
4. Check the generated always-loaded blocks the projection writes. If the repo commits them, add those paths to this
   phase's footprint before committing, and tell the lead.

## Verify

```bash
fgos internal context-engine check --protocol 1 --paths core/instructions/documentation-door.md
node -e 'const r=require("./.fgos/instructions/effective/rules.json");process.exit(r.rules.some(x=>x.id==="documentation-door")?0:1)'
```

Pass: no refusal; exit 0; the pre-commit hook accepts the commit.

## Rollback

Delete the unit, recompile, and commit both.
