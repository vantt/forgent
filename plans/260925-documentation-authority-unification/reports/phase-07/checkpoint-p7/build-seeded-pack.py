import json,subprocess,hashlib,random,re,glob,os,copy
REPO='/home/vantt/projects/forgentX-s8-review'
R='plans/260925-documentation-authority-unification/reports/phase-07/'
SEED=730291846
rng=random.Random(SEED)
def git(c,path):
    return subprocess.check_output(['git','-C',REPO,'show',f'{c}:{path}'])
def lines(c,path): return git(c,path).decode().split('\n')
def sha(s): return hashlib.sha256(s.encode()).hexdigest()
def J(p): return json.load(open(f'{REPO}/{R}{p}'))
def slug(h):
    h=re.sub(r'^#+\s*','',h).strip().lower()
    h=re.sub(r'[^\w\s-]','',h); return re.sub(r'\s+','-',h)
CC='e6b7efeec'; HEAD='681a86005'
pk='review-input-step-09-package-02/'
# rebind pools
def entries(parts,hs):
    out=[]
    for n in parts:
        d=json.load(open(f'{REPO}/{R}{pk}part-{n:03d}.json'))
        out+= [dict(e,_part=f'part-{n:03d}.json') for e in d['entries'] if e['homogeneousSet']==hs]
    return out
unh=entries(range(6,15),'current-unheaded-block-candidate')
hed=entries([19,20],'current-heading-candidate')
def ok_unh(e):
    t=e['tuple']; L=lines(CC,e['path']); return sha('\n'.join(L[t[3]-1:t[4]]))==t[5]
def ok_hed(e):
    t=e['tuple']; L=lines(CC,e['path']); return slug(L[t[3]-1])==t[2] and t[2]==e['native']['sourceAnchor']
unh=[e for e in unh if ok_unh(e)]; hed=[e for e in hed if ok_hed(e)]
print(len(unh),len(hed))
dr_unh=rng.sample(unh,8); dr_hed=rng.sample(hed,6)
# alignment rows
al=J('step-05-authority-alignment.json')['rows']
def ok_al(r):
    try: return hashlib.sha256(git(HEAD,r['statementPath'])).hexdigest()==r['statementFileSha256'] and all(hashlib.sha256(git(HEAD,x['ref'].split(':')[0])).hexdigest()==x['fileSha256'] for x in r['evidence'] if not x['ref'].split(':')[0].endswith('/'))
    except Exception: return False
alp=[r for r in al if r['alignment'] in('aligned','doc-fix') and r['evidence'] and ok_al(r)]
print('al pool',len(alp))
dr_al=rng.sample(alp,4)
m3=J('step-03-contract-boundary-matrix.json')['rows']
byid={r['id']:r for r in m3}
dr_m3=[byid[i] for i in ['S3-02','S3-04','S3-07','S3-11']]
# routing
p36=json.load(open(f'{REPO}/{R}{pk}part-036.json'))['entries']
def ok_rt(e):
    if e['kind']!='routing-binding': return False
    b=e['binding']; s=b['source']
    if sha(lines(HEAD,s['path'])[s['selector']['line']-1])!=s['digest']: return False
    return True
rt=[e for e in p36 if ok_rt(e)]
print('rt',len(rt))
dr_rt=rng.sample(rt,3)
ac=json.load(open(f'{REPO}/{R}{pk}part-122.json'))['entries']
ac=[e for e in ac if e['row']['after'] and 'expectedDigest' in e['row']['after'] and hashlib.sha256(git(HEAD,e['row']['path'])).hexdigest()==e['row']['after']['expectedDigest']]
dr_ac=rng.sample(ac,2)
a34=J('step-05-a34-preservation.json')['rows']
def ok_a34(r):
    try:
        d=json.loads(git(HEAD,r['residualFile']))
        def f(o):
            if isinstance(o,dict):
                if o.get('claimId')==r['residualRecordClaimId'] and 'residualText' in o: return o
                for v in o.values():
                    x=f(v)
                    if x: return x
            elif isinstance(o,list):
                for v in o:
                    x=f(v)
                    if x: return x
        rec=f(d); return rec is not None and sha(rec['residualText'])==r['residualPayloadSha256'] and rec['residualText']==r['verbatimPayload']
    except Exception: return False
a34=[r for r in a34 if ok_a34(r)]
print('a34 pool',len(a34))
dr_a34=rng.sample(a34,3)
print([r['rowId'] for r in dr_a34])

