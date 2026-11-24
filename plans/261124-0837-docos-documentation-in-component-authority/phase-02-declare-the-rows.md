# Phase 2: Declare the rows

## Context

The inventory of phase 1. `fgos authority declare --kind component --row <json|file> [--move] [--approved-by <q-id>]`
is the only door to the model.

## Files it writes

`packages/component-authority/model/**` through the declare verb only.

## Steps

1. Declare `document-identity` with:
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

Acceptance criterion 1 of plan.md; `git diff --stat` touches only the model.

## Risk

`--move` of a path another row holds may need approval; the refusal text is quoted in the question.
