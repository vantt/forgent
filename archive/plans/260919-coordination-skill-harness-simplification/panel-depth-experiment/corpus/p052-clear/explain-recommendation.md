# explain-recommendation (real, asgn_coordinator_driver_op_029)

## Dispatched objective (verbatim)

Write the one document meant for the person, about /home/vantt/projects/herdr-gateway/web/src/block-classify.ts's terminal-detail block classification strategy -- consequence first, architecture second, defensible to colleagues who will live in the resulting codebase, not a summary of what happened internally. The real synthesis recommendation: keep looksStructured() as a flat ordered OR-chain of small named detectors (Proposal A's shape, identical to C's status quo), reject Proposal B (a Pluggable Output Grammar registry) -- not on generic YAGNI grounds but because it is behaviourally equivalent to the current shape (pure OR chain) while splitting matched exclusion notes (e.g. BOX_CHARS excluding the arrow precisely so a summary detector can claim it) into files that would no longer explain each other, a real debuggability regression. No code change required. The one authorized action: build phase-04's never-built fixture corpus plus a confusion matrix scored on false-wrap rate (must stay at zero; false-pan is tolerated), per the operator's own 2026-08-11 locked decision (fully automatic, no UI control, err toward pan when unsure). The independent red-team's live, unresolved dissent -- state this plainly, do not smooth it over: the red-team called the panel's own conduct 'intellectually dishonest,' arguing the critic's valid attack on Proposal A was dismissed to protect the status quo, that Proposal B was a deliberately weak strawman, and that a real, legitimate hybrid nobody proposed -- an array of modular predicate functions (a Strategy-pattern refactor keeping the same behavior, same OR-composition, just each detector in its own named unit) -- was conspicuously never put forward or evaluated by any of the three shapers. Tell the person this dissent is real and unresolved, name the hybrid option honestly, and say what would change the recommendation if the person wants that hybrid evaluated (a new session, since Phase 5 shaping does not reopen within this protocol). Use absolute paths for anything you read (e.g. /home/vantt/projects/herdr-gateway/web/src/block-classify.ts). This session's own coordination bookkeeping lives at /home/vantt/projects/forgentX/.fgos/ -- you are authorized to write your result artifacts at the exact runDir path this dispatch gives you under that tree. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Recommendation document written for the operator: keep looksStructured() as a flat ordered OR-chain (Proposal A, identical to the C status quo); reject Proposal B (Pluggable Output Grammar registry) because it is behaviourally identical to a pure OR chain while splitting matched exclusion notes (BOX_CHARS at block-classify.ts:43-49 narrowed precisely so countSummaryPairs at :83-91 can claim the arrow) into files that no longer explain each other. No code change recommended or made. Phase 4's never-built fixture corpus (25 fixtures, core/extended tiers) and a confusion-matrix scorer gating false-wrap at zero were built and delivered as drop-in files. IMPORTANT LIMITATION: the herdr-gateway checkout is read-only and no shell was available in this environment, so the corpus was NOT landed in web/test/ and the matrix was NOT executed - the reported 4/13 (30.8%) core false-wrap rate is hand-traced through the detector chain, not run. The red-team's dissent is relayed unresolved and unsoftened, including its concession point: my case against B does not touch the never-proposed hybrid (an array of modular predicate functions, Strategy-pattern, same behaviour and same OR-composition), against which I have only a sequencing objection.",
  "recommendation": {
    "decision": "keep Proposal A / status quo shape; reject Proposal B; no change to web/src/block-classify.ts",
    "primary_reason_for_rejecting_b": "behaviourally identical (pure OR chain over independent predicates, order unobservable) while separating two comments that are each other's other half - a real debuggability regression, not generic YAGNI",
    "concrete_failure_scenario_for_b": "a maintainer widens BOX_CHARS to include arrows inside a box-drawing grammar module (locally correct); the q-and-a summary detector silently stops firing because arrow lines trip the box-ratio check first; no verdict changes so no test fails; the comment that would have prevented it now lives in another file"
  },
  "authorized_action": {
    "name": "phase-04 fixture corpus + confusion matrix scored on false-wrap rate",
    "built": true,
    "landed_in_repo": false,
    "executed": false,
    "blocked_by": "herdr-gateway checkout is read-only (EROFS on web/test/fixtures) and Bash is unavailable (EROFS creating its own working dir under /tmp)",
    "artifacts": [
      "corpus/terminal-blocks.ts",
      "corpus/block-classify-corpus.test.ts"
    ],
    "drop_in_targets": [
      "/home/vantt/projects/herdr-gateway/web/test/fixtures/terminal-blocks.ts",
      "/home/vantt/projects/herdr-gateway/web/test/block-classify-corpus.test.ts"
    ],
    "run_command": "cd /home/vantt/projects/herdr-gateway/web && npm test"
  },
  "hand_derived_confusion_matrix": {
    "verification": "hand-traced through looksStructured()'s detector chain; NOT executed",
    "core": {
      "fixtures": 20,
      "expect_pan_got_pan": 9,
      "expect_pan_got_wrap": 4,
      "expect_wrap_got_pan": 1,
      "expect_wrap_got_wrap": 6,
      "false_wrap_rate": "4/13 = 30.8%",
      "false_wrap_required": "0",
      "false_pan_rate": "1/7 = 14.3% (tolerated)",
      "false_wrap_fixtures": [
        "ls-la-with-total-header",
        "git-log-graph",
        "git-diff-unified",
        "tsc-caret-underline"
      ],
      "false_pan_fixtures": [
        "node-stack-trace"
      ]
    },
    "extended": {
      "fixtures": 5,
      "note": "not gated - labels are judgment calls; 4 of 5 hand-traced to wrap against an expected pan; figlet-banner deliberately left un-predicted"
    }
  },
  "findings": [
    {
      "id": "fallback-polarity-inverted",
      "severity": "high",
      "summary": "block-classify.ts:15 and terminal-detail.md R25 both state the unknown case pans; the code wraps it (looksStructured returns false at :175, classifyBlocks turns that into 'wrap' at :201). Every hand-traced false wrap is that case.",
      "note": "A fair alternative reading is that the comment means the individual detectors are tuned permissively toward pan, which they are. R25's wording is about the cannot-tell case specifically."
    },
    {
      "id": "ls-la-total-header-defeats-gutters",
      "severity": "high",
      "summary": "stableGutters takes width as the shortest row (block-classify.ts:113). The 8-character `total 48` line ls always prints truncates the column scan to 0-7, where permission bits leave nothing blank, so a correctly-panning ls -la body wraps once its real header is present. Corpus holds both versions as a controlled pair."
    },
    {
      "id": "no-detector-for-diffs-or-graphs",
      "severity": "high",
      "summary": "block-classify.ts's own opening comment names diffs and ASCII art as shapes wrapping ruins, but no detector matches either. git diff and git log --graph both hand-trace to wrap."
    },
    {
      "id": "box-chars-comment-overstates-git",
      "severity": "low",
      "summary": "The comment at block-classify.ts:43-49 claims BOX_CHARS covers 'the branch glyphs of cargo tree and git log --graph'. cargo tree does draw in box characters; git draws its graph rail in ASCII (* | / backslash). The git-log-graph fixture settles this on the first run."
    }
  ],
  "red_team_dissent": {
    "state": "live and unresolved",
    "relayed_verbatim_in_report": true,
    "charges": [
      "the panel's own conduct was intellectually dishonest",
      "the critic's valid attack on Proposal A was dismissed to protect the status quo rather than answered",
      "Proposal B was a deliberately weak strawman set up to lose",
      "a legitimate hybrid was conspicuously never proposed or evaluated by any of the three shapers"
    ],
    "unproposed_hybrid": "an array of modular predicate functions - a Strategy-pattern refactor keeping the same behaviour, the same OR-composition, each detector in its own named unit",
    "concession_made_in_report": "the case against Proposal B is an argument about splitting the file, and does not touch the hybrid, which keeps the matched exclusion comments colocated. The only objection left to the hybrid is sequencing: it changes no verdicts while the gated false-wrap number sits near 31%.",
    "what_would_change_the_recommendation": "evidence that the hybrid's shape makes adding diff/graph detectors materially cleaner than the chain does. Nobody has looked.",
    "how_to_get_it": "a new session - Phase 5 shaping does not reopen within this protocol, which is a process constraint and not a verdict on the option"
  },
  "open_questions": [
    "Is the intended fallback pan or wrap? block-classify.ts:15 and R25 say pan; :175/:201 do wrap.",
    "Do diffs and git log --graph warrant their own detectors, or is inverting the fallback the smaller change?",
    "Should the extended-tier labels (unpadded markdown table, pretty JSON, pasted source) be promoted to core? Doing so raises the gated false-wrap rate considerably.",
    "Do you want the never-proposed hybrid evaluated properly, in a new session?"
  ],
  "outputs": [
    "/home/vantt/projects/forgentX/.fgos/assignments/asgn_coordinator_driver_op_029/runs/01/agent-report.md",
    "/home/vantt/projects/forgentX/.fgos/assignments/asgn_coordinator_driver_op_029/runs/01/agent-result.json",
    "/home/vantt/projects/forgentX/.fgos/assignments/asgn_coordinator_driver_op_029/runs/01/corpus/terminal-blocks.ts",
    "/home/vantt/projects/forgentX/.fgos/assignments/asgn_coordinator_driver_op_029/runs/01/corpus/block-classify-corpus.test.ts"
  ],
  "sources_read": [
    "/home/vantt/projects/herdr-gateway/web/src/block-classify.ts",
    "/home/vantt/projects/herdr-gateway/web/test/block-classify.test.ts",
    "/home/vantt/projects/herdr-gateway/docs/specs/terminal-detail.md",
    "/home/vantt/projects/herdr-gateway/docs/specs/reading-map.md",
    "/home/vantt/projects/herdr-gateway/web/package.json"
  ]
}
```

## Real agent-report.md (verbatim)

# Terminal-detail block classification: what to do, and what we still don't know

**Recommendation: change nothing in `web/src/block-classify.ts`. Spend the budget on measurement instead.**

Read the top half for the decision. Read the bottom half before you close the question, because the review of this decision did not end in agreement and you should not be told otherwise.

---

## 1. The consequence

`looksStructured()` in `/home/vantt/projects/herdr-gateway/web/src/block-classify.ts:131` decides, per block, whether your phone pans a line sideways or breaks it to fit. There is no control for it — `docs/specs/terminal-detail.md` R24 says so explicitly, by your own 2026-08-11 decision — so when it is wrong, you live with it.

Wrong in one direction costs nothing. Wrong in the other destroys information:

| | what you see |
|---|---|
| prose wrongly panned | one sideways drag — the behaviour that shipped before this feature existed |
| laid-out block wrongly wrapped | alignment gone, unrecoverable, no way to ask for it back |

So there is exactly one number that matters: **false-wrap rate, which must be zero.** False-pan is tolerated and always was.

That number had never been measured. `terminal-detail.md`'s own Open Gaps says it outright: *"Real miss rates have not been measured against a corpus of the output the operator actually reads."* Phase 4 was supposed to build that corpus and never did.

I built it. **The false-wrap rate is not zero.** On a 20-fixture core tier of shapes nobody would argue about, four laid-out blocks get wrapped:

```
core tier — 20 fixtures
                 got pan   got wrap
  expect pan            9          4
  expect wrap           1          6

  false wrap (must be zero): 4/13 = 30.8%
    ls-la-with-total-header
    git-log-graph
    git-diff-unified
    tsc-caret-underline
  false pan (tolerated):     1/7  = 14.3%
    node-stack-trace
