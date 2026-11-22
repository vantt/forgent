# DOCOS answer on the governance holder table preview

Answer to `q-4lmw3q6la7` (component-authority phase 5), relayed by the owner on 2026-11-23. DOCOS accepted the preview with one fix before the swap.

1. **Fix.** The rows `enduser-docs-authoring` and `enduser-docs-index`: the hand table points "Read first" and "Facts and RULs" at exact sections of `docs/platform/work-state/contracts/knowledge-registry.md`, namely the headings "## Spec: Soạn & nuôi tài liệu người-dùng-cuối (enduser-docs-authoring)" and "## Spec: Chỉ mục đọc-theo-tag tài liệu người-dùng-cuối (enduser-docs-index)". The generated rows point at `work-state/README.md` and `work-state/spec.md`, which do not hold those rules. Make the model carry those two section targets, then render. Keep the narrative home as `docs/platform/work-state/decisions/`.
2. **Accepted as is.** The questions narrative home without the `#11-lịch-sử-quyết-định` anchor (decision-index needs a plain file path), the added component-authority row, and the other rows, which match.
3. **Keep the heading** "## Decision scope to holder table" unchanged: its anchor is cited by `core/skills/_shared/citation-format.md`, `src/state/store.mjs` and `src/cli/command-registry.mjs`. Keep the prose before and after the table hand-written, outside the generated markers.
4. **Noted.** `fgos decision-index` now reads `packages/component-authority/model/decision-kinds.json`, not this table. The model is the source and the table is a generated reading view. No further DOCOS review is needed for the swap once item 1 is fixed.
