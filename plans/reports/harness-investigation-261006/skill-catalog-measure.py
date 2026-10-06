#!/usr/bin/env python3
"""Read-only measurement of skill catalogs. Usage: python3 skill-catalog-measure.py"""
import os, re, glob, hashlib, itertools, json, collections
R='/home/vantt/projects/forgentX'
trees={'claude':R+'/.claude/skills','plugin':R+'/plugins/fgOS/skills','agents':R+'/.agents/skills','core':R+'/core/skills','domains':R+'/domains/coding/skills','user':os.path.expanduser('~/.claude/skills')}
def fm(path):
    t=open(path,errors='ignore').read()
    m=re.match(r'---\n(.*?)\n---',t,re.S)
    name=desc=None
    if m:
        b=m.group(1)
        n=re.search(r'^name:\s*(.+)$',b,re.M); name=n.group(1).strip() if n else None
        d=re.search(r'^description:\s*(>-?|\|-?)?\s*\n?((?:.|\n)*?)(?=\n[a-zA-Z_-]+:|\Z)',b,re.M)
        if d: desc=' '.join(d.group(2).split()).strip('"\'')
    return name,desc,len(t)
data={}
for k,p in trees.items():
    for d in sorted(os.listdir(p)):
        f=os.path.join(p,d,'SKILL.md')
        if os.path.isfile(f):
            n,desc,sz=fm(f); data.setdefault(k,{})[d]=dict(name=n,desc=desc or '',size=sz)
for k,v in data.items():
    chars=sum(len(x['desc'])+len(x['name'] or '') for x in v.values())
    print(f'{k}: {len(v)} skills, desc+name chars={chars}, ~tokens={chars//4}, no-desc={sum(1 for x in v.values() if not x["desc"])}')
# name families in .claude/skills
c=collections.Counter(re.match(r'(ak|fgos|gitnexus)',d).group(1) if re.match(r'(ak|fgos|gitnexus)',d) else 'other' for d in data['claude'])
print('claude families',c)
# overlap ak-X vs user-level X (ck:) 
ak={d[3:] for d in data['claude'] if d.startswith('ak-')}
user={d for d in data['user']}
user_ck={d[3:] if d.startswith('ck-') else d for d in user}
print('ak-X with unprefixed twin in ~/.claude/skills:',len(ak&user_ck),'of',len(ak))
print('ak-only (no twin):',sorted(ak-user_ck))
print('user-only:',sorted(user_ck-ak))
# content identical across trees for fgos skills
def h(p): return hashlib.md5(open(p,'rb').read()).hexdigest()
print('\nfgos skill identity across trees (SKILL.md md5 equal to canonical source):')
src={}
for d in data['core']: src[d]=trees['core']+'/'+d
for d in data['domains']: src[d]=trees['domains']+'/'+d
for d,s in sorted(src.items()):
    row=[]
    for k in ('claude','plugin','agents'):
        p=trees[k]+'/'+d+'/SKILL.md'
        row.append(k+':'+('same' if os.path.exists(p) and h(p)==h(s+'/SKILL.md') else ('DIFF' if os.path.exists(p) else 'absent')))
    print(d,row)
# similarity within descriptions of the union of distinct names (strip ak-/ck-)
def tok(s): return set(re.findall(r'[a-z0-9]{3,}',s.lower()))
items={}
for k in ('claude','user'):
    for d,x in data[k].items():
        items[k+':'+d]=tok(x['desc'])
pairs=[]
keys=[k for k in items if not k.startswith('claude:fgos')]
for a,b in itertools.combinations(keys,2):
    na=a.split(':')[1].replace('ak-','').replace('ck-',''); nb=b.split(':')[1].replace('ak-','').replace('ck-','')
    if na==nb: continue  # same-name twins handled above
    A,B=items[a],items[b]
    if not A or not B: continue
    j=len(A&B)/len(A|B)
    pairs.append((j,a,b))
pairs.sort(reverse=True)
print('\nTop distinct-name description pairs (Jaccard):')
for j,a,b in pairs[:25]: print(f'{j:.2f} {a} <> {b}')
# fgos / fgOS: in-tree near-dups
fg=[(d,tok(x['desc'])) for d,x in data['plugin'].items()]
pp=[]
for (a,A),(b,B) in itertools.combinations(fg,2):
    if A and B: pp.append((len(A&B)/len(A|B),a,b))
pp.sort(reverse=True)
print('\nplugin fgOS top pairs:')
for j,a,b in pp[:12]: print(f'{j:.2f} {a} <> {b}')
# twin pairs claude ak-X vs user X: desc identical?
same=diff=0
for d in data['claude']:
    if d.startswith('ak-'):
        n=d[3:]; u=data['user'].get(n) or data['user'].get('ck-'+n)
        if u:
            if u['desc']==data['claude'][d]['desc']: same+=1
            else: diff+=1
print('\nak-X vs unprefixed twin: identical desc',same,'differ',diff)
json.dump({k:{d:x['desc'] for d,x in v.items()} for k,v in data.items()},open(R+'/plans/reports/harness-investigation-261006/skill-descs.json','w'))
