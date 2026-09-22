import fs from 'node:fs';

const outDir = 'test-results';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const marker = {
  sha: process.env.GITHUB_SHA || 'unknown',
  runType: process.argv[2] || 'full', // 'full' or 'related'
  timestamp: new Date().toISOString()
};

fs.writeFileSync(`${outDir}/test-marker.json`, JSON.stringify(marker, null, 2));
console.log(`Wrote test-marker.json for runType: ${marker.runType}`);