records=[]; key_mut={}
def sh(s): return s
def rebind_rec(e,mut=None):
    t=e['tuple']; path=e['path']; anchor=t[2]; dig=t[5]
    claim={'entry':e['entry'],'claimId':e['native']['claimId'],'sourcePath':path,'unitKind':t[1],'sourceAnchor':anchor,'lines':[t[3],t[4]],'sourceUnitDigest':dig,'contentCommit':'e6b7efeec','disposition':'native claim carried; rebind to current unit, reviewStatus pending'}
    cmds=[f'git show {CC}:{path} | sed -n \'{t[3]},{t[4]}p\' | perl -pe \'chomp if eof\' | sha256sum   # must equal sourceUnitDigest']
    if t[1]=='heading':
        cmds=[f'git show {HEAD}:{R}{pk}{e["_part"]} | jq -c --arg e {e["entry"]} \'.entries[]|select(.entry==$e)|[.path,.tuple[2],.tuple[3],.tuple[5],.native.sourceAnchor,.native.sourceUnitDigest]\'   # index row: digest/anchor of this entry (heading unit digests come from the production extractor and are not shell-reproducible)',f'git show {CC}:{path} | sed -n \'{t[3]}p\'   # heading text; its GitHub-style slug must equal sourceAnchor']
    else:
        cmds.append(f'git show {CC}:{path} | sed -n \'{t[3]},{t[4]}p\'   # block must carry no heading line; anchor is the nth unheaded block of the file')
    return claim,cmds
def hexmut(h):
    i=17; c=h[i]; n='0' if c!='0' else '1'; return h[:i]+n+h[i+1:]
mut_a=rng.choice(range(8)); mut_b=rng.choice(range(6)); mut_e=rng.choice(range(3))
def add(cat,claim,cmds,title,mutinfo=None):
    records.append({'cat':cat,'title':title,'claim':claim,'cmds':cmds,'mut':mutinfo,'ids':title})
for i,e in enumerate(dr_unh):
    c,cm=rebind_rec(e); mi=None
    if i==mut_a:
        o=c['sourceUnitDigest']; c['sourceUnitDigest']=hexmut(o); mi={'kind':'a','field':'sourceUnitDigest','original':o,'mutated':c['sourceUnitDigest']}
    add('rebind',c,cm,e['entry'],mi)
for i,e in enumerate(dr_hed):
    c,cm=rebind_rec(e); mi=None
    if i==mut_b:
        o=c['sourceAnchor']; m=re.sub(r'^(\d+)',lambda x:str(int(x.group(1))+1),o) if re.match(r'^\d+',o) else 'x-'+o
        c['sourceAnchor']=m; mi={'kind':'b','field':'sourceAnchor','original':o,'mutated':m}
    add('rebind',c,cm,e['entry'],mi)
for r in dr_al:
    claim={k:r[k] for k in ['id','authorityKind','statement','statementPath','statementFileSha256','alignment','alignmentMeaning','evidence','owner','route','risk']}
    cmds=[f'git show {HEAD}:{r["statementPath"]} | sha256sum   # must equal statementFileSha256']
    for x in r['evidence']:
        pth=x['ref'].split(':')[0]; cmds.append(f'git show {HEAD}:{pth} | sha256sum   # must equal evidence fileSha256 {x["fileSha256"][:12]}...')
        if ':' in x['ref']:
            for span in x['ref'].split(':',1)[1].split(','):
                a,_,b=span.partition('-'); cmds.append(f'git show {HEAD}:{pth} | sed -n \'{a},{b or a}p\'   # cited span')
    add('alignment',claim,cmds,r['id'])
for r in dr_m3:
    claim={k:r[k] for k in ['id','producer','consumers','contractId','version','payloadTransport','compatibilityFailure','implementationEvidence','owner','authorities','candidateSource','status']}
    cmds=[]
    for x in r['implementationEvidence']:
        pth=x.split(':')[0]
        if ':' in x:
            for span in x.split(':',1)[1].split(','):
                a,_,b=span.partition('-'); cmds.append(f'git show {HEAD}:{pth} | sed -n \'{a},{b or a}p\'')
        else: cmds.append(f'git show {HEAD}:{pth} | head -40')
    cmds.append(f'git show {HEAD}:docs/platform/architecture-map.md | sed -n 444,452p   # contract registry rows: id, boundary, state, defining doc')
    cmds.append(f'git show {HEAD}:{r["candidateSource"]} | grep -n -i "Registry identity\\|CTR0"')
    mi=None
    if r['id']=='S3-02':
        o=claim['payloadTransport']; m='operation identity, TaskSpec, Skill, Role, policy hints; payload carries a `version` field validated when the step definition is loaded'
        claim['payloadTransport']=m; mi={'kind':'d','field':'payloadTransport','original':o,'mutated':m}
    if r['id']=='S3-07':
        o=claim['implementationEvidence'][0]; m=o.replace(':5',':45'); claim['implementationEvidence'][0]=m
        cmds[0]=cmds[0].replace("'5p'","'45p'")
        mi={'kind':'c','field':'implementationEvidence[0]','original':o,'mutated':m}
    if r['id']=='S3-11':
        o=claim['contractId']; claim['contractId']='CTR004'; mi={'kind':'f','field':'contractId','original':o,'mutated':'CTR004'}
    add('contract',claim,cmds,r['id'],mi)
