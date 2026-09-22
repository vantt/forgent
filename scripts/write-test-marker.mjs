import fs from 'node:fs';
import path from 'node:path';

function countXmlCases(xmlPath) {
  if (!fs.existsSync(xmlPath)) return 0;
  const content = fs.readFileSync(xmlPath, 'utf8');
  // Simple regex to count testcases
  const matches = content.match(/<testcase\b/g);
  return matches ? matches.length : 0;
}

const args = process.argv.slice(2);
let runType = 'full';
let xmlPath = 'test-results/full.xml';
let planPath = null;
let exitCode = 0;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--type') runType = args[++i];
  if (args[i] === '--xml') xmlPath = args[++i];
  if (args[i] === '--plan') planPath = args[++i];
  if (args[i] === '--exit-code') exitCode = parseInt(args[++i], 10);
}

const outDir = 'test-results';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

let plannedFiles = 0;
if (planPath && fs.existsSync(planPath)) {
  try {
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    if (plan.selectedFiles) plannedFiles = plan.selectedFiles.length;
  } catch (e) {}
}

const reportedCases = countXmlCases(xmlPath);
// job status might be passed via env
const jobStatus = process.env.JOB_STATUS || 'unknown';
const completed = jobStatus !== 'cancelled';

const marker = {
  sha: process.env.GITHUB_SHA || 'unknown',
  runType,
  os: process.platform,
  node: process.version,
  plannedFiles,
  reportedCases,
  exitCode,
  completed,
  timestamp: new Date().toISOString()
};

fs.writeFileSync(path.join(outDir, 'test-marker.json'), JSON.stringify(marker, null, 2));
console.log(`Wrote test-marker.json for runType: ${marker.runType}`);
