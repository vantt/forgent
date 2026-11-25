# Phase 2 blocked: role intent and handover facts are outside its footprint

## Outcome

Phase 2 is not implemented. Reviewed and discarded all eight inherited uncommitted file edits; the workspace now matches HEAD (`git diff --exit-code` and final `git status --short` clean). No staging, commit, lifecycle operation, or out-of-scope workspace write was performed.

## Why the inherited patch cannot ship

- Running its new owning test first with `cargo test -p fgos-mailbox-core --test delivery mail_recorded_for_a_role_follows_rotation_to_generation_n_plus_1_and_is_offered_once` failed compilation: missing `Hold.key` at delivery.rs:674 and unresolved free function `eligible` at delivery.rs:738. This is compilation evidence, not the requested red behavioral proof.
- It added `Binding.role`, `register_with_role`, and a mailbox-owned role takeover. No production caller supplies the role. The hook still calls `state.register`, which passes None in that patch.
- Registration would move the mailbox role to a successor immediately, even while the predecessor legitimately owns it. Session Host spec section 8.2 explicitly requires Identity to retain the predecessor's role until the successor answers. Identity alone owns that decision.
- It added `Recipient::Role` without migrating exhaustive callers, including apps/fgos/src/wiring/mailbox_verbs.rs:752-753. Merely repairing the core compilation would leave the host incompatible.
- Its role-aware selector did not update the claim precondition (`has_pending`), finish ownership, or queue accounting. Its test exercised only a newly invented registry, not the production Identity handover.
- Optional fields alone are insufficient schema compatibility here: older readers deny unknown fields. A real implementation must address snapshot versioning/migration and size accounting as well.

None of the inherited production edits or new helpers/tests was safe to retain independently, so all were removed. Existing generation-isolation and delivery proofs remain unchanged, not weakened.

## Evidenced footprint blocker

At apps/fgos/src/wiring/mailbox_verbs.rs:695-701, the host resolves a role through Identity but constructs `Recipient::Key(key)`. The same variant is used for a fixed handle. The role-holder tuple is used only for report text at lines 769-773. Thus the record receives identical recipient input for role mail and fixed-handle mail; it cannot selectively transfer one and preserve the other.

At packages/mailbox/rust/store/src/hook/drain.rs:67-77, `HookCall` has writer/process/project facts but no Identity role-holder judgement. At lines 280 onward it only registers that process then claims its key/generation. The successor's distinct writer key and process do not prove which predecessor it succeeds, nor that Identity has moved the role. Copying environment role text or creating another mailbox role registry would violate the existing ownership boundary.

The host hook constructs and invokes the shell at apps/fgos/src/wiring/mailbox_hook.rs:135-150. It needs to pass the authoritative Identity fact through the existing hook boundary, not have the pure core infer it.

Required additional write authorization / coordinated phase ownership:

- `apps/fgos/src/wiring/mailbox_verbs.rs`: preserve role-vs-fixed addressing at send and migrate changed recipient API callers.
- `apps/fgos/src/wiring/mailbox_identity.rs`: reuse Identity's existing resolution and local-record filtering to supply current role ownership, fail closed on unavailable/ambiguous facts.
- `apps/fgos/src/wiring/mailbox_hook.rs`: connect that fact to the existing hook drain.
- `apps/fgos/tests/mailbox_routes.rs`: extend the existing alias wiring proof once, showing production role addressing survives handover while fixed-handle addressing does not.

These files belong to later phases of this plan; no edits were made to them. Reassign/coalesce their ownership rather than racing those phases. Once authorized, extend core/tests/delivery.rs for behavioral cases first, and record_snapshot.rs for one persistence wiring proof; do not duplicate the cases at the host layer.

## Prior art

Read the plan, phase brief, backlog item, reading map, mailbox spec sections 5.1 and 6.4, and Session Host spec section 8.2. History inspection found `6b3a4dfcf` (one Identity session record) and `f411dbf18` (deliver aliases only to the head Identity resolved). Reuse this authority instead of reinstating identifiers in the mailbox binding. No prior `to_role` implementation was found in the inspected mailbox/Identity history.

## Verification after discarding the patch

All baseline checks passed, not evidence of the new behavior:

- `cargo fmt -p fgos-mailbox-core -p fgos-mailbox -- --check`
- `cargo fmt -p fgos-mailbox-core -p fgos-mailbox`
- `cargo test -p fgos-mailbox-core`: 179 integration tests passed.
- `cargo test -p fgos-mailbox --test record_snapshot`: 14 passed.
- `git diff --exit-code`, `git diff --check`, final `git status --short`: clean.

No new rotation behavior or red behavioral regression was delivered. Workspace-wide tests were not run. Existing third-party arraydeque lifetime warnings were visible.

Impact-analysis capability is unconfirmed: `fgos dispatch decide --for impact-analysis --json` exited 127 because no activated `.fgos/installation` is available to this worker. Native caller/history searches were used; no index-backed blast-radius claim is made.