for e in dr_rt:
    b=e['binding']; s=b['source']; t=b['target']
    claim={'entry':e['entry'],'rowId':b['rowId'],'source':s,'target':t,'route':b.get('route')}
    cmds=[f'git show {HEAD}:{s["path"]} | sed -n \'{s["selector"]["line"]}p\' | perl -pe \'chomp if eof\' | sha256sum   # must equal source.digest, and the line must equal source.content',
          f'git show {CC}:{t["path"]} | sed -n \'{t["range"][0]},{t["range"][1]}p\' | perl -pe \'chomp if eof\' | sha256sum   # target.digest (if range given)' if t.get('range') else f'git show {CC}:{t["path"]} | sed -n \'{t["selector"].get("line",1)}p\'   # target location']
    add('routing',claim,cmds,e['entry'])
for e in dr_ac:
    row=e['row']; claim={'entry':e['entry'],'path':row['path'],'after':row['after'],'mainCommits':row['mainCommits']}
    cmds=[f'git show {HEAD}:{row["path"]} | sha256sum   # must equal after.expectedDigest']+[f'git show -s --format="%H %s" {c.split()[0]}   # cited main commit must exist with this subject' for c in row['mainCommits']]
    add('accounting',claim,cmds,e['entry'])
for i,r in enumerate(dr_a34):
    claim={k:r[k] for k in ['rowId','claimId','sourcePath','sourceUnitDigestAtReviewedDecision','targetOwner','targetAnchor','residualFile','residualFileSha256','residualPayloadSha256','verbatimPayload','owner','status']}
    cmds=[f'git show {HEAD}:{r["residualFile"]} | sha256sum   # must equal residualFileSha256',
          f'git show {HEAD}:{r["residualFile"]} | jq -j --arg c {r["claimId"]} \'.. | objects | select(.claimId==$c and has("residualText")) | .residualText\' | sha256sum   # must equal residualPayloadSha256',
          f'git show {HEAD}:{r["residualFile"]} | jq -r --arg c {r["claimId"]} \'.. | objects | select(.claimId==$c and has("residualText")) | .residualText\'   # verbatimPayload must equal this text exactly']
    mi=None
    if i==mut_e:
        o=r['verbatimPayload']; w=o.split(' ')
        k=len(w)//2
        while not (w[k].isalpha() and w[k+1].isalpha() and w[k]!=w[k+1]): k+=1
        w[k],w[k+1]=w[k+1],w[k]; m=' '.join(w); claim['verbatimPayload']=m
        mi={'kind':'e','field':'verbatimPayload','original':o,'mutated':m}
    add('a34',claim,cmds,r['rowId'],mi)
assert len(records)==30
cnt={}
for r in records: cnt[r['cat']]=cnt.get(r['cat'],0)+1
print(cnt)
rng.shuffle(records)
out=['# Phase 7 sensitivity pack (30 records)\n','Review each record independently against the repository at commit `681a86005` (HEAD of the read-only checkout at '+REPO+') or `e6b7efeec` as the commands state. Each record shows the claim as written and the commands a reviewer would run. Report, per record, VERIFIED or DEFECT with the exact evidence. Do not assume any record is correct or defective.\n']
for n,r in enumerate(records,1):
    out.append(f'## Record {n:02d}  ({r["cat"]}: {r["title"]})\n')
    out.append('Claim:\n```json\n'+json.dumps(r['claim'],indent=1,ensure_ascii=False)+'\n```\n')
    out.append('Verify with (run from the repo root):\n```sh\n'+'\n'.join(r['cmds'])+'\n```\n')
open('/tmp/claude-1000/-home-vantt-projects-forgentX/a4954387-fafa-46d2-911f-4ea15b20d08d/scratchpad/p7-checkpoint/pack-blind.md','w').write('\n'.join(out))
muts=[{'record':n,'id':r['title'],**r['mut']} for n,r in enumerate(records,1) if r['mut']]
key={'seed':SEED,'method':'random.Random(seed); sample per pool; S3-02,S3-04,S3-07,S3-11 chosen deliberately; shuffled with same rng','drawnIds':[{'record':n,'cat':r['cat'],'id':r['title']} for n,r in enumerate(records,1)],'categoryCounts':cnt,'mutations':muts}
json.dump(key,open('/tmp/claude-1000/-home-vantt-projects-forgentX/a4954387-fafa-46d2-911f-4ea15b20d08d/scratchpad/p7-checkpoint-key/key.json','w'),indent=1,ensure_ascii=False)
print(len(muts))
