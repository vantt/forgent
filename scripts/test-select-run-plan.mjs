import fs from 'node:fs';
import path from 'node:path';
import { runSelectedTests } from './run-tests.mjs';

const planFile = process.argv[2] === '--files-from' ? process.argv[3] : null;
if (!planFile) {
  console.error('Usage: test-select-run-plan.mjs --files-from <plan.json>');
  process.exit(1);
}

let plan;
try {
  plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
} catch (err) {
  console.error(`Failed to read plan: ${err.message}`);
  process.exit(1);
}

if (plan.decision !== 'related') {
  console.log(`Plan decision is '${plan.decision}', nothing for related job to do.`);
  process.exit(0);
}

const absSelected = plan.selectedFiles.map(f => path.resolve(process.cwd(), f));
if (absSelected.length === 0) {
  console.log('No files selected in related plan.');
  process.exit(0);
}

const forwardedArgs = process.argv.slice(4);
const result = runSelectedTests(absSelected, { forwardedArgs, stdio: 'inherit' });
process.exitCode = result.status;
