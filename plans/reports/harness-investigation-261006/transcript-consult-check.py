#!/usr/bin/env python3
"""From session transcripts (~/.claude/projects/-home-vantt-projects-forgentX*): per session, did the agent Read a placement/registry doc
(reading-map, doc-governance, doc-registry, docs/README) BEFORE its first Write of a NEW .md file? Only counts + path shapes are emitted (no content)."""
import json,glob,os,re,collections,sys
base=os.path.expanduser('~/.claude/projects')
dirs=[d for d in glob.glob(base+'/-home-vantt-projects-forgentX*')]
CONSULT=re.compile(sys.argv[1] if len(sys.argv)>1 else r'(reading-map|doc-governance|doc-registry|docs/README\.md)')
stats=collections.Counter(); wr=collections.Counter(); ex=[]
for d in dirs:
  for f in glob.glob(d+'/**/*.jsonl',recursive=True):
    consulted=False; wrote=False; first_write=None; sess_writes=0
    try:
      for line in open(f,errors='ignore'):
        if '"tool_use"' not in line: continue
        try: o=json.loads(line)
        except Exception: continue
        msg=o.get('message') or {}
        c=msg.get('content')
        if not isinstance(c,list): continue
        for b in c:
            if not isinstance(b,dict) or b.get('type')!='tool_use': continue
            nm=b.get('name'); inp=b.get('input') or {}
            fp=inp.get('file_path') or inp.get('path') or ''
            cmd=inp.get('command') or ''
            if nm=='Read' and CONSULT.search(fp): consulted=True
            if nm=='Bash' and re.search(r'(cat|head|sed|less|bat)\s+[^|;]*'+CONSULT.pattern,cmd): consulted=True
            if nm=='Write' and fp.endswith('.md') and re.search(r'/projects/forgentX[^/]*/(plans|docs)/',fp) :
                rel=re.sub(r'^.*?/projects/forgentX[^/]*/','',fp)
                sess_writes+=1; wr[(rel.split('/')[0]+'/'+rel.split('/')[1]) if rel.count('/')>1 else rel]+=1
                if not wrote: wrote=True; first_write=consulted
    except Exception as e: pass
    stats['sessions']+=1
    if wrote:
        stats['sessions_writing_plans_docs_md']+=1
        stats['  ...of which consulted placement/registry doc before first write' if first_write else '  ...of which did NOT consult before first write']+=1
    if consulted: stats['sessions_that_ever_read_placement_doc']+=1
for k,v in stats.items(): print(f'{v:6} {k}')
print('Write .md targets (plans|docs second-level):')
for k,v in wr.most_common(15): print(f'  {v:5} {k}')
