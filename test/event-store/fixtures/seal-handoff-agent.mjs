// A confined agent that drives one real CLI Work command (AGENT_OPTS: { bin, repo, args, env }) and records what it saw
// in the outbox, the one directory the sandbox lets it write that the test can read. It then writes its result claim
// and exits, so the attempt ends while the command's seal child may still be alive.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const { bin, repo, args, env = {} } = JSON.parse(process.env.AGENT_OPTS ?? '{}');
const prompt = process.argv.slice(2).join(' ');
const match = /Write structured JSON to (\S+agent-result\.json)/.exec(prompt);
const claimDir = match ? path.dirname(match[1]) : process.cwd();
const outbox = path.join(claimDir, 'worker-output', 'outbox');
const dir = fs.existsSync(outbox) ? outbox : claimDir;

const command = spawnSync(process.execPath, [bin, ...args, '--dir', repo], { cwd: repo, encoding: 'utf8', env: { ...process.env, ...env } });
fs.writeFileSync(path.join(dir, 'command.json'), JSON.stringify({ status: command.status, stdout: command.stdout.slice(0, 2000), stderr: command.stderr.slice(0, 2000) }));
fs.writeFileSync(path.join(dir, 'agent-report.md'), '# Report\nThe assigned work was carried out and verified in full.\n');
fs.writeFileSync(path.join(dir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'The assigned work was carried out and verified in full.', assessment: { verdict: 'pass' } }));
