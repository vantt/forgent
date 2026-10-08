import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { governanceBaselineFields, headerFields } from '../../../../scripts/check-doc-constitution.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const options = {};
for (let index = 2; index < process.argv.length; index += 2) {
  const flag = process.argv[index];
  if (!['--before', '--after', '--files'].includes(flag) || !process.argv[index + 1]) {
    throw new Error('Usage: node verify-header-only-changes.mjs --before <commit> --after <commit|WORKTREE> --files <input.json>');
  }
  options[flag.slice(2)] = process.argv[index + 1];
}
if (!/^[0-9a-f]{40}$/.test(options.before || '') || !(/^[0-9a-f]{40}$/.test(options.after || '') || options.after === 'WORKTREE') || !options.files) {
  throw new Error('Explicit before/after pins and file scope are required');
}
const scope = JSON.parse(fs.readFileSync(path.resolve(repoRoot, options.files), 'utf8'));
const required = [...governanceBaselineFields(repoRoot), 'Supersedes', 'Superseded by'];
if (required.length < 3) throw new Error('Governance metadata baseline is unavailable');

function readPinned(commit, file) {
  if (commit === 'WORKTREE') return fs.readFileSync(path.resolve(repoRoot, file));
  const result = spawnSync('git', ['show', `${commit}:${file}`], { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr.toString('utf8'));
  return result.stdout;
}

function withoutInitialHeader(bytes) {
  const text = bytes.toString('utf8');
  const match = /^# .+\r?\n(?:[ \t]*\r?\n)*(```txt\r?\n[\s\S]*?\r?\n```\r?\n)/m.exec(text);
  if (!match || !/^Document type:/m.test(match[1])) return bytes;
  const start = match.index + match[0].length - match[1].length;
  const firstByte = Buffer.byteLength(text.slice(0, start));
  const lastByte = Buffer.byteLength(text.slice(0, start + match[1].length));
  return Buffer.concat([bytes.subarray(0, firstByte), bytes.subarray(lastByte)]);
}

function digest(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

const files = scope.targets.map((file) => {
  if (!file.startsWith('docs/platform/agent-coordination/')) throw new Error(`Out-of-scope target: ${file}`);
  const before = readPinned(options.before, file);
  const after = readPinned(options.after, file);
  const markdown = file.endsWith('.md');
  const oldBody = markdown ? withoutInitialHeader(before) : before;
  const newBody = markdown ? withoutInitialHeader(after) : after;
  const fields = markdown ? headerFields(after.toString('utf8')) : null;
  return {
    path: file,
    markdown,
    bodyIdentical: oldBody.equals(newBody),
    missingFields: markdown ? required.filter((field) => !fields?.has(field)) : [],
    beforeSha256: digest(before),
    afterSha256: digest(after),
    bodySha256: digest(newBody),
  };
});
const failed = files.filter((file) => !file.bodyIdentical || file.missingFields.length > 0);
console.log(JSON.stringify({ before: options.before, after: options.after, files: files.length, markdown: files.filter((file) => file.markdown).length, failed: failed.length, results: files }, null, 2));
process.exitCode = failed.length ? 1 : 0;
