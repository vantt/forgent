#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

/**
 * Creates an executable shell wrapper script containing the specified command.
 *
 * @param {Object} options
 * @param {string} options.command - The shell command string to wrap.
 * @param {string} [options.dir=process.cwd()] - Target directory to write the file into.
 * @param {string} [options.name] - Base name for the script (e.g. 'run-verify' or 'run-verify.sh').
 * @returns {string} Absolute path to the created wrapper script.
 */
export function writeWrapperScript({ command, dir = process.cwd(), name }) {
  if (!command || typeof command !== 'string') {
    throw new Error('Missing or invalid required argument: --command');
  }

  const targetDir = path.resolve(dir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let filename = name;
  if (!filename) {
    const randomHex = crypto.randomBytes(4).toString('hex');
    filename = `wrapper-${randomHex}.sh`;
  } else if (!filename.endsWith('.sh')) {
    filename = `${filename}.sh`;
  }

  const filePath = path.join(targetDir, filename);
  const content = `#!/bin/sh\nset -eu\n${command}\n`;

  fs.writeFileSync(filePath, content, { mode: 0o755 });
  fs.chmodSync(filePath, 0o755);

  return filePath;
}

export function runCli(argv = process.argv.slice(2), cwd = process.cwd()) {
  const options = {
    command: { type: 'string' },
    dir: { type: 'string' },
    name: { type: 'string' },
  };

  const { values } = parseArgs({ args: argv, options, allowPositionals: false });

  const filePath = writeWrapperScript({
    command: values.command,
    dir: values.dir || cwd,
    name: values.name,
  });

  process.stdout.write(`${filePath}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    runCli();
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
