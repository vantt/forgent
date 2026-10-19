# review-a38-step-02e-map-replay

- Reviewer: `reviewer:sonnet-session:a243821896313e4ed@2026-10-19`
- Worktree: `/home/vantt/projects/forgentX-s8-review`, detached at `f1965d0a5ef8009644f477e32a5b0401b25933c0` (author `38c1ef8a5`, accounting `f1965d0a5`). Nothing was written inside it; `git status` shows only the pre-existing untracked files.
- Replay script: `step-02e-replay.py`, sha256 `55982240a46dbd8853c6b3a54c937da27dd302f5f8aa27f1889e60f3e676dd26`.
- Scope: L12-21 defect classes plus the owner-answers rules and the request packet. No semantic deep reads of mapping parts (other reviewers own those).

## Script safety

The replay, parser and packet scripts use stdlib only. Their only subprocess calls are `git ls-files`, `git rev-parse` and a `node -e` that reads `scripts/list-doc-anchors.mjs` for anchor checks. There are no file writes, and output goes to stdout only. Read-only: confirmed.

## Replay result

`env -u CLAUDE_CODE_SESSION_ID python3 step-02e-replay.py` took about 60 s and returned **PASS** with `failureCount` 0.

| Item | Value |
|---|---|
| Edges | 5,440 |
| Files | 1,036 |
| Distinct mappings | 1,330 |
| Review parts | 94 |
| Review entries | 5,159 |
| Sample | 816 |
| Max part payload | 397,442 bytes |
| Parser probes | 9 pass |
| Author negative probes | 8, all rejected |

Actions: patch-only 1,276 (all carry `new`), phase9-row-flip 53, preserve 3,325, behavioral-proof 160, pending-target 626.

My own checks agree with the packet:

- 5,440 edges map to 1,330 mappings with no unmapped or unknown edge.
- The 816-row sample is exactly `ceil(15% x 5440)`. I recomputed the ranking `sha256(seed + NUL + edgeId)` and the order is identical.
- The 12 exception-set sizes match the request.
- The retiring-root counts match the request (395, 8 and 207 checked).
- Overlay controls total 197: 5 + 66 + 126 across `step-02c-slice1-corrections`, `step-02d-slice2-corrections` and `step-02d-wrapped-citation-rescan`.
- No row appears in both slice1 and slice2, so there is no field conflict to resolve. For every overlaid row, the `cutoverAction` and `desiredOwner` in the effective row equal the correction value, 0 mismatches.

## Defect-class scans

These are my own scans over the census JSON and the consumer bytes, independent of the parser.

| # | Class | Result |
|---|---|---|
| 1 | Patch `old` is a prefix or suffix of a longer token | **0.** All 1,276 patches have `old` equal to the matched expression. For all 5,434 non-link entries (every entry, not just patched ones), the character before the span is never a path character and the character after is never a path character, a `.`+alnum, `{`, `<` or `*`. Trailing `.` or `,` punctuation after a Markdown link or token is not a path character. |
| 2 | Corrupted keys | **4 edges remain** (see Finding). A scan of all `references` keys for `[`, `]`, `repo/`, `docs/architect/docs/`, `{...,`, `}`, a leading `./` or `../`, `//` or whitespace finds 0. A scan for consumer-directory-glued keys finds the 4 edges below. |
| 3 | Path-text label split from destination | **0.** I scanned 1,439 Markdown links with a path-like label. In every one, label and destination fall in the same entry or in no entry (never different entries). The 606 Markdown-link patches have `old` and `new` as the full `[label](dest)`. |
| 4 | `docs/architect` inside `architecture-map.md` or `architecture-manifest.json` | **0.** The 98 edges whose expression contains those tokens normalize to exactly `docs/architecture-map.md` (53) or `docs/architecture-manifest.json` (45). The spans are whole tokens. There are 10 legitimate bare `docs/architect` directory tokens, each followed by a non-path character. The old census had 95 such cases (reproduced: 95). |
| 5 | JS or minified-HTML code tokens as edges | **0 in the generated HTML.** The 11 entries in `.html` files (`docs/specs/herdr-web-dashboard.md`) are generated-source rows. The wireframe-v2.html tokens are in `excludedCodeUnits` (42: 22 + 18 code, 2 substring). `counts.codeExclusions` says 40, which is code only (22 + 18). The 2 substring exclusions are separate, so there is a small count presentation gap only. The 4 `./src/...` edges in Finding are a code token in prose files. |

### Finding

Four edges (`maps-e-00637`, `-00638`, `-00648`, `-00649`) are shell or JS import specifiers inside prose. Example:

