# Iron Law evidence: tsk-1q1

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` on this item's final
diff returned `required: true` — `matchedModules: ["bin/fgos.mjs",
"src/runner/merge.mjs"]`, `matchedFlags: []`.

This root item introduces NO new code of its own (per this item's own
`CONTEXT.md` D2): every line in this diff was already implemented,
verified, and separately Iron-Law-cleared by its 3 children, each merged
into this branch (`fgw/tsk-1q1`) individually:

- `tsk-4jf` — `docs/history/tsk-4jf/iron-law-evidence.md` (real failing→
  passing transcript for the `cleanup` verb's TTL/D8 split, `bin/fgos.mjs`).
- `tsk-1p9` — `docs/history/tsk-1p9/iron-law-evidence.md` (real failing→
  passing transcript for the leaf-branch root-aware cleanup fix,
  `bin/fgos.mjs` + `src/runner/merge.mjs`).
- `tsk-558` — `docs/history/tsk-558/iron-law-evidence.md` (real failing→
  passing transcript for `checkRetrospectiveContent`'s docType/file-exists
  fix).

Each of those three documents already carries a real, pasted
failing-before/passing-after test transcript for the specific behavior it
introduced — re-deriving a fourth transcript here would test nothing new,
only restate evidence already on this exact branch. The root's own proof
is the full-suite run at `fgos return tsk-1q1`: **npm test — every test
passed** (`passed: true`, real output, no assertion), confirming the three
children's changes hold together as a whole, not just individually.
