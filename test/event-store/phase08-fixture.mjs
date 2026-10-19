import fs from 'node:fs';
import path from 'node:path';
const ts = '2026-01-01T00:00:00.000Z';
export function trackedLegacy(f, { porting = true, shards = true } = {}) {
  const files = {
    '.fgos/events.jsonl': JSON.stringify({ ts, type: 'work.add', payload: { id: 'one', title: 'original' }, v: 3 }) + '\n',
    '.fgos/state.json': '{}\n', '.fgos/events.jsonl.backup-one': 'historical backup\n',
    '.fgos/events.jsonl.backup-two': 'other backup\n', '.gitattributes': '*.txt text\n.fgos/events*.jsonl merge=union\n',
  };
  if (shards) files['.fgos/events/a.jsonl'] = JSON.stringify({ ts, seq: 2, type: 'work.edit', payload: { id: 'one', patch: { title: 'updated' } }, v: 4 }) + '\n';
  if (porting) {
    files['docs/distillery/state/porting/events.jsonl'] = JSON.stringify({ ts, type: 'porting.add', payload: { id: 'port', status: 'todo' } }) + '\n';
    files['docs/distillery/state/porting/state.json'] = '{}\n';
  }
  for (const [p, bytes] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(f.repo, p)), { recursive: true }); fs.writeFileSync(path.join(f.repo, p), bytes); }
  f.git('add', ...Object.keys(files)); f.git('commit', '-qm', 'tracked legacy fixture');
  return files;
}
