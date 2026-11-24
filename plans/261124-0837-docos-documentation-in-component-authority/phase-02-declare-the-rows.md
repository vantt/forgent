# Phase 2: Declare the rows

## Context

The inventory of phase 1. `fgos authority declare --kind component --update --row <json|file>` is the only door to
the model for an existing component row: the row carries its id and the fields to change; id and parent cannot
change, and no `--approved-by` is needed.

## Files it writes

`packages/component-authority/model/components.yaml`, through the declare verb only.

## Steps

1. Update `document-identity` with `declare --update`:
   - paths `packages/documentation/` next to its docs path;
   - owns the locate port and pkm adapter, the `fgos doc locate` and `fgos doc index` sub-verbs, the index worker
     process, the rebuildable cache `.fgos/runtime/doc-locate/`, the machine model folder, the Observe kind
     `fgos.doc.locate` and the `docLocate` config namespace;
   - status `live` (step 1 is built and released).
2. Wiring files in `apps/fgos/src/wiring/` and the config files: map them the way phase 1 found other areas map their
   wiring and config, never a new convention.
3. Resolve the parent's `mustNotOwn` (`code execution`, `runtime state mutation`) the way phase 1's reading of the
   spec allows: the worker is started through the process door and the cache is rebuildable data. If the model needs
   the parent's list changed, or declare refuses, stop and ask the owner in the decision-question template.
4. Run `fgos authority locate` again on every F5 path.

## Validation

Acceptance criterion 1 of plan.md; `git diff --stat` touches only `packages/component-authority/model/components.yaml`.

## Risk

`--move` of a path another row holds may need approval; the refusal text is quoted in the question.

## As built (2026-11-24)

- Two `fgos authority declare --kind component --update` calls on `document-identity`, on a clean branch from
  origin/main `a17814406`. Both exit 0; the model diff is that one row.
- Paths and source gain `packages/documentation/`; status `designed` → `live`; `owns` gains the locate port and pkm
  adapter, the `fgos doc locate` and `fgos doc index` sub-verbs with their wiring and doctor files, the index worker,
  the cache and machine model folder, the Observe kind `fgos.doc.locate` and the `docLocate` config namespace.
- Wiring and config (step 2): no row maps `apps/fgos/` or `core/config-standard/`, so they are named in `owns` only,
  as phase 1 found.
- `mustNotOwn` (step 3): the parent's list is unchanged and no owner question is needed. The reason is recorded in the
  row's own `owns` lines: the worker starts only through the process door, so code execution stays with that door; the
  cache and model folder are derived views rebuilt from the docs, never source state (L3).
- `locate` matches a sentence against canonical, aliases and meaning, never against `paths`
  (`packages/component-authority/rust/src/locate.rs`, `score`). Paths alone therefore could not satisfy acceptance
  criterion 1, so the second declare adds aliases: `doc locate`, `doc index`, `docLocate`, `locate port`,
  `locate crate`, `pkm adapter`. Each F5 item, asked as a path or a sentence naming it, now returns
  `document-identity` (first, or second after a parent or area canonical such as `documentation`, `observe`,
  `config`).
- The declare door also re-renders the views; those files are committed in phase 3, not here.
