// agent-skill-dirs.mjs -- where each agent CLI reads project skills from, keyed by the
// invocation's command name. The one list: the executor-skills doctor row and worktree
// provisioning both read it, so a CLI is added here once.
export const AGENT_SKILL_DIRS = Object.freeze({
  claude: '.claude/skills',
  codex: '.agents/skills',
  omp: '.omp/skills',
  pi: '.pi/skills',
  grok: '.grok/skills',
});