```

Read that as: the tolerated direction behaves exactly as designed. The direction with a hard bar on it is at 31%.

**Read this caveat before you act on the number.** This environment gave me no shell and a read-only checkout, so I could not run the suite. Those four verdicts are hand-traced through the detector chain, not executed. I am confident in the traces and I have written the corpus and the scorer so that one command settles it. The number above is a prediction with its own falsifier attached — which is more than the question had before, and less than proof.

### What each failure is

- **`ls -la`** — the body rows pan correctly (8 gutters). Add the `total 48` line that `ls` always prints and the whole block wraps. `stableGutters` (`block-classify.ts:113`) takes `width` as the *shortest* row, so an 8-character header truncates the scan to columns 0–7, where the permission bits leave nothing blank. The corpus holds both versions side by side; the header is the only variable.
- **`git diff`** — no detector looks at diffs at all. A wrapped body line loses its leading `+`/`-` and reads as context. The module's own opening comment names diffs as something wrapping ruins.
- **`git log --graph`** — same. Worth flagging: the comment at `block-classify.ts:43-49` says `BOX_CHARS` covers "the branch glyphs of `cargo tree` and `git log --graph`". `cargo tree` does draw in box characters. Git draws its rail in ASCII (`* | / \`). Half that comment is wrong, and the fixture is there to prove it either way.
- **`tsc` caret underlines** — a two-line block, below the four-row floor `stableGutters` needs. The underline's only meaning is the column it sits in.

### The thing underneath all four

`block-classify.ts:15` says: *"`pan` is the default and `wrap` is the path that has to prove itself."* `terminal-detail.md` R25 says the same: when the screen cannot tell, it pans.

The code does the opposite. `looksStructured` returns `false` when it recognises nothing (`:175`), and `:201` turns that into `wrap`. The unknown case wraps. Structure has to prove itself; wrapping is the fallback.

There is a fair reading in which the comment means "each detector is tuned permissively toward pan" — and it is, `BOX_LINE_RATIO` at 0.3 and `GUTTER_MIN_COUNT` at 2 are both generous. But R25 is a claim about the case where the screen *cannot tell*, and in that case this code wraps. Every one of the four failures is that case.

I am not recommending you flip it today. Flipping the fallback would pan large amounts of prose and you would feel it immediately. I am saying the corpus is what tells you whether to add four detectors or invert one return, and until it runs you are choosing blind.

---

## 2. The architecture question you actually asked

Three shapes were on the table. Two of them were the same shape.

- **Proposal A** — keep `looksStructured()` as a flat, ordered OR-chain of small named detectors.
- **Proposal C** — the status quo, which is Proposal A. Same shape, different label.
- **Proposal B** — a Pluggable Output Grammar registry: each detector becomes a registered "grammar" in its own module, composed by a registry.

**Keep A. Reject B.** Not on YAGNI grounds — that argument is available but it is not the real one, and it is not the one that would survive a colleague pushing back.

The real one: **B is behaviourally identical to A and pays for that identity with a specific, concrete loss of debuggability.**

Identical, because `looksStructured` is a pure OR chain over independent predicates (`:135`, `:137`, `:140`, `:151`, `:167`, `:173`). Order is unobservable. There is no fallthrough, no accumulation, no shared state. A registry that ORs the same predicates computes the same function. B buys nothing you can point at in behaviour.

The loss is exact. Two comments in this file are each other's other half:

- `:43-49`, on `BOX_CHARS`: arrows and geometric shapes are *deliberately excluded*, because an agent scatters `→` through prose as a bullet, and counting it made a three-line paragraph pan.
- `:83-91`, on `countSummaryPairs`: that exclusion is precisely *what makes the summary detector possible*. A lone `→` is not layout; a `→` alone on its own line under a bulleted question, twice, is Claude's own answer summary.

One constant is narrowed so a different detector can claim what it gave up. Today those two notes sit forty lines apart and a reader hits both. Under B they live in a box-drawing grammar module and a q-and-a-summary grammar module respectively.

The failure that buys: someone maintaining the box grammar widens `BOX_CHARS` to include arrows. Locally correct — arrows *are* drawing characters. The q-and-a summary detector silently stops firing, because every `→` line now trips the box-ratio check first and the pairs are never counted. Verdicts do not change (both return pan), so no test fails; then someone tunes `BOX_LINE_RATIO` and the summary shape breaks with no trace back to the arrow. The comment that would have stopped it is in a file they had no reason to open.

That is the case against B. It is an argument about **splitting the file**, and I want to be precise about that, because it is not an argument against naming things.

---

## 3. The dissent, which is real and unresolved

The independent red-team did not sign off. It called the panel's own conduct **intellectually dishonest**, on three counts. I am relaying them because you should decide what they are worth, not me:

1. The critic raised a valid attack on Proposal A, and it was dismissed to protect the status quo rather than answered.
2. Proposal B was a **deliberately weak strawman** — a registry with plugin ceremony is the easiest thing in the world to reject, and setting it against the status quo guaranteed the status quo won.
3. A legitimate third option was **never put forward or evaluated by any of the three shapers**, and its absence is conspicuous.

That third option, named honestly:

> **An array of modular predicate functions** — a Strategy-pattern refactor. Same behaviour, same OR-composition, same file if you like; each detector extracted into its own named unit and the chain becomes an iteration over them.

I have to concede the red-team's substantive point. **My argument against B does not touch the hybrid.** Everything I wrote in §2 is about the matched exclusion notes ending up in files that no longer explain each other. An array of named predicates in one module keeps them colocated. If the hybrid were on the table, "it splits the comments apart" is not an objection to it.

So the honest form of my recommendation is narrower than "keep the status quo":

- Against **B**, I am confident, and the reason is the one in §2.
- Against the **hybrid**, I have no behavioural or debuggability objection. My reason for not doing it now is priorities, and it is a weaker kind of reason: the corpus says the defect is in *which shapes the detector set recognises*, not in how the detectors are arranged. A refactor that changes no verdicts, while the one gated number sits near 31%, spends the change budget in the wrong place and adds diff noise across the file you will be editing to fix it.

That is a sequencing argument, not a merits argument. It expires the moment the false-wrap rate is at zero.

**What would change the recommendation:** evidence that the hybrid's shape makes the fix in §1 *easier* — for instance, that adding diff and graph detectors is materially cleaner against an iterated predicate array than against the chain. Nobody has looked. It is a real question and it deserves a real answer rather than my sequencing argument standing in for one.

**How to get that answer:** a new session. Phase 5 shaping does not reopen inside this protocol, so the hybrid cannot be evaluated here no matter how good the case for it is. That is a process constraint, not a verdict on the option, and it should not be mistaken for one.

---

## 4. What I did, and what is not done

**Built** (delivered as drop-in files, see below):

- A **25-fixture corpus** of real terminal shapes — `ls -la`, `df -h`, `cargo tree`, `git diff`, `git log --graph`, `tsc` carets, vitest summaries, Claude Code footers/menus/answer-summaries, markdown tables padded and unpadded, plus prose, bullets, narration and stack traces. Each carries the treatment R22/R23 says it should get and *why*, in the spec's own terms.
- Two tiers. **Core** is labels a colleague would not argue with. **Extended** is judgment calls (unpadded markdown tables, pretty JSON, pasted source, `git status --short`, a figlet banner), scored and printed but **not gated**, so a label you disagree with can never move the number your decision is about. Each extended fixture states its own counter-argument.
- A **confusion-matrix scorer** that prints both tiers every run and hard-asserts false-wrap is zero on core only.

**Not done, and it matters:**

- **Nothing was landed in the repo.** `/home/vantt/projects/herdr-gateway` is read-only in this environment — `web/test/fixtures/` could not even be created. The two files are in the run directory below, ready to copy.
- **Nothing was executed.** No shell (`/tmp` read-only). The matrix in §1 is hand-traced. Running it is the experiment.
- **No fixture was captured off a live pane.** They are transcribed by hand into the shape each program emits. Column positions are faithful but reconstructed; a live capture pass is the natural follow-up, and it is the one thing that would make the `ls -la` and `git log --graph` findings unarguable.
- **No change to `block-classify.ts`.** None was authorised and none is recommended today.

### To run it

```
cp <runDir>/corpus/terminal-blocks.ts            web/test/fixtures/terminal-blocks.ts
cp <runDir>/corpus/block-classify-corpus.test.ts web/test/block-classify-corpus.test.ts
cd web && npm test
```

`<runDir>` is `/home/vantt/projects/forgentX/.fgos/assignments/asgn_coordinator_driver_op_029/runs/01`.

**Expect it to go red**, on the core false-wrap gate, listing those four fixtures. That is deliberate. Your 2026-08-11 decision put a hard zero on that number, and a corpus that pre-approves its own violations is decoration. If you want green today while you decide what to do, delete the `never wraps a block the program laid out` test and keep the matrix printout — but do that as a choice you made, not as a default that happened to you.

If it comes back green, my traces were wrong and that is worth knowing too — the fixtures still stand, and the gate then protects a property you already have.

---

## Open questions

1. Is the intended fallback pan or wrap? `block-classify.ts:15` and R25 say pan; `:175`/`:201` do wrap. One of the three is wrong and only you can say which.
2. Do diffs and `git log --graph` warrant their own detectors, or is inverting the fallback the smaller change? The corpus can answer this; it has not been run.
3. Should the extended-tier labels (unpadded markdown table, pretty JSON, pasted source) be promoted to core? Each is defensible; none is obvious. Promoting them raises the gated false-wrap rate considerably.
4. Do you want the hybrid — the array of named predicate functions — evaluated properly? It needs a new session, and nothing in §2 argues against it.
