# Agent output format fragility: stray `+`, `missingExpertise`, garbage streams

Read-only investigation, 2026-10-12. No code, config or git state changed. Evidence is under `.fgos/assignments/` (not committed) and `.fgos/workflow-runs/`.

## Summary

The three shapes have three different causes and need three different fixes.

| Shape | Who produced it | Which check rejected it | Verdict |
|---|---|---|---|
| 1. Leading `+` | `openai` / `codex-herdr` (gpt-5.6-terra) | `JSON.parse` of `result-N.json` in `settlement.mjs:522` | Model/tool slip, plus the validator giving no feedback and no retry |
| 2. `missingExpertise` | `claude-herdr` opus (every producer seat seen) | `readMissingExpertise` / `renderGateQuestion`, `src/workflow/runner.mjs:122-165` | Prompt too vague. The validator is a strict exact-key match, which is defensible but cheap to relax |
| 3. Garbage stream | `glm` z-ai/glm-5.3 via pi + openrouter | No validator rejected it: nothing was written, so the claim is absent (`settlement.mjs:361-366`) | Model/provider unreliable. The runner has no retry for this outcome |

There is no string "returned no valid evidence" anywhere in `src`, `core`, `docs`, `test` or `.fgos`. The real classification is `confidence.level: "no-evidence"`, `verdict-inconclusive`, which the unit layer maps to `execution-failure`.

## Prior art

- `git log -S'missing expertise'` shows the contract came in with the advisory path M work (8a2373937, fcfeafba7).
- `ce880fbed` is the only prior fix. Its message: "the synthesis producers kept the settled report as prose and wrote the JSON packet to packet-1.json with the key spelled missing_expertise, so the close gate could not read it and always parked". It added the `missing_expertise` alias and the sibling `packet-*.json` fallback, but not `missingExpertise`.
- `docs/specs/runner.md:1432` records the rule: either of the two spellings is read; "Fenced or prose-embedded JSON is never parsed"; malformed or absent reports park with no inferred expertise. That is a deliberate decision, so the fixes below do not touch it.
- The same line shows this is the third key spelling. The owner already accepted a tolerance step once (the `missing_expertise` alias).

## Shape 2: `missingExpertise` (the cleanest case)

What the agent wrote. `.fgos/assignments/unit-run-1791778306648-37b3f121/producer/1/runs/01/outbox/report-1.md:319` is a valid raw JSON packet that uses the key `"missingExpertise": [...]` with five good entries. Round 2 does the same at `producer/2/.../report-1.md:369`.

Every other key in that packet is camelCase: `namedDefaults`, `residualRisks`, `reversalTriggers`, `unresolvedDissent`, `attributedFindings`.

What the producer believed. Its own claim says so: `producer/2/.../outbox/result-1.json` summary reads "missingExpertise is a nonempty array". It was sure it had complied.

Why it drifted. The prompt (`core/workflows/architecture-advisory.yaml:59-62`, copied into `producer/1/runs/01/brief-1.md:29`) lists the other fields as English prose ("attributed findings, dispositions, unresolved dissent, named defaults, residual risks, and reversal triggers") and quotes only one key literally: `"missing expertise"`. The model camelCases the prose names for the other keys and, by the same habit, this one. The quoted spelling is the outlier, with a space, unlike anything else in the packet. The prompt also names no key for the other fields at all, so nothing tells the model that this one must stay verbatim.

Which check rejected it. `readMissingExpertise` (`runner.mjs:130-153`) tries `EXPERTISE_KEYS = ['missing expertise', 'missing_expertise']` (`runner.mjs:122`), gets `undefined` for both, and returns `undefined`. `renderGateQuestion` then throws `'gate report requires "missing expertise" as an array of non-empty strings'` (`runner.mjs:164`). The gate parks.

Observed outcome. `.fgos/workflow-runs/wf-run-1791777581676-9e40ddda/events.jsonl:27` shows `gate.park` "Cannot read settled producer ... gate report requires ...". The park was the intended safe fallback. The owner then answered by hand ("Approved: no" at 05:20:25, `gate-answers/close.md`). The same park appears on 2026-10-09 in `wf-run-1791519805545-488f1b9e` (events line 22, same text). The `invalid JSON` variant in `wf-run-1791525760323-2aec5f41` is the prose-report case that `ce880fbed` already fixed.

The reviewer saw the field and did not flag it. `reviewer/2/.../report-1.md:15` reads "nonempty missingExpertise array ... verified". Reviewers check content, not the spelling the downstream gate needs, so review does not catch this.

Verdict: the prompt is too vague. The check is strict by design, but a pure key-spelling mismatch is a poor reason to burn an owner round.

## Shape 1: stray `+`

What the agent wrote. `.fgos/assignments/unit-run-1791777241630-95fe4d34/red-team/1/runs/01/outbox/result-1.json` begins with a single `+` (`+{` then a valid claim). It has exactly one `+`-led line, and stripping the first byte gives valid JSON (verified). The same seat's `outbox/report-1.md` begins `+# Red-team assessment`. The executor is `openai`, gpt-5.6-terra (`unit-summary.json`).

