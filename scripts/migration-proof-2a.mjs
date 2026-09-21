import fs from 'node:fs';
import path from 'node:path';
import { evaluateSessionQuorum } from '../src/runner/coordination/session-engine.mjs';

const SESSIONS_DIR = path.join(process.cwd(), '.fgos', 'coordination', 'sessions');

function runMigrationProof() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    console.log(`Directory not found: ${SESSIONS_DIR}`);
    return;
  }
  
  const sessionIds = fs.readdirSync(SESSIONS_DIR).filter(name => !name.startsWith('.'));
  let checked = 0;
  let dispositionCount = 0;
  let matches = 0;
  let mismatch = 0;

  console.log(`Found ${sessionIds.length} sessions to replay.`);

  for (const id of sessionIds) {
    const eventsPath = path.join(SESSIONS_DIR, id, 'events.jsonl');
    if (!fs.existsSync(eventsPath)) continue;

    const events = fs.readFileSync(eventsPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));

    const hasDisposition = events.some(e => e.type === 'driver-disposition-recorded');
    if (hasDisposition) {
      dispositionCount++;
      
      try {
        const quorum = evaluateSessionQuorum(id);
        checked++;
      } catch (err) {
        console.error(`Failed on session ${id}: ${err.message}`);
        mismatch++;
      }
    }
  }

  console.log(`\nResults:`);
  console.log(`Sessions with disposition: ${dispositionCount}`);
  console.log(`Rebuilt successfully: ${checked}`);
  console.log(`Mismatches/Crashes: ${mismatch}`);
}

runMigrationProof();