```text
node -e "import('./src/state/workflow-stage-graphs.mjs')..."
```

The files are `roadmap/team-dispatch-v1/step-01-rollout.md:205` and `step-02-workflow-stage-operations.md:433`, both under `docs/architect/agent-coordination/`.

- The parser resolves `./src/state/workflow-stage-graphs.mjs` against the consumer directory. It produces the key `docs/architect/agent-coordination/roadmap/team-dispatch-v1/src/state/workflow-stage-graphs.mjs`, which is a consumer-directory-glued key and a code token as a path.
- The rows are `rule: navigation`, `preserve-pending-target`, `desiredOwner: null`, with no executable patch. So no rewrite harm is possible, but they are false class-3 edges.
- This contradicts the review-data claims that `corrupted-reference-key` and `code-token-as-path` are 0 after.
- The replay cannot catch it. The replay uses the parser as the oracle, and none of the 9 parser probes covers `./src/` JS imports inside prose. The replay is therefore sound for source drift and downstream consistency, but not independent of parser blind spots.

Recommended fix: exclude `./` and `../` tokens that sit inside `import(` or `node -e` commands with a reason, add a parser probe, regenerate, and then send the packet onward. Rework from this finding is 4 of 5,440 edges (0.07%), far below the 3% bar.

## Before/after numbers

| Claim | My check |
|---|---|
| prefix-inside-longer-token 95 → 0 | Before: reproduced exactly (95) from the old census. After: 0. |
| unexpanded-brace-list 2 → 0 | Before: reproduced (2 truncated `{p6-probe.sh` keys). After: 0. |
| corrupted-reference-key 192 → 0 | Before: partly reproduced (`[` 76, `repo/` 16, `docs/architect/docs/` 1, remainder are the depth-prefix class). After: 0 by the packet's predicate, **4 by mine** (Finding). |
| partial-reference-patch 1312 and prefix/suffix 444 → 0 | After: 0 (class 1). My crude before-predicate gives 471 old patches with a boundary violation, so I cannot reproduce exactly 444 or 1312. Different predicates, not a contradiction. |
| split-markdown-link 168 → 0 | After: 0 (class 3). Before not independently reproduced. |
| code-token-as-path 22 → 0 | After: 22 + 18 JS exclusions in HTML. The 4 edges in prose are the exception above. |
| Contextual-rule classes (provenance, migration, generated, etc., all → 0) | Not verified here. They need reviewer deep reads. |
| Other counts in the request (1018 → 1330 mappings, 5,427 → 5,440 edges, 15% sample) | Match. |

## Mutation probes

I made a clone under `/tmp/fgos-work/probe-repo` at `f1965d0a5`, mutated one thing per run, ran the full replay each time, and restored. 12 probes, all returned **FAIL** (as required).

1. Patch `old` truncated to a prefix: FAIL (census differs from reparse).
2. `repo/` injected into a `references` key: FAIL.
3. `normalizedReference` set to `docs/architect/docs/specs/runner.md`: FAIL.
4. Markdown-link span shrunk so the label splits off: FAIL.
5. `architecture-map` token cut back to `docs/architect`: FAIL.
6. A JS code exclusion removed: FAIL.
7. Review-data defect `afterCount` set to 1: FAIL (stale downstream and "Detectable systemic defects remain").
8. Distinct-mapping membership dropped: FAIL.
9. Consumer source bytes changed (`docs/README.md`): FAIL.
10. Overlay input (slice2 corrections) altered: FAIL (overlay precedence flows downstream).
11. New tracked class-3 file added: FAIL (`AssertionError: Tracked class-3 population changed`).
12. Parked row given an executable `new`: FAIL.

Gap: no probe can fail for a defect the parser itself produces (see Finding).

## Verdict

**DONE_WITH_CONCERNS.** The replay passes, and the mechanical machinery (digests, spans, joins, overlay precedence, sample ranking, boundary check) holds. Defect classes 1, 3, 4 and 5 (in the HTML) are verified gone. Class 2 and the code-token class are not fully gone: 4 parked edges are false positives from JS import specifiers. This also means the "0 after" claims for `corrupted-reference-key` and `code-token-as-path` are overstated by 4 rows.

Because the rework is under 3% and affects no executable patch, it does not block deep-read review of the logical parts. The parser exclusion, a probe and a regenerate are best done before the packet is accepted.

Not done (out of scope for this role): semantic deep reads of mapping parts and exception sets, the contextual-rule class counts, and the native or anchor items marked open by the author.