Which check rejected it. `settlement.mjs:520-532`:

```
const parsed = JSON.parse(claimBytes.toString('utf8'));
...
} catch { claimInvalid = true; }
```

`classifyEvidenceToOutcomeFacts` (`settlement.mjs:249-262`) then returns `failed` / `invalid-agent-result-claim` / `disposition: refuse`. The unit outcome is `policy-refusal` (`result.json` outcome `{category: policy, reason: invalid-agent-result-claim}`). The reviewer seat on the same unit passed, so one stray byte cost a whole red-team seat. The report itself was substantive, and `settleReports` still recorded it.

Pattern. Three files, all starting with `+`, all from codex-family executors:
1. `unit-run-1791777241630-95fe4d34/red-team/1` result and report (`openai`).
2. `asgn_lead_claude_code_session_01wf12gbvmr5oq12bbjbyzwq_op_057/runs/01/outbox/report-1.md` (executor `codex-herdr`, 2026-09-10).

It is first-line only. That matches the `+` prefix of patch-style "add file" syntax leaking into the first line, but I did not find the tool call in the log, so the exact mechanism is a hypothesis.

Related slips from the same executor and model: `unit-run-1791608904225-302dca96/red-team/1/.../outbox/result-1.json` ends with a literal backslash-n (`}\n` as two characters; "Extra data: line 99"), and `unit-run-1791629041240-ec070bf6/reviewer/2/.../report-1.md` has literal `\n` escapes throughout. The first of these also ended `invalid-agent-result-claim`. These look like shell-quoting accidents in how the model writes files.

Verdict: model/tool slip, with a validator that gives no hint and no retry. The brief (`brief.mjs:100-135`) says only "Write ... JSON object"; it never says the file must begin with `{` or that nothing else may precede it.

## Shape 3: garbage from glm-5.3 via pi/openrouter

What the agent wrote. Nothing usable. In `unit-run-1791788805773-ab8f9660/panelist-4/1-fb1` and `unit-run-1791787997422-c709e484/synthesizer/1-fb1`, `stdout.log` shows pi streaming a single assistant message. It has `provider: openrouter`, `model: z-ai/glm-5.3`, `stopReason: "stop"`, zero tool events, and a `thinking` block plus a `text` block of noise. Quoted heads:

- `Based41e7 W1 ... View3 Cell2da1 ...`
- `2 AND1y98"). Not5,1.5=9 Homepage1 fs5362 ...`

Input was a normal prompt (977 and 12434 input tokens, with cache reads), so the garbage is generated, not a prompt problem. `worker-output/outbox` is empty: no ack, no report, no result. Pi at `thinkingLevel: "high"` is in the recorded usage.

Which check rejected it. Nothing parsed anything. With exit 0, no claim and no report, `settlement.mjs:361-366` falls through to `completed / no-evidence / inconclusive`. `unit-run-history.mjs:32` maps that to `execution-failure`, and the unit ends `execution-failure` (`unit-summary.json` in both runs). The panel seat was lost, and the step failed ("unit sense-making-panel ended execution-failure", `advance.log`).

Why there was no recovery. In both runs the glm attempt was a fallback (`fb1`) after `xai` grok-4.3 hit `provider-limit` and was last in the candidate pool. And `run.mjs:514` (`if (result.outcome !== 'provider-limit') return result;`) means only a provider limit walks to another candidate. Any other bad outcome returns immediately. No retry, no next candidate, no error feedback.

Reliability numbers (from `unit-summary.json` across `.fgos/assignments`): `glm` z-ai/glm-5.3 has 22 pass, 2 `execution-failure`. Both failures are on 2026-10-12, within 15 minutes of each other (06:53 and 07:06). glm-5.2 is 2 of 2 pass. So this looks like a bad window at the provider, about 8% overall, not a permanent property of the model. `xai` grok-4.3, the primary these seats started on, has 13 `provider-limit` out of 54 attempts, which is why glm is reached at all.

Verdict: model/provider unreliable. No check is too strict; the validator correctly refused to invent evidence.

## Ranked fixes

Ranked by smallest and safest first. "Weakens a check" is called out explicitly.

1. Prompt wording. Name the exact JSON keys in the objective (shape 2) and add one line to the claim instructions (shape 1).
   - Shape 2: in `architecture-advisory.yaml` and `architecture-advisory-reopen.yaml`, give the key set literally, e.g. `Use these exact keys, spelled as shown (do not camelCase them): "missing expertise" (note the space), "attributedFindings"...`. The skill text at `core/skills/fgos-architecture-panel/SKILL.md:71` has the same gap.
   - Shape 1: in `brief.mjs` and `renderAgentResultClaimInstructions`, add "the file must begin with `{`; no prefix such as `+`, no trailing characters, no literal backslash-n".
   - Cost: two text edits plus the usual skill/workflow rebuild. Risk: low. It reduces, not eliminates, the failures; models ignore prompts sometimes.
   - Weakens a check: no.

