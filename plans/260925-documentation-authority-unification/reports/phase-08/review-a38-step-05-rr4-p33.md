# Review a38 step-05 rr4 p33

Part: p33. Payload: s4-src-p33.json (1 file, 163 items). Pin aa8d343746a2.

## src/setup/holder-lock-checks.mjs

Verdict: ok. 163 items reviewed (all REJECT/preserve, no diff, no parks, no admitted items).

I read the whole pinned file (810 lines). Every path operation in it is one of these:
- A lock file or lock directory: `.fgos/locks`, `<lockRoot>`, `workflow-runs`, `assignments`, `provider-account`, and the probe lock files.
- A `.fgos/installation/activation.json` read.
- A release `manifest.json` read.
- The `packages/holder-lock/contracts/lock-registry.v1.json` payload registry.
- `/proc/<pid>/*`.
- `.git` probes.
- Error and message formatting built from caller data or probe results.

A case-insensitive grep for docs, .md, spec, how-to, plans/, decisions, backlog, readme and AGENTS finds only L2, a comment pointer to `docs/platform/holder-lock/spec.md`. That is a live holder, it is not an item in this payload, and the file has no other document path. So every reject is correct under R5, and no document-path operand or fixed-document-root message is hidden under a reject. R6 does not apply anywhere.

Same-passage items agree: all items on a shared line (for example 139, 187, 266, 578, 583, 585, 626) share REJECT and preserve.

OUTCOME defects: none.

### Record-text notes (label accuracy only, no outcome change)
- 013773 and 013774 (L586, `path.join(repoRoot|common, 'fgos/git')`) are labelled `scalar-pass-through`. The operand is a probe for the fgctl controller artifact, not a pass-through. `non-document-fs-probe` or `config-or-metadata` fits better. It is not a document.
- 013769, 013770, 013779 and 013780 (L583, L626, `.fgos/installation/activation.json`) are labelled `scalar-pass-through`. They read `.fgos` state, so `state-event-store` would be more accurate.
- 013734 (L44, `REGISTRY_IN_PAYLOAD`, a JSON contract file in the package payload) is labelled `scalar-pass-through`. `config-or-metadata` would be more accurate.
- 013783, 013786 and 013788 (L638 to L648, release `manifest.json` and registry reads) are labelled `scalar-pass-through`. `config-or-metadata` would be more accurate.
- Many `caller-data-formatting` items sit on lines that build lock paths (L139, L187, L496, `/proc/${pid}`). The label really covers the message or template, and the path is non-document infrastructure anyway.
- Several items carry the `scalar/thread` role on formatting lines. It is harmless.
- The shared `rejectedAsUnrelatedReason` boilerplate ("holder-lock registry/record diagnostics ... not a documentation-authority root rewrite") is accurate for every item. It is boilerplate, but the reject is concrete and true.

### Lead-judgment questions
- None. The L2 comment pointer `docs/platform/holder-lock/spec.md` has a live target and is not in this payload. Confirm only that another record owns it as a preserve or patch, so it is not an unrecorded reference.

Counts: 163 items, 163 REJECT, 0 ADMIT, 0 parks, 0 diffs, 0 outcome defects, about 12 label notes.
