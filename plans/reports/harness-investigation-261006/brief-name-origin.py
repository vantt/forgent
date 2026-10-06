"""For each top-level plans/reports file added in ISO week 41 (2026-10-05..), find whether
its exact basename was dictated earlier by (a) an Agent/Task brief, (b) a dispatch command,
(c) a user-typed message, (d) an assistant text turn (lead habit), in any forgentX transcript.
Read-only. Usage: python3 brief-name-origin.py
"""
import json, glob, os, subprocess, datetime

REPO = '/home/vantt/projects/forgentX'
ROOT = os.path.expanduser('~/.claude/projects/-home-vantt-projects-forgentX')

out = subprocess.run(['git', '-C', REPO, 'log', '--diff-filter=A', '--name-only', '--format=@%cI',
                      '--', 'plans/reports/'], capture_output=True, text=True).stdout
first, d = {}, None
for l in out.splitlines():
    if l.startswith('@'):
        d = l[1:]
    elif l.strip():
        first[l] = d
w41 = {os.path.basename(f): d for f, d in first.items()
       if f.count('/') == 2 and datetime.datetime.fromisoformat(d).isocalendar()[1] == 41}

hits = {b: [] for b in w41}
for path in glob.glob(ROOT + '/*.jsonl') + glob.glob(ROOT + '/*/subagents/*.jsonl'):
    if os.path.getmtime(path) < datetime.datetime(2026, 10, 4).timestamp():
        continue
    is_sub = '/subagents/' in path
    with open(path, errors='replace') as fh:
        for line in fh:
            if not any(b in line for b in w41):
                continue
            try:
                o = json.loads(line)
            except Exception:
                continue
            ts = o.get('timestamp', '')
            msg = o.get('message') or {}
            role = msg.get('role') or o.get('type')
            content = msg.get('content')
            items = [{'type': 'text', 'text': content}] if isinstance(content, str) else (content or [])
            for c in items:
                if not isinstance(c, dict):
                    continue
                kind, text = None, ''
                if c.get('type') == 'tool_use':
                    inp = c.get('input') or {}
                    if c.get('name') in ('Agent', 'Task'):
                        kind, text = 'agent-brief', inp.get('prompt', '')
                    elif c.get('name') == 'Bash' and 'dispatch execute' in inp.get('command', ''):
                        kind, text = 'dispatch-brief', inp.get('command', '')
                    elif c.get('name') in ('Write',):
                        kind, text = 'write', inp.get('file_path', '')
                elif c.get('type') == 'text' and role == 'user' and not is_sub and not o.get('isMeta'):
                    kind, text = 'user-msg', c.get('text', '')
                elif c.get('type') == 'text' and role == 'user' and is_sub:
                    kind, text = 'subagent-initial-prompt', c.get('text', '')
                elif c.get('type') == 'text' and role == 'assistant':
                    kind, text = 'assistant-text', c.get('text', '')
                if not kind:
                    continue
                for b in w41:
                    if b in text:
                        hits[b].append((ts[:16], kind, os.path.basename(path)[:12]))

for b, d in sorted(w41.items(), key=lambda x: x[1]):
    h = sorted(hits[b])
    pre = [x for x in h if x[1] != 'write']
    first_dictation = pre[0] if pre else None
    first_write = next((x for x in h if x[1] == 'write'), None)
    print('\t'.join([d[:16], b, 'dictated:' + (first_dictation[1] + '@' + first_dictation[0] + '@' + first_dictation[2] if first_dictation else 'none'),
                     'write:' + (first_write[0] if first_write else 'none')]))
