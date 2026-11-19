# Phase 7b: known limit left open (lead decision)

The graph package (`packages/graph/rust`, plan A) holds every document it analyzes to `MAX_INPUT_BYTES`
(4 MiB), including the document the door generates from claims. The door sends ids as table positions,
which raises the reach, but a very dense units file (codex probe: 400 units on one shared path, each
depending on all earlier units, 79,800 edges and exclusions, 2.7 MB input, 5.3 MB generated graph) is still
refused by name (`graph-refused: limit-exceeded: maxInputBytes`, exit 4). It fails closed and never answers
`accept`. Lifting it needs a capless typed constructor in the graph package, outside this plan's footprint:
a separate item if a real plan ever reaches it (real plans measure under 0.03 s).
