// verify-pattern-check.mjs — mechanical-only replacement for the retired
// judgeVerifySemanticCorrectness LLM second-pass (tsk-1x3 D17,
// docs/history/fanout-and-delegation-rubric/CONTEXT.md). The old function
// (judge-executor.mjs) ran unconditionally on every accepted verdict —
// caller-supplied ones included — via a mechanical branch
// (matchesKnownBadVerifyPattern, no subprocess) and an LLM-fallback branch
// (runJudgeExecutor). D9 retires runJudgeExecutor's every consumer; the
// mechanical branch survives here because it never needed a subprocess in
// the first place.
//
// Real cost, stated once here rather than left implicit: this file does
// NOT catch the class of defect the old LLM branch caught twice, live,
// during tsk-5kn's own clarify pass — a verify that is syntactically fine
// shell but targets the wrong claim. That responsibility now belongs to
// whichever skill calls `fgos discover`/`fgos decompose`, backed by
// `fgos-coding-validating`'s own reality-gate discipline (the same mechanism that
// caught both live disputes and this exact finding).

// tsk-12t D1/D2/D4: mechanical pre-check for the documented `node --test`/
// `--test-name-pattern` reporter-format trap
// (docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md) --
// Node's default reporter never prints a TAP-style `# pass`/`# fail` line,
// so a verify grepping for that shape can never correctly detect pass/fail
// regardless of what the tested code does. Gated on BOTH the wrong-reporter
// grep shape AND a reference to `node --test`/`--test-name-pattern` (D2) —
// scoped to the how-to doc's own documented trap, not a bare ban on any
// TAP-style text.
const KNOWN_BAD_VERIFY_PATTERN_DOC = 'docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md';
const NODE_TEST_REFERENCE_RE = /node\s+--test\b|--test-name-pattern\b/;
const WRONG_REPORTER_GREP_RE = /\^#\s*(pass|fail)\b/;

function matchesKnownBadVerifyPattern(proposedVerify) {
  return (
    typeof proposedVerify === 'string' &&
    NODE_TEST_REFERENCE_RE.test(proposedVerify) &&
    WRONG_REPORTER_GREP_RE.test(proposedVerify)
  );
}

/**
 * Mechanical-only check on a proposed `verify` string. Always returns
 * `{agrees: boolean, reason?: string, mechanical?: true}` and never throws.
 * `mechanical: true` marks a disagreement as a syntactic fact, not a
 * judgement call (tsk-12t D1/D3) — callers that honor a `--force` override
 * elsewhere must still refuse to let it override a mechanical disagreement.
 */
export function judgeVerifySemanticCorrectness(proposedVerify) {
  if (matchesKnownBadVerifyPattern(proposedVerify)) {
    return {
      agrees: false,
      mechanical: true,
      reason:
        `Verify dùng "node --test"/"--test-name-pattern" nhưng grep theo dòng TAP kiểu ` +
        `"^# pass"/"^# fail" — reporter mặc định của Node KHÔNG BAO GIỜ in dòng này ` +
        `(xem ${KNOWN_BAD_VERIFY_PATTERN_DOC}). Sửa lại theo cách doc đó hướng dẫn: grep ` +
        `dòng checkmark kèm mô tả test cụ thể, không dựa vào số đếm pass/fail gộp.`,
    };
  }
  return { agrees: true };
}
