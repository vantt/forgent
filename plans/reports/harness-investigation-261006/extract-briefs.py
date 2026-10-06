"""Extract task briefs handed to agents from Claude Code transcripts (read-only).

Sources per main transcript (and its subagents/*.jsonl):
  - Agent/Task tool_use `prompt` inputs (in-process subagent briefs)
  - Bash tool_use commands that contain `dispatch execute` (out-of-process briefs)
Usage: python3 extract-briefs.py [since-iso-date] > out.tsv
Prints: ts \t session \t kind \t chars \t first-120-chars (newlines collapsed)
With env DUMP=<n> prints the full text of brief #n instead.
"""
import json, glob, os, sys, re

ROOT = os.path.expanduser('~/.claude/projects/-home-vantt-projects-forgentX')
since = sys.argv[1] if len(sys.argv) > 1 else '2026-09-25'
rows = []
for path in sorted(glob.glob(ROOT + '/*.jsonl') + glob.glob(ROOT + '/*/subagents/*.jsonl')):
    try:
        if os.path.getmtime(path) < 0:
            continue
    except OSError:
        continue
    sess = path.replace(ROOT + '/', '')[:60]
    with open(path, errors='replace') as fh:
        for line in fh:
            if '"tool_use"' not in line:
                continue
            try:
                o = json.loads(line)
            except Exception:
                continue
            ts = o.get('timestamp', '')
            if ts < since:
                continue
            msg = o.get('message') or {}
            for c in msg.get('content') or []:
                if not isinstance(c, dict) or c.get('type') != 'tool_use':
                    continue
                name, inp = c.get('name'), c.get('input') or {}
                if name in ('Agent', 'Task') and inp.get('prompt'):
                    rows.append((ts, sess, 'agent:' + str(inp.get('subagent_type', '')), inp['prompt']))
                elif name == 'Bash' and 'dispatch execute' in (inp.get('command') or ''):
                    rows.append((ts, sess, 'dispatch', inp['command']))
rows.sort()
dump = os.environ.get('DUMP')
for i, (ts, sess, kind, text) in enumerate(rows):
    if dump is not None:
        if i == int(dump):
            print(text)
        continue
    head = re.sub(r'\s+', ' ', text)[:120]
    print('\t'.join([str(i), ts[:16], sess, kind, str(len(text)), head]))
