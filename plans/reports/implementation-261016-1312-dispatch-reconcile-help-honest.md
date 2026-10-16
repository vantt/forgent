# Implementation: dispatch reconcile help honest (option A)

## Xac minh
- Planner `planReconciliation` (src/runner/dispatch/reconciliation-planner.mjs:233) tu choi `clear-assignment-claim` ("unsupported reconciliation action"); test/runner/dispatch-reconciliation.test.mjs:290 va test/cli/dispatch-reconcile.test.mjs:102 da khang dinh.
- Grep src/ bin/ docs/ core/skills/ test/: core/skills khong nhac. Quang cao that: command-registry.mjs (action description + tham so `assignment`), reconcile.mjs:21, bin/fgos.mjs:2668, docs/specs/runner.md (3 cho), docs/how-to/operate-dispatch-runtime-inspection-and-reconciliation.md.
- Giu nguyen: recover.mjs comment, backlog/verification history (lich su), test refusal.

## Thay doi
- Go khoi help/usage/docs; xoa tham so `assignment` cua registry (chi phuc vu action nay); runner.md "Four" -> "Three" actions.
- Test production-door: danh sach action quang cao = clear-cwd-lock, collect-result, repair-projection, va moi action do khong bi planner bao "unsupported".
- CHANGELOG Unreleased Fixed.

## Tests (env -u ...)
production-door, dispatch-reconciliation, cli/dispatch-reconcile, command-registry, fgos-help, fgos-verb-help-json: 56 pass, 0 fail.
`npm run build:skills` khong can (khong skill source nao nhac).
