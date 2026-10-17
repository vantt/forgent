// A chatty agent for the direct-mode crash matrix. It behaves like a CLI agent: writes stdout without
// pause, leaves a `setsid` grandchild behind, records which descriptors it holds, and ends by writing
// its result claim. Everything it leaves for the test goes into the outbox, the one directory the
// sandbox lets it write that the test can read. Options arrive as JSON in AGENT_OPTS:
//   runMs, grandchildToken, ignoreSigterm, writeFile (a file written into the working directory)
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const opts = JSON.parse(process.env.AGENT_OPTS ?? '{}');
const prompt = process.argv.slice(2).join(' ');
const match = /Write structured JSON to (\S+agent-result\.json)/.exec(prompt);
const claimDir = match ? path.dirname(match[1]) : process.cwd();
const outbox = path.join(claimDir, 'worker-output', 'outbox');
const dir = fs.existsSync(outbox) ? outbox : claimDir;

if (opts.ignoreSigterm) process.on('SIGTERM', () => {});

fs.appendFileSync(path.join(dir, 'agent-starts.txt'), `${process.pid}\n`);

const descriptors = (pid) => {
  const found = [];
  for (const entry of fs.readdirSync(`/proc/${pid}/fd`)) {
    try { found.push(fs.readlinkSync(`/proc/${pid}/fd/${entry}`)); } catch { /* closed meanwhile */ }
  }
  return found;
};
fs.writeFileSync(path.join(dir, 'agent-fds.txt'), `${descriptors(process.pid).join('\n')}\n`);

if (opts.writeFile) fs.writeFileSync(path.join(process.cwd(), opts.writeFile), 'written by the agent\n');

if (opts.grandchildToken) {
  // A grandchild in its own session that lists its own descriptors, then sleeps.
  const script = `for f in /proc/$$/fd/*; do readlink "$f"; done > "${path.join(dir, 'grandchild-fds.txt')}"; exec sleep 600`;
  const grandchild = spawn('setsid', ['sh', '-c', script, opts.grandchildToken], { stdio: 'ignore', detached: true });
  grandchild.unref();
}

const started = Date.now();
const chatter = setInterval(() => process.stdout.write(`tick ${Date.now() - started}\n`), 20);

setTimeout(() => {
  clearInterval(chatter);
  fs.writeFileSync(path.join(dir, 'agent-report.md'), '# Report\nThe assigned work was carried out and verified in full.\n');
  fs.writeFileSync(path.join(dir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'The assigned work was carried out and verified in full.', assessment: { verdict: 'pass' } }));
  process.exit(0);
}, opts.runMs ?? 1500);
