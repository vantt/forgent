# Phase 12d: severity of every door row (owner decision D24)

Judged by unit `unit-run-1795493026528-cf454d7b` (commit 9a3b667d0 on branch `component-authority-doors/p12d`, not landed), using the N18 rules in `plans/discussions/ds-wqsrwmiier-harden-next-round/DISCUSSION.md`. The values wait here because the activated host refuses an unknown `severity` field. Phase 12d2 writes them into the rows, once a release whose crate accepts the field is activated.

## Reasons for high and medium, from the unit
High: checkout-make-provision-remove (Node repo-locks/unit-handoff/merge/git-ports copies make or remove checkouts beside the crate), resolve-invocation-root (mailbox_root.rs, host-bin-path.mjs, worktree.mjs decide a root separately), list-run-directories (adopt_scan.rs and run-result lister can disagree with the engine layout), footprint-write-scope-overlap-rule (live JS port in dispatch/write-scope.mjs beside the Rust rule), installation-shim-location (herdr fgos.rs builds the shim path itself). Medium: global-fgos-directory (Node facade asks the addon; state_root.rs HOME rule is named debt), no-node-from-native-packaging (init.rs Node version ask), doctor-readiness-registry (Node row bodies keyed by id), kernel-lock-primitive (single_load.rs own kernel lock), run-bounded-child (three bounded spawns outside spawn.rs), process-control-signal and process-facts-proc (frozen mailbox-live-confined.mjs measurement module). Rows judged low with debt: decide-a-dispatch, derive-executor-facts, tool-lookup-by-capability (twins reached only by the dead Node Execution closure).

## Lead correction after review

`skill-generated-stamp` is `high`, not `low`. Its Node twin `ownedSkillNames` in `src/setup/skill-wrappers.mjs` is live:
`src/setup/registrations.mjs` calls it during setup, and it decides the owned skill names, which can disagree with
`skill_stamp.rs`. That makes 6 high, 7 medium and 70 low.

## Values

| Door row file | severity |
|---|---|
| `admit-store-access.yaml` | low |
| `agent-definition-tier-directories.yaml` | low |
| `agent-hook-table.yaml` | low |
| `bind-a-seat.yaml` | low |
| `canonical-json-bytes.yaml` | low |
| `capability-rows-hold-jobs-and-tool-abilities.yaml` | low |
| `case-admission-crosses-the-process-boundary-only-through-the-peer-protocol.yaml` | low |
| `checkout-make-provision-remove.yaml` | high |
| `choose-an-executor-from-a-capability-s-prefer-only-in-the-seat-binding-crate-ask-bind.yaml` | low |
| `civil-date-arithmetic.yaml` | low |
| `classify-a-failed-event-store-child.yaml` | low |
| `coexistence-manifest.yaml` | low |
| `compose-git-status-and-recovery.yaml` | low |
| `control-the-gateway-process.yaml` | low |
| `decide-a-dispatch.yaml` | low |
| `decide-the-lane-of-an-invocation.yaml` | low |
| `delete-guard-keyword-list.yaml` | low |
| `derive-executor-facts.yaml` | low |
| `doctor-readiness-registry.yaml` | medium |
| `event-store-maintain-policy.yaml` | low |
| `execution-doctor-judgments.yaml` | low |
| `execution-s-node-seam.yaml` | low |
| `fence-a-registry-lock.yaml` | low |
| `footprint-write-scope-overlap-rule.yaml` | high |
| `fsync-a-file-or-directory-from-rust.yaml` | low |
| `global-fgos-directory.yaml` | medium |
| `global-fgos-path-cache.yaml` | low |
| `holder-lock-and-mailbox-doctor-judgments.yaml` | low |
| `init-steps.yaml` | low |
| `installation-shim-location.yaml` | high |
| `join-fgos-onto-project-root.yaml` | low |
| `kernel-lock-primitive.yaml` | medium |
| `list-run-directories.yaml` | high |
| `locate-and-read-a-project-config-file.yaml` | low |
| `main-checkout-activity-beacon.yaml` | low |
| `managed-timer.yaml` | low |
| `node-callers-reach-execution-only-through-its-seam-never-into-the-node-execution-closure.yaml` | low |
| `node-rows-bridge.yaml` | low |
| `no-node-from-native-packaging.yaml` | medium |
| `packaging-doctor-judgments.yaml` | low |
| `parse-cli-arguments.yaml` | low |
| `person-agent-config-writes.yaml` | low |
| `process-control-signal.yaml` | medium |
| `process-facts-proc.yaml` | medium |
| `process-identity.yaml` | low |
| `project-wiring-reversal.yaml` | low |
| `read-and-clear-a-hot-mutex-record.yaml` | low |
| `read-a-yaml-frontmatter-block.yaml` | low |
| `read-runner-capabilities-only-through-src-runner-capability-config-mjs.yaml` | low |
| `read-the-event-store-config-section.yaml` | low |
| `record-a-malformed-call.yaml` | low |
| `release-source-payload-selection.yaml` | low |
| `render-cli-help-from-the-manifest.yaml` | low |
| `report-the-registry-locks.yaml` | low |
| `resolve-invocation-root.yaml` | high |
| `retired-native-declarations.yaml` | low |
| `retired-node-config-identity-and-observe-doctor-rows.yaml` | low |
| `retired-node-git-and-event-store-doctor-rows.yaml` | low |
| `retired-node-help-renderer.yaml` | low |
| `retired-node-init-code.yaml` | low |
| `retired-node-s2-verb-code.yaml` | low |
| `retired-node-s3-verb-code.yaml` | low |
| `retired-node-s4-verb-code.yaml` | low |
| `retired-node-s5-code.yaml` | low |
| `retired-node-s5-hook-script.yaml` | low |
| `run-a-unit.yaml` | low |
| `run-bounded-child.yaml` | medium |
| `shell-rc-fgos-lines.yaml` | low |
| `skill-generated-stamp.yaml` | high |
| `start-a-detached-event-store-child.yaml` | low |
| `take-a-holder-lock-from-node.yaml` | low |
| `temp-file-name-of-a-node-write-then-rename.yaml` | low |
| `the-node-addon-never-links-the-execution-engine.yaml` | low |
| `the-node-bind-facade-has-only-its-named-callers.yaml` | low |
| `the-old-tool-registry-and-its-status-overlay-are-gone.yaml` | low |
| `the-purpose-chooser-outside-bind.yaml` | low |
| `the-raw-capability-section-is-handed-out-only-for-the-run-record.yaml` | low |
| `tool-lookup-by-capability.yaml` | low |
| `verb-manifest-projection.yaml` | low |
| `write-a-windows-verbatim-path-plainly.yaml` | low |
| `write-a-yaml-frontmatter-fence.yaml` | low |
| `writer-and-session-id-environment.yaml` | low |
| `yaml-parser-loads.yaml` | low |
