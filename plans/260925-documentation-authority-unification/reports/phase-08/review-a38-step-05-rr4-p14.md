# Review a38 step-05 rr4 p14 (seam 4 source files, L12-72 standard)

Payload: s4-src-p14.json, 6 source files, 0 parks, 0 diffs (all preserve). 86 items reviewed (28 + 6 + 7 + 22 + 10 + 13 = 86 per payload counts; 2 literal refs in doc-link-pass, rest dynamic tuples).

## Per file

### scripts/doc-inventory-artifact.mjs - verdict ok (28 items)
- 17 REJECT: message formatting (007383/84/85/89/90/91/95/01/05/06/08/09), accumulator (007386), text join (007394). Messages print only caller data (manifestPath, part.path); no fixed document root, so R6 reject is right. Same-line existsSync/readFileSync at L100-101 is a disjoint operation, consistent with the R7 clarification in L12-72.
- 11 ADMIT/preserve: 007387/88 (L110), 007392/93 (L17), 007396/97 (L45), 007398 (L46), 007399 (L47), 007400 (L52), 007402/03 (L56), 007404 (L60), 007407 (L93), 007410 (L99). Same-line pairs agree. All preserve. This is a gate/support helper, so preserve is the R9-style outcome. No OUTCOME defect.
- Lead-judgment (not a defect, outcome is preserve either way):
  1. R5 vs admission of pure caller-path arithmetic: 007398 (L46 `path.dirname(manifestPath)`), 007399 (L47 `path.relative`), 007407 (L93 `path.dirname`) are parent/relative derivations of a caller-supplied path, with no fixed document root. R5 rejects "resolve/parent of a root". They are admitted here because they feed shard reads/writes (L52, L58, L101), which are admitted on the same precedent as p09 "path resolution admit/preserve". If Lead wants strict R5, these three become REJECT/pass-through. Check the sibling gate files for the same choice.
  2. 007394 (L21 `parts.join('/')`) is labelled `text-label-join`. It is the body of posixJoin, which builds the shard path that L60 (007404, admitted) stores and that L113 prints. nonDocumentUse "text-label-join" is not strictly true; it is path construction. Outcome stays preserve, but admission would be consistent with 007404 if R7 is read across the helper.
  3. 007404 (L60 `path: posixJoin(...)`) is admitted although R5 rejects path-valued data fields. It is a construction, not a pass-through like `path: m[1]`, so admit is defensible.

### scripts/doc-link-pass.mjs - verdict ok (6 items)
- 003555 (L10) and 003556 (L59): ADMIT/preserve, gate identity (R9). Outcome right; no retained-witness reliance on a retiring tree (003556 says gate identity; 003555's witness is generic).
- 007411 (L16), 007413 (L49): REJECT guard (comparison of fromPath, no read), correct.
- 007412 (L48): ADMIT/preserve, `posix.join(posix.dirname(file), relative)` resolves a doc link target; R9 witness is specific.
- 007414 (L68): REJECT caller-data-formatting, link text `[label](after)` where `after` comes only from alias/candidate data. Acceptable under R6 (no fixed document root). Note the line does emit a doc link into rewritten text, but the caller owns the write.
- Record-text note: 003555 role is `navigation` with the generic resolverWitness "retained non-authority registry/config or historical source identity". The passage is a legacy-prefix strip in the gate's matcher, so the role should read retirement-gate-identity like 003556. Outcome unaffected.

### scripts/doc-rationale-facts.mjs - verdict ok (7 items)
- 007415/16 text joins, 007418/20 comparison guards, 007417/19 finding path fields (`path:m[1]`, `path:w.path`): all true R5 rejects.
- 007421 (L65) ADMIT/preserve: real link destination resolution (`posix.join(dirname(u.path), file)`), gate document operand. OK.

### scripts/event-store/v-spawn-bench.mjs - verdict ok (22 items)
- All REJECT. Each nonDocumentUse is true: root/out CLI plumbing and path.resolve, checkout realpath, `.machine-state`, `bin/fgos.mjs`, `src/state/store.mjs` (source code, not docs), `.fgos` and `.fgos/runtime` (state), id/label/message formatting, argv guard. No document path is constructed or read anywhere in the file.

### scripts/events-jsonl-truncation-guard.mjs - verdict ok (10 items)
- All REJECT. targetPath/guardPath are events.jsonl and guard JSON (state event store), resolved against cwd; messages are caller formatting. No document path.
- Record-text note: 007444/46/48 use nonDocumentUse `finding-path-field` and 007445/47/49 use `config-or-metadata` for argv-parsed object fields. The accurate category is state-event-store (events.jsonl and guard files under .fgos) / scalar pass-through. Labels only.

### scripts/explain-command-route.mjs - verdict ok (13 items)
- All REJECT. Routes file is `packages/host-runtime/contracts/command-routes.json` (a JSON contract, not a document), the rest is selector/route-field console output and error text. `owner_path`/`legacy_payload` echo route data, not a fixed document root. True non-document uses.

## Counts
- Files 6, items 86 (ADMIT 14 [11 + 2 literal + 1 L48 + 1 L65 ... see below], REJECT remainder), parks 0, diffs 0.
- ADMIT count: doc-inventory 11, doc-link-pass 3 (003555, 003556, 007412), doc-rationale 1 (007421) = 15. REJECT = 71.
- OUTCOME defects: 0. Record-text notes: 2 files (doc-link-pass 003555 role/witness; events-jsonl guard labels). Lead-judgment: 3 (doc-inventory-artifact, above).

Status: DONE_WITH_CONCERNS
