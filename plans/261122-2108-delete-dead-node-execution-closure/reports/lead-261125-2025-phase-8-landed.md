# Lead report: phase 8 landed

Phase 8 (delete the dead source, close the manifest rows, regenerate the census) landed on main as
`e49f2d9bf` (land ticket `c-10477-1795612920259`). The land gate ran `test/architecture.test.mjs`,
`test/setup/git-mutation-census.test.mjs` and `test/scripts/doc-health.test.mjs`, and all three passed. The worktree was removed.

## What changed this wake

- Owner question `q-5roz2uy3sa` was answered with option "link-only fix inside phase 8", and the answer is now
  in `phase-08-delete-source.md` step 7 and in `plan.md`. The question is acked.
- The land door refuses a lead that changes its own footprint (`footprint-change-refused`), so the supervisor
  added the 17 docs to the footprint (`c7a25bdc7`).
- Plan 261124-0004 has phases 1 to 6 done, and its phase 7 does not write `docs/platform/run-supervisor/spec.md`.
  The three links in that file were therefore fixed here with no overlap.
- Unit `886bd28c2` (claude) fixed the 38 docs: 84 lines got the pin `(retired; last at `85760c6f2`)`,
  5 Markdown links became backticked paths, and 4 `Related:` entries that named deleted files were removed.
  It changed no other wording. Afterwards `scripts/doc-health.mjs` reported 0 findings on the branch.
- The first unit (`c-6113-1795611802757`) failed on infrastructure: gemini hit its provider limit, and the
  deepseek fallback exited 11 after a credential refresh `unexpected-shape`. It wrote nothing.
- The first land attempt was refused `main-checkout-dirty-overlap` on another plan's `plan.md`, while another
  head's land was in flight. The retry passed.

## State on main

- 24 files remain under `src/runner/dispatch`, `src/runner/execution` and `src/run-supervisor`. These are the
  live-kept files and the files the mailbox harness reaches.
- `git grep p-24xw2cwdvo -- packages/component-authority/model/ test/architecture.test.mjs` finds nothing.

## Next

Phase 11 (wave 4, the Node-twin debt), then phase 9 (wave 5, the docs prose), then phase 10 (wave 6, integration).
