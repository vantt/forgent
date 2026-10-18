// The agent of the terminal-mode tests: a process the gate starts in a pane. It records who it is
// (pid, the environment variables the identity rule reads, its argv) next to the test's own files and
// then stays alive until the test lets it end by creating `exit-now`.
import fs from 'node:fs';
import path from 'node:path';

const dir = process.env.TERMINAL_AGENT_DIR;
fs.appendFileSync(path.join(dir, 'agent-starts.txt'), `${process.pid}\n`);
fs.writeFileSync(path.join(dir, 'agent-env.json'), JSON.stringify({
  argv: process.argv.slice(2),
  cwd: process.cwd(),
  env: Object.fromEntries(['FGOS_SESSION_ID', 'FGOS_PARENT_WRITER_ID', 'CLAUDE_CODE_SESSION_ID', 'CODEX_THREAD_ID', 'HOME'].map((name) => [name, process.env[name] ?? null])),
}));

const exitFile = path.join(dir, 'exit-now');
const timer = setInterval(() => {
  if (fs.existsSync(exitFile)) { clearInterval(timer); process.exit(0); }
}, 25);
