// git-spawn-match.mjs -- the one matcher the one-door gate shares (Git spec §12): the static scan
// (scripts/git-one-door-scan.mjs), the runtime spy (test/helpers/git-spawn-spy.mjs) and the sandbox
// door (scripts/lib/sandbox-git.mjs) all decide "does this run Git?" and "is this the sandbox door?"
// here, so the three can never disagree.

/** The spawn-option key the sandbox door sets to its sandbox root; nothing else may set it. */
export const SANDBOX_DOOR = Symbol.for('fgos.git.sandbox-door');

/** Whether a shell command string runs `git` or a repository hook at a command position. */
export function shellRunsGit(text) {
  return /(^|[;&|(`\n]|\$\(|\bthen\b|\bdo\b|\bexec\b|\bxargs\b|\benv\b)\s*(?:[A-Z_]+=\S*\s+)*(?:command\s+)?(?:\S*\/)?git(?:\.exe)?(?=\s|$|['"`;)])/.test(text)
    || /(^|\s|\/)\.githooks\/|\/hooks\/(pre-commit|commit-msg|pre-push)\b/.test(text);
}
