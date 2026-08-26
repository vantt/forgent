// dispatch/result-ladder.mjs (extract-dispatch-result-normalization-ladder):
// the result-assembly step of `executeExecutorCli` (`cli.mjs`), extracted
// into its own pure helper -- pure move, no behavior change. Applies the
// current confidence ladder to the raw adapter `result` and returns the
// final object every out-of-process `execute` call hands back:
//
// 1. reported -- whatever the adapter's own `result` already carries
//    (`status`, `signal`, `stdout`, `stderr`, ...), spread in unchanged.
// 2. legacy-signal -- the worker's own `[DONE]`/`[BLOCKED]` token in
//    `stdout`, backtick-quoted spans stripped first so a quoted/paraphrased
//    mention in prose never counts as a real signal (tsk-5gd).
// 3. inferred -- when neither token is present, `outcome: 'unsignaled'`
//    plus the git head before/after the dispatch, letting the caller infer
//    completion from whether the branch actually advanced.
//
// No `confidence` field is added here: the ladder above describes the
// EXISTING three-way behavior, not a new output shape -- nothing downstream
// reads such a field yet (see the item's own Description).

/** Strip backtick-quoted spans before scanning stdout for [DONE]/[BLOCKED]
 * (tsk-5gd) -- a quoted/paraphrased mention in prose must never be treated
 * as the worker's own real signal. */
function stripBacktickQuoted(stdout) {
  return stdout.replace(/`+[\s\S]*?`+/g, '');
}

/**
 * Build the final result object for one out-of-process `execute` dispatch.
 *
 * `result` is the raw adapter return value (`{status,signal,stdout,stderr,...}`
 * from `cliSpawnAdapter`/`herdrSpawn`, etc.) -- its own fields are spread in
 * unchanged and always win the "reported" rung. `headBefore`/`headAfter`
 * are the git HEAD sha captured immediately before/after the adapter call
 * (`captureHeadSha`); `lostUncommittedPaths`, `provider`, and `command` are
 * additive fields the caller already computed. Herdr's own internal
 * completion sentinel (`__fgos_herdr_exit_*`, `transport.mjs`) is a
 * separate, adapter-level mechanism already resolved by the time `result`
 * reaches here -- it never appears in `result.stdout` and this ladder never
 * needs to know about it.
 */
export function buildDispatchResult({ mechanism, result, headBefore, headAfter, lostUncommittedPaths, provider, command }) {
  const stdoutStr = result && typeof result.stdout === 'string' ? result.stdout : '';
  const cleanStdout = stripBacktickQuoted(stdoutStr);
  const hasSignal = cleanStdout.includes('[DONE]') || cleanStdout.includes('[BLOCKED]');
  const isDone = cleanStdout.includes('[DONE]');
  return {
    mechanism,
    ...result,
    ...(hasSignal ? {} : { outcome: 'unsignaled', headBefore, headAfter }),
    ...(isDone && headAfter ? { verifiedSha: headAfter } : {}),
    ...(lostUncommittedPaths ? { lostUncommittedPaths } : {}),
    provider,
    command,
  };
}
