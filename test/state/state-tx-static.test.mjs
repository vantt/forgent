// Static check of the critical-section rule: a callback handed to a state
// transaction is synchronous, so nothing in it can await.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('no source file under src/ or scripts/ passes an async callback to a state transaction or awaits inside one', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const offenders = [];
  const visit = (rel) => {
    for (const entry of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
      const next = path.join(rel, entry.name);
      if (entry.isDirectory()) visit(next);
      else if (entry.name.endsWith('.mjs')) {
        const text = fs.readFileSync(path.join(root, next), 'utf8');
        if (/(?:withStateTx|withMainState)\([^,]+,\s*async\b/.test(text)) offenders.push(`${next}: async callback`);
        for (const match of text.matchAll(/(?:withStateTx|withMainState|withStateAndRefresh)\((?:[^()]|\([^()]*\))*?(?:\(tx\)|\(\))\s*=>\s*\{/g)) {
          const start = match.index + match[0].length;
          let depth = 1;
          let i = start;
          while (i < text.length && depth > 0) {
            if (text[i] === '{') depth += 1;
            else if (text[i] === '}') depth -= 1;
            i += 1;
          }
          if (/\bawait\b/.test(text.slice(start, i))) offenders.push(`${next}: await inside a transaction`);
        }
      }
    }
  };
  visit('src');
  visit('scripts');
  assert.deepEqual(offenders, []);
});
