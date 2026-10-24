import './process-tmp-root.mjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { SCHEMA_VERSION } from '../../src/state/work.mjs';
export function appendEvent(file, { type, payload = null }) {
  const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const events = raw.trim().split('\n').filter(Boolean).map(JSON.parse);
  const event = { seq: (events.at(-1)?.seq ?? 0) + 1, ts: new Date().toISOString(), type, payload, v: SCHEMA_VERSION, src: 'legacy-fixture' };
  event.h = crypto.createHash('sha256').update(JSON.stringify(event)).digest('hex').slice(0, 16);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(event) + '\n');
  return event;
}