2. Tolerant key normalisation in the gate read (shape 2 only). In `readMissingExpertise`, normalise the key before lookup (lowercase, strip spaces/underscores/hyphens) so `"missingExpertise"`, `"missing_expertise"`, `"Missing Expertise"` all match.
   - Cost: about 5 lines in `runner.mjs:131` plus one test. Risk: low. It changes no other behaviour: the value must still be an array of non-empty strings (`runner.mjs:163`), JSON still must be raw (no fences, no prose-embedded JSON), and the sibling-file rule is unchanged.
   - Weakens a check: slightly. The key match goes from two literal spellings to any casing/separator variant. This is the third alias requested for the same field, which is the argument for a normaliser over another list entry. The owner should confirm because `runner.md:1432` names the two spellings explicitly.

3. Tolerant read of a leading-junk claim (shape 1). In `settlement.mjs:521-532`, on parse failure, retry the parse once after stripping a leading `+` and trailing literal `\n` characters, then validate as usual. Record `claimNormalized: true` on the claim record and in the confidence basis so it stays visible.
   - Cost: about 10 lines plus tests; also keep the bytes hash computed on the original bytes. Risk: medium. It touches the evidence-settlement path used by every executor.
   - Weakens a check: yes, explicitly. It accepts a file that is not valid JSON as written. A narrower option is to do the same on the producer report read path only. I would not do this before fix 4 exists, because 4 fixes the cause without bending the parser.

4. Retry once with error feedback when a claim is invalid (shape 1, partly shape 3). Today `invalid-agent-result-claim` returns immediately (`run.mjs:514`). Re-dispatch the same seat once with the parse error appended to the brief ("your result-1.json failed: Unexpected token + in JSON at position 0; rewrite it"), keyed on `claimInvalid` only.
   - Cost: medium. It needs a new attempt kind in `run.mjs`, a brief addendum, and tests (the account-rotation retry at `run.mjs:521-526` is the nearest precedent). Risk: medium. It costs one extra model run per failure and must be bounded to one retry.
   - Weakens a check: no. It keeps the validator exactly as is and gives the model a chance to satisfy it.
   - It also covers the literal-`\n` cases. It does not help shape 3 unless the retry also fires for a `no-evidence` outcome with zero tool calls, which is a separate trigger (see fix 5).

5. Per-provider handling for degenerate output (shape 3). Two options.
   - 5a. Treat "exit 0, no ack/report/result, zero tool events, stopReason stop" as a retryable `provider-limit`-class outcome so the existing `nextCandidate` walk (`run.mjs:514-545`) moves on. Cost: medium (outcome classification in `settlement.mjs:361` and the mapping in `unit-run-history.mjs:32`). Risk: medium; it must not reclassify a model that truly found nothing, so key it on "no tool calls and no outbox files".
   - 5b. Exclude or demote `glm` z-ai/glm-5.3 in `.fgos/config.json` (it is last of five in the `marketing:*`, `architecture:*` candidate pools). Cost: config only. Risk: low, but it drops a family from the spread and the failure rate is 2 of 24, both in one window. I would not exclude it permanently on this evidence.
   - Weakens a check: no.

6. Gate-side manual fallback is already there. Today the gate parks and the owner answers by hand. No change needed; it is the safety net, and it worked correctly in the observed case.

## Recommendation

Do fix 1 now (prompt wording naming exact keys and "begin with `{`"). Add fix 2 only if the owner accepts a normalised key match, because `runner.md` fixes the two spellings by name. Then build fix 4 (retry once with the parse error fed back) as the real answer for shape 1 and the escaped-newline cases, because it leaves every validator exactly as strict as today. Treat shape 3 as provider flakiness: do not touch the validator; later add fix 5a if it recurs. Do not exclude glm-5.3 on two failures in one window.

Order of value per cost: 1, then 2, then 4, then 5a. Skip 3 unless 4 is rejected.

## Unresolved questions

- What produced the leading `+`? The three files point at the codex executors' file-writing path, but I did not find the write call in the logs, so it could also be a transport artifact. Worth a look at the raw codex session for `unit-run-1791777241630-95fe4d34/red-team/1` before building fix 3.
- Does the owner accept normalising key spelling (fix 2), given `docs/specs/runner.md:1432` names two literal spellings?
- Should a `no-evidence` outcome with zero tool events count as retryable (fix 5a)? That is a decision about what counts as a model fault versus a legitimate "found nothing".
- Is glm at `thinkingLevel: "high"` through openrouter the trigger? Not checked against the successful glm runs' invocation args.

Status: DONE
Summary: Three distinct causes found and proven from real run files: prompt vagueness plus strict key match (`missingExpertise`), a codex-family file-writing slip with no feedback or retry (`+` prefix), and genuine provider garbage with no retry path for non-provider-limit failures (glm-5.3). Recommendation is prompt wording first, then retry-once-with-error-feedback, with an optional normalised key match that needs owner sign-off.
