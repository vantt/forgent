#!/usr/bin/env python3
"""Backticked path-like tokens in the always-loaded / navigation docs that do not exist on disk (plain existence; globs, <placeholders>, flags, and CLI snippets skipped)."""
import re,os,sys
R='/home/vantt/projects/forgentX/'
docs=['AGENTS.md','CLAUDE.md','docs/specs/reading-map.md','docs/reading-map.md','docs/README.md','docs/doc-governance.md','domains/coding/AGENTS.md','README.md']
for d in docs:
    t=open(R+d).read(); toks=set(re.findall(r'`([A-Za-z0-9_.][A-Za-z0-9_./-]*\.[a-z]{1,5}|[A-Za-z0-9_.][A-Za-z0-9_-]*/[A-Za-z0-9_./-]*)`',t))
    tot=0; dead=[]
    for k in sorted(toks):
        if '<' in k or '*' in k or k.startswith(('http','~','.fgos/')) or ' ' in k or '/' not in k and '.' not in k: continue
        if not ('/' in k): continue
        tot+=1
        base=os.path.dirname(R+d)
        if not (os.path.exists(R+k) or os.path.exists(os.path.join(base,k))): dead.append(k)
    print(f'{d}: {len(dead)}/{tot} path tokens missing', dead[:8])
