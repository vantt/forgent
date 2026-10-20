# Review a38 step-05 rr4 p02

Payload: s4-src-p02.json, one file, no diff or rollbackDiff (parks and preserves only; no patch).

## apps/fgos-gateway/src/gateway.rs

Verdict: ok. Items reviewed: 131 (29 literal references 000161-000189, 102 dynamic tuples 000661-000762). Admit: 29 (27 preserve, 2 parked). Reject: 102 (all preserve).

OUTCOME defects: none.

Checks performed:
- Admitted dynamic tuples (664, 665, 693, 694, 733-736, 739, 742, 743, 758-762) each name a pathOperand that does read, write or probe a document path: get_contract read of docs/contracts/..., fixture create_dir_all and write under root, get_work_docs history-root canonicalize, root.join(docs_ref) from caller data, and resolved.join(CONTEXT.md or plan.md).
- Rejected dynamic tuples have true nonDocumentUse values. Root clones and pass-through, PathBuf::from("/tmp") roots, `temp_dir().join(format!(..))` fixture roots, static_dir and dev_dir index.html (static web asset, not a document), bin/fgos.mjs and bin/fgos-runner.mjs, ~/.fgos/config.json, parts.join(",") and the use-declaration at L21 construct or read no document path. 744 is correct: docs_ref is None, so the handler returns before any path is built.
- Same-passage agreement holds:
  - L1187: 177 + 664 + 665, all admit/preserve.
  - L1740/1741: 172/178 + 693/694.
  - L2314: 174 + 733/734.
  - L2351: 170 + 742.
  - L2332: 169 + 739.
  - L873-880: 189 + 758-761.
  - Comment-only literals (162-167, 171, 173, 175, 176, 179-181, 183, 187, 188) are all reject/preserve.
  - 165 (comment, L2352) is rejected while 170/742 (code, L2351) are admitted. Their source intervals are disjoint, so this is not an R7 violation.
- Both parks (161 at L131, 182 at L13) are consistent and inherited from the Step 4 records for the same edge ids. The park is real. At the pin the live how-to (docs/how-to/install-fgos-in-a-project-and-use-doctor.md L255) says `fgos doctor --fix` can restore gateway.token. That differs from the gateway comment's claim "only ever created by fgos setup". The candidate packaging spec carries the old row 5b under source-detail carriage. So there is a reconcile blocker, not a patchable live holder.
- Preserves rest on docs/contracts and docs/history. Neither is under docs/specs or docs/architect, and all cited files exist at the pin. No retired-decision citation is present, so no successorNote is required. There is no diff and no generated copy.

## Record-text notes (not outcome defects)

- 161 and 182: `blockedReason`, `dependency` and `parityObligation.blocker` are the generic sentence "requires final composed candidate document input set for the owning operation; current caller artifacts do not pin that candidate set." R4 lists boilerplate of this kind as not a blocker. The specific blocker is in `reason` (row 5b claim versus live doctor contract and doctor --fix). Suggest moving that sentence into blockedReason and the blocker field.
- 677 and 679: nonDocumentUse `state-event-store` is a loose label for `~/.fgos/config.json` (global config file). A config/metadata label would be more accurate. The reject itself is right.
- 678, 699: `text-label-join` is the label on a `.join("config.json")` path segment. Better label: config path. The reject is right.
- 721: `finding-path-field` on `use std::path::{Path, PathBuf}` is a mislabel. It is simply a type import. The reject is right.
- 181 (L1248): the matched fragment `docs/contracts/fgos-gateway-` is a line-wrapped piece of the contract path, so its witness says exists:false. The comment is preserved either way. It is worth a note that the full path spans lines 1248-1249.
- 165, 166, 171, 175, 176: comments citing docs/history use the witness "retained/external project or comment". Fine under the L12-71 retained docs/history convention.

## Lead-judgment questions

1. Fix the generic blockedReason text on 161/182 now (record-text only), or accept it because the inherited Step 4 reason names the real blocker?
2. The gateway's live get_work_docs route and its fixtures keep docs/history as a retained runtime convention (L12-71). Phase 9 plan line 86 treats docs/history as preserve-only history. If Phase 9 ever moves docsRef targets, these 22 admitted preserves become a patch obligation. Nothing to change in Step 5.

Counts: 131 reviewed; 0 outcome defects; 6 record-text notes; 2 questions.

Status: DONE
